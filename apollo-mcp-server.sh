docker run \
  -it --rm \
  --name apollo-mcp-server \
  --network host \
  --add-host host.docker.internal:host-gateway \
  -p 8000:8000 \
  -v "$PWD"/apollo-mcp-config.yaml:/config.yaml \
  -v "$PWD"/src/test/resources:/data \
  --pull always \
  ghcr.io/apollographql/apollo-mcp-server:latest /config.yaml