#!/bin/bash
source .besu_env
ssh -i "$SSH_KEY" "$USER@$REMOTE_HOST" '
docker ps --format "{{.Names}}" | grep -i besu | while read cname; do
  echo "Container: $cname"
  docker inspect "$cname" --format "{{json .Mounts}}"
  docker exec "$cname" env | grep -E "BESU|ETHSIGNER|TESSERA"
  for f in /opt/besu/data /opt/besu/keys /opt/besu/config /opt/ethsigner /opt/tessera; do
    [ -d "$f" ] && echo "Found: $f"
  done
done
' > besu_assets_report.txt
