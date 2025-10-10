done
#!/usr/bin/env bash
set -euo pipefail
source .besu_env
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup.log"
echo "[backup] Starting backup" | tee -a "$LOG_FILE"
remote_cmd() { ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" "$@"; }

remote_cmd "docker ps --format '{{.Names}}'" | grep -i besu || true > /tmp/containers.list

while read -r cname; do
  [[ -z "$cname" ]] && continue
  mounts=$(remote_cmd docker inspect "$cname" --format '{{json .Mounts}}' || echo '[]')
  # Parse mount source paths mapping target /opt/besu/data etc.
  archive_name="${cname}_data_$(date +%H%M%S).tar.gz"
  echo "[backup] Archiving $cname -> $archive_name" | tee -a "$LOG_FILE"
  remote_cmd "tar czf $BACKUP_DIR/$archive_name $(remote_cmd docker inspect $cname --format '{{range .Mounts}}{{.Destination}} {{end}}' | tr '\n' ' ')" || echo "[backup] Warning: tar failed for $cname" | tee -a "$LOG_FILE"
done < /tmp/containers.list

remote_cmd "cd $BACKUP_DIR && sha256sum *.tar.gz > checksums.txt" || true

# Optional post-upload verification (sample strategy: re-hash first archive after download)
if [[ "${AZURE_VERIFY:-false}" == "true" && -n "${AZURE_STORAGE_URL:-}" && -n "${AZURE_SAS_TOKEN:-}" ]]; then
  echo "[backup] Post-upload verification enabled (AZURE_VERIFY=true)" | tee -a "$LOG_FILE"
  first_archive=$(remote_cmd "ls -1 $BACKUP_DIR/*.tar.gz 2>/dev/null | head -n1" || true)
  if [[ -n "$first_archive" ]]; then
    fname=$(basename "$first_archive")
    tmpdl="/tmp/$fname"
    echo "[backup] Downloading $fname for hash verification" | tee -a "$LOG_FILE"
    curl -sfL "${AZURE_STORAGE_URL}/${fname}?${AZURE_SAS_TOKEN}" -o "$tmpdl" || echo "[backup] Download failed (skipping verification)" | tee -a "$LOG_FILE"
    if [[ -f "$tmpdl" ]]; then
      local_hash=$(sha256sum "$tmpdl" | awk '{print $1}')
      remote_hash=$(remote_cmd "grep $fname $BACKUP_DIR/checksums.txt" | awk '{print $1}' || true)
      if [[ "$local_hash" == "$remote_hash" && -n "$local_hash" ]]; then
        echo "[backup] Verification success for $fname" | tee -a "$LOG_FILE"
      else
        echo "[backup] Verification mismatch for $fname (local=$local_hash remote=$remote_hash)" | tee -a "$LOG_FILE"
      fi
    fi
  fi
fi

if [[ -n "${AZURE_STORAGE_URL:-}" && -n "${AZURE_SAS_TOKEN:-}" ]]; then
  echo "[backup] Uploading archives to Azure" | tee -a "$LOG_FILE"
  # Placeholder for azcopy (assumed installed on runner or remote)
  remote_cmd "azcopy copy '$BACKUP_DIR/*.tar.gz' '${AZURE_STORAGE_URL}?${AZURE_SAS_TOKEN}' || true"
else
  echo "[backup] Azure upload skipped (AZURE_STORAGE_URL / AZURE_SAS_TOKEN missing)" | tee -a "$LOG_FILE"
fi
echo "[backup] Completed" | tee -a "$LOG_FILE"
