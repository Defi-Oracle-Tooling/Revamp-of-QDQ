export interface AzureRegionInfo {
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  classification: 'commercial' | 'gov' | 'china' | 'dod';
  geography: string;
  availabilityZones: number;
}

export const AZURE_REGIONS: AzureRegionInfo[] = [
  // US Commercial
  { name: 'eastus', displayName: 'East US', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 3 },
  { name: 'eastus2', displayName: 'East US 2', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 3 },
  { name: 'westus', displayName: 'West US', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 0 },
  { name: 'westus2', displayName: 'West US 2', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 3 },
  { name: 'westus3', displayName: 'West US 3', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 3 },
  { name: 'centralus', displayName: 'Central US', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 3 },
  { name: 'southcentralus', displayName: 'South Central US', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 3 },
  { name: 'northcentralus', displayName: 'North Central US', country: 'United States', countryCode: 'US', classification: 'commercial', geography: 'United States', availabilityZones: 0 },

  // Canada
  { name: 'canadacentral', displayName: 'Canada Central', country: 'Canada', countryCode: 'CA', classification: 'commercial', geography: 'Canada', availabilityZones: 3 },
  { name: 'canadaeast', displayName: 'Canada East', country: 'Canada', countryCode: 'CA', classification: 'commercial', geography: 'Canada', availabilityZones: 3 },

  // Europe
  { name: 'northeurope', displayName: 'North Europe', country: 'Ireland', countryCode: 'IE', classification: 'commercial', geography: 'Europe', availabilityZones: 3 },
  { name: 'westeurope', displayName: 'West Europe', country: 'Netherlands', countryCode: 'NL', classification: 'commercial', geography: 'Europe', availabilityZones: 3 },
  { name: 'uksouth', displayName: 'UK South', country: 'United Kingdom', countryCode: 'GB', classification: 'commercial', geography: 'United Kingdom', availabilityZones: 3 },
  { name: 'ukwest', displayName: 'UK West', country: 'United Kingdom', countryCode: 'GB', classification: 'commercial', geography: 'United Kingdom', availabilityZones: 0 },
  { name: 'francecentral', displayName: 'France Central', country: 'France', countryCode: 'FR', classification: 'commercial', geography: 'France', availabilityZones: 3 },
  { name: 'francesouth', displayName: 'France South', country: 'France', countryCode: 'FR', classification: 'commercial', geography: 'France', availabilityZones: 0 },
  { name: 'germanywestcentral', displayName: 'Germany West Central', country: 'Germany', countryCode: 'DE', classification: 'commercial', geography: 'Germany', availabilityZones: 3 },
  { name: 'switzerlandnorth', displayName: 'Switzerland North', country: 'Switzerland', countryCode: 'CH', classification: 'commercial', geography: 'Switzerland', availabilityZones: 3 },
  { name: 'norwayeast', displayName: 'Norway East', country: 'Norway', countryCode: 'NO', classification: 'commercial', geography: 'Norway', availabilityZones: 3 },
  { name: 'swedencentral', displayName: 'Sweden Central', country: 'Sweden', countryCode: 'SE', classification: 'commercial', geography: 'Sweden', availabilityZones: 3 },

  // Asia Pacific
  { name: 'eastasia', displayName: 'East Asia', country: 'Hong Kong SAR', countryCode: 'HK', classification: 'commercial', geography: 'Asia Pacific', availabilityZones: 3 },
  { name: 'southeastasia', displayName: 'Southeast Asia', country: 'Singapore', countryCode: 'SG', classification: 'commercial', geography: 'Asia Pacific', availabilityZones: 3 },
  { name: 'japaneast', displayName: 'Japan East', country: 'Japan', countryCode: 'JP', classification: 'commercial', geography: 'Japan', availabilityZones: 3 },
  { name: 'japanwest', displayName: 'Japan West', country: 'Japan', countryCode: 'JP', classification: 'commercial', geography: 'Japan', availabilityZones: 0 },
  { name: 'australiaeast', displayName: 'Australia East', country: 'Australia', countryCode: 'AU', classification: 'commercial', geography: 'Australia', availabilityZones: 3 },
  { name: 'australiasoutheast', displayName: 'Australia Southeast', country: 'Australia', countryCode: 'AU', classification: 'commercial', geography: 'Australia', availabilityZones: 0 },
  { name: 'koreacentral', displayName: 'Korea Central', country: 'South Korea', countryCode: 'KR', classification: 'commercial', geography: 'Korea', availabilityZones: 3 },
  { name: 'koreasouth', displayName: 'Korea South', country: 'South Korea', countryCode: 'KR', classification: 'commercial', geography: 'Korea', availabilityZones: 0 },

  // South America
  { name: 'brazilsouth', displayName: 'Brazil South', country: 'Brazil', countryCode: 'BR', classification: 'commercial', geography: 'Brazil', availabilityZones: 3 },

  // India
  { name: 'centralindia', displayName: 'Central India', country: 'India', countryCode: 'IN', classification: 'commercial', geography: 'India', availabilityZones: 3 },
  { name: 'southindia', displayName: 'South India', country: 'India', countryCode: 'IN', classification: 'commercial', geography: 'India', availabilityZones: 0 },
  { name: 'westindia', displayName: 'West India', country: 'India', countryCode: 'IN', classification: 'commercial', geography: 'India', availabilityZones: 0 },

  // UAE
  { name: 'uaenorth', displayName: 'UAE North', country: 'United Arab Emirates', countryCode: 'AE', classification: 'commercial', geography: 'United Arab Emirates', availabilityZones: 3 },

  // South Africa
  { name: 'southafricanorth', displayName: 'South Africa North', country: 'South Africa', countryCode: 'ZA', classification: 'commercial', geography: 'South Africa', availabilityZones: 3 },

  // China (separate cloud)
  { name: 'chinaeast', displayName: 'China East', country: 'China', countryCode: 'CN', classification: 'china', geography: 'China', availabilityZones: 0 },
  { name: 'chinanorth', displayName: 'China North', country: 'China', countryCode: 'CN', classification: 'china', geography: 'China', availabilityZones: 0 },
  { name: 'chinaeast2', displayName: 'China East 2', country: 'China', countryCode: 'CN', classification: 'china', geography: 'China', availabilityZones: 3 },
  { name: 'chinanorth2', displayName: 'China North 2', country: 'China', countryCode: 'CN', classification: 'china', geography: 'China', availabilityZones: 3 },

  // US Government
  { name: 'usgovvirginia', displayName: 'US Gov Virginia', country: 'United States', countryCode: 'US', classification: 'gov', geography: 'United States', availabilityZones: 3 },
  { name: 'usgovtexas', displayName: 'US Gov Texas', country: 'United States', countryCode: 'US', classification: 'gov', geography: 'United States', availabilityZones: 0 },
  { name: 'usgovarizona', displayName: 'US Gov Arizona', country: 'United States', countryCode: 'US', classification: 'gov', geography: 'United States', availabilityZones: 3 },

  // US DoD
  { name: 'usdodcentral', displayName: 'US DoD Central', country: 'United States', countryCode: 'US', classification: 'dod', geography: 'United States', availabilityZones: 0 },
  { name: 'usdodeast', displayName: 'US DoD East', country: 'United States', countryCode: 'US', classification: 'dod', geography: 'United States', availabilityZones: 0 }
];

