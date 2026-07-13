# Repository Manifest — StayOS

**Version**: 1.0.0
**Sprint**: 2 — Repository Intelligence Layer
**Generated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active — authoritative inventory of all repository documents

This manifest lists every document in the StayOS repository. It is the source of record for what exists, what it does, who owns it, and what depends on it.

**Total documents indexed**: 85 markdown files

---

## Index

- [Root-Level Documents](#root-level-documents) — 15 files
- [Phase -1: Founder Discovery](#phase--1-founder-discovery) — 21 files
- [Product](#product-docs02_product) — 9 files
- [Customer Experience](#customer-experience-docs03_customer_experience) — 4 files
- [Architecture](#architecture-docsarchitecture) — 1 file
- [Standards](#standards-docsstandards) — 6 files
- [Research Templates](#research-templates-research) — 5 files
- [Business Templates](#business-templates-business) — 4 files
- [AI Agents](#ai-agents-ai_agents) — 1 file
- [Tooling](#tooling-tools) — 1 file
- [GitHub Infrastructure](#github-infrastructure-github) — 5 files
- [Archive](#archive) — 9 files
- [Sprint Reports](#sprint-reports) — 1 file
- [Intelligence Layer (this sprint)](#intelligence-layer-docs) — 5 files

---

## Root-Level Documents

### README.md

| Field | Value |
|-------|-------|
| **Path** | `README.md` |
| **Domain** | Business Strategy |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Public-facing project introduction. Defines StayOS identity, problem statement, market opportunity, and current phase. First document read by all external stakeholders. |
| **Owner** | Founder |
| **Dependencies** | `MASTER_CONTEXT.md` (narrative source), `PROJECT_VISION.md` (strategic pillars), `ROADMAP.md` (phase status) |
| **Consumers** | All external stakeholders: investors, co-founders, advisors, press, future hires |

---

### MASTER_CONTEXT.md

| Field | Value |
|-------|-------|
| **Path** | `MASTER_CONTEXT.md` |
| **Domain** | Business Strategy |
| **Phase** | All Phases |
| **Status** | Active — canonical source of truth for what StayOS is |
| **Purpose** | Complete project context document. Defines the company, problem, solution, market, competitors, team, and current phase status. Anyone joining the project reads this first. |
| **Owner** | Founder |
| **Dependencies** | None — this is a root document |
| **Consumers** | All documents; all stakeholders; all phases |

---

### PROJECT_VISION.md

| Field | Value |
|-------|-------|
| **Path** | `PROJECT_VISION.md` |
| **Domain** | Business Strategy |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Long-term vision, mission statement, core values, and strategic pillars. Defines the "OS" metaphor formally. Provides the north star for all product and business decisions. |
| **Owner** | Founder |
| **Dependencies** | `MASTER_CONTEXT.md` |
| **Consumers** | `ROADMAP.md`, `DECISION_LOG.md`, all product documents, investor materials |

---

### ROADMAP.md

| Field | Value |
|-------|-------|
| **Path** | `ROADMAP.md` |
| **Domain** | Business Strategy |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Phase-by-phase execution plan with gate conditions. Defines what must be true before each phase begins. Current state: Phase -1 complete, Phase 0 locked. |
| **Owner** | Founder |
| **Dependencies** | `PROJECT_VISION.md`, `MASTER_CONTEXT.md`, `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md` |
| **Consumers** | `TASKS.md`, `DECISION_LOG.md`, all phase documents, investors |

---

### TASKS.md

| Field | Value |
|-------|-------|
| **Path** | `TASKS.md` |
| **Domain** | Operations |
| **Phase** | Phase 0 |
| **Status** | Active — 19 tasks, 0 complete |
| **Purpose** | Active task list for Phase 0 customer validation. Organized by milestone. Includes acceptance criteria and gate dependencies for each task. |
| **Owner** | Founder |
| **Dependencies** | `ROADMAP.md`, `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`, `docs/phase--1/reports/19_EXECUTION_ORDER.md` |
| **Consumers** | `DECISION_LOG.md` (task completion triggers decisions), weekly working sessions |

---

### DECISION_LOG.md

| Field | Value |
|-------|-------|
| **Path** | `DECISION_LOG.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase 0 onwards |
| **Status** | Active — 10 decisions recorded |
| **Purpose** | Permanent log of all significant strategic, product, legal, and operational decisions. Each entry records context, alternatives, rationale, and consequences. |
| **Owner** | Founder |
| **Dependencies** | `MASTER_CONTEXT.md`, `ASSUMPTIONS.md`, `docs/phase--1/reports/18_KEY_DECISIONS.md` |
| **Consumers** | `ROADMAP.md`, `RISKS.md`, all future phases; investors; co-founders |

---

### ASSUMPTIONS.md

| Field | Value |
|-------|-------|
| **Path** | `ASSUMPTIONS.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase 0 |
| **Status** | Active — 13 assumptions, all unvalidated |
| **Purpose** | Tracks critical assumptions underlying StayOS business model. Each assumption has a validation method, kill threshold, and invalidation response. Cross-references to Phase 0 tasks. |
| **Owner** | Founder |
| **Dependencies** | `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` (100-assumption source), `TASKS.md` |
| **Consumers** | `DECISION_LOG.md`, `RISKS.md`, `ROADMAP.md`, weekly founder review |

---

### RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `RISKS.md` |
| **Domain** | Business Strategy / Operations |
| **Phase** | All Phases |
| **Status** | Active — 15 risks (rewritten Sprint 1) |
| **Purpose** | Active risk register for the StayOS accommodation marketplace. Covers technical, market, business, resource, and external risks with mitigation strategies and contingency plans. |
| **Owner** | Founder |
| **Dependencies** | `ASSUMPTIONS.md`, `DECISION_LOG.md`, `docs/phase--1/risks/06_RISK_REGISTER.md` (Phase -1 source) |
| **Consumers** | `ROADMAP.md`, advisors, investors, all phase planning |

---

### PROJECT_RULES.md

| Field | Value |
|-------|-------|
| **Path** | `PROJECT_RULES.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Operating rules for the project team — quality standards, security practices, user-centric principles, and process guidelines. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | All team members, `CONTRIBUTING.md` |

---

### CONTRIBUTING.md

| Field | Value |
|-------|-------|
| **Path** | `CONTRIBUTING.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Contributor guide — how to submit issues, PRs, and documentation changes. |
| **Owner** | Founder |
| **Dependencies** | `PROJECT_RULES.md`, `docs/standards/` |
| **Consumers** | External contributors, co-founders, team hires |

---

### MIGRATION_PLAN.md

| Field | Value |
|-------|-------|
| **Path** | `MIGRATION_PLAN.md` |
| **Domain** | Tooling |
| **Phase** | N/A (Sprint tooling) |
| **Status** | Partially executed — Sprint 1 completed items 1–3 |
| **Purpose** | Detailed file-by-file migration instructions for repository refactor. Companion to `REPOSITORY_REFACTOR_PLAN.md`. |
| **Owner** | Founder |
| **Dependencies** | `REPOSITORY_REFACTOR_PLAN.md`, `REPOSITORY_AUDIT.md` |
| **Consumers** | Sprint execution; future sprint planning |

---

### REPOSITORY_AUDIT.md

| Field | Value |
|-------|-------|
| **Path** | `REPOSITORY_AUDIT.md` |
| **Domain** | Tooling |
| **Phase** | N/A (Sprint tooling) |
| **Status** | Reference — audit findings used to drive sprint planning |
| **Purpose** | Full audit of repository state before refactor. Identifies misaligned documents, Rust artifacts, and cleanup requirements. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | `MIGRATION_PLAN.md`, `REPOSITORY_REFACTOR_PLAN.md` |

---

### REPOSITORY_CLASSIFICATION.md

| Field | Value |
|-------|-------|
| **Path** | `REPOSITORY_CLASSIFICATION.md` |
| **Domain** | Tooling |
| **Phase** | N/A (Sprint tooling) |
| **Status** | Reference |
| **Purpose** | Classifies every repository document by type, purpose, and disposition (keep/refactor/archive). |
| **Owner** | Founder |
| **Dependencies** | `REPOSITORY_AUDIT.md` |
| **Consumers** | Sprint planning |

---

### REPOSITORY_REFACTOR_PLAN.md

| Field | Value |
|-------|-------|
| **Path** | `REPOSITORY_REFACTOR_PLAN.md` |
| **Domain** | Tooling |
| **Phase** | N/A (Sprint tooling) |
| **Status** | Reference |
| **Purpose** | High-level refactor plan for the repository. Defines sprint sequence and objectives. |
| **Owner** | Founder |
| **Dependencies** | `REPOSITORY_AUDIT.md`, `REPOSITORY_CLASSIFICATION.md` |
| **Consumers** | `MIGRATION_PLAN.md`, sprint execution |

---

### SPRINT_1_REPORT.md

| Field | Value |
|-------|-------|
| **Path** | `SPRINT_1_REPORT.md` |
| **Domain** | Tooling |
| **Phase** | N/A (Sprint record) |
| **Status** | Complete |
| **Purpose** | Sprint 1 completion report. Documents all changes, validation results, and files modified/not modified. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | Sprint history; future sprint planning |

---

## Phase -1: Founder Discovery

> 21 documents. Status: Complete. These are the outputs of the Phase -1 founder discovery process — a simulated executive panel that produced 600+ risks, 100+ assumptions, and 15 strategic decisions before a single line of product code was written.

### docs/phase--1/INDEX.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/INDEX.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | Master index for all Phase -1 documents. Directory listing with summaries, cross-reference map by topic. |
| **Owner** | Founder |
| **Dependencies** | All Phase -1 documents |
| **Consumers** | `ROADMAP.md`, anyone navigating Phase -1 outputs |

---

### docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | Panel verdict: conditional go. Summarizes 14 critical flaws, the business thesis, and what must be true for StayOS to succeed. Entry point for the full Phase -1 corpus. |
| **Owner** | Founder |
| **Dependencies** | All Phase -1 reports and risks |
| **Consumers** | Investors, advisors, co-founders; `ROADMAP.md` |

---

### docs/phase--1/reports/02_PRE_MORTEM.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/02_PRE_MORTEM.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | Narrative of how StayOS fails — told from 26 months into the future. Identifies the most probable failure chain. |
| **Owner** | Founder |
| **Dependencies** | `01_EXECUTIVE_SUMMARY.md` |
| **Consumers** | Phase 0 planning, `RISKS.md`, `ASSUMPTIONS.md` |

---

### docs/phase--1/reports/03_STARTUP_KILL_REPORT.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/03_STARTUP_KILL_REPORT.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 110 specific reasons this startup will fail. Each reason is a risk, assumption, or mistake with a concrete failure mechanism. |
| **Owner** | Founder |
| **Dependencies** | `01_EXECUTIVE_SUMMARY.md` |
| **Consumers** | `RISKS.md`, `ASSUMPTIONS.md`, Phase 0 task design |

---

### docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 100 assumptions with danger ratings (1–5) and validation methods. The source document for `ASSUMPTIONS.md`. |
| **Owner** | Founder |
| **Dependencies** | `01_EXECUTIVE_SUMMARY.md` |
| **Consumers** | `ASSUMPTIONS.md` (selects highest-priority subset) |

---

### docs/phase--1/reports/05_MARKET_HYPOTHESES.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/05_MARKET_HYPOTHESES.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 20 testable market hypotheses with designed experiments and success metrics. Source for traveler and host interview scripts. |
| **Owner** | Founder |
| **Dependencies** | `04_ASSUMPTION_ANALYSIS.md` |
| **Consumers** | `TASKS.md` (interview script tasks), `ASSUMPTIONS.md` |

---

### docs/phase--1/reports/13_FOUNDER_MISTAKES.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/13_FOUNDER_MISTAKES.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 25 most deadly founder mistakes specific to this business context (accommodation marketplace, Egypt, first-time founder). |
| **Owner** | Founder |
| **Dependencies** | `01_EXECUTIVE_SUMMARY.md` |
| **Consumers** | `DECISION_LOG.md`, `PROJECT_RULES.md`, Phase 0 execution |

---

### docs/phase--1/reports/14_FAILURE_SCENARIOS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/14_FAILURE_SCENARIOS.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 6 detailed failure narratives with probability ratings. Covers: trust collapse, supply failure, funding gap, regulatory block, competitor response, team breakdown. |
| **Owner** | Founder |
| **Dependencies** | `02_PRE_MORTEM.md` |
| **Consumers** | `RISKS.md`, Phase 0 gate design |

---

### docs/phase--1/reports/15_SUCCESS_FACTORS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/15_SUCCESS_FACTORS.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 10 critical conditions that must be true for StayOS to succeed. Counterpart to failure analysis. |
| **Owner** | Founder |
| **Dependencies** | `01_EXECUTIVE_SUMMARY.md` |
| **Consumers** | `ROADMAP.md`, `PROJECT_VISION.md`, investor materials |

---

### docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 → Phase 0 |
| **Status** | Complete — defines Phase 0 gate conditions |
| **Purpose** | 15 validations required before Phase 0 can exit. Defines the exact criteria (with kill thresholds) that must be met before Phase 1 begins. |
| **Owner** | Founder |
| **Dependencies** | `04_ASSUMPTION_ANALYSIS.md`, `05_MARKET_HYPOTHESES.md` |
| **Consumers** | `ROADMAP.md` (gate source), `TASKS.md` (task design source) |

---

### docs/phase--1/reports/17_UNKNOWNS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/17_UNKNOWNS.md` |
| **Domain** | Research / Discovery |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 75 known unknowns across 6 categories with resolution plan. Documents what is not yet known and what must be discovered. |
| **Owner** | Founder |
| **Dependencies** | `04_ASSUMPTION_ANALYSIS.md` |
| **Consumers** | `ASSUMPTIONS.md`, `TASKS.md`, Phase 0 research design |

---

### docs/phase--1/reports/18_KEY_DECISIONS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/18_KEY_DECISIONS.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase -1 |
| **Status** | Complete |
| **Purpose** | 15 strategic decisions with owners, deadlines, and required inputs. The source framework for `DECISION_LOG.md`. |
| **Owner** | Founder |
| **Dependencies** | `01_EXECUTIVE_SUMMARY.md` |
| **Consumers** | `DECISION_LOG.md` (pending decisions section), `TASKS.md` |

---

### docs/phase--1/reports/19_EXECUTION_ORDER.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/19_EXECUTION_ORDER.md` |
| **Domain** | Operations |
| **Phase** | Phase 0 |
| **Status** | Complete |
| **Purpose** | Week-by-week action plan for Phase 0 execution. Defines the sequence of legal, research, pilot, and operational tasks. |
| **Owner** | Founder |
| **Dependencies** | `16_REQUIRED_VALIDATIONS.md`, `18_KEY_DECISIONS.md` |
| **Consumers** | `TASKS.md` (task ordering source) |

---

### docs/phase--1/reports/20_NEXT_PHASE.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/reports/20_NEXT_PHASE.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase -1 → Phase 0 |
| **Status** | Complete |
| **Purpose** | Full definition of Phase 0: prerequisites, constraints, budget, team requirements, and success criteria. |
| **Owner** | Founder |
| **Dependencies** | `16_REQUIRED_VALIDATIONS.md`, `19_EXECUTION_ORDER.md` |
| **Consumers** | `ROADMAP.md`, Phase 0 planning |

---

### docs/phase--1/risks/06_RISK_REGISTER.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/06_RISK_REGISTER.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase -1 |
| **Status** | Complete — master index of 600 risks |
| **Purpose** | Master risk index for Phase -1. Top 25 risks ranked by severity. Points to the 6 category-specific risk documents. |
| **Owner** | Founder |
| **Dependencies** | `07_BUSINESS_RISKS.md` through `12_COMPETITIVE_RISKS.md` |
| **Consumers** | `RISKS.md` (active register draws from here), advisors |

---

### docs/phase--1/risks/07_BUSINESS_RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/07_BUSINESS_RISKS.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase -1 |
| **Status** | Complete — 100 business risks |
| **Purpose** | 100 business, operational, and strategic risks for the accommodation marketplace. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | `06_RISK_REGISTER.md`, `RISKS.md` |

---

### docs/phase--1/risks/08_TECHNICAL_RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/08_TECHNICAL_RISKS.md` |
| **Domain** | Engineering |
| **Phase** | Phase -1 |
| **Status** | Complete — 100 technical risks |
| **Purpose** | 100 infrastructure, AI, product, and security risks for the platform build. |
| **Owner** | Founder / CTO |
| **Dependencies** | None |
| **Consumers** | `06_RISK_REGISTER.md`, `RISKS.md`, Phase 1 engineering planning |

---

### docs/phase--1/risks/09_LEGAL_RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/09_LEGAL_RISKS.md` |
| **Domain** | Legal |
| **Phase** | Phase -1 |
| **Status** | Complete — 100 legal risks |
| **Purpose** | 100 corporate, regulatory, privacy, and labor risks. Primary reference for legal task planning in `TASKS.md`. |
| **Owner** | Founder / Legal Counsel |
| **Dependencies** | None |
| **Consumers** | `06_RISK_REGISTER.md`, `TASKS.md` (legal milestone), `ASSUMPTIONS.md` |

---

### docs/phase--1/risks/10_MARKETPLACE_RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/10_MARKETPLACE_RISKS.md` |
| **Domain** | Marketplace |
| **Phase** | Phase -1 |
| **Status** | Complete — 100 marketplace risks |
| **Purpose** | 100 liquidity, trust, pricing, and supply-demand balance risks specific to a two-sided accommodation marketplace. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | `06_RISK_REGISTER.md`, `RISKS.md`, growth planning |

---

### docs/phase--1/risks/11_FINANCIAL_RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/11_FINANCIAL_RISKS.md` |
| **Domain** | Finance |
| **Phase** | Phase -1 |
| **Status** | Complete — 100 financial risks |
| **Purpose** | 100 revenue model, capital allocation, operational cost, and exit scenario risks. |
| **Owner** | Founder / CFO |
| **Dependencies** | None |
| **Consumers** | `06_RISK_REGISTER.md`, `RISKS.md`, investor materials |

---

### docs/phase--1/risks/12_COMPETITIVE_RISKS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/phase--1/risks/12_COMPETITIVE_RISKS.md` |
| **Domain** | Business Strategy |
| **Phase** | Phase -1 |
| **Status** | Complete — 100 competitive risks |
| **Purpose** | 100 risks from global OTAs, regional competitors, informal channels, and platform response strategies. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | `06_RISK_REGISTER.md`, `RISKS.md`, growth planning |

---

## Product (docs/02_product)

> 9 documents. Status: Phase 1 planning (pending Phase 0 completion). These documents define the MVP scope, feature set, business rules, and engineering plan for Phase 1 build.

### docs/02_product/MVP_FREEZE.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/MVP_FREEZE.md` |
| **Domain** | Product |
| **Phase** | Phase 1 |
| **Status** | Active — scope frozen for Phase 1 build |
| **Purpose** | Defines the frozen scope of the Phase 1 MVP: core booking loop (AuthGate → Search → Booking → Payment → OpsManager). Explicitly excludes channel manager, dynamic pricing, advanced CRM. |
| **Owner** | Founder / Product Lead |
| **Dependencies** | `docs/02_product/FEATURE_CATALOG.md`, `ROADMAP.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, `ASSUMPTIONS.md` (PA-003), `TASKS.md` |

---

### docs/02_product/FEATURE_CATALOG.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/FEATURE_CATALOG.md` |
| **Domain** | Product |
| **Phase** | Phase 1 |
| **Status** | Active — 7 core features defined (FC-01 through FC-07) |
| **Purpose** | Canonical catalog of all platform features. Each feature (FC-XX) has a description, user stories, and dependencies. Source of record for feature identity. |
| **Owner** | Product Lead |
| **Dependencies** | `MVP_FREEZE.md`, `USER_STORIES.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, `FEATURE_DEPENDENCY_MAP.md`, `FLOWS.md` |

---

### docs/02_product/FEATURE_DEPENDENCY_MAP.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/FEATURE_DEPENDENCY_MAP.md` |
| **Domain** | Architecture / Product |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Visual and tabular dependency map between the 7 core features. Defines build sequence, critical path, and parallel build opportunities. FC-01 (AuthGate) is the root dependency. |
| **Owner** | CTO / Product Lead |
| **Dependencies** | `FEATURE_CATALOG.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, sprint planning |

---

### docs/02_product/FLOWS.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/FLOWS.md` |
| **Domain** | Product / Architecture |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Core user flow diagrams: booking flow (search → auth → KYC → reservation → payment → confirmation) and checkout-to-turnover operations loop. |
| **Owner** | Product Lead |
| **Dependencies** | `FEATURE_CATALOG.md`, `BUSINESS_RULES.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, design, QA |

---

### docs/02_product/ENGINEERING_BACKLOG.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/ENGINEERING_BACKLOG.md` |
| **Domain** | Engineering |
| **Phase** | Phase 1 |
| **Status** | Active — pending Phase 0 gate clearance before execution |
| **Purpose** | Epic-level engineering task breakdown for Phase 1 MVP. Organized by feature (FC-01 AuthGate, FC-02 Search, etc.) with subtask specifications. |
| **Owner** | CTO |
| **Dependencies** | `MVP_FREEZE.md`, `FEATURE_CATALOG.md`, `FEATURE_DEPENDENCY_MAP.md`, `USER_STORIES.md` |
| **Consumers** | Engineering team; sprint planning; `TASKS.md` (Phase 1 preview section) |

---

### docs/02_product/LEAN_PRODUCT.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/LEAN_PRODUCT.md` |
| **Domain** | Product |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Lean product strategy under $150K / 6-month constraint. Defines the minimal value loop and what is cut to protect capital. Companion to `MVP_FREEZE.md`. |
| **Owner** | Founder / Product Lead |
| **Dependencies** | `MVP_FREEZE.md` |
| **Consumers** | Engineering team, investors (capital efficiency narrative) |

---

### docs/02_product/BUSINESS_RULES.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/BUSINESS_RULES.md` |
| **Domain** | Product / Operations |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Non-negotiable platform business rules across: identity (KYC), inventory (calendar locking), operations (ticket dispatch), finance (escrow, tax), and support SLAs. |
| **Owner** | Product Lead / CTO |
| **Dependencies** | `FEATURE_CATALOG.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, QA, legal |

---

### docs/02_product/USER_STORIES.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/USER_STORIES.md` |
| **Domain** | Product |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | User stories by persona: Guest (US-G01–05), Host/PM (US-H01–04), Field Staff (US-F01–04), Finance (US-FI01–02), Support (US-S01+). Maps each story to a feature. |
| **Owner** | Product Lead |
| **Dependencies** | `FEATURE_CATALOG.md`, `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, `FEATURE_DEPENDENCY_MAP.md` |

---

### docs/02_product/PRODUCT_NORMALIZATION_REPORT.md

| Field | Value |
|-------|-------|
| **Path** | `docs/02_product/PRODUCT_NORMALIZATION_REPORT.md` |
| **Domain** | Product / Engineering |
| **Phase** | Phase 1 |
| **Status** | Complete — reference document |
| **Purpose** | Documents duplications found across product specifications and the normalization decisions made. Defines canonical data models and service boundaries (AuthGate, PMS Core, OpsManager, FinancialEngine). |
| **Owner** | Product Lead / CTO |
| **Dependencies** | `FEATURE_CATALOG.md`, `FLOWS.md`, `BUSINESS_RULES.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, architecture decisions |

---

## Customer Experience (docs/03_customer_experience)

> 4 documents. Defines the human experience layer: journey maps, trust framework, performance rules, and delight design.

### docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md

| Field | Value |
|-------|-------|
| **Path** | `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` |
| **Domain** | Customer Experience |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Actor profiles (Guest, Host, PM, Cleaner, Support, Admin) and unified journey map across all stages (Discovery → Return). Defines emotional states, touchpoints, and delight opportunities per stage. |
| **Owner** | Founder / Product Lead |
| **Dependencies** | `docs/02_product/USER_STORIES.md` |
| **Consumers** | `EXPERIENCE_RULES.md`, `DELIGHT_ENGINE.md`, design, customer support |

---

### docs/03_customer_experience/TRUST_FRAMEWORK.md

| Field | Value |
|-------|-------|
| **Path** | `docs/03_customer_experience/TRUST_FRAMEWORK.md` |
| **Domain** | Customer Experience / Security |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Defines the 5-layer trust architecture: identity verification (Zero-Ghost Protocol), financial trust (Vault escrow), physical safety, integrity/reviews, and dispute resolution. |
| **Owner** | Founder / Head of Operations |
| **Dependencies** | `docs/02_product/BUSINESS_RULES.md` (financial rules), `DECISION_LOG.md` (DEC-006) |
| **Consumers** | `ENGINEERING_BACKLOG.md`, `EXPERIENCE_RULES.md`, investor materials |

---

### docs/03_customer_experience/EXPERIENCE_RULES.md

| Field | Value |
|-------|-------|
| **Path** | `docs/03_customer_experience/EXPERIENCE_RULES.md` |
| **Domain** | Customer Experience |
| **Phase** | Phase 1 |
| **Status** | Active |
| **Purpose** | Non-negotiable performance thresholds: booking in ≤ 3 clicks, search results in ≤ 2s, WhatsApp response ≤ 30s, refunds ≤ 24h, dispute resolution ≤ 15 min. |
| **Owner** | Founder / Head of CX |
| **Dependencies** | `CUSTOMER_JOURNEY_BIBLE.md`, `TRUST_FRAMEWORK.md` |
| **Consumers** | `ENGINEERING_BACKLOG.md`, QA, support team |

---

### docs/03_customer_experience/DELIGHT_ENGINE.md

| Field | Value |
|-------|-------|
| **Path** | `docs/03_customer_experience/DELIGHT_ENGINE.md` |
| **Domain** | Customer Experience |
| **Phase** | Phase 2+ |
| **Status** | Vision document — not yet actionable |
| **Purpose** | 100 micro-delight moments designed to create memorable guest experiences (personalization, arrival surprises, local curation). Aspirational Phase 2+ product vision. |
| **Owner** | Head of CX |
| **Dependencies** | `CUSTOMER_JOURNEY_BIBLE.md` |
| **Consumers** | Phase 2 product design, marketing |

---

## Architecture (docs/architecture)

### docs/architecture/adr/ADR-template.md

| Field | Value |
|-------|-------|
| **Path** | `docs/architecture/adr/ADR-template.md` |
| **Domain** | Architecture |
| **Phase** | Phase 1 |
| **Status** | Template — awaiting first ADR |
| **Purpose** | Standard template for Architecture Decision Records. Empty scaffold awaiting first architectural decision to be documented. |
| **Owner** | CTO |
| **Dependencies** | None |
| **Consumers** | Engineering team when making architectural decisions |

---

## Standards (docs/standards)

> 6 documents defining repository and documentation conventions.

### docs/standards/commit_conventions.md

| Field | Value |
|-------|-------|
| **Path** | `docs/standards/commit_conventions.md` |
| **Domain** | Governance / Engineering |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Defines commit message format, type prefixes (feat, fix, docs, etc.), and scope conventions. |
| **Owner** | Founder / CTO |
| **Dependencies** | None |
| **Consumers** | All contributors |

---

### docs/standards/documentation_guide.md

| Field | Value |
|-------|-------|
| **Path** | `docs/standards/documentation_guide.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | How to write, structure, and maintain documentation in this repository. |
| **Owner** | Founder |
| **Dependencies** | `docs/standards/markdown_standards.md` |
| **Consumers** | All contributors |

---

### docs/standards/folder_conventions.md

| Field | Value |
|-------|-------|
| **Path** | `docs/standards/folder_conventions.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Defines the repository folder structure and naming rules for each directory. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | All contributors, sprint planning |

---

### docs/standards/markdown_standards.md

| Field | Value |
|-------|-------|
| **Path** | `docs/standards/markdown_standards.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Markdown formatting standards: headings, tables, code blocks, links. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | All contributors |

---

### docs/standards/naming_conventions.md

| Field | Value |
|-------|-------|
| **Path** | `docs/standards/naming_conventions.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | File and folder naming conventions: SCREAMING_SNAKE for docs, kebab-case for code. |
| **Owner** | Founder |
| **Dependencies** | None |
| **Consumers** | All contributors |

---

### docs/standards/repository_standards.md

| Field | Value |
|-------|-------|
| **Path** | `docs/standards/repository_standards.md` |
| **Domain** | Governance |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Overall repository standards: branch naming, PR requirements, review rules, release tagging. |
| **Owner** | Founder |
| **Dependencies** | `commit_conventions.md`, `naming_conventions.md` |
| **Consumers** | All contributors |

---

## Research Templates (research/)

> 5 template files. Status: Templates — awaiting population during Phase 0 field work.

| Path | Purpose | Populated By | Status |
|------|---------|-------------|--------|
| `research/competitor/competitor_research_template.md` | Structured competitor analysis template | T0.1-R01 (Booking.com/Airbnb Egypt research) | Template |
| `research/feature_evaluation/feature_evaluation_template.md` | Feature evaluation scoring template | Post-Phase 0 feature prioritization | Template |
| `research/interviews/interview_template.md` | Interview documentation template | T0.3-I02 (traveler interviews), T0.4-I02 (host interviews) | Template |
| `research/market/market_research_template.md` | Market research template | T0.1-R01 | Template |
| `research/risk/risk_template.md` | Risk documentation template | Risk tracking | Template |

---

## Business Templates (business/)

> 4 template files. Status: Templates — awaiting Phase 1+ population.

| Path | Purpose | Populated By | Status |
|------|---------|-------------|--------|
| `business/financial/financial_model_template.md` | Financial model framework | CFO / post-Phase 0 | Template |
| `business/product/product_template.md` | Product specification template | Product Lead / Phase 1 | Template |
| `business/roadmap/roadmap_template.md` | Roadmap documentation template | Founder / Phase updates | Template |
| `business/sprint/sprint_template.md` | Sprint planning template | Sprint planning sessions | Template |

---

## AI Agents (ai_agents/)

### ai_agents/ai_agent_documentation.md

| Field | Value |
|-------|-------|
| **Path** | `ai_agents/ai_agent_documentation.md` |
| **Domain** | AI |
| **Phase** | All Phases |
| **Status** | Active |
| **Purpose** | Documents AI agents used in the StayOS development process: DevAgent, ResearchAgent, DocumentAgent, TestAgent, OpsAgent. Defines capabilities and integration guidelines. |
| **Owner** | AI Team / Founder |
| **Dependencies** | None |
| **Consumers** | All team members using AI-assisted workflows |

---

## Tooling (tools/)

### tools/README_extract_docs.md

| Field | Value |
|-------|-------|
| **Path** | `tools/README_extract_docs.md` |
| **Domain** | Tooling |
| **Phase** | N/A |
| **Status** | Active |
| **Purpose** | Documentation for the `extract_docs.py` Python tool that extracts and processes repository documents. |
| **Owner** | Founder / CTO |
| **Dependencies** | `tools/extract_docs.py` |
| **Consumers** | CI/CD, tooling users |

---

## GitHub Infrastructure (.github/)

> 5 template files for GitHub workflow automation.

| Path | Purpose | Status |
|------|---------|--------|
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report issue template | Active |
| `.github/ISSUE_TEMPLATE/documentation.md` | Documentation issue template | Active |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Feature request issue template | Active |
| `.github/PULL_REQUEST_TEMPLATE/pr_template.md` | Pull request template | Active |
| `.github/labels/labels.md` | GitHub label definitions | Active |

---

## Archive

> 9 documents preserved for reference. Not authoritative. Do not use as primary source.

| Path | Content | Status |
|------|---------|--------|
| `archive/CLEANUP_REPORT.md` | Repository cleanup audit report | Archive |
| `archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md` | Legacy engineering backlog (pre-Sprint 1) | Archive — superseded by `docs/02_product/ENGINEERING_BACKLOG.md` |
| `archive/legacy/phase-3-customer/EXPERIENCE_RULES.md` | Legacy experience rules | Archive — superseded by `docs/03_customer_experience/EXPERIENCE_RULES.md` |
| `archive/legacy/phase-3-customer/LEAN_PRODUCT.md` | Legacy lean product doc | Archive — superseded by `docs/02_product/LEAN_PRODUCT.md` |
| `archive/legacy/phase-3-customer/MVP_FREEZE.md` | Legacy MVP freeze | Archive — superseded by `docs/02_product/MVP_FREEZE.md` |
| `archive/raw-ai-output/Pasted markdown (2)(1)(1).md` | Raw AI output (unprocessed) | Archive |
| `archive/raw-ai-output/Pasted markdown (2)(1).md` | Raw AI output (unprocessed) | Archive |
| `archive/raw-ai-output/Pasted markdown (2)(2).md` | Raw AI output (unprocessed) | Archive |
| `archive/raw-ai-output/Pasted markdown(23).md` | Raw AI output (unprocessed) | Archive |

---

## Intelligence Layer (docs/)

> These 5 documents are created in Sprint 2.

| Path | Purpose |
|------|---------|
| `docs/MANIFEST.md` | This document — full inventory of all repository documents |
| `docs/DOCUMENT_MAP.md` | Documents grouped by business domain |
| `docs/DEPENDENCY_GRAPH.md` | Cross-document relationships, circular dependencies, orphans |
| `docs/OWNERSHIP_MATRIX.md` | Role-to-document ownership mapping |
| `docs/SINGLE_SOURCE_OF_TRUTH.md` | Canonical document per topic — all others must reference, not duplicate |

---

**This manifest is the authoritative record of what exists in this repository. Update it whenever a document is added, removed, or changes status.**
