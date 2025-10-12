/**
 * Chainlink Integration Scaffolding
 *
 * Provides interfaces and lightweight adapters for Chainlink services:
 * - Price Feeds (Data Feeds)
 * - VRF (Randomness)
 * - Automation (Keepers)
 * - CCIP (Cross-chain messaging)
 */

export type ChainlinkNetwork = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'bsc';

export interface PriceFeedDefinition {
  pair: string;              // e.g. ETH/USD
  address: string;           // Aggregator contract address
  decimals: number;          // Answer decimals
  heartbeatSeconds?: number; // Expected update interval
}

export interface VRFSubscriptionConfig {
  coordinator: string;
  keyHash: string;
  minConfirmations: number;
  callbackGasLimit: number;
  subscriptionId?: string;
}

export interface AutomationJobConfig {
  name: string;
  targetAddress: string;
  checkData?: string; // encoded input
  gasLimit?: number;
  cron?: string; // optional cron expression
}

export interface CCIPLaneConfig {
  sourceChain: ChainlinkNetwork;
  destinationChain: ChainlinkNetwork;
  routerAddress: string;
  maxGas?: number;
}

export interface ChainlinkConfig {
  network: ChainlinkNetwork;
  priceFeeds?: PriceFeedDefinition[];
  vrf?: VRFSubscriptionConfig;
  automation?: AutomationJobConfig[];
  ccip?: CCIPLaneConfig[];
}

export interface PriceFeedReading {
  pair: string;
  answer: bigint;
  timestamp: number;
  stale: boolean;
}

export class ChainlinkOracleAdapter {
  constructor(private cfg: ChainlinkConfig, private online = false) {}

  listFeeds(): PriceFeedDefinition[] {
    return this.cfg.priceFeeds || [];
  }

  /**
   * Read feed. If online mode enabled and address resembles an API endpoint (starts with http),
   * perform HTTP GET expecting JSON { answer: string|number, updatedAt: number }.
   * Otherwise use simulated value.
   */
  async readFeed(pair: string): Promise<PriceFeedReading> {
    const def = (this.cfg.priceFeeds || []).find(f => f.pair === pair);
    if (!def) throw new Error(`Unknown price feed pair: ${pair}`);
    const now = Math.floor(Date.now() / 1000);
    if (this.online && def.address.startsWith('http')) {
      try {
        const got = require('got');
        const resp = await got(def.address, { timeout: { request: 5000 } }).json();
        const rawAns = typeof resp.answer === 'string' ? BigInt(resp.answer) : BigInt(resp.answer ?? 0);
        const ts = typeof resp.updatedAt === 'number' ? resp.updatedAt : now;
        const stale = def.heartbeatSeconds ? (now - ts) > def.heartbeatSeconds : false;
        return { pair, answer: rawAns, timestamp: ts, stale };
      } catch (e) {
        // Fallback to simulated answer on failure
      }
    }
    const simulatedAnswer = 1234_560000n; // placeholder offline value
    const stale = def.heartbeatSeconds ? (now - def.heartbeatSeconds) > def.heartbeatSeconds : false;
    return { pair, answer: simulatedAnswer, timestamp: now, stale };
  }

  vrfConfig(): VRFSubscriptionConfig | undefined {
    return this.cfg.vrf;
  }
}
