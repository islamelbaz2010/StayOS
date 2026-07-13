# Dependency Graph — StayOS

**Version**: 1.0.0
**Sprint**: 2 — Repository Intelligence Layer
**Generated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

This document maps all cross-document relationships in the repository, identifies circular dependencies, orphan documents, and cases of duplicated responsibility.

---

## Reading This Document

A **dependency** means: Document A cannot be written, maintained, or correctly understood without Document B.

A **consumer** relationship means: Document A draws from, references, or is downstream of Document B.

**Notation**:
- `A → B` means A depends on B (A needs B to exist first)
- `A ← B` means A is consumed by B (B references A)
- `A ↔ B` means mutual dependency (circular — see flagged cases below)

---

## Primary Dependency Tree

The repository has one root: `MASTER_CONTEXT.md`. All strategic documents flow from it.

```
MASTER_CONTEXT.md (root — no dependencies)
│
├── PROJECT_VISION.md
│   └── ROADMAP.md
│       ├── TASKS.md
│       │   ├── docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md
│       │   └── docs/phase--1/reports/19_EXECUTION_ORDER.md
│       └── docs/phase--1/reports/20_NEXT_PHASE.md
│
├── DECISION_LOG.md
│   ├── ASSUMPTIONS.md
│   │   └── docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md
│   └── docs/phase--1/reports/18_KEY_DECISIONS.md
│
├── RISKS.md
│   ├── ASSUMPTIONS.md
│   └── docs/phase--1/risks/06_RISK_REGISTER.md
│       ├── docs/phase--1/risks/07_BUSINESS_RISKS.md
│       ├── docs/phase--1/risks/08_TECHNICAL_RISKS.md
│       ├── docs/phase--1/risks/09_LEGAL_RISKS.md
│       ├── docs/phase--1/risks/10_MARKETPLACE_RISKS.md
│       ├── docs/phase--1/risks/11_FINANCIAL_RISKS.md
│       └── docs/phase--1/risks/12_COMPETITIVE_RISKS.md
│
└── README.md
    (surface-level summary of above)
```

---

## Product Document Tree

```
docs/02_product/FEATURE_CATALOG.md (product root)
│
├── docs/02_product/MVP_FREEZE.md
│   └── docs/02_product/LEAN_PRODUCT.md
│
├── docs/02_product/USER_STORIES.md
│   └── docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md
│
├── docs/02_product/FEATURE_DEPENDENCY_MAP.md
│
├── docs/02_product/FLOWS.md
│   └── docs/02_product/BUSINESS_RULES.md
│
├── docs/02_product/ENGINEERING_BACKLOG.md
│   (depends on: MVP_FREEZE, FEATURE_CATALOG, FEATURE_DEPENDENCY_MAP, USER_STORIES)
│
└── docs/02_product/PRODUCT_NORMALIZATION_REPORT.md
    (depends on: FEATURE_CATALOG, FLOWS, BUSINESS_RULES)
```

---

## Customer Experience Tree

```
docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md
│
├── docs/03_customer_experience/EXPERIENCE_RULES.md
│   (non-negotiable thresholds — sets engineering requirements)
│
├── docs/03_customer_experience/TRUST_FRAMEWORK.md
│   (depends on: BUSINESS_RULES, DECISION_LOG DEC-006)
│
└── docs/03_customer_experience/DELIGHT_ENGINE.md
    (aspirational — no hard dependencies)
```

---

## Cross-Domain Dependency Matrix

| Document | Depends On | Consumed By |
|----------|-----------|-------------|
| `MASTER_CONTEXT.md` | — | All documents; all stakeholders |
| `PROJECT_VISION.md` | `MASTER_CONTEXT.md` | `ROADMAP.md`, `DECISION_LOG.md`, product docs |
| `ROADMAP.md` | `PROJECT_VISION.md`, `16_REQUIRED_VALIDATIONS.md` | `TASKS.md`, `DECISION_LOG.md` |
| `TASKS.md` | `ROADMAP.md`, `16_REQUIRED_VALIDATIONS.md`, `19_EXECUTION_ORDER.md` | `DECISION_LOG.md` (triggers), working sessions |
| `DECISION_LOG.md` | `MASTER_CONTEXT.md`, `ASSUMPTIONS.md`, `18_KEY_DECISIONS.md` | `ROADMAP.md`, `RISKS.md`, `ASSUMPTIONS.md` |
| `ASSUMPTIONS.md` | `04_ASSUMPTION_ANALYSIS.md`, `TASKS.md` | `DECISION_LOG.md`, `RISKS.md`, `ROADMAP.md` |
| `RISKS.md` | `ASSUMPTIONS.md`, `DECISION_LOG.md`, `06_RISK_REGISTER.md` | `ROADMAP.md`, advisors |
| `docs/02_product/MVP_FREEZE.md` | `FEATURE_CATALOG.md`, `ROADMAP.md` | `ENGINEERING_BACKLOG.md`, `ASSUMPTIONS.md` |
| `docs/02_product/FEATURE_CATALOG.md` | `MVP_FREEZE.md`, `USER_STORIES.md` | `ENGINEERING_BACKLOG.md`, `FEATURE_DEPENDENCY_MAP.md` |
| `docs/02_product/ENGINEERING_BACKLOG.md` | `MVP_FREEZE.md`, `FEATURE_CATALOG.md`, `FEATURE_DEPENDENCY_MAP.md`, `USER_STORIES.md` | Engineering team, sprint planning |
| `docs/03_customer_experience/TRUST_FRAMEWORK.md` | `BUSINESS_RULES.md`, `DECISION_LOG.md` | `ENGINEERING_BACKLOG.md`, `EXPERIENCE_RULES.md` |
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | `CUSTOMER_JOURNEY_BIBLE.md`, `TRUST_FRAMEWORK.md` | `ENGINEERING_BACKLOG.md`, QA |
| `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md` | Phase -1 panel analysis | `ROADMAP.md`, `TASKS.md` |
| `docs/phase--1/reports/18_KEY_DECISIONS.md` | Phase -1 analysis | `DECISION_LOG.md` |
| `docs/phase--1/risks/06_RISK_REGISTER.md` | `07` through `12` risk documents | `RISKS.md` |

