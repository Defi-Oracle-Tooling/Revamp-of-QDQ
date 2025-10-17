#!/usr/bin/env node
/* Smoke test script (Phase 5 prep)
 * Runs a quick validation + generation to a temp dir.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tmpDir = path.resolve(process.cwd(), 'tmp-smoke-network');
if (fs.existsSync(tmpDir)) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

const args = [ 'build/index.js', '--clientType', 'besu', '--privacy', 'false', '--monitoring', 'loki', '--blockscout', 'false', '--chainlens', 'false', '--outputPath', tmpDir, '--validate' ];
console.log('Running:', 'node', args.join(' '));
const res = spawnSync('node', args, { stdio: 'inherit' });
if (res.status !== 0) {
  console.error('Smoke test failed.');
  process.exit(res.status || 1);
}
if (!fs.existsSync(tmpDir)) {
  console.error('Expected output directory not created.');
  process.exit(1);
}
console.log('Smoke test completed.');
