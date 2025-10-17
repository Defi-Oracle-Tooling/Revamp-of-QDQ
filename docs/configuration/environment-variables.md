# Environment Variable Schema (.besu_env)

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Configuration](../docs/configuration/) → **environment-variables**


| Variable | Description | Required |
|----------|-------------|----------|
| REMOTE_HOST | Target VM/IP for legacy Besu deployment | yes |
| REMOTE_USER | SSH username for remote host | yes |
| SSH_KEY | Path to PEM private key used for SSH | yes |
| BESU_HOME | Remote working directory for migration session | yes |
| BACKUP_DIR | Remote backup directory for tar archives | yes |
| LOG_DIR | Local log output directory | no (defaults ./logs) |
| AZURE_STORAGE_URL | Base Azure Blob / Files endpoint for uploads | no |
| AZURE_SAS_TOKEN | SAS token appended to storage URL | no |
| PROM_PUSHGATEWAY | Prometheus Pushgateway base URL | no |

## Precedence
1. Runtime environment overrides `.besu_env` values.
2. `.besu_env` regenerated each run of `connect_vm.sh`.

## Regeneration Safety
Downstream scripts should source `.besu_env` at start to pick up fresh paths.
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/configuration/environment-variables.md)
