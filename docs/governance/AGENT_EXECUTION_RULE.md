# Agent Execution Rule — StayOS

**Status:** OFFICIAL
**Version:** 1.0
**Date:** 2026-09-02
**Authority:** Repository Governance
**Related Document:** `docs/governance/REFERENCE_PRODUCT_BENCHMARK.md`

---

## 1. Execution Hierarchy

Every future coding agent operating on StayOS must use this decision stack
before writing, changing, or deleting code:

```
FOUNDER DECISIONS
        +
    STAYOS PRD
        +
REFERENCE PRODUCT BENCHMARK
        +
CURRENT REPOSITORY
        ↓
IMPLEMENTATION
```

No lower layer may override a higher layer.

## 2. Layer Definitions

| # | Layer | Canonical Source | What It Contains |
|---|-------|------------------|------------------|
| 1 | **Founder Decisions** | `epos/AUTHORITY.md`, `epos/KNOWLEDGE_BASE.md`, `docs/legal/FOUNDER_ACTION_AND_DECISION_PACK_*.md`, `.ai/DECISIONS/*.md` | Explicit decisions made by the Founder or delegated decision authority. These are the highest authority for product direction. |
| 2 | **StayOS PRD** | `docs/02_product/` (`MVP_FREEZE.md`, `FEATURE_CATALOG.md`, `USER_STORIES.md`, `BUSINESS_RULES.md`, `FLOWS.md`, `ENGINEERING_BACKLOG.md`) | Approved product requirements. |
| 3 | **Reference Product Benchmark** | `docs/governance/REFERENCE_PRODUCT_BENCHMARK.md` | Approved reference behavior and product benchmark derived only from existing approved research. |
| 4 | **Current Repository** | `src/`, `apps/`, `tests/`, `alembic/`, `openapi.json` | The implementation truth. |
| 5 | **Execution Prompts** | Current task / user request | Implementation instructions that must conform to all layers above. |

## 3. Agent Rules

1. **Read the hierarchy first.** Before starting any major implementation
   domain, read:
   - `epos/AUTHORITY.md`
   - `docs/02_product/MVP_FREEZE.md`
   - `docs/governance/REFERENCE_PRODUCT_BENCHMARK.md`
   - `epos/PROJECT_STATE.md`

2. **No new competitor research.** Agents must NOT browse competitor
   websites, APIs, documentation, screenshots, or repositories unless a
   Founder explicitly authorizes a new research phase in writing. The only
   permitted competitor-derived source is the existing approved material
   already captured in `REFERENCE_PRODUCT_BENCHMARK.md` and related
   `reports/executive/` documents.

3. **No invented requirements.** Every product requirement must trace to one
   of the layers above. If a requirement is not in the PRD, a Founder
   Decision, or the Reference Benchmark, it is not a requirement.

4. **Report contradictions, do not resolve them.** If a Founder Decision
   contradicts the PRD or the Reference Benchmark, STOP and report the
   conflict. Do not silently reconcile. The Founder has the authority to
   override any other layer.

5. **Reference ≠ requirement.** A behavior described in the Reference Product
   Benchmark is reference information, not a mandatory implementation target.
   A Founder Decision may intentionally differ from the reference. That is
   not a bug.

6. **Repository truth.** If the implementation differs from the benchmark
   but matches a Founder Decision or PRD, the implementation is correct. If
   the implementation contradicts a Founder Decision or PRD, report it.

7. **No scope expansion.** Creating or updating governance documents does
   NOT authorize adding new product features, redesigning screens, modifying
   business logic, or creating new database tables unless the update is purely
   documentation-related.

8. **Preserve history.** When updating `epos/KNOWLEDGE_BASE.md`,
   `epos/PROJECT_STATE.md`, `SPRINT_MEMORY.md`, or any other append-only
   memory file, append only. Do not delete, overwrite, or rewrite historical
   decisions.

9. **Follow repository architecture.** Place new files according to
   `docs/governance/REPOSITORY_INFORMATION_ARCHITECTURE.md`. Do not create
   floating documents at the repository root.

10. **Validate before committing.** Run the relevant existing quality gates
    (ruff, mypy, pytest, tsc) for any code change. Run git diff inspection.
    Do not modify unrelated code to make the repository globally clean.

## 4. Reference-Requirement-Implementation Mapping

When documenting or implementing a feature, classify each item:

| Classification | Question to Answer | Example |
|----------------|--------------------|---------|
| **REFERENCE** | What does the approved benchmark say? | "Airbnb charges 15-20% fees in MENA" |
| **STAYOS DECISION** | What did the Founder explicitly decide? | "StayOS V1 charges 10% host commission" |
| **PRD REQUIREMENT** | What does the PRD require? | "Booking must lock the calendar atomically" |
| **CURRENT IMPLEMENTATION** | What does the code currently do? | "PostgreSQL exclusion constraint on tsrange" |
| **GAP** | Where is the evidence-supported difference? | "Refund calculation is not yet automated" |

A difference is only a GAP when the evidence supports it. Do not assume a
missing feature is a gap simply because the reference has it.

## 5. Competitor Research Rule

**HARD RULE:**

- DO NOT perform new competitor research.
- DO NOT use Web search for competitors.
- DO NOT browse Airbnb or any competitor website.
- DO NOT inspect competitor GitHub repositories.
- DO NOT use competitor documentation.
- DO NOT use competitor screenshots.
- DO NOT use competitor APIs.
- DO NOT search for additional competitor behavior.
- DO NOT expand competitor research.
- DO NOT silently supplement `REFERENCE_PRODUCT_BENCHMARK.md` with general
  knowledge.

**The only permitted competitor-derived source is:** the existing approved
competitor research already preserved in the repository and summarized in
`REFERENCE_PRODUCT_BENCHMARK.md`.

## 6. Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-09-02 | Initial creation. Established source-of-truth hierarchy and agent execution rules. |

## 7. Acknowledgement

This document is the agent execution layer. It is subordinate to Founder
Decisions, the PRD, and the Reference Product Benchmark. It exists to make
the hierarchy machine-actionable, not to replace it.
