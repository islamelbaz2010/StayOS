# Single Source of Truth — StayOS

**Version**: 1.0.0
**Sprint**: 2 — Repository Intelligence Layer
**Generated**: 2026-07-13
**Maintainer**: Islam Elbaz (Founder)
**Status**: Active

This document declares, for every major topic in the StayOS repository, exactly one canonical document. All other documents that touch that topic must **reference** the canonical document rather than duplicate its content.

**Rule**: If you need to say something about a topic, go to the canonical document for that topic. Do not copy content from canonical documents into other documents. Link instead.

---

## Topic Index

| Topic | Canonical Document |
|-------|-------------------|
| [What StayOS is](#what-stayos-is) | `MASTER_CONTEXT.md` |
| [Mission and Vision](#mission-and-vision) | `PROJECT_VISION.md` |
| [Phase Status and Gates](#phase-status-and-gates) | `ROADMAP.md` |
| [Active Tasks](#active-tasks) | `TASKS.md` |
| [Strategic Decisions](#strategic-decisions) | `DECISION_LOG.md` |
| [Current Risk Register](#current-risk-register) | `RISKS.md` |
| [Phase 0 Gate Conditions](#phase-0-gate-conditions) | `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md` |
| [Active Assumptions](#active-assumptions) | `ASSUMPTIONS.md` |
| [All Assumptions (Full Set)](#all-assumptions-full-set) | `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` |
| [Market Hypotheses](#market-hypotheses) | `docs/phase--1/reports/05_MARKET_HYPOTHESES.md` |
| [Historical Risk Corpus](#historical-risk-corpus) | `docs/phase--1/risks/06_RISK_REGISTER.md` |
| [Phase 1 MVP Scope](#phase-1-mvp-scope) | `docs/02_product/MVP_FREEZE.md` |
| [Feature Definitions](#feature-definitions) | `docs/02_product/FEATURE_CATALOG.md` |
| [Feature Build Order](#feature-build-order) | `docs/02_product/FEATURE_DEPENDENCY_MAP.md` |
| [User Stories](#user-stories) | `docs/02_product/USER_STORIES.md` |
| [Core User Flows](#core-user-flows) | `docs/02_product/FLOWS.md` |
| [Business Rules](#business-rules) | `docs/02_product/BUSINESS_RULES.md` |
| [Engineering Tasks (Phase 1)](#engineering-tasks-phase-1) | `docs/02_product/ENGINEERING_BACKLOG.md` |
| [Actor Journey Maps](#actor-journey-maps) | `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md` |
| [Trust Architecture](#trust-architecture) | `docs/03_customer_experience/TRUST_FRAMEWORK.md` |
| [Experience Performance Thresholds](#experience-performance-thresholds) | `docs/03_customer_experience/EXPERIENCE_RULES.md` |
| [Revenue Model](#revenue-model) | `DECISION_LOG.md` (DEC-010) |
| [Payment Infrastructure](#payment-infrastructure) | `DECISION_LOG.md` (DEC-004) |
| [Supply Strategy](#supply-strategy) | `DECISION_LOG.md` (DEC-005) |
| [AI Feature Roadmap](#ai-feature-roadmap) | `DECISION_LOG.md` (DEC-008) |
| [Arabic-First UX Commitment](#arabic-first-ux-commitment) | `DECISION_LOG.md` (DEC-003) |
| [Market Entry Geography](#market-entry-geography) | `DECISION_LOG.md` (DEC-002) |
| [Repository Document Inventory](#repository-document-inventory) | `docs/MANIFEST.md` |
| [Documents by Domain](#documents-by-domain) | `docs/DOCUMENT_MAP.md` |
| [Document Relationships](#document-relationships) | `docs/DEPENDENCY_GRAPH.md` |
| [Document Ownership](#document-ownership) | `docs/OWNERSHIP_MATRIX.md` |
| [Repository Standards](#repository-standards) | `docs/standards/repository_standards.md` |
| [Commit Message Format](#commit-message-format) | `docs/standards/commit_conventions.md` |
| [Contribution Process](#contribution-process) | `CONTRIBUTING.md` |
| [Phase -1 Panel Verdict](#phase--1-panel-verdict) | `docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md` |
| [Failure Analysis](#failure-analysis) | `docs/phase--1/reports/02_PRE_MORTEM.md` |
| [Execution Order (Phase 0)](#execution-order-phase-0) | `docs/phase--1/reports/19_EXECUTION_ORDER.md` |

---

## Entries

### What StayOS Is

**Canonical**: [`MASTER_CONTEXT.md`](../MASTER_CONTEXT.md)

StayOS is defined once, here. This document answers: what we are building, for whom, against whom, in what market, and where we are today.

**Prohibited duplications**: Do not define StayOS in `README.md`, `PROJECT_VISION.md`, `DECISION_LOG.md`, or any other document. Those documents must reference `MASTER_CONTEXT.md` for the definition.

**References to this canonical**:
- `README.md` — surface summary only; deep definition lives in `MASTER_CONTEXT.md`
- `PROJECT_VISION.md` — expands the vision; does not redefine the company
- `DECISION_LOG.md` — DEC-001 references `MASTER_CONTEXT.md` for the accommodation marketplace definition
- All product documents — "StayOS is" language must trace to this document

---

### Mission and Vision

**Canonical**: [`PROJECT_VISION.md`](../PROJECT_VISION.md)

The one-sentence thesis, mission statement, core values, and strategic pillars live here.

**References to this canonical**:
- `README.md` — quotes the one-sentence thesis; full vision is in `PROJECT_VISION.md`
- `MASTER_CONTEXT.md` — the solution section references the strategic pillars
- Investor materials — must cite `PROJECT_VISION.md` as the authoritative vision statement

---

### Phase Status and Gates

**Canonical**: [`ROADMAP.md`](../ROADMAP.md)

Which phase is active, which is locked, and what must be true to advance. The phase status table in `ROADMAP.md` is the only authoritative source.

**Prohibited duplications**: Do not maintain phase status in `README.md` badges, `MASTER_CONTEXT.md`, or `TASKS.md` independently. Update `ROADMAP.md`; all other documents reference it.

**Exception**: `README.md` badges may show a snapshot of phase status but are not the authority — if they conflict with `ROADMAP.md`, `ROADMAP.md` wins.

---

### Active Tasks

**Canonical**: [`TASKS.md`](../TASKS.md)

All Phase 0 tasks, their acceptance criteria, owners, and gate mappings. The single place where work is tracked.

**References to this canonical**:
- `ROADMAP.md` — points to `TASKS.md` for the full task list
- `docs/phase--1/reports/19_EXECUTION_ORDER.md` — provides the ordering rationale; `TASKS.md` is where tasks live

---

### Strategic Decisions

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md)

Every significant strategic, product, legal, and operational decision. If it was decided, it is here with context and rationale.

**Prohibited duplications**: Do not record decisions in `MASTER_CONTEXT.md`, `ROADMAP.md`, or product documents. Those documents implement or reference decisions; the decision itself lives in `DECISION_LOG.md`.

**References to this canonical**:
- `ROADMAP.md` — references DEC-007 for manual operations rationale
- `ASSUMPTIONS.md` — references DEC-008 for AI roadmap
- Product documents — reference specific DEC entries for scope decisions

---

### Current Risk Register

**Canonical**: [`RISKS.md`](../RISKS.md)

The 15 active risks with mitigation strategies, owners, and review dates. Updated throughout Phase 0 and Phase 1.

**Not canonical** (but source): `docs/phase--1/risks/06_RISK_REGISTER.md` — historical risk corpus (600+ risks from Phase -1 panel). Do not add new risks here; add them to `RISKS.md`.

**References to this canonical**:
- `ASSUMPTIONS.md` — cross-references `RISKS.md` when an invalidated assumption escalates a risk
- `ROADMAP.md` — points to `RISKS.md` for the active risk picture

---

### Phase 0 Gate Conditions

**Canonical**: [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](phase--1/reports/16_REQUIRED_VALIDATIONS.md)

The exact conditions (with kill thresholds) that must be met before Phase 0 can exit and Phase 1 can begin. This document is the official gate authority.

**References to this canonical**:
- `ROADMAP.md` — "Phase 0 gate" rows point here
- `TASKS.md` — each task's "Gate" field references a condition from this document
- `ASSUMPTIONS.md` — kill thresholds match those defined here

---

### Active Assumptions

**Canonical**: [`ASSUMPTIONS.md`](../ASSUMPTIONS.md)

The 13 highest-priority assumptions being tested in Phase 0. Maintained actively as interviews and pilot data arrive.

**Not canonical** (but source): `docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md` — the full 100-assumption set from Phase -1. Read-only.

---

### All Assumptions (Full Set)

**Canonical**: [`docs/phase--1/reports/04_ASSUMPTION_ANALYSIS.md`](phase--1/reports/04_ASSUMPTION_ANALYSIS.md)

100 assumptions with danger ratings (1–5) and validation methods. The complete source used to populate `ASSUMPTIONS.md`.

---

### Market Hypotheses

**Canonical**: [`docs/phase--1/reports/05_MARKET_HYPOTHESES.md`](phase--1/reports/05_MARKET_HYPOTHESES.md)

20 testable market hypotheses with designed experiments. The source for traveler and host interview script design (Tasks T0.3-I01, T0.4-I01).

---

### Historical Risk Corpus

**Canonical**: [`docs/phase--1/risks/06_RISK_REGISTER.md`](phase--1/risks/06_RISK_REGISTER.md)

Master index to 600+ risks across 6 categories from the Phase -1 founder discovery panel. Read-only historical record.

**Note**: New risks identified in Phase 0 and beyond go into `RISKS.md`, not here.

---

### Phase 1 MVP Scope

**Canonical**: [`docs/02_product/MVP_FREEZE.md`](02_product/MVP_FREEZE.md)

What is in scope (AuthGate, Spatial Search, Reservation Engine, PMS Core, OpsManager, Treasury Ledger) and what is explicitly excluded (channel manager, dynamic pricing AI, automated CRM, advanced treasury).

**References to this canonical**:
- `docs/02_product/LEAN_PRODUCT.md` — explains the capital rationale behind the freeze; scope decisions defer to `MVP_FREEZE.md`
- `ASSUMPTIONS.md` — PA-003 references `MVP_FREEZE.md` for scope definition
- `TASKS.md` — Phase 1 preview section references `docs/02_product/ENGINEERING_BACKLOG.md` which references `MVP_FREEZE.md`

---

### Feature Definitions

**Canonical**: [`docs/02_product/FEATURE_CATALOG.md`](02_product/FEATURE_CATALOG.md)

The definition, description, and identity of every platform feature (FC-01 through FC-07). If a feature exists, it is defined here.

**References to this canonical**:
- `docs/02_product/ENGINEERING_BACKLOG.md` — tasks reference FC identifiers from this catalog
- `docs/02_product/FEATURE_DEPENDENCY_MAP.md` — dependency graph uses FC identifiers from this catalog
- `docs/02_product/FLOWS.md` — flows reference features by FC identifier

---

### Feature Build Order

**Canonical**: [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](02_product/FEATURE_DEPENDENCY_MAP.md)

The build sequence: FC-01 (AuthGate) → FC-02 (Search) + FC-04 (PMS) → FC-03 (Reservation) → FC-05 (Ops) + FC-06 (Treasury). FC-07 (Support) depends on FC-03.

---

### User Stories

**Canonical**: [`docs/02_product/USER_STORIES.md`](02_product/USER_STORIES.md)

All user stories (US-G01–05, US-H01–04, US-F01–04, US-FI01–02, US-S01+) by persona. The source of acceptance criteria for engineering tasks.

---

### Core User Flows

**Canonical**: [`docs/02_product/FLOWS.md`](02_product/FLOWS.md)

The two primary flows: (1) Search → Auth → KYC → Reservation → Payment → Confirmation; (2) Checkout → Turnover ticket → Field ops → Verification → Completion.

---

### Business Rules

**Canonical**: [`docs/02_product/BUSINESS_RULES.md`](02_product/BUSINESS_RULES.md)

All non-negotiable platform rules: KYC (BR-ID-01, BR-ID-02), inventory (BR-INV-01, BR-INV-02), operations (BR-OPS-01 through BR-OPS-03), financial (BR-FIN-01 through BR-FIN-03), support (BR-SUP-01).

**References to this canonical**:
- `docs/02_product/FLOWS.md` — flows implement these rules
- `docs/03_customer_experience/TRUST_FRAMEWORK.md` — trust architecture references financial and identity rules
- `docs/02_product/ENGINEERING_BACKLOG.md` — engineering tasks enforce these rules

---

### Engineering Tasks (Phase 1)

**Canonical**: [`docs/02_product/ENGINEERING_BACKLOG.md`](02_product/ENGINEERING_BACKLOG.md)

All Phase 1 engineering epics, features, tasks, and subtasks. The source of truth for engineering execution.

---

### Actor Journey Maps

**Canonical**: [`docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md`](03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md)

Actor profiles (Guest, Host, PM, Cleaner, Support, Admin) and the unified journey stage map (Discovery → Return) with emotional states, touchpoints, and delight opportunities.

---

### Trust Architecture

**Canonical**: [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](03_customer_experience/TRUST_FRAMEWORK.md)

The five-layer trust system: Identity (Zero-Ghost Protocol), Financial (Vault Escrow), Physical Safety, Integrity/Reviews, Dispute Resolution.

**References to this canonical**:
- `DECISION_LOG.md` DEC-006 — references the trust commitment
- `RISKS.md` TR-001 — references trust infrastructure complexity
- `docs/02_product/BUSINESS_RULES.md` — BR-ID and BR-FIN rules implement this framework

---

### Experience Performance Thresholds

**Canonical**: [`docs/03_customer_experience/EXPERIENCE_RULES.md`](03_customer_experience/EXPERIENCE_RULES.md)

The performance commitments: booking ≤ 3 clicks, search ≤ 2s, WhatsApp response ≤ 30s, refund ≤ 24h, dispute resolution ≤ 15 min.

---

### Revenue Model

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md) — **DEC-010**

Hybrid model: 8–12% host commission + 3–5% guest service fee + B2B SaaS ($50–$200/month). Commission launch: 0% for first 50 hosts, 6% at Month 6, 10% at Month 12.

**Status**: DEC-010 is PROPOSED pending host interview validation (T0.4-I02). Canonical document will be updated to ACCEPTED once host interviews validate commission tolerance.

---

### Payment Infrastructure

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md) — **DEC-004**

Paymob as primary payment integration partner. All Egyptian payment rails (Fawry, Vodafone Cash, InstaPay, Meeza, bank transfer) as P0 requirements.

**References to this canonical**:
- `ASSUMPTIONS.md` — PA-002, EA-002 reference the Paymob dependency
- `RISKS.md` — BR-003 references payment infrastructure partnership risk
- `TASKS.md` — T0.1-P01 references DEC-004

---

### Supply Strategy

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md) — **DEC-005**

B2B2C supply acquisition: hotels and property managers first (50–200 listings per relationship), individual hosts second. Target 500 listings in Phase 1.

---

### AI Feature Roadmap

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md) — **DEC-008**

Data-gated AI sequence: Phase 0 = zero AI; Phase 1 = rule-based pricing only; Phase 2 = ML pricing (50K+ transactions); Phase 3+ = demand forecasting, personalization, fraud detection (500K+ transactions).

---

### Arabic-First UX Commitment

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md) — **DEC-003**

RTL as primary layout, Arabic as primary language, culturally appropriate filters (halal, family-only) built from the start, Arabic customer support as first language.

---

### Market Entry Geography

**Canonical**: [`DECISION_LOG.md`](../DECISION_LOG.md) — **DEC-002**

Egypt as proof-of-concept market. Egypt–GCC travel corridor as primary business. GCC expansion Phase 3. Egypt alone is not a venture-scale outcome.

---

### Repository Document Inventory

**Canonical**: [`docs/MANIFEST.md`](MANIFEST.md)

Every document in the repository with path, domain, phase, status, purpose, owner, dependencies, and consumers.

---

### Documents by Domain

**Canonical**: [`docs/DOCUMENT_MAP.md`](DOCUMENT_MAP.md)

Every document grouped by business domain (Business, Research, Product, Architecture, Marketplace, AI, Operations, Finance, Legal, Security, Customer Experience, Engineering, Governance, Tooling).

---

### Document Relationships

**Canonical**: [`docs/DEPENDENCY_GRAPH.md`](DEPENDENCY_GRAPH.md)

All cross-document dependencies, circular dependencies, orphan documents, and duplicated responsibilities.

---

### Document Ownership

**Canonical**: [`docs/OWNERSHIP_MATRIX.md`](OWNERSHIP_MATRIX.md)

Which role owns every document, who must review changes, and the ownership transfer plan as roles are hired.

---

### Repository Standards

**Canonical**: [`docs/standards/repository_standards.md`](standards/repository_standards.md)

Branch naming, PR requirements, review rules, and release tagging.

---

### Commit Message Format

**Canonical**: [`docs/standards/commit_conventions.md`](standards/commit_conventions.md)

Commit type prefixes, scope conventions, and message structure.

---

### Contribution Process

**Canonical**: [`CONTRIBUTING.md`](../CONTRIBUTING.md)

How to submit issues, PRs, and documentation changes. References `PROJECT_RULES.md` for quality standards.

---

### Phase -1 Panel Verdict

**Canonical**: [`docs/phase--1/reports/01_EXECUTIVE_SUMMARY.md`](phase--1/reports/01_EXECUTIVE_SUMMARY.md)

Panel verdict: conditional go. 14 critical flaws identified. The entry point for the Phase -1 corpus.

---

### Failure Analysis

**Canonical**: [`docs/phase--1/reports/02_PRE_MORTEM.md`](phase--1/reports/02_PRE_MORTEM.md)

The primary failure narrative. For the catalogued failure reasons, see `03_STARTUP_KILL_REPORT.md`; for the failure scenarios, see `14_FAILURE_SCENARIOS.md`.

---

### Execution Order (Phase 0)

**Canonical**: [`docs/phase--1/reports/19_EXECUTION_ORDER.md`](phase--1/reports/19_EXECUTION_ORDER.md)

Week-by-week action plan for Phase 0. The ordering rationale behind `TASKS.md`.

---

## Anti-Patterns to Avoid

The following are violations of the single source of truth principle. Do not do these.

| Anti-Pattern | Why It Fails | Correct Action |
|-------------|-------------|----------------|
| Copying the StayOS definition from `MASTER_CONTEXT.md` into `README.md` | Two definitions diverge over time; one becomes stale | Link to `MASTER_CONTEXT.md`; `README.md` has a surface summary only |
| Adding a risk to `docs/phase--1/risks/06_RISK_REGISTER.md` | That document is read-only historical output | Add new risks to `RISKS.md` |
| Recording a decision in `ROADMAP.md` | `ROADMAP.md` implements decisions; it does not record them | Record in `DECISION_LOG.md`; reference the DEC entry from `ROADMAP.md` |
| Defining a feature in `ENGINEERING_BACKLOG.md` | Feature identity lives in `FEATURE_CATALOG.md` | Define in `FEATURE_CATALOG.md`; reference the FC identifier in `ENGINEERING_BACKLOG.md` |
| Writing MVP scope in `LEAN_PRODUCT.md` | Scope lives in `MVP_FREEZE.md` | State the rationale in `LEAN_PRODUCT.md`; scope decisions in `MVP_FREEZE.md` |
| Updating phase status in `README.md` badges without updating `ROADMAP.md` | `README.md` badges are cosmetic; `ROADMAP.md` is the authority | Update `ROADMAP.md` first; update `README.md` badge to match |
| Duplicating business rules in both `BUSINESS_RULES.md` and `TRUST_FRAMEWORK.md` | Two documents with different rule sets diverge | Rules in `BUSINESS_RULES.md`; `TRUST_FRAMEWORK.md` references them |

---

**This document is the canonical reference for canonicity. When in doubt about where information belongs, check here first.**
