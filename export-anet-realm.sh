#!/bin/bash
export PID=$$
exec /opt/jboss/keycloak/bin/standalone.sh \
  -Djboss.socket.binding.port-offset="$1" \
  -Dkeycloak.migration.action=export \
  -Dkeycloak.migration.provider=singleFile \
  -Dkeycloak.migration.realmName="$2" \
  -Dkeycloak.migration.file="$3" \
  -Dkeycloak.migration.strategy=OVERWRITE_EXISTING | \
{
  while read -r line
  do
    echo "$line"
    test "$line" = "${line% Export finished successfully}" || kill $PID
  done
}
