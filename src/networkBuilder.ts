import {renderTemplateDir, validateDirectoryExists, copyFilesDir} from "./fileRendering";
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
}

/**
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
    const templatesDirPath = path.resolve(__dirname, "..", "templates");
    const filesDirPath = path.resolve(__dirname, "..", "files");
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

        if (validateDirectoryExists(clientTemplatePath)) {
            renderTemplateDir(clientTemplatePath, context);
        }

        if (validateDirectoryExists(commonFilesPath)) {
            copyFilesDir(commonFilesPath, context);
        }

        if (validateDirectoryExists(clientFilesPath)) {
            copyFilesDir(clientFilesPath, context);
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
        process.exit(1);
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

    // Validate chain ID
    if (context.chainId && (context.chainId < 1 || context.chainId > 4294967295)) {
        throw new Error('Chain ID must be between 1 and 4294967295.');
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
export { RpcNodeConfig, RolePlacement, ResolvedAzureTopology };
