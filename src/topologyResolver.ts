/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as fs from 'fs';
import { NetworkContext } from './networkBuilder';
import {
  getRegionsByClassification,
  resolveRegionExclusions,
  AZURE_REGIONS,
  RpcNodeType,
  getRpcCapabilities,
  validateRpcNodeType,
  RpcCapabilities
} from './azureRegions';

export interface RpcNodeConfig {
  type: RpcNodeType;
  count: number;
  capabilities?: Partial<RpcCapabilities>;
  deploymentType?: 'aks' | 'aca' | 'vm' | 'vmss';
  regions?: string[];
  vmSize?: string;
  scale?: { min: number; max: number };
}

export interface RolePlacement {
  deploymentType: 'aks' | 'aca' | 'vm' | 'vmss';
  regions: string[];
  replicas?: number;
  instanceCount?: number;
  vmSize?: string;
  nodeSize?: string;
  scale?: { min: number; max: number };
  // RPC-specific
  rpcType?: RpcNodeType;
  capabilities?: RpcCapabilities;
}

export interface ResolvedAzureTopology {
  regions: string[];
  placements: Record<string, RolePlacement>;
  tags?: Record<string, string>;
  network?: {
    mode: string;
    hubRegion?: string;
    vnetCidr?: string;
  };
}

export interface TopologyFile {
  strategy?: 'single' | 'multi-select' | 'all-minus-excludes';
  classification?: 'commercial' | 'gov' | 'china' | 'dod';
  regions?: string[];
  excludeRegions?: string[];
  deploymentDefault?: 'aks' | 'aca' | 'vm' | 'vmss';
  placements?: {
    validators?: {
      deploymentType?: string;
      regions?: string[];
      replicas?: number;
      nodeSize?: string;
      vmSize?: string;
    };
    bootNodes?: {
      deploymentType?: string;
      regions?: string[];
      instanceCount?: number;
      vmSize?: string;
    };
    rpcNodes?: {
      [key: string]: {
        type?: RpcNodeType;
        deploymentType?: string;
        regions?: string[];
        count?: number;
        scale?: { min: number; max: number };
        capabilities?: Partial<RpcCapabilities>;
        vmSize?: string;
      };
    };
    archiveNodes?: {
      deploymentType?: string;
      regions?: string[];
      instanceCount?: number;
      vmSize?: string;
    };
    memberAdmins?: {
      deploymentType?: string;
      regions?: string[];
      instanceCount?: number;
      vmSize?: string;
    };
    memberPermissioned?: {
      deploymentType?: string;
      regions?: string[];
      instanceCount?: number;
      vmSize?: string;
    };
    memberPrivate?: {
      deploymentType?: string;
      regions?: string[];
      instanceCount?: number;
      vmSize?: string;
    };
    memberPublic?: {
      deploymentType?: string;
      regions?: string[];
      instanceCount?: number;
      vmSize?: string;
    };
  };
  tags?: Record<string, string>;
  network?: {
    mode?: string;
    hubRegion?: string;
    vnetCidr?: string;
  };
}

export function parseRpcNodeTypes(raw?: string): Record<string, RpcNodeConfig> | undefined {
  if (!raw) return undefined;

  const configs: Record<string, RpcNodeConfig> = {};

  // Format: role1:type1:count1;role2:type2:count2
  for (const segment of raw.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(':');
    if (parts.length < 3) continue;

    const [role, typeStr, countStr] = parts;
    const count = parseInt(countStr, 10);

    if (!role || !typeStr || isNaN(count) || count <= 0) continue;
    if (!validateRpcNodeType(typeStr)) continue;

    configs[role] = {
      type: typeStr,
      count
    };
  }

  return Object.keys(configs).length > 0 ? configs : undefined;
}

export function parsePlacementDsl(raw?: string): Record<string, { deploymentType: string; regions: string[] }> | undefined {
  if (!raw) return undefined;

  const placements: Record<string, { deploymentType: string; regions: string[] }> = {};

  // Format: role:deployType:region+region2;role:deployType:region
  for (const segment of raw.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const [role, deployType, regionList] = trimmed.split(':');
    if (!role || !deployType || !regionList) continue;

    const regions = regionList.split('+').map(r => r.trim()).filter(Boolean);
    if (regions.length === 0) continue;

    placements[role] = { deploymentType: deployType, regions };
  }

  return Object.keys(placements).length > 0 ? placements : undefined;
}

