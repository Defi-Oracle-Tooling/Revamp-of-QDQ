import { syncLedgerWithBankTransactions } from '../src/integrations/wellsfargo/ledgerSync';
import { BankTransaction } from '../src/integrations/wellsfargo/models';

describe('Ledger Sync Service', () => {
  it('should sync ledger with bank transactions (stub)', async () => {
    const txs: BankTransaction[] = [
      {
        uid: 'tx1',
        accountId: 'WF-ACCT-001',
        amount: '100.00',
        currency: 'USD',
        type: 'credit',
        valueDate: new Date().toISOString(),
        postedDate: new Date().toISOString()
      }
    ];
    await syncLedgerWithBankTransactions(txs);
  const { LedgerSyncService } = require('../src/integrations/wellsfargo/ledgerSync');
  const service = new LedgerSyncService();
  const result = service.syncLedger([{ id: 1, amount: 100 }]);
  expect(result).toBe(true);
  });
});
