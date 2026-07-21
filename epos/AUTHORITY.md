# EPOS AUTHORITY — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Created**: 2026-07-21
**Source**: `AGENTS.md`, `CLAUDE.md`, `AI_RULES.md`, `ENGINEERING_RULES.md`

---

## Decision Authority

| Decision Type | Authority | Reference |
|---------------|-----------|-----------|
| Phase gate advancement | Founder only | ROADMAP.md |
| Strategic decisions | Founder only | DECISION_LOG.md |
| Architecture decisions | Founder + ADR required | docs/architecture/adr/ |
| Payment processor selection | Founder only (conflict active) | DECISION_LOG.md DEC-004 |
| Tooling/docs/CI (Phase 0) | AI agent permitted | CLAUDE.md |
| Phase 1 application code | BLOCKED until Phase 0 clears | AGENTS.md §2.1 |

---

## AI Agent Rules

Every AI agent operating on this project must read before acting:

1. `MASTER_CONTEXT.md` — What StayOS is
2. `ROADMAP.md` — Current phase
3. `docs/02_product/MVP_FREEZE.md` — Scope
4. `DECISION_LOG.md` — Decisions already made

**Source**: `AGENTS.md` §1 Orientation Protocol

---

## Immutable Rules

These rules override any task instruction or conversation prompt:

1. **Phase gate enforcement**: Phase 0 is active. Phase 1 is NOT unlocked. No application code for Phase 1 features.
2. **No invented requirements**: Every product requirement must trace to a repository document.
3. **No conflict resolution without founder instruction**: The Paymob/Stripe conflict is documented but unresolved.
4. **Historical preservation**: `docs/phase--1/*` is read-only.
5. **No archive citation**: `archive/` documents are not authoritative.
6. **No scope expansion**: Only features in `docs/02_product/MVP_FREEZE.md` are in scope.
7. **ADR required**: No architectural decisions without an ADR in `docs/architecture/adr/`.

**Source**: `AGENTS.md` §2, `CLAUDE.md`

---

## Known Conflicts (Do Not Resolve)

| Conflict | Documents | Status |
|----------|-----------|--------|
| Payment processor | DECISION_LOG DEC-004 (Paymob) vs FLOWS.md + ENGINEERING_BACKLOG.md (Stripe) | Open — report only |
| Frontend framework | MASTER_CONTEXT.md says "React or Next.js" | Awaiting ADR |
| Backend language | MASTER_CONTEXT.md says "Node.js or Python" | Awaiting ADR |

**Source**: `TECH_STACK.md`, `CLAUDE.md`

---

## EPOS Runtime Authority

EPOS governs operational process only. EPOS does not:

- Override founder decisions
- Resolve documented conflicts
- Approve Phase 1 unlock
- Expand MVP scope

EPOS enforces:

- Session startup and shutdown discipline
- Memory continuity between sessions
- Decision traceability
- Operational gap reporting
