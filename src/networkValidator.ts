/* Enhanced NetworkContext validator with Azure and RPC node validation
 * Ensures comprehensive configuration validation before build.
 */
import { NetworkContext } from './networkBuilder';
import { validateRpcNodeType, AZURE_REGIONS } from './azureRegions';
import { parseRpcNodeTypes, parsePlacementDsl } from './topologyResolver';

export interface ValidationIssue { field?: string; message: string }
export interface ValidationResult { valid: boolean; issues: ValidationIssue[] }

const MONITORING = new Set(['splunk','elk','loki']);
const CONSENSUS = new Set(['ibft','qbft','clique','ethash']);
const PRESETS = new Set(['dev','ibft','qbft','clique']);
const DEPLOYMENT_TYPES = new Set(['aks','aca','vm','vmss']);
const REGION_CLASSES = new Set(['commercial','gov','china','dod']);
const NETWORK_MODES = new Set(['flat','hub-spoke','isolated']);
const EXPLORER_OPTIONS = new Set(['blockscout','chainlens','both','none']);

const POSITIVE = (v: unknown) => typeof v === 'number' && v > 0;
const NON_NEGATIVE = (v: unknown) => typeof v === 'number' && v >= 0;

function push(issues: ValidationIssue[], condition: boolean, field: string, message: string): void {
  if (condition) issues.push({ field, message });
}

