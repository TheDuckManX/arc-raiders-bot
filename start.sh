#!/bin/bash
# Start ngrok tunnel and the Arc Raiders Bot server
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start ngrok in background
echo "Starting ngrok..."
ngrok http 3000 > /tmp/ngrok.log 2>&1 &
sleep 2

# Start the Node server
echo "Starting Arc Raiders Bot server..."
cd "$SCRIPT_DIR"
node server.js > /tmp/arc-server.log 2>&1 &

echo "Server started. Logs: /tmp/arc-server.log"
echo "ngrok logs: /tmp/ngrok.log"
