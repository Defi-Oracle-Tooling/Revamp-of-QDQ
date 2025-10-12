/**
 * Registry of Layer 2 networks
 */

export interface L2NetworkMeta {
  name: string;
  chainId: number;
  rollupType: 'optimistic' | 'zk';
  rpcUrl: string;
  explorer?: string;
}

export const L2_NETWORKS: L2NetworkMeta[] = [
  { name: 'Arbitrum One', chainId: 42161, rollupType: 'optimistic', rpcUrl: 'https://arbitrum.example', explorer: 'https://arbiscan.io' },
  { name: 'Optimism', chainId: 10, rollupType: 'optimistic', rpcUrl: 'https://optimism.example', explorer: 'https://optimistic.etherscan.io' },
  { name: 'Polygon zkEVM', chainId: 1101, rollupType: 'zk', rpcUrl: 'https://zkevm.example', explorer: 'https://zkevm.polygonscan.com' },
  { name: 'Starknet', chainId: 234485942, rollupType: 'zk', rpcUrl: 'https://starknet.example' }
];

export function listL2Networks(): L2NetworkMeta[] { return L2_NETWORKS; }
