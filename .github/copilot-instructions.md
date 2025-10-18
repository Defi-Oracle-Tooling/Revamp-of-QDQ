# AI Coding Agent Instructions

<<<<<<< HEAD
## Purpose

Scaffold local Quorum (Hyperledger Besu / GoQuorum) dev networks using the CLI (`quorum-dev-quickstart`). The CLI renders Nunjucks templates (`templates/**`) and copies static assets (`files/**`) into a fresh output directory. Optimize for correctness, minimal surprise overwrites, and fast addition of new selectable features. Only modify files directly tied to the stated change (feature flag, template, question flow, or docs snippet).

## Architecture & Major Components

- **Entry Point:** `src/index.ts` (compiled to `build/index.js`). CLI can run interactively (question flow) or via yargs flags.
- **Network Generation:** Answers are mapped to a `NetworkContext` object, which drives `buildNetwork` to render templates and copy files.
- **Templates:** Use Nunjucks for files needing variable substitution. Only reference `NetworkContext` keys.
- **Static Assets:** Place in `files/**`. No template syntax. Executable scripts (e.g., `run.sh`, `stop.sh`) must retain mode.
- **Client Split:** Top-level `besu/` and `goquorum/` directories. Shared assets live in `common/` to prevent divergence.

## Developer Workflow

- **Build:** `npm install && npm run build`
- **Lint:** `npm run lint`
- **Run Interactive:** `node build/index.js`
- **Run Non-Interactive:** `node build/index.js --clientType besu --privacy true --monitoring loki --blockscout false --chainlens false --outputPath ./quorum-test-network`
- **Verify:** Ensure generated directory contains expected client subset and executable scripts retain mode.

## Project-Specific Patterns

- **Never overwrite existing user files:** `renderFileToDir` throws if target exists.
- **Add Feature Flags:** Update `NetworkContext`, question flow, yargs options, templates, and README example invocation.
- **Error Handling:** Always settle spinner (`succeed`/`fail`). Maintain top-level error formatting.
- **Parallelization:** Synchronous FS calls for deterministic ordering. Only parallelize independent template/question additions.
- **Scope Control:** Only change lines tied to the stated feature/bug. Document new flags with a single concise example.

## Integration Points

- **Docker Compose:** Generated networks rely on Docker and Docker Compose. See `README.md` for troubleshooting and platform-specific notes.
- **Smart Contracts & DApps:** Example contracts and DApps (e.g., Truffle Pet-Shop, Hardhat/Next.js DApp) are in `files/common/dapps/` and `files/besu/smart_contracts/`.
- **Monitoring/Logging:** Optional integration with Prometheus, Grafana, Splunk, ELK. Extend via enum and assets in `templates/common/` and `files/common/`.

## Release & Versioning

- Bump `version` in `package.json` (semver).
- Build and lint must be clean before commit.
- Commit message: `chore(release): vX.Y.Z` + tag.
- Publish only after verifying generated network with a smoke run.

## Example: Adding a Monitoring Provider

1. Extend `monitoring` union in `NetworkContext`.
2. Add option to question flow and yargs.
3. Add assets/templates as needed.
4. Update README with a single example command.

## References
- Example network README: `files/besu/README.md`, `files/goquorum/README.md`
- DApp example: `files/common/dapps/quorumToken/README.md`

---
=======
Purpose: Scaffold local Quorum (Hyperledger Besu / GoQuorum) dev networks. CLI (`quorum-dev-quickstart`) renders Nunjucks templates (`templates/**`) + copies static assets (`files/**`) into a fresh output dir. Optimize for: correctness of generated artifacts, minimal surprise overwrites, fast addition of new selectable features. Prevent scope creep: only modify files directly tied to the stated change (feature flag, template, question flow, or docs snippet). Defer refactors unless they unblock the requested task.

## Core Execution Flow (Do Not Diverge)
1. Entry `src/index.ts` (`bin` = root `index.js` -> `build/index.js`).
2. Arg vs interactive: if any CLI args: parse yargs (all required enumerated flags). Else run `QuestionRenderer` with `rootQuestion` tree.
## Directory Semantics
- `src/` TypeScript (strict) → `build/` (ES5 CommonJS). Mirror filenames; never import from `build/` in TS.

