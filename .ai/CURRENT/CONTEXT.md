# CONTEXT.md — StayOS AI Entry Point

**Purpose**: Single entry point for any AI agent starting cold on this repository.
**Read this first. Read nothing else until you have finished this file.**

---

## What This Project Is

StayOS is an **AI-powered, two-sided accommodation marketplace** for the MENA region.

- Supply side: property owners, property managers, hotels, and resort operators in Egypt and GCC.
- Demand side: Egyptian domestic travelers, GCC nationals visiting Egypt, international tourists.
- Differentiation: Arabic-first UX, verified listings, local Egyptian payment rails (Fawry, Meeza, Vodafone Cash, InstaPay), trust infrastructure, and a data-gated AI roadmap.

**"OS" is a business metaphor. StayOS is not a computer operating system.**

The full definition lives in one place: [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md). Read it before any other document.

---

## Current Phase

| Phase | Status | Gate |
|-------|--------|------|
| Phase -1: Founder Discovery | ✅ Complete | 21 documents, 600+ risks, panel verdict: Conditional Go |
| Phase 0: Customer Validation | 🔴 LOCKED | 50 traveler interviews + 30 host interviews + 10 manual transactions |
| Phase 1: MVP Build | ⏳ Pending Phase 0 | Engineering documents are prepared but cannot be executed yet |
| Phase 2+: Expansion / AI | ⏳ Future | Gated behind Phase 1 |

**No code is written in Phase 0.** Phase 0 is manual operations and customer validation only.

The repository is transitioning from Product Discovery to Engineering Preparation. Phase 0 gate conditions are not yet cleared.

---

## The AI Context Layer (This Sprint)

These 11 files were created to give any AI agent instant orientation without reading 85 documents:

| File | Purpose |
|------|---------|
| [`CONTEXT.md`](CONTEXT.md) | This file — start here |
| [`AGENTS.md`](AGENTS.md) | Universal rules for all AI agents working on this codebase |
| [`CLAUDE.md`](CLAUDE.md) | Claude-specific instructions |
| [`GEMINI.md`](GEMINI.md) | Gemini-specific instructions |
| [`CODEX.md`](CODEX.md) | OpenAI Codex / GPT-Operator instructions |
| [`DEVIN.md`](DEVIN.md) | Devin autonomous agent instructions |
| [`PRODUCT_CANON.md`](PRODUCT_CANON.md) | Canonical product specification |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture and service boundaries |
| [`TECH_STACK.md`](TECH_STACK.md) | Technology choices, confirmed vs. inferred |
| [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md) | Rules for writing code and managing the build |
| [`AI_RULES.md`](AI_RULES.md) | Rules specific to AI agents operating autonomously |

---

## The Five Most Important Documents

If you read only five documents, read these — in this order:

1. [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) — What StayOS is, who it serves, what phase it is in, and why it exists.
2. [`DECISION_LOG.md`](DECISION_LOG.md) — Every significant decision made so far (10 decisions). If something is decided, it is here.
3. [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) — What is in scope for Phase 1 and what is explicitly excluded.
4. [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md) — The 7 platform features (FC-01 through FC-07) with descriptions.
5. [`TECH_STACK.md`](TECH_STACK.md) — Technology choices, including a critical conflict you must know about before touching any payment code.

---

## What You Must Never Do

1. **Do not write Phase 1 code until Phase 0 gates are cleared.** See [`ROADMAP.md`](ROADMAP.md).
2. **Do not invent product requirements.** Every product decision references an existing document.
3. **Do not resolve the Stripe/Paymob conflict.** This is an open conflict documented in [`TECH_STACK.md`](TECH_STACK.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md). Report it; do not pick one.
4. **Do not modify these files without updating [`docs/MANIFEST.md`](docs/MANIFEST.md).**
5. **Do not treat archived documents as authoritative.** Archive documents in `archive/` and `docs/archive/` are superseded.

---

## Repository Structure (Fast Map)

```
StayOS/
├── MASTER_CONTEXT.md          ← Read this first
├── DECISION_LOG.md            ← All decisions
├── ROADMAP.md                 ← Phase gates
├── TASKS.md                   ← Phase 0 task list (19 tasks)
├── ASSUMPTIONS.md             ← 13 active assumptions
├── RISKS.md                   ← 15 active risks
├── CONTEXT.md                 ← This file
├── AGENTS.md                  ← AI agent universal rules
├── CLAUDE.md / GEMINI.md / CODEX.md / DEVIN.md  ← Per-agent instructions
├── PRODUCT_CANON.md           ← Definitive product spec
├── ARCHITECTURE.md            ← System design
├── TECH_STACK.md              ← Technology choices
├── ENGINEERING_RULES.md       ← Build rules
├── AI_RULES.md                ← Agent-specific rules
│
├── docs/
│   ├── MANIFEST.md            ← Full inventory of all 85 docs
│   ├── DOCUMENT_MAP.md        ← Docs by domain
│   ├── DEPENDENCY_GRAPH.md    ← Doc relationships, conflicts, orphans
│   ├── OWNERSHIP_MATRIX.md    ← Who owns what
│   ├── SINGLE_SOURCE_OF_TRUTH.md  ← Canonical doc per topic
│   ├── phase--1/              ← 21 founder discovery documents (COMPLETE, read-only)
│   ├── 02_product/            ← MVP scope, features, backlog, rules, flows
│   ├── 03_customer_experience/ ← Journey maps, trust, UX rules, delight
│   ├── architecture/          ← ADR template (no ADRs yet)
│   └── standards/             ← Commit, naming, markdown, repo conventions
│
├── research/                  ← Interview/market/competitor templates (Phase 0)
├── business/                  ← Financial, product, sprint templates
├── ai_agents/                 ← AI agent documentation
├── tools/                     ← Python repository tooling
├── archive/                   ← Legacy and raw output (do not cite)
└── .github/                   ← Workflows (CI, security, release, docs)
```

---

## Known Conflicts (Do Not Resolve Without Founder Approval)

| Conflict | Documents | Status |
|----------|-----------|--------|
| Payment processor: Paymob vs Stripe | `DECISION_LOG.md` DEC-004 vs `FLOWS.md`, `ENGINEERING_BACKLOG.md`, `MVP_FREEZE.md` | Open — must be resolved before Phase 1 build |
| Frontend framework: React vs Next.js | `MASTER_CONTEXT.md` ("React or Next.js") | Open — no ADR yet |
| Backend language: Node.js vs Python | `MASTER_CONTEXT.md` ("Node.js or Python") | Open — no ADR yet |

Full conflict details: [`TECH_STACK.md`](TECH_STACK.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Linked Intelligence Documents

- [`docs/MANIFEST.md`](docs/MANIFEST.md) — Every document with metadata
- [`docs/DOCUMENT_MAP.md`](docs/DOCUMENT_MAP.md) — Documents by business domain
- [`docs/DEPENDENCY_GRAPH.md`](docs/DEPENDENCY_GRAPH.md) — Cross-document relationships
- [`docs/OWNERSHIP_MATRIX.md`](docs/OWNERSHIP_MATRIX.md) — Who owns each document
- [`docs/SINGLE_SOURCE_OF_TRUTH.md`](docs/SINGLE_SOURCE_OF_TRUTH.md) — Canonical document per topic
