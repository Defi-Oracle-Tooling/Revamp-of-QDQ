#!/bin/bash
# Usage: ./connect_vm.sh <user> <vm_ip> <pem_path>
USER="$1"
VM_IP="$2"
PEM="$3"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BESU_HOME=~/besu_migration_$TIMESTAMP
BACKUP_DIR=~/besu_backup_$TIMESTAMP

if [ -z "$USER" ] || [ -z "$VM_IP" ] || [ -z "$PEM" ]; then
  echo "Usage: $0 <user> <vm_ip> <pem_path>"
  exit 1
fi

ssh -i "$PEM" "$USER@$VM_IP" "mkdir -p $BESU_HOME $BACKUP_DIR"
mkdir -p "$BESU_HOME" "$BACKUP_DIR"
echo "REMOTE_HOST=$VM_IP" > .besu_env
echo "SSH_KEY=$PEM" >> .besu_env
echo "BESU_HOME=$BESU_HOME" >> .besu_env
echo "BACKUP_DIR=$BACKUP_DIR" >> .besu_env
