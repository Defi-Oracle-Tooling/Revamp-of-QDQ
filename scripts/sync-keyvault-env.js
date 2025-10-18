#!/usr/bin/env node
/**
 * Sync selected environment variables into Azure Key Vault.
 * Usage: node scripts/sync-keyvault-env.js --vault <vaultName> [--dry] [--subset wf,tatum] [--confirm]
 */
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
require('dotenv').config();

const argv = yargs(hideBin(process.argv))
  .option('vault', { type: 'string', demandOption: true })
  .option('dry', { type: 'boolean', default: false })
  .option('subset', { type: 'string', describe: 'Comma list: wf,tatum' })
  .option('confirm', { type: 'boolean', default: false, describe: 'Required to actually push secrets' })
  .argv;

const categories = (argv.subset ? argv.subset.split(',').map(s => s.trim()) : ['wf','tatum']);

let SECRETS;
try {
  // Try built path first
  SECRETS = require('../build/secrets/constants.js').SECRETS;
} catch {
  try { SECRETS = require('../src/secrets/constants.ts').SECRETS; } catch { SECRETS = {}; }
}

const mappings = {
  tatum: [
    { env: 'TATUM_API_KEY', secret: SECRETS.TATUM_API_KEY, required: true },
    { env: 'TATUM_API_URL', secret: SECRETS.TATUM_API_URL }
  ],
  wf: [
    { env: 'WF_BASE_URL', secret: SECRETS.WF_BASE_URL },
    { env: 'WF_OAUTH_CLIENT_ID', secret: SECRETS.WF_OAUTH_CLIENT_ID },
    { env: 'WF_OAUTH_CLIENT_SECRET_REF', secret: SECRETS.WF_OAUTH_CLIENT_SECRET },
    { env: 'WF_MTLS_CERT_REF', secret: SECRETS.WF_MTLS_CERT },
    { env: 'WF_MTLS_KEY_REF', secret: SECRETS.WF_MTLS_KEY }
  ]
};

async function run() {
  const credential = new DefaultAzureCredential();
  const url = `https://${argv.vault}.vault.azure.net`;
  const client = new SecretClient(url, credential);

  const plan = [];
  for (const cat of categories) {
    const arr = mappings[cat] || [];
    for (const m of arr) {
      const val = process.env[m.env];
      if (!val) {
        if (m.required) throw new Error(`Missing required env var ${m.env}`);
        continue;
      }
      plan.push({ cat, env: m.env, secret: m.secret, value: val });
    }
  }

  if (!plan.length) {
    console.log('No secrets to sync.');
    return;
  }

  console.log('Sync Plan:');
  for (const p of plan) console.log(`  [${p.cat}] ${p.env} -> ${p.secret}`);

  if (argv.dry) {
    console.log('\n--dry run complete (no changes applied).');
    return;
  }

  if (!argv.confirm) {
    console.error('\nMissing --confirm flag. Aborting.');
    process.exit(1);
  }

  for (const p of plan) {
    await client.setSecret(p.secret, p.value);
    console.log(`Set secret ${p.secret}`);
  }

  console.log('\nSecret sync complete.');
}

run().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
