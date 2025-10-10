import {
  parseRpcNodeTypes,
  parsePlacementDsl,
  resolveAzureTopology,
  ResolvedAzureTopology,
  RpcNodeConfig,
  TopologyFile
} from '../src/topologyResolver';
import { NetworkContext } from '../src/networkBuilder';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Topology Resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseRpcNodeTypes', () => {
    it('should parse single RPC node type configuration', () => {
      const result = parseRpcNodeTypes('api:standard:2');
      expect(result).toEqual({
        api: { type: 'standard', count: 2 }
      });
    });

    it('should parse multiple RPC node type configurations', () => {
      const result = parseRpcNodeTypes('api:standard:2;admin:admin:1;trace:trace:1');
      expect(result).toEqual({
        api: { type: 'standard', count: 2 },
        admin: { type: 'admin', count: 1 },
        trace: { type: 'trace', count: 1 }
      });
    });

    it('should handle invalid configurations gracefully', () => {
      const result = parseRpcNodeTypes('invalid:config');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty input', () => {
      const result = parseRpcNodeTypes('');
      expect(result).toBeUndefined();
    });

    it('should validate RPC node types', () => {
      const result = parseRpcNodeTypes('api:invalid_type:2');
      expect(result).toBeUndefined();
    });
  });

  describe('parsePlacementDsl', () => {
    it('should parse single placement configuration', () => {
      const result = parsePlacementDsl('validators:aks:eastus');
      expect(result).toEqual({
        validators: { deploymentType: 'aks', regions: ['eastus'] }
      });
    });

    it('should parse multiple regions for single role', () => {
      const result = parsePlacementDsl('validators:aks:eastus+westus2');
      expect(result).toEqual({
        validators: { deploymentType: 'aks', regions: ['eastus', 'westus2'] }
      });
    });

    it('should parse multiple placement configurations', () => {
      const result = parsePlacementDsl('validators:aks:eastus+westus2;rpc:aca:centralus');
      expect(result).toEqual({
        validators: { deploymentType: 'aks', regions: ['eastus', 'westus2'] },
        rpc: { deploymentType: 'aca', regions: ['centralus'] }
      });
    });

    it('should return undefined for empty input', () => {
      const result = parsePlacementDsl('');
      expect(result).toBeUndefined();
    });

    it('should handle malformed DSL gracefully', () => {
      const result = parsePlacementDsl('invalid:dsl');
      expect(result).toBeUndefined();
    });
  });

  describe('resolveAzureTopology', () => {
    const mockContext: NetworkContext = {
      clientType: 'besu',
      outputPath: './test-output',
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      validators: 4,
      azureEnable: true
    };

    it('should return undefined when Azure is not enabled', () => {
      const context = { ...mockContext, azureEnable: false, azureDeploy: false };
      const result = resolveAzureTopology(context);
      expect(result).toBeUndefined();
    });

    it('should resolve basic Azure topology with defaults', () => {
      const result = resolveAzureTopology(mockContext);
      expect(result).toBeDefined();
      expect(result?.regions).toEqual(['eastus']);
      expect(result?.placements.validators).toBeDefined();
      expect(result?.placements.validators.deploymentType).toBe('aks');
    });

    it('should handle custom regions', () => {
      const context = { ...mockContext, azureRegions: ['westus2', 'northeurope'] };
      const result = resolveAzureTopology(context);
      expect(result?.regions).toEqual(['westus2', 'northeurope']);
    });

    it('should handle region exclusions', () => {
      const context = { 
        ...mockContext, 
        azureAllRegions: true,
        azureRegionExclude: ['eastus', 'US']
      };
      const result = resolveAzureTopology(context);
      expect(result?.regions).toBeDefined();
      expect(result?.regions).not.toContain('eastus');
    });

    it('should resolve RPC node configurations', () => {
      const context = { 
        ...mockContext, 
        rpcNodes: 2,
        rpcDefaultType: 'standard' as any
      };
      const result = resolveAzureTopology(context);
      expect(result?.placements.rpcNodes).toBeDefined();
      expect(result?.placements.rpcNodes?.instanceCount).toBe(2);
      expect(result?.placements.rpcNodes?.rpcType).toBe('standard');
    });

    it('should handle topology file loading', () => {
      const mockTopology: TopologyFile = {
        strategy: 'single',
        regions: ['westus2'],
        placements: {
          validators: {
            deploymentType: 'aks',
            regions: ['westus2'],
            replicas: 3
          }
        }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockTopology));
      
      const context = { ...mockContext, azureTopologyFile: './topology.json' };
      const result = resolveAzureTopology(context);
      
      expect(mockFs.readFileSync).toHaveBeenCalledWith('./topology.json', 'utf-8');
      expect(result?.regions).toEqual(['westus2']);
      expect(result?.placements.validators?.replicas).toBe(3);
    });

    it('should handle topology file loading errors', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const context = { ...mockContext, azureTopologyFile: './missing.json' };
      
      expect(() => resolveAzureTopology(context)).toThrow('Failed to load topology file ./missing.json: File not found');
    });

    it('should handle network configuration', () => {
      const context = { 
        ...mockContext, 
        azureNetworkMode: 'hub-spoke' as any,
        azureRegions: ['eastus', 'westus2']
      };
      const result = resolveAzureTopology(context);
      
      expect(result?.network?.mode).toBe('hub-spoke');
      expect(result?.network?.hubRegion).toBe('eastus');
      expect(result?.network?.vnetCidr).toBe('10.200.0.0/16');
    });

    it('should handle custom tags', () => {
      const context = { 
        ...mockContext, 
        azureTags: { env: 'dev', team: 'platform' }
      };
      const result = resolveAzureTopology(context);
      
      expect(result?.tags).toEqual({ env: 'dev', team: 'platform' });
    });
  });
});