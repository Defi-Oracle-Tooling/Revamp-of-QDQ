# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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