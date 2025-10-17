import * as fs from 'fs';
import path from 'path';
import { buildNetwork, NetworkContext } from '../src/networkBuilder';

/**
 * Smoke test for optional DApp inclusion.
 * Uses a real temporary output directory and does not mock fs to verify that:
 *  - DApp directory is copied
 *  - .env.local is generated when walletconnectProjectId provided
 *  - Instructions file exists with expected markers
 */

describe('DApp Inclusion Smoke', () => {
  const tmpRoot = path.resolve(__dirname, '..', '.tmp-dapp-test');
  const dappName = 'quorumToken';

  beforeAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpRoot, { recursive: true });
  });

  afterAll(() => {
    // Cleanup to prevent residue affecting other tests
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('copies dapp and creates env + instructions', async () => {
    const outputPath = path.join(tmpRoot, 'network-out');
    const ctx: NetworkContext = {
      clientType: 'besu',
      nodeCount: 4,
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      outputPath,
      includeDapp: dappName,
      walletconnectProjectId: 'test-project-id'
    };

    await buildNetwork(ctx);

    const dappDir = path.join(outputPath, 'dapps', dappName);
    expect(fs.existsSync(dappDir)).toBe(true);

    const envPath = path.join(dappDir, '.env.local');
    expect(fs.existsSync(envPath)).toBe(true);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    expect(envContent).toContain('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=test-project-id');

    const instructionsPath = path.join(dappDir, 'dapp-INSTRUCTIONS.md');
  expect(fs.existsSync(instructionsPath)).toBe(true);
    const instructions = fs.readFileSync(instructionsPath, 'utf-8');
    expect(instructions).toContain(`# ${dappName} DApp Usage`);
    expect(instructions).toContain('npm install');
  expect(instructions).toContain('WalletConnect Project ID: test-project-id');
  });

  it('skips env file when walletconnectProjectId absent', async () => {
    const outputPath = path.join(tmpRoot, 'network-out-no-wc');
    const ctx: NetworkContext = {
      clientType: 'besu',
      nodeCount: 4,
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      outputPath,
      includeDapp: dappName
    };

    await buildNetwork(ctx);
    const dappDir = path.join(outputPath, 'dapps', dappName);
    expect(fs.existsSync(dappDir)).toBe(true);
    const envPath = path.join(dappDir, '.env.local');
    expect(fs.existsSync(envPath)).toBe(false); // should not exist
  });

  it('detects dapp via build_dapps --dry', () => {
    const outputPath = path.join(tmpRoot, 'network-out-detect');
    const ctx: NetworkContext = {
      clientType: 'besu',
      nodeCount: 4,
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      outputPath,
      includeDapp: dappName
    };
    return buildNetwork(ctx).then(() => {
      const scriptPath = path.resolve(__dirname, '../scripts/build_dapps.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
      // Simulate detection manually (avoid spawning child process in unit test)
      const dappsDir = path.join(outputPath, 'dapps');
      const dirs = fs.existsSync(dappsDir) ? fs.readdirSync(dappsDir).filter(f => fs.statSync(path.join(dappsDir, f)).isDirectory()) : [];
      expect(dirs).toContain(dappName);
    });
  });
});
