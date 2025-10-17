// Automation wrapper to run Dodoex pool creation and auto-trader scripts securely

const { execSync } = require('child_process');

function runScript(script) {
  try {
    console.log(`Running: ${script}`);
    execSync(`node ${script}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Error running ${script}:`, err.message);
  }
}

async function main() {
  runScript('scripts/dodoex_create_pools.js');
  runScript('scripts/dodoex_fund_pools.js');
  runScript('scripts/dodoex_auto_trader.js');
}

main();
