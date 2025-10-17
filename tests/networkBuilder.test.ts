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
      const result = validateContext(baseContext);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid client type', () => {
      const invalidContext = { ...baseContext, clientType: 'invalid' as any };
      const result = validateContext(invalidContext);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'clientType')).toBe(true);
    });

    it('should reject missing output path', () => {
      const invalidContext = { ...baseContext, outputPath: '' };
      const result = validateContext(invalidContext);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'outputPath')).toBe(true);
    });

    it('should validate Azure configuration', () => {
      const contextWithAzure = {
        ...baseContext,
        azureEnable: true,
        azureRegions: ['eastus', 'westus2']
      };
      const result = validateContext(contextWithAzure);
      expect(result.valid).toBe(true);
    });

    it('should reject Azure config without regions', () => {
      const invalidAzureContext = {
        ...baseContext,
        azureEnable: true
      };
      const result = validateContext(invalidAzureContext);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'azureRegions' || i.message.includes('regions'))).toBe(true);
    });

    it('should validate node counts', () => {
      const contextWithNodes = {
        ...baseContext,
        validators: 5,
        rpcNodes: 2,
        archiveNodes: 1
      };
      const result = validateContext(contextWithNodes);
      expect(result.valid).toBe(true);
    });

    it('should allow zero validators (advisory only)', () => {
      const context = { ...baseContext, validators: 0 };
      const result = validateContext(context);
      expect(result.valid).toBe(true);
      // May include advisory validators message; do not assert invalidity
    });

    it('should reject negative RPC node count', () => {
      const invalidContext = { ...baseContext, rpcNodes: -1 };
      const result = validateContext(invalidContext);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'rpcNodes')).toBe(true);
    });

    it('should validate consensus mechanisms', () => {
      const validConsensus = ['ibft', 'qbft', 'clique', 'ethash'];
      validConsensus.forEach(consensus => {
        const context = { ...baseContext, consensus: consensus as any };
        const result = validateContext(context);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid consensus mechanism', () => {
      const invalidContext = { ...baseContext, consensus: 'invalid' as any };
      const result = validateContext(invalidContext);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.field === 'consensus')).toBe(true);
    });

    it('should validate chain ID range', () => {
      const validChainIds = [1, 1337, 31337, 4294967295];
      validChainIds.forEach(chainId => {
        const context = { ...baseContext, chainId };
        const result = validateContext(context);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid chain ID', () => {
      const invalidChainIds = [0, -1, 4294967296];
      invalidChainIds.forEach(chainId => {
        const context = { ...baseContext, chainId };
        const result = validateContext(context);
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.field === 'chainId')).toBe(true);
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

  const result = validateContext(prodContext);
  expect(result.valid).toBe(true);
    });

    it('should validate GoQuorum configuration', () => {
      const goquorumContext = {
        ...baseContext,
        clientType: 'goquorum' as const,
        consensus: 'ibft' as const,
        privacy: true
      };

  const result = validateContext(goquorumContext);
  expect(result.valid).toBe(true);
    });
  });
});