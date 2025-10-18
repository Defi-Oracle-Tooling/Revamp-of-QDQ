import { ACHConnector, BankingConnector, TransferRequest } from './connector';

describe('ACHConnector (Simulation Mode)', () => {
  let connector: BankingConnector;
  beforeAll(() => {
    connector = new ACHConnector(true);
  });

  it('fetchBalances returns deterministic balances', async () => {
    const balances = await connector.fetchBalances();
    expect(balances).toEqual([
      { accountId: 'SIM-ACH-USD-001', currency: 'USD', available: 10000, ledger: 10000, asOf: '2025-01-01T00:00:00.000Z' },
      { accountId: 'SIM-ACH-EUR-001', currency: 'EUR', available: 5000, ledger: 5000, asOf: '2025-01-01T00:00:00.000Z' }
    ]);
  });

  it('listTransactions returns deterministic transactions', async () => {
    const txs = await connector.listTransactions();
    expect(txs).toEqual([
      { accountId: 'SIM-ACH-USD-001', amount: 100, currency: 'USD', direction: 'credit', externalRef: 'SIM-REF-1', bookingDate: '2025-01-01T00:00:00.000Z' },
      { accountId: 'SIM-ACH-USD-001', amount: 50, currency: 'USD', direction: 'debit', externalRef: 'SIM-REF-2', bookingDate: '2025-01-01T00:00:00.000Z' }
    ]);
  });

  it('initiateTransfer returns deterministic result', async () => {
    const req: TransferRequest = {
      fromAccountId: 'SIM-ACH-USD-001',
      toAccountId: 'SIM-ACH-USD-002',
      amount: 123.45,
      currency: 'USD',
      memo: 'Test transfer'
    };
    const result = await connector.initiateTransfer(req);
    expect(result).toEqual({
      success: true,
      referenceId: 'SIM-TRANSFER-001',
      timestamp: '2025-01-01T00:00:00.000Z'
    });
  });
});

describe('ACHConnector (Real Mode)', () => {
  let connector: BankingConnector;
  beforeAll(() => {
    connector = new ACHConnector(false);
  });

  it('throws for fetchBalances', async () => {
    await expect(connector.fetchBalances()).rejects.toThrow('ACHConnector: Real API integration not implemented');
  });
  it('throws for listTransactions', async () => {
    await expect(connector.listTransactions()).rejects.toThrow('ACHConnector: Real API integration not implemented');
  });
  it('throws for initiateTransfer', async () => {
    await expect(connector.initiateTransfer({fromAccountId:'a',toAccountId:'b',amount:1,currency:'USD'})).rejects.toThrow('ACHConnector: Real API integration not implemented');
  });
});
