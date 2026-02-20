#!/bin/bash
# Download and configure ngrok for local development
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== ngrok Setup ==="

# Check if ngrok is already installed
if command -v ngrok &>/dev/null; then
  echo "✅ ngrok is already installed: $(ngrok version)"
else
  echo "Installing ngrok..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install ngrok/ngrok/ngrok
  else
    curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
      | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
      && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
      | sudo tee /etc/apt/sources.list.d/ngrok.list \
      && sudo apt update \
      && sudo apt install ngrok
  fi
fi

# Configure auth token from .env
if [ -f "$SCRIPT_DIR/.env" ]; then
  NGROK_TOKEN=$(grep -E '^NGROK_AUTH_TOKEN=' "$SCRIPT_DIR/.env" | sed 's/^NGROK_AUTH_TOKEN=//')
  if [ -n "$NGROK_TOKEN" ]; then
    ngrok config add-authtoken "$NGROK_TOKEN"
    echo "✅ ngrok auth token configured."
  else
    echo "⚠️  NGROK_AUTH_TOKEN not found in .env. Add it to enable persistent URLs."
  fi
else
  echo "⚠️  No .env file found. Copy .env.example to .env and fill in your values."
fi

echo "Done. Run ./start.sh to launch the server."
