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
- `connectivity_check.sh`: Local connectivity diagnostics (RPC, ports, latency)

## Usage
1. Set SSH and Azure credentials
2. Run scripts in order or via CI pipeline
3. Monitor logs and Prometheus metrics
4. Use rollback if validation fails

### Variables
Refer to [env.md](./env.md) for full environment variable schema.

### Integrity Verification
Set `AZURE_VERIFY=true` to enable a sample post-upload checksum verification of the first archive. For full fleet verification extend the script to iterate all artifacts or leverage Azure Storage inventory.

### CI Validation
All infra and scripts are validated in `.github/workflows/infra_validation.yml` (shellcheck, bicep build, tests). Ensure new scripts pass `shellcheck` before committing.

## Troubleshooting
- Check `/logs/besu_migration.log` for errors
- Validate checksums and RPC health
- Ensure Azure storage and permissions are configured
