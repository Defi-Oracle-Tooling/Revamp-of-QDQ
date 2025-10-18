#!/usr/bin/env bash
set -euo pipefail

# Initialize and update all git submodules recursively.
# Safe to run multiple times; will not overwrite local changes without warning.
# Usage:
#   ./scripts/init-submodules.sh            # standard init/update
#   FORCE_REINIT=1 ./scripts/init-submodules.sh  # forces deinit + fresh init

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${FORCE_REINIT:-}" == "1" ]]; then
  echo "[submodules] Force re-init requested. De-initializing..."
  git submodule deinit -f --all || true
fi

echo "[submodules] Syncing submodule URLs from .gitmodules..."
git submodule sync --recursive

echo "[submodules] Initializing + updating (this may take a moment)..."
git submodule update --init --recursive --progress

echo "[submodules] Setting submodules to shallow clones (fetch depth=1) where possible..."
# Optional shallow optimization; ignore failures silently.
for sm in $(git config --file .gitmodules --get-regexp path | awk '{print $2}'); do
  if [[ -d "$sm/.git" ]]; then
    (cd "$sm" && git fetch --depth=1 || true)
  fi
done

echo "[submodules] Completed initialization."
