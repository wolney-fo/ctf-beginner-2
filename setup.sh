#!/usr/bin/env bash
#
# setup.sh - Provision the "SnapNest" CTF (Node/Express) on any Ubuntu/Debian host.
#
# Works on any server: a local VM, a spare box, or a cloud instance from any
# provider. Requires a systemd-based Linux with sudo access.
#
# Usage (as a user with sudo):
#   sudo apt-get update -y && sudo apt-get install -y git
#   git clone https://github.com/wolney-fo/ctf-beginner-2.git
#   cd ctf-beginner-2
#   sudo bash setup.sh
#
# This script does NOT print the flag values. They live only on the host (service
# environment variables + the notes file), so whoever provisions the box can play
# without spoilers.
#
set -euo pipefail

APP_USER="ctf"
APP_HOME="/opt/ctf-snapnest"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="/etc/ctf-snapnest.env"
SERVICE="/etc/systemd/system/ctf-snapnest.service"
PORT="${PORT:-80}"

if [[ $EUID -ne 0 ]]; then
  echo "Please run with sudo: sudo bash setup.sh" >&2
  exit 1
fi

echo "[*] Installing Node.js and system dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nodejs npm

echo "[*] Creating service user and application directory..."
id -u "$APP_USER" &>/dev/null || useradd --system --create-home --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_HOME"
cp -r "$REPO_DIR/app/." "$APP_HOME/"

echo "[*] Installing npm packages..."
( cd "$APP_HOME" && npm install --omit=dev --no-audit --no-fund )

echo "[*] Generating random flags (values are not printed)..."
gen() { head -c 18 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 12; }
RECON="FLAG{recon_$(gen)}"
UPLOAD="FLAG{upload_$(gen)}"
COOKIE="FLAG{cookie_$(gen)}"
IDOR="FLAG{idor_$(gen)}"
API="FLAG{api_$(gen)}"
TRAVERSAL="FLAG{lfi_$(gen)}"

# App flags go in a protected EnvironmentFile (root:root 600), outside the web
# root (not reachable by the app's file reader).
cat > "$ENV_FILE" <<EOF
FLAG_RECON=$RECON
FLAG_UPLOAD=$UPLOAD
FLAG_COOKIE=$COOKIE
FLAG_IDOR=$IDOR
FLAG_API=$API
PORT=$PORT
EOF
chmod 600 "$ENV_FILE"
chown root:root "$ENV_FILE"

# The path-traversal flag lives in a notes file in the project root.
cat > "$APP_HOME/notes.txt" <<EOF
SnapNest - internal release notes (v1.4.0)
------------------------------------------
- migrate photo storage to external storage
- review upload size limits
- rotate keys before launch

maintenance token: $TRAVERSAL
EOF

echo "[*] Fixing permissions..."
chown -R "$APP_USER:$APP_USER" "$APP_HOME"

echo "[*] Installing systemd service..."
cat > "$SERVICE" <<EOF
[Unit]
Description=CTF SnapNest (Node)
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_HOME
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node $APP_HOME/server.js
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ctf-snapnest >/dev/null 2>&1
systemctl restart ctf-snapnest

sleep 2
if systemctl is-active --quiet ctf-snapnest; then
  IP=$(curl -s --max-time 5 ifconfig.me || echo "YOUR_SERVER_IP")
  echo ""
  echo "======================================================"
  echo " SnapNest is up!  Visit:  http://$IP/"
  echo " Service: systemctl status ctf-snapnest"
  echo " (flags live in $ENV_FILE and $APP_HOME/notes.txt)"
  echo "======================================================"
else
  echo "[!] The service did not start. Check: journalctl -u ctf-snapnest -n 50" >&2
  exit 1
fi
