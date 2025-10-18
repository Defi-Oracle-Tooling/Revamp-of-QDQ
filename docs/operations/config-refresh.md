# Configuration Refresh Workflow

The `--refreshConfig` flag performs a standalone integration configuration reload without requiring other network flags like `--clientType` or `--privacy`.

## Purpose
- Validate that new environment variables are detected.
- Force Azure Key Vault client and cache reset after secret rotation.
- Provide quick JSON snapshot of critical integration toggles (Wells Fargo, Tatum).

## Behavior
1. Detects presence of `--refreshConfig` and absence of `--clientType` to enter standalone mode.
2. Resets internal caches:
   - Secret client instance
   - Vault value cache
   - Config factory cache
3. Injects a placeholder `TATUM_API_KEY` if not present so the refresh summary does not hard fail. (In normal scaffold runs, missing required secrets will still error.)
4. Loads integration config (`loadAppConfig(true)`) and prints summary JSON.

## Example
```bash
node build/index.js --refreshConfig
```
Output:
```jsonc
{
  "wellsFargoEnabled": false,
  "wellsFargoBaseUrl": "",
  "tatumTestnet": false,
  "loadedAt": "2025-10-16T02:42:35.020Z"
}
```

## After Secret Rotation
If you rotate a secret in Azure Key Vault:
```bash
# Rotate secret in portal or via CLI, then:
node build/index.js --refreshConfig
```
Confirm the updated value is applied where relevant (for non-sensitive fields exposed in summary).

## Troubleshooting
| Issue | Cause | Resolution |
|-------|-------|------------|
| Missing secret error | Required env not set and placeholder logic removed/altered | Export env var or re-add placeholder injection logic. |
| Stale values after rotation | Cache not cleared | Ensure `--refreshConfig` used; it calls `resetVaultClient()` + `clearVaultCache()` + `clearConfigCache()`. |
| No output (silent) | Using legacy `build/index.js` without shim invocation | Ensure shim file contains explicit `main()` call (present in current version). |

## Integration Tests
The Jest test `tests/configRefreshFlag.test.ts` asserts exit code 0 and presence of `Config refresh complete` plus expected keys. If modifying output format, update the test accordingly.

## Future Enhancements
- Optional `--refreshConfig --strict` mode to enforce real secrets (no placeholder).
- Add verbosity levels: `--refreshConfig --verbose` to include raw resolved sources (env vs vault) without exposing secret values.

## Security Notes
The refresh summary intentionally excludes raw secret values. Only high-level flags and derived booleans are shown.