---

## Circular Dependencies

Three circular reference pairs exist. None are fatal, but each requires a convention to break the loop.

---

### Circular 1: DECISION_LOG ↔ ASSUMPTIONS

```
DECISION_LOG.md → depends on → ASSUMPTIONS.md
ASSUMPTIONS.md  → says "update DECISION_LOG when an assumption is invalidated"
```

**Why it exists**: Assumptions and decisions are tightly coupled in Phase 0. An invalidated assumption triggers a decision change; a new decision may reframe an assumption.

**How to manage**:
- `ASSUMPTIONS.md` is the **primary** document during Phase 0 data collection.
- `DECISION_LOG.md` is the **primary** document once a decision is made.
- Rule: Update `ASSUMPTIONS.md` first with new evidence. If evidence triggers a decision change, update `DECISION_LOG.md` second.
- Never update `DECISION_LOG.md` without a corresponding `ASSUMPTIONS.md` entry (or a completed task in `TASKS.md`) that justifies it.

---

### Circular 2: RISKS.md ↔ ASSUMPTIONS.md

```
RISKS.md       → references → ASSUMPTIONS.md (kill thresholds inform risk mitigation)
ASSUMPTIONS.md → references → RISKS.md ("see also RISKS.md for risk register")
```

**Why it exists**: Assumptions and risks overlap structurally — an assumption is a belief; if it is wrong, it becomes a realized risk.

**How to manage**:
- `ASSUMPTIONS.md` tracks beliefs being tested (pre-validation).
- `RISKS.md` tracks threats that may materialize regardless of validation outcome.
- Rule: When an assumption is invalidated, assess whether it escalates a risk in `RISKS.md`. If so, update `RISKS.md` mitigation strategy.

---

### Circular 3: MVP_FREEZE ↔ FEATURE_CATALOG

```
docs/02_product/MVP_FREEZE.md      → references → docs/02_product/FEATURE_CATALOG.md (features included/excluded)
docs/02_product/FEATURE_CATALOG.md → depends on → docs/02_product/MVP_FREEZE.md (only in-scope features are fully specified)
```

**Why it exists**: Scope and feature definition co-evolved during Phase 1 planning.

**How to manage**:
- `MVP_FREEZE.md` is the **authority on scope** (in/out decisions).
- `FEATURE_CATALOG.md` is the **authority on specification** (what each feature does).
- Rule: Never add a feature to `FEATURE_CATALOG.md` without first confirming it is in scope in `MVP_FREEZE.md`.

---

## Orphan Documents

Orphans have no active consumers — they are not referenced by any other active document and do not feed into any ongoing workflow.

| Document | Reason | Recommendation |
|----------|--------|----------------|
| `docs/03_customer_experience/DELIGHT_ENGINE.md` | No active consumers; Phase 2+ vision only | Add reference from `CUSTOMER_JOURNEY_BIBLE.md` as "Phase 2 extension"; label clearly as aspirational |
| `docs/architecture/adr/ADR-template.md` | No ADRs exist yet | First Phase 1 architectural decision should populate this template |
| `docs/templates/prompt_template.md` | No documents reference it | Add reference from `docs/standards/documentation_guide.md` |
| `ai_agents/ai_agent_documentation.md` | No other document references it | Add reference from `PROJECT_RULES.md` (AI-assisted workflows section) |
| `business/product/product_template.md` | No document uses or references it | Reference from `CONTRIBUTING.md` as "use this template for new product specs" |
| `business/sprint/sprint_template.md` | No sprint process document references it | Reference from `TASKS.md` or a sprint process doc |
| `business/roadmap/roadmap_template.md` | No document references it | Reference from `ROADMAP.md` (template note) |
| `docs/archive/generated/EXTRACTION_REPORT.md` | Generated artifact with no consumers | Archive — no action needed |
| `docs/archive/generated/FILES_CREATED.md` | Generated artifact with no consumers | Archive — no action needed |

