#!/usr/bin/env bash
set -euo pipefail
source .besu_env
SYNC_INTERVAL=${1:-300}
LOCK_FILE="$BESU_HOME/.lock"
LOG_DIR=${LOG_DIR:-./logs}
mkdir -p "$LOG_DIR"
LOG_FILE_PATH="$LOG_DIR/sync.log"
echo "[sync] Interval=$SYNC_INTERVAL s, lock=$LOCK_FILE" | tee -a "$LOG_FILE_PATH"
remote_block() {
  curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json' http://localhost:8545 | jq -r '.result' 2>/dev/null || echo 0x0
}
while [[ ! -f "$LOCK_FILE" ]]; do
  echo "[sync] Rsync cycle start $(date -Iseconds)" | tee -a "$LOG_FILE_PATH"
  rsync -az --delete -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" "$REMOTE_USER@$REMOTE_HOST:/opt/besu/data/" "/mnt/azurefiles/besu_data/" || echo "[sync] Warning: rsync failed" | tee -a "$LOG_FILE_PATH"
  bn=$(remote_block); echo "[sync] Local observed block: $bn" | tee -a "$LOG_FILE_PATH"
  sleep "$SYNC_INTERVAL"
done
echo "[sync] Lock detected. Exiting background sync." | tee -a "$LOG_FILE_PATH"
