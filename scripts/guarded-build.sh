#!/usr/bin/env bash
set -euo pipefail

# Guarded build: compiles core TypeScript, then optionally builds az-billing submodule if populated.
# Non-fatal if submodule missing or lacks TypeScript sources.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { echo "[guarded-build] $*" >&2; }

log "Starting core build (tsc)"
if ! npx tsc; then
  log "Core build failed"; exit 1; fi
log "Core build complete"

AZ_PATH="modules/infra/az-billing"
if [ -d "$AZ_PATH" ]; then
  entries=$(ls -1A "$AZ_PATH" | wc -l | tr -d ' ' || echo 0)
  if [ "$entries" -le 2 ]; then
    log "az-billing appears unpopulated (entries=$entries); skipping its build"
    exit 0
  fi
  # Detect tsconfig to decide if build needed
  if [ -f "$AZ_PATH/tsconfig.json" ]; then
    log "Building az-billing submodule"
    (cd "$AZ_PATH" && if [ -f package.json ]; then npm install --no-audit --no-fund --loglevel=error || log "npm install warnings ignored"; fi && npx tsc || log "az-billing build failed (non-fatal)")
  else
    log "No tsconfig.json in az-billing; skipping compilation"
  fi
else
  log "az-billing directory not found; skipping optional submodule build"
fi

log "Guarded build finished"
