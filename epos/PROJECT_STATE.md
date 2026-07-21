# PROJECT STATE — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Last Updated**: 2026-07-21
**Updated By**: EPOS Session 001
**Source**: SPRINT_MEMORY.md (Current State) + MASTER_PROJECT_MEMORY.md (Historical Context)

---

## Current Phase

**Phase 0 — Customer Validation**
**Status**: ACTIVE — Gates not yet cleared

---

## Phase Gate Status

| Gate Condition | Target | Current | Status |
|----------------|--------|---------|--------|
| Real customer transactions | 10 | 0 (unconfirmed) | 🔴 Not Met |
| Customer interviews | 80 | 0 (unconfirmed) | 🔴 Not Met |

**Gate Reference**: `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`

---

## Active Sprint

**Branch**: `tooling/repository-intelligence`
**Theme**: Repository governance and intelligence tooling
**Phase**: Phase 0 (tooling/docs/CI — permitted)

---

## What Is Permitted Now

- Documentation and governance files
- CI/CD workflows (`.github/workflows/`)
- Python tooling scripts (`tools/`)
- Architecture decision records (`docs/architecture/adr/`)
- Infrastructure-as-code scaffolding (no execution)
- Test fixtures and schema definitions (no live database)

**What Is Blocked**: Production application code for Phase 1 features

---

## Confirmed Decisions (Summary)

For full decision text, read `DECISION_LOG.md`.

| ID | Decision | Status |
|----|----------|--------|
| DEC-001 | StayOS is an accommodation marketplace (not a computer OS) | Accepted |
| DEC-002 | Egypt as proof-of-concept; GCC is the business | Accepted |
| DEC-003 | Arabic-first UX (not translated) | Accepted |
| DEC-004 | Local payment infrastructure as core capability; Paymob primary | Accepted |
| DEC-005 | B2B2C supply strategy — hotels and property managers first | Accepted |
| DEC-006 | Trust before scale — no shortcuts on verification | Accepted |

**Known Conflict**: DEC-004 specifies Paymob; `FLOWS.md` and `ENGINEERING_BACKLOG.md` reference Stripe.  
**Action**: Do not resolve — report and await founder instruction. See `TECH_STACK.md`.

---

## Governance State

| Item | Status |
|------|--------|
| EPOS Onboarding | ✅ Complete — Session 001 |
| Project Memory | ✅ Active (MASTER_PROJECT_MEMORY.md) |
| Sprint Memory | ✅ Active (SPRINT_MEMORY.md) |
| Decision Log | ✅ Active (DECISION_LOG.md) |
| Phase Gate enforcement | ✅ Active (AGENTS.md, CLAUDE.md) |

---

## Memory Health

| Dimension | Status | Note |
|-----------|--------|------|
| Product identity | ✅ Verified | MASTER_CONTEXT.md |
| Decision history | ✅ Rich | DECISION_LOG.md — 6+ decisions |
| Phase gate status | ✅ Verified | ROADMAP.md |
| Sprint state | ⚠️ Partial | SPRINT_MEMORY.md captures governance intent only; no product sprint state |
| Master memory project field | ⚠️ Gap | MASTER_PROJECT_MEMORY.md shows `Project: UNKNOWN` — template gap, not data loss |

---

## Open Items

1. Phase 0 gate conditions: 10 transactions + 80 interviews — progress unknown
2. Payment processor conflict (Paymob vs Stripe) — awaiting founder decision
3. Frontend framework — "React or Next.js" unresolved — awaiting ADR
4. Backend language — "Node.js or Python" unresolved — awaiting ADR
5. MASTER_PROJECT_MEMORY.md `Project` field is `UNKNOWN` — should be updated to "StayOS"

---

## Next Required Action

Read `epos/NEXT_SPRINT.md` for the prioritized work queue.
