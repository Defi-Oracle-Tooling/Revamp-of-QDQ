# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-10-14

### Added
- **🌍 Regional Topology Configuration**: Major new feature for multi-region Azure deployments
  - **Enhanced DSL Format**: `--azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:archive=1"` for intuitive regional node specification
  - **JSON/YAML Configuration Files**: `--azureRegionalConfig` parameter for complex topology definitions with full regional customization
  - **Deployment Type Mapping**: `--azureDeploymentMap "validators=aks,rpc=aca,archive=vmss"` for flexible deployment strategy per node type
  - **Network Topology Modes**: Hub-spoke, flat, and mesh network configurations via `--azureNetworkMode`
  - **Hub Region Selection**: `--azureHubRegion` parameter for hub-spoke topology specification
  - **Member Node Types**: `--memberNodeTypes` for privacy network node type distribution

- **📋 Comprehensive Documentation**: 
  - Complete technical specification in `docs/regional-topology-specification.md`
  - Implementation roadmap with 3-phase development plan
  - Enhanced README with detailed regional topology examples
  - JSON/YAML configuration file examples with full regional distribution support

- **🧪 Comprehensive Test Suite**: 19 test cases covering all regional topology functionality
  - DSL parsing validation with edge cases and error handling
  - JSON configuration file loading and validation
  - Enhanced topology resolution with multi-region scenarios
  - End-to-end CLI integration testing

- **🔧 Enhanced Core Interfaces**:
  - `RegionalNodeDistribution` interface for hierarchical region-based configuration
  - `EnhancedTopologyFile` interface supporting regional distribution strategies
  - `parseRegionalDistribution()` and `parseDeploymentMap()` functions for DSL processing
  - `resolveEnhancedAzureTopology()` function with fallback compatibility

### Technical Implementation
- **Extended NetworkContext**: Added 5 new parameters for regional topology configuration
- **Enhanced CLI Integration**: Full parameter integration with existing Azure infrastructure flags
- **Backward Compatibility**: All existing functionality preserved with seamless fallback mechanisms
- **Type Safety**: Comprehensive TypeScript interfaces and validation for all new features
- **Error Handling**: Robust error handling with descriptive messages for malformed configurations

### Examples
```bash
# Multi-region development network
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=3+rpc=2,westus2:validators=2+archive=1" \
  --azureNetworkMode hub-spoke

# Production network with JSON configuration  
npx quorum-dev-quickstart \
  --clientType besu \
  --azureRegionalConfig ./enhanced-topology.json
```

## [0.3.0] - 2025-10-13

### Added
- **Comprehensive AI Coding Agent Instructions**: Added detailed development guidance in `.github/copilot-instructions.md` for consistent coding practices, feature addition workflows, and project-specific patterns
- **Renovate Configuration**: Added `renovate.json` for automated dependency updates with recommended settings
- **Enhanced Spinner Functionality**: 
  - Added status tracking (`running`, `success`, `fail`, `stopped`)
  - Added timing information for debugging slow operations (disabled in tests)
  - Improved cleanup and settlement logic to prevent race conditions
  - Better process exit handling with `once()` listeners to avoid memory leaks
- **Jest Test Framework**: Added Jest and @types/jest for comprehensive test coverage support
- **ESLint Configuration Modernization**: Updated ESLint config to be compatible with ESLint v9 and @typescript-eslint v8+

### Fixed
- **Dependency Security**: Updated `undici` from 5.23.0 to 5.26.3 to address security vulnerabilities
- **Lint Errors**: Fixed multiple ESLint violations including:
  - Shadow variable declarations in chainlink integration and network builder
  - Camelcase violations in monitoring dashboard (added explicit eslint-disable comments for API compatibility)
  - Max-classes-per-file violations in cloud provider and SSL manager modules
- **Build Compatibility**: Removed deprecated ESLint rules that were causing build failures

### Changed
- **Version Bump**: Updated from 0.2.1 to 0.3.0 to reflect significant feature additions
- **Test Script**: Added `test`, `test:watch`, `test:coverage`, and `test:ci` npm scripts for comprehensive testing workflows
- **Code Quality**: Enhanced code organization and maintainability through lint fixes and refactoring

### Technical Debt Reduction
- **ESLint Rule Cleanup**: Removed legacy rules (`ban-types`, `member-delimiter-style`, etc.) that are no longer available in current plugin versions
- **Package Dependencies**: Consolidated test-related dependencies and ensured compatibility with modern tooling

### Documentation
- **Development Workflow**: Comprehensive AI agent instructions provide clear guidance for adding features, maintaining code quality, and following project patterns
- **Build and Lint**: Updated documentation reflects new build process and lint requirements

### Notes
- This release focuses on infrastructure improvements, development experience, and technical debt reduction
- All changes maintain backward compatibility with existing generated networks
- The enhanced spinner provides better debugging information for slow operations during network generation

---

## [0.2.1] - Previous Release
*For changes prior to v0.3.0, see git commit history*