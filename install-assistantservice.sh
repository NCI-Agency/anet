#!/usr/bin/env bash
# Unattended AssistantService install.
#
# Equivalent of `assistant-service/install.sh` but driven by env vars instead
# of interactive prompts, and operates on an already-unpacked drop directory.
# Skips the optional Qdrant / MinIO services.
#
# Usage:
#   sudo ./install-assistantservice.sh [SRC_DIR]
#
# SRC_DIR  Path to the unpacked AssistantService drop. Defaults to
#          ./assistant-service relative to the script.
#
# Reads from the environment (sourced from ./.env if present):
#   ANET_AGENT_API_KEY   DataScience proxy API key (REQUIRED)
#
# Everything else mirrors the defaults in assistant-service/install.sh.

set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run as root: sudo $0 [SRC_DIR]" >&2; exit 1; }

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="${1:-${REPO_ROOT}/assistant-service}"
# Resolve to absolute path so log messages are unambiguous.
SRC_DIR="$(cd "$SRC_DIR" 2>/dev/null && pwd || echo "$SRC_DIR")"
OVERLAY_DIR="${REPO_ROOT}/assistant-service-config"
INSTALL_DIR="/opt/assistantservice"
SERVICE_NAME="assistantservice"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SECRETS_DIR="/etc/systemd/system/${SERVICE_NAME}.service.d"
SECRETS_FILE="${SECRETS_DIR}/secrets.conf"
CONFIG_FILE="${INSTALL_DIR}/appsettings.Production.json"

[ -d "$SRC_DIR" ] || { echo "Source dir not found: $SRC_DIR" >&2; exit 1; }
[ -f "$SRC_DIR/AssistantService" ] || { echo "Missing $SRC_DIR/AssistantService binary" >&2; exit 1; }
[ -f "$SRC_DIR/assistantservice.service" ] || { echo "Missing $SRC_DIR/assistantservice.service" >&2; exit 1; }

echo "Source: $SRC_DIR"

# Pull secrets from .env if present so we don't have to export them by hand.
if [ -f "${REPO_ROOT}/.env" ]; then
    set -a; . "${REPO_ROOT}/.env"; set +a
fi

# Non-secret defaults aligned with the AssistantService docs (Linux installer
# prompts). Safe to override via .env if a deploy needs a non-default value.
#
# Note: We don't install Qdrant or MinIO with this deployment, so the
# Qdrant/MinIO settings below are unused at runtime — AssistantService just
# disables the document-library features when those endpoints aren't reachable.
# They're kept here so the config file is well-formed.
: "${DS_PROXY:=http://ai2.datascienceai.nsf/llm}"
: "${QDRANT_CONN:=localhost:6333}"
: "${QDRANT_EMBED_SIZE:=1024}"
: "${PORT:=7002}"
: "${AZURE_ENDPOINT:=https://teodo-m91b9nxu-eastus2.cognitiveservices.azure.com}"
: "${AZURE_API_VERSION:=2024-12-01-preview}"
: "${EMBEDDING_MODEL:=mxbai-embed-large-v1}"
: "${MODELS_CSV:=qwen, llama-3.3-70b-instruct-awq, gpt-4o-dsai, openai.gpt-oss-120b-1:0}"
: "${MINIO_ENDPOINT:=localhost:8888}"
: "${MINIO_BUCKET:=chat-uploads}"
: "${MINIO_SSL:=false}"

# The DataScience-proxy API key. mcp-ui calls it ANET_AGENT_API_KEY in .env;
# AssistantService expects it as AIProxyKey in the systemd secrets drop-in.
[ -n "${ANET_AGENT_API_KEY:-}" ] || echo "WARN: ANET_AGENT_API_KEY is empty; the chat won't reach the DataScience proxy." >&2

# MinIO credentials. The Assistant controller has IMinioClient as a constructor
# dep, so DI registration must succeed even though we don't actually run MinIO.
# Placeholder values are fine; any call that *uses* MinIO will fail at runtime.
: "${MINIO_ACCESS:=minioadmin}"
: "${MINIO_SECRET:=minioadmin}"

json_esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

