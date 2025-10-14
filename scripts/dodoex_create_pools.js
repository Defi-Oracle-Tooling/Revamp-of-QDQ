// Automated Dodoex PMM pool creation for all supported tokens on ChainID 138
// Requires: ethers.js, Dodoex PMM contracts deployed on ChainID 138

const { ethers } = require('ethers');
const tokens = require('../src/config/currencies');
const { getSecret } = require('./azure_keyvault_secrets');

// Dodoex PMM Factory contract address (update as needed)
let DODOEX_FACTORY;
let WETH;

// ABI for Dodoex PMM Factory (simplified)
const FACTORY_ABI = [
  'function createDODOPrivatePool(address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount) external returns (address)'
];

async function main() {
  // Fetch secrets from Azure Key Vault
  const rpcUrl = await getSecret('RPC_URL');
  const privateKey = await getSecret('PRIVATE_KEY');
  DODOEX_FACTORY = await getSecret('DODOEX_FACTORY');
  WETH = await getSecret('WETH');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const factory = new ethers.Contract(DODOEX_FACTORY, FACTORY_ABI, signer);

  for (const token of tokens) {
    try {
      // Example: create pool with 0 initial liquidity
      const tx = await factory.createDODOPrivatePool(token.address, WETH, 0, 0);
      console.log(`Pool created for ${token.symbol}:`, tx.hash);
    } catch (err) {
      console.error(`Error creating pool for ${token.symbol}:`, err.message);
    }
  }
}

main();