---

## Duplicated Responsibility

These document pairs cover the same topic. One must be designated canonical; the other must reference it.

---

### Duplication 1: Risk Register (Active vs. Phase -1)

| Document | Status | Verdict |
|----------|--------|---------|
| `RISKS.md` | Active — 15 current risks (rewritten Sprint 1) | **CANONICAL** — the active risk register |
| `docs/phase--1/risks/06_RISK_REGISTER.md` | Complete — 600+ risks from Phase -1 panel | **SOURCE** — historical; `RISKS.md` draws from it |

**Rule**: `RISKS.md` is the document updated throughout Phase 0 and Phase 1. `06_RISK_REGISTER.md` is read-only historical output. Any new risk identified in Phase 0 goes into `RISKS.md`, not `06_RISK_REGISTER.md`.

---

### Duplication 2: Assumption Tracking (Active vs. Phase -1)

| Document | Status | Verdict |
|----------|--------|---------|
| `ASSUMPTIONS.md` | Active — 13 priority assumptions | **CANONICAL** — the active assumption register |
| `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` | Complete — 100 assumptions source | **SOURCE** — historical; `ASSUMPTIONS.md` draws highest-priority subset from it |

**Rule**: `ASSUMPTIONS.md` is updated as assumptions are tested and resolved. `04_ASSUMPTION_ANALYSIS.md` is read-only.

---

### Duplication 3: MVP Scope (Active vs. Lean Companion)

| Document | Status | Verdict |
|----------|--------|---------|
| `docs/02_product/MVP_FREEZE.md` | Active — defines scope freeze | **CANONICAL** — the scope authority |
| `docs/02_product/LEAN_PRODUCT.md` | Active — defines what is cut and why | **COMPANION** — explains the why behind the freeze |

**Rule**: Scope decisions live in `MVP_FREEZE.md`. Capital rationale lives in `LEAN_PRODUCT.md`. They must not contradict each other.

---

### Duplication 4: Engineering Backlog (Active vs. Legacy Archive)

| Document | Status | Verdict |
|----------|--------|---------|
| `docs/02_product/ENGINEERING_BACKLOG.md` | Active | **CANONICAL** |
| `archive/legacy/phase-3-customer/ENGINEERING_BACKLOG.md` | Archived | **ARCHIVE** — do not reference |

---

### Duplication 5: Experience Rules (Active vs. Legacy Archive)

| Document | Status | Verdict |
|----------|--------|---------|
| `docs/03_customer_experience/EXPERIENCE_RULES.md` | Active | **CANONICAL** |
| `archive/legacy/phase-3-customer/EXPERIENCE_RULES.md` | Archived | **ARCHIVE** — do not reference |

---

### Duplication 6: MVP_FREEZE (Active vs. Legacy Archive)

| Document | Status | Verdict |
|----------|--------|---------|
| `docs/02_product/MVP_FREEZE.md` | Active | **CANONICAL** |
| `archive/legacy/phase-3-customer/MVP_FREEZE.md` | Archived | **ARCHIVE** — do not reference |

---

### Duplication 7: LEAN_PRODUCT (Active vs. Legacy Archive)

| Document | Status | Verdict |
|----------|--------|---------|
| `docs/02_product/LEAN_PRODUCT.md` | Active | **CANONICAL** |
| `archive/legacy/phase-3-customer/LEAN_PRODUCT.md` | Archived | **ARCHIVE** — do not reference |

---

## Dependency Health Summary

| Category | Count | Notes |
|----------|-------|-------|
| Total documents | 85 | All markdown files in repository |
| Documents with clear upstream dependency | 72 | Well-connected |
| Orphan documents (no active consumers) | 9 | See list above |
| Circular dependency pairs | 3 | All managed with documented conventions |
| Duplicated responsibility pairs | 7 | All resolved with canonical/source designations |
| Archive documents (intentionally disconnected) | 13 | `archive/` and `docs/archive/` — expected |

---

## Dependency Maintenance Rules

1. **New document created**: Update `MANIFEST.md` (add entry), `DOCUMENT_MAP.md` (add to domain section), and this file (add to dependency matrix and check for new orphans or circular dependencies).

2. **Document deleted**: Update all three intelligence documents. Check if any other document listed it as a dependency and update those references.

3. **Canonical document changed**: If a canonical document is superseded, update `SINGLE_SOURCE_OF_TRUTH.md` to point to the new canonical, and update this file.

4. **New circular dependency identified**: Document it here in the circular dependencies section with its management convention before it is accepted into the repository.
