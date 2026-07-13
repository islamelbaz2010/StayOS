# AI_RULES.md — Rules for Autonomous AI Operation

**Read [`CONTEXT.md`](CONTEXT.md) and [`AGENTS.md`](AGENTS.md) before this file.**

This file extends `AGENTS.md` with rules specific to AI agents operating autonomously (without a human approving each individual action). It is most relevant to Devin, GPT-Operator, and any agentic workflow that operates in a multi-step loop.

---

## 1. Autonomous Operation Scope

AI agents operating autonomously are permitted to act without human approval only within the following boundaries:

### Permitted Without Human Approval

| Action | Condition |
|--------|-----------|
| Read any file in the repository | Always permitted |
| Create or edit documentation (`.md` files) | Must not modify `MASTER_CONTEXT.md`, `DECISION_LOG.md`, or `docs/phase--1/*` |
| Add new entries to `DECISION_LOG.md` | May add; must never delete or modify existing entries |
| Edit `docs/MANIFEST.md`, `docs/DOCUMENT_MAP.md` | To register new files only |
| Create Python tooling under `tools/` | Must pass ruff + mypy + pytest before commit |
| Edit `.github/workflows/` | Must not remove existing security checks |
| Create test fixtures | No production data, no live service calls |
| Create new documentation in `docs/` | Must update MANIFEST.md afterward |

### Requires Human Approval Before Action

| Action | Why |
|--------|-----|
| Writing any Phase 1 application code | Phase gate rule — Phase 0 is active |
| Modifying `MASTER_CONTEXT.md` | Owned by Founder; requires advisor review |
| Modifying or deleting `DECISION_LOG.md` entries | Decision history is immutable |
| Writing any payment integration code | Payment processor conflict unresolved |
| Scaffolding a frontend or backend framework | Framework choice is unresolved |
| Provisioning cloud infrastructure | Irreversible; requires explicit authorization |
| Creating a database schema for production use | Requires Founder sign-off |
| Pushing to `main` branch | Protected; requires PR review |
| Opening a PR that changes MVP scope | MVP is frozen in `MVP_FREEZE.md` |
| Any action modifying `docs/phase--1/*` | Phase -1 is read-only |

---

## 2. Conflict Handling Protocol

When an autonomous agent encounters a conflict between two documents:

1. **Stop the task** that requires resolving the conflict.
2. **Document the conflict** — record both conflicting sources, the topic, and which task was blocked.
3. **Report to the human operator** — surface the conflict explicitly before proceeding.
4. **Continue other tasks** that do not require resolving the conflict.

Never resolve a conflict unilaterally, even if one document appears more authoritative. The human operator makes conflict resolution decisions.

