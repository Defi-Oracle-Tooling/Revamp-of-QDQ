import {
  parseRegionalDistribution,
  parseDeploymentMap,
  resolveEnhancedAzureTopology,
  EnhancedTopologyFile
} from '../src/topologyResolver';
import { NetworkContext } from '../src/networkBuilder';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Regional Topology Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseRegionalDistribution', () => {
    it('should parse valid single region DSL format', () => {
      const result = parseRegionalDistribution('eastus:validators=3+rpc=2');
      expect(result).toBeDefined();
      expect(result?.eastus?.nodeDistribution?.validators?.count).toBe(3);
      expect(result?.eastus?.nodeDistribution?.rpc?.count).toBe(2);
    });

    it('should parse valid multi-region DSL format', () => {
      const result = parseRegionalDistribution('eastus:validators=3+rpc=2,westus2:validators=2+archive=1');
      expect(result).toBeDefined();
      expect(result?.eastus?.nodeDistribution?.validators?.count).toBe(3);
      expect(result?.eastus?.nodeDistribution?.rpc?.count).toBe(2);
      expect(result?.westus2?.nodeDistribution?.validators?.count).toBe(2);
      expect(result?.westus2?.nodeDistribution?.archive?.count).toBe(1);
    });

    it('should handle single node type per region', () => {
      const result = parseRegionalDistribution('centralus:rpc=5');
      expect(result).toBeDefined();
      expect(result?.centralus?.nodeDistribution?.rpc?.count).toBe(5);
    });

    it('should handle malformed input gracefully', () => {
      expect(parseRegionalDistribution('')).toBeUndefined();
      expect(parseRegionalDistribution('invalid')).toBeUndefined();
      expect(parseRegionalDistribution('eastus:')).toBeUndefined();
      expect(parseRegionalDistribution(':validators=3')).toBeUndefined();
      expect(parseRegionalDistribution('eastus:validators')).toBeUndefined();
    });

    it('should handle invalid counts gracefully', () => {
      const result = parseRegionalDistribution('eastus:validators=invalid+rpc=2');
      expect(result?.eastus?.nodeDistribution?.validators).toBeUndefined();
      expect(result?.eastus?.nodeDistribution?.rpc?.count).toBe(2);
    });

    it('should trim whitespace from region names and node types', () => {
      const result = parseRegionalDistribution(' eastus : validators = 3 + rpc = 2 ');
      expect(result).toBeDefined();
      expect(result?.eastus?.nodeDistribution?.validators?.count).toBe(3);
      expect(result?.eastus?.nodeDistribution?.rpc?.count).toBe(2);
    });
  });

  describe('parseDeploymentMap', () => {
    it('should parse valid deployment mapping', () => {
      const result = parseDeploymentMap('validators=aks,rpc=aca,archive=vmss');
      expect(result).toEqual({
        validators: 'aks',
        rpc: 'aca',
        archive: 'vmss'
      });
    });

    it('should handle single mapping', () => {
      const result = parseDeploymentMap('validators=aks');
      expect(result).toEqual({
        validators: 'aks'
      });
    });

    it('should handle malformed input gracefully', () => {
      expect(parseDeploymentMap('')).toBeUndefined();
      expect(parseDeploymentMap('invalid')).toBeUndefined();
      expect(parseDeploymentMap('validators=')).toBeUndefined();
      expect(parseDeploymentMap('=aks')).toBeUndefined();
    });

    it('should trim whitespace', () => {
      const result = parseDeploymentMap(' validators = aks , rpc = aca ');
      expect(result).toEqual({
        validators: 'aks',
        rpc: 'aca'
      });
    });
  });

  describe('resolveEnhancedAzureTopology', () => {
    const mockContext: NetworkContext = {
      clientType: 'besu',
      nodeCount: 4,
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
      const result = resolveEnhancedAzureTopology(context);
      expect(result).toBeUndefined();
    });

    it('should resolve regional distribution DSL', () => {
      const context = {
        ...mockContext,
        azureRegionalDistribution: 'eastus:validators=3+rpc=2',
        azureDeploymentMap: 'validators=aks,rpc=aca'
      };
      const result = resolveEnhancedAzureTopology(context);
      
      expect(result).toBeDefined();
      expect(result?.regions).toEqual(['eastus']);
      expect(result?.placements.validators).toBeDefined();
      expect(result?.placements.validators.deploymentType).toBe('aks');
      expect(result?.placements.validators.instanceCount).toBe(3);
      expect(result?.placements.rpc).toBeDefined();
      expect(result?.placements.rpc.deploymentType).toBe('aca');
      expect(result?.placements.rpc.instanceCount).toBe(2);
    });

    it('should handle multi-region distribution', () => {
      const context = {
        ...mockContext,
        azureRegionalDistribution: 'eastus:validators=3+rpc=2,westus2:validators=2+archive=1',
        azureDeploymentMap: 'validators=aks,rpc=aca,archive=vmss'
      };
      const result = resolveEnhancedAzureTopology(context);
      
      expect(result).toBeDefined();
      expect(result?.regions).toEqual(['eastus', 'westus2']);
      expect(result?.placements.validators.regions).toContain('eastus');
      expect(result?.placements.validators.regions).toContain('westus2');
      expect(result?.placements.validators.instanceCount).toBe(5); // 3 + 2
      expect(result?.placements.archive).toBeDefined();
      expect(result?.placements.archive.regions).toEqual(['westus2']);
    });

    it('should handle network mode configuration', () => {
      const context = {
        ...mockContext,
        azureRegionalDistribution: 'eastus:validators=3',
        azureNetworkMode: 'hub-spoke' as const,
        azureHubRegion: 'eastus'
      };
      const result = resolveEnhancedAzureTopology(context);
      
      expect(result?.network).toBeDefined();
      expect(result?.network?.mode).toBe('hub-spoke');
      expect(result?.network?.hubRegion).toBe('eastus');
    });

    it('should handle enhanced JSON configuration', () => {
      const mockTopology: EnhancedTopologyFile = {
        strategy: 'regional-distribution',
        regions: {
          eastus: {
            isPrimary: true,
            nodeDistribution: {
              validators: { count: 3, deploymentType: 'aks' },
              rpc: { count: 2, deploymentType: 'aca' }
            }
          }
        },
        globalSettings: {
          networkTopology: 'hub-spoke',
          hubRegion: 'eastus'
        }
      };

      const context = { ...mockContext, azureRegionalConfig: './test-topology.json' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockTopology));

      const result = resolveEnhancedAzureTopology(context);
      
      expect(result).toBeDefined();
      expect(result?.regions).toEqual(['eastus']);
      expect(result?.placements.validators?.instanceCount).toBe(3);
      expect(result?.network?.mode).toBe('hub-spoke');
    });

    it('should handle JSON configuration loading errors', () => {
      const context = { ...mockContext, azureRegionalConfig: './missing.json' };
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => resolveEnhancedAzureTopology(context)).toThrow('Failed to load enhanced topology file ./missing.json: File not found');
    });

    it('should fallback to standard resolution when no regional config provided', () => {
      const context = { ...mockContext };
      
      // Should fallback to standard resolution (which provides basic Azure topology)
      const result = resolveEnhancedAzureTopology(context);
      
      // Standard resolution should provide basic topology with default settings
      expect(result).toBeDefined();
      expect(result?.regions).toEqual(['eastus']); // Default region
      expect(result?.placements.validators).toBeDefined();
    });

    it('should use default deployment type when mapping not provided', () => {
      const context = {
        ...mockContext,
        azureRegionalDistribution: 'eastus:validators=3',
        azureDeploymentDefault: 'vm' as const
      };
      const result = resolveEnhancedAzureTopology(context);
      
      expect(result?.placements.validators?.deploymentType).toBe('vm');
    });
  });

  describe('Enhanced Topology File Validation', () => {
    const mockContext: NetworkContext = {
      clientType: 'besu',
      nodeCount: 4,
      outputPath: './test-output',
      privacy: false,
      monitoring: 'loki',
      blockscout: false,
      chainlens: false,
      validators: 4,
      azureEnable: true
    };

    it('should handle complex regional configuration', () => {
      const complexTopology: EnhancedTopologyFile = {
        strategy: 'regional-distribution',
        regions: {
          eastus: {
            isPrimary: true,
            network: {
              vnetCidr: '10.1.0.0/16',
              subnetPrefix: '10.1'
            },
            nodeDistribution: {
              validators: { count: 4, deploymentType: 'aks', vmSize: 'Standard_DS3_v2' },
              bootNodes: { count: 1, deploymentType: 'vm' }
            }
          },
          westus2: {
            isPrimary: false,
            network: {
              vnetCidr: '10.2.0.0/16',
              peeringTarget: 'eastus'
            },
            nodeDistribution: {
              validators: { count: 2, deploymentType: 'aks' },
              archiveNodes: { count: 1, deploymentType: 'vmss' }
            }
          }
        },
        globalSettings: {
          consensus: 'qbft',
          chainId: 1337,
          networkTopology: 'hub-spoke',
          hubRegion: 'eastus'
        }
      };

      const context = { ...mockContext, azureRegionalConfig: './complex-topology.json' };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(complexTopology));

      const result = resolveEnhancedAzureTopology(context);
      
      expect(result).toBeDefined();
      expect(result?.regions).toEqual(['eastus', 'westus2']);
      expect(result?.placements.validators?.instanceCount).toBe(6); // 4 + 2
      expect(result?.placements.validators?.vmSize).toBe('Standard_DS3_v2');
      expect(result?.placements.archiveNodes).toBeDefined();
      expect(result?.network?.mode).toBe('hub-spoke');
    });
  });
});