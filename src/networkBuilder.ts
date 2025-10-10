import {renderTemplateDir, validateDirectoryExists, copyFilesDir} from "./fileRendering";
import path from "path";
import {Spinner} from "./spinner";
import {RpcNodeType} from "./azureRegions";
import {resolveAzureTopology, ResolvedAzureTopology, RpcNodeConfig, RolePlacement} from "./topologyResolver";

export interface NetworkContext {
    clientType: "goquorum" | "besu";
    nodeCount: number;
    privacy: boolean;
    monitoring: "splunk" | "elk" | "loki";
    blockscout: boolean;
    chainlens: boolean;
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

export async function buildNetwork(context: NetworkContext): Promise<void> {
    const templatesDirPath = path.resolve(__dirname, "..", "templates");
    const filesDirPath = path.resolve(__dirname, "..", "files");
    const spinner = new Spinner("");

    try {
        const blockchainClient = context.clientType === "besu" ? "Besu" : "GoQuorum" ;

        spinner.text = `Installing ${blockchainClient} quickstart to ${context.outputPath}`;
        spinner.start();

        // Resolve Azure topology if enabled
        if (context.azureEnable || context.azureDeploy) {
            try {
                context.resolvedAzure = resolveAzureTopology(context);

                if (context.resolvedAzure) {
                    console.log(`Azure deployment enabled for ${context.resolvedAzure.regions.length} region(s): ${context.resolvedAzure.regions.join(', ')}`);

                    // Generate Azure topology parameter file
                    if (context.azureOutputDir) {
                        await generateAzureParameterFile(context.resolvedAzure, context.azureOutputDir);
                    }
                }
            } catch (error) {
                await spinner.fail(`Azure topology resolution failed: ${(error as Error).message}`);
                process.exit(1);
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