**The most critical open conflict** (as of this document's creation):
- `DECISION_LOG.md` DEC-004 names **Paymob** as primary payment processor.
- `FLOWS.md`, `ENGINEERING_BACKLOG.md`, `MVP_FREEZE.md` all reference **Stripe**.
- Any task touching payment code triggers this conflict. Stop and report.

---

## 3. The Four Questions Before Every Task

An autonomous agent must answer these four questions before beginning any multi-step task. If a question cannot be answered from the listed documents, stop and report.

| Question | Document |
|----------|---------|
| 1. What phase is this project in? | [`ROADMAP.md`](ROADMAP.md) |
| 2. Is this task in-scope for the current phase? | [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) and [`ROADMAP.md`](ROADMAP.md) |
| 3. Does this task involve a known conflict? | [`TECH_STACK.md`](TECH_STACK.md) §3, [`ARCHITECTURE.md`](ARCHITECTURE.md) §7 |
| 4. Is there an existing decision that covers this task? | [`DECISION_LOG.md`](DECISION_LOG.md) |

---

## 4. Output Verification Checklist

Before committing or submitting output, an autonomous agent must verify:

- [ ] The output references the document that authorized the work.
- [ ] No product requirement was invented — every requirement traces to a repository document.
- [ ] No conflict was silently resolved.
- [ ] No Phase 1 application code was written while Phase 0 is active.
- [ ] No archive document was treated as authoritative.
- [ ] `docs/MANIFEST.md` was updated if any new file was created.
- [ ] `docs/SINGLE_SOURCE_OF_TRUTH.md` was updated if the new file becomes a canonical source.
- [ ] Commit message follows `type(scope): message` format.
- [ ] ruff, mypy, and pytest pass for any Python code.

---

## 5. Document Modification Safety Rules

### Before modifying any existing document

1. Read the document fully.
2. Check [`docs/MANIFEST.md`](docs/MANIFEST.md) — is this the canonical document for its topic?
3. Check [`docs/DEPENDENCY_GRAPH.md`](docs/DEPENDENCY_GRAPH.md) — what else depends on this document?
4. If other documents depend on it, verify the modification does not create a new conflict.

### After creating any new document

1. Add it to [`docs/MANIFEST.md`](docs/MANIFEST.md).
2. Add it to [`docs/DOCUMENT_MAP.md`](docs/DOCUMENT_MAP.md) under the correct domain.
3. Add its dependencies to [`docs/DEPENDENCY_GRAPH.md`](docs/DEPENDENCY_GRAPH.md).
4. Assign an owner in [`docs/OWNERSHIP_MATRIX.md`](docs/OWNERSHIP_MATRIX.md).
5. If it is the canonical source for any topic, update [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md).

---

## 6. Hallucination Prevention Rules

This project has 85 existing documents with specific, documented product requirements. The risk of AI hallucination is high — inventing requirements, technology choices, or architecture decisions that are not in the repository.

**Mandatory grounding**:

- Before stating a product requirement, cite the document and section it comes from.
- Before stating a technology choice, cite it from [`TECH_STACK.md`](TECH_STACK.md) or a source document.
- Before stating an architecture decision, cite it from [`ARCHITECTURE.md`](ARCHITECTURE.md) or [`DECISION_LOG.md`](DECISION_LOG.md).
- If you cannot cite a source, state "not documented" and ask, do not invent.

**The canonical truth map**: [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md) lists the authoritative document for every topic. Use it before answering product or architecture questions.

---

## 7. Loop Termination Conditions

An autonomous agent operating in a multi-step loop must stop the loop and report to the human operator when any of the following occurs:

1. A conflict is found between two documents.
2. A task requires a Phase 1 feature to be built.
3. A task requires modifying `MVP_FREEZE.md` scope.
4. A task requires a decision not in `DECISION_LOG.md`.
5. A task involves the payment processor choice.
6. A task would modify `MASTER_CONTEXT.md` or any Phase -1 document.
7. A task creates a dependency not reflected in `DEPENDENCY_GRAPH.md`.
8. CI fails and the root cause is not clear from the error output.
9. A task requires creating or modifying production infrastructure.

---

## 8. Multi-Agent Coordination

When multiple AI agents work on this repository simultaneously:

- The canonical source for task assignment is [`TASKS.md`](TASKS.md).
- The canonical source for what decisions are already made is [`DECISION_LOG.md`](DECISION_LOG.md).
- If two agents produce conflicting outputs, neither output is merged until the human operator resolves the conflict.
- Never merge a PR that conflicts with an in-progress PR from another agent without human review.
- [`docs/MANIFEST.md`](docs/MANIFEST.md) is the shared file index — update it atomically (one agent at a time).

---

## 9. AI Roadmap Boundary

Source: `DECISION_LOG.md` DEC-008

| Phase | AI Permitted |
|-------|-------------|
| Phase 0 (now) | Zero AI features |
| Phase 1 (MVP) | Rule-based pricing only — no ML |
| Phase 2 | ML features after 50K transactions |
| Phase 3+ | Demand forecasting, personalization, fraud detection |

Do not add any ML library, LLM API call, vector store, or embedding model to Phase 1 code. The AI in "AI-powered" is the product's long-term vision, not a Phase 1 implementation requirement.
