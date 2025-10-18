# Contributing Guide

## Branching Strategy
- `Mistress` (active integration) -> protected
- Feature branches: `feat/<scope>`
- Fix branches: `fix/<scope>`

## Commit Messages (Conventional Commits)
Format: `type(scope): summary`
Types: feat, fix, chore, docs, refactor, test, perf, ci, build

## Development Workflow
```bash
npm install
npm run build
npm test
```
Run lint & fix:
```bash
npm run lintAndFix
```

## Adding a Submodule
```bash
git submodule add <repo-url> <path>
node scripts/sync-manifests.js
```
Commit updated `.gitmodules` and `repos.yaml`.

## Releasing
1. Bump version in `package.json`
2. `npm test && npm run lint`
3. Commit: `chore(release): vX.Y.Z`
4. Tag: `git tag vX.Y.Z && git push --tags`

## Testing Notes
- Avoid network calls in unit tests (use simulation flags).
- Integration tests may set `SIMULATION_MODE=true`.

## Code Style
- One class per file for connectors/adapters.
- Prefer pure functions for utilities.
- Avoid cross-domain imports; use shared-core.

## Reporting Security Issues
Do not open a public issue. Email security@defi-oracle-tooling.example with details.

## Pull Request Checklist
- [ ] Tests added/updated
- [ ] Lint passes
- [ ] Docs updated (README / repo-structure / relevant module)
- [ ] No unrelated changes
- [ ] Submodules synced (if applicable)

## License
By contributing you agree your contributions are licensed under the project license.
