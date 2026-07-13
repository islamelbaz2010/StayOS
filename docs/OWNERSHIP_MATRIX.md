# Ownership Matrix — StayOS

**Version**: 1.0.0
**Sprint**: 2 — Repository Intelligence Layer
**Generated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

This document defines which role owns every document in the repository. Ownership means: responsible for accuracy, responsible for updates, and the final decision-maker on content disputes.

**Current team**: Founder only (Phase 0). All owner designations marked with a role name reflect the intended owner once that role is filled. Until then, the Founder is the acting owner of all documents.

---

## Ownership Definitions

| Term | Meaning |
|------|---------|
| **Primary Owner** | Writes, maintains, and is accountable for this document's accuracy |
| **Review Required** | Must approve changes before they are merged |
| **Input Provider** | Contributes to the document but does not own it |
| **Consumer** | Reads and uses the document but does not modify it |

---

## Role Definitions

| Role | Current Holder | Filled |
|------|---------------|--------|
| **Founder** | Islam Elbaz | Yes |
| **CEO** | Islam Elbaz (acting) | Pending co-founder decision |
| **CTO** | TBD | Phase 1 hire |
| **Product** | TBD | Phase 1 hire |
| **Engineering** | TBD | Phase 1 build |
| **Design** | TBD | Phase 1 hire |
| **Research** | Founder (acting) | Phase 0 execution |
| **Operations** | Founder (acting) | Phase 1 hire |
| **Finance** | TBD | Phase 1/2 hire |
| **Legal** | Retained lawyer (T0.1-L02) | Phase 0 task |
| **Growth** | TBD | Phase 2 hire |
| **AI** | Founder (acting) | Phase 2+ hire |

---

## Ownership by Role

### Founder

Documents the Founder writes and maintains directly throughout all phases.

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `MASTER_CONTEXT.md` | Primary | CEO (once filled) |
| `PROJECT_VISION.md` | Primary | CEO, advisors |
| `ROADMAP.md` | Primary | CEO, advisors |
| `DECISION_LOG.md` | Primary | Advisors |
| `ASSUMPTIONS.md` | Primary | Research advisors |
| `RISKS.md` | Primary | Legal, Finance |
| `README.md` | Primary | CEO |
| `TASKS.md` | Primary | Operations |
| `PROJECT_RULES.md` | Primary | CTO (Phase 1) |
| `CONTRIBUTING.md` | Primary | CTO (Phase 1) |
| `SPRINT_1_REPORT.md` | Primary | None |
| `docs/phase--1/INDEX.md` | Primary | None |
| `docs/MANIFEST.md` | Primary | None |
| `docs/DOCUMENT_MAP.md` | Primary | None |
| `docs/DEPENDENCY_GRAPH.md` | Primary | None |
| `docs/OWNERSHIP_MATRIX.md` | Primary | None |
| `docs/SINGLE_SOURCE_OF_TRUTH.md` | Primary | None |

---

### CEO (Founder acting until co-founder joins)

Documents that require CEO-level strategic alignment.

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `MASTER_CONTEXT.md` | Primary (acting) | Board / advisors |
| `PROJECT_VISION.md` | Primary (acting) | Board / advisors |
| `ROADMAP.md` | Primary (acting) | Board / advisors |
| `DECISION_LOG.md` | Primary (acting) | Advisors |
| `docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md` | Consumer | — |
| `docs/phase--1/reports/18_KEY_DECISIONS.md` | Consumer | — |
| `business/financial/financial_model_template.md` | Approval | Finance |

---

### CTO (Phase 1 hire)

Documents the CTO owns once the role is filled. Currently the Founder is acting owner.

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `docs/02_product/ENGINEERING_BACKLOG.md` | Primary | Product Lead |
| `docs/02_product/FEATURE_DEPENDENCY_MAP.md` | Primary | Product Lead |
| `docs/02_product/PRODUCT_NORMALIZATION_REPORT.md` | Primary | Product Lead |
| `docs/architecture/adr/ADR-template.md` | Primary | — |
| All ADR documents (when created) | Primary | Product Lead |
| `docs/standards/commit_conventions.md` | Primary | Engineering |
| `docs/standards/repository_standards.md` | Primary | Engineering |
| `tools/README_extract_docs.md` | Primary | Engineering |
| `docs/phase--1/risks/08_TECHNICAL_RISKS.md` | Consumer | — |
| `RISKS.md` (TR-002, TR-003, TR-004) | Input Provider | Founder |

---

### Product (Phase 1 hire)

Documents the Product Lead owns once the role is filled.

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `docs/02_product/MVP_FREEZE.md` | Primary | Founder, CTO |
| `docs/02_product/FEATURE_CATALOG.md` | Primary | CTO, Design |
| `docs/02_product/USER_STORIES.md` | Primary | Engineering, Design |
| `docs/02_product/FLOWS.md` | Primary | CTO, Design |
| `docs/02_product/LEAN_PRODUCT.md` | Primary | Founder, CTO |
| `docs/02_product/BUSINESS_RULES.md` | Primary | CTO, Legal |
| `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` | Primary | Design |
| `business/product/product_template.md` | Primary | — |
| `business/sprint/sprint_template.md` | Primary | Engineering |

