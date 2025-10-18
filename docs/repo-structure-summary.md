# Repository Structure & Contributor Workflow

## Domain-Based Structure

This repository is organized by domain, with each module representing a distinct business or technical capability. Example domains include:
- finance
- ops
- infra
- integration
- core

Each domain contains one or more modules, each with its own README.md, tests, and CI/CD configuration.

## Submodules

Some modules are managed as git submodules. The `.gitmodules` file and `repos.yaml` manifest must be kept in sync. Submodules allow for independent versioning and external collaboration.

### Submodule Workflow
- To update a submodule: `git submodule update --remote <path>`
- To add a new submodule: `git submodule add <repo-url> <path>`
- To sync all submodules: `git submodule sync --recursive && git submodule update --init --recursive`

## Contributor Workflow

1. Clone the repo: `git clone --recursive <repo-url>`
2. Install dependencies: `npm install`
3. Build all modules: `npm run build`
4. Run tests: `npm test`
5. Make changes in the relevant module
6. Commit and push changes
7. If you add/remove a submodule, update both `.gitmodules` and `repos.yaml`

## CI/CD

- All modules are included in lint, test, and build workflows.
- Status badges are shown in the main README.md.
- Coverage reports are generated for all modules.

## Maintenance

- Keep documentation up to date.
- Use semantic versioning for all modules.
- Audit dependencies and secrets regularly.

---

For more details, see each module's README.md and the main README.md.
