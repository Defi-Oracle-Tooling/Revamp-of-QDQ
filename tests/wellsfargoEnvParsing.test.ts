import { defaultWellsFargoConfig, loadWellsFargoConfig } from '../src/integrations/wellsfargo/config';
import { loadWellsFargoConfigFromEnv } from '../src/secrets/azureKeyVault';

describe('Wells Fargo Env Parsing Edge Cases', () => {
  beforeEach(() => {
    // reset modifications
    process.env.WF_SERVICES = '';
    delete process.env.WF_POLL_BALANCES_SEC;
  });

  it('ignores unknown service names', async () => {
    process.env.WF_SERVICES = 'balances,foo,transactions,bar';
    const cfg = await loadWellsFargoConfig();
    expect(cfg.services.balances).toBe(true);
    expect(cfg.services.transactions).toBe(true);
    // unknown should not create new keys
    expect((cfg.services as any).foo).toBeUndefined();
  });

  it('falls back when interval value invalid', async () => {
    const baseline = defaultWellsFargoConfig.polling.balancesIntervalSec;
    process.env.WF_POLL_BALANCES_SEC = 'not-a-number';
    const cfg = await loadWellsFargoConfigFromEnv(defaultWellsFargoConfig);
    expect(cfg.polling.balancesIntervalSec).toBe(baseline);
  });
});