---

### Engineering (Phase 1 team)

Documents the engineering team executes against and contributes to.

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `docs/02_product/ENGINEERING_BACKLOG.md` | Input Provider (tasks) | CTO |
| `docs/standards/commit_conventions.md` | Consumer | — |
| `docs/standards/markdown_standards.md` | Consumer | — |
| `docs/standards/naming_conventions.md` | Consumer | — |
| `docs/standards/folder_conventions.md` | Consumer | — |
| `docs/standards/documentation_guide.md` | Consumer | — |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Primary | CTO |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Primary | Product |
| `.github/PULL_REQUEST_TEMPLATE/pr_template.md` | Primary | CTO |
| `.github/workflows/*.yml` | Primary | CTO |

---

### Design (Phase 1 hire)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` | Input Provider | Product |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | Input Provider | Product |
| `docs/03_customer_experience/DELIGHT_ENGINE.md` | Primary | Product |
| `docs/02_product/USER_STORIES.md` | Consumer | — |

---

### Research (Founder acting)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `ASSUMPTIONS.md` | Primary | Founder |
| `research/interviews/interview_template.md` | Primary | Founder |
| `research/market/market_research_template.md` | Primary | Founder |
| `research/competitor/competitor_research_template.md` | Primary | Founder |
| `research/feature_evaluation/feature_evaluation_template.md` | Primary | Product |
| `research/risk/risk_template.md` | Primary | Founder |
| `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` | Consumer | — |
| `docs/phase--1/reports/05_MARKET_HYPOTHESES.md` | Consumer | — |

---

### Operations (Founder acting)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `TASKS.md` | Primary | Founder |
| `docs/02_product/BUSINESS_RULES.md` | Input Provider (BR-OPS rules) | Product, CTO |
| `docs/03_customer_experience/TRUST_FRAMEWORK.md` | Input Provider | Product |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | Input Provider (SLA rules) | Product |
| `docs/phase--1/risks/10_MARKETPLACE_RISKS.md` | Consumer | — |

---

### Finance (Phase 1/2 hire)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `business/financial/financial_model_template.md` | Primary | Founder |
| `docs/02_product/BUSINESS_RULES.md` | Input Provider (BR-FIN rules) | Product, Legal |
| `docs/phase--1/risks/11_FINANCIAL_RISKS.md` | Consumer | — |
| `RISKS.md` (BR-001, BR-002, BR-003) | Input Provider | Founder |

---

### Legal (Retained lawyer — Phase 0 Task T0.1-L02)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `TASKS.md` | Consumer (executes T0.1-L01 through T0.1-L04) | Founder |
| `docs/phase--1/risks/09_LEGAL_RISKS.md` | Consumer | — |
| `RISKS.md` (ER-001, ER-003) | Input Provider | Founder |
| `docs/02_product/BUSINESS_RULES.md` | Input Provider (compliance review) | Product |
| `DECISION_LOG.md` (DEC-003 entity structure) | Input Provider | Founder |

---

### Growth (Phase 2 hire)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `docs/phase--1/risks/12_COMPETITIVE_RISKS.md` | Consumer | — |
| `docs/phase--1/risks/10_MARKETPLACE_RISKS.md` | Consumer | — |
| `ROADMAP.md` | Consumer (Phase 2/3 planning) | — |
| `DECISION_LOG.md` (DEC-002, DEC-009, DEC-010) | Consumer | — |
| `business/roadmap/roadmap_template.md` | Consumer | — |

---

### AI (Phase 2+ hire)

| Document | Ownership Type | Review Partners |
|----------|---------------|----------------|
| `ai_agents/ai_agent_documentation.md` | Primary | CTO |
| `DECISION_LOG.md` (DEC-008 AI roadmap) | Input Provider | Founder |
| `docs/phase--1/risks/08_TECHNICAL_RISKS.md` | Consumer | — |

---

## Full Ownership Table (All Documents)

