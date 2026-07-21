# CODEX.md — Instructions for OpenAI Codex / GPT Operator

**Read [`CONTEXT.md`](CONTEXT.md) and [`AGENTS.md`](AGENTS.md) first.**

---

## Project Summary

StayOS is a two-sided accommodation marketplace for Egypt and the GCC. Phase 1 MVP is designed and documented. Phase 0 (customer validation) must complete before any Phase 1 code executes.

Full definition: [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md)

---

## Code Generation Context

### What to Build

Phase 1 MVP scope is frozen in [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md).

Seven features defined in [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md):

| ID | Feature | Priority | Dependencies |
|----|---------|----------|-------------|
| FC-01 | AuthGate & Identity (KYC) | P0 — build first | None |
| FC-02 | Spatial Search Engine | P1 | FC-01 |
| FC-03 | Reservation Lifecycle Engine | P0 | FC-01, FC-02, FC-04 |
| FC-04 | Property Management System (PMS) | P0 | FC-01 |
| FC-05 | OpsManager Ticket Engine | P0 | FC-03 |
| FC-06 | Treasury Ledger & Escrow | P1 | FC-03 |
| FC-07 | Incident Resolution Console | P1 | FC-03 |

Visual dependency map: [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md)

**Always implement FC-01 before any other feature.** It is the root dependency.

### What Not to Build

The following are explicitly excluded from Phase 1 MVP:

- Channel manager integrations (Airbnb, Booking.com API sync)
- Dynamic pricing algorithms / ML pricing
- Automated CRM dashboards
- Advanced treasury controls (W-8BEN, 1099-K automation)
- Any AI/ML feature — AI is Phase 3+ only

---

## Technology (Read [`TECH_STACK.md`](TECH_STACK.md) for full detail)

### Confirmed Choices

| Layer | Technology | Source |
|-------|-----------|--------|
| Database | PostgreSQL + PostGIS | `ENGINEERING_BACKLOG.md` |
| OTP Caching | Redis (5-min TTL) | `ENGINEERING_BACKLOG.md` |
| SMS OTP | Twilio | `ENGINEERING_BACKLOG.md` |
| Social OAuth | Firebase Identity or Auth0 | `ENGINEERING_BACKLOG.md` |
| Maps | Google Maps API | `MASTER_CONTEXT.md` |
| Communications | WhatsApp Business API (primary) | `DECISION_LOG.md` DEC-009 |
| File Storage | AWS S3 | `ENGINEERING_BACKLOG.md` |
| Mobile offline | SQLite / Room | `ENGINEERING_BACKLOG.md` |
| Hosting region | AWS or GCP, Middle East | `MASTER_CONTEXT.md` |

### Open Conflicts — Do Not Resolve

**CRITICAL — Payment processor**: `DECISION_LOG.md` DEC-004 names **Paymob** as primary. `FLOWS.md` and `ENGINEERING_BACKLOG.md` reference **Stripe**. Do not write payment integration code until this conflict is resolved by the founder.

**Frontend**: "React or Next.js" — unresolved. Do not build UI until an ADR is written in `docs/architecture/adr/`.

**Backend**: "Node.js or Python" — unresolved. Do not scaffold a backend until an ADR is written.

---

## Business Rules (Non-Negotiable Implementation Constraints)

Source: [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md)

- `BR-ID-01`: No guest accesses checkout and no host accepts listings until KYC status is `VERIFIED`.
- `BR-INV-01`: Atomic calendar isolation — no overlapping confirmed reservations on a single unit. Must use row-level locking.
- `BR-INV-02`: Unit status cannot be `READY_FOR_OCCUPANCY` unless the linked turnover ticket is `CLOSED`.
- `BR-OPS-01`: Checkout event must immediately generate an `UNASSIGNED` turnover ticket.
- `BR-FIN-01`: Guest payment is held in escrow for 24 hours post-check-in before release.
- `BR-FIN-03`: Any error in host tax/routing fields halts all pending payouts instantly.

---

## Experience Thresholds (Acceptance Criteria)

Source: [`docs/03_customer_experience/EXPERIENCE_RULES.md`](docs/03_customer_experience/EXPERIENCE_RULES.md)

- Booking complete in ≤ 3 clicks / ≤ 3 screens
- Search results in ≤ 2 seconds
- WhatsApp/chat initial response ≤ 30 seconds
- Refund processed ≤ 24 hours
- Dispute resolution ≤ 15 minutes (initial contact to solution)

---

## Code Standards

Full rules: [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md)

- Python tools: ruff (linting), mypy (type checking), pytest (tests)
- No feature flags, no backwards-compatibility shims
- Comments only when WHY is non-obvious
- All commits: `type(scope): message` format per [`docs/standards/commit_conventions.md`](docs/standards/commit_conventions.md)
- Test coverage target: ≥ 80% for tools

---

## Actors / Personas (Who Uses the System)

Source: [`docs/02_product/USER_STORIES.md`](docs/02_product/USER_STORIES.md)

| Persona | Key Stories |
|---------|------------|
| Guest | US-G01 (search), US-G02 (auth/KYC), US-G03 (booking), US-G04 (in-stay), US-G05 (review) |
| Host/PM | US-H01 (listing), US-H02 (PMS calendar), US-H03 (pricing), US-H04 (workforce automation) |
| Field Staff | US-F01 (task queue), US-F02 (task validation), US-F03 (inventory), US-F04 (offline) |
| Finance | US-FI01 (ledger audit), US-FI02 (payout management) |
