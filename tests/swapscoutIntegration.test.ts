import { NetworkContext, buildNetwork } from '../src/networkBuilder';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Swapscout (LI.FI) integration smoke test
 * Verifies that Swapscout configuration is properly generated
 */

describe('Swapscout Integration Smoke', () => {
  const tmpRoot = path.resolve(__dirname, '..', '.tmp-swapscout-test');

  beforeAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpRoot, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(tmpRoot)) {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  it('generates swapscout configuration when enabled', async () => {
    const outputPath = path.join(tmpRoot, 'network-with-swapscout');
    const ctx: NetworkContext = {
      clientType: 'besu',
      nodeCount: 4,
      privacy: false,
      monitoring: 'loki',
      blockscout: true,
      chainlens: false,
      outputPath,
      swapscout: true,
      lifiConfig: {
        apiKey: 'test-api-key',
        enableBridgeAnalytics: true,
        supportedChains: ['1', '137'],
        swapscoutEndpoint: 'https://explorer.li.fi'
      }
    };

    await buildNetwork(ctx);

    // Check Swapscout compose file exists
    const swapscoutCompose = path.join(outputPath, 'swapscout-compose.yml');
    expect(fs.existsSync(swapscoutCompose)).toBe(true);

    // Check Swapscout static files exist
    const nginxConfig = path.join(outputPath, 'swapscout', 'nginx.conf');
    const errorPage = path.join(outputPath, 'swapscout', '5xx.html');
    expect(fs.existsSync(nginxConfig)).toBe(true);
    expect(fs.existsSync(errorPage)).toBe(true);

    // Check startup script exists
    const startScript = path.join(outputPath, 'start-swapscout.sh');
    expect(fs.existsSync(startScript)).toBe(true);

    // Verify integration summary includes LI.FI config
    const summaryPath = path.join(outputPath, 'integrations', 'integrations-summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      expect(summary.swapscout).toBe(true);
      expect(summary.lifi).toBeTruthy();
      expect(summary.lifi.apiKey).toBe('test-api-key');
    }
  });

  test('works with both blockscout and swapscout enabled', async () => {
    const outputPath = path.join(tmpRoot, 'dual-explorer-test');
    const ctx: NetworkContext = {
      clientType: 'besu',
      consensus: 'ibft',
      nodeCount: 4,
      privacy: false,
      monitoring: 'loki',
      blockscout: true,
      chainlens: false,
      outputPath,
      swapscout: true,
      lifiConfig: {
        apiKey: 'test-api-key',
        supportedChains: ['1', '137', '56'],
        enableBridgeAnalytics: true,
        swapscoutEndpoint: 'https://li.quest/v1'
      }
    };

    await buildNetwork(ctx);

    // Both explorers should be present
    const dockerCompose = fs.readFileSync(path.join(outputPath, 'docker-compose.yml'), 'utf-8');
    expect(dockerCompose).toContain('blockscout');

    const swapscoutCompose = path.join(outputPath, 'swapscout-compose.yml');
    expect(fs.existsSync(swapscoutCompose)).toBe(true);
  });
});