# Document Map — StayOS

**Version**: 1.0.0
**Sprint**: 2 — Repository Intelligence Layer
**Generated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

This map groups every document in the repository by business domain. Use it to navigate to all documents relevant to a given area of the business.

For full document details (phase, status, owner, dependencies), see [`docs/MANIFEST.md`](MANIFEST.md).

---

## Domain Index

| Domain | Documents | Active | Template | Archive |
|--------|-----------|--------|----------|---------|
| [Business Strategy](#business-strategy) | 15 | 11 | 2 | 2 |
| [Research / Discovery](#research--discovery) | 17 | 9 | 5 | 3 |
| [Product](#product) | 9 | 8 | 0 | 1 |
| [Architecture](#architecture) | 2 | 1 | 1 | 0 |
| [Marketplace](#marketplace) | 5 | 3 | 0 | 2 |
| [AI](#ai) | 2 | 2 | 0 | 0 |
| [Operations](#operations) | 4 | 2 | 1 | 1 |
| [Finance](#finance) | 3 | 2 | 1 | 0 |
| [Legal](#legal) | 2 | 2 | 0 | 0 |
| [Security](#security) | 3 | 3 | 0 | 0 |
| [Customer Experience](#customer-experience) | 4 | 3 | 0 | 1 |
| [Engineering](#engineering) | 5 | 3 | 1 | 1 |
| [Governance](#governance) | 9 | 9 | 0 | 0 |
| [Tooling](#tooling) | 7 | 6 | 0 | 1 |

---

## Business Strategy

Documents that define what StayOS is, where it is going, what has been decided, and what risks it faces.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`README.md`](../README.md) | Public project introduction | All | Active |
| [`MASTER_CONTEXT.md`](../MASTER_CONTEXT.md) | Complete project context — read first | All | Active |
| [`PROJECT_VISION.md`](../PROJECT_VISION.md) | Long-term vision, mission, values | All | Active |
| [`ROADMAP.md`](../ROADMAP.md) | Phase-by-phase plan with gate conditions | All | Active |
| [`DECISION_LOG.md`](../DECISION_LOG.md) | All strategic decisions, with context and rationale | Ph0+ | Active |
| [`RISKS.md`](../RISKS.md) | Active risk register (15 risks) | All | Active |
| [`docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md`](phase--1/reports/01_EXECUTIVE_SUMMARY.md) | Panel verdict + 14 critical flaws | Ph-1 | Complete |
| [`docs/phase--1/reports/15_SUCCESS_FACTORS.md`](phase--1/reports/15_SUCCESS_FACTORS.md) | 10 conditions required to succeed | Ph-1 | Complete |
| [`docs/phase--1/reports/18_KEY_DECISIONS.md`](phase--1/reports/18_KEY_DECISIONS.md) | 15 strategic decisions framework | Ph-1 | Complete |
| [`docs/phase--1/reports/20_NEXT_PHASE.md`](phase--1/reports/20_NEXT_PHASE.md) | Phase 0 prerequisites and constraints | Ph-1 | Complete |
| [`docs/phase--1/risks/07_BUSINESS_RISKS.md`](phase--1/risks/07_BUSINESS_RISKS.md) | 100 business and strategic risks | Ph-1 | Complete |
| [`docs/phase--1/risks/12_COMPETITIVE_RISKS.md`](phase--1/risks/12_COMPETITIVE_RISKS.md) | 100 competitive risks (OTAs, regional, informal) | Ph-1 | Complete |
| [`business/financial/financial_model_template.md`](../business/financial/financial_model_template.md) | Financial model framework | Ph1+ | Template |
| [`business/roadmap/roadmap_template.md`](../business/roadmap/roadmap_template.md) | Roadmap documentation template | All | Template |
| [`SPRINT_1_REPORT.md`](../SPRINT_1_REPORT.md) | Sprint 1 completion record | N/A | Complete |

---

## Research / Discovery

Documents that define what we know, what we must discover, and how to discover it.

### Phase -1 Research (Complete)

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/phase--1/INDEX.md`](phase--1/INDEX.md) | Master index for all Phase -1 outputs | Ph-1 | Complete |
| [`docs/phase--1/reports/02_PRE_MORTEM.md`](phase--1/reports/02_PRE_MORTEM.md) | Failure narrative — how StayOS dies | Ph-1 | Complete |
| [`docs/phase--1/reports/03_STARTUP_KILL_REPORT.md`](phase--1/reports/03_STARTUP_KILL_REPORT.md) | 110 failure reasons | Ph-1 | Complete |
| [`docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md`](phase--1/reports/04_ASSUMPTION_ANALYSIS.md) | 100 assumptions with danger ratings | Ph-1 | Complete |
| [`docs/phase--1/reports/05_MARKET_HYPOTHESES.md`](phase--1/reports/05_MARKET_HYPOTHESES.md) | 20 testable market hypotheses | Ph-1 | Complete |
| [`docs/phase--1/reports/13_FOUNDER_MISTAKES.md`](phase--1/reports/13_FOUNDER_MISTAKES.md) | 25 deadly founder mistakes | Ph-1 | Complete |
| [`docs/phase--1/reports/14_FAILURE_SCENARIOS.md`](phase--1/reports/14_FAILURE_SCENARIOS.md) | 6 detailed failure narratives | Ph-1 | Complete |
| [`docs/phase--1/reports/17_UNKNOWNS.md`](phase--1/reports/17_UNKNOWNS.md) | 75 known unknowns with resolution plan | Ph-1 | Complete |
| [`docs/phase--1/reports/19_EXECUTION_ORDER.md`](phase--1/reports/19_EXECUTION_ORDER.md) | Week-by-week Phase 0 action plan | Ph-1 | Complete |

### Phase 0 Research (Active — Not Yet Populated)

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`ASSUMPTIONS.md`](../ASSUMPTIONS.md) | Active assumption tracking (13 assumptions) | Ph0 | Active |
| [`TASKS.md`](../TASKS.md) | Phase 0 customer validation task list | Ph0 | Active |

### Research Templates (Awaiting Population)

| Document | Role | Triggered By |
|----------|------|-------------|
| [`research/interviews/interview_template.md`](../research/interviews/interview_template.md) | Interview documentation scaffold | T0.3-I02, T0.4-I02 |
| [`research/competitor/competitor_research_template.md`](../research/competitor/competitor_research_template.md) | Competitor analysis scaffold | T0.1-R01 |
| [`research/market/market_research_template.md`](../research/market/market_research_template.md) | Market research scaffold | T0.1-R01 |
| [`research/feature_evaluation/feature_evaluation_template.md`](../research/feature_evaluation/feature_evaluation_template.md) | Feature evaluation scaffold | Post-Phase 0 |
| [`research/risk/risk_template.md`](../research/risk/risk_template.md) | Risk documentation scaffold | Ongoing |

### Archive (Raw Research Inputs — Do Not Cite)

| Document | Note |
|----------|------|
| `archive/raw-ai-output/Pasted markdown (2)(1)(1).md` | Unprocessed AI output |
| `archive/raw-ai-output/Pasted markdown (2)(1).md` | Unprocessed AI output |
| `archive/raw-ai-output/Pasted markdown (2)(2).md` | Unprocessed AI output |
| `archive/raw-ai-output/Pasted markdown(23).md` | Unprocessed AI output |

---

## Product

Documents that define what the platform does, how it behaves, and what is in and out of scope.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/02_product/MVP_FREEZE.md`](02_product/MVP_FREEZE.md) | Frozen Phase 1 scope definition | Ph1 | Active |
| [`docs/02_product/FEATURE_CATALOG.md`](02_product/FEATURE_CATALOG.md) | Canonical feature list (FC-01 to FC-07) | Ph1 | Active |
| [`docs/02_product/USER_STORIES.md`](02_product/USER_STORIES.md) | User stories by persona | Ph1 | Active |
| [`docs/02_product/FLOWS.md`](02_product/FLOWS.md) | Core user flow diagrams | Ph1 | Active |
| [`docs/02_product/LEAN_PRODUCT.md`](02_product/LEAN_PRODUCT.md) | Capital-constrained product strategy | Ph1 | Active |
| [`docs/02_product/BUSINESS_RULES.md`](02_product/BUSINESS_RULES.md) | Platform business rules | Ph1 | Active |
| [`docs/02_product/PRODUCT_NORMALIZATION_REPORT.md`](02_product/PRODUCT_NORMALIZATION_REPORT.md) | Deduplication and normalization decisions | Ph1 | Complete |
| [`business/product/product_template.md`](../business/product/product_template.md) | Product spec template | All | Template |
| [`business/sprint/sprint_template.md`](../business/sprint/sprint_template.md) | Sprint planning template | All | Template |

---

## Architecture

Documents that define the technical structure of the platform.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](02_product/FEATURE_DEPENDENCY_MAP.md) | Feature build sequence and dependency graph | Ph1 | Active |
| [`docs/architecture/adr/ADR-template.md`](architecture/adr/ADR-template.md) | Architecture Decision Record template | Ph1+ | Template |

> **Gap**: No ADRs have been written yet. First architectural decisions (database, hosting, payment abstraction layer) must be documented using `ADR-template.md` before Phase 1 build begins.

---

## Marketplace

Documents specific to the two-sided marketplace design: supply, demand, trust, liquidity, and transaction mechanics.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/phase--1/risks/10_MARKETPLACE_RISKS.md`](phase--1/risks/10_MARKETPLACE_RISKS.md) | 100 marketplace liquidity, trust, pricing risks | Ph-1 | Complete |
| [`docs/02_product/BUSINESS_RULES.md`](02_product/BUSINESS_RULES.md) | Transaction, escrow, and supply rules | Ph1 | Active |
| [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](03_customer_experience/TRUST_FRAMEWORK.md) | Trust architecture for guests and hosts | Ph1 | Active |
| [`DECISION_LOG.md`](../DECISION_LOG.md) | Marketplace decisions: DEC-002, DEC-004, DEC-005, DEC-006, DEC-010 | Ph0+ | Active |
| [`archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md`](../archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md) | Legacy marketplace backlog | Archived | Archive |

---

## AI

Documents defining the AI strategy, capabilities, and development roadmap.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`ai_agents/ai_agent_documentation.md`](../ai_agents/ai_agent_documentation.md) | AI agents used in development and operations | All | Active |
| [`DECISION_LOG.md`](../DECISION_LOG.md) | AI roadmap decision (DEC-008): data-gated AI feature sequence | Ph0+ | Active |

> **Phase sequence for AI features**: Phase 0 — zero AI; Phase 1 — rule-based pricing guidance; Phase 2 — ML pricing at 50K+ transactions; Phase 3+ — demand forecasting, personalization, fraud detection. See DEC-008.

---

## Operations

Documents covering how the platform operates in the field: task dispatch, property verification, and execution tracking.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`TASKS.md`](../TASKS.md) | Phase 0 operational tasks (19 tasks) | Ph0 | Active |
| [`docs/02_product/ENGINEERING_BACKLOG.md`](02_product/ENGINEERING_BACKLOG.md) | OpsManager (FC-05) engineering tasks | Ph1 | Active |
| [`business/sprint/sprint_template.md`](../business/sprint/sprint_template.md) | Sprint planning template | All | Template |
| [`archive/CLEANUP_REPORT.md`](../archive/CLEANUP_REPORT.md) | Repository cleanup record | N/A | Archive |

---

## Finance

Documents covering revenue model, escrow, payments, and financial risk.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/phase--1/risks/11_FINANCIAL_RISKS.md`](phase--1/risks/11_FINANCIAL_RISKS.md) | 100 revenue, capital, and exit risks | Ph-1 | Complete |
| [`docs/02_product/BUSINESS_RULES.md`](02_product/BUSINESS_RULES.md) | Escrow rules (BR-FIN-01–03), payout controls | Ph1 | Active |
| [`business/financial/financial_model_template.md`](../business/financial/financial_model_template.md) | Financial model template | Ph1+ | Template |

> **Revenue model**: Commission-based (8–12% host) + guest service fee (3–5%) + B2B SaaS ($50–$200/month) — see DEC-010 in `DECISION_LOG.md`.

---

## Legal

Documents covering regulatory compliance, entity structure, and legal risk.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/phase--1/risks/09_LEGAL_RISKS.md`](phase--1/risks/09_LEGAL_RISKS.md) | 100 corporate, regulatory, privacy, labor risks | Ph-1 | Complete |
| [`TASKS.md`](../TASKS.md) | Legal tasks: T0.1-L01 (trademark), T0.1-L02 (lawyer), T0.1-L03 (entity), T0.1-L04 (ETA) | Ph0 | Active |

---

## Security

Documents covering data security, fraud prevention, and safety.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`RISKS.md`](../RISKS.md) | TR-004: Data security and guest privacy risk | All | Active |
| [`docs/phase--1/risks/08_TECHNICAL_RISKS.md`](phase--1/risks/08_TECHNICAL_RISKS.md) | 100 infrastructure, AI, and security risks | Ph-1 | Complete |
| [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](03_customer_experience/TRUST_FRAMEWORK.md) | Identity verification, fraud prevention, dispute resolution | Ph1 | Active |

---

## Customer Experience

Documents defining the human experience of the StayOS platform.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md`](03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md) | Actor profiles and unified journey map | Ph1 | Active |
| [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](03_customer_experience/TRUST_FRAMEWORK.md) | 5-layer trust architecture | Ph1 | Active |
| [`docs/03_customer_experience/EXPERIENCE_RULES.md`](03_customer_experience/EXPERIENCE_RULES.md) | Non-negotiable performance thresholds | Ph1 | Active |
| [`docs/03_customer_experience/DELIGHT_ENGINE.md`](03_customer_experience/DELIGHT_ENGINE.md) | 100 micro-delight moments (Phase 2+ vision) | Ph2+ | Vision |

---

## Engineering

Documents covering the technical build, standards, and architecture.

| Document | Role | Phase | Status |
|----------|------|-------|--------|
| [`docs/02_product/ENGINEERING_BACKLOG.md`](02_product/ENGINEERING_BACKLOG.md) | Epic-level Phase 1 engineering tasks | Ph1 | Active |
| [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](02_product/FEATURE_DEPENDENCY_MAP.md) | Feature build order and dependencies | Ph1 | Active |
| [`docs/architecture/adr/ADR-template.md`](architecture/adr/ADR-template.md) | Architecture Decision Record template | Ph1+ | Template |
| [`docs/phase--1/risks/08_TECHNICAL_RISKS.md`](phase--1/risks/08_TECHNICAL_RISKS.md) | 100 technical risks to plan against | Ph-1 | Complete |
| [`archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md`](../archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md) | Legacy engineering backlog — superseded | Archive | Archive |

---

## Governance

Documents that define how the project runs: rules, standards, templates, and contribution guidelines.

| Document | Role | Status |
|----------|------|--------|
| [`PROJECT_RULES.md`](../PROJECT_RULES.md) | Core project operating rules | Active |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Contributor guide | Active |
| [`docs/standards/commit_conventions.md`](standards/commit_conventions.md) | Commit message standards | Active |
| [`docs/standards/documentation_guide.md`](standards/documentation_guide.md) | Documentation writing guide | Active |
| [`docs/standards/folder_conventions.md`](standards/folder_conventions.md) | Folder structure conventions | Active |
| [`docs/standards/markdown_standards.md`](standards/markdown_standards.md) | Markdown formatting standards | Active |
| [`docs/standards/naming_conventions.md`](standards/naming_conventions.md) | File and folder naming rules | Active |
| [`docs/standards/repository_standards.md`](standards/repository_standards.md) | Repository-wide standards | Active |
| [`docs/templates/prompt_template.md`](templates/prompt_template.md) | AI prompt documentation template | Active |

---

## Tooling

Documents covering repository management, CI/CD, and developer tooling.

| Document | Role | Status |
|----------|------|--------|
| [`tools/README_extract_docs.md`](../tools/README_extract_docs.md) | Document extractor tool documentation | Active |
| [`MIGRATION_PLAN.md`](../MIGRATION_PLAN.md) | Repository migration execution plan | Active |
| [`REPOSITORY_AUDIT.md`](../REPOSITORY_AUDIT.md) | Pre-refactor audit findings | Reference |
| [`REPOSITORY_CLASSIFICATION.md`](../REPOSITORY_CLASSIFICATION.md) | Document classification by disposition | Reference |
| [`REPOSITORY_REFACTOR_PLAN.md`](../REPOSITORY_REFACTOR_PLAN.md) | High-level refactor plan | Reference |
| `.github/workflows/ci.yml` | Python + documentation CI pipeline | Active |
| `.github/workflows/release.yml` | Release documentation workflow | Active |
| `.github/workflows/security.yml` | Python security scanning workflow | Active |
| `.github/workflows/docs.yml` | Documentation linting workflow | Active |
| [`archive/CLEANUP_REPORT.md`](../archive/CLEANUP_REPORT.md) | Repository cleanup report | Archive |

---

**Update this map whenever a new document is created or a document changes domain.**
