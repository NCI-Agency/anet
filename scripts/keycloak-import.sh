#!/bin/sh

KEYCLOAK_SERVER_PATH="${KEYCLOAK_SERVER_PATH:-"/srv/apps/keycloak-10.0.2"}"
KEYCLOAK_PORT="${KEYCLOAK_PORT:-9080}"
KEYCLOAK_SSL_PORT="${KEYCLOAK_SSL_PORT:-9443}"
REALM="${REALM:-"ANET-Realm"}"

"$KEYCLOAK_SERVER_PATH"/bin/standalone.sh \
  -Djboss.http.port="$KEYCLOAK_PORT" \
  -Djboss.https.port="$KEYCLOAK_SSL_PORT" \
  -Dkeycloak.profile.feature.scripts=enabled \
  -Dkeycloak.profile.feature.upload_scripts=enabled \
  -Dkeycloak.migration.action=import \
  -Dkeycloak.migration.provider=singleFile \
  -Dkeycloak.migration.realmName="$REALM" \
  -Dkeycloak.migration.file="$REALM"-export.json  \
  -Dkeycloak.migration.strategy=OVERWRITE_EXISTING
