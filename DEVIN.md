# DEVIN.md — Instructions for Devin (Autonomous Coding Agent)

**Read [`CONTEXT.md`](CONTEXT.md) and [`AGENTS.md`](AGENTS.md) before taking any action.**

---

## Project Identity

StayOS is a two-sided accommodation marketplace for Egypt and the GCC. It is not a computer operating system. The full project definition is in [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md).

---

## Before You Write a Single Line of Code

Answer these questions by reading the listed documents:

1. **What phase are we in?** → [`ROADMAP.md`](ROADMAP.md) — Phase 0 (customer validation) is active. Phase 1 is LOCKED.
2. **What is in scope?** → [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) — 7 features, $150K budget, 6-month target.
3. **What are the non-negotiable rules?** → [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md)
4. **Which decisions are already made?** → [`DECISION_LOG.md`](DECISION_LOG.md) — 10 decisions. Do not re-open them.

If you cannot answer all four, stop and read until you can.

---

## Phase Gate Rule (Immutable)

**Phase 0 is active. No Phase 1 application code is written until Phase 0 clears.**

Devin may autonomously work on in Phase 0:
- Documentation generation and updates
- CI/CD pipeline configuration (`.github/workflows/`)
- Repository tooling under `tools/`
- Test fixtures and scaffolding under `tests/`
- Infrastructure-as-code (does not include database migrations with live data)

Devin must NOT autonomously work on in Phase 0:
- Any feature listed in [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md)
- Any service in the four canonical service boundaries (AuthGate, PMS Core, OpsManager, FinancialEngine)
- Any payment integration code (see Conflict below)
- Any database schema for production use

---

## Feature Build Order (When Phase 1 Unlocks)

Build sequence is strict — do not parallelize across these tiers:

```
Tier 1 (start here): FC-01 AuthGate & KYC
Tier 2 (parallel):   FC-02 Spatial Search  +  FC-04 PMS Core
Tier 3 (after Tier 2): FC-03 Reservation Engine
Tier 4 (parallel):   FC-05 OpsManager  +  FC-06 Treasury Ledger
Tier 5 (last):       FC-07 Incident Console
```

Source: [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md)

---

## Critical Conflict — Do Not Touch Payment Code

**Payment processor is unresolved.** Do not write any payment integration.

- `DECISION_LOG.md` DEC-004 → **Paymob** is named as primary (Egypt-native rails).
- `FLOWS.md` → References **Stripe Gateway Protocol**.
- `ENGINEERING_BACKLOG.md` FC-03 Task 2 → References **Stripe Merchant Platform Payment Intents**.

These documents contradict each other. Writing payment integration code now would embed the wrong processor. Stop and surface this conflict if any payment task is assigned.

---

## Technology (Confirmed)

| Component | Technology |
|-----------|-----------|
| Database | PostgreSQL + PostGIS |
| OTP caching | Redis (5-min TTL) |
| SMS OTP | Twilio |
| Social OAuth | Firebase Identity or Auth0 |
| Maps | Google Maps API |
| Primary comms | WhatsApp Business API |
| File storage | AWS S3 |
| Mobile offline | SQLite / Room |
| Cloud hosting | AWS or GCP, Middle East region |

**Frontend** (React vs Next.js) and **backend** (Node.js vs Python) are unresolved. Do not scaffold either until an ADR is written in `docs/architecture/adr/`.

---

## Non-Negotiable Business Rules

Every implementation must enforce these rules. Source: [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md)

- **BR-ID-01**: KYC status must be `VERIFIED` before any guest accesses checkout or any host activates a listing.
- **BR-INV-01**: Calendar booking writes must use ACID-compliant row-level locking. No overlapping reservations on a single unit.
- **BR-INV-02**: Unit status `READY_FOR_OCCUPANCY` requires the linked turnover ticket in state `CLOSED`.
- **BR-OPS-01**: Checkout event must immediately spawn a turnover ticket in `UNASSIGNED` status.
- **BR-FIN-01**: Guest funds held in escrow 24 hours post-check-in before host payout.
- **BR-FIN-03**: Any error in host payout routing configuration halts all pending payouts instantly.

---

## Escalation Triggers (Stop and Report)

Stop autonomous operation and wait for human confirmation if:

1. A task requires modifying MVP scope defined in `MVP_FREEZE.md`.
2. A task requires a decision not in `DECISION_LOG.md`.
3. Any conflict is found between two documents.
4. The task involves payment processing (Paymob vs Stripe unresolved).
5. The task involves the frontend framework or backend language choice.
6. A task would modify `MASTER_CONTEXT.md`, `ROADMAP.md`, or any Phase -1 document.
7. A PR would affect `DECISION_LOG.md` entries (you may ADD entries; never DELETE).

---

## Code Standards

Full rules: [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md)

- Commit format: `type(scope): message` — see [`docs/standards/commit_conventions.md`](docs/standards/commit_conventions.md)
- Python tooling: ruff (lint), mypy (types), pytest (tests)
- No feature flags, no backwards-compatibility shims
- Comments only for non-obvious WHY, never for WHAT
- Arabic RTL layout must be supported as the primary UI direction

---

## PR Rules

Every PR Devin opens must:

1. Reference the feature ID and sprint it targets (e.g., `FC-01 Sprint 1`).
2. List business rules enforced (e.g., `BR-ID-01 enforced via middleware X`).
3. Include test coverage for happy path + the specific business rule it enforces.
4. Not modify any document in `archive/` or `docs/archive/`.
5. Not modify `MASTER_CONTEXT.md` without Founder approval explicitly in the PR description.
