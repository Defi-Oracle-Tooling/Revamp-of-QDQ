#!/usr/bin/env node

/**
 * Standalone Quorum Network Cost Analysis Tool
 *
 * This script provides dedicated cost analysis capabilities for Quorum
 * blockchain networks deployed on Azure. It can analyze existing network
 * configurations, compare deployment strategies, and generate detailed
 * cost reports.
 *
 * Usage:
 *   node cost-analyzer.js [options]
 *   ./cost-analyzer.js --config ./network-config.json --strategy multi-region-aks
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');
const path = require('path');

// Import costing modules (assuming this runs from build directory)
const { CostingEngine } = require('../build/src/costing/costingEngine');
const { AzurePricingClient } = require('../build/src/costing/azurePricingClient');

/**
 * CLI configuration
 */
const argv = yargs(hideBin(process.argv))
    .scriptName('cost-analyzer')
    .usage('$0 [options]', 'Analyze costs for Quorum network deployments')
    .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Path to network configuration file (JSON)',
        demandOption: false
    })
    .option('strategy', {
        alias: 's',
        type: 'string',
        description: 'Deployment strategy to analyze',
        choices: ['single-region-aks', 'multi-region-aks', 'single-region-vm', 'multi-region-vm', 'hybrid-aks-aca'],
        default: 'single-region-aks'
    })
    .option('regions', {
        alias: 'r',
        type: 'string',
        description: 'Comma-separated list of Azure regions',
        default: 'eastus'
    })
    .option('validators', {
        alias: 'v',
        type: 'number',
        description: 'Number of validator nodes',
        default: 4
    })
    .option('rpc-nodes', {
        alias: 'rpc',
        type: 'number',
        description: 'Number of RPC nodes',
        default: 1
    })
    .option('pricing-region', {
        type: 'string',
        description: 'Azure region for pricing data',
        default: 'eastus'
    })
    .option('currency', {
        type: 'string',
        description: 'Currency for cost calculations',
        default: 'USD'
    })
    .option('periods', {
        type: 'string',
        description: 'Comma-separated periods for burn rate calculations',
        default: 'hour,day,month,annual'
    })
    .option('comparison', {
        type: 'boolean',
        description: 'Enable deployment strategy comparison',
        default: true
    })
    .option('live-pricing', {
        type: 'boolean',
        description: 'Use live Azure pricing data',
        default: true
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output file path',
        default: './cost-analysis-report'
    })
    .option('format', {
        alias: 'f',
        type: 'string',
        description: 'Output format',
        choices: ['json', 'csv', 'html'],
        default: 'json'
    })
    .option('quiet', {
        alias: 'q',
        type: 'boolean',
        description: 'Suppress verbose output',
        default: false
    })
    .option('test-pricing', {
        type: 'boolean',
        description: 'Test Azure Pricing API connectivity',
        default: false
    })
    .help()
    .version('1.0.0')
    .example('$0 --strategy multi-region-aks --regions "eastus,westus2" --validators 6', 'Analyze multi-region AKS deployment')
    .example('$0 --config ./network.json --comparison --format html', 'Analyze from config file with HTML report')
    .example('$0 --test-pricing --pricing-region westeurope', 'Test pricing API in West Europe')
    .argv;

/**
 * Main execution function
 */
