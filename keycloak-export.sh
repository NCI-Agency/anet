#!/bin/sh

KEYCLOAK_SERVER_PATH="/srv/apps/keycloak-10.0.1"
KEYCLOAK_PORT="9080"

"$KEYCLOAK_SERVER_PATH"/bin/standalone.sh \
  -Djboss.http.port="$KEYCLOAK_PORT" \
  -Dkeycloak.migration.action=export 
  -Dkeycloak.migration.provider=singleFile 
  -Dkeycloak.migration.realmName=ANET-Realm 
  -Dkeycloak.migration.file=ANET_Realm-export.json
