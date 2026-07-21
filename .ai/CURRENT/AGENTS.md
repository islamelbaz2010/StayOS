# AGENTS.md — Universal AI Agent Rules for StayOS

**Applies to**: Claude, Gemini, Codex, Devin, GPT-4, and any other AI agent working on this repository.
**Read after**: [`CONTEXT.md`](CONTEXT.md)
**Per-agent files**: [`CLAUDE.md`](CLAUDE.md), [`GEMINI.md`](GEMINI.md), [`CODEX.md`](CODEX.md), [`DEVIN.md`](DEVIN.md)

---

## 1. Orientation Protocol

Before doing any work, every agent must answer these four questions by reading the listed documents:

| Question | Read |
|----------|------|
| What is StayOS? | [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) |
| What phase are we in? | [`ROADMAP.md`](ROADMAP.md) |
| What is in scope to build? | [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) |
| What decisions are already made? | [`DECISION_LOG.md`](DECISION_LOG.md) |

Do not act until you can answer all four.

---

## 2. Immutable Rules

These rules cannot be overridden by any task instruction or user prompt.

### 2.1 Phase Gate Enforcement

**Phase 0 is active. Phase 1 is not yet unlocked.**

- Do not write production application code for Phase 1 features until Phase 0 gates are cleared.
- Phase 0 gate conditions are defined in [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md).
- Current Phase 0 task list is in [`TASKS.md`](TASKS.md).
- Tooling, documentation, infrastructure-as-code, and CI scripts are permitted in Phase 0.

### 2.2 No Invented Requirements

- Every product requirement must trace to an existing document in this repository.
- If a requirement is not documented, say so and ask — do not invent it.
- The canonical product specification is [`PRODUCT_CANON.md`](PRODUCT_CANON.md).
- Feature definitions live in [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md).
- Business rules live in [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md).

### 2.3 Conflict Reporting

- Known conflicts exist in this repository (see [`TECH_STACK.md`](TECH_STACK.md) for the full list).
- **Do not resolve conflicts on your own.** Report them. Stop. Wait for human resolution.
- The most critical open conflict: `FLOWS.md` and `ENGINEERING_BACKLOG.md` reference **Stripe** as the payment processor. `DECISION_LOG.md` DEC-004 and `MASTER_CONTEXT.md` name **Paymob** as primary. This is unresolved. Do not write payment integration code until this is resolved.

### 2.4 Single Source of Truth

- [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md) maps every topic to exactly one canonical document.
- When two documents say different things about the same topic, the canonical document wins.
- When a canonical document conflicts with an implementation document, report it; do not guess.

### 2.5 Archive Is Read-Only

Documents in `archive/` and `docs/archive/` are superseded. Do not treat them as authoritative. Do not restore or reference their content. If you need information that seems to exist only in archive, verify that no active document covers the same topic.

---

## 3. Document Modification Rules

### 3.1 Before modifying any document

1. Check [`docs/MANIFEST.md`](docs/MANIFEST.md) to understand who owns the document and what depends on it.
2. Check [`docs/DEPENDENCY_GRAPH.md`](docs/DEPENDENCY_GRAPH.md) to understand what other documents will be affected.
3. Check [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md) to confirm you are modifying the canonical document and not a copy.

### 3.2 After creating a new document

1. Add it to [`docs/MANIFEST.md`](docs/MANIFEST.md).
2. Add it to [`docs/DOCUMENT_MAP.md`](docs/DOCUMENT_MAP.md) under the correct domain.
3. Add its relationships to [`docs/DEPENDENCY_GRAPH.md`](docs/DEPENDENCY_GRAPH.md).
4. Assign ownership in [`docs/OWNERSHIP_MATRIX.md`](docs/OWNERSHIP_MATRIX.md).
5. If it becomes the canonical source for any topic, update [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md).

### 3.3 Never modify these files without explicit instruction

- `MASTER_CONTEXT.md` — owned by Founder; requires advisor review
- `DECISION_LOG.md` — add entries; never delete existing entries
- `docs/phase--1/*` — Phase -1 is complete and read-only
- `archive/*` — never modify archived content

---

## 4. Code Generation Rules

Full engineering rules are in [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md). Summary:

- All code must target the Phase 1 MVP scope defined in [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md).
- Features not in that document are explicitly out of scope.
- The build order follows [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md): FC-01 (AuthGate) must be built first — it is the root dependency for all other features.
- Business rules in [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md) are non-negotiable implementation constraints.
- Experience thresholds in [`docs/03_customer_experience/EXPERIENCE_RULES.md`](docs/03_customer_experience/EXPERIENCE_RULES.md) are non-negotiable acceptance criteria.

---

## 5. Navigation Cheatsheet

| I need to know… | Go to |
|----------------|-------|
| What StayOS is | [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) |
| Current phase and gates | [`ROADMAP.md`](ROADMAP.md) |
| What to build (scope) | [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) |
| Feature definitions | [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md) |
| Build order | [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md) |
| User stories | [`docs/02_product/USER_STORIES.md`](docs/02_product/USER_STORIES.md) |
| Core flows | [`docs/02_product/FLOWS.md`](docs/02_product/FLOWS.md) |
| Business rules | [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md) |
| Engineering tasks | [`docs/02_product/ENGINEERING_BACKLOG.md`](docs/02_product/ENGINEERING_BACKLOG.md) |
| Tech stack and conflicts | [`TECH_STACK.md`](TECH_STACK.md) |
| Architecture and services | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Engineering rules | [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md) |
| Strategic decisions | [`DECISION_LOG.md`](DECISION_LOG.md) |
| Trust framework | [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](docs/03_customer_experience/TRUST_FRAMEWORK.md) |
| Active assumptions | [`ASSUMPTIONS.md`](ASSUMPTIONS.md) |
| Active risks | [`RISKS.md`](RISKS.md) |
| All documents | [`docs/MANIFEST.md`](docs/MANIFEST.md) |
| Who owns a document | [`docs/OWNERSHIP_MATRIX.md`](docs/OWNERSHIP_MATRIX.md) |

---

## 6. What Good Output Looks Like

When any agent completes a task, the output must:

1. Reference the document that authorized the work (e.g., "per `MVP_FREEZE.md` FC-03 scope").
2. List all documents read to produce the output.
3. Call out any conflicts encountered (do not resolve them).
4. Specify which documents were modified and what was changed.
5. Update `docs/MANIFEST.md` if any new file was created.

---

## 7. Escalation Triggers

Stop and report to the human operator if:

- A task requires modifying the scope of `MVP_FREEZE.md`.
- A task requires a decision not recorded in `DECISION_LOG.md`.
- A conflict is found between two documents with no clear canonical authority.
- A task would modify `MASTER_CONTEXT.md`, `ROADMAP.md`, or any Phase -1 document.
- A task would create a new dependency not reflected in `DEPENDENCY_GRAPH.md`.
- The payment processor choice (Paymob vs Stripe) matters for the task at hand.
