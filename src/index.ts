import { rootQuestion } from "./questions";
import { QuestionRenderer } from "./questionRenderer";
import { buildNetwork, NetworkContext } from "./networkBuilder";
import { validateContext } from "./networkValidator";
import { resolveRegionExclusions } from "./azureRegions";
import yargs = require('yargs/yargs');
import chalk from "chalk";

export async function main(): Promise<void> {
    if (process.platform === "win32") {
        console.error(chalk.red(
            "Unfortunately this tool is not compatible with Windows at the moment.\n" +
            "We recommend running it under Windows Subsystem For Linux 2 with Docker Desktop.\n" +
            "Please visit the following pages for installation instructions.\n\n" +
            "https://docs.microsoft.com/en-us/windows/wsl/install-win10\n" +
            "https://docs.docker.com/docker-for-windows/wsl/"
        ));
        process.exit(1);
    }

    let answers = {};

    if(process.argv.slice(2).length > 0){
      // Parse CLI flags (interactive path below retains legacy behavior)
      const args = await yargs(process.argv.slice(2)).options({
        clientType: { type: 'string', demandOption: true, choices:['besu','goquorum'], describe: 'Ethereum client to use.' },
        privacy: { type: 'boolean', demandOption: true, default: false, describe: 'Enable support for private transactions' },
        monitoring: { type: 'string', demandOption: false, default: 'loki', choices: ['loki','splunk','elk'], describe: 'Monitoring / logging stack selection.' },
        blockscout: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Blockscout explorer.' },
        chainlens: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Chainlens explorer.' },
        outputPath: { type: 'string', demandOption: false, default: './quorum-test-network', describe: 'Location for config files.'},
        genesisPreset: { type: 'string', demandOption: false, choices: ['dev','ibft','qbft','clique'], describe: 'Genesis configuration preset (Phase 1 experimental).'},
        validators: { type: 'number', demandOption: false, default: 4, describe: 'Validator node count (consensus dependent).'},
        participants: { type: 'number', demandOption: false, default: 3, describe: 'Non-validator participant node count.'},
        chainId: { type: 'number', demandOption: false, describe: 'Explicit Chain ID override.' },
        consensus: { type: 'string', demandOption: false, choices: ['ibft','qbft','clique','ethash'], describe: 'Consensus mechanism selection (overrides preset if set).'},

        // Enhanced node role flags
        bootNodes: { type: 'number', demandOption: false, default: 1, describe: 'Count of dedicated boot nodes (experimental).' },
        rpcNodes: { type: 'number', demandOption: false, default: 1, describe: 'Count of RPC-serving non-validator nodes.' },
        archiveNodes: { type: 'number', demandOption: false, default: 0, describe: 'Count of archive nodes (full history).' },
        memberAdmins: { type: 'number', demandOption: false, default: 0, describe: 'Admin member nodes (governance/policy).' },
        memberPermissioned: { type: 'number', demandOption: false, default: 0, describe: 'Permissioned application member nodes.' },
        memberPrivate: { type: 'number', demandOption: false, default: 0, describe: 'Private transaction focus member nodes.' },
        memberPublic: { type: 'number', demandOption: false, default: 0, describe: 'Public interface member nodes.' },

        // Enhanced RPC configuration
        rpcDefaultType: { type: 'string', demandOption: false, default: 'standard', choices: ['standard','archive','graphql','websocket','admin','trace','full'], describe: 'Default RPC node type with capability preset.' },
        rpcNodeTypes: { type: 'string', demandOption: false, describe: 'RPC node type mapping (format: role1:type1:count1;role2:type2:count2). Example: api:standard:2;admin:admin:1;ws:websocket:1' },

        // Enhanced Azure flags
        azureEnable: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Azure deployment scaffold generation.' },
        azureAllRegions: { type: 'boolean', demandOption: false, default: false, describe: 'Use all regions of selected classification.' },
        azureRegions: { type: 'string', demandOption: false, describe: 'Comma-separated list of Azure regions (e.g. eastus,westus2).' },
        azureRegionExclude: { type: 'string', demandOption: false, describe: 'Exclude regions/countries (e.g. eastus,US,BR excludes eastus + all US & Brazil regions).' },
        azureRegionClass: { type: 'string', demandOption: false, default: 'commercial', choices: ['commercial','gov','china','dod'], describe: 'Azure region classification filter.' },
        azureDeploymentDefault: { type: 'string', demandOption: false, default: 'aks', choices: ['aks','aca','vm','vmss'], describe: 'Default deployment type for unspecified roles.' },
        azureNodePlacement: { type: 'string', demandOption: false, describe: 'Node placement DSL (format: role:deployType:region+region2). Example: validators:aks:eastus+westus2;rpc:aca:centralus' },
        azureTopologyFile: { type: 'string', demandOption: false, describe: 'Path to JSON topology file (overrides other azure placement flags).' },
        azureSizeMap: { type: 'string', demandOption: false, describe: 'VM/node size mapping (format: role=sku,role=sku). Example: validators=Standard_D4s_v5,rpc=Standard_D2s_v5' },
        azureScaleMap: { type: 'string', demandOption: false, describe: 'Scaling ranges (format: role=min:max,role=min:max). Example: rpc=2:6,validators=4:4' },
        azureTags: { type: 'string', demandOption: false, describe: 'Resource tags (format: key=value,key=value). Example: env=dev,owner=platform' },
        azureNetworkMode: { type: 'string', demandOption: false, default: 'flat', choices: ['flat','hub-spoke','isolated'], describe: 'Network topology pattern (experimental).' },
        azureOutputDir: { type: 'string', demandOption: false, default: './out/azure', describe: 'Output directory for generated Azure templates.' },
        azureDryInfra: { type: 'boolean', demandOption: false, default: false, describe: 'Generate only infrastructure templates (skip local docker assets).' },

        // Legacy Azure flags (for backward compatibility)
        azureDeploy: { type: 'boolean', demandOption: false, default: false, describe: 'DEPRECATED: use --azureEnable instead.' },
        azureRegion: { type: 'string', demandOption: false, describe: 'DEPRECATED: use --azureRegions instead.' },

        // Other infra
        cloudflareZone: { type: 'string', demandOption: false, describe: 'Cloudflare DNS zone (e.g. example.com).'},
        cloudflareApiTokenEnv: { type: 'string', demandOption: false, describe: 'Environment variable name that will contain Cloudflare API token.'},

        // Layout & behavior flags
        nodeLayoutFile: { type: 'string', demandOption: false, describe: 'Path to JSON layout file overriding node role counts.' },
        explorer: { type: 'string', demandOption: false, choices: ['blockscout','chainlens','both','none'], describe: 'Unified explorer selector (overrides individual explorer flags).' },
        validate: { type: 'boolean', demandOption: false, default: false, describe: 'Validate configuration only.' },
        noFileWrite: { type: 'boolean', demandOption: false, default: false, describe: 'Dry-run: validate & summarize layout without writing artifacts.' }
      }).argv;

      // Build base answers (non-Azure first for clarity)
      answers = {
        clientType: args.clientType,
        outputPath: args.outputPath,
        monitoring: args.monitoring,
        blockscout: args.blockscout,
        chainlens: args.chainlens,
        privacy: args.privacy,
        genesisPreset: args.genesisPreset,
        validators: args.validators,
        participants: args.participants,
        chainId: args.chainId,
        consensus: args.consensus,
        bootNodes: args.bootNodes,
        rpcNodes: args.rpcNodes,
        archiveNodes: args.archiveNodes,
        memberAdmins: args.memberAdmins,
        memberPermissioned: args.memberPermissioned,
        memberPrivate: args.memberPrivate,
        memberPublic: args.memberPublic,
        rpcDefaultType: args.rpcDefaultType,
        rpcNodeTypes: args.rpcNodeTypes,
        cloudflareZone: args.cloudflareZone,
        cloudflareApiTokenEnv: args.cloudflareApiTokenEnv,
        nodeLayoutFile: args.nodeLayoutFile,
        explorer: args.explorer,
        validate: args.validate,
        noFileWrite: args.noFileWrite
      } as any;

      const answersAny = answers as any;

      // Normalize & map Azure flags (produces canonical azureEnable + arrays/maps)
      Object.assign(answersAny, normalizeAzureFlags(args));

      // Explorer override logic (maps unified selector to booleans)
      if (answersAny.explorer) {
        switch (answersAny.explorer) {
          case 'none':
            answersAny.blockscout = false; answersAny.chainlens = false; break;
          case 'both':
            answersAny.blockscout = true; answersAny.chainlens = true; break;
          case 'blockscout':
            answersAny.blockscout = true; answersAny.chainlens = false; break;
          case 'chainlens':
            answersAny.blockscout = false; answersAny.chainlens = true; break;
        }
      }

      // Process country/region exclusions after normalization
      if (answersAny.azureRegionExclude) {
        const exclusions = resolveRegionExclusions(answersAny.azureRegionExclude);
        console.log(`Resolved region exclusions: ${exclusions.join(', ')}`);
        answersAny.azureRegionExclude = exclusions;
      }

    } else{
      const qr = new QuestionRenderer(rootQuestion);
      answers = await qr.render();
    }

    const validateFlag = (answers as { validate?: boolean }).validate === true;
    if (validateFlag) {
        const result = validateContext(answers as Partial<NetworkContext>);
        if (!result.valid) {
            const detail = result.issues.map(i => ` - ${i.field ?? 'unknown'}: ${i.message}`).join('\n');
            console.error(`Configuration validation failed:\n${detail}`);
            process.exit(1);
        }
        console.log("Configuration validation succeeded.");
    }

    // Dry-run mode check
    if ((answers as any).noFileWrite) {
        console.log('Dry-run mode (--noFileWrite): skipping artifact generation.');
        console.log('Resolved layout summary:');
        console.log(JSON.stringify({
          clientType: (answers as any).clientType,
          consensus: (answers as any).consensus,
          validators: (answers as any).validators,
          bootNodes: (answers as any).bootNodes,
          rpcNodes: (answers as any).rpcNodes,
          archiveNodes: (answers as any).archiveNodes,
          memberAdmins: (answers as any).memberAdmins,
          memberPermissioned: (answers as any).memberPermissioned,
          memberPrivate: (answers as any).memberPrivate,
          memberPublic: (answers as any).memberPublic,
          monitoring: (answers as any).monitoring,
          explorers: {
            blockscout: (answers as any).blockscout,
            chainlens: (answers as any).chainlens
          }
        }, null, 2));
        process.exit(0);
    }

    await buildNetwork(answers as NetworkContext);
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

// Helper parsing functions
function parseKeyValueMap(raw?: string): Record<string,string> | undefined {
    if (!raw) return undefined;
    const out: Record<string,string> = {};
    for (const part of raw.split(',')) {
        const [k,v] = part.split('=');
        if (k && v) out[k.trim()] = v.trim();
    }
    return out;
}

function parseScaleMap(raw?: string): Record<string,{min:number;max:number}> | undefined {
    if (!raw) return undefined;
    const out: Record<string,{min:number;max:number}> = {};
    for (const part of raw.split(',')) {
        const [k,r] = part.split('=');
        if (!k || !r) continue;
        const [minS,maxS] = r.split(':');
        const min = Number(minS); const max = Number(maxS);
        if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) continue;
        out[k.trim()] = {min,max};
    }
    return out;
}

