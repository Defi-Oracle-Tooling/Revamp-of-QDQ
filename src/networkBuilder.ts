import {renderTemplateDir, renderFileToDir, validateDirectoryExists, copyFilesDir} from "./fileRendering";
import path from "path";
import {Spinner} from "./spinner";
import {RpcNodeType} from "./azureRegions";
import {resolveAzureTopology, ResolvedAzureTopology, RpcNodeConfig, RolePlacement} from "./topologyResolver";

/**
 * Consistent error formatting for agent workflows
 */
export function formatAgentError(error: unknown): string {
    if (error instanceof Error) {
        return `[Agent Error] ${error.message}`;
    }
    return `[Agent Error] ${String(error)}`;
}
/**
 * Core configuration context for building blockchain networks
 * 
 * This interface defines all the configuration options available for generating
 * Quorum blockchain networks, including basic network settings, Azure cloud deployment
 * options, RPC node configurations, and advanced features.
 * 
 * @category Network Building
 */
export interface NetworkContext {
    /** The Ethereum client implementation to use */
    clientType: "goquorum" | "besu";
    /** Total number of nodes in the network */
    nodeCount: number;
    /** Enable support for private transactions using Tessera */
    privacy: boolean;
    /** Monitoring and logging stack selection */
    monitoring: "splunk" | "elk" | "loki";
    /** Enable Blockscout blockchain explorer */
    blockscout: boolean;
    /** Enable Chainlens network visualization tool */
    chainlens: boolean;
    /** Output directory path for generated network files */
    outputPath: string;
    // Phase 1 extensions
    genesisPreset?: string;
    validators?: number;
    participants?: number;
    chainId?: number;
    consensus?: "ibft" | "qbft" | "clique" | "ethash";

    // Enhanced node role counts
    bootNodes?: number;
    rpcNodes?: number;
    archiveNodes?: number;
    memberAdmins?: number;
    memberPermissioned?: number;
    memberPrivate?: number;
    memberPublic?: number;

    // Enhanced RPC configuration
    rpcNodeTypes?: string; // DSL string, parsed by topologyResolver
    rpcDefaultType?: RpcNodeType;

    // Enhanced Azure region handling
    azureEnable?: boolean;
    azureAllRegions?: boolean;
    azureRegions?: string[];
    azureRegionExclude?: string[];
    azureRegionClass?: 'commercial' | 'gov' | 'china' | 'dod';
    azureDeploymentDefault?: 'aks' | 'aca' | 'vm' | 'vmss';
    azureNodePlacement?: string;
    azureTopologyFile?: string;
    azureSizeMap?: Record<string,string>;
    azureScaleMap?: Record<string,{min:number;max:number}>;
    azureTags?: Record<string,string>;
    azureNetworkMode?: 'flat' | 'hub-spoke' | 'isolated';
    azureOutputDir?: string;
    azureDryInfra?: boolean;

    // Layout file & behavior flags
    nodeLayoutFile?: string;
    explorer?: "blockscout" | "chainlens" | "both" | "none";
    validate?: boolean;
    noFileWrite?: boolean;

    // Legacy Azure (for backward compatibility)
    azureDeploy?: boolean;
    azureRegion?: string;

    // Other infra
    cloudflareZone?: string;
    cloudflareApiTokenEnv?: string;

    // Resolved (computed) fields - populated by topology resolver
    resolvedAzure?: ResolvedAzureTopology;

    // Integrations (advanced)
    chainlinkConfig?: {
        network: string;
        priceFeeds?: { pair: string; address: string; decimals: number }[];
    };
    defenderConfig?: {
        relayer?: { address?: string };
        sentinels?: { name: string; network: string }[];
    };
    create2Enabled?: boolean;
    multicallEnabled?: boolean;
    fireflyConfig?: { apiBaseUrl: string; namespace: string };
    bridgeRoutes?: { provider: string; sourceChainId: number; destinationChainId: number }[];
    chain138Config?: { governanceToken?: { name: string; symbol: string; initialSupply: string }; oracleFeeds?: { id: string; updateIntervalSeconds: number }[] };
    onlineIntegrations?: boolean;
    includeDapp?: string;
    walletconnectProjectId?: string;
    
    // LI.FI / Swapscout integration
    swapscout?: boolean;
    lifiConfig?: {
        apiKey?: string;
        enableBridgeAnalytics?: boolean;
        supportedChains?: string[];
        swapscoutEndpoint?: string;
    };
 }/**
 * Builds and scaffolds a complete blockchain network based on the provided context
 * 
 * This function orchestrates the entire network generation process:
 * 1. Validates the output directory
 * 2. Renders Nunjucks templates with context variables
 * 3. Copies static files and assets
 * 4. Generates Azure infrastructure if enabled
 * 5. Creates comprehensive documentation
 * 
 * @param context - Complete network configuration
 * @throws {Error} When output directory conflicts or template rendering fails
 * 
 * @category Network Building
 */
export async function buildNetwork(context: NetworkContext): Promise<void> {
    // Resolve templates path correctly from both source and build directories
    const templatesDirPath = __dirname.includes('build') ? 
        path.resolve(__dirname, "..", "..", "templates") : 
        path.resolve(__dirname, "..", "templates");
    // Resolve files path correctly from both source and build directories  
    const filesDirPath = __dirname.includes('build') ? 
        path.resolve(__dirname, "..", "..", "files") : 
        path.resolve(__dirname, "..", "files");
    const spinner = new Spinner("");

    try {
        // Pre-flight validation
        await validateNetworkContext(context);

        const blockchainClient = context.clientType === "besu" ? "Besu" : "GoQuorum";

        // Skip file operations in validation mode
        if (context.validate && context.noFileWrite) {
            spinner.text = `Validating ${blockchainClient} network configuration`;
        } else {
            spinner.text = `Installing ${blockchainClient} quickstart to ${context.outputPath}`;
        }
        
        spinner.start();

        // Resolve Azure topology if enabled
        if (context.azureEnable || context.azureDeploy) {
            try {
                spinner.text = "Resolving Azure topology and resource placement...";
                context.resolvedAzure = resolveAzureTopology(context);

                if (context.resolvedAzure) {
                    const regionCount = context.resolvedAzure.regions.length;
                    const regionsList = context.resolvedAzure.regions.join(', ');
                    
                    console.log(`✅ Azure deployment configured for ${regionCount} region(s): ${regionsList}`);
                    
                    // Log role placement summary
                    const placementEntries = context.resolvedAzure.placements ? Object.entries(context.resolvedAzure.placements) : [];
                    if (placementEntries.length > 0) {
                        console.log(`📍 Node placement strategy:`);
                        placementEntries.forEach(([role, placement]) => {
                            console.log(`   - ${role}: ${placement.deploymentType} in ${placement.regions.join(', ')}`);
                        });
                    }

                    // Generate Azure deployment templates
                    if (context.azureOutputDir && !context.noFileWrite) {
                        spinner.text = "Generating Azure deployment templates...";
                        await generateAzureParameterFile(context.resolvedAzure, context.azureOutputDir);
                        console.log(`📁 Azure templates generated in: ${context.azureOutputDir}`);
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                await spinner.fail(`Azure topology resolution failed: ${errorMessage}`);
                throw new Error(`Azure configuration error: ${errorMessage}`);
            }
        }

        const commonTemplatePath = path.resolve(templatesDirPath, "common");
        const clientTemplatePath = path.resolve(templatesDirPath, context.clientType);

        const commonFilesPath = path.resolve(filesDirPath, "common");
        const clientFilesPath = path.resolve(filesDirPath, context.clientType);

        if (validateDirectoryExists(commonTemplatePath)) {
            renderTemplateDir(commonTemplatePath, context);
        }

        // Conditionally render Swapscout template if enabled
        if (context.swapscout) {
            // Resolve path relative to src directory, not build directory
            const srcDir = __dirname.includes('build') ? path.resolve(__dirname, '..', '..') : path.resolve(__dirname, '..');
            const conditionalTemplatePath = path.resolve(srcDir, "templates", "conditional");
            const fs = require('fs');
            const swapscoutTemplatePath = path.resolve(conditionalTemplatePath, "swapscout-compose.yml");
            if (fs.existsSync(swapscoutTemplatePath)) {
                renderFileToDir(conditionalTemplatePath, "swapscout-compose.yml", context);
            }
        }

        if (validateDirectoryExists(clientTemplatePath)) {
            renderTemplateDir(clientTemplatePath, context);
        }

        if (validateDirectoryExists(commonFilesPath)) {
            copyFilesDir(commonFilesPath, context);
        }

        if (validateDirectoryExists(clientFilesPath)) {
            copyFilesDir(clientFilesPath, context);
        }

        // Write integration summary if any advanced integration flags present
        if (!context.noFileWrite) {
            const anyIntegrations = context.chainlinkConfig || context.defenderConfig || context.create2Enabled || context.multicallEnabled || context.fireflyConfig || context.bridgeRoutes || context.chain138Config;
            if (anyIntegrations) {
                try {
                    const fs = require('fs');
                    const integrationDir = path.resolve(context.outputPath, 'integrations');
                    if (!fs.existsSync(integrationDir)) {
                        fs.mkdirSync(integrationDir, { recursive: true });
                    }
                    const summary = {
                        chainlink: context.chainlinkConfig || null,
                        defender: context.defenderConfig || null,
                        create2: !!context.create2Enabled,
                        multicall: !!context.multicallEnabled,
                        firefly: context.fireflyConfig || null,
                        bridges: context.bridgeRoutes || null,
                        chain138: context.chain138Config || null,
                        lifi: context.lifiConfig || null,
                        swapscout: !!context.swapscout
                    };
                    const summaryPath = path.join(integrationDir, 'integrations-summary.json');
                    if (!fs.existsSync(summaryPath)) {
                        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
                    }
                } catch (e) {
                    console.error('Failed to write integration summary:', (e as Error).message);
                }
            }
        }

        // Optional DApp inclusion (after core files copied)
        if (!context.noFileWrite && context.includeDapp) {
            const dappName = context.includeDapp;
            const sourceDappDir = path.resolve(__dirname, '..', 'files', 'common', 'dapps', dappName);
            const targetDappDir = path.resolve(context.outputPath, 'dapps', dappName);
            if (!validateDirectoryExists(sourceDappDir)) {
                console.warn(`[dapp] Skipping includeDapp='${dappName}' – source not found at ${sourceDappDir}`);
            } else {
                // If target exists (user re-run), skip copy but still write env & instructions
                const fs = require('fs');
                const targetExists = validateDirectoryExists(targetDappDir);
                if (!targetExists) {
                    fs.mkdirSync(targetDappDir, { recursive: true });
                    fs.cpSync(sourceDappDir, targetDappDir, { recursive: true, force: false });
                }
                // Env injection
                if (context.walletconnectProjectId) {
                    fs.writeFileSync(path.join(targetDappDir, '.env.local'), `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${context.walletconnectProjectId}\n`, { encoding: 'utf-8' });
                }
                // Instructions file (always overwrite to ensure latest format)
                const instructionsPath = path.join(targetDappDir, 'dapp-INSTRUCTIONS.md');
                const instructions = `# ${dappName} DApp Usage\n\n` +
`## Quick Start\n\n` +
`cd dapps/${dappName}\n` +
`npm install\n` +
`npm run dev\n\n` +
`Network RPC: http://127.0.0.1:8545 (override via NEXT_PUBLIC_NETWORK_RPC).\n` +
`WalletConnect Project ID: ${context.walletconnectProjectId || 'not set'}\n\n` +
`## Build\n\n` +
`npm run build && npm start\n\n` +
`## Notes\n- Do not commit .env.local\n- Refer to root docs/security.md for guidelines.\n`;
                fs.writeFileSync(instructionsPath, instructions, { encoding: 'utf-8' });
                spinner.text = `${spinner.text} (+ dapp ${dappName})`;
            }
        }

        await spinner.succeed(`Installation complete.`);

        console.log();
        console.log(`To start your test network, run 'run.sh' in the directory, '${context.outputPath}'`);
        console.log(`For more information on the test network, see 'README.md' in the directory, '${context.outputPath}'`);

        // Azure-specific output
        if (context.resolvedAzure && context.azureOutputDir) {
            console.log(`Azure deployment templates generated in: ${context.azureOutputDir}`);
        }
    } catch (err) {
        if (spinner.isRunning) {
            await spinner.fail(`Installation failed. Error: ${(err as Error).message}`);
        }
        // Avoid hard process exit during tests to prevent Jest worker crashes; rethrow instead.
        if (process.env.JEST_WORKER_ID) {
            throw err;
        } else {
            process.exit(1);
        }
    }
}

/**
 * Validates network context before proceeding with build
 * 
 * @param context - Network configuration to validate
 * @throws {Error} When configuration is invalid
 */
async function validateNetworkContext(context: NetworkContext): Promise<void> {
    // Validate required fields
    if (!context.clientType || !['besu', 'goquorum'].includes(context.clientType)) {
        throw new Error('Invalid or missing clientType. Must be "besu" or "goquorum".');
    }

    if (!context.outputPath) {
        throw new Error('Output path is required.');
    }

    // Validate Azure configuration
    if (context.azureEnable) {
        if (!context.azureRegions && !context.azureAllRegions) {
            throw new Error('Azure deployment requires either azureRegions or azureAllRegions to be specified.');
        }

        if (context.azureRegions && context.azureRegions.length === 0) {
            throw new Error('azureRegions array cannot be empty when specified.');
        }
    }

    // Validate node counts
    const validators = context.validators ?? 4;
    const rpcNodes = context.rpcNodes ?? 1;
    
    if (validators < 1) {
        throw new Error('Must have at least 1 validator node.');
    }

    if (rpcNodes < 0) {
        throw new Error('RPC node count cannot be negative.');
    }

    // Validate consensus mechanism
    if (context.consensus && !['ibft', 'qbft', 'clique', 'ethash'].includes(context.consensus)) {
        throw new Error('Invalid consensus mechanism. Must be one of: ibft, qbft, clique, ethash.');
    }

    // Validate chain ID (explicit numeric check so that 0 is validated)
    if (typeof context.chainId === 'number') {
        if (context.chainId < 1 || context.chainId > 4294967295) {
            throw new Error('Chain ID must be between 1 and 4294967295.');
        }
    }
}

async function generateAzureParameterFile(topology: ResolvedAzureTopology, outputDir: string): Promise<void> {
    const fs = require('fs');
    const path = require('path');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate parameter file for Bicep/ARM templates
    const parameters = {
        regions: topology.regions,
        placements: topology.placements,
        tags: topology.tags || {},
        network: topology.network || { mode: 'flat' },
        generatedAt: new Date().toISOString()
    };

    const parameterFile = path.join(outputDir, 'topology.parameters.json');
    fs.writeFileSync(parameterFile, JSON.stringify(parameters, null, 2));

    console.log(`Generated Azure parameter file: ${parameterFile}`);
}

// Export types for use in other modules
export type { RpcNodeConfig, RolePlacement, ResolvedAzureTopology };
