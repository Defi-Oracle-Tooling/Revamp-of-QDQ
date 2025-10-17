import { ChainlinkOracleAdapter } from '../src/integrations/chainlink/chainlink';
import { DefenderAdapter } from '../src/integrations/defender/defender';
import { computeCreate2Address } from '../src/integrations/create2/create2';
import { MulticallBatcher } from '../src/integrations/multicall/multicall';
import { FireflyAdapter } from '../src/integrations/firefly/firefly';
import { BridgeAdapter } from '../src/integrations/bridges/bridges';
import { validateChain138Config } from '../src/chain138/chain138Config';

describe('Integration Adapters', () => {
  test('ChainlinkOracleAdapter lists and reads feeds', async () => {
    const adapter = new ChainlinkOracleAdapter({
      network: 'ethereum',
      priceFeeds: [{ pair: 'ETH/USD', address: '0xfeed', decimals: 8 }]
    });
    expect(adapter.listFeeds().length).toBe(1);
    const reading = await adapter.readFeed('ETH/USD');
    expect(reading.pair).toBe('ETH/USD');
    expect(typeof reading.answer).toBe('bigint');
  });

  test('DefenderAdapter lists sentinels', () => {
    const adapter = new DefenderAdapter({ sentinels: [{ name: 'HighValue', network: 'ethereum', conditions: { eventSignature: 'Transfer(address,address,uint256)' } }] });
    expect(adapter.listSentinels().length).toBe(1);
  });

  test('computeCreate2Address deterministic output', () => {
    const addr = computeCreate2Address({
      deployer: '0x1234567890abcdef1234567890abcdef12345678',
      saltHex: '0x' + '00'.repeat(32),
      bytecode: '0x6001600155'
    });
    expect(addr).toMatch(/^0x[0-9a-f]{40}$/);
  });

  test('MulticallBatcher executes batch', async () => {
    const batcher = new MulticallBatcher('0xmulticall');
    const res = await batcher.executeBatch([{ target: '0xabc', callData: '0x12345678' }]);
    expect(res[0].success).toBe(true);
  });

  test('FireflyAdapter broadcast returns id', async () => {
    const adapter = new FireflyAdapter({ apiBaseUrl: 'http://localhost', namespace: 'ns1' });
    const result = await adapter.broadcast({ topic: 'test', message: 'hello' });
    expect(result.id).toMatch(/^ff-\d+$/);
  });

  test('FireflyAdapter online mode (offline fallback)', async () => {
    const adapter = new FireflyAdapter({ apiBaseUrl: 'http://localhost', namespace: 'ns1' }, true);
    const result = await adapter.broadcast({ topic: 'test', message: 'hello' });
    expect(result.id).toMatch(/^ff-\d+$/); // Falls back to offline simulation
  });

  test('BridgeAdapter sendMessage returns receipt', async () => {
    const adapter = new BridgeAdapter([{ provider: 'layerzero', sourceChainId: 1, destinationChainId: 137, messagingContract: '0xbridge' }]);
    const route = adapter.findRoute(1, 137);
    expect(route).toBeDefined();
    const receipt = await adapter.sendMessage(route!, '0xpayload');
    expect(receipt.delivered).toBe(true);
  });

  test('Chain138 validation detects issues', () => {
    const issues = validateChain138Config({ chainId: 138, governanceToken: { name: 'Gov', symbol: 'GOV', initialSupply: 0n, decimals: 18 } });
    expect(issues.length).toBeGreaterThan(0);
  });
});