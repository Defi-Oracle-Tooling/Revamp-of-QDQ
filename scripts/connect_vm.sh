#!/usr/bin/env bash
set -euo pipefail
# Usage: ./connect_vm.sh <remote_user> <vm_ip> <pem_path>
REMOTE_USER="${1:-}"
VM_IP="${2:-}"
PEM="${3:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BESU_HOME=~/besu_migration_$TIMESTAMP
BACKUP_DIR=~/besu_backup_$TIMESTAMP
LOG_DIR=./logs

if [[ -z "${REMOTE_USER}" || -z "${VM_IP}" || -z "${PEM}" ]]; then
  echo "Usage: $0 <remote_user> <vm_ip> <pem_path>" >&2
  exit 1
fi
if [[ ! -f "$PEM" ]]; then
  echo "PEM key not found: $PEM" >&2
  exit 1
fi

echo "[connect] Creating remote working dirs on ${REMOTE_USER}@${VM_IP} ..."
ssh -o StrictHostKeyChecking=no -i "$PEM" "$REMOTE_USER@$VM_IP" "mkdir -p $BESU_HOME $BACKUP_DIR" || echo "Remote directory creation warning (continuing for dry-run)."
mkdir -p "$BESU_HOME" "$BACKUP_DIR" "$LOG_DIR"
{
  echo "REMOTE_HOST=$VM_IP"
  echo "SSH_KEY=$PEM"
  echo "BESU_HOME=$BESU_HOME"
  echo "BACKUP_DIR=$BACKUP_DIR"
  echo "REMOTE_USER=$REMOTE_USER"
  echo "LOG_DIR=$LOG_DIR"
  echo "AZURE_STORAGE_URL=${AZURE_STORAGE_URL:-}"
  echo "AZURE_SAS_TOKEN=${AZURE_SAS_TOKEN:-}"
  echo "PROM_PUSHGATEWAY=${PROM_PUSHGATEWAY:-}"
} > .besu_env
echo "[connect] Environment file .besu_env created with variables: REMOTE_HOST, REMOTE_USER, BESU_HOME, BACKUP_DIR, LOG_DIR"
