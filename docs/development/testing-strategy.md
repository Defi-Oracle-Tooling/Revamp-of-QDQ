# Testing Strategy: Regional Topology Configuration

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Development](../docs/development/) → **testing-strategy**


## Test Coverage Requirements

### Unit Tests (Target: 90% coverage)

#### 1. Parser Function Tests
**File**: `tests/parsers.test.ts`

```typescript
describe('Regional DSL Parser', () => {
  test('parseRegionalDistribution - valid input', () => {
    const result = parseRegionalDistribution('eastus:validators=3+rpc=2,westus2:archive=1');
    expect(result).toEqual({
      eastus: { nodeDistribution: { validators: { count: 3 }, rpc: { count: 2 } } },
      westus2: { nodeDistribution: { archive: { count: 1 } } }
    });
  });

  test('parseDeploymentMap - valid mapping', () => {
    const result = parseDeploymentMap('validators=aks,rpc=aca,archive=vmss');
    expect(result).toEqual({
      validators: 'aks', rpc: 'aca', archive: 'vmss'
    });
  });

  test('parseRegionalDistribution - malformed input', () => {
    expect(parseRegionalDistribution('invalid:format')).toBeUndefined();
    expect(parseRegionalDistribution('')).toBeUndefined();
    expect(parseRegionalDistribution('eastus:')).toBeUndefined();
  });
});
```

#### 2. Topology Resolution Tests
**File**: `tests/topologyResolver.enhanced.test.ts`

```typescript
describe('Enhanced Azure Topology Resolution', () => {
  test('resolveEnhancedAzureTopology - DSL input', () => {
    const context = {
      ...mockContext,
      azureRegionalDistribution: 'eastus:validators=3+rpc=2',
      azureDeploymentMap: 'validators=aks,rpc=aca'
    };
    const result = resolveEnhancedAzureTopology(context);
    expect(result?.placements.validators?.regions).toContain('eastus');
  });

  test('resolveEnhancedAzureTopology - JSON config', () => {
    // Test JSON topology file resolution
  });

  test('backward compatibility maintained', () => {
    // Ensure existing parameters still work
  });
});
```

### Integration Tests

#### 1. End-to-End CLI Tests
**File**: `tests/cli.integration.test.ts`

```bash
# Test CLI parameter integration
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=2+rpc=1" \
  --outputPath ./test-regional-output \
  --noFileWrite true
```

#### 2. Generated Network Validation
**File**: `tests/network.validation.test.ts`

- Validate docker-compose.yml contains correct regional configuration
- Check Azure Bicep templates have proper regional placement
- Verify network connectivity configuration

### Manual Testing Scenarios

#### Scenario 1: Multi-Region Development Network
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=3+rpc=2+boot=1,westus2:validators=2+archive=1" \
  --azureNetworkMode hub-spoke \
  --azureHubRegion eastus \
  --outputPath ./test-dev-network
```

#### Scenario 2: Production Network with JSON Config
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureTopologyFile ./examples/enhanced-topology.json \
  --outputPath ./test-prod-network
```

#### Scenario 3: Backward Compatibility
```bash
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegions "eastus,westus2" \
  --azureNodePlacement "validators:aks:eastus+westus2" \
  --outputPath ./test-legacy-network
```

## Performance Testing

### Load Tests
- Test topology resolution with 10+ regions
- Validate memory usage with complex JSON configurations
- Measure CLI startup time impact

### Validation Performance
- JSON schema validation timing
- DSL parsing performance with large inputs
- Network topology calculation efficiency

## Error Handling Tests

### Invalid Input Scenarios
- Malformed DSL strings
- Invalid region names  
- Conflicting deployment configurations
- Missing required parameters
- Invalid JSON topology files

### Edge Cases
- Single region configuration
- Maximum region limit (20+ regions)
- Complex nested RPC node configurations
- Network topology conflicts

## Automated Testing Pipeline

### Pre-commit Hooks
- Lint all new TypeScript code
- Run unit tests for modified files
- Validate JSON schema files

### CI/CD Pipeline
- Full test suite execution
- Integration tests with multiple configurations
- Performance regression testing
- Documentation generation validation

## Success Metrics

- **Unit Test Coverage**: ≥90%
- **Integration Test Pass Rate**: 100%
- **Performance**: <2s CLI startup time
- **Error Rate**: <1% for valid configurations
- **Backward Compatibility**: 100% existing functionality preserved
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/development/testing-strategy.md)
