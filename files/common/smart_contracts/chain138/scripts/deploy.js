const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Deploy ChainID 138 smart contract ecosystem
 * Deploys ISO-20022 compliant e-money tokens, bridge, and compliance oracle
 */

async function main() {
  console.log('🚀 Deploying ChainID 138 Smart Contract Ecosystem...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(await deployer.getBalance()));

  const deploymentResults = {
    network: 'ChainID 138',
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. Deploy Compliance Oracle
    console.log('\n📋 Deploying ComplianceOracle...');
    const ComplianceOracle = await ethers.getContractFactory('ComplianceOracle');
    const complianceOracle = await ComplianceOracle.deploy(deployer.address);
    await complianceOracle.deployed();
    console.log('✅ ComplianceOracle deployed to:', complianceOracle.address);
    
    deploymentResults.contracts.complianceOracle = {
      address: complianceOracle.address,
      transactionHash: complianceOracle.deployTransaction.hash,
      gasUsed: (await complianceOracle.deployTransaction.wait()).gasUsed.toString()
    };

    // 2. Deploy Lock-and-Mint Bridge
    console.log('\n🌉 Deploying LockAndMintBridge...');
    const LockAndMintBridge = await ethers.getContractFactory('LockAndMintBridge');
    const bridge = await LockAndMintBridge.deploy(
      2, // minValidatorCount
      ethers.utils.parseEther('0.001'), // bridgeFee (0.001 ETH)
      deployer.address // feeRecipient
    );
    await bridge.deployed();
    console.log('✅ LockAndMintBridge deployed to:', bridge.address);
    
    deploymentResults.contracts.bridge = {
      address: bridge.address,
      transactionHash: bridge.deployTransaction.hash,
      gasUsed: (await bridge.deployTransaction.wait()).gasUsed.toString(),
      config: {
        minValidatorCount: 2,
        bridgeFee: '0.001 ETH',
        feeRecipient: deployer.address
      }
    };

    // 3. Deploy ISO-20022 Compliant E-Money Tokens
    console.log('\n💰 Deploying E-Money Tokens...');
    
    const tokens = [
      {
        name: 'Euro Coin - Chain138',
        symbol: 'EURC138',
        backing: 'EURC',
        framework: 'MiFID II',
        supply: ethers.utils.parseEther('1000000') // 1M tokens
      },
      {
        name: 'USD Coin - Chain138',
        symbol: 'USDC138',
        backing: 'USDC',
        framework: 'BSA/AML',
        supply: ethers.utils.parseEther('1000000')
      },
      {
        name: 'Tether - Chain138',
        symbol: 'USDT138',
        backing: 'USDT',
        framework: 'BSA/AML',
        supply: ethers.utils.parseEther('1000000')
      },
      {
        name: 'Dai Stablecoin - Chain138',
        symbol: 'DAI138',
        backing: 'DAI',
        framework: 'MiFID II',
        supply: ethers.utils.parseEther('1000000')
      },
      {
        name: 'M1 GRU Equivalent USD',
        symbol: 'M1USD',
        backing: 'USD',
        framework: 'BSA/AML',
        supply: ethers.utils.parseEther('10000000') // 10M tokens
      },
      {
        name: 'M1 GRU Equivalent EUR',
        symbol: 'M1EUR',
        backing: 'EUR',
        framework: 'MiFID II',
        supply: ethers.utils.parseEther('10000000')
      },
      {
        name: 'M1 GRU Equivalent GBP',
        symbol: 'M1GBP',
        backing: 'GBP',
        framework: 'FCA',
        supply: ethers.utils.parseEther('5000000')
      },
      {
        name: 'M1 GRU Equivalent JPY',
        symbol: 'M1JPY',
        backing: 'JPY',
        framework: 'JFSA',
        supply: ethers.utils.parseEther('1000000000') // Larger supply for JPY
      }
    ];

    deploymentResults.contracts.eMoneyTokens = [];

    const ISO20022Token = await ethers.getContractFactory('ISO20022CompliantEMoneyToken');
    
    for (const tokenConfig of tokens) {
      console.log(`Deploying ${tokenConfig.name} (${tokenConfig.symbol})...`);
      
      const token = await ISO20022Token.deploy(
        tokenConfig.name,
        tokenConfig.symbol,
        tokenConfig.backing,
        tokenConfig.framework,
        complianceOracle.address,
        tokenConfig.supply
      );
      await token.deployed();
      
      // Set bridge contract as authorized
      await token.grantRole(await token.BRIDGE_ROLE(), bridge.address);
      
      // Add token to bridge as supported
      await bridge.addSupportedToken(token.address);
      
      console.log(`✅ ${tokenConfig.symbol} deployed to:`, token.address);
      
      deploymentResults.contracts.eMoneyTokens.push({
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        address: token.address,
        backing: tokenConfig.backing,
        framework: tokenConfig.framework,
        initialSupply: ethers.utils.formatEther(tokenConfig.supply),
        transactionHash: token.deployTransaction.hash,
        gasUsed: (await token.deployTransaction.wait()).gasUsed.toString()
      });
    }

    // 4. Configure Bridge Networks
    console.log('\n🔗 Configuring Bridge Networks...');
    
    const networks = [
      { chainId: 1, name: 'Ethereum Mainnet', confirmations: 12 },
      { chainId: 137, name: 'Polygon', confirmations: 20 },
      { chainId: 56, name: 'BSC', confirmations: 15 },
      { chainId: 42161, name: 'Arbitrum', confirmations: 1 },
      { chainId: 10, name: 'Optimism', confirmations: 1 },
      { chainId: 43114, name: 'Avalanche', confirmations: 5 }
    ];

    for (const network of networks) {
      await bridge.addNetwork(
        network.chainId,
        ethers.constants.AddressZero, // Placeholder bridge contract
        network.confirmations,
        `https://rpc-${network.name.toLowerCase()}.example.com`,
        `https://etherscan.io` // Placeholder explorer
      );
      console.log(`✅ Added network: ${network.name} (Chain ${network.chainId})`);
    }

    // 5. Setup Initial Compliance Data
    console.log('\n🔐 Setting up initial compliance data...');
    
    // Add deployer to compliance whitelist
    const requirementsMet = ['KYC_VERIFICATION', 'AML_SCREENING', 'SANCTIONS_CHECK'];
    await complianceOracle.updateComplianceRecord(
      deployer.address,
      true, // sanctionsChecked
      true, // amlVerified
      true, // kycCompleted
      'LOW', // riskLevel
      'US', // jurisdiction
      'ADMIN_ACCOUNT', // regulatoryCode
      Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // expiryDate (1 year)
      requirementsMet,
      'TATUM_COMPLIANCE' // complianceProvider
    );
    
    // Grant regulatory approvals
    await complianceOracle.grantRegulatoryApproval(deployer.address, 'BSA_AML');
    await complianceOracle.grantRegulatoryApproval(deployer.address, 'MIFID2');
    
    console.log('✅ Compliance data configured for deployer');

    // 6. Grant Bridge Roles
    console.log('\n🎯 Configuring Bridge Permissions...');
    await bridge.grantRole(await bridge.VALIDATOR_ROLE(), deployer.address);
    await bridge.grantRole(await bridge.RELAYER_ROLE(), deployer.address);
    console.log('✅ Bridge roles configured');

    // 7. Save Deployment Results
    const outputDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `chain138-deployment-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(deploymentResults, null, 2));
    
    console.log('\n📄 Deployment Results:');
    console.log('=====================================');
    console.log(`Network: ChainID 138`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`ComplianceOracle: ${complianceOracle.address}`);
    console.log(`LockAndMintBridge: ${bridge.address}`);
    console.log(`E-Money Tokens: ${deploymentResults.contracts.eMoneyTokens.length} deployed`);
    console.log(`Results saved to: ${outputFile}`);
    
    // 8. Generate Contract ABIs
    console.log('\n📋 Generating Contract ABIs...');
    const abiDir = path.join(outputDir, 'abis');
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir);
    }
    
    // Save ABIs
    const contracts = {
      ComplianceOracle: ComplianceOracle,
      LockAndMintBridge: LockAndMintBridge,
      ISO20022CompliantEMoneyToken: ISO20022Token
    };
    
    for (const [name, contract] of Object.entries(contracts)) {
      fs.writeFileSync(
        path.join(abiDir, `${name}.json`),
        JSON.stringify(contract.interface.format('json'), null, 2)
      );
    }
    
    console.log('✅ Contract ABIs saved to:', abiDir);

    // 9. Generate Frontend Configuration
    const frontendConfig = {
      chainId: 138,
      contracts: {
        complianceOracle: complianceOracle.address,
        bridge: bridge.address,
        tokens: deploymentResults.contracts.eMoneyTokens.reduce((acc, token) => {
          acc[token.symbol] = {
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            backing: token.backing,
            framework: token.framework
          };
          return acc;
        }, {})
      },
      rpc: 'http://127.0.0.1:8545',
      explorer: 'http://localhost:26000',
      etherscan: 'https://etherscan.io'
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'frontend-config.json'),
      JSON.stringify(frontendConfig, null, 2)
    );
    
    console.log('✅ Frontend configuration saved');

    console.log('\n🎉 ChainID 138 Ecosystem Deployment Complete!');
    console.log('\nNext Steps:');
    console.log('1. Update frontend with contract addresses');
    console.log('2. Configure Tatum.io integration with deployed contracts');
    console.log('3. Set up Etherscan monitoring for wallet visibility');
    console.log('4. Configure cross-chain bridge validators');
    console.log('5. Test end-to-end wallet integration');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });