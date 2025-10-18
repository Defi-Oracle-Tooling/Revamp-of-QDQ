import { rootQuestion } from "./questions";
import { QuestionRenderer } from "./questionRenderer";
import { buildNetwork, NetworkContext } from "./networkBuilder";
import { validateContext } from "./networkValidator";
import { resolveRegionExclusions } from "./azureRegions";
import yargs = require('yargs/yargs');
import chalk from "chalk";

export async function main(): Promise<void> {
      // CLI Banner
      console.log(chalk.cyan.bold('\n========================================='));
      console.log(chalk.cyan.bold('         Revamp of QDQ CLI'));
      console.log(chalk.cyan('  (formerly Quorum Dev Quickstart)'));
      console.log(chalk.cyan.bold('========================================='));
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

  // Early handling of --refreshConfig to bypass required clientType when used alone
  const rawArgs = process.argv.slice(2);
  const wantsRefresh = rawArgs.some(a => a === '--refreshConfig' || a.startsWith('--refreshConfig='));
  const hasClientType = rawArgs.some(a => a === '--clientType' || a.startsWith('--clientType='));
  if (wantsRefresh && !hasClientType) {
    try {
      const { loadAppConfig, clearConfigCache } = await import('./config');
      const { clearVaultCache, resetVaultClient } = await import('./secrets/azureKeyVault');
      // Provide placeholder secrets for refresh introspection if not set to avoid required secret errors.
      if (!process.env.TATUM_API_KEY) {
        process.env.TATUM_API_KEY = 'placeholder-refresh-key';
      }
      resetVaultClient();
      clearVaultCache();
      clearConfigCache();
      const cfg = await loadAppConfig(true);
      console.log(chalk.green('Config refresh complete (standalone mode):'));
      console.log(JSON.stringify({
        wellsFargoEnabled: cfg.wellsFargo.enabled,
        wellsFargoBaseUrl: cfg.wellsFargo.baseUrl,
        tatumTestnet: cfg.tatum.testnet,
        loadedAt: new Date(cfg.loadedAt).toISOString()
      }, null, 2));
      process.exit(0);
    } catch (e) {
      console.error(chalk.red(`Config refresh failed: ${(e as any).message || String(e)}`));
      process.exit(1);
    }
  }

    let answers = {};
    // (removed unused agentFlags constant)

    if(process.argv.slice(2).length > 0){
      const args = await yargs(process.argv.slice(2)).options({
        clientType: { type: 'string', demandOption: true, choices:['besu','goquorum'], describe: 'Ethereum client to use.' },
        privacy: { type: 'boolean', demandOption: true, default: false, describe: 'Enable support for private transactions' },
  monitoring: { type: 'string', demandOption: false, default: 'loki', choices: ['loki','splunk','elk','datadog'], describe: 'Monitoring / logging stack selection.' },
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

        // NEW: Enhanced regional topology configuration
        azureRegionalDistribution: { type: 'string', demandOption: false, describe: 'Regional node distribution DSL (format: "region:nodeType=count+nodeType2=count"). Example: "eastus:validators=3+rpc=2,westus2:archive=1"' },
        azureDeploymentMap: { type: 'string', demandOption: false, describe: 'Node type to deployment type mapping (format: "nodeType=deploymentType"). Example: "validators=aks,rpc=aca,archive=vmss"' },
        azureRegionalConfig: { type: 'string', demandOption: false, describe: 'Path to enhanced regional JSON/YAML configuration file (overrides other regional flags).' },
        azureHubRegion: { type: 'string', demandOption: false, describe: 'Hub region for hub-spoke network topology.' },
        memberNodeTypes: { type: 'string', demandOption: false, describe: 'Member node type distribution for privacy networks (format: "type:count;type2:count2"). Example: "permissioned:3;private:2"' },

        // Legacy Azure flags (backward compatibility - will be removed in future version)
  azureDeploy: { type: 'boolean', demandOption: false, default: false, describe: 'Deprecated: use --azureEnable instead.' },
  azureRegion: { type: 'string', demandOption: false, describe: 'Deprecated: use --azureRegions instead.' },

        // Cost Analysis & Pricing
        costAnalysis: { type: 'boolean', demandOption: false, default: false, describe: 'Enable comprehensive cost analysis for Azure deployments.' },
        costPeriods: { type: 'string', demandOption: false, default: 'hour,day,month,annual', describe: 'Comma-separated list of periods for burn rate calculations. Options: minute,hour,day,3-day,week,month,quarter,annual' },
        costComparison: { type: 'boolean', demandOption: false, default: true, describe: 'Enable deployment strategy cost comparison.' },
        azurePricingRegion: { type: 'string', demandOption: false, default: 'eastus', describe: 'Azure region to use for pricing data (affects currency and rates).' },
        costOutputFormat: { type: 'string', demandOption: false, default: 'json', choices: ['json','csv','html'], describe: 'Output format for cost analysis reports.' },
        costOutputPath: { type: 'string', demandOption: false, default: './cost-analysis', describe: 'Output directory for cost analysis reports.' },
        costLivePricing: { type: 'boolean', demandOption: false, default: true, describe: 'Use live Azure pricing data (requires internet connection).' },
        costComparisonStrategies: { type: 'string', demandOption: false, describe: 'Comma-separated deployment strategies to compare. Example: single-region-aks,multi-region-vm,hybrid-aks-aca' },
  costPersistentCache: { type: 'boolean', demandOption: false, default: false, describe: 'Enable persistent pricing cache for cost analysis.' },
  costDiscountFactors: { type: 'string', demandOption: false, describe: 'Discount factors per resource (format: type=factor,type2=factor). Example: aks-node-pool=0.72,virtual-machine=0.65' },
  costQuotaCheck: { type: 'boolean', demandOption: false, default: false, describe: 'Attempt quota evaluation (requires azureSubscriptionId and Azure auth).'},
  azureSubscriptionId: { type: 'string', demandOption: false, describe: 'Azure subscription ID used for quota evaluation.' },

        // Other infra
        cloudflareZone: { type: 'string', demandOption: false, describe: 'Cloudflare DNS zone (e.g. example.com).'},
        cloudflareApiTokenEnv: { type: 'string', demandOption: false, describe: 'Environment variable name that will contain Cloudflare API token.'},

        // Layout & behavior flags
        nodeLayoutFile: { type: 'string', demandOption: false, describe: 'Path to JSON layout file overriding node role counts.' },
        explorer: { type: 'string', demandOption: false, choices: ['blockscout','chainlens','swapscout','both','none'], describe: 'Unified explorer selector (overrides individual explorer flags).' },
        validate: { type: 'boolean', demandOption: false, default: false, describe: 'Validate configuration only.' },
        noFileWrite: { type: 'boolean', demandOption: false, default: false, describe: 'Dry-run: validate & summarize layout without writing artifacts.' }
        ,
        // Integrations
        chainlink: { type: 'string', demandOption: false, describe: 'Enable Chainlink (format: network;pair=address:decimals,...). Example: ethereum;ETH/USD=0xabc:8,BTC/USD=0xdef:8' },
        defender: { type: 'string', demandOption: false, describe: 'Enable OpenZeppelin Defender (format: relayer=0xaddr;sentinel=name:network,...). Example: relayer=0xabc;sentinel=HighValue:ethereum' },
        create2: { type: 'boolean', demandOption: false, default: false, describe: 'Enable CREATE2 deterministic deployment utilities.' },
        multicall: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Multicall batching helper.' },
        firefly: { type: 'string', demandOption: false, describe: 'Enable FireFly (format: baseUrl,namespace). Example: https://firefly.local,org1' },
        bridges: { type: 'string', demandOption: false, describe: 'Bridge routes (format: provider:source:dest;...). Example: layerzero:1:137;wormhole:1:42161' },
        chain138: { type: 'string', demandOption: false, describe: 'ChainID 138 config (format: gov=name:symbol:supply;feed=id:interval,...). Example: gov=GovToken:GOV:1000000;feed=priceFeed1:60' },
        onlineIntegrations: { type: 'boolean', demandOption: false, default: false, describe: 'Enable real HTTP calls for integrations (Chainlink feeds / FireFly). Offline simulation by default.' }
  ,includeDapp: { type: 'string', demandOption: false, describe: 'Include example dapp into output (e.g. quorumToken).'}
  ,walletconnectProjectId: { type: 'string', demandOption: false, describe: 'WalletConnect project id passed into dapp .env.local when included.' }
  ,swapscout: { type: 'boolean', demandOption: false, default: false, describe: 'Enable Swapscout (LI.FI) cross-chain analytics explorer.' }
  ,lifi: { type: 'string', demandOption: false, describe: 'LI.FI configuration (format: apiKey,analytics,chainId1,chainId2,endpoint). Example: abc123,analytics,1,137,https://explorer.li.fi' }
  ,refreshConfig: { type: 'boolean', demandOption: false, default: false, describe: 'Force refresh application integration config (Vault + env).' }
       }).argv;

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

        // NEW: Enhanced regional topology configuration
        azureRegionalDistribution: args.azureRegionalDistribution,
        azureDeploymentMap: args.azureDeploymentMap,
        azureRegionalConfig: args.azureRegionalConfig,
        azureHubRegion: args.azureHubRegion,
        memberNodeTypes: args.memberNodeTypes,

        // Legacy Azure (backward compatibility)
        azureDeploy: args.azureDeploy,
        azureRegion: args.azureRegion,

        // Cost Analysis
        costAnalysis: args.costAnalysis,
        costPeriods: args.costPeriods ? args.costPeriods.split(',').map(p => p.trim()) : ['hour','day','month','annual'],
        costComparison: args.costComparison,
        azurePricingRegion: args.azurePricingRegion,
        costOutputFormat: args.costOutputFormat,
        costOutputPath: args.costOutputPath,
        costLivePricing: args.costLivePricing,
        costComparisonStrategies: args.costComparisonStrategies ? args.costComparisonStrategies.split(',').map(s => s.trim()) : undefined,
  costPersistentCache: args.costPersistentCache,
  costDiscountFactors: parseDiscountFactors(args.costDiscountFactors),
  costQuotaCheck: args.costQuotaCheck,
  azureSubscriptionId: args.azureSubscriptionId,

        // Other
        cloudflareZone: args.cloudflareZone,
        cloudflareApiTokenEnv: args.cloudflareApiTokenEnv,
        nodeLayoutFile: args.nodeLayoutFile,
        explorer: args.explorer,
        validate: args.validate,
        noFileWrite: args.noFileWrite,
        onlineIntegrations: args.onlineIntegrations
  ,includeDapp: args.includeDapp
  ,walletconnectProjectId: args.walletconnectProjectId
       };      // Post-processing: backward compatibility and validation
      const answersAny = answers as any;

  // Handle deprecated Azure flags
      if (args.azureDeploy && !args.azureEnable) {
        console.warn(chalk.yellow('WARNING: --azureDeploy is deprecated and will be removed in v2.0.'));
        console.warn(chalk.yellow('Migration: Replace --azureDeploy with --azureEnable'));
        answersAny.azureEnable = true;
      }

      // Parse integration flags
      const parseChainlink = (raw?: string) => {
        if (!raw) return undefined;
        const [networkPart, feedsPart] = raw.split(';');
        const feeds: { pair: string; address: string; decimals: number }[] = [];
        if (feedsPart) {
          for (const seg of feedsPart.split(',')) {
            const [pair, addrDec] = seg.split('=');
            if (!pair || !addrDec) continue;
            const [addr, decStr] = addrDec.split(':');
            const decimals = Number(decStr);
            if (addr && Number.isFinite(decimals)) feeds.push({ pair, address: addr, decimals });
          }
        }
        return { network: networkPart, priceFeeds: feeds.length ? feeds : undefined };
      };
      const parseDefender = (raw?: string) => {
        if (!raw) return undefined;
        const relayerMatch = /relayer=([^;]+)/.exec(raw);
        const sentinels: { name: string; network: string }[] = [];
        for (const part of raw.split(';')) {
          if (part.startsWith('sentinel=')) {
            const body = part.replace('sentinel=', '');
            const [name, network] = body.split(':');
            if (name && network) sentinels.push({ name, network });
          }
        }
        return { relayer: relayerMatch ? { address: relayerMatch[1] } : undefined, sentinels: sentinels.length ? sentinels : undefined };
      };
      const parseFirefly = (raw?: string) => {
        if (!raw) return undefined;
        const [baseUrl, namespace] = raw.split(',');
        if (!baseUrl || !namespace) return undefined;
        return { apiBaseUrl: baseUrl, namespace };
      };
      const parseBridges = (raw?: string) => {
        if (!raw) return undefined;
        const routes: { provider: string; sourceChainId: number; destinationChainId: number }[] = [];
        for (const seg of raw.split(';')) {
          const [provider, s, d] = seg.split(':');
          const sourceChainId = Number(s); const destChainId = Number(d);
          if (provider && Number.isFinite(sourceChainId) && Number.isFinite(destChainId)) routes.push({ provider, sourceChainId, destinationChainId: destChainId });
        }
        return routes.length ? routes : undefined;
      };
      const parseChain138 = (raw?: string) => {
        if (!raw) return undefined;
        const cfg: any = { governanceToken: undefined, oracleFeeds: [] };
        for (const part of raw.split(';')) {
          if (part.startsWith('gov=')) {
            const body = part.replace('gov=', '');
            const [name, symbol, supplyStr] = body.split(':');
            if (name && symbol && supplyStr) cfg.governanceToken = { name, symbol, initialSupply: supplyStr };
          } else if (part.startsWith('feed=')) {
            const body = part.replace('feed=', '');
            const [id, intervalStr] = body.split(':');
            const interval = Number(intervalStr);
            if (id && Number.isFinite(interval)) cfg.oracleFeeds.push({ id, updateIntervalSeconds: interval });
          }
        }
        if (!cfg.governanceToken && cfg.oracleFeeds.length === 0) return undefined;
        return cfg;
      };

      const answersInt: any = answersAny;
      answersInt.chainlinkConfig = parseChainlink((args as any).chainlink);
      answersInt.defenderConfig = parseDefender((args as any).defender);
      answersInt.create2Enabled = (args as any).create2;
      answersInt.multicallEnabled = (args as any).multicall;
      answersInt.fireflyConfig = parseFirefly((args as any).firefly);
      answersInt.bridgeRoutes = parseBridges((args as any).bridges);
      answersInt.chain138Config = parseChain138((args as any).chain138);

      // LI.FI/Swapscout integration
      answersInt.swapscout = (args as any).swapscout;
  answersInt.refreshConfig = (args as any).refreshConfig;
      if ((args as any).lifi) {
        try {
          // Try JSON parsing first
          answersInt.lifiConfig = JSON.parse((args as any).lifi as string);
        } catch {
          // Fall back to comma-separated format for backward compatibility
          const lifiParts = ((args as any).lifi as string).split(',');
          answersInt.lifiConfig = {
            apiKey: lifiParts[0] || undefined,
            enableBridgeAnalytics: lifiParts.includes('analytics'),
            supportedChains: lifiParts.filter(p => p.match(/^\d+$/)),
            swapscoutEndpoint: lifiParts.find(p => p.startsWith('http')) || 'https://explorer.li.fi'
          };
        }
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
          answersAny.swapscout = false;
        } else if (answersAny.explorer === 'both') {
          answersAny.blockscout = true;
          answersAny.chainlens = true;
          answersAny.swapscout = true;
        } else if (answersAny.explorer === 'blockscout') {
          answersAny.blockscout = true;
          answersAny.chainlens = false;
          answersAny.swapscout = false;
        } else if (answersAny.explorer === 'chainlens') {
          answersAny.blockscout = false;
          answersAny.chainlens = true;
          answersAny.swapscout = false;
        } else if (answersAny.explorer === 'swapscout') {
          answersAny.blockscout = false;
          answersAny.chainlens = false;
          answersAny.swapscout = true;
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
    // Handle integration config refresh independent of network scaffold
    if ((answers as any).refreshConfig) {
        const { loadAppConfig, clearConfigCache } = await import('./config');
        const { clearVaultCache, resetVaultClient } = await import('./secrets/azureKeyVault');
        resetVaultClient();
        clearVaultCache();
        clearConfigCache();
        const cfg = await loadAppConfig(true);
        console.log(chalk.green('Config refresh complete:'));
        console.log(JSON.stringify({
          wellsFargoEnabled: cfg.wellsFargo.enabled,
          wellsFargoBaseUrl: cfg.wellsFargo.baseUrl,
          tatumTestnet: cfg.tatum.testnet,
          loadedAt: new Date(cfg.loadedAt).toISOString()
        }, null, 2));
        // If only refresh requested (no generation flags), exit early
        if (!(answers as any).clientType) {
          process.exit(0);
        }
    }
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

function parseDiscountFactors(raw?: string): Record<string, number> | undefined {
  if (!raw) return undefined;
  const out: Record<string, number> = {};
  for (const part of raw.split(',')) {
    const [k,v] = part.split('=');
    if (!k || !v) continue;
    const num = Number(v);
    if (!Number.isFinite(num) || num <= 0 || num > 1) continue; // expect multiplier
    out[k.trim()] = num;
  }
  return Object.keys(out).length ? out : undefined;
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
