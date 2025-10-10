#!/bin/bash
source .besu_env
ssh -i "$SSH_KEY" "$USER@$REMOTE_HOST" '
cat $BACKUP_DIR/checksums.txt
curl -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545
' | tee /logs/besu_migration.log
