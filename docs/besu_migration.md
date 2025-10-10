# Besu Migration & Hot Cutover Guide

## Overview
This guide covers the migration of a Hyperledger Besu network from a Linux VM to Azure Container Apps, including backup, live sync, cutover, and rollback procedures.

## Scripts
- `connect_vm.sh`: Authenticate and prepare directories
- `locate_besu_assets.sh`: Discover containers and configs
- `backup_besu_data.sh`: Archive and upload data
- `sync_hot_cutover.sh`: Maintain live rsync
- `final_cutover.sh`: Execute cutover sequence
- `verify_cutover.sh`: Validate migration
- `rollback.sh`: Restore original containers
- `prometheus_cutover_hook.sh`: Monitor cutover state

## Usage
1. Set SSH and Azure credentials
2. Run scripts in order or via CI pipeline
3. Monitor logs and Prometheus metrics
4. Use rollback if validation fails

## Troubleshooting
- Check `/logs/besu_migration.log` for errors
- Validate checksums and RPC health
- Ensure Azure storage and permissions are configured
