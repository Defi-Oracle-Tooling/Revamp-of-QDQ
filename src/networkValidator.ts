/* Lightweight NetworkContext validator (Phase 3)
 * Avoids external deps. Ensures core invariants before build.
 */
import { NetworkContext } from './networkBuilder';

export interface ValidationIssue { field?: string; message: string }
export interface ValidationResult { valid: boolean; issues: ValidationIssue[] }

const MONITORING = new Set(['splunk','elk','loki']);
const CONSENSUS = new Set(['ibft','qbft','clique','ethash']);
const PRESETS = new Set(['dev','ibft','qbft','clique']);

function push(issues: ValidationIssue[], condition: boolean, field: string, message: string): void {
  if (condition) issues.push({ field, message });
}

export function validateContext(ctx: Partial<NetworkContext>): ValidationResult {
  const issues: ValidationIssue[] = [];
  push(issues, !ctx.clientType || (ctx.clientType !== 'besu' && ctx.clientType !== 'goquorum'), 'clientType', 'clientType must be besu or goquorum');
  push(issues, typeof ctx.privacy !== 'boolean', 'privacy', 'privacy must be boolean');
  push(issues, !ctx.monitoring || !MONITORING.has(ctx.monitoring), 'monitoring', 'monitoring must be one of loki, splunk, elk');
  push(issues, typeof ctx.blockscout !== 'boolean', 'blockscout', 'blockscout must be boolean');
  push(issues, typeof ctx.chainlens !== 'boolean', 'chainlens', 'chainlens must be boolean');
  push(issues, !ctx.outputPath, 'outputPath', 'outputPath is required');
  push(issues, !!ctx.genesisPreset && !PRESETS.has(ctx.genesisPreset), 'genesisPreset', 'Invalid genesisPreset');
  push(issues, !!ctx.consensus && !CONSENSUS.has(ctx.consensus), 'consensus', 'Invalid consensus value');
  push(issues, ctx.validators !== undefined && ctx.validators <= 0, 'validators', 'validators must be > 0');
  push(issues, ctx.participants !== undefined && ctx.participants < 0, 'participants', 'participants must be >= 0');
  push(issues, ctx.chainId !== undefined && ctx.chainId <= 0, 'chainId', 'chainId must be > 0');
  return { valid: issues.length === 0, issues };
}
