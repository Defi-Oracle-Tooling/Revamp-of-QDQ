#!/bin/bash
source .besu_env
ssh -i "$SSH_KEY" "$USER@$REMOTE_HOST" '
docker stop $(docker ps -q --filter name=validator)
rsync -avz /opt/besu/data/ /mnt/azurefiles/besu_data/
curl -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545
# Trigger Azure Container Apps deployment here (customize as needed)
'
