#!/bin/bash
source .besu_env
ssh -i "$SSH_KEY" "$USER@$REMOTE_HOST" '
# Example: Restore containers from backup if validation fails
for cname in $(docker ps -a --format "{{.Names}}" | grep -i besu); do
  docker run --rm -v $BACKUP_DIR:/backup busybox \
    tar xzf /backup/${cname}_data.tar.gz -C /opt/besu/data
  docker start "$cname"
done
'
