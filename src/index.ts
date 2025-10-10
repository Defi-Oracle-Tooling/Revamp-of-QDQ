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
    // Add agent-specific CLI flags and workflows
    const agentFlags = {
      infra: { type: 'boolean', description: 'Enable Infra agent workflow' },
      network: { type: 'boolean', description: 'Enable Network agent workflow' },
      validation: { type: 'boolean', description: 'Enable Validation agent workflow' },
      documentation: { type: 'boolean', description: 'Enable Documentation agent workflow' }
    };

    if(process.argv.slice(2).length > 0){
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

        // Legacy Azure flags (backward compatibility - will be removed in future version)
        azureDeploy: { type: 'boolean', demandOption: false, default: false, describe: 'DEPRECATED: use --azureEnable instead. This flag will be removed in v2.0.' },
        azureRegion: { type: 'string', demandOption: false, describe: 'DEPRECATED: use --azureRegions instead. This flag will be removed in v2.0.' },

        // Other infra
        cloudflareZone: { type: 'string', demandOption: false, describe: 'Cloudflare DNS zone (e.g. example.com).'},
        cloudflareApiTokenEnv: { type: 'string', demandOption: false, describe: 'Environment variable name that will contain Cloudflare API token.'},

        // Layout & behavior flags
        nodeLayoutFile: { type: 'string', demandOption: false, describe: 'Path to JSON layout file overriding node role counts.' },
        explorer: { type: 'string', demandOption: false, choices: ['blockscout','chainlens','both','none'], describe: 'Unified explorer selector (overrides individual explorer flags).' },
        validate: { type: 'boolean', demandOption: false, default: false, describe: 'Validate configuration only.' },
        noFileWrite: { type: 'boolean', demandOption: false, default: false, describe: 'Dry-run: validate & summarize layout without writing artifacts.' }
      }).argv;      answers = {
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

        // Node roles
        bootNodes: args.bootNodes,
        rpcNodes: args.rpcNodes,
        archiveNodes: args.archiveNodes,
        memberAdmins: args.memberAdmins,
        memberPermissioned: args.memberPermissioned,
        memberPrivate: args.memberPrivate,
        memberPublic: args.memberPublic,

        // RPC configuration
        rpcDefaultType: args.rpcDefaultType,
        rpcNodeTypes: args.rpcNodeTypes,

        // Enhanced Azure
        azureEnable: args.azureEnable,
        azureAllRegions: args.azureAllRegions,
        azureRegions: args.azureRegions ? args.azureRegions.split(',').map(r => r.trim()) : undefined,
        azureRegionExclude: args.azureRegionExclude ? args.azureRegionExclude.split(',').map(r => r.trim()) : undefined,
        azureRegionClass: args.azureRegionClass,
        azureDeploymentDefault: args.azureDeploymentDefault,
        azureNodePlacement: args.azureNodePlacement,
        azureTopologyFile: args.azureTopologyFile,
        azureSizeMap: parseKeyValueMap(args.azureSizeMap),
        azureScaleMap: parseScaleMap(args.azureScaleMap),
        azureTags: parseKeyValueMap(args.azureTags),
        azureNetworkMode: args.azureNetworkMode,
        azureOutputDir: args.azureOutputDir,
        azureDryInfra: args.azureDryInfra,

        // Legacy Azure (backward compatibility)
        azureDeploy: args.azureDeploy,
        azureRegion: args.azureRegion,

        // Other
        cloudflareZone: args.cloudflareZone,
        cloudflareApiTokenEnv: args.cloudflareApiTokenEnv,
        nodeLayoutFile: args.nodeLayoutFile,
        explorer: args.explorer,
        validate: args.validate,
        noFileWrite: args.noFileWrite
      };

      // Post-processing: backward compatibility and validation
      const answersAny = answers as any;
      
      // Handle deprecated Azure flags with clear migration path
      if (args.azureDeploy && !args.azureEnable) {
        console.warn(chalk.yellow('WARNING: --azureDeploy is deprecated and will be removed in v2.0.'));
        console.warn(chalk.yellow('Migration: Replace --azureDeploy with --azureEnable'));
        answersAny.azureEnable = true;
      }
      
      if (args.azureRegion && !args.azureRegions) {
        console.warn(chalk.yellow('WARNING: --azureRegion is deprecated and will be removed in v2.0.'));
        console.warn(chalk.yellow('Migration: Replace --azureRegion with --azureRegions'));
        answersAny.azureRegions = [args.azureRegion];
      }

      // Validate Azure configuration
      if (answersAny.azureEnable && !answersAny.azureRegions && !answersAny.azureAllRegions) {
        console.error(chalk.red('ERROR: Azure deployment requires either --azureRegions or --azureAllRegions'));
        process.exit(1);
      }

      // Explorer override logic
      if (answersAny.explorer) {
        if (answersAny.explorer === 'none') {
          answersAny.blockscout = false;
          answersAny.chainlens = false;
        } else if (answersAny.explorer === 'both') {
          answersAny.blockscout = true;
          answersAny.chainlens = true;
        } else if (answersAny.explorer === 'blockscout') {
          answersAny.blockscout = true;
          answersAny.chainlens = false;
        } else if (answersAny.explorer === 'chainlens') {
          answersAny.blockscout = false;
          answersAny.chainlens = true;
        }
      }

      // Process country/region exclusions
      if (answersAny.azureRegionExclude) {
        const exclusions = resolveRegionExclusions(answersAny.azureRegionExclude);
        console.log(`Resolved region exclusions: ${exclusions.join(', ')}`);
        // Store resolved exclusions for validation
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
