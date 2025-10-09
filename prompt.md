# 🧭 Project Context — Quorum Developer Quickstart Fork

**Scope:**
This fork is a comprehensive **revamp and upgrade** of the original **Quorum Developer Quickstart (QDQ)** project. It is being actively maintained and extended by **Defi Oracle LLC**, **DBIS**, and collaborating contributors.

**Objective:**
Transform QDQ from a limited “quickstart utility” into a **modular, production-aligned orchestration framework** that integrates directly with **Hyperledger Besu** and **GoQuorum**.
The fork should enable robust deployment, configuration, and monitoring of multi-node Besu and GoQuorum networks—well beyond developer demos or local testing use cases.

---

## 🔧 AI Modification Directives

When performing modifications or generating new modules, **adhere to the following directives**:

1. **Alignment:**
   Ensure architectural and configuration consistency with **Besu** and **GoQuorum** core repositories, including shared environment variables, genesis templates, and chain configuration schemas.

2. **Purpose Expansion:**
   Reframe QDQ as a **general-purpose orchestration tool** for distributed ledger environments, not just for ephemeral or demonstration networks.

3. **Production Readiness:**
   Introduce modular components (e.g., health checks, templated genesis handling, node dependency resolution) supporting deployment, migration, and observability in production contexts.

4. **Maintain Compatibility:**
   Preserve compatibility with existing QDQ scripts where feasible, but prioritize modernization and parameterization over legacy constraints.

5. **Documentation Consistency:**
   All updates must be accompanied by updated README sections, code comments, and `compose.yaml` annotations reflecting new defaults and usage modes.

---

## 🧱 Expected Output Structure

When generating or modifying code, the AI should:

* Produce **structured, version-controlled outputs** (e.g., Docker Compose fragments, Bash scripts, JSON/YAML configs).
* Include **contextual commentary** where major architectural or environment variable decisions are introduced.
* Align the repository layout with **standardized DevOps and Ethereum stack conventions**.
* Use **descriptive commit messages** summarizing functional intent (e.g., “Refactor QDQ network builder for modular Besu chain templates”).

---

## 🎯 Goals + Non-Goals

### ✅ Goals

1. **Expanded Command Functionality:**
   Extend `npx quorum-dev-quickstart` to spawn more useful setup and deployment options, integrating functionality from the **Quorum Genesis Tool** to manage genesis creation, validator key generation, and network presets.

2. **Template Configuration System:**
   Introduce **templated configuration profiles** supporting:

   * Hybrid (Permissioned / Private / Public) topologies
   * Configurable validator and participant roles
   * Optional integration points for chain identity and telemetry modules

3. **Azure-Centric Cloud Deployment Integration:**

   * Enable **Azure single- and multi-region deployments**, with regional filtering by:

     * Country
     * Commercial vs. Government vs. Special Region classification
   * Support deployment to multiple Azure resource models:

     * Azure Container Apps
     * Azure Static Web Apps
     * Azure Web Apps
     * Azure Compute VM
     * Azure VMSS
   * Extend infrastructure-as-code support for **Bicep**, **ARM**, and **ARC** templates.

4. **Network Infrastructure Integration:**

   * Automate **DNS** and **SSL** provisioning through **Cloudflare**.
   * Support integration and configuration for **Azure Front Door**, **Nginx**, and other load-balancing and edge-proxy solutions.

5. **Configuration Validation:**
   Implement automatic validation pipelines for:

   * Azure **ARC**, **ARM**, **Bicep**, and other deployment templates
   * Local and cloud deployment scripts
   * Inter-template parameter compatibility

6. **Extensible Architecture:**
   Build a framework that supports future expansion to **AWS**, **GCP**, and hybrid on-prem orchestrations, using the same schema-driven modular design.

---

### 🚫 Non-Goals

1. **Legacy Docker-Only QDQ:**
   No requirement to preserve legacy Compose configurations or hardcoded network layouts.

2. **UI/UX Overhaul:**
   Exclude frontend redesigns or new dashboard creation—focus remains on backend orchestration and automation layers.

3. **Multi-Cloud Parity (Phase I):**
   Azure remains the primary target. Cross-cloud capabilities are deferred to later phases.

4. **Protocol-Layer Changes:**
   The project does **not** modify consensus logic or protocol internals of Besu or GoQuorum.

---

## ⚙️ Multi-Agent Auto-Coding & Task Chain Coordination

### 🧩 Multi-Agent Mode Guidelines

Activate **Multiple Parallel Auto-Coding Mode** for simultaneous execution of specialized AI agents:

| Agent                   | Role                                                        | Key Outputs                                          |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| **Infra Agent**         | Azure, Cloudflare, and DNS provisioning logic               | IaC templates, Bicep/ARM/ARC validation              |
| **Network Agent**       | Besu/GoQuorum orchestration and genesis templating          | Compose fragments, keygen modules, genesis factories |
| **Validation Agent**    | Schema conformance and deployment integrity checks          | Validator scripts, config test harnesses             |
| **Documentation Agent** | Real-time documentation, `.env` schema, and annotation sync | Updated README, changelogs, CLI help text            |

Each agent should produce modular commits and PRs, each representing a coherent, verifiable code change.

---

### 🔗 AI Task Chain Behavior

Each modification cycle follows a deterministic **five-stage pipeline**:

1. **Analysis Stage** — Detect target component and enumerate dependencies.
2. **Planning Stage** — Generate task manifest (YAML/JSON) defining agent responsibilities.
3. **Parallel Build Stage** — Agents execute independently using the manifest.
4. **Merge & Validation Stage** — Outputs are unified and checked for structural consistency.
5. **Documentation Stage** — Auto-generate changelogs, READMEs, and sample invocations.

All stages must produce structured metadata in `/.ai-meta/` including:

* `manifest.yaml` (task definitions and dependencies)
* `diffmap.json` (input/output delta mapping)
* `validation.log` (schema and deployment test results)

---

### 🧠 Coordination Rules

* Each agent operates in **isolated branches** (e.g., `agent/infra`, `agent/net`, `agent/docs`).
* **Merge gates** require successful lint + validation from all dependent agents.
* Use a **meta-agent controller** to manage synchronization and sequencing.
* Prioritize **deterministic merges** to prevent YAML/JSON conflicts.
* Maintain backward-compatibility tags (`vX.Y-qdq-compat`) to support controlled rollbacks.

---

## 🚀 Phased Roadmap & AI Task Chain Schedule

| Phase                                                | Objective                                                                        | Primary Agents                     | Expected Deliverables                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| **Phase 1 — Core Genesis & CLI Expansion**           | Extend `npx quorum-dev-quickstart` with integrated Quorum Genesis Tool features. | Network, Validation, Documentation | Modular genesis templates, CLI flag parser, command help autogen    |
| **Phase 2 — Infrastructure & Cloud Layer**           | Add Azure deployment support, DNS/SSL setup, Front Door/Nginx provisioning.      | Infra, Validation                  | IaC scripts, ARC/ARM/Bicep templates, deployment test runners       |
| **Phase 3 — Validation & Compliance**                | Implement schema validation and configuration integrity pipelines.               | Validation, Network                | YAML validators, cross-template checks, lint rules                  |
| **Phase 4 — Documentation & Self-Describing System** | Generate dynamic documentation with auto-updating command references.            | Documentation                      | Updated README, annotated compose files, `docs/` tree sync          |
| **Phase 5 — Multi-Agent Convergence Testing**        | Simulate and verify full orchestration under parallel build conditions.          | All agents                         | Automated integration test suite, meta-agent orchestration manifest |

---

### 🧩 Long-Term Considerations

* Extend meta-agent orchestration for AWS and GCP.
* Introduce on-chain network diagnostics and telemetry dashboards.
* Add schema-based CI validation (e.g., GitHub Actions + JSON schema validation for PR gates).
* Integrate policy-based deployment approvals (Azure DevOps, GitHub Environments).
