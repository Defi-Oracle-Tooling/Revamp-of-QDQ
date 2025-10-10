#!/bin/bash
source .besu_env
SYNC_INTERVAL=${1:-300}
while [ ! -f "$BESU_HOME/.lock" ]; do
  rsync -avz -e "ssh -i $SSH_KEY" "$USER@$REMOTE_HOST:/opt/besu/data/" "/mnt/azurefiles/besu_data/"
  sleep "$SYNC_INTERVAL"
done