// Normalize Azure-related flags (supports deprecated synonyms) without removing backward compatibility yet.
function normalizeAzureFlags(args: any) {
  const out: Record<string, any> = {};
  // Primary enable switch
  const deprecatedEnable = !!args.azureDeploy;
  const enable = !!args.azureEnable || deprecatedEnable;
  if (deprecatedEnable && !args.azureEnable) {
    console.warn('WARNING: --azureDeploy is deprecated and will be removed in a future release. Use --azureEnable.');
  }
  out.azureEnable = enable;

  // Regions
  let regions: string[] | undefined = args.azureRegions
    ? String(args.azureRegions).split(',').map((r: string) => r.trim()).filter(Boolean)
    : undefined;
  if (!regions && args.azureRegion) { // deprecated singular
    console.warn('WARNING: --azureRegion is deprecated. Use --azureRegions with a comma-separated list.');
    regions = [String(args.azureRegion).trim()];
  }
  if (regions) out.azureRegions = regions;

  // Region exclusions (raw; resolved later)
  if (args.azureRegionExclude) {
    out.azureRegionExclude = String(args.azureRegionExclude).split(',').map((r: string) => r.trim()).filter(Boolean);
  }

  // Simple pass-through fields
  out.azureAllRegions = args.azureAllRegions;
  out.azureRegionClass = args.azureRegionClass;
  out.azureDeploymentDefault = args.azureDeploymentDefault;
  out.azureNodePlacement = args.azureNodePlacement;
  out.azureTopologyFile = args.azureTopologyFile;
  out.azureSizeMap = parseKeyValueMap(args.azureSizeMap);
  out.azureScaleMap = parseScaleMap(args.azureScaleMap);
  out.azureTags = parseKeyValueMap(args.azureTags);
  out.azureNetworkMode = args.azureNetworkMode;
  out.azureOutputDir = args.azureOutputDir;
  out.azureDryInfra = args.azureDryInfra;

  // Keep legacy flags in output ONLY if explicitly set (for downstream modules still referencing them)
  if (args.azureDeploy !== undefined) out.azureDeploy = !!args.azureDeploy;
  if (args.azureRegion !== undefined) out.azureRegion = args.azureRegion;

  return out;
}

if (require.main === module) {
    // note: main returns a Promise<void>, but we don't need to do anything
    // special with it, so we use the void operator to indicate to eslint that
    // we left this dangling intentionally...
    try {
        void main();
    } catch (err) {
        const e = err as { stack?: string; message?: string } | undefined;
        if (e?.stack && process.argv.length >= 3 && process.argv[2] === "--stackTraceOnError") {
            console.error(`Fatal error: ${e.stack}`);
        } else if (e?.message) {
            console.error(`Fatal error: ${e.message}`);
        } else if (err) {
            console.error(`Fatal error: ${String(err)}`);
        } else {
            console.error("Fatal error: unknown");
        }
        process.exit(1);
    }
}
