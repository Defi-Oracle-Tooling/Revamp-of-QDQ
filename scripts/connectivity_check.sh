#!/usr/bin/env bash
set -euo pipefail
source .besu_env
LOG_DIR=${LOG_DIR:-./logs}
mkdir -p "$LOG_DIR"
OUT="$LOG_DIR/connectivity_check.txt"
echo "[connectivity] Starting checks" | tee "$OUT"
REMOTE="$REMOTE_USER@$REMOTE_HOST"

rpc_endpoint="${1:-http://localhost:8545}"
echo "RPC endpoint: $rpc_endpoint" | tee -a "$OUT"

block_number=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json' "$rpc_endpoint" | jq -r '.result' 2>/dev/null || echo null)
echo "Latest block (hex): $block_number" | tee -a "$OUT"

for port in 8545 8546 30303 9000; do
  if nc -z localhost $port 2>/dev/null; then
    echo "Local port $port: OPEN" | tee -a "$OUT"
  else
    echo "Local port $port: CLOSED" | tee -a "$OUT"
  fi
done

echo "Pinging remote host ..." | tee -a "$OUT"
ping -c 3 "$REMOTE_HOST" 2>&1 | tee -a "$OUT" || true

echo "[connectivity] Complete" | tee -a "$OUT"