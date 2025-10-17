/**
 * ChainID 138 (DeFi Oracle) optimization and governance scaffolding
 */

export interface Chain138GovernanceTokenConfig {
  name: string;
  symbol: string;
  initialSupply: bigint; // requires ES2020 target
  decimals: number;
}

export interface Chain138OracleFeedConfig {
  id: string;
  source: string; // off-chain or on-chain reference
  updateIntervalSeconds: number;
}

export interface Chain138Config {
  chainId: 138;
  governanceToken?: Chain138GovernanceTokenConfig;
  oracleFeeds?: Chain138OracleFeedConfig[];
  feeRecipient?: string;
}

export function validateChain138Config(cfg: Chain138Config): string[] {
  const issues: string[] = [];
  if (cfg.governanceToken && cfg.governanceToken.initialSupply <= 0n) {
    issues.push('Governance token initial supply must be > 0');
  }
  if (cfg.oracleFeeds) {
    for (const f of cfg.oracleFeeds) {
      if (f.updateIntervalSeconds < 10) issues.push(`Feed ${f.id} update interval too short (<10s)`);
    }
  }
  return issues;
}
