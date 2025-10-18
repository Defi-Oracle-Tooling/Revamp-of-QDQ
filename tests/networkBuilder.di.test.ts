import { buildNetwork, NetworkContext } from '../src/networkBuilder';

// This test verifies that providing testHooks.fileRenderingModule causes buildNetwork to use injected functions

describe('Network Builder DI Hooks', () => {
  it('should use injected fileRendering module instead of real implementation', async () => {
    const calls: string[] = [];

    const injected = {
  renderTemplateDir: jest.fn((dir: string, _ctx: NetworkContext) => { calls.push(`renderTemplateDir:${dir}`); }),
  copyFilesDir: jest.fn((dir: string, _ctx: NetworkContext) => { calls.push(`copyFilesDir:${dir}`); }),
  validateDirectoryExists: jest.fn((_p: string) => {
        // Pretend all template/file directories exist but avoid actual FS operations
        return true;
      })
    };

    const ctx: NetworkContext = {
      clientType: 'besu',
      nodeCount: 1,
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      outputPath: './out-di-test',
      validators: 1,
      testHooks: { fileRenderingModule: injected }
    };

    // Run build - should succeed without throwing (injected functions do nothing real)
    await expect(buildNetwork(ctx)).resolves.toBeUndefined();

    // Assertions: our injected functions were called and real dynamic import path not required
    expect(injected.renderTemplateDir).toHaveBeenCalled();
    expect(injected.copyFilesDir).toHaveBeenCalled();
    // Validate at least one call recorded
    expect(calls.length).toBeGreaterThan(0);
  });
});
