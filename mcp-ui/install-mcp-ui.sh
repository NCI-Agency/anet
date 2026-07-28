#!/usr/bin/env bash
# Unattended MCP UI installer.
#
# Usage:
#   sudo ./install-mcp-ui.sh [SRC_DIR]
#
# SRC_DIR  Path to the unpacked mcp-ui source. Defaults to:
#          ./mcp-ui relative to this script.

set -euo pipefail

[ "$(id -u)" -eq 0 ] || {
    echo "Run as root: sudo $0 [SRC_DIR]" >&2
    exit 1
}

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="${1:-${REPO_ROOT}/mcp-ui}"
SRC_DIR="$(cd "$SRC_DIR" 2>/dev/null && pwd || echo "$SRC_DIR")"

INSTALL_DIR="/opt/mcp-ui"

SERVICE_NAME="mcp-ui"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

SERVICE_USER="anet"
SERVICE_GROUP="anet"

NODE_BIN="/usr/bin/node"
NPM_BIN="/usr/bin/npm"

echo "Source: $SRC_DIR"
echo "Install: $INSTALL_DIR"
echo "Service: $SERVICE_NAME"
echo "User: ${SERVICE_USER}:${SERVICE_GROUP}"

[ -d "$SRC_DIR" ] || {
    echo "Source directory not found: $SRC_DIR" >&2
    exit 1
}

[ -f "$SRC_DIR/package.json" ] || {
    echo "Missing package.json in $SRC_DIR" >&2
    exit 1
}

[ -x "$NODE_BIN" ] || {
    echo "Missing Node.js at $NODE_BIN" >&2
    echo "Install a system-wide Node.js version (20.19+ or 22.x)." >&2
    exit 1
}

[ -x "$NPM_BIN" ] || {
    echo "Missing npm at $NPM_BIN" >&2
    exit 1
}

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    echo "Missing service user: $SERVICE_USER" >&2
    exit 1
fi

echo "Stopping service..."
systemctl stop "$SERVICE_NAME" 2>/dev/null || true


echo "Installing files..."
mkdir -p "$INSTALL_DIR"

rsync -a --delete \
    --exclude node_modules \
    "$SRC_DIR/" "$INSTALL_DIR/"


echo "Setting permissions..."
chown -R root:"$SERVICE_GROUP" "$INSTALL_DIR"
chmod 750 "$INSTALL_DIR"
chmod -R g+rX "$INSTALL_DIR"


echo "Installing npm dependencies..."
cd "$INSTALL_DIR"

sudo -u "$SERVICE_USER" "$NPM_BIN" ci


echo "Building MCP UI..."
sudo -u "$SERVICE_USER" "$NPM_BIN" run build


echo "Creating systemd service..."

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=MCP UI
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${INSTALL_DIR}
ExecStart=${NODE_BIN} ${INSTALL_DIR}/dist/main.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$SERVICE_FILE"
chown root:root "$SERVICE_FILE"


echo "Reloading systemd..."
systemctl daemon-reload

echo "Enabling service..."
systemctl enable "$SERVICE_NAME"

echo "Starting service..."
systemctl restart "$SERVICE_NAME"


echo
echo "MCP UI installed successfully."
echo
echo "  Install : $INSTALL_DIR"
echo "  Service : $SERVICE_NAME"
echo "  User    : ${SERVICE_USER}:${SERVICE_GROUP}"
echo
echo "Commands:"
echo "  systemctl status $SERVICE_NAME"
echo "  journalctl -u $SERVICE_NAME -f"
