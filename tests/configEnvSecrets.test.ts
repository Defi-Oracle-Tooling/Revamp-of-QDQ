import { loadWellsFargoConfig } from '../src/integrations/wellsfargo/config';
import { loadTatumConfigFromEnv } from '../src/secrets/azureKeyVault';

describe('Env & Secret Config Loaders', () => {
  it('loads Wells Fargo config with service overrides', async () => {
    process.env.WF_ENABLED = 'true';
    process.env.WF_BASE_URL = 'https://api.wf.test';
    process.env.WF_SERVICES = 'balances,transactions,fx';
    process.env.WF_POLL_BALANCES_SEC = '30';
    const cfg = await loadWellsFargoConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.baseUrl).toBe('https://api.wf.test');
    expect(cfg.services.fx).toBe(true);
    expect(cfg.polling.balancesIntervalSec).toBe(30);
  });

  it('loads Tatum config from env', async () => {
    process.env.TATUM_API_KEY = 'test-key-123';
    process.env.TATUM_API_TYPE = 'TESTNET';
    process.env.TATUM_API_URL = 'https://api.tatum.io';
    const cfg = await loadTatumConfigFromEnv();
    expect(cfg.apiKey).toBe('test-key-123');
    expect(cfg.testnet).toBe(true);
    expect(cfg.baseUrl).toBe('https://api.tatum.io');
  });
});
