/*
 * Phase 1 Genesis Factory (scaffolding)
 * This module will evolve to generate Besu / GoQuorum genesis configurations
 * based on NetworkContext presets (genesisPreset, consensus, validators, chainId, etc.).
 *
 * Strategy:
 *  - Provide a stable function signature generateGenesis(context)
 *  - Return an object with chain configuration + mock alloc for simulation
 *  - Future: write to templates directory before rendering, or inject dynamic
 *    values into a dedicated template path.
 */
import { NetworkContext } from "../networkBuilder";

export interface GeneratedGenesis {
  filename: string; // suggested output filename
  content: string;  // raw JSON string (pretty formatted)
}

export function generateGenesis(context: NetworkContext): GeneratedGenesis | undefined {
  // Only act if user specified a preset explicitly (Phase 1 opt-in)
  if (!context.genesisPreset && !context.consensus) {
    return undefined;
  }

  const derivedConsensus: NetworkContext["consensus"] = context.consensus || (context.genesisPreset ? presetToConsensus(context.genesisPreset) : undefined);
  if (!derivedConsensus) {
    return undefined;
  }
  const chainId = context.chainId || defaultChainIdFor(derivedConsensus);
  const validators = context.validators || 4;

  interface MutableGenesis {
    config: Record<string, unknown>;
    alloc: Record<string, unknown>;
    difficulty: string;
    gasLimit: string;
    timestamp: string;
    extraData?: string;
  }

  const base: MutableGenesis = {
    config: {
      chainId,
      // Additional fields dependent on client type & consensus will be added later.
    },
    alloc: {},
    // placeholder data; real templates will derive timestamp / extraData
    difficulty: "0x1",
    gasLimit: "0x1fffffffffffff",
    timestamp: "0x0"
  };

  // Insert consensus specific markers (placeholder logic)
  switch (derivedConsensus) {
    case "ibft":
    case "qbft":
      base.config[derivedConsensus] = {
        epochLength: 30000,
        blockperiodseconds: 2
      };
      base.extraData = `IBFT_PLACEHOLDER_${validators}`;
      break;
    case "clique":
      base.config.clique = { period: 5, epoch: 30000 };
      base.extraData = `CLIQUE_PLACEHOLDER_${validators}`;
      break;
    case "ethash":
      // minimal ethash config
      break;
  }

  return {
    filename: `${derivedConsensus}-genesis.json`,
    content: JSON.stringify(base, null, 2)
  };
}

function presetToConsensus(preset: string): NetworkContext["consensus"] {
  switch (preset) {
    case "ibft": return "ibft";
    case "qbft": return "qbft";
    case "clique": return "clique";
    default: return "ibft"; // dev fallback
  }
}

function defaultChainIdFor(consensus: string): number {
  switch (consensus) {
    case "ibft": return 1337;
    case "qbft": return 1338;
    case "clique": return 1339;
    case "ethash": return 1340;
    default: return 1337;
  }
}
