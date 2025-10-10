import { NetworkContext } from '../src/networkBuilder';
import { validateContext } from '../src/networkValidator';

describe('Network Validation', () => {
  let baseContext: NetworkContext;

  beforeEach(() => {
    baseContext = {
      clientType: 'besu',
      nodeCount: 4,
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      outputPath: './test-network'
    };
  });

  describe('validateContext', () => {
    it('should validate a basic valid context', () => {
      expect(() => validateContext(baseContext)).not.toThrow();
    });

    it('should reject invalid client type', () => {
      const invalidContext = { ...baseContext, clientType: 'invalid' as any };
      expect(() => validateContext(invalidContext))
        .toThrow('Invalid client type');
    });

    it('should reject missing output path', () => {
      const invalidContext = { ...baseContext, outputPath: '' };
      expect(() => validateContext(invalidContext))
        .toThrow('Output path is required');
    });

    it('should validate Azure configuration', () => {
      const contextWithAzure = {
        ...baseContext,
        azureEnable: true,
        azureRegions: ['eastus', 'westus2']
      };
      expect(() => validateContext(contextWithAzure)).not.toThrow();
    });

    it('should reject Azure config without regions', () => {
      const invalidAzureContext = {
        ...baseContext,
        azureEnable: true
      };
      expect(() => validateContext(invalidAzureContext))
        .toThrow('Azure deployment requires');
    });

    it('should validate node counts', () => {
      const contextWithNodes = {
        ...baseContext,
        validators: 5,
        rpcNodes: 2,
        archiveNodes: 1
      };
      expect(() => validateContext(contextWithNodes)).not.toThrow();
    });

    it('should reject invalid validator count', () => {
      const invalidContext = { ...baseContext, validators: 0 };
      expect(() => validateContext(invalidContext))
        .toThrow('Must have at least 1 validator');
    });

    it('should reject negative RPC node count', () => {
      const invalidContext = { ...baseContext, rpcNodes: -1 };
      expect(() => validateContext(invalidContext))
        .toThrow('RPC node count cannot be negative');
    });

    it('should validate consensus mechanisms', () => {
      const validConsensus = ['ibft', 'qbft', 'clique', 'ethash'];

      validConsensus.forEach(consensus => {
        const context = { ...baseContext, consensus: consensus as any };
        expect(() => validateContext(context)).not.toThrow();
      });
    });

    it('should reject invalid consensus mechanism', () => {
      const invalidContext = { ...baseContext, consensus: 'invalid' as any };
      expect(() => validateContext(invalidContext))
        .toThrow('Invalid consensus mechanism');
    });

    it('should validate chain ID range', () => {
      const validChainIds = [1, 1337, 31337, 4294967295];

      validChainIds.forEach(chainId => {
        const context = { ...baseContext, chainId };
        expect(() => validateContext(context)).not.toThrow();
      });
    });

    it('should reject invalid chain ID', () => {
      const invalidChainIds = [0, -1, 4294967296];

      invalidChainIds.forEach(chainId => {
        const context = { ...baseContext, chainId };
        expect(() => validateContext(context))
          .toThrow('Chain ID must be between 1 and 4294967295');
      });
    });
  });

  describe('Complex validation scenarios', () => {
    it('should validate complete production configuration', () => {
      const prodContext: NetworkContext = {
        ...baseContext,
        clientType: 'besu',
        validators: 7,
        rpcNodes: 3,
        archiveNodes: 1,
        bootNodes: 2,
        consensus: 'qbft',
        chainId: 12345,
        privacy: true,
        monitoring: 'splunk',
        blockscout: true,
        chainlens: true,
        azureEnable: true,
        azureRegions: ['eastus', 'westus2', 'northeurope'],
        azureDeploymentDefault: 'aks',
        azureNetworkMode: 'hub-spoke'
      };

      expect(() => validateContext(prodContext)).not.toThrow();
    });

    it('should validate GoQuorum configuration', () => {
      const goquorumContext = {
        ...baseContext,
        clientType: 'goquorum' as const,
        consensus: 'ibft' as const,
        privacy: true
      };

      expect(() => validateContext(goquorumContext)).not.toThrow();
    });
  });
});