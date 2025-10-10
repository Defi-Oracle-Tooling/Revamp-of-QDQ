#!/usr/bin/env bash
set -euo pipefail
echo "[perm] Setting executable bits for scripts" 
chmod +x scripts/*.sh || true
echo "[perm] Running shellcheck (if installed)" 
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck scripts/*.sh || true
else
  echo "shellcheck not installed; skipping"
fi
echo "[perm] Done"