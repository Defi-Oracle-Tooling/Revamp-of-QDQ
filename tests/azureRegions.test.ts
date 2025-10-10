import { AZURE_REGIONS, getRegionsByClassification, resolveRegionExclusions, getRpcCapabilities, validateRpcNodeType } from '../src/azureRegions';

describe('Azure Regions Management', () => {
  describe('getRegionsByClassification', () => {
    test('should return commercial regions by default', () => {
      const regions = getRegionsByClassification('commercial');
      expect(regions.length).toBeGreaterThan(0);
      expect(regions).toContain('eastus');
      expect(regions).toContain('westus2');
    });

    test('should return government regions when specified', () => {
      const regions = getRegionsByClassification('gov');
      expect(regions.length).toBeGreaterThan(0);
      expect(regions).toContain('usgovvirginia');
    });

    test('should return china regions when specified', () => {
      const regions = getRegionsByClassification('china');
      expect(regions.length).toBeGreaterThan(0);
      expect(regions).toContain('chinaeast2');
    });

    test('should return dod regions when specified', () => {
      const regions = getRegionsByClassification('dod');
      expect(regions.length).toBeGreaterThan(0);
      expect(regions).toContain('usdodeast');
    });
  });

  describe('resolveRegionExclusions', () => {
    test('should exclude specific regions', () => {
      const exclusions = resolveRegionExclusions(['eastus', 'westus2']);
      expect(exclusions).toContain('eastus');
      expect(exclusions).toContain('westus2');
      expect(exclusions).toHaveLength(2);
    });

    test('should exclude regions by country code', () => {
      const exclusions = resolveRegionExclusions(['US']);
      expect(exclusions.length).toBeGreaterThan(10); // US has many regions
      expect(exclusions).toContain('eastus');
      expect(exclusions).toContain('westus2');
    });

    test('should handle mixed region and country exclusions', () => {
      const exclusions = resolveRegionExclusions(['eastus', 'BR', 'francecentral']);
      expect(exclusions).toContain('eastus');
      expect(exclusions).toContain('francecentral');
      expect(exclusions).toContain('brazilsouth'); // Brazil region
    });

    test('should handle empty exclusion list', () => {
      const exclusions = resolveRegionExclusions([]);
      expect(exclusions).toHaveLength(0);
    });
  });

  describe('RPC Node Types', () => {
    test('should validate known RPC node types', () => {
      expect(validateRpcNodeType('standard')).toBe(true);
      expect(validateRpcNodeType('archive')).toBe(true);
      expect(validateRpcNodeType('graphql')).toBe(true);
      expect(validateRpcNodeType('websocket')).toBe(true);
      expect(validateRpcNodeType('admin')).toBe(true);
      expect(validateRpcNodeType('trace')).toBe(true);
      expect(validateRpcNodeType('full')).toBe(true);
    });

    test('should reject invalid RPC node types', () => {
      expect(validateRpcNodeType('invalid')).toBe(false);
      expect(validateRpcNodeType('')).toBe(false);
      expect(validateRpcNodeType('unknown')).toBe(false);
    });

    test('should return correct capabilities for standard node', () => {
      const capabilities = getRpcCapabilities('standard');
      expect(capabilities.eth).toBe(true);
      expect(capabilities.web3).toBe(true);
      expect(capabilities.net).toBe(true);
      expect(capabilities.admin).toBe(false);
      expect(capabilities.debug).toBe(false);
      expect(capabilities.trace).toBe(false);
    });

    test('should return correct capabilities for full node', () => {
      const capabilities = getRpcCapabilities('full');
      expect(capabilities.eth).toBe(true);
      expect(capabilities.web3).toBe(true);
      expect(capabilities.net).toBe(true);
      expect(capabilities.admin).toBe(true);
      expect(capabilities.debug).toBe(true);
      expect(capabilities.trace).toBe(true);
      expect(capabilities.archive).toBe(true);
    });

    test('should override capabilities when specified', () => {
      const capabilities = getRpcCapabilities('standard', { admin: true, trace: true });
      expect(capabilities.eth).toBe(true);
      expect(capabilities.admin).toBe(true);
      expect(capabilities.trace).toBe(true);
    });
  });

  describe('Region Database Integrity', () => {
    test('should have unique region names', () => {
      const regionNames = AZURE_REGIONS.map(r => r.name);
      const uniqueNames = new Set(regionNames);
      expect(uniqueNames.size).toBe(regionNames.length);
    });

    test('should have valid country codes', () => {
      AZURE_REGIONS.forEach(region => {
        expect(region.countryCode).toMatch(/^[A-Z]{2}$/);
      });
    });

    test('should have valid classifications', () => {
      const validClassifications = ['commercial', 'gov', 'china', 'dod'];
      AZURE_REGIONS.forEach(region => {
        expect(validClassifications).toContain(region.classification);
      });
    });
  });
});