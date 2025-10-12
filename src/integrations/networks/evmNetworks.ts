/**
 * Registry of EVM mainnet network metadata
 */

export interface EVMNetworkMeta {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer?: string;
  nativeCurrency: { symbol: string; decimals: number };
}

export const EVM_NETWORKS: EVMNetworkMeta[] = [
  { name: 'Ethereum', chainId: 1, rpcUrl: 'https://mainnet.example', explorer: 'https://etherscan.io', nativeCurrency: { symbol: 'ETH', decimals: 18 } },
  { name: 'Polygon', chainId: 137, rpcUrl: 'https://polygon.example', explorer: 'https://polygonscan.com', nativeCurrency: { symbol: 'MATIC', decimals: 18 } },
  { name: 'BSC', chainId: 56, rpcUrl: 'https://bsc.example', explorer: 'https://bscscan.com', nativeCurrency: { symbol: 'BNB', decimals: 18 } },
  { name: 'Avalanche', chainId: 43114, rpcUrl: 'https://avax.example', explorer: 'https://snowtrace.io', nativeCurrency: { symbol: 'AVAX', decimals: 18 } },
  { name: 'Fantom', chainId: 250, rpcUrl: 'https://fantom.example', explorer: 'https://ftmscan.com', nativeCurrency: { symbol: 'FTM', decimals: 18 } }
];

export function getNetworkByChainId(chainId: number): EVMNetworkMeta | undefined {
  return EVM_NETWORKS.find(n => n.chainId === chainId);
}
