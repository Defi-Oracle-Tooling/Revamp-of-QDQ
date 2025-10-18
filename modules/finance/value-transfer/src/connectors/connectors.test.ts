import { createConnector, ConnectorType } from './factory';
import { TransferRequest } from '../connector';

describe('All Wells Fargo and Tatum.io Connectors (Simulation Mode)', () => {
  const connectorTypes: ConnectorType[] = [
    'wells-fargo-ach',
    'wells-fargo-wire',
    'wells-fargo-rtp',
    'wells-fargo-fx',
    'wells-fargo-beta-experimental',
    'tatum-virtual-account',
    'tatum-fiat-wallet',
    'tatum-crypto'
  ];

  it.each(connectorTypes)('%s: fetchBalances returns deterministic balances', async (type) => {
    const connector = createConnector(type, true);
    const balances = await connector.fetchBalances();
    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);
    expect(balances[0]).toHaveProperty('accountId');
    expect(balances[0]).toHaveProperty('currency');
    expect(balances[0]).toHaveProperty('available');
    expect(balances[0]).toHaveProperty('ledger');
    expect(balances[0]).toHaveProperty('asOf');
  });

  it.each(connectorTypes)('%s: listTransactions returns deterministic transactions', async (type) => {
    const connector = createConnector(type, true);
    const txs = await connector.listTransactions();
    expect(Array.isArray(txs)).toBe(true);
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toHaveProperty('accountId');
    expect(txs[0]).toHaveProperty('amount');
    expect(txs[0]).toHaveProperty('currency');
    expect(txs[0]).toHaveProperty('direction');
    expect(txs[0]).toHaveProperty('externalRef');
    expect(txs[0]).toHaveProperty('bookingDate');
  });

  it.each(connectorTypes)('%s: initiateTransfer returns deterministic result', async (type) => {
    const connector = createConnector(type, true);
    const req: TransferRequest = {
      fromAccountId: 'A',
      toAccountId: 'B',
      amount: 1,
      currency: 'USD',
      memo: 'Test'
    };
    const result = await connector.initiateTransfer(req);
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('referenceId');
    expect(result).toHaveProperty('timestamp');
  });
});
