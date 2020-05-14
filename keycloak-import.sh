#!/bin/sh

KEYCLOAK_SERVER_PATH="/srv/apps/keycloak-10.0.1"
KEYCLOAK_PORT="9080"

"$KEYCLOAK_SERVER_PATH"/bin/standalone.sh \
  -Djboss.http.port="$KEYCLOAK_PORT" \
  -Dkeycloak.profile.feature.scripts=enabled \
  -Dkeycloak.profile.feature.upload_scripts=enabled \
  -Dkeycloak.migration.action=import \
  -Dkeycloak.migration.provider=singleFile \
  -Dkeycloak.migration.realmName=ANET-Realm \
  -Dkeycloak.migration.file=ANET-Realm-export.json  \
  -Dkeycloak.migration.strategy=OVERWRITE_EXISTING
