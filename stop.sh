#!/bin/bash
# Stop the Arc Raiders Bot server and ngrok tunnel
set -euo pipefail

echo "Stopping Arc Raiders Bot server..."
pkill -f "node server.js" 2>/dev/null && echo "Server stopped." || echo "Server was not running."

echo "Stopping ngrok..."
pkill -f "ngrok" 2>/dev/null && echo "ngrok stopped." || echo "ngrok was not running."
