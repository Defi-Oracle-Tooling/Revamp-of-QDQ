#!/usr/bin/env bash
set -euo pipefail
source .besu_env
LOG_DIR=${LOG_DIR:-./logs}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/rollback.log"
STAGING=${STAGING_DIR:-/opt/besu/restore_staging}
CONFIRM=${CONFIRM:-false}

if [[ "$CONFIRM" != "true" ]]; then
  echo "[rollback] CONFIRM=true required to proceed" | tee -a "$LOG_FILE"
  exit 1
fi

echo "[rollback] Staging restore to $STAGING" | tee -a "$LOG_FILE"
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $STAGING" || true

containers=$(ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" 'docker ps -a --format "{{.Names}}"' | grep -i besu || true)
for cname in $containers; do
  archive="${cname}_data.tar.gz"
  echo "[rollback] Restoring $archive" | tee -a "$LOG_FILE"
  ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "tar xzf $BACKUP_DIR/$archive -C $STAGING || true"
done
echo "[rollback] Completed staging restore. Manual validation advised before swap." | tee -a "$LOG_FILE"
