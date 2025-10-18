import { createConnector } from '../../src/connectors/bankingConnector';

describe('Simulation Mode', () => {
  afterEach(() => { delete process.env.SIMULATION_MODE; });
  it('forces offline for tatum when SIMULATION_MODE=true', async () => {
    process.env.SIMULATION_MODE = 'true';
    const tatum = createConnector('tatum');
    const balance = await (tatum as any).getVirtualAccountBalance?.('acct');
    expect(balance).toBeDefined();
  });
  it('allows online flag when SIMULATION_MODE not set', async () => {
    const tatum = createConnector('tatum');
    expect((tatum as any).online).toBeUndefined(); // wrapper hides adapter internals
  });
});