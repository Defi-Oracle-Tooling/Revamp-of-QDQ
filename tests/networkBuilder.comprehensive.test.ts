import { buildNetwork, formatAgentError, NetworkContext } from "../src/networkBuilder";
import { Spinner } from "../src/spinner";
import * as fileRendering from "../src/fileRendering";
import * as topologyResolver from "../src/topologyResolver";

// Mock dependencies
// Correct relative mock paths (was using ../../ which caused module resolution failures & retries)
jest.mock("../src/fileRendering");
jest.mock("../src/topologyResolver");
jest.mock("../src/spinner");

const mockFileRendering = fileRendering as jest.Mocked<typeof fileRendering>;
const mockTopologyResolver = topologyResolver as jest.Mocked<typeof topologyResolver>;
const mockSpinner = Spinner as jest.MockedClass<typeof Spinner>;

describe("Network Builder", () => {
  let mockSpinnerInstance: jest.Mocked<Spinner>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock spinner instance
    let running = false;
    mockSpinnerInstance = {
      text: "",
      get isRunning() { return running; },
      get isSettled() { return !running; },
      succeed: jest.fn().mockImplementation(async () => { running = false; }),
      fail: jest.fn().mockImplementation(async () => { running = false; }),
      start: jest.fn().mockImplementation(() => { running = true; }),
      stop: jest.fn().mockImplementation(() => { running = false; }),
      update: jest.fn()
    } as any;

    mockSpinner.mockImplementation(() => mockSpinnerInstance);

    // Default mocks
    // Adapt to async refactor: ensure both sync legacy and async functions are present
    (mockFileRendering as any).validateDirectoryExists.mockReturnValue(true);
    if ((mockFileRendering as any).renderTemplateDir) {
      (mockFileRendering as any).renderTemplateDir.mockImplementation(() => {});
    }
    if ((mockFileRendering as any).copyFilesDir) {
      (mockFileRendering as any).copyFilesDir.mockImplementation(() => {});
    }
    if ((mockFileRendering as any).renderTemplateDirAsync) {
      (mockFileRendering as any).renderTemplateDirAsync.mockImplementation(async () => {});
    }
    if ((mockFileRendering as any).copyFilesDirAsync) {
      (mockFileRendering as any).copyFilesDirAsync.mockImplementation(async () => {});
    }

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("formatAgentError", () => {
    it("should format Error instances correctly", () => {
      const error = new Error("Test error message");
      const result = formatAgentError(error);
      expect(result).toBe("[Agent Error] Test error message");
    });

    it("should format non-Error values correctly", () => {
      const result1 = formatAgentError("String error");
      expect(result1).toBe("[Agent Error] String error");

      const result2 = formatAgentError(42);
      expect(result2).toBe("[Agent Error] 42");

      const result3 = formatAgentError({ message: "Object error" });
      expect(result3).toBe("[Agent Error] [object Object]");
    });

    it("should handle undefined and null", () => {
      expect(formatAgentError(undefined)).toBe("[Agent Error] undefined");
      expect(formatAgentError(null)).toBe("[Agent Error] null");
    });
  });

  describe("buildNetwork", () => {
    const baseHooks = () => ({
      fileRenderingModule: {
        renderTemplateDir: (mockFileRendering as any).renderTemplateDir,
        copyFilesDir: (mockFileRendering as any).copyFilesDir,
        validateDirectoryExists: (mockFileRendering as any).validateDirectoryExists,
        renderTemplateDirAsync: (mockFileRendering as any).renderTemplateDirAsync,
        copyFilesDirAsync: (mockFileRendering as any).copyFilesDirAsync,
        validateDirectoryExistsAsync: (mockFileRendering as any).validateDirectoryExistsAsync
      }
    });

    const basicContext: NetworkContext = {
      clientType: "besu",
      nodeCount: 4,
      privacy: false,
      monitoring: "loki",
      blockscout: false,
      chainlens: false,
      outputPath: "/tmp/test-network",
      validators: 4,
      rpcNodes: 1,
      testHooks: baseHooks()
    };

    it("should build a basic network successfully", async () => {
      await buildNetwork(basicContext);
      // Spinner in current implementation constructed with empty string; just assert it was created
      expect(mockSpinner).toHaveBeenCalled();
      expect(mockSpinnerInstance.succeed).toHaveBeenCalledWith("Installation complete.");
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("/tmp/test-network"));
    });

    it("should handle besu client type", async () => {
  const besuContext = { ...basicContext, clientType: "besu" as const, testHooks: baseHooks() };

      await buildNetwork(besuContext);

      // Accept either sync or async calls depending on buildNetwork branch
      const anyRenderingCalled = (
        (mockFileRendering as any).renderTemplateDir?.mock.calls.some((c: any[]) => c[1] === besuContext) ||
        (mockFileRendering as any).renderTemplateDirAsync?.mock.calls.some((c: any[]) => c[1] === besuContext)
      );
      // If rendering not invoked, surface debug info
      if (!anyRenderingCalled) {
        console.error("Debug besu rendering calls", {
          syncCalls: (mockFileRendering as any).renderTemplateDir?.mock.calls,
          asyncCalls: (mockFileRendering as any).renderTemplateDirAsync?.mock.calls
        });
      }
      expect(anyRenderingCalled).toBe(true);
    });

    it("should handle goquorum client type", async () => {
  const goquorumContext = { ...basicContext, clientType: "goquorum" as const, testHooks: baseHooks() };

      await buildNetwork(goquorumContext);

      const anyRenderingCalled = (
        (mockFileRendering as any).renderTemplateDir?.mock.calls.some((c: any[]) => c[1] === goquorumContext) ||
        (mockFileRendering as any).renderTemplateDirAsync?.mock.calls.some((c: any[]) => c[1] === goquorumContext)
      );
      if (!anyRenderingCalled) {
        console.error("Debug goquorum rendering calls", {
          syncCalls: (mockFileRendering as any).renderTemplateDir?.mock.calls,
          asyncCalls: (mockFileRendering as any).renderTemplateDirAsync?.mock.calls
        });
      }
      expect(anyRenderingCalled).toBe(true);
    });

    it("should validate invalid client type", async () => {
  const invalidContext = { ...basicContext, clientType: "invalid" as any, testHooks: baseHooks() };

      await expect(buildNetwork(invalidContext)).rejects.toThrow(/Invalid or missing clientType/);
    });

    it("should validate missing output path", async () => {
  const invalidContext = { ...basicContext, outputPath: "", testHooks: baseHooks() };

      await expect(buildNetwork(invalidContext)).rejects.toThrow(/Output path is required/);
    });

    it("should validate node counts", async () => {
  const invalidContext1 = { ...basicContext, validators: 0, testHooks: baseHooks() };
      await expect(buildNetwork(invalidContext1)).rejects.toThrow(/Must have at least 1 validator/);

  const invalidContext2 = { ...basicContext, rpcNodes: -1, testHooks: baseHooks() };
      await expect(buildNetwork(invalidContext2)).rejects.toThrow(/RPC node count cannot be negative/);
    });

    it("should validate consensus mechanism", async () => {
  const invalidContext = { ...basicContext, consensus: "invalid" as any, testHooks: baseHooks() };

      await expect(buildNetwork(invalidContext)).rejects.toThrow(/Invalid consensus mechanism/);
    });

    it("should validate chain ID range", async () => {
  const invalidContext1 = { ...basicContext, chainId: 0, testHooks: baseHooks() };
      await expect(buildNetwork(invalidContext1)).rejects.toThrow(/Chain ID must be between 1 and/);

  const invalidContext2 = { ...basicContext, chainId: 4294967296, testHooks: baseHooks() };
      await expect(buildNetwork(invalidContext2)).rejects.toThrow(/Chain ID must be between 1 and/);
    });

    it("should handle Azure configuration", async () => {
      const azureContext = {
        ...basicContext,
        azureEnable: true,
        azureRegions: ["eastus", "westus"],
        azureOutputDir: "/tmp/azure"
      };

      // Mock resolveAzureTopology to return undefined directly (not a Promise) so buildNetwork doesn't treat it as a topology object
      (mockTopologyResolver.resolveAzureTopology as jest.Mock).mockImplementation(() => undefined);

      await buildNetwork(azureContext);

      expect(mockTopologyResolver.resolveAzureTopology).toHaveBeenCalledWith(azureContext);
    });

    it("should validate Azure configuration requirements", async () => {
      const invalidAzureContext1 = {
        ...basicContext,
        azureEnable: true
        // Missing azureRegions and azureAllRegions
      };

      await expect(buildNetwork(invalidAzureContext1)).rejects.toThrow(
        /Azure deployment requires either azureRegions or azureAllRegions/
      );

      const invalidAzureContext2 = {
        ...basicContext,
        azureEnable: true,
        azureRegions: []
      };

      await expect(buildNetwork(invalidAzureContext2)).rejects.toThrow(
        /azureRegions array cannot be empty/
      );
    });

    it("should handle Azure topology resolution errors", async () => {
      const azureContext = {
        ...basicContext,
        azureEnable: true,
        azureRegions: ["eastus"]
      };
      const azureError = new Error("Azure topology failed");
      (mockTopologyResolver.resolveAzureTopology as jest.Mock).mockImplementation(() => { throw azureError; });
      await expect(buildNetwork(azureContext)).rejects.toThrow(/Azure configuration error/);
      expect(mockSpinnerInstance.fail).toHaveBeenCalledWith(expect.stringContaining("Azure topology resolution failed"));
    });

    it("should handle template directory validation", async () => {
      mockFileRendering.validateDirectoryExists.mockImplementation((path: string) => {
        return !path.includes("nonexistent");
      });

      await buildNetwork(basicContext);

      // Should still succeed even if some directories don't exist
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });

    it("should handle file rendering errors gracefully", async () => {
  const renderError = new Error("Template rendering failed");
      if ((mockFileRendering as any).renderTemplateDirAsync) {
        (mockFileRendering as any).renderTemplateDirAsync.mockImplementation(async () => { throw renderError; });
      }
      if ((mockFileRendering as any).renderTemplateDir) {
        (mockFileRendering as any).renderTemplateDir.mockImplementation(() => { throw renderError; });
      }

      await expect(buildNetwork(basicContext)).rejects.toThrow();
      expect(mockSpinnerInstance.fail).toHaveBeenCalled();
  });
    // Removed redundant sync fallback error surfacing test (covered by graceful error test above)

    it("should process all monitoring options", async () => {
  const splunkContext = { ...basicContext, monitoring: "splunk" as const, testHooks: baseHooks() };
      await buildNetwork(splunkContext);
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();

  const elkContext = { ...basicContext, monitoring: "elk" as const, testHooks: baseHooks() };
      await buildNetwork(elkContext);
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();

  const lokiContext = { ...basicContext, monitoring: "loki" as const, testHooks: baseHooks() };
      await buildNetwork(lokiContext);
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });

    it("should handle privacy and explorer options", async () => {
      const fullFeaturesContext = {
        ...basicContext,
        privacy: true,
        blockscout: true,
        chainlens: true
      };

      await buildNetwork(fullFeaturesContext);

  const renderCalls = ((mockFileRendering as any).renderTemplateDir?.mock.calls.length || 0) + ((mockFileRendering as any).renderTemplateDirAsync?.mock.calls.length || 0);
  const copyCalls = ((mockFileRendering as any).copyFilesDir?.mock.calls.length || 0) + ((mockFileRendering as any).copyFilesDirAsync?.mock.calls.length || 0);
  expect(renderCalls).toBeGreaterThan(0);
  expect(copyCalls).toBeGreaterThan(0);
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });

    it("should handle consensus-specific configurations", async () => {
      const consensusTypes = ["ibft", "qbft", "clique", "ethash"] as const;

      for (const consensus of consensusTypes) {
  const consensusContext = { ...basicContext, consensus, testHooks: baseHooks() };
        await buildNetwork(consensusContext);
        expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
      }
    });

    it("should handle genesis preset configurations", async () => {
      const genesisContext = {
        ...basicContext,
        genesisPreset: "ibft",
        validators: 6,
        chainId: 1337
      };

      await buildNetwork(genesisContext);
      expect(mockSpinnerInstance.succeed).toHaveBeenCalled();
    });
  });
});