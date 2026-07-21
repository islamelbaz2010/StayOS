# ADR-016: EPOS Runtime Governance Adoption

**Status**: Accepted
**Date**: 2026-07-21
**Decision Maker**: Founder (Islam Elbaz)
**Urgency**: IMMEDIATE
**Reversibility**: HIGH

---

## Context

The project has accumulated governance complexity across multiple AI sessions and sprints. The SPRINT_MEMORY.md and MASTER_PROJECT_MEMORY.md files established that:

1. Conversation alone is not a sufficient long-term knowledge store
2. New ideas frequently displaced previously agreed work
3. Historical decisions were at risk of being forgotten
4. Duplicate implementation caused by missing decision history was identified as a High risk

A persistent governance runtime (EPOS) was proposed to resolve this by imposing operational discipline on AI sessions: startup protocols, shutdown protocols, working memory, decision traceability, and session records.

---

## Decision

Adopt EPOS (an operational runtime governance layer) for StayOS. EPOS operates on top of the project without replacing or migrating existing project artifacts. Operational files live in `epos/` at the repository root.

EPOS governs:
- Session startup and shutdown discipline
- Memory continuity between AI sessions
- Decision traceability
- Operational gap reporting

EPOS does not govern:
- Product decisions (founder authority)
- Phase gate advancement (founder authority)
- Conflict resolution (founder authority)

---

## Alternatives Considered

- **Continue without governance**: Rejected — MASTER_PROJECT_MEMORY.md and SPRINT_MEMORY.md both document the cost of this approach (roadmap drift, forgotten decisions, duplicate work).
- **Migrate all docs into a new structure**: Rejected — EPOS principle: govern on top; never replace or migrate project artifacts.
- **Use CLAUDE.md memory system only**: Insufficient — Claude Code session memory does not persist across all AI agents (Gemini, Codex, Devin) working on the project.

---

## Rationale

EPOS provides cross-agent governance that is agent-agnostic. Any AI agent — Claude, Gemini, Codex, Devin — can start a session by reading `epos/STARTUP_PROTOCOL.md` and reach the same operational state. This is the only governance approach that works across all agents defined in `AGENTS.md`.

---

## Consequences

**Positive**:
- Any future AI session starts with full operational context
- Decisions are traceable to original source documents
- Session records provide an audit trail without relying on git history
- No existing project artifact is modified or replaced

**Negative**:
- Requires discipline to execute STARTUP_PROTOCOL and SHUTDOWN_PROTOCOL each session
- `epos/` files must be kept in sync with project reality

**Neutral**:
- `epos/` directory adds 10 new files at repository root; no existing file modified

---

## Related Decisions

- DEC-001 through DEC-006: All confirmed decisions are now registered in `epos/KNOWLEDGE_BASE.md` with source references
- SPRINT_MEMORY.md and MASTER_PROJECT_MEMORY.md remain the canonical historical source; EPOS references them, does not replace them
