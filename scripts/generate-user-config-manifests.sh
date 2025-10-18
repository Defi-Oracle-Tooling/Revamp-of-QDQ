#!/usr/bin/env bash
set -euo pipefail

# Generates baseline user configuration manifests & defaults snapshot.
# Usage: ./scripts/generate-user-config-manifests.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OUT_DEFAULTS="USER_CONFIGS/DEFAULTS/defaults.snapshot.json"
TIMESTAMP="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

log() { echo "[generate-user-config] $*" >&2; }

# Dry-run build to capture implicit defaults
log "Capturing defaults via dry run (privacy=false minimal)"
node build/src/index.js --clientType besu --privacy false --validate true --noFileWrite true --outputPath ./quorum-test-network > /tmp/defaults.raw.json || log "Dry run failed (ensure build exists)"

if [ -f /tmp/defaults.raw.json ]; then
  jq '{capturedAt: $ts, raw: .}' --arg ts "$TIMESTAMP" /tmp/defaults.raw.json > "$OUT_DEFAULTS" || cp /tmp/defaults.raw.json "$OUT_DEFAULTS"
  log "Wrote defaults snapshot -> $OUT_DEFAULTS"
else
  log "defaults.raw.json missing; skipping snapshot"
fi

# Seed manifests if not already present
seed_manifest() {
  local path="$1"; shift
  local content="$*"
  if [ -f "$path" ]; then
    log "Skip existing $path"
  else
    printf '%s\n' "$content" > "$path"
    log "Created $path"
  fi
}

seed_manifest USER_CONFIGS/LOCAL_NETWORKS/minimal-local.network.json '{
  "name": "minimal-local",
  "clientType": "besu",
  "privacy": false,
  "validators": 1,
  "rpcNodes": 1,
  "monitoring": "none",
  "explorer": "none"
}'

seed_manifest USER_CONFIGS/DEVNETS/fast-privacy.devnet.network.json '{
  "name": "fast-privacy",
  "clientType": "besu",
  "privacy": true,
  "validators": 2,
  "rpcNodes": 1,
  "monitoring": "loki",
  "explorer": "blockscout"
}'

seed_manifest USER_CONFIGS/PRIVATE_NETWORKS/multi-party-privacy.network.json '{
  "name": "multi-party-privacy",
  "clientType": "goquorum",
  "privacy": true,
  "participants": 3,
  "validators": 4,
  "rpcNodes": 1,
  "monitoring": "elk",
  "explorer": "blockscout"
}'

seed_manifest USER_CONFIGS/TEST_NETWORKS/azure-multi-region-staging.network.json '{
  "name": "azure-multi-region-staging",
  "clientType": "besu",
  "privacy": true,
  "validators": 4,
  "rpcNodes": 2,
  "azureEnable": true,
  "azureRegions": ["eastus", "westus2"],
  "monitoring": "loki",
  "explorer": "chainlens"
}'

seed_manifest USER_CONFIGS/EXPERIMENTAL/rpc-node-types-experiment.network.json '{
  "name": "rpc-node-types-experiment",
  "clientType": "besu",
  "privacy": true,
  "validators": 3,
  "rpcNodes": 4,
  "rpcNodeTypes": "api:standard:2;admin:admin:1;trace:trace:1",
  "monitoring": "datadog"
}'

log "Generation complete."
