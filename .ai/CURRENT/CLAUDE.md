# CLAUDE.md — Instructions for Claude / Claude Code

**This file is automatically loaded by Claude Code at session start.**
**Read [`CONTEXT.md`](CONTEXT.md) and [`AGENTS.md`](AGENTS.md) before any task.**

---

## Project Identity

StayOS is an **AI-powered, two-sided accommodation marketplace** for MENA — not a computer operating system. "OS" is a business metaphor.

- Canonical definition: [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md)
- Current phase: Phase 0 LOCKED (customer validation not yet complete)
- Engineering phase: Prepared but gated — see [`ROADMAP.md`](ROADMAP.md)

---

## Immediate Orientation (Before Any Task)

Read in order:

1. [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) — what StayOS is
2. [`DECISION_LOG.md`](DECISION_LOG.md) — all decisions already made (do not re-decide)
3. [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) — Phase 1 scope
4. [`TECH_STACK.md`](TECH_STACK.md) — tech choices and known conflicts

---

## Phase Gate Rules

| Phase | Status | Code Allowed? |
|-------|--------|--------------|
| Phase -1 | ✅ Complete | Read-only |
| Phase 0 | 🔴 Active | Tooling/docs/CI only — no app code |
| Phase 1 | ⏳ Locked | Gated behind Phase 0 |

**Phase 0 gate conditions**: [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)

---

## Known Conflicts — Do Not Resolve

| Conflict | Documents | Action |
|----------|-----------|--------|
| Payment processor | `DECISION_LOG.md` DEC-004 says Paymob; `FLOWS.md` + `ENGINEERING_BACKLOG.md` say Stripe | Report; do not pick a side |
| Frontend framework | `MASTER_CONTEXT.md` says "React or Next.js" | Awaiting first ADR |
| Backend language | `MASTER_CONTEXT.md` says "Node.js or Python" | Awaiting first ADR |

Full conflict register: [`TECH_STACK.md`](TECH_STACK.md)

---

## What Claude Code Can Do in Phase 0

- Write and update documentation
- Create or update CI/CD workflows (`.github/workflows/`)
- Write Python tooling scripts in `tools/`
- Write architecture decision records in `docs/architecture/adr/`
- Update the intelligence layer (`CONTEXT.md`, `AGENTS.md`, `MANIFEST.md`, etc.)
- Write infrastructure-as-code scaffolding without executing it
- Create test fixtures and schema definitions (no live database)

---

## What Claude Code Must Not Do

- Write `src/` application code for Phase 1 features before Phase 0 gates clear
- Resolve the Paymob/Stripe conflict without explicit founder instruction
- Delete or modify `docs/phase--1/*` (read-only historical record)
- Treat `archive/` documents as authoritative
- Add features not in [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md)
- Make architectural decisions not yet recorded in an ADR

---

## Code Style (When Code Is Written)

Full rules in [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md). Defaults:

- **Language**: Python for tools and scripts (CI-validated with ruff + mypy)
- **Comments**: Only when the WHY is non-obvious — no narrative comments
- **Tests**: Required for all tools in `tools/` — pytest, ≥ 80% coverage target
- **Commit format**: `type(scope): message` — see [`docs/standards/commit_conventions.md`](docs/standards/commit_conventions.md)
- **No feature flags**, no backwards-compatibility shims, no premature abstractions

---

## Repository Layout (Claude Code Navigation)

```
/                              ← Root-level strategy and AI context files
docs/                          ← All documentation
  phase--1/                    ← Read-only (21 founder discovery docs)
  02_product/                  ← Product spec, features, backlog
  03_customer_experience/      ← Journey, trust, UX rules
  architecture/adr/            ← ADR template (write ADRs here)
  standards/                   ← Commit/naming/markdown conventions
tools/                         ← Python scripts (CI-tested)
research/                      ← Templates for Phase 0 interview/market work
business/                      ← Financial/product/sprint templates
archive/                       ← Do not read or cite
.github/workflows/             ← CI (Python + docs), security, release
```

---

## Memory Notes for This Session

Key facts established across prior sprints:

- **Sprint 1** (commit `0c61634`): Replaced Rust/Cargo CI with Python; rewrote RISKS.md; edited DECISION_LOG.md.
- **Sprint 2** (commit `271a8ed`): Created 5 intelligence-layer documents under `docs/`.
- **Sprint 3** (current): Creating 11 AI context files at root.
- Working branch: `tooling/document-extractor`
- Main branch: `main`

---

## Linked Agent Files

- [`AGENTS.md`](AGENTS.md) — Universal rules (all agents)
- [`CONTEXT.md`](CONTEXT.md) — Entry point and quick orientation
- [`AI_RULES.md`](AI_RULES.md) — Rules specific to autonomous AI operation
- [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md) — Code quality and process rules
