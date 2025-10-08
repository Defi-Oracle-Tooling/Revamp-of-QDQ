# AI Coding Agent Instructions

Purpose: Scaffold local Quorum (Hyperledger Besu / GoQuorum) dev networks. CLI (`quorum-dev-quickstart`) renders Nunjucks templates (`templates/**`) + copies static assets (`files/**`) into a fresh output dir. Optimize for: correctness of generated artifacts, minimal surprise overwrites, fast addition of new selectable features. Prevent scope creep: only modify files directly tied to the stated change (feature flag, template, question flow, or docs snippet). Defer refactors unless they unblock the requested task.

## Core Execution Flow (Do Not Diverge)
1. Entry `src/index.ts` (`bin` = root `index.js` -> `build/index.js`).
2. Arg vs interactive: if any CLI args: parse yargs (all required enumerated flags). Else run `QuestionRenderer` with `rootQuestion` tree.
3. Answers -> `NetworkContext` -> `buildNetwork`.
4. `buildNetwork` resolves absolute roots, then in order: render common templates, client templates, copy common files, client files. Abort on existing output file. Spinner must always settle (`succeed`/`fail`).
5. Skipping: rely on distinct top-level `besu/` vs `goquorum/`; internal walker does not filter by `skipDirName` (do not assume nested skipping). Avoid introducing cross‑nested client dirs.

## Directory Semantics
- `src/` TypeScript (strict) → `build/` (ES5 CommonJS). Mirror filenames; never import from `build/` in TS.
- `templates/**` Nunjucks: only put files needing substitution. Variables = keys on `NetworkContext`.
- `files/**` Plain copy (newline normalization + mode preservation; binaries streamed). No template syntax here.
- Client split: top-level `besu/` & `goquorum/`; shared assets live in `common/` to prevent divergence.

## Add a New Flag / Template Variable (Minimal Steps)
1. Add property to `NetworkContext` (type union if enum-like). Keep ordering logical (group related options).
2. Interactive: insert `QuestionTree` node; wire `nextQuestion`; reuse `_getYesNoValidator` or option list pattern. Keep prompts short & consistent with existing style.
3. Non-interactive: add yargs option (name must match property) + include in `answers` object mapping.
4. Templates: reference with `{{ newProp }}` only in `templates/**`.
5. Docs: update root `README.md` example invocation; do not expand long explanations (link out if needed).
6. Scope gate: do not refactor unrelated question flow; add TODO comments if issues found.

## Rendering & Safety Rules
- Never overwrite existing user files: `renderFileToDir` throws if target exists. Preserve this invariant.
- Executable scripts: ensure original mode retained (copy path). If adding new script, `chmod +x` in source repo, not post-copy.
- Large changes: prefer additive templates over changing existing unless bug fix.
- Binary vs text: rely on `isBinaryFileSync`; do not force text operations on binaries.

## Error / Exit Discipline
- Windows guard: keep early exit with message (only allow improvement by documenting workaround; no silent bypass).
- Always settle spinner (call `fail` before throwing / exiting). Never leave a running interval.
- Maintain top-level error formatting; extend only when adding clearly valuable context (e.g., flag-specific hints).

## Coding Standards & Parallelization
- TS strict + lint clean before commit (`npm run build && npm run lint`).
- Target remains ES5; avoid top-level `async` patterns that complicate CommonJS init.
- FS calls intentionally synchronous; do not introduce async/Promise parallel writes (keeps deterministic ordering). If optimizing, isolate behind a flag and document.
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
- Spinner: selectable style extension requires adding a parameter default; do not change existing default frames.

## Templates / Assets Edits
- Scripts (`run.sh`, `stop.sh`, etc.) must stay executable—verify by inspecting mode bit pre-commit.
- Put end-user instructions in generated network README (not tool README) to avoid drift.
- Cross-client duplication: if adding identical asset to both clients, place once in `common/`.

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