async function main() {
    try {
        if (!argv.quiet) {
            console.log('🔍 Quorum Network Cost Analyzer v1.0.0\n');
        }

        // Test pricing API if requested
        if (argv['test-pricing']) {
            await testPricingApi();
            return;
        }

        // Load or create network configuration
        const networkConfig = argv.config 
            ? await loadNetworkConfig(argv.config)
            : createNetworkConfigFromArgs();

        if (!argv.quiet) {
            console.log('📊 Network Configuration:');
            console.log(`   Strategy: ${getStrategyDescription(networkConfig)}`);
            console.log(`   Regions: ${networkConfig.azureRegions?.join(', ') || 'eastus'}`);
            console.log(`   Validators: ${networkConfig.validators || 4}`);
            console.log(`   RPC Nodes: ${networkConfig.rpcNodes || 1}`);
            console.log(`   Deployment Type: ${networkConfig.azureDeploymentDefault || 'aks'}\n`);
        }

        // Perform cost analysis
        const costReport = await performCostAnalysis(networkConfig);

        // Generate report
        await generateReport(costReport, argv.output, argv.format);

        if (!argv.quiet) {
            displaySummary(costReport);
        }

    } catch (error) {
        console.error('❌ Cost analysis failed:', error.message);
        process.exit(1);
    }
}

/**
 * Test Azure Pricing API connectivity
 */
async function testPricingApi() {
    console.log('🔧 Testing Azure Pricing API connectivity...\n');

    const client = new AzurePricingClient({
        region: argv['pricing-region'],
        currency: argv.currency,
        timeout: 15000
    });

    try {
        console.log('Testing VM pricing...');
        const vmPricing = await client.getVmPricing(argv['pricing-region'], ['Standard_D4s_v5']);
        console.log(`✅ VM pricing: ${vmPricing.length} results`);

        console.log('Testing AKS pricing...');
        const aksPricing = await client.getAksPricing(argv['pricing-region']);
        console.log(`✅ AKS pricing: ${aksPricing.length} results`);

        console.log('Testing storage pricing...');
        const storagePricing = await client.getStoragePricing(argv['pricing-region']);
        console.log(`✅ Storage pricing: ${storagePricing.length} results`);

        console.log('\n✅ Azure Pricing API connectivity test passed');
        
        // Display sample pricing
        if (vmPricing.length > 0) {
            const sample = vmPricing[0];
            console.log(`\n📋 Sample pricing (${sample.sku}):`);
            console.log(`   Price: ${sample.pricePerHour.toFixed(4)} ${sample.currency}/hour`);
            console.log(`   Region: ${sample.region}`);
            console.log(`   Service: ${sample.service}`);
        }

        const stats = client.getCacheStats();
        console.log(`\n💾 Cache: ${stats.entries} entries, ${stats.totalSizeKB} KB`);

    } catch (error) {
        console.error('❌ Azure Pricing API test failed:', error.message);
        console.error('   This may indicate network connectivity issues or API limitations');
        process.exit(1);
    }
}

/**
 * Load network configuration from file
 */
async function loadNetworkConfig(configPath) {
    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
    }

    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Validate required fields
    if (!config.azureEnable && !config.azureRegions) {
        throw new Error('Configuration must have azureEnable=true or azureRegions specified');
    }

    return config;
}

/**
 * Create network configuration from CLI arguments
 */
function createNetworkConfigFromArgs() {
    const regions = argv.regions.split(',').map(r => r.trim());
    const strategy = argv.strategy;
    
    let deploymentDefault = 'aks';
    let azureRegions = regions;

    // Parse strategy
    if (strategy.includes('vm')) {
        deploymentDefault = strategy.includes('vmss') ? 'vmss' : 'vm';
    } else if (strategy.includes('aca')) {
        deploymentDefault = 'aca';
    }

    if (strategy.includes('single-region')) {
        azureRegions = [regions[0]];
    }

    return {
        clientType: 'besu',
        azureEnable: true,
        azureRegions,
        azureDeploymentDefault: deploymentDefault,
        validators: argv.validators,
        rpcNodes: argv['rpc-nodes'],
        azurePricingRegion: argv['pricing-region'],
        costAnalysis: true,
        costPeriods: argv.periods.split(',').map(p => p.trim()),
        costComparison: argv.comparison,
        costLivePricing: argv['live-pricing'],
        costOutputFormat: argv.format,
        currency: argv.currency
    };
}

/**
 * Perform cost analysis
 */
