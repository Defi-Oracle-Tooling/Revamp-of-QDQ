import { createConnector } from '../../src/connectors/bankingConnector';
import { MarionetteConnector } from '../../src/connectors/marionetteConnector';

describe('Banking -> Web3 -> Exchange integration (simulation)', () => {
  beforeAll(() => {
    process.env.SIMULATION_MODE = 'true';
  });
  it('flows balances to virtual account to swap', async () => {
    const wells = createConnector('wells-fargo');
    const bni = createConnector('bni');
    const tatum = createConnector('tatum');
  const exchange = new MarionetteConnector();
  const wellsBalances = await wells.fetchBalances();
  const bniBalances = await bni.fetchBalances();
  expect(Array.isArray(wellsBalances)).toBe(true);
  expect(Array.isArray(bniBalances)).toBe(true);
  expect(wellsBalances.length).toBeGreaterThanOrEqual(0);
    // Tatum simulation: create virtual account
    // We access adapter-specific method dynamically for test only
    const va = await (tatum as any).createVirtualAccount?.('USD');
    expect(va).toBeDefined();
    const quote = await exchange.fetchQuote('ETH','USDC','1');
    expect(quote).toBeDefined();
    if (quote) {
      expect(quote.base).toBe('ETH');
      expect(quote.quote).toBe('USDC');
      expect(Number(quote.amount)).toBeGreaterThan(0);
    }
    const swap = await exchange.executeSwap('ETH','USDC','1');
    expect(swap.status).toBe('SUCCESS');
    expect(swap.route.length).toBeGreaterThanOrEqual(0);
  });
});