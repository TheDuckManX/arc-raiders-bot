#!/bin/bash
# Check status of Arc Raiders Bot server and ngrok
set -euo pipefail

echo "=== Arc Raiders Bot Status ==="

# Check node process
if pgrep -f "node server.js" > /dev/null 2>&1; then
  echo "✅ Server: running"
else
  echo "❌ Server: not running"
fi

# Check ngrok process
if pgrep -f "ngrok" > /dev/null 2>&1; then
  echo "✅ ngrok: running"
else
  echo "❌ ngrok: not running"
fi

# Health check (unauthenticated endpoint)
echo ""
echo "=== Health Check ==="
HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null)
if [ -n "$HEALTH" ]; then
  echo "✅ HTTP response: $HEALTH"
else
  echo "❌ No response from http://localhost:3000/health"
fi
