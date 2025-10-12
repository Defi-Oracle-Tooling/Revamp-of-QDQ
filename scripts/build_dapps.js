#!/usr/bin/env node
/**
 * DApp Build Script
 *
 * Usage:
 *   node scripts/build_dapps.js --path ./my-network [--dry]
 *
 * Scans the provided network output directory for dapps/* subdirectories and
 * attempts to install and build recognized frontend projects (currently Next.js).
 *
 * Conventions:
 * - Frontend located at dapps/<name>/frontend
 * - Uses npm; will skip if package.json missing
 * - --dry performs detection only (no installs/builds)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { dry: false, networkPath: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry') parsed.dry = true;
    else if (a === '--path') parsed.networkPath = args[++i];
  }
  if (!parsed.networkPath) {
    console.error('Missing required --path <networkOutputDir>');
    process.exit(1);
  }
  return parsed;
}

function run(cmd, cwd) {
  const [bin, ...rest] = cmd.split(/\s+/);
  const res = spawnSync(bin, rest, { cwd, stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`Command failed (${cmd}) in ${cwd}`);
  }
}

function detectDapps(networkPath) {
  const dappsRoot = path.join(networkPath, 'dapps');
  if (!fs.existsSync(dappsRoot)) return [];
  return fs.readdirSync(dappsRoot)
    .filter(name => fs.statSync(path.join(dappsRoot, name)).isDirectory())
    .map(name => ({ name, root: path.join(dappsRoot, name) }));
}

function buildFrontend(dapp) {
  const frontendDir = path.join(dapp.root, 'frontend');
  if (!fs.existsSync(frontendDir)) {
    console.log(`⚪  [skip] ${dapp.name}: no frontend directory`);
    return;
  }
  const pkgPath = path.join(frontendDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`⚪  [skip] ${dapp.name}: no package.json`);
    return;
  }
  console.log(`🔧  Building DApp frontend: ${dapp.name}`);
  run('npm install', frontendDir);
  // Next.js build or generic build
  run('npm run build', frontendDir);
  console.log(`✅  Built ${dapp.name}`);
}

function main() {
  const { dry, networkPath } = parseArgs();
  const absNet = path.resolve(networkPath);
  if (!fs.existsSync(absNet)) {
    console.error(`Network path does not exist: ${absNet}`);
    process.exit(1);
  }
  const dapps = detectDapps(absNet);
  if (dapps.length === 0) {
    console.log('No dapps detected.');
    return;
  }
  console.log(`Found ${dapps.length} dapp(s): ${dapps.map(d => d.name).join(', ')}`);
  if (dry) {
    console.log('Dry run complete. (No builds executed)');
    return;
  }
  for (const d of dapps) {
    try {
      buildFrontend(d);
    } catch (err) {
      console.error(`❌  Failed to build ${d.name}: ${(err && err.message) || err}`);
    }
  }
}

if (require.main === module) {
  main();
}
