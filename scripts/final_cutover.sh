#!/usr/bin/env bash
set -euo pipefail
source .besu_env
LOG_DIR=${LOG_DIR:-./logs}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/final_cutover.log"
DRY_RUN=${DRY_RUN:-false}
THRESHOLD_DRIFT=${THRESHOLD_DRIFT:-5}
LOCK_FILE="$BESU_HOME/.lock"

echo "[cutover] Starting final cutover (dry-run=$DRY_RUN)" | tee -a "$LOG_FILE"

echo "[cutover] Creating lock $LOCK_FILE" | tee -a "$LOG_FILE"
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "touch $LOCK_FILE" || true

remote_block_hex=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json' http://localhost:8545 | jq -r '.result' || echo 0x0)
remote_block=$((remote_block_hex)) || remote_block=0
echo "[cutover] Pre-stop remote block=$remote_block ($remote_block_hex)" | tee -a "$LOG_FILE"

if [[ "$DRY_RUN" == "true" ]]; then
	echo "[cutover] Dry-run mode: skipping validator stop and final sync" | tee -a "$LOG_FILE"
	exit 0
fi

echo "[cutover] Stopping validator containers" | tee -a "$LOG_FILE"
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "docker ps -q --filter name=validator | xargs -r docker stop" | tee -a "$LOG_FILE" || echo "[cutover] Warning: stop failed" | tee -a "$LOG_FILE"

echo "[cutover] Performing last rsync" | tee -a "$LOG_FILE"
rsync -az --delete -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" "$REMOTE_USER@$REMOTE_HOST:/opt/besu/data/" "/mnt/azurefiles/besu_data/" | tee -a "$LOG_FILE" || echo "[cutover] rsync failed" | tee -a "$LOG_FILE"

post_block_hex=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H 'Content-Type: application/json' http://localhost:8545 | jq -r '.result' || echo 0x0)
post_block=$((post_block_hex)) || post_block=0
echo "[cutover] Post-stop remote block=$post_block ($post_block_hex)" | tee -a "$LOG_FILE"

if (( remote_block - post_block > THRESHOLD_DRIFT )); then
	echo "[cutover] Block drift exceeded threshold ($remote_block -> $post_block). Aborting." | tee -a "$LOG_FILE"
	exit 1
fi

echo "[cutover] Trigger new deployment (placeholder)" | tee -a "$LOG_FILE"
