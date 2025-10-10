/**
 * Protocol abstraction for network & migration verification.
 */
export interface RpcClient {
  endpoint: string;
  request<T=unknown>(method: string, params?: any[]): Promise<T>;
}

export interface HealthStatus {
  blockNumberHex: string;
  blockNumber: number;
  syncing: boolean;
}

export async function fetchBlockNumber(client: RpcClient): Promise<number> {
  const hex = await client.request<string>('eth_blockNumber');
  return parseInt(hex, 16);
}

export async function rpcHealth(client: RpcClient): Promise<HealthStatus> {
  const blockHex = await client.request<string>('eth_blockNumber');
  // eth_syncing returns false or an object
  const syncResult = await client.request<false | Record<string, unknown>>('eth_syncing');
  return { blockNumberHex: blockHex, blockNumber: parseInt(blockHex, 16), syncing: syncResult !== false };
}

export class SimpleRpcClient implements RpcClient {
  constructor(public endpoint: string) {}
  async request<T=unknown>(method: string, params: any[] = []): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const raw: unknown = await res.json();
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('RPC response not an object');
    }
    const json = raw as { result?: T; error?: { message?: string } };
    if (json.error) throw new Error(json.error.message || 'RPC error');
    if (json.result === undefined) throw new Error('RPC missing result');
    return json.result;
  }
}