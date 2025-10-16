import { WellsFargoApiClient } from '../src/integrations/wellsfargo/apiClient';
import { defaultWellsFargoConfig } from '../src/integrations/wellsfargo/config';

describe('WellsFargoApiClient', () => {
  it('should return balances when enabled', async () => {
    const cfg = { ...defaultWellsFargoConfig, enabled: true, baseUrl: 'https://mock.wellsfargo.test' };
  const client = new WellsFargoApiClient(cfg, async (url, _opts) => {
      if (typeof url === 'string' && url.endsWith('/balances')) {
        return new Response(JSON.stringify({ accounts: [
          { accountId: 'WF-ACCT-001', currency: 'USD', availableBalance: '100000.00', ledgerBalance: '100000.00', asOf: new Date().toISOString() },
          { accountId: 'WF-ACCT-002', currency: 'EUR', availableBalance: '50000.00', ledgerBalance: '50000.00', asOf: new Date().toISOString() }
        ] }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    const balances = await client.fetchBalances();
    expect(balances.length).toBe(2);
    expect(balances[0].accountId).toBe('WF-ACCT-001');
    expect(balances[1].accountId).toBe('WF-ACCT-002');
  });

  it('should return empty balances when service disabled', async () => {
    const cfg = { ...defaultWellsFargoConfig, enabled: true, services: { ...defaultWellsFargoConfig.services, balances: false } };
    const client = new WellsFargoApiClient(cfg);
    const balances = await client.fetchBalances();
    expect(balances.length).toBe(0);
  });

  it('should compute transaction hash deterministically', async () => {
    const cfg = { ...defaultWellsFargoConfig, enabled: true, baseUrl: 'https://mock.wellsfargo.test' };
  const client = new WellsFargoApiClient(cfg, async (url, _opts) => {
      if (typeof url === 'string' && url.includes('/transactions')) {
        return new Response(JSON.stringify({ transactions: [
          { accountId: 'WF-ACCT-001', externalRef: '1', amount: '250.00', type: 'credit', currency: 'USD', description: 'Inbound ACH', valueDate: new Date().toISOString(), postedDate: new Date().toISOString() },
          { accountId: 'WF-ACCT-002', externalRef: '2', amount: '1000.00', type: 'debit', currency: 'EUR', description: 'Outbound Wire', valueDate: new Date().toISOString(), postedDate: new Date().toISOString() }
        ] }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    const txs1 = await client.fetchTransactions(new Date().toISOString());
    const txs2 = await client.fetchTransactions(new Date().toISOString());
    expect(txs1[0].uid).toBe(txs2[0].uid);
  });
});
