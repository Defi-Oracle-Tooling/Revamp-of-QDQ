import { simulateBalances, simulateTransactions, enrichMetadata } from '../src/connectors/simulationPayload';

describe('simulationPayload deterministic generation', () => {
  it('balances deterministic across seeds', () => {
    const b0 = simulateBalances(0);
    const b1 = simulateBalances(1);
    expect(b0).toHaveLength(2);
    expect(b0[0].asOf).toBe('2025-01-01T00:00:00.000Z');
    expect(b1[0].asOf).toBe('2025-01-01T00:01:00.000Z');
    // Values stable across seeds except timestamp
    expect(b0[0].available).toBe(b1[0].available);
    expect(b0[1].ledger).toBe(b1[1].ledger);
  });

  it('transactions deterministic across seeds', () => {
    const t0 = simulateTransactions(0);
    const t2 = simulateTransactions(2);
    expect(t0).toHaveLength(2);
    expect(t2).toHaveLength(2);
    expect(t0[0].bookingDate).toBe('2025-01-01T00:00:00.000Z');
    expect(t2[0].bookingDate).toBe('2025-01-01T00:02:00.000Z');
    expect(t0[0].amount).toBe(t2[0].amount);
    expect(t0[1].externalRef).toBe('REF-0-B');
    expect(t2[1].externalRef).toBe('REF-2-B');
  });

  it('enrichMetadata adds unified fields', () => {
    const tx = simulateTransactions(0);
    const enriched = enrichMetadata('wells-fargo', tx, 'checking');
    expect(enriched[0]).toMatchObject({ sourceSystem: 'wells-fargo', accountType: 'checking', referenceId: 'REF-0-A' });
  });
});
