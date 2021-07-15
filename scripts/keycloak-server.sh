#!/bin/sh

KEYCLOAK_SERVER_PATH="${KEYCLOAK_SERVER_PATH:-"/srv/apps/keycloak-11.0.2"}"
KEYCLOAK_PORT="${KEYCLOAK_PORT:-9080}"
KEYCLOAK_SSL_PORT="${KEYCLOAK_SSL_PORT:-9443}"

"$KEYCLOAK_SERVER_PATH"/bin/standalone.sh \
  -Djboss.http.port="$KEYCLOAK_PORT" \
  -Djboss.https.port="$KEYCLOAK_SSL_PORT"
