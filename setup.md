# Deployment

SnapNest is lightweight (Node.js) and runs on any Linux host with `systemd` and
`sudo` — a local VM, a spare box, or a cloud instance from any provider (AWS,
GCP, Azure, DigitalOcean, Hetzner, ...). Nothing here is tied to a specific cloud.

## Requirements

- A Linux host with **Ubuntu 22.04/24.04** (or any Debian-based, systemd distro).
- **Inbound TCP 80** open to whoever will play (and **22** for your own SSH).
- `sudo` access.

## One-command setup (recommended)

SSH into the host and run:

```bash
sudo apt-get update -y && sudo apt-get install -y git
git clone https://github.com/wolney-fo/ctf-beginner-2.git
cd ctf-beginner-2
sudo bash setup.sh
```

The script installs Node.js, generates **random flags** (without printing them),
starts the app as a systemd service, and prints the URL when it finishes.

Then open `http://<SERVER_IP>/` and share the link with your participants.

> Want it on a different port? Run `sudo PORT=8080 bash setup.sh`.

## Service management

```bash
systemctl status ctf-snapnest       # is it running?
sudo systemctl restart ctf-snapnest # restart
journalctl -u ctf-snapnest -n 50    # logs, if something goes wrong
```

To **regenerate the flags** from scratch, run `sudo bash setup.sh` again.

## Local development (no service)

```bash
cd app
npm install
FLAG_RECON="FLAG{recon_dev}" FLAG_UPLOAD="FLAG{upload_dev}" \
FLAG_COOKIE="FLAG{cookie_dev}" FLAG_IDOR="FLAG{idor_dev}" \
FLAG_API="FLAG{api_dev}" PORT=8090 node server.js
# the path-traversal flag is read from a file, so create one for local runs:
#   echo "maintenance token: FLAG{lfi_dev}" > notes.txt
# serves on http://localhost:8090
```

## Teardown

```bash
sudo systemctl disable --now ctf-snapnest
sudo rm -f /etc/systemd/system/ctf-snapnest.service /etc/ctf-snapnest.env
sudo rm -rf /opt/ctf-snapnest
sudo systemctl daemon-reload
```

On a cloud provider, simply deleting/terminating the instance is enough.
