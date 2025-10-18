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

echo "[sync-submodules] Updating submodules individually (graceful failures)..."

# Optional skip list (space separated names matching paths in .gitmodules)
SKIP_LIST=( )

should_skip() {
  local name="$1"
  for s in "${SKIP_LIST[@]}"; do
    [[ "$s" == "$name" ]] && return 0
  done
  return 1
}

git submodule foreach --recursive 'name=$(basename $path); if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then if name=$(basename $path); then :; fi; fi' >/dev/null 2>&1 || true

git config -f .gitmodules --get-regexp path | while read -r key subpath; do
  name="${subpath##*/}"
  if should_skip "$name"; then
    echo "[sync-submodules] Skipping $subpath"
    continue
  fi
  echo "[sync-submodules] Updating $subpath..."
  if git -C "$subpath" fetch --quiet; then
    # Attempt fast-forward to remote main (common convention); fallback to recorded commit
    if git -C "$subpath" rev-parse --verify origin/main >/dev/null 2>&1; then
      if git -C "$subpath" merge --ff-only origin/main >/dev/null 2>&1; then
        echo "[sync-submodules] $subpath fast-forwarded to origin/main"
      else
        echo "[sync-submodules] $subpath could not fast-forward (divergence); leaving recorded commit"
      fi
    else
      echo "[sync-submodules] origin/main not found for $subpath; using recorded commit"
    fi
  else
    echo "[sync-submodules] Fetch failed for $subpath; using recorded commit"
  fi
done

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