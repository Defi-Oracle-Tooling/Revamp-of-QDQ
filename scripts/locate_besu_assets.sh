done
#!/usr/bin/env bash
set -euo pipefail
source .besu_env
REPORT_TXT="${LOG_DIR:-./logs}/besu_assets_report.txt"
REPORT_JSON="${LOG_DIR:-./logs}/assets.json"
mkdir -p "${LOG_DIR:-./logs}"
echo "[locate] Writing reports to $REPORT_TXT and $REPORT_JSON"
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" 'docker ps --format "{{.Names}}"' | grep -i besu || true > /tmp/containers.list

declare -A JSON_ENTRIES
{
  echo "# Besu Asset Discovery Report"
  date
  echo
  while read -r cname; do
    [[ -z "$cname" ]] && continue
    echo "Container: $cname"
    mounts=$(ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" docker inspect "$cname" --format '{{json .Mounts}}' || echo '[]')
    echo "Mounts: $mounts"
    envvars=$(ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" docker exec "$cname" env 2>/dev/null | grep -E 'BESU|ETHSIGNER|TESSERA' || true)
    echo "$envvars" | sed 's/^/ENV: /'
    # Look for key directories
    for d in /opt/besu/data /opt/besu/keys /opt/besu/config /opt/ethsigner /opt/tessera; do
      ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "[ -d $d ] && echo Found:$d || true"
    done
    JSON_ENTRIES[$cname]="{\"container\":\"$cname\",\"mounts\":$mounts}"
    echo
  done < /tmp/containers.list
} > "$REPORT_TXT"

echo "[" > "$REPORT_JSON"
first=true
for key in "${!JSON_ENTRIES[@]}"; do
  $first || echo "," >> "$REPORT_JSON"
  first=false
  echo "${JSON_ENTRIES[$key]}" >> "$REPORT_JSON"
done
echo "]" >> "$REPORT_JSON"
echo "[locate] Completed asset discovery."
