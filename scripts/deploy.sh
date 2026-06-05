#!/bin/bash
# AC-4.5: Idempotent deploy script — safe to run twice
set -euo pipefail

echo "=== Deploy: $(date) ==="

git pull origin main
npm ci --omit=dev
npm run build
pm2 reload cross-border-agent --update-env

echo "=== Deploy complete: $(date) ==="
echo "Health: $(curl -s http://localhost:3000/api/health)"
