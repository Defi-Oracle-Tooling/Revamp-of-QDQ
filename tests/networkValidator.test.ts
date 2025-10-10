import { validateContext } from '../src/networkValidator';
import { NetworkContext } from '../src/networkBuilder';

describe('Network Validator', () => {
  const baseContext: Partial<NetworkContext> = {
    clientType: 'besu',
    nodeCount: 4,
    outputPath: './test-output',
    privacy: false,
    monitoring: 'loki',
    blockscout: false,
    chainlens: false,
    validators: 4
  };

  describe('Basic Validation', () => {
    it('should validate a minimal valid configuration', () => {
      const result = validateContext(baseContext);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should require clientType', () => {
      const context = { ...baseContext };
      delete context.clientType;

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual({
        field: 'clientType',
        message: 'Client type is required'
      });
    });

    it('should validate clientType values', () => {
      const context = { ...baseContext, clientType: 'invalid' as any };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'clientType' && issue.message.includes('must be')
      )).toBe(true);
    });

    it('should validate monitoring options', () => {
      const context = { ...baseContext, monitoring: 'invalid' as any };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'monitoring' && issue.message.includes('monitoring')
      )).toBe(true);
    });

    it('should validate consensus options', () => {
      const context = { ...baseContext, consensus: 'invalid' as any };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'consensus'
      )).toBe(true);
    });

    it('should validate validator count ranges', () => {
      const context = { ...baseContext, validators: -1 };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'validators'
      )).toBe(true);
    });
  });

  describe('Azure Configuration Validation', () => {
    it('should validate Azure region names', () => {
      const context = {
        ...baseContext,
        azureEnable: true,
        azureRegions: ['invalid-region']
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.message.includes('Invalid Azure region')
      )).toBe(true);
    });

    it('should validate Azure region classification', () => {
      const context = {
        ...baseContext,
        azureEnable: true,
        azureRegionClass: 'invalid' as any
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'azureRegionClass'
      )).toBe(true);
    });

    it('should validate Azure deployment types', () => {
      const context = {
        ...baseContext,
        azureEnable: true,
        azureDeploymentDefault: 'invalid' as any
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'azureDeploymentDefault'
      )).toBe(true);
    });

    it('should validate Azure network modes', () => {
      const context = {
        ...baseContext,
        azureEnable: true,
        azureNetworkMode: 'invalid' as any
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'azureNetworkMode'
      )).toBe(true);
    });

    it('should allow valid Azure configurations', () => {
      const context = {
        ...baseContext,
        azureEnable: true,
        azureRegions: ['eastus', 'westus2'],
        azureRegionClass: 'commercial' as any,
        azureDeploymentDefault: 'aks' as any,
        azureNetworkMode: 'hub-spoke' as any
      };

      const result = validateContext(context);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('RPC Configuration Validation', () => {
    it('should validate RPC node types', () => {
      const context = {
        ...baseContext,
        rpcDefaultType: 'invalid' as any
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'rpcDefaultType'
      )).toBe(true);
    });

    it('should validate RPC node type mappings', () => {
      const context = {
        ...baseContext,
        rpcNodeTypes: 'api:invalid:2'
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.message.includes('RPC node type')
      )).toBe(true);
    });

    it('should allow valid RPC configurations', () => {
      const context = {
        ...baseContext,
        rpcDefaultType: 'standard' as any,
        rpcNodeTypes: 'api:standard:2;admin:admin:1'
      };

      const result = validateContext(context);
      expect(result.valid).toBe(true);
    });
  });

  describe('Node Count Validation', () => {
    it('should validate positive node counts', () => {
      const context = {
        ...baseContext,
        bootNodes: -1,
        rpcNodes: -2,
        archiveNodes: -3
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should allow zero node counts', () => {
      const context = {
        ...baseContext,
        bootNodes: 0,
        rpcNodes: 0,
        archiveNodes: 0
      };

      const result = validateContext(context);
      expect(result.valid).toBe(true);
    });
  });

  describe('Explorer Configuration Validation', () => {
    it('should validate explorer options', () => {
      const context = {
        ...baseContext,
        explorer: 'invalid' as any
      };

      const result = validateContext(context);
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue =>
        issue.field === 'explorer'
      )).toBe(true);
    });

    it('should allow valid explorer configurations', () => {
      const context = {
        ...baseContext,
        explorer: 'both' as any,
        blockscout: true,
        chainlens: true
      };

      const result = validateContext(context);
      expect(result.valid).toBe(true);
    });
  });
});