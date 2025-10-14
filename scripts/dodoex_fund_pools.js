// Script to fund Dodoex PMM pools with initial liquidity
// Requires: ethers.js, deployed pool addresses, token and WETH balances

const { ethers } = require('ethers');
const tokens = require('../src/config/currencies');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
  const signer = provider.getSigner();

  for (const token of tokens) {
    if (!token.pmmPoolAddress) continue;
    // Example: deposit 1000 tokens and 1 WETH
    // Replace with actual deposit logic for Dodoex pool
    console.log(`Fund pool for ${token.symbol} at ${token.pmmPoolAddress}`);
    // ...deposit logic here...
  }
}

main();
