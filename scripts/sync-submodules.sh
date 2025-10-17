#!/usr/bin/env bash
set -euo pipefail

# Synchronize git submodules: init, update, and prune stale module dirs.
# Usage: ./scripts/sync-submodules.sh [--prune]

PRUNE=false
if [[ "${1:-}" == "--prune" ]]; then
  PRUNE=true
fi

echo "[sync-submodules] Ensuring submodules initialized (recursive)..."
git submodule update --init --recursive

echo "[sync-submodules] Updating submodules to recorded commits..."
git submodule update --recursive --remote || echo "[sync-submodules] Remote update skipped (using recorded commits)."

if [[ "$PRUNE" == true ]]; then
  echo "[sync-submodules] Pruning stale submodule directories..."
  # Remove modules that are no longer tracked in .gitmodules
  for m in $(ls .git/modules 2>/dev/null || true); do
    if ! grep -q "path = $m" .gitmodules 2>/dev/null; then
      echo "[sync-submodules] Removing stale module: $m"
      rm -rf ".git/modules/$m"
    fi
  done
fi

echo "[sync-submodules] Done."