| Document | Primary Owner | Review Required |
|----------|--------------|----------------|
| `README.md` | Founder | CEO |
| `MASTER_CONTEXT.md` | Founder | CEO, advisors |
| `PROJECT_VISION.md` | Founder | CEO, advisors |
| `ROADMAP.md` | Founder | CEO, advisors |
| `TASKS.md` | Founder | Operations |
| `DECISION_LOG.md` | Founder | Advisors |
| `ASSUMPTIONS.md` | Founder (Research) | Research advisors |
| `RISKS.md` | Founder | Legal, Finance |
| `PROJECT_RULES.md` | Founder | CTO |
| `CONTRIBUTING.md` | Founder | CTO |
| `MIGRATION_PLAN.md` | Founder | CTO |
| `REPOSITORY_AUDIT.md` | Founder | — |
| `REPOSITORY_CLASSIFICATION.md` | Founder | — |
| `REPOSITORY_REFACTOR_PLAN.md` | Founder | — |
| `SPRINT_1_REPORT.md` | Founder | — |
| `docs/MANIFEST.md` | Founder | — |
| `docs/DOCUMENT_MAP.md` | Founder | — |
| `docs/DEPENDENCY_GRAPH.md` | Founder | — |
| `docs/OWNERSHIP_MATRIX.md` | Founder | — |
| `docs/SINGLE_SOURCE_OF_TRUTH.md` | Founder | — |
| `docs/phase--1/INDEX.md` | Founder | — |
| `docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md` | Founder | Advisors |
| `docs/phase--1/reports/02_PRE_MORTEM.md` | Founder | — |
| `docs/phase--1/reports/03_STARTUP_KILL_REPORT.md` | Founder | — |
| `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` | Founder (Research) | — |
| `docs/phase--1/reports/05_MARKET_HYPOTHESES.md` | Founder (Research) | — |
| `docs/phase--1/reports/13_FOUNDER_MISTAKES.md` | Founder | — |
| `docs/phase--1/reports/14_FAILURE_SCENARIOS.md` | Founder | — |
| `docs/phase--1/reports/15_SUCCESS_FACTORS.md` | Founder | Advisors |
| `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md` | Founder | Advisors |
| `docs/phase--1/reports/17_UNKNOWNS.md` | Founder (Research) | — |
| `docs/phase--1/reports/18_KEY_DECISIONS.md` | Founder | Advisors |
| `docs/phase--1/reports/19_EXECUTION_ORDER.md` | Founder | — |
| `docs/phase--1/reports/20_NEXT_PHASE.md` | Founder | Advisors |
| `docs/phase--1/risks/06_RISK_REGISTER.md` | Founder | — |
| `docs/phase--1/risks/07_BUSINESS_RISKS.md` | Founder | — |
| `docs/phase--1/risks/08_TECHNICAL_RISKS.md` | Founder / CTO | CTO |
| `docs/phase--1/risks/09_LEGAL_RISKS.md` | Founder / Legal | Legal |
| `docs/phase--1/risks/10_MARKETPLACE_RISKS.md` | Founder | — |
| `docs/phase--1/risks/11_FINANCIAL_RISKS.md` | Founder / Finance | Finance |
| `docs/phase--1/risks/12_COMPETITIVE_RISKS.md` | Founder | — |
| `docs/02_product/MVP_FREEZE.md` | Founder → Product | Founder, CTO |
| `docs/02_product/FEATURE_CATALOG.md` | Founder → Product | CTO |
| `docs/02_product/FEATURE_DEPENDENCY_MAP.md` | Founder → CTO | Product |
| `docs/02_product/FLOWS.md` | Founder → Product | CTO |
| `docs/02_product/ENGINEERING_BACKLOG.md` | Founder → CTO | Product |
| `docs/02_product/LEAN_PRODUCT.md` | Founder → Product | Founder, CTO |
| `docs/02_product/BUSINESS_RULES.md` | Founder → Product | CTO, Legal |
| `docs/02_product/USER_STORIES.md` | Founder → Product | Engineering |
| `docs/02_product/PRODUCT_NORMALIZATION_REPORT.md` | Founder → CTO | Product |
| `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` | Founder → Product | Design |
| `docs/03_customer_experience/TRUST_FRAMEWORK.md` | Founder → Operations | Product |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | Founder → Product | Engineering |
| `docs/03_customer_experience/DELIGHT_ENGINE.md` | Founder → Design | Product |
| `docs/architecture/adr/ADR-template.md` | Founder → CTO | — |
| `docs/standards/*` (6 files) | Founder → CTO | Engineering |
| `docs/templates/prompt_template.md` | Founder → AI | — |
| `research/*` (5 templates) | Founder (Research) | — |
| `business/*` (4 templates) | Founder | Finance, Product |
| `ai_agents/ai_agent_documentation.md` | Founder → AI | CTO |
| `tools/README_extract_docs.md` | Founder → CTO | — |
| `.github/ISSUE_TEMPLATE/*.md` | Founder → Engineering | CTO |
| `.github/PULL_REQUEST_TEMPLATE/*.md` | Founder → Engineering | CTO |
| `.github/labels/labels.md` | Founder → Engineering | CTO |
| `.github/workflows/*.yml` | Founder → CTO | — |
| `archive/*` | Founder (read-only) | — |

---

## Ownership Transfer Plan

As roles are hired, ownership transfers as follows:

| Document Group | Current Owner | Transfer To | Trigger |
|---------------|--------------|-------------|---------|
| All engineering documents | Founder | CTO | Phase 1 CTO hire |
| Product documents | Founder | Product Lead | Phase 1 Product hire |
| Financial model | Founder | CFO/Finance | Phase 1 hire |
| Customer experience | Founder | Head of CX | Phase 1 hire |
| AI documentation | Founder | Head of AI | Phase 2+ hire |
| Legal documents | Founder | Legal Counsel | T0.1-L02 completion |
| Research templates | Founder | Head of Research | Phase 1 hire |
| Growth documents | Founder | Head of Growth | Phase 2 hire |

---

**When a new role is hired, update this document to reflect actual ownership. Until roles are filled, the Founder owns everything.**
