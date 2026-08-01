#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:-root@172.16.2.11}"
REMOTE_DIR="/opt/iobroker/node_modules/iobroker.luxtronik2ws"

echo "Deploy nach ${REMOTE_HOST}..."

rsync -av --delete --exclude '.git/' --exclude 'node_modules/' \
    "${SCRIPT_DIR}/" \
    "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Abhängigkeiten installieren und Adapter neu starten..."

ssh "${REMOTE_HOST}" "
    chown -R iobroker:iobroker '${REMOTE_DIR}' &&
    runuser -u iobroker -- npm --prefix '${REMOTE_DIR}' install --omit=dev &&
    runuser -u iobroker -- iobroker upload luxtronik2ws &&
    runuser -u iobroker -- iobroker restart luxtronik2ws.0
"

echo "Deployment abgeschlossen."