async function performCostAnalysis(config) {
    if (!argv.quiet) {
        console.log('💰 Performing cost analysis...');
    }

    const costingOptions = {
        useLivePricing: config.costLivePricing,
        pricingRegion: config.azurePricingRegion,
        currency: config.currency || 'USD',
        periods: config.costPeriods,
        enableComparison: config.costComparison,
        outputFormat: config.costOutputFormat,
        includeResourceBreakdown: true
    };

    const costingEngine = new CostingEngine(costingOptions);

    // Mock resolved Azure topology since we don't have the full network builder
    config.resolvedAzure = {
        regions: config.azureRegions,
        placements: {
            validators: {
                deploymentType: config.azureDeploymentDefault,
                regions: config.azureRegions,
                replicas: config.validators
            },
            rpcNodes: {
                deploymentType: config.azureDeploymentDefault,
                regions: config.azureRegions,
                replicas: config.rpcNodes
            }
        }
    };

    return await costingEngine.analyzeCosts(config);
}

/**
 * Generate cost report file
 */
async function generateReport(costReport, outputPath, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${outputPath}-${timestamp}.${format}`;

    if (!argv.quiet) {
        console.log(`📝 Generating ${format.toUpperCase()} report: ${fileName}`);
    }

    let content;
    switch (format) {
        case 'json':
            content = JSON.stringify(costReport, null, 2);
            break;
        case 'csv':
            content = convertToCsv(costReport);
            break;
        case 'html':
            content = convertToHtml(costReport);
            break;
        default:
            throw new Error(`Unsupported format: ${format}`);
    }

    fs.writeFileSync(fileName, content);
    
    if (!argv.quiet) {
        console.log(`✅ Report saved: ${fileName}\n`);
    }
    
    return fileName;
}

/**
 * Display cost summary
 */
function displaySummary(costReport) {
    console.log('💵 Cost Analysis Summary:');
    console.log('=' .repeat(50));
    
    console.log(`Network Name: ${costReport.networkName}`);
    console.log(`Strategy: ${costReport.deploymentStrategy}`);
    console.log(`Region: ${costReport.region}`);
    console.log(`Currency: ${costReport.currency}`);
    console.log();

    console.log('Burn Rates:');
    costReport.burnRates.forEach(rate => {
        const cost = rate.cost.toFixed(rate.period === 'minute' ? 6 : 4);
        console.log(`  ${rate.period.padEnd(10)}: $${cost}`);
    });
    console.log();

    if (costReport.comparison && costReport.comparison.strategies.length > 1) {
        console.log('Strategy Comparison:');
        costReport.comparison.strategies.forEach(strategy => {
            const monthly = strategy.monthlyCost.toFixed(2);
            const annual = strategy.annualCost.toFixed(2);
            console.log(`  ${strategy.name.padEnd(20)}: $${monthly}/month ($${annual}/year)`);
        });
        console.log();

        if (costReport.comparison.recommendations.length > 0) {
            console.log('Recommendations:');
            costReport.comparison.recommendations.forEach(rec => {
                const savings = rec.savings > 0 ? ` (Save $${rec.savings.toFixed(2)}/month)` : '';
                console.log(`  • ${rec.strategy}: ${rec.reason}${savings}`);
                rec.tradeoffs.forEach(tradeoff => {
                    console.log(`    - ${tradeoff}`);
                });
            });
        }
    }

    console.log();
    console.log(`Resource Count: ${costReport.resourceBreakdown.length}`);
    console.log(`Total Resources Cost: $${costReport.resourceBreakdown.reduce((sum, r) => sum + r.totalCost, 0).toFixed(4)}/hour`);
}

/**
 * Convert cost report to CSV
 */
function convertToCsv(report) {
    const lines = [];
    
    // Summary
    lines.push('Summary');
    lines.push(`Network,${report.networkName}`);
    lines.push(`Strategy,${report.deploymentStrategy}`);
    lines.push(`Currency,${report.currency}`);
    lines.push('');
    
    // Burn rates
    lines.push('Period,Cost');
    report.burnRates.forEach(rate => {
        lines.push(`${rate.period},$${rate.cost.toFixed(6)}`);
    });
    lines.push('');
    
    // Resources
    lines.push('Resource Type,Name,Region,SKU,Quantity,Unit Cost,Total Cost');
    report.resourceBreakdown.forEach(resource => {
        lines.push(`${resource.resourceType},${resource.resourceName},${resource.region},${resource.sku},${resource.quantity},$${resource.unitCost.toFixed(6)},$${resource.totalCost.toFixed(6)}`);
    });
    
    return lines.join('\n');
}

/**
 * Convert cost report to HTML
 */
function convertToHtml(report) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Cost Analysis - ${report.networkName}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .cost-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .cost-card { background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
        .cost-value { font-size: 1.5em; font-weight: bold; color: #2563eb; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .resource-type { font-weight: 500; color: #4f46e5; }
        .currency { color: #059669; font-weight: 500; }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Cost Analysis Report</h1>
        <p>${report.networkName} • ${report.deploymentStrategy} • ${new Date(report.analysisDate).toLocaleDateString()}</p>
    </div>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <p><strong>Network:</strong> ${report.networkName}</p>
        <p><strong>Strategy:</strong> ${report.deploymentStrategy}</p>
        <p><strong>Region:</strong> ${report.region}</p>
        <p><strong>Currency:</strong> ${report.currency}</p>
    </div>
    
    <h2>Cost Breakdown</h2>
    <div class="cost-grid">
        ${report.burnRates.map(rate => `
            <div class="cost-card">
                <div style="text-transform: capitalize; color: #64748b; margin-bottom: 5px;">${rate.period}</div>
                <div class="cost-value">$${rate.cost.toFixed(rate.period === 'minute' ? 6 : 2)}</div>
            </div>
        `).join('')}
    </div>
    
    <h2>Resource Details</h2>
    <table>
        <thead>
            <tr>
                <th>Resource Type</th>
                <th>Name</th>
                <th>Region</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
            </tr>
        </thead>
        <tbody>
            ${report.resourceBreakdown.map(resource => `
                <tr>
                    <td class="resource-type">${resource.resourceType}</td>
                    <td>${resource.resourceName}</td>
                    <td>${resource.region}</td>
                    <td>${resource.sku}</td>
                    <td>${resource.quantity}</td>
                    <td class="currency">$${resource.unitCost.toFixed(4)}</td>
                    <td class="currency">$${resource.totalCost.toFixed(4)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${report.comparison ? `
        <h2>Strategy Comparison</h2>
        <table>
            <thead>
                <tr><th>Strategy</th><th>Description</th><th>Monthly Cost</th><th>Annual Cost</th></tr>
            </thead>
            <tbody>
                ${report.comparison.strategies.map(strategy => `
                    <tr>
                        <td class="resource-type">${strategy.name}</td>
                        <td>${strategy.description}</td>
                        <td class="currency">$${strategy.monthlyCost.toFixed(2)}</td>
                        <td class="currency">$${strategy.annualCost.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : ''}
    
    <p style="margin-top: 40px; color: #64748b; font-size: 0.9em;">
        Generated by Quorum Network Cost Analyzer on ${new Date().toLocaleString()}
    </p>
</body>
</html>`;
}

/**
 * Get strategy description
 */
function getStrategyDescription(config) {
    const regions = config.azureRegions?.length || 1;
    const deployment = config.azureDeploymentDefault || 'aks';
    return `${regions === 1 ? 'Single' : 'Multi'}-Region ${deployment.toUpperCase()}`;
}

// Run the tool
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    main,
    testPricingApi,
    loadNetworkConfig,
    createNetworkConfigFromArgs,
    performCostAnalysis
};