export function getRegionsByClassification(classification: 'commercial' | 'gov' | 'china' | 'dod'): string[] {
  return AZURE_REGIONS
    .filter(r => r.classification === classification)
    .map(r => r.name);
}

export function getRegionsByCountryCode(countryCode: string): string[] {
  return AZURE_REGIONS
    .filter(r => r.countryCode.toLowerCase() === countryCode.toLowerCase())
    .map(r => r.name);
}

export function getRegionsByCountry(country: string): string[] {
  return AZURE_REGIONS
    .filter(r => r.country.toLowerCase() === country.toLowerCase())
    .map(r => r.name);
}

export function resolveRegionExclusions(exclusions: string[]): string[] {
  const regionsToExclude = new Set<string>();

  for (const exclusion of exclusions) {
    const trimmed = exclusion.trim();

    // Check if it's a direct region name
    if (AZURE_REGIONS.some(r => r.name === trimmed)) {
      regionsToExclude.add(trimmed);
      continue;
    }

    // Check if it's a country code (2-3 letters, uppercase)
    if (/^[A-Z]{2,3}$/.test(trimmed)) {
      const regionsByCode = getRegionsByCountryCode(trimmed);
      regionsByCode.forEach(r => regionsToExclude.add(r));
      continue;
    }

    // Check if it's a country name
    const regionsByCountry = getRegionsByCountry(trimmed);
    if (regionsByCountry.length > 0) {
      regionsByCountry.forEach(r => regionsToExclude.add(r));
    }
  }

  return Array.from(regionsToExclude);
}

