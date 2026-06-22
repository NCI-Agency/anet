# Deploying the ANET AI stack

Three services power the chat assistant on top of ANET. Two of them ship as
containers via the repo-root `docker-compose.yaml`; the third (AssistantService)
is installed natively from its own Linux drop because that's how its upstream
publishes releases.

| Service | Port | Where it comes from |
|---|---|---|
| **Apollo MCP** | 8000 | `ghcr.io/apollographql/apollo-mcp-server` (vendor image, container) |
| **mcp-ui** | 8001 | Built on the host from `./mcp-ui/Dockerfile` via `docker compose build` (container, no registry yet) |
| **AssistantService** | 7002 | `assistantservice-linux-x64-<BuildNumber>.tar.gz` (native systemd, **not** in compose) |

All three talk to ANET on `localhost:8080`. ANET itself is unchanged — its
systemd unit and config stay the same.

---

## Prerequisites on the target RHEL host

- Docker Engine 20.10+ (or Podman with `podman-docker`) and `docker compose` v2.
- ANET running locally with both `/graphql` (user-bearer) and `/graphqlWebService`
  (service-account) endpoints reachable on port 8080.
- A **Web Service Access Token** generated in ANET — Apollo MCP authenticates
  with this token. Generate one as an admin via the ANET Admin UI under
  "Web service access tokens".
- Outbound network access to `ghcr.io` (for the Apollo MCP vendor image).

---

## First-time setup

From the repo root on the target host:

```sh
# 1. Copy the env template and fill in real values:
cp .env.example .env
chmod 600 .env
vi .env   # set ANET_GRAPHQL_TOKEN and ANET_AGENT_API_KEY 

# 2. Build mcp-ui locally and start the stack:
docker compose up -d --build

# 3. Verify both containers are running:
docker compose ps
```

---

## Installing AssistantService (separate, native systemd)

AssistantService ships as its own Linux drop artifact. We install it
unattended via `install-assistantservice.sh` at the repo root — no prompts,
all values pulled from `.env` and `assistant-service-config/`.

```sh
# 1. Download the drop (Azure DevOps drop-linux artifact), then create the dir
#    and unpack into it:
mkdir -p /tmp/assistant-service-drop
tar -xzf assistantservice-linux-x64-*.tar.gz -C /tmp/assistant-service-drop

# 2. Ensure .env has ANET_AGENT_API_KEY (the DataScience-proxy key — already
#    required by mcp-ui; AssistantService reuses it). The installer sources
#    .env from the repo root automatically, so plain `sudo` is fine — no -E.
# 3. Run the installer; pass the unpacked dir as the first arg:
sudo ./install-assistantservice.sh /tmp/assistant-service-drop

# 4. Clean up the unpacked drop once the install finishes:
rm -rf /tmp/assistant-service-drop
```

What it does:

- `rsync`s the binaries into `/opt/assistantservice/`.
- Installs the systemd unit.
- Writes `appsettings.Production.json` from `.env` defaults — unless
  `assistant-service-config/appsettings.Production.json` exists, in which
  case that file wins.
- Writes `/etc/systemd/system/assistantservice.service.d/secrets.conf`
  (mode 600, root-only) from `.env`.
- Overlays every `*.json` in `assistant-service-config/` over the install
  dir, so MCP URLs, the prompt preamble, and any other pinned values
  survive future drops.
- `daemon-reload`, `enable`, `start`.

Chat UI: <https://localhost:7002/chat/index.html>. Tail logs with
`journalctl -u assistantservice -f -n 400`.

Re-run the script any time — it's idempotent. New drop? Unpack to a fresh dir
and re-run with that path; the overlay preserves your customizations.

---

## Common commands

```sh
# Pull a newer Apollo MCP vendor image (e.g. bumping APOLLO_MCP_TAG in .env):
docker compose pull apollo-mcp
docker compose up -d apollo-mcp

# Rebuild mcp-ui from local source (after a code change):
docker compose build mcp-ui
docker compose up -d mcp-ui

# Tail logs:
docker compose logs -f mcp-ui
docker compose logs -f apollo-mcp

# Stop everything:
docker compose down

# Start and stop the Assistant Service
sudo systemctl start assistantservice
sudo systemctl stop assistantservice
```

---

## Managed AssistantService configs

Files in `assistant-service-config/` (any `*.json`) are overlaid onto
`/opt/assistantservice/` after the install rsync, so customized values survive
binary upgrades. Common entries: `mcp-config.json`, `config.json`,
`appsettings.Production.json`. Secrets do **not** belong here — they're
sourced from `.env` and written to the systemd `secrets.conf` drop-in.

---

## Auth model — quick reference

- **Apollo MCP** runs as a service account. The `ANET_GRAPHQL_TOKEN` in `.env`
  is the Web Service Access Token configured in ANET. Calls go to
  `/graphqlWebService`, which requires the `SCOPE_GRAPHQL` authority. All Apollo
  MCP tool calls execute with this single identity — they do **not** scope to
  the end user.
- **mcp-ui** runs the per-user path. Its `anet_report_search_results` tool reads
  the caller's Keycloak bearer token (delivered through the iframe↔ANET
  postMessage handshake in `ChatBridge.tsx`) and uses it to call `/graphql`.
  Results respect the user's permissions.
- **AssistantService** itself doesn't talk to ANET GraphQL — it just routes
  tool calls to the two MCP servers above.
