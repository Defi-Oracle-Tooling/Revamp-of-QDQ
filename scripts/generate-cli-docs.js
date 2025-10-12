#!/usr/bin/env node

/**
 * CLI Documentation Generator
 * 
 * Generates comprehensive documentation for all CLI flags
 * by parsing the yargs configuration and help output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get help text from the actual CLI
function getCliHelp() {
  try {
       return execSync('node build/src/index.js --help', { encoding: 'utf-8' });
  } catch (error) {
    console.error('Error getting CLI help:', error.message);
    return null;
  }
}

// Parse help text into structured data
function parseHelpText(helpText) {
  const lines = helpText.split('\n');
  const options = {};
  let currentOption = null;
  
  for (const line of lines) {
    // Match option lines like "  --clientType              Ethereum client to use."
    const optionMatch = line.match(/^\s{2}--(\w+)\s+(.+)$/);
    if (optionMatch) {
      const [, name, description] = optionMatch;
      currentOption = name;
      options[name] = {
        description: description.trim(),
        type: 'string',
        choices: [],
        default: null,
        required: false
      };
      continue;
    }
    
    // Match continuation lines with choices, defaults, etc.
    if (currentOption && line.trim()) {
      const trimmed = line.trim();
      
      // Extract choices
      if (trimmed.includes('[choices:')) {
        const choicesMatch = trimmed.match(/\[choices: ([^\]]+)\]/);
        if (choicesMatch) {
          options[currentOption].choices = choicesMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
        }
      }
      
      // Extract default values
      if (trimmed.includes('[default:')) {
        const defaultMatch = trimmed.match(/\[default: ([^\]]+)\]/);
        if (defaultMatch) {
          options[currentOption].default = defaultMatch[1].trim().replace(/"/g, '');
        }
      }
      
      // Detect required options
      if (trimmed.includes('[required]')) {
        options[currentOption].required = true;
      }
      
      // Detect type
      if (trimmed.includes('[boolean]')) {
        options[currentOption].type = 'boolean';
      } else if (trimmed.includes('[number]')) {
        options[currentOption].type = 'number';
      }
    }
  }
  
  return options;
}

// Generate enhanced markdown documentation
function generateEnhancedMarkdown(options) {
  let markdown = `# CLI Reference\n\n`;
  markdown += `*Generated automatically from CLI help output on ${new Date().toISOString().split('T')[0]}*\n\n`;
  markdown += `This document provides comprehensive documentation for all available CLI flags in the Quorum Developer Quickstart tool.\n\n`;
  
  markdown += `## Quick Start\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `# Interactive mode (recommended for beginners)\n`;
  markdown += `npx quorum-dev-quickstart\n\n`;
  markdown += `# Command-line mode\n`;
  markdown += `npx quorum-dev-quickstart --clientType besu --privacy true\n`;
  markdown += `\`\`\`\n\n`;
  
  // Categorize options
  const categories = {
    'Core Configuration': ['clientType', 'privacy', 'monitoring', 'outputPath'],
    'Network Topology': ['validators', 'participants', 'bootNodes', 'rpcNodes', 'archiveNodes', 'consensus'],
    'Member Nodes': ['memberAdmins', 'memberPermissioned', 'memberPrivate', 'memberPublic'],
    'RPC Configuration': ['rpcDefaultType', 'rpcNodeTypes'],
    'Explorer Services': ['explorer', 'blockscout', 'chainlens'],
    'Azure Cloud Deployment': [
      'azureEnable', 'azureAllRegions', 'azureRegions', 'azureRegionExclude', 
      'azureRegionClass', 'azureDeploymentDefault', 'azureNodePlacement', 
      'azureTopologyFile', 'azureSizeMap', 'azureScaleMap', 'azureTags', 
      'azureNetworkMode', 'azureOutputDir', 'azureDryInfra'
    ],
    'Cloud Integration': ['cloudflareZone', 'cloudflareApiTokenEnv'],
    'Advanced Options': ['genesisPreset', 'chainId', 'nodeLayoutFile', 'validate', 'noFileWrite']
  };
  
  // Generate table of contents
  markdown += `## Table of Contents\n\n`;
  for (const categoryName of Object.keys(categories)) {
    const anchor = categoryName.toLowerCase().replace(/\s+/g, '-');
    markdown += `- [${categoryName}](#${anchor})\n`;
  }
  markdown += `\n`;
  
  // Generate sections
  for (const [categoryName, flagNames] of Object.entries(categories)) {
    markdown += `## ${categoryName}\n\n`;
    
    const categoryFlags = flagNames.filter(name => options[name]);
    
    if (categoryFlags.length === 0) {
      markdown += `*No options available in this category.*\n\n`;
      continue;
    }
    
    // Create summary table
    markdown += `| Flag | Type | Required | Default | Description |\n`;
    markdown += `|------|------|----------|---------|-------------|\n`;
    
    for (const flagName of categoryFlags) {
      const option = options[flagName];
      const required = option.required ? '✅' : '❌';
      const defaultVal = option.default ? `\`${option.default}\`` : '-';
      const type = `\`${option.type}\``;
      const desc = option.description.length > 50 
        ? option.description.substring(0, 47) + '...' 
        : option.description;
        
      markdown += `| \`--${flagName}\` | ${type} | ${required} | ${defaultVal} | ${desc} |\n`;
    }
    markdown += `\n`;
    
    // Detailed descriptions
    for (const flagName of categoryFlags) {
      const option = options[flagName];
      
      markdown += `### \`--${flagName}\`\n\n`;
      markdown += `${option.description}\n\n`;
      
      if (option.choices && option.choices.length > 0) {
        markdown += `**Available choices:** ${option.choices.map(c => `\`${c}\``).join(', ')}\n\n`;
      }
      
      if (option.type) {
        markdown += `**Type:** \`${option.type}\``;
        if (option.required) markdown += ` *(required)*`;
        if (option.default) markdown += ` | **Default:** \`${option.default}\``;
        markdown += `\n\n`;
      }
    }
  }
  
  // Add comprehensive examples
  markdown += `## Complete Examples\n\n`;
  
  markdown += `### Basic Local Development\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npx quorum-dev-quickstart \\\n`;
  markdown += `  --clientType besu \\\n`;
  markdown += `  --privacy true \\\n`;
  markdown += `  --monitoring loki \\\n`;
  markdown += `  --explorer blockscout\n`;
  markdown += `\`\`\`\n\n`;
  
  markdown += `### Azure Multi-Region Production\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npx quorum-dev-quickstart \\\n`;
  markdown += `  --clientType besu \\\n`;
  markdown += `  --azureEnable true \\\n`;
  markdown += `  --azureRegions "eastus,westus2,northeurope" \\\n`;
  markdown += `  --azureDeploymentDefault aks \\\n`;
  markdown += `  --azureNetworkMode hub-spoke \\\n`;
  markdown += `  --monitoring splunk \\\n`;
  markdown += `  --validators 7\n`;
  markdown += `\`\`\`\n\n`;
  
  markdown += `### Specialized RPC Configuration\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npx quorum-dev-quickstart \\\n`;
  markdown += `  --clientType besu \\\n`;
  markdown += `  --rpcNodeTypes "api:standard:3;admin:admin:1;trace:trace:1;ws:websocket:2" \\\n`;
  markdown += `  --azureNodePlacement "validators:aks:eastus+westus2;rpc:aca:northeurope"\n`;
  markdown += `\`\`\`\n\n`;
  
  markdown += `### Validation Only (Dry Run)\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npx quorum-dev-quickstart \\\n`;
  markdown += `  --clientType besu \\\n`;
  markdown += `  --azureRegions "eastus,westus" \\\n`;
  markdown += `  --validate true \\\n`;
  markdown += `  --noFileWrite true\n`;
  markdown += `\`\`\`\n\n`;
  
  markdown += `### Custom Network Topology\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npx quorum-dev-quickstart \\\n`;
  markdown += `  --clientType besu \\\n`;
  markdown += `  --validators 5 \\\n`;
  markdown += `  --rpcNodes 3 \\\n`;
  markdown += `  --archiveNodes 1 \\\n`;
  markdown += `  --bootNodes 2 \\\n`;
  markdown += `  --consensus qbft \\\n`;
  markdown += `  --chainId 12345\n`;
  markdown += `\`\`\`\n\n`;
  

  
  return markdown;
}

// Main execution
function main() {
  console.log('🔍 Generating CLI documentation from help output...');
  
  // Ensure build directory exists
  const buildPath = path.resolve(__dirname, '../build');
  if (!fs.existsSync(buildPath)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const helpText = getCliHelp();
  if (!helpText) {
    console.error('❌ Could not retrieve CLI help text');
    process.exit(1);
  }
  
  console.log('✅ Retrieved CLI help text');
  
  const options = parseHelpText(helpText);
  console.log(`✅ Parsed ${Object.keys(options).length} CLI options`);
  
  const markdown = generateEnhancedMarkdown(options);
  
  // Ensure docs directory exists
  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  const outputPath = path.resolve(docsDir, 'cli-flags.md');
  fs.writeFileSync(outputPath, markdown, 'utf-8');
  
  console.log(`✅ Documentation generated: ${outputPath}`);
  console.log(`📊 Generated ${markdown.split('\n').length} lines of documentation`);
}

if (require.main === module) {
  main();
}
