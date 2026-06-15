#!/bin/sh
set -e

: "${ANET_GRAPHQL_TOKEN:?must be set (Web Service Access Token from anet config)}"
: "${ANET_GRAPHQL_ENDPOINT:=http://host.docker.internal:8080/graphqlWebService}"
export ANET_GRAPHQL_TOKEN ANET_GRAPHQL_ENDPOINT

# Render the template at runtime so secrets stay out of the committed YAML.
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
envsubst < "$PWD/apollo-mcp-config.yaml" > "$TMPDIR/config.yaml"

docker run \
  -it --rm \
  --name apollo-mcp-server \
  --network host \
  --add-host host.docker.internal:host-gateway \
  -p 8000:8000 \
  -v "$TMPDIR/config.yaml:/config.yaml" \
  -v "$PWD"/src/test/resources:/data \
  --pull always \
  ghcr.io/apollographql/apollo-mcp-server:latest /config.yaml