export function resolveAzureTopology(context: NetworkContext): ResolvedAzureTopology | undefined {
  // Early exit if Azure not enabled
  if (!context.azureEnable && !context.azureDeploy) {
    return undefined;
  }

  let resolvedRegions: string[] = [];
  const placements: Record<string, RolePlacement> = {};
  let tags: Record<string, string> | undefined;
  let network: { mode: string; hubRegion?: string; vnetCidr?: string } | undefined;

  // 1. Load topology file if specified
  if (context.azureTopologyFile) {
    try {
      const fileContent = fs.readFileSync(context.azureTopologyFile, 'utf-8');
      const topology: TopologyFile = JSON.parse(fileContent) as TopologyFile;

      return resolveTopologyFromFile(topology, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load topology file ${context.azureTopologyFile}: ${errorMessage}`);
    }
  }

  // 2. Resolve regions
  resolvedRegions = resolveRegions(context);

  // 3. Parse placement DSL if provided
  const placementDsl = parsePlacementDsl(context.azureNodePlacement);

  // 4. Parse RPC node types
  const rpcConfigs = parseRpcNodeTypes(context.rpcNodeTypes);

  // 5. Build placements for each role
  const defaultDeployment: 'aks' | 'aca' | 'vm' | 'vmss' = context.azureDeploymentDefault || 'aks';
  const firstRegion = resolvedRegions[0];

  // Validators
  if ((context.validators || 0) > 0) {
    const placement = placementDsl?.validators || { deploymentType: defaultDeployment, regions: [firstRegion] };
    placements.validators = {
      deploymentType: placement.deploymentType as 'aks' | 'aca' | 'vm' | 'vmss',
      regions: placement.regions.length > 0 ? placement.regions : [firstRegion],
      replicas: context.validators,
      vmSize: context.azureSizeMap?.['validators'],
      nodeSize: context.azureSizeMap?.['validators']
    };
  }

  // Boot nodes
  if ((context.bootNodes || 0) > 0) {
    const placement = placementDsl?.bootNodes || { deploymentType: defaultDeployment, regions: [firstRegion] };
    placements.bootNodes = {
      deploymentType: placement.deploymentType as 'aks' | 'aca' | 'vm' | 'vmss',
      regions: placement.regions.length > 0 ? placement.regions : [firstRegion],
      instanceCount: context.bootNodes || 0,
      vmSize: context.azureSizeMap?.['bootNodes']
    };
  }

  // RPC nodes - handle both simple count and detailed configs
  if (rpcConfigs) {
    // Use detailed RPC configuration
    for (const [roleName, config] of Object.entries(rpcConfigs)) {
      const placement = (placementDsl as any)?.[roleName] || { deploymentType: defaultDeployment, regions: [firstRegion] };
      const capabilities = getRpcCapabilities(config.type, config.capabilities);

      placements[roleName] = {
        deploymentType: (config.deploymentType || placement.deploymentType) as 'aks' | 'aca' | 'vm' | 'vmss',
        regions: config.regions || placement.regions || [firstRegion],
        instanceCount: config.count,
        rpcType: config.type,
        capabilities,
        vmSize: config.vmSize || context.azureSizeMap?.[roleName],
        scale: config.scale || context.azureScaleMap?.[roleName]
      };
    }
  } else if ((context.rpcNodes || 0) > 0) {
    // Simple RPC node configuration
    const placement = (placementDsl as any)?.rpcNodes || { deploymentType: defaultDeployment, regions: [firstRegion] };
    const rpcType: RpcNodeType = context.rpcDefaultType || 'standard';
    const capabilities = getRpcCapabilities(rpcType);

    placements.rpcNodes = {
      deploymentType: placement.deploymentType as 'aks' | 'aca' | 'vm' | 'vmss',
      regions: placement.regions.length > 0 ? placement.regions : [firstRegion],
      instanceCount: context.rpcNodes || 0,
      rpcType,
      capabilities,
      vmSize: context.azureSizeMap?.['rpcNodes'],
      scale: context.azureScaleMap?.['rpcNodes']
    };
  }

  // Archive nodes
  if ((context.archiveNodes || 0) > 0) {
    const placement = (placementDsl as any)?.archiveNodes || { deploymentType: defaultDeployment, regions: [firstRegion] };
    placements.archiveNodes = {
      deploymentType: placement.deploymentType as 'aks' | 'aca' | 'vm' | 'vmss',
      regions: placement.regions.length > 0 ? placement.regions : [firstRegion],
      instanceCount: context.archiveNodes || 0,
      vmSize: context.azureSizeMap?.['archiveNodes']
    };
  }

  // Member nodes
  const memberRoles = ['memberAdmins', 'memberPermissioned', 'memberPrivate', 'memberPublic'] as const;
  for (const role of memberRoles) {
    const count = (context as any)[role] || 0;
    if (count > 0) {
      const placement = (placementDsl as any)?.[role] || { deploymentType: defaultDeployment, regions: [firstRegion] };
      placements[role] = {
        deploymentType: placement.deploymentType as 'aks' | 'aca' | 'vm' | 'vmss',
        regions: placement.regions.length > 0 ? placement.regions : [firstRegion],
        instanceCount: count,
        vmSize: context.azureSizeMap?.[role]
      };
    }
  }

  // Tags
  if (context.azureTags) {
    tags = { ...context.azureTags } as Record<string, string>;
  }

  // Network configuration
  if (context.azureNetworkMode) {
    network = {
      mode: context.azureNetworkMode,
      vnetCidr: '10.200.0.0/16' // Default CIDR
    };

    if (context.azureNetworkMode === 'hub-spoke' && resolvedRegions.length > 0) {
      network.hubRegion = resolvedRegions[0];
    }
  }

  return {
    regions: resolvedRegions,
    placements,
    tags,
    network
  };
}

function resolveRegions(context: NetworkContext): string[] {
  let regions: string[] = [];

  // Priority 1: Explicit regions list
  if (context.azureRegions && context.azureRegions.length > 0) {
    regions = [...context.azureRegions];
  }
  // Priority 2: Legacy single region
  else if (context.azureRegion) {
    regions = [context.azureRegion];
  }
  // Priority 3: All regions strategy
  else if (context.azureAllRegions) {
    const classification = context.azureRegionClass || 'commercial';
    regions = getRegionsByClassification(classification);
  }
  // Default: eastus
  else {
    regions = ['eastus'];
  }

  // Apply exclusions
  if (context.azureRegionExclude && context.azureRegionExclude.length > 0) {
    const exclusions = resolveRegionExclusions(context.azureRegionExclude);
    regions = regions.filter(r => !exclusions.includes(r));
  }

  // Validate all regions exist
  const validRegions = AZURE_REGIONS.map(r => r.name);
  const invalidRegions = regions.filter(r => !validRegions.includes(r));
  if (invalidRegions.length > 0) {
    throw new Error(`Invalid Azure regions: ${invalidRegions.join(', ')}`);
  }

  return regions;
}

function resolveTopologyFromFile(topology: TopologyFile, context: NetworkContext): ResolvedAzureTopology {
  let regions: string[] = [];

  // Resolve regions from file
  if (topology.strategy === 'all-minus-excludes') {
    const classification = topology.classification || 'commercial';
    regions = getRegionsByClassification(classification);

    if (topology.excludeRegions) {
      const exclusions = resolveRegionExclusions(topology.excludeRegions);
      regions = regions.filter(r => !exclusions.includes(r));
    }
  } else if (topology.regions) {
    regions = [...topology.regions];
  } else {
    regions = ['eastus']; // Default
  }

  const placements: Record<string, RolePlacement> = {};
  const defaultDeployment = topology.deploymentDefault || context.azureDeploymentDefault || 'aks';

  // Process placements from file
  if (topology.placements) {
    const { placements: filePlacements } = topology;

    // Validators
    if (filePlacements.validators) {
      const vp = filePlacements.validators;
      placements.validators = {
        deploymentType: (vp.deploymentType || defaultDeployment) as 'aks' | 'aca' | 'vm' | 'vmss',
        regions: vp.regions || [regions[0]],
        replicas: vp.replicas || context.validators || 4,
        vmSize: vp.vmSize || vp.nodeSize
      };
    }

    // Boot nodes
    if (filePlacements.bootNodes) {
      const bp = filePlacements.bootNodes;
      placements.bootNodes = {
        deploymentType: (bp.deploymentType || defaultDeployment) as 'aks' | 'aca' | 'vm' | 'vmss',
        regions: bp.regions || [regions[0]],
        instanceCount: bp.instanceCount || context.bootNodes || 1,
        vmSize: bp.vmSize
      };
    }

    // RPC nodes from file
    if (filePlacements.rpcNodes) {
      for (const [roleName, rpcConfig] of Object.entries(filePlacements.rpcNodes)) {
        const rpcType = rpcConfig.type || 'standard';
        const capabilities = getRpcCapabilities(rpcType, rpcConfig.capabilities);

        placements[roleName] = {
          deploymentType: (rpcConfig.deploymentType || defaultDeployment) as 'aks' | 'aca' | 'vm' | 'vmss',
          regions: rpcConfig.regions || [regions[0]],
          instanceCount: rpcConfig.count || 1,
          rpcType,
          capabilities,
          vmSize: rpcConfig.vmSize,
          scale: rpcConfig.scale as { min: number; max: number } | undefined
        };
      }
    }

    // Other role types
    const otherRoles = ['archiveNodes', 'memberAdmins', 'memberPermissioned', 'memberPrivate', 'memberPublic'] as const;
    for (const role of otherRoles) {
      const roleConfig = filePlacements[role];
      if (roleConfig) {
        placements[role] = {
          deploymentType: (roleConfig.deploymentType || defaultDeployment) as 'aks' | 'aca' | 'vm' | 'vmss',
          regions: roleConfig.regions || [regions[0]],
          instanceCount: roleConfig.instanceCount || 1,
          vmSize: roleConfig.vmSize
        };
      }
    }
  }

  return {
    regions,
    placements,
    tags: topology.tags,
    network: topology.network ? {
      mode: topology.network.mode || 'flat',
      hubRegion: topology.network.hubRegion,
      vnetCidr: topology.network.vnetCidr
    } : undefined
  };
}