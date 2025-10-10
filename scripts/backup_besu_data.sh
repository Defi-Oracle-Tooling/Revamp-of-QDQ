#!/bin/bash
source .besu_env
ssh -i "$SSH_KEY" "$USER@$REMOTE_HOST" '
for cname in $(docker ps --format "{{.Names}}" | grep -i besu); do
  docker run --rm -v ${cname}_data:/data -v $BACKUP_DIR:/backup busybox \
    tar czf /backup/${cname}_data.tar.gz /data
done
sha256sum $BACKUP_DIR/*.tar.gz > $BACKUP_DIR/checksums.txt
azcopy copy "$BACKUP_DIR/*.tar.gz" "https://<azure_storage_url>/<container>?<sas_token>"
'
