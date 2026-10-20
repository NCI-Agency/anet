#!/usr/bin/env bash
# Run the two browser-test CI jobs locally, each with a fresh test database/server.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if curl --silent --connect-timeout 1 --header 'Accept: text/html' --output /dev/null http://localhost:8180/; then
  echo "Port 8180 is in use; stop the existing test server before running local CI." >&2
  exit 1
fi

# Use the same dedicated test database and ports as the CI jobs.
export ANET_DB_SERVER=localhost ANET_DB_NAME=testAnet
export ANET_DB_USERNAME=anetTestUser ANET_DB_PASSWORD=Test-P@ssw0rd
export ANET_DB_EXPOSED_PORT=5433 ANET_PORT=8180 ANET_ADMIN_PORT=8181
export ANET_DB_DROP=true SPRING_PROFILES_ACTIVE=test
export SERVER_URL=http://localhost:8180
unset TEST_PLAYWRIGHT_SUITE ANET_DICTIONARY

server_pid=
stop_server() {
  if [[ -n "$server_pid" ]]; then
    kill -- "-$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
    server_pid=
    for attempt in {1..60}; do
      if ! curl --silent --connect-timeout 1 --max-time 2 --header 'Accept: text/html' --output /dev/null http://localhost:8180/; then
        return
      fi
      sleep 1
    done
    echo "The test server did not release port 8180." >&2
    return 1
  fi
}
trap stop_server EXIT INT TERM

ensure_service() {
  local container=$1
  shift
  if docker container inspect "$container" >/dev/null 2>&1; then
    docker start "$container" >/dev/null
  else
    ./gradlew -PtestEnv "$@"
  fi
}

ensure_service anet-psql-test-server dockerCreateDB dockerStartDB
ensure_service anet-keycloak-server dockerConfigureKeycloak dockerStartKeycloak
ensure_service anet-fake-smtp-test-server dockerCreateFakeSmtpServer dockerStartFakeSmtpServer
./gradlew -PtestEnv buildClient
# On Linux, the CI installation command also installs browser system libraries.
if command -v apt-get >/dev/null 2>&1; then
  ./gradlew yarn_run_install-playwright
else
  ./gradlew yarn_run_install-playwright-browser
fi

for dictionary in anet-dictionary.yml testDictionaries/no-custom-fields.yml; do
  export ANET_DICTIONARY_NAME="$dictionary"
  name=${dictionary//\//_}
  mkdir -p client/build/local-ci/"$name"
  # setsid lets the trap stop Gradle and its application child together.
  setsid ./gradlew -PtestEnv run > "client/build/local-ci/$name/server.log" 2>&1 &
  server_pid=$!
  ready=false
  for attempt in {1..180}; do
    if ! kill -0 "$server_pid" 2>/dev/null; then
      cat "client/build/local-ci/$name/server.log"
      exit 1
    fi
    if grep --quiet 'Started AnetApplication in ' "client/build/local-ci/$name/server.log" &&
      curl --fail --silent --connect-timeout 1 --max-time 2 --header 'Accept: text/html' --output /dev/null http://localhost:8180/; then
      ready=true
      break
    fi
    sleep 1
  done
  if [[ "$ready" != true ]]; then
    cat "client/build/local-ci/$name/server.log"
    exit 1
  fi
  result=0
  if [[ "$dictionary" == anet-dictionary.yml ]]; then
    ./gradlew yarn_run_test-playwright-junit || result=$?
  else
    ./gradlew yarn_run_test-playwright-noCF-junit || result=$?
  fi
  for report in client/build/playwright-report client/build/test-results/playwright-artifacts; do
    if [[ -d "$report" ]]; then
      rm -rf "client/build/local-ci/$name/${report##*/}"
      cp -r "$report" "client/build/local-ci/$name/"
    fi
  done
  stop_server
  if [[ "$result" != 0 ]]; then
    exit "$result"
  fi
done
