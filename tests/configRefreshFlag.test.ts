import { spawnSync } from 'child_process';
import path from 'path';

/**
 * Test --refreshConfig flag invokes config refresh without requiring clientType.
 */
describe('CLI --refreshConfig flag', () => {
  it('outputs config refresh summary', () => {
    // Unset env to force vault fallback path (will throw if required secret missing)
    process.env.TATUM_API_KEY = 'dummy-key';
    const cliPath = path.join(__dirname, '..', 'build', 'index.js');
    // Ensure build exists; if not, fail fast.
    const result = spawnSync('node', [cliPath, '--refreshConfig'], { encoding: 'utf-8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Config refresh complete/);
    expect(result.stdout).toMatch(/wellsFargoEnabled/);
    expect(result.stdout).toMatch(/tatumTestnet/);
  });
});