## Add a New Flag / Template Variable (Minimal Steps)
6. Scope gate: do not refactor unrelated question flow; add TODO comments if issues found.

## Rendering & Safety Rules
- Never overwrite existing user files: `renderFileToDir` throws if target exists. Preserve this invariant.
- Executable scripts: ensure original mode retained (copy path). If adding new script, `chmod +x` in source repo, not post-copy.
- Large changes: prefer additive templates over changing existing unless bug fix.
- Binary vs text: rely on `isBinaryFileSync`; do not force text operations on binaries.

## Error / Exit Discipline

## Coding Standards & Parallelization
- Safe parallel auto-coding: you may generate multiple independent template / question additions in one patch only if they do not modify the same function blocks. Otherwise sequence them.
- Avoid speculative refactors during feature addition; list them under "Follow-ups" in PR description.

## Minimal Dev Workflow (Keep Lightweight)
Install deps + build: `npm install && npm run build`
Interactive run: `node build/index.js`
Non-interactive example: `node build/index.js --clientType besu --privacy true --monitoring loki --blockscout false --chainlens false --outputPath ./quorum-test-network`
Add feature: implement steps in "Add a New Flag" section only; skip unrelated cleanups.
Verify: ensure generated directory contains expected client subset and executable scripts retain mode.

## Extension Points / Guardrails
- TODOs: may address only if within scope of requested change; else append clarifying note.
- Monitoring providers: extend enum + question options + README invocation; keep alphabetical order when adding new ones.
- Scripts (`run.sh`, `stop.sh`, etc.) must stay executable—verify by inspecting mode bit pre-commit.

## Scope Control Checklist (Pre-PR)
1. Does every changed line map to stated feature/bug? If not, revert or move to follow-up.
2. Any unrelated lint or style churn? Revert.
3. Added flag documented in one example command? (Exactly one concise example.)
4. Spinner + error pathways still exercised (no early unhandled exits)?
5. No overwrites of existing user output enforced? (`renderFileToDir` untouched?)

## Follow-up Log (Optional in PR)
List potential refactors (async rendering, improved path validation, template dedupe) without implementing them inline.

## Template vs File Decision Guide
Use template (templates/**) when:
- Needs interpolation of a `NetworkContext` property now or soon.
- Content differs per client type but shares structure (prefer one template with conditionals vs duplicate static files).
- You must gate inclusion based on a newly added flag.
Use plain file (files/**) when:
- Pure static asset (script, binary, dashboard JSON) identical across runs.
- Only difference is newline normalization or execution bit.
If unsure: start static; upgrade to template only when variable introduced.

## Release / Versioning (Lightweight)
1. Bump `version` in `package.json` (semver; patch for template/content additions, minor for new flag, major for breaking CLI arg change).
2. Run: `npm run build && npm run lint` (must be clean).
3. Commit with message `chore(release): vX.Y.Z` + tag `vX.Y.Z`.
4. Publish (if enabled for this fork) with `npm publish --access public` (only after verifying generated network still works with a smoke run).
Never publish with unbuilt or dirty `build/` artifacts.

## Example: Adding New Monitoring Provider (e.g. "datadog")
High-level steps (do all or none in a single PR):
1. Extend `monitoring` union in `NetworkContext` to include `"datadog"`.
2. Add option to monitoring question (keep alphabetical order: datadog, elk, loki, splunk).
3. Add yargs `choices` entry & default logic (do NOT silently change existing default without justification).
4. Create assets: if provider needs config templates with variables, place under `templates/common/.../datadog/`; static agent config under `files/common/.../datadog/`.
5. Update README single example command only if user must specify new value.
6. Pre-PR checklist: ensure no unrelated edits, spinner unchanged, code compiles.
Skip: creating runtime enable/disable logic beyond context variable (rendering already scoped by presence of assets).

## PR Scope Examples
Good: "feat: add chainlens flag (question + yargs + template injection + README example)"
Bad: "feat: chainlens + refactor spinner + rewrite file walker" (split into focused PRs)
Good: "fix: prevent overwrite of existing output file (adds guard test)"
Bad: "fix: overwrite guard + convert all fs calls to async" (perf refactor separate)

Keep instructions concise—extend this file only when a new stable pattern emerges.
>>>>>>> a4ce2c1 (feat: add comprehensive AI coding agent instructions for Quorum dev networks)
