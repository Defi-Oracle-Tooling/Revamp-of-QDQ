# 🧭 Repository Structural Summary

**Context:**
Executed standard diagnostic commands (ls, find, tree, du, etc.) to assess repository composition and disk footprint without overwhelming the terminal.

---

## 🗂️ Top-Level Directory Overview
\n```bash
ls src/integrations/
```

\nbank
bridges
chainlink
create2
defender
etherscan
firefly
marionette-exchange
multicall
networks
tatum
tatum-connector
wellsfargo
\n*(Output truncated; see raw logs for full subfolder list.)*

---

## 📁 Directory Hierarchy (Depth 2)
\n```bash
find . -maxdepth 2 -type d
```

\n.
./wf-vantage-api
./wf-vantage-api/build
./wf-vantage-api/wellsfargo
./wf-vantage-api/src
./wf-vantage-api/secrets
./wf-vantage-api/node_modules
./wf-vantage-api/tests
./build
./build/wf-vantage-api
./build/src
./build/az-billing
./build/questions
./build/scripts
./build/tests
./__mocks__
./schemas
./6-DOF-4-HL-Chains
./docs
./docs/development
./docs/reference
./docs/operations
./docs/security
./docs/assets
./docs/architecture
./docs/integrations
./docs/configuration
./docs/getting-started
./src
./src/cloud
\n*...truncated; see logs for full output.*

---

## 🧾 File Composition

### TypeScript File Count
\n```bash
find . -type f | grep -E '\.ts$' | wc -l
```

**52137 TypeScript files**

---

## 💾 Disk Usage Summary
\n```bash
du -sh *
```

| Folder | Approx. Size |
| --- | --- |
| `manual-dapp-test3` | **699M** |
| `manual-dapp-test2` | **699M** |
| `manual-dapp-test` | **699M** |
| `files` | **699M** |
| `node_modules` | **223M** |
| `wf-vantage-api` | **30M** |
| `coverage` | **1.7M** |
| `build` | **1.7M** |
| `docs` | **1.3M** |
| `src` | **704K** |
| `tmp-smoke-network` | **696K** |
| `tmp-smoke-cli-network` | **692K** |
| `npm-shrinkwrap.json` | **688K** |
| `tests` | **244K** |
| `scripts` | **216K** |
| `marionette-exchange` | **208K** |
| `infra` | **108K** |
| `templates` | **104K** |
| `README.md` | **32K** |
| `examples` | **16K** |
| `bni-connector` | **16K** |
| `test-docs.sh` | **12K** |
| `prompt.md` | **12K** |
| `generate-search-index.js` | **12K** |
| `generate-pdfs.sh` | **12K** |
| `az-billing` | **12K** |
| `LICENSE` | **12K** |
| `6-DOF-4-HL-Chains` | **12K** |
| `tsconfig.json` | **8.0K** |
| `schemas` | **8.0K** |
| `__mocks__` | **8.0K** |
| `CHANGELOG.md` | **8.0K** |
| `typedoc.json` | **4.0K** |
| `submodules` | **4.0K** |
| `server.log` | **4.0K** |
| `repo-structure-summary.md` | **4.0K** |
| `renovate.json` | **4.0K** |
| `package.json` | **4.0K** |
| `jest.config.js` | **4.0K** |
| `index.js` | **4.0K** |
| `express-server.log` | **4.0K** |
| `eslint.config.mjs` | **4.0K** |
| `eslint.config.js` | **4.0K** |
| `docker-compose.yml` | **4.0K** |
| `debug-validation.js` | **4.0K** |
| `add-edit-links.sh` | **4.0K** |
| `add-breadcrumbs.sh` | **4.0K** |
| `Dockerfile` | **4.0K** |

> 🔍 *The largest directories are typically test suites and file stores. Consider relocating or compressing if needed.*

---

## ⚙️ Efficiency Validation

✅ Terminal health: Commands executed without overload
✅ Scalable approach: Controlled depth, filtered search, and per-folder du summaries
✅ Actionable insights: High-volume directories and TypeScript density identified

---

## 🚀 Next Steps
- Add this script to CI or run locally for regular audits.
- Add structure summary to documentation as needed.
