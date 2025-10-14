# Contributing Guide

🏠 [Documentation Home](../README.md) → [Docs](../docs/) → [Development](../docs/development/) → **contributing**


> **Status:** Active | **Last Updated:** 2025-10-14 | **Version:** 0.4.0

Welcome to the Quorum Dev Quickstart project! This guide covers everything you need to know to contribute effectively to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Contributing Process](#contributing-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Guidelines](#documentation-guidelines)
- [Release Process](#release-process)

## Getting Started

### Project Overview
Quorum Dev Quickstart is a CLI tool that scaffolds local Quorum (Hyperledger Besu / GoQuorum) development networks. Our focus is on correctness, minimal surprise overwrites, and fast addition of new selectable features.

### Core Principles
- **Offline-first security model**: Safe defaults with explicit opt-in for external services
- **Minimal scope control**: Only modify files directly tied to the stated change
- **Template-driven architecture**: Clean separation between logic and configuration
- **Backward compatibility**: Maintain existing functionality while adding new features

### Architecture Highlights
- **Entry Point**: `src/index.ts` → `build/index.js`
- **Templates**: `templates/**` use Nunjucks for variable substitution
- **Static Assets**: `files/**` for direct copying (no template syntax)
- **Client Split**: Top-level `besu/` and `goquorum/` directories

## Development Setup

### Prerequisites
- **Node.js** 16+ and npm
- **Docker** and Docker Compose (for testing generated networks)
- **Git** with configured user name and email

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ.git
cd Revamp-of-QDQ

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Verify CLI works
node build/index.js --help
```

### Development Workflow
```bash
# Start development
npm install && npm run build

# Run in development mode
node build/index.js --clientType besu --privacy true --outputPath ./test-network

# Run tests after changes
npm test

# Lint code
npm run lint

# Verify generated network works
cd test-network && ./run.sh
```

### IDE Configuration

#### VSCode (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-jest"
  ],
  "settings": {
    "typescript.preferences.importModuleSpecifier": "relative",
    "editor.formatOnSave": true,
    "eslint.autoFixOnSave": true
  }
}
```

## Code Standards

### TypeScript Guidelines
- **Strict mode enabled**: Use proper type annotations
- **Target ES5**: Maintain compatibility with older Node.js versions
- **No any types**: Use proper interfaces and type unions
- **JSDoc comments**: Document public functions and interfaces

#### Example Interface
```typescript
/**
 * Configuration for regional network topology
 */
export interface RegionalNodeDistribution {
  [region: string]: {
    isPrimary?: boolean;
    nodeDistribution: {
      [nodeType: string]: {
        count: number;
        deploymentType?: string;
        vmSize?: string;
      };
    };
  };
}
```

### File Naming Conventions
- **Source files**: `camelCase.ts` (e.g., `topologyResolver.ts`)
- **Test files**: `camelCase.test.ts` (e.g., `topologyResolver.test.ts`)
- **Configuration files**: `kebab-case.json` (e.g., `docker-compose.yml`)
- **Documentation**: `kebab-case.md` (e.g., `getting-started.md`)

### Code Organization
```
src/
├── index.ts                 # Entry point and CLI setup
├── networkBuilder.ts        # Core network generation logic
├── questionRenderer.ts      # Interactive question flow
├── topologyResolver.ts      # Regional topology parsing
├── fileRendering.ts         # Template and file operations
└── spinner.ts              # CLI user experience utilities
```

### Error Handling Standards
- **Always settle spinner**: Call `succeed` or `fail` before throwing
- **Descriptive error messages**: Include context and suggested solutions
- **Early validation**: Validate inputs before processing
- **Graceful degradation**: Provide fallbacks where appropriate

#### Example Error Handling
```typescript
export function parseRegionalDistribution(dsl?: string): RegionalNodeDistribution | undefined {
  if (!dsl) {
    return undefined;
  }
  
  try {
    // Parsing logic here
  } catch (error) {
    throw new Error(`Invalid regional distribution format. Expected: "region:nodeType=count", got: "${dsl}". ${error.message}`);
  }
}
```

## Contributing Process

### Before You Start
1. **Check existing issues**: Look for related issues or discussions
2. **Create an issue**: For new features, create an issue to discuss approach
3. **Fork the repository**: Create your own fork for development
4. **Create feature branch**: Use descriptive branch names

### Branch Naming Convention
- **Features**: `feat/descriptive-name` (e.g., `feat/regional-topology-config`)
- **Bug fixes**: `fix/issue-description` (e.g., `fix/template-rendering-error`)
- **Documentation**: `docs/section-update` (e.g., `docs/api-reference-update`)
- **Refactoring**: `refactor/component-name` (e.g., `refactor/question-renderer`)

### Pull Request Process

#### 1. Prepare Your Changes
```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Make your changes
# ... edit files ...

# Test your changes
npm run build && npm test

# Lint your code
npm run lint
```

#### 2. Commit Standards
Use [Conventional Commits](https://conventionalcommits.org/):
```bash
# Feature commits
git commit -m "feat(regional): add enhanced DSL parsing for regional distribution"

# Bug fix commits
git commit -m "fix(templates): resolve variable substitution in docker-compose templates"

# Documentation commits  
git commit -m "docs(cli): update parameter reference with regional options"

# Breaking changes
git commit -m "feat(cli)!: restructure CLI parameters for regional topology"
```

#### 3. Create Pull Request
- **Title**: Clear, descriptive title matching commit convention
- **Description**: Explain what changed and why
- **Link issues**: Reference related issues with `Fixes #123`
- **Test evidence**: Include test results and verification steps

#### PR Template
```markdown
## Description
Brief description of changes and motivation.

## Changes
- [ ] Added new CLI parameter `--azureRegionalDistribution`
- [ ] Implemented regional DSL parsing in `topologyResolver.ts`
- [ ] Updated templates to support regional configuration
- [ ] Added comprehensive tests for new functionality

## Testing
- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass 
- [ ] Manual testing completed with example networks
- [ ] Documentation updated

## Breaking Changes
None / List any breaking changes

## Related Issues
Fixes #123, Relates to #456
```

### Code Review Process
1. **Automated checks**: Ensure CI passes (build, test, lint)
2. **Peer review**: At least one team member must review
3. **Documentation review**: Verify docs are updated appropriately
4. **Testing verification**: Confirm tests cover new functionality
5. **Scope validation**: Ensure changes align with stated goals

## Testing Requirements

### Unit Testing
- **Coverage target**: ≥85% for new code
- **Test location**: `tests/` directory
- **Naming**: `componentName.test.ts`
- **Framework**: Jest with TypeScript support

#### Example Unit Test
```typescript
import { parseRegionalDistribution } from '../src/topologyResolver';

describe('parseRegionalDistribution', () => {
  it('should parse valid DSL format', () => {
    const result = parseRegionalDistribution('eastus:validators=3+rpc=2');
    expect(result).toEqual({
      eastus: {
        nodeDistribution: {
          validators: { count: 3 },
          rpc: { count: 2 }
        }
      }
    });
  });

  it('should handle malformed input gracefully', () => {
    expect(parseRegionalDistribution('')).toBeUndefined();
    expect(parseRegionalDistribution('invalid')).toBeUndefined();
  });
});
```

### Integration Testing
- **Network generation**: Test complete CLI workflows
- **Template rendering**: Verify all templates render correctly
- **File operations**: Ensure files are created with correct permissions

#### Example Integration Test
```bash
# Test complete network generation
npm run build
node build/index.js \
  --clientType besu \
  --azureRegionalDistribution "eastus:validators=2+rpc=1" \
  --outputPath ./test-integration \
  --noFileWrite false

# Verify generated network structure
ls -la test-integration/
docker-compose -f test-integration/docker-compose.yml config --quiet
```

### Testing Checklist
- [ ] All existing tests pass
- [ ] New functionality has unit tests (≥85% coverage)
- [ ] Integration tests validate end-to-end functionality
- [ ] Manual testing with generated networks completed
- [ ] Error cases and edge conditions tested

## Documentation Guidelines

### Documentation Structure
- **Getting Started**: Quick setup and usage guides
- **Configuration**: Parameter reference and examples
- **Architecture**: System design and component relationships
- **Operations**: Deployment, troubleshooting, and maintenance

### Writing Standards
- **Clear headings**: Use descriptive, hierarchical headings
- **Code examples**: Include working, tested examples
- **Cross-references**: Link to related documentation
- **Status headers**: Include status, last updated, and version info

#### Documentation Template
```markdown
# Document Title

> **Status:** [Draft/Active/Deprecated] | **Last Updated:** YYYY-MM-DD | **Version:** X.Y.Z

Brief description of document purpose and scope.

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Prerequisites
What readers need to know or have installed.

## Main Content
Detailed information with examples.

## Examples
```bash
# Working, tested examples
npx quorum-dev-quickstart --example-flag value
```

## Related Documentation
- [Related Doc 1](./related-doc.md)
- [External Reference](https://example.com)
```

### Documentation Update Requirements
- **New features**: Must include documentation updates
- **Breaking changes**: Require migration guides
- **CLI changes**: Update parameter reference
- **Examples**: Ensure all examples work with latest code

## Release Process

### Version Management
We use [Semantic Versioning (SemVer)](https://semver.org/):
- **PATCH** (0.3.1): Bug fixes and minor improvements
- **MINOR** (0.4.0): New features, backward compatible
- **MAJOR** (1.0.0): Breaking changes

### Release Checklist
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Documentation updated
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] Generated network smoke tested

### Release Commands
```bash
# Version bump (patch/minor/major)
npm version patch -m "chore(release): v%s"

# Build and verify
npm run build && npm run lint && npm test

# Tag and push
git push --follow-tags

# Publish (if enabled)
npm publish --access public
```

## Project-Specific Guidelines

### Adding New Features
1. **Extend NetworkContext**: Add new properties with proper types
2. **Update CLI parameters**: Add yargs option and validation
3. **Enhance templates**: Add conditional rendering logic
4. **Update documentation**: Include parameter reference and examples

#### Example: Adding New Monitoring Provider
```typescript
// 1. Extend NetworkContext
interface NetworkContext {
  monitoring: 'none' | 'loki' | 'splunk' | 'elk' | 'datadog'; // Add datadog
}

// 2. Add CLI parameter
.option('monitoring', {
  choices: ['none', 'loki', 'splunk', 'elk', 'datadog'], // Add datadog
  // ...
})

// 3. Update templates
{% if monitoring == "datadog" %}
  datadog:
    image: datadog/agent:latest
    # ... configuration
{% endif %}

// 4. Add assets in files/common/datadog/
```

### Template Guidelines
- **Only use NetworkContext variables**: No external dependencies
- **Conditional rendering**: Use `{% if condition %}` for optional features
- **Proper escaping**: Ensure safe variable substitution
- **Comments**: Document complex template logic

### Static Asset Guidelines
- **No template syntax**: Files in `files/**` are copied directly
- **Executable permissions**: Ensure scripts retain executable bit
- **Cross-platform compatibility**: Consider Windows, Mac, Linux
- **Minimal duplication**: Use `common/` for shared assets

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on project improvement

### Communication
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion  
- **Pull Requests**: Code contributions and reviews
- **Email**: security@your-org.com for security issues

### Recognition
Contributors are recognized through:
- Git commit attribution
- CONTRIBUTORS.md listing
- Release notes mentions
- Community discussions

## Getting Help

### Development Questions
1. **Check existing docs**: Search documentation first
2. **GitHub Discussions**: Ask questions in discussions
3. **Code examples**: Look at existing implementations
4. **Test cases**: Review test files for usage patterns

### Review Process Questions
- **Response time**: Reviews typically within 2-3 business days
- **Feedback incorporation**: Address all review comments
- **Re-review process**: Request re-review after changes

### Technical Support
- **Development setup**: Create GitHub discussion
- **Bug reports**: Create GitHub issue with reproduction steps
- **Feature ideas**: Create GitHub discussion for initial feedback

---

**Thank you for contributing to Quorum Dev Quickstart!** Your contributions help make blockchain development more accessible and efficient for developers worldwide.
---

**📝 Edit this page**: [Edit on GitHub](https://github.com/Defi-Oracle-Tooling/Revamp-of-QDQ/edit/feat/regional-topology-config/docs/development/contributing.md)