csv_to_json_array() {
    local csv="$1" result="[" first=true item
    while IFS= read -rd ',' item || { item="$item"; [ -n "$item" ]; }; do
        item=$(printf '%s' "$item" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        [ -z "$item" ] && continue
        [ "$first" = "true" ] && first=false || result+=", "
        result+="\"$(json_esc "$item")\""
    done <<< "${csv},"
    printf '%s' "${result}]"
}

if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "Stopping existing $SERVICE_NAME..."
    systemctl stop "$SERVICE_NAME"
fi

echo "Copying $SRC_DIR -> $INSTALL_DIR"
mkdir -p "$INSTALL_DIR/logs"
# -a preserves perms, --delete drops stale files from prior installs,
# --force lets --delete remove non-empty dirs (e.g. leftover .git from tests).
rsync -a --delete --force --exclude logs/ "$SRC_DIR"/ "$INSTALL_DIR"/
chmod +x "$INSTALL_DIR/AssistantService"
chown -R root:root "$INSTALL_DIR"
chmod 750 "$INSTALL_DIR"
chmod 640 "$INSTALL_DIR"/*.json 2>/dev/null || true

echo "Installing systemd unit: $SERVICE_FILE"
cp "$INSTALL_DIR/assistantservice.service" "$SERVICE_FILE"
chmod 644 "$SERVICE_FILE"

if [ -f "${OVERLAY_DIR}/appsettings.Production.json" ]; then
    echo "Skipping generated $CONFIG_FILE — overlay copy will replace it."
else
    echo "Writing $CONFIG_FILE"
    cat > "$CONFIG_FILE" <<EOF
{
  "ConnectionStrings": {
    "DatascienceProxy": "$(json_esc "$DS_PROXY")",
    "QdrantConnection": "$(json_esc "$QDRANT_CONN")",
    "QdrantEmbeddingSize": "$(json_esc "$QDRANT_EMBED_SIZE")"
  },
  "DataScienceEmbeddingModel": "$(json_esc "$EMBEDDING_MODEL")",
  "DataScienceModels": { "Models": $(csv_to_json_array "$MODELS_CSV") },
  "Web": { "Port": $PORT },
  "Minio": {
    "Endpoint": "$(json_esc "$MINIO_ENDPOINT")",
    "Bucket": "$(json_esc "$MINIO_BUCKET")",
    "WithSSL": $MINIO_SSL
  },
  "AzureOpenAI": {
    "Endpoint": "$(json_esc "$AZURE_ENDPOINT")",
    "ApiVersion": "$(json_esc "$AZURE_API_VERSION")"
  }
}
EOF
    chmod 640 "$CONFIG_FILE"
    chown root:root "$CONFIG_FILE"
fi

echo "Writing $SECRETS_FILE (root-only)"
mkdir -p "$SECRETS_DIR"
cat > "$SECRETS_FILE" <<EOF
[Service]
Environment="AIProxyKey=${ANET_AGENT_API_KEY:-}"
Environment="Minio__AccessKey=${MINIO_ACCESS}"
Environment="Minio__SecretKey=${MINIO_SECRET}"
EOF
chmod 600 "$SECRETS_FILE"
chown root:root "$SECRETS_FILE"

# Overlay any committed configs on top of what the drop shipped, so our
# pinned values (MCP URLs, prompt preamble, etc.) survive every upgrade.
if [ -d "$OVERLAY_DIR" ]; then
    shopt -s nullglob
    overlay_files=("$OVERLAY_DIR"/*.json)
    shopt -u nullglob
    if [ "${#overlay_files[@]}" -gt 0 ]; then
        echo "Overlaying ${#overlay_files[@]} config file(s) from $OVERLAY_DIR -> $INSTALL_DIR"
        for f in "${overlay_files[@]}"; do
            target="${INSTALL_DIR}/$(basename "$f")"
            cp "$f" "$target"
            chmod 640 "$target"
            chown root:root "$target"
            echo "  $(basename "$f")"
        done
    fi
fi

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

echo
echo "AssistantService installed and started."
echo "  Status : systemctl status $SERVICE_NAME"
echo "  Logs   : journalctl -u $SERVICE_NAME -f"
echo "  Web UI : http://localhost:${PORT}/chat/index.html"