export interface RpcCapabilities {
  eth: boolean;          // Standard Ethereum APIs (eth_*)
  web3: boolean;         // Web3 APIs (web3_*)
  net: boolean;          // Network APIs (net_*)
  admin: boolean;        // Admin APIs (admin_*)
  debug: boolean;        // Debug APIs (debug_*)
  trace: boolean;        // Trace APIs (trace_*)
  txpool: boolean;       // Transaction pool APIs (txpool_*)
  personal: boolean;     // Personal APIs (personal_*)
  miner: boolean;        // Mining APIs (miner_*, eth_mining)
  graphql: boolean;      // GraphQL endpoint
  websocket: boolean;    // WebSocket subscriptions
  archive: boolean;      // Full historical data access
}

export const RPC_NODE_TYPES = {
  standard: {
    name: 'Standard RPC',
    description: 'Basic JSON-RPC with standard Ethereum APIs',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: false, debug: false,
      trace: false, txpool: false, personal: false, miner: false,
      graphql: false, websocket: false, archive: false
    }
  },
  archive: {
    name: 'Archive RPC',
    description: 'Full historical data access with all standard APIs',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: false, debug: true,
      trace: true, txpool: false, personal: false, miner: false,
      graphql: false, websocket: false, archive: true
    }
  },
  graphql: {
    name: 'GraphQL RPC',
    description: 'GraphQL endpoint with flexible querying',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: false, debug: false,
      trace: false, txpool: false, personal: false, miner: false,
      graphql: true, websocket: false, archive: false
    }
  },
  websocket: {
    name: 'WebSocket RPC',
    description: 'Real-time subscriptions and standard RPC',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: false, debug: false,
      trace: false, txpool: false, personal: false, miner: false,
      graphql: false, websocket: true, archive: false
    }
  },
  admin: {
    name: 'Admin RPC',
    description: 'Administrative APIs for network management',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: true, debug: true,
      trace: false, txpool: true, personal: false, miner: false,
      graphql: false, websocket: false, archive: false
    }
  },
  trace: {
    name: 'Trace RPC',
    description: 'Transaction tracing and debugging capabilities',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: false, debug: true,
      trace: true, txpool: false, personal: false, miner: false,
      graphql: false, websocket: false, archive: false
    }
  },
  full: {
    name: 'Full RPC',
    description: 'All available APIs and capabilities enabled',
    defaultCapabilities: {
      eth: true, web3: true, net: true, admin: true, debug: true,
      trace: true, txpool: true, personal: true, miner: true,
      graphql: true, websocket: true, archive: true
    }
  }
} as const;

export type RpcNodeType = keyof typeof RPC_NODE_TYPES;

export function validateRpcNodeType(type: string): type is RpcNodeType {
  return type in RPC_NODE_TYPES;
}

export function getRpcCapabilities(type: RpcNodeType, overrides?: Partial<RpcCapabilities>): RpcCapabilities {
  const defaults = RPC_NODE_TYPES[type].defaultCapabilities;
  return { ...defaults, ...overrides };
}