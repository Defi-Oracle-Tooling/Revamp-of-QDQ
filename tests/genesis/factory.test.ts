import { generateGenesis } from "../../src/genesis/factory";
import { NetworkContext } from "../../src/networkBuilder";

describe("Genesis Factory", () => {
  describe("generateGenesis", () => {
    it("should return undefined when no genesisPreset or consensus is specified", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test"
      };

      const result = generateGenesis(context as NetworkContext);
      expect(result).toBeUndefined();
    });

    it("should generate IBFT genesis from preset", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test",
        genesisPreset: "ibft",
        validators: 4
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.filename).toBe("ibft-genesis.json");
      expect(result!.content).toContain('"chainId": 1337');
      expect(result!.content).toContain('"ibft"');
      expect(result!.content).toContain('"epochLength": 30000');
      expect(result!.content).toContain('"blockperiodseconds": 2');
      expect(result!.content).toContain('IBFT_PLACEHOLDER_4');
    });

    it("should generate QBFT genesis from preset", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test",
        genesisPreset: "qbft",
        validators: 6,
        chainId: 9999
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.filename).toBe("qbft-genesis.json");
      expect(result!.content).toContain('"chainId": 9999');
      expect(result!.content).toContain('"qbft"');
      expect(result!.content).toContain('IBFT_PLACEHOLDER_6');
    });

    it("should generate Clique genesis from preset", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 3,
        privacy: false,
        monitoring: "elk",
        blockscout: true,
        chainlens: false,
        outputPath: "/tmp/test",
        genesisPreset: "clique",
        validators: 3
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.filename).toBe("clique-genesis.json");
      expect(result!.content).toContain('"chainId": 1339');
      expect(result!.content).toContain('"clique"');
      expect(result!.content).toContain('"period": 5');
      expect(result!.content).toContain('"epoch": 30000');
      expect(result!.content).toContain('CLIQUE_PLACEHOLDER_3');
    });

    it("should generate genesis from direct consensus parameter", () => {
      const context: Partial<NetworkContext> = {
        clientType: "goquorum",
        nodeCount: 5,
        privacy: true,
        monitoring: "splunk",
        blockscout: false,
        chainlens: true,
        outputPath: "/tmp/test",
        consensus: "ethash",
        chainId: 5555,
        validators: 5
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.filename).toBe("ethash-genesis.json");
      expect(result!.content).toContain('"chainId": 5555');
      expect(result!.content).not.toContain('"ibft"');
      expect(result!.content).not.toContain('"clique"');
      expect(result!.content).not.toContain('PLACEHOLDER');
    });

    it("should use default values when not specified", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test",
        consensus: "ibft"
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.content).toContain('"chainId": 1337'); // default for ibft
      expect(result!.content).toContain('IBFT_PLACEHOLDER_4'); // default validators
    });

    it("should prefer consensus over genesisPreset", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test",
        genesisPreset: "ibft",
        consensus: "clique",
        validators: 2
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.filename).toBe("clique-genesis.json");
      expect(result!.content).toContain('"clique"');
      expect(result!.content).not.toContain('"ibft"');
    });

    it("should handle unknown genesis preset gracefully", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test",
        genesisPreset: "unknown_preset",
        validators: 4
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(result!.filename).toBe("ibft-genesis.json"); // fallback to ibft
      expect(result!.content).toContain('"ibft"');
    });

    it("should generate valid JSON", () => {
      const context: Partial<NetworkContext> = {
        clientType: "besu",
        nodeCount: 4,
        privacy: false,
        monitoring: "loki",
        blockscout: false,
        chainlens: false,
        outputPath: "/tmp/test",
        consensus: "qbft",
        chainId: 1234,
        validators: 3
      };

      const result = generateGenesis(context as NetworkContext);

      expect(result).toBeDefined();
      expect(() => JSON.parse(result!.content)).not.toThrow();

      const parsed = JSON.parse(result!.content);
      expect(parsed.config.chainId).toBe(1234);
      expect(parsed.config.qbft).toBeDefined();
      expect(parsed.alloc).toBeDefined();
      expect(parsed.difficulty).toBe("0x1");
      expect(parsed.gasLimit).toBe("0x1fffffffffffff");
    });
  });
});