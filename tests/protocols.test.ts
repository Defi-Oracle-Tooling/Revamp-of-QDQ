import { SimpleRpcClient, fetchBlockNumber, rpcHealth } from '../src/common/protocols';

describe('protocols', () => {
  const mockFetch = jest.fn();
  beforeAll(() => {
    (global as any).fetch = mockFetch;
  });
  beforeEach(() => mockFetch.mockReset());

  it('fetches block number', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ result: '0x10' }) });
    const c = new SimpleRpcClient('http://localhost');
    const bn = await fetchBlockNumber(c);
    expect(bn).toBe(16);
  });

  it('reports syncing state', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: '0x5' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ result: { startingBlock: '0x0' } }) });
    const c = new SimpleRpcClient('http://localhost');
    const health = await rpcHealth(c);
    expect(health.blockNumber).toBe(5);
    expect(health.syncing).toBe(true);
  });
});