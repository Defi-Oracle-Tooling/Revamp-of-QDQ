#!/usr/bin/env bash
set -euo pipefail
source .besu_env
LOG_DIR=${LOG_DIR:-./logs}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/verify.log"
echo "[verify] Collecting remote checksums & block height" | tee -a "$LOG_FILE"
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "cat $BACKUP_DIR/checksums.txt 2>/dev/null || true" | tee -a "$LOG_FILE"
curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json' http://localhost:8545 | tee -a "$LOG_FILE"
echo "[verify] Connectivity check" | tee -a "$LOG_FILE"
bash scripts/connectivity_check.sh >> "$LOG_FILE" 2>&1 || true
echo "[verify] Done" | tee -a "$LOG_FILE"
