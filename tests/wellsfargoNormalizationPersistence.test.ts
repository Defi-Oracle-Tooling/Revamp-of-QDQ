import { normalizeBalancePayload, normalizeTransactionPayload } from '../src/integrations/wellsfargo/normalization';
import { saveRawPayload, getRawPayloads } from '../src/integrations/wellsfargo/persistence';

describe('Normalization & Persistence', () => {
  it('should normalize balances from raw payload', async () => {
    const raw: import('../src/integrations/wellsfargo/persistence').RawPayload = {
      id: '1',
      type: 'balance',
      receivedAt: new Date().toISOString(),
      payload: JSON.stringify([
        { accountId: 'WF-ACCT-001', currency: 'USD', availableBalance: '100', ledgerBalance: '100', asOf: new Date().toISOString() }
      ]),
      checksum: 'abc'
    };
    const result = normalizeBalancePayload(raw);
    expect(result.length).toBe(1);
    expect(result[0].accountId).toBe('WF-ACCT-001');
  });

  it('should normalize transactions from raw payload', async () => {
    const raw: import('../src/integrations/wellsfargo/persistence').RawPayload = {
      id: '2',
      type: 'transaction',
      receivedAt: new Date().toISOString(),
      payload: JSON.stringify([
        { uid: 'tx1', accountId: 'WF-ACCT-001', amount: '100', currency: 'USD', type: 'credit', valueDate: new Date().toISOString(), postedDate: new Date().toISOString() }
      ]),
      checksum: 'def'
    };
    const result = normalizeTransactionPayload(raw);
    expect(result.length).toBe(1);
    expect(result[0].uid).toBe('tx1');
  });

  it('should save and retrieve raw payloads', async () => {
    const raw1: import('../src/integrations/wellsfargo/persistence').RawPayload = { id: '3', type: 'balance', receivedAt: new Date().toISOString(), payload: '{}', checksum: 'x' };
    const raw2: import('../src/integrations/wellsfargo/persistence').RawPayload = { id: '4', type: 'transaction', receivedAt: new Date().toISOString(), payload: '{}', checksum: 'y' };
    await saveRawPayload(raw1);
    await saveRawPayload(raw2);
    const all = await getRawPayloads();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const balances = await getRawPayloads('balance');
    expect(balances.some(p => p.id === '3')).toBe(true);
    const txs = await getRawPayloads('transaction');
    expect(txs.some(p => p.id === '4')).toBe(true);
  });
});
