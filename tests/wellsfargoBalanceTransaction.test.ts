import { WellsFargoApiClient } from '../src/integrations/wellsfargo/apiClient';
import { defaultWellsFargoConfig } from '../src/integrations/wellsfargo/config';

describe('WellsFargoApiClient Adapters', () => {
  it('should fetch multiple balances', async () => {
      const client = new WellsFargoApiClient({ ...defaultWellsFargoConfig, enabled: true, baseUrl: 'https://mock.wellsfargo.test' }, async (url, _opts) => {
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

  it('should fetch multiple transactions', async () => {
      const client = new WellsFargoApiClient({ ...defaultWellsFargoConfig, enabled: true, baseUrl: 'https://mock.wellsfargo.test' }, async (url, _opts) => {
        if (typeof url === 'string' && url.includes('/transactions')) {
          return new Response(JSON.stringify({ transactions: [
            { accountId: 'WF-ACCT-001', externalRef: '1', amount: '250.00', type: 'credit', currency: 'USD', description: 'Inbound ACH', valueDate: new Date().toISOString(), postedDate: new Date().toISOString() },
            { accountId: 'WF-ACCT-002', externalRef: '2', amount: '1000.00', type: 'debit', currency: 'EUR', description: 'Outbound Wire', valueDate: new Date().toISOString(), postedDate: new Date().toISOString() }
          ] }), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      });
    const txs = await client.fetchTransactions(new Date().toISOString());
    expect(txs.length).toBe(2);
    expect(txs[0].accountId).toBe('WF-ACCT-001');
    expect(txs[1].accountId).toBe('WF-ACCT-002');
    expect(txs[0].type).toBe('credit');
    expect(txs[1].type).toBe('debit');
  });
});
