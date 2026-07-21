# NEXT SPRINT — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Last Updated**: 2026-07-21
**Updated By**: EPOS Session 001

---

## Current Sprint Status

**Active Branch**: `tooling/repository-intelligence`
**Sprint Theme**: Repository governance and intelligence tooling
**Phase**: Phase 0 (permitted — tooling/docs/CI)

---

## Pending Phase 0 Work

The following tasks are derived from `TASKS.md` and governance priorities.

### P0 — Blockers (Phase Gate)

| ID | Task | Source |
|----|------|--------|
| T0.1-L01 | Trademark search — Egypt, Saudi, UAE | TASKS.md |
| T0.1-L02 | Retain tourism and hospitality lawyer (Egypt) | TASKS.md |
| — | Begin customer interviews (target: 80) | ROADMAP.md |
| — | Facilitate first accommodation transactions (target: 10) | ROADMAP.md |

### P1 — Governance (Open Decisions Requiring Founder Action)

| Item | Required Decision | Source |
|------|------------------|--------|
| Payment processor | Resolve Paymob vs Stripe conflict | DECISION_LOG + TECH_STACK.md |
| Frontend framework | First ADR — React vs Next.js | MASTER_CONTEXT.md |
| Backend language | First ADR — Node.js vs Python | MASTER_CONTEXT.md |

### P2 — Tooling (Phase 0 Permitted)

| Item | Type | Source |
|------|------|--------|
| CI workflow updates | `.github/workflows/` | `.github/workflows/ci.yml` (modified) |
| Interview templates | `research/` | TASKS.md |
| Market research templates | `research/` | TASKS.md |

---

## EPOS Operational Next Actions

| # | Action | Priority |
|---|--------|----------|
| 1 | Fix MASTER_PROJECT_MEMORY.md `Project: UNKNOWN` field | Medium |
| 2 | Founder to report Phase 0 gate progress (transactions + interviews) | High |
| 3 | Founder to resolve payment processor conflict | High |
| 4 | Write ADR for frontend framework once founder decides | Medium |
| 5 | Write ADR for backend language once founder decides | Medium |

---

## Sprint Intake Rule

Before adding any new task to the sprint:

1. Check it against `DECISION_LOG.md` — has this already been decided?
2. Check it against `docs/02_product/MVP_FREEZE.md` — is this in Phase 1 scope?
3. Confirm it does not write Phase 1 application code
4. Confirm it does not resolve an open conflict without founder instruction

If all four checks pass, the task may be added.
