#!/usr/bin/env bash
set -euo pipefail

critical=( \
  "modules/infra/az-billing" \
  "modules/finance/wf-vantage" \
  "modules/core/shared" \
)

missing=()
for path in "${critical[@]}"; do
  if [[ ! -d "$path/.git" ]]; then
    missing+=("$path")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "[ERROR] Missing critical submodules: ${missing[*]}" >&2
  echo "Run: ./scripts/init-submodules.sh" >&2
  exit 1
fi

echo "[verify] Critical submodules present. Listing revisions:"
for path in "${critical[@]}"; do
  rev=$(git -C "$path" rev-parse --short HEAD || echo "UNKNOWN")
  branch=$(git -C "$path" rev-parse --abbrev-ref HEAD || echo "DETACHED")
  echo " - $path @ $rev (branch: $branch)"
done