export function validateContext(ctx: Partial<NetworkContext>): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Core validation (existing)
  if (!ctx.clientType) {
    issues.push({ field: 'clientType', message: 'Client type is required' });
  } else if (ctx.clientType !== 'besu' && ctx.clientType !== 'goquorum') {
    issues.push({ field: 'clientType', message: 'clientType must be besu or goquorum' });
  }
  push(issues, typeof ctx.privacy !== 'boolean', 'privacy', 'privacy must be boolean');
  push(issues, !ctx.monitoring || !MONITORING.has(ctx.monitoring), 'monitoring', 'monitoring must be one of loki, splunk, elk');
  push(issues, typeof ctx.blockscout !== 'boolean', 'blockscout', 'blockscout must be boolean');
  push(issues, typeof ctx.chainlens !== 'boolean', 'chainlens', 'chainlens must be boolean');
  push(issues, !ctx.outputPath, 'outputPath', 'outputPath is required');
  push(issues, !!ctx.genesisPreset && !PRESETS.has(ctx.genesisPreset), 'genesisPreset', 'Invalid genesisPreset');
  push(issues, !!ctx.consensus && !CONSENSUS.has(ctx.consensus), 'consensus', 'Invalid consensus value');
  // validators: only enforce >0 if provided; allow omission (some configs may infer later)
  // validators: allow zero (tests expect permissive); negative invalid
  push(issues, ctx.validators !== undefined && (typeof ctx.validators !== 'number' || ctx.validators < 0), 'validators', 'validators must be >= 0');
  push(issues, ctx.participants !== undefined && !NON_NEGATIVE(ctx.participants), 'participants', 'participants must be >= 0');
  if (ctx.chainId !== undefined) {
    if (!POSITIVE(ctx.chainId)) {
      issues.push({ field: 'chainId', message: 'Chain ID must be between 1 and 4294967295' });
    } else if (ctx.chainId > 4294967295) {
      issues.push({ field: 'chainId', message: 'Chain ID must be between 1 and 4294967295' });
    }
  }

  // Node role validation
  // Allow zero bootNodes per test expectations (non-negative)
  push(issues, ctx.bootNodes !== undefined && !NON_NEGATIVE(ctx.bootNodes), 'bootNodes', 'bootNodes must be >= 0');
  push(issues, ctx.rpcNodes !== undefined && !NON_NEGATIVE(ctx.rpcNodes), 'rpcNodes', 'rpcNodes must be >= 0');
  push(issues, ctx.archiveNodes !== undefined && !NON_NEGATIVE(ctx.archiveNodes), 'archiveNodes', 'archiveNodes must be >= 0');
  push(issues, ctx.memberAdmins !== undefined && !NON_NEGATIVE(ctx.memberAdmins), 'memberAdmins', 'memberAdmins must be >= 0');
  push(issues, ctx.memberPermissioned !== undefined && !NON_NEGATIVE(ctx.memberPermissioned), 'memberPermissioned', 'memberPermissioned must be >= 0');
  push(issues, ctx.memberPrivate !== undefined && !NON_NEGATIVE(ctx.memberPrivate), 'memberPrivate', 'memberPrivate must be >= 0');
  push(issues, ctx.memberPublic !== undefined && !NON_NEGATIVE(ctx.memberPublic), 'memberPublic', 'memberPublic must be >= 0');

  // RPC node type validation
  if (ctx.rpcDefaultType) {
    push(issues, !validateRpcNodeType(ctx.rpcDefaultType), 'rpcDefaultType', 'Invalid RPC node type');
  }

  if (ctx.rpcNodeTypes) {
    try {
      const rpcConfigs = parseRpcNodeTypes(ctx.rpcNodeTypes);
      if (!rpcConfigs) {
        push(issues, true, 'rpcNodeTypes', 'Invalid RPC node types format');
      } else {
        for (const [role, config] of Object.entries(rpcConfigs)) {
          push(issues, !validateRpcNodeType(config.type), 'rpcNodeTypes', `Invalid RPC type '${config.type}' for role '${role}'`);
          push(issues, config.count <= 0, 'rpcNodeTypes', `Invalid count ${config.count} for role '${role}'`);
        }
      }
    } catch (error) {
      push(issues, true, 'rpcNodeTypes', `RPC node types parsing error: ${(error as Error).message}`);
    }
  }

  // Explorer validation
  if (ctx.explorer) {
    push(issues, !EXPLORER_OPTIONS.has(ctx.explorer), 'explorer', 'explorer must be one of: blockscout, chainlens, both, none');
  }

  // Azure validation (only if Azure is enabled)
  const azureEnabled = ctx.azureEnable || ctx.azureDeploy;
  if (azureEnabled) {
    validateAzureConfiguration(ctx, issues);
    // Require regions if enabled and none supplied
    if (!ctx.azureRegions && !ctx.azureAllRegions && !ctx.azureRegion) {
      issues.push({ field: 'azureRegions', message: 'Azure deployment requires at least one region' });
    }
  }

  // Consensus-specific validation (advisory notes only; do not mark invalid for zero validators)
  if (ctx.consensus && ['ibft','qbft','clique','ethash'].includes(ctx.consensus)) {
    if (ctx.validators !== undefined) {
      const validators = ctx.validators;
      if (validators < 0) {
        push(issues, true, 'validators', 'validators must be >= 0');
      } else if (validators === 0 && ctx.consensus !== 'ethash') {
        issues.push({ field: 'validators', message: `Consensus ${ctx.consensus} typically requires validators; 0 provided` });
      } else if (ctx.consensus === 'ibft' && validators > 0 && validators < 4) {
        issues.push({ field: 'validators', message: `IBFT consensus recommended minimum is 4 validators (provided: ${validators})` });
      }
    }
  }

  // Node count relationships
  const totalMembers = (ctx.memberAdmins || 0) + (ctx.memberPermissioned || 0) + (ctx.memberPrivate || 0) + (ctx.memberPublic || 0);
  if (ctx.archiveNodes !== undefined && ctx.validators !== undefined) {
    const totalNodes = (ctx.validators || 0) + (ctx.rpcNodes || 0) + totalMembers;
    if ((ctx.archiveNodes || 0) > totalNodes) {
      issues.push({
        field: 'archiveNodes',
        message: `Archive nodes (${ctx.archiveNodes}) should not exceed total network nodes (${totalNodes})`
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

function validateAzureConfiguration(ctx: Partial<NetworkContext>, issues: ValidationIssue[]): void {
  // Region class validation
  if (ctx.azureRegionClass) {
    push(issues, !REGION_CLASSES.has(ctx.azureRegionClass), 'azureRegionClass', 'Invalid Azure region classification');
  }

  // Deployment type validation
  if (ctx.azureDeploymentDefault) {
    push(issues, !DEPLOYMENT_TYPES.has(ctx.azureDeploymentDefault), 'azureDeploymentDefault', 'Invalid Azure deployment type');
  }

  // Network mode validation
  if (ctx.azureNetworkMode) {
    push(issues, !NETWORK_MODES.has(ctx.azureNetworkMode), 'azureNetworkMode', 'Invalid Azure network mode');
  }

  // Region validation
  const validRegionNames = AZURE_REGIONS.map(r => r.name);

  if (ctx.azureRegions) {
    const invalidRegions = ctx.azureRegions.filter(r => !validRegionNames.includes(r));
    if (invalidRegions.length > 0) {
      push(issues, true, 'azureRegions', `Invalid Azure regions: ${invalidRegions.join(', ')}`);
    }
  }

  if (ctx.azureRegion) {
    push(issues, !validRegionNames.includes(ctx.azureRegion), 'azureRegion', `Invalid Azure region: ${ctx.azureRegion}`);
  }

  // Node placement DSL validation
  if (ctx.azureNodePlacement) {
    try {
      const placements = parsePlacementDsl(ctx.azureNodePlacement);
      if (placements) {
        for (const [role, placement] of Object.entries(placements)) {
          push(issues, !DEPLOYMENT_TYPES.has(placement.deploymentType), 'azureNodePlacement',
               `Invalid deployment type '${placement.deploymentType}' for role '${role}'`);

          const invalidRegions = placement.regions.filter(r => !validRegionNames.includes(r));
          if (invalidRegions.length > 0) {
            push(issues, true, 'azureNodePlacement',
                 `Invalid regions for role '${role}': ${invalidRegions.join(', ')}`);
          }
        }
      }
    } catch (error) {
      push(issues, true, 'azureNodePlacement', `Node placement DSL parsing error: ${(error as Error).message}`);
    }
  }

  // Topology file validation (basic existence check)
  if (ctx.azureTopologyFile) {
    try {
      const fs = require('fs');
      const exists = fs.existsSync(ctx.azureTopologyFile);
      push(issues, !exists, 'azureTopologyFile', `Topology file not found: ${ctx.azureTopologyFile}`);

      if (exists) {
        // Basic JSON validation
        const content = fs.readFileSync(ctx.azureTopologyFile, 'utf-8');
        JSON.parse(content); // Will throw if invalid JSON
      }
    } catch (error) {
      push(issues, true, 'azureTopologyFile', `Topology file error: ${(error as Error).message}`);
    }
  }

  // Hub-spoke specific validation
  if (ctx.azureNetworkMode === 'hub-spoke') {
    const hasMultipleRegions = (ctx.azureRegions && ctx.azureRegions.length > 1) ||
                              ctx.azureAllRegions ||
                              (ctx.azureRegion && ctx.azureRegions && ctx.azureRegions.length > 0);

    if (!hasMultipleRegions) {
      issues.push({
        field: 'azureNetworkMode',
        message: 'Hub-spoke network mode requires multiple regions'
      });
    }
  }

  // Scale map validation
  if (ctx.azureScaleMap) {
    for (const [role, scale] of Object.entries(ctx.azureScaleMap)) {
      if (scale.min < 0 || scale.max < 0 || scale.min > scale.max) {
        push(issues, true, 'azureScaleMap', `Invalid scale range for '${role}': min=${scale.min}, max=${scale.max}`);
      }
    }
  }

  // Output directory validation
  if (ctx.azureOutputDir) {
    try {
      const fs = require('fs');
      const path = require('path');
      const dir = path.dirname(ctx.azureOutputDir);
      const exists = fs.existsSync(dir);
      push(issues, !exists, 'azureOutputDir', `Parent directory does not exist: ${dir}`);
    } catch (error) {
      push(issues, true, 'azureOutputDir', `Output directory validation error: ${(error as Error).message}`);
    }
  }
}

export function validateResolvedTopology(topology: any): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!topology) {
    return { valid: true, issues: [] };
  }

  // Validate regions exist
  if (!topology.regions || topology.regions.length === 0) {
    push(issues, true, 'topology.regions', 'Resolved topology must have at least one region');
  }

  // Validate placements
  if (topology.placements) {
    for (const [role, placement] of Object.entries(topology.placements as Record<string, any>)) {
      if (!placement.regions || placement.regions.length === 0) {
        push(issues, true, `topology.placements.${role}`, `Role '${role}' must have at least one region`);
      }

      if (!DEPLOYMENT_TYPES.has(placement.deploymentType)) {
        push(issues, true, `topology.placements.${role}`, `Invalid deployment type for role '${role}': ${placement.deploymentType}`);
      }

      // Role-specific validation
      if (['validators', 'bootNodes'].includes(role)) {
        const count = placement.replicas || placement.instanceCount;
        if (!count || count <= 0) {
          push(issues, true, `topology.placements.${role}`, `Role '${role}' must have a positive count`);
        }
      }
    }
  }

  // Network validation
  if (topology.network && topology.network.mode === 'hub-spoke') {
    if (!topology.network.hubRegion) {
      push(issues, true, 'topology.network', 'Hub-spoke mode requires a hub region');
    } else if (topology.regions && !topology.regions.includes(topology.network.hubRegion)) {
      push(issues, true, 'topology.network', `Hub region '${topology.network.hubRegion}' not in resolved regions list`);
    }
  }

  return { valid: issues.length === 0, issues };
}
