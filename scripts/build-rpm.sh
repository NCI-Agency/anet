#!/usr/bin/env bash
set -euo pipefail

repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_dir"

if [[ ${1:-} == --help ]]; then
  cat <<'EOF'
Usage: scripts/build-rpm.sh [Gradle options]

Build ANET and its bundled runtime directly from this repository.
Requires an x86_64 Linux host, a UBI 9 compatible JDK 21 (e.g. Temurin),
and binutils. Outputs the RPM to build/distributions.
Set JAVA_HOME to select the JDK. Containers are used only for validation.
EOF
  exit 0
fi

if [[ $(uname -s) != Linux || $(uname -m) != x86_64 ]]; then
  echo "RPM packaging requires an x86_64 Linux host." >&2
  exit 1
fi
java_bin=${JAVA_HOME:+$JAVA_HOME/bin/}java
if ! "$java_bin" -version 2>&1 | grep -Eq '^(openjdk|java) version "21[.]'; then
  echo "Set JAVA_HOME to a UBI 9 compatible JDK 21 before packaging." >&2
  exit 1
fi

exec ./gradlew --no-daemon -PrpmDist=el9 distRpm "$@"
