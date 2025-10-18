# Wells Fargo Integration Runbook

## Deployment Steps
1. Ensure all secrets (clientId, clientSecret, certs) are provisioned in Azure Key Vault.
2. Set environment variables for API endpoints, credentials, polling intervals, and enabled services.
3. Build the project: `npm run build`
4. Run all tests: `npm test`
5. Deploy to staging environment and validate data ingestion and payment flows.
6. Monitor metrics and alerting dashboards for errors and latency.
7. Roll out to production in phases:
   - Phase 1: Read-only ingestion
   - Phase 2: ACH payments (small limits)
   - Phase 3: Wire and FX
   - Phase 4: Advanced services

## Environment & Key Vault Secrets

| Purpose | Env Var | Key Vault Secret | Notes |
|---------|---------|------------------|-------|
| Tatum API Key | `TATUM_API_KEY` | `TATUM-API-KEY` | Required for all Tatum operations |
| Tatum API Type | `TATUM_API_TYPE` | (env only) | MAINNET or TESTNET (default MAINNET) |
| Tatum Base URL | `TATUM_API_URL` | (optional) | Override default SDK base URL |
| Wells Fargo Enable | `WF_ENABLED` | (env only) | Toggle integration |
| Wells Fargo Base URL | `WF_BASE_URL` | `WF-BASE-URL` | Treasury API root |
| OAuth Client ID | `WF_OAUTH_CLIENT_ID` | `WF-OAUTH-CLIENT-ID` | Confidential client id |
| OAuth Client Secret | `WF_OAUTH_CLIENT_SECRET_REF` | `WF-OAUTH-CLIENT-SECRET` | Stored only in vault |
| mTLS Cert | `WF_MTLS_CERT_REF` | `WF-MTLS-CERT` | Certificate PEM |
| mTLS Key | `WF_MTLS_KEY_REF` | `WF-MTLS-KEY` | Private key PEM |
| Service Enable List | `WF_SERVICES` | (env only) | Comma list e.g. balances,transactions,ach,wires |
| Balance Poll Interval | `WF_POLL_BALANCES_SEC` | (env only) | Seconds (default 300) |
| Transaction Poll Interval | `WF_POLL_TX_SEC` | (env only) | Seconds (default 300) |
| Payment Status Poll Interval | `WF_POLL_PAYSTATUS_SEC` | (env only) | Seconds (default 120) |

### Sync Local .env to Key Vault

Use the sync script to push current values:

```bash
node scripts/sync-keyvault-env.js --vault $AZURE_KEYVAULT_NAME --confirm
```

Flags:
- `--dry` to preview without pushing.
- `--subset wf,tatum` to limit categories.

### Rotation Strategy
- OAuth Client Secret: rotate quarterly (prod), monthly (staging).
- mTLS key/cert: rotate yearly or upon compromise.
- Tatum API Key: rotate semi-annually.

### Failure Modes & Recovery
### Central Configuration Factory

Use `loadAppConfig()` to obtain a single object with both Wells Fargo and Tatum configuration:

```ts
import { loadAppConfig } from '../src/config';
const appCfg = await loadAppConfig();
console.log(appCfg.wellsFargo.enabled, appCfg.tatum.apiKey);
```

To force refresh (after secret rotation):

```ts
import { clearConfigCache } from '../src/config';
import { clearVaultCache, resetVaultClient } from '../src/secrets/azureKeyVault';
resetVaultClient();
clearVaultCache();
clearConfigCache();
const refreshed = await loadAppConfig(true);
```

### Secret Rotation End-to-End
1. Rotate secret in Azure Key Vault (e.g., `WF-OAUTH-CLIENT-SECRET`).
2. In application maintenance window, execute refresh sequence above.
3. Verify new secret active by performing a lightweight authenticated Wells Fargo API call.
4. If failure persists, rollback by restoring previous secret version (Key Vault keeps versions) and repeat.

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| 401 from Wells Fargo | Expired OAuth secret | Rotate secret & restart services |
| TLS handshake fail | mTLS cert mismatch | Re-sync cert/key pair |
| Empty balances | WF_BASE_URL incorrect | Verify URL & connectivity |
| Tatum auth errors | Wrong API key scope | Reissue key / verify MAINNET vs TESTNET |

## Troubleshooting
- Check logs for compliance, error taxonomy, and audit events.
- Use Prometheus/Grafana dashboards for reconciliation lag, payment latency, and error rates.
- Refer to `/docs/integrations/wellsfargo-adapters.md` for adapter usage and API details.
