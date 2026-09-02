# EPOS KNOWLEDGE BASE — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Created**: 2026-07-21
**Imported By**: EPOS Onboarding Session 001
**Import Date**: 2026-07-21

All entries reference original source documents. No content is duplicated here.

---

## KB-001: Project Identity

**Original Source**: `MASTER_CONTEXT.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

StayOS is an AI-powered, two-sided accommodation marketplace for MENA. "OS" is a business metaphor — the operating system of accommodation. Not a computer OS. Core layers: Trust Infrastructure, Arabic-First Marketplace, Local Payment Rails, AI Intelligence, B2B Supply Tools.

---

## KB-002: Target Market

**Original Source**: `MASTER_CONTEXT.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

Primary entry market: Egypt. Primary business: Egypt-GCC travel corridor. TAM Egypt online accommodation: $200M–$400M (2026). GCC corridor TAM: $300M–$800M. Not Egypt-only venture. GCC expansion is Phase 3.

---

## KB-003: Phase -1 Complete

**Original Source**: `ROADMAP.md`, `docs/phase--1/`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

21 documents produced by simulated executive panel. 600+ risks catalogued. 100+ assumptions rated. 14 critical flaws documented. Panel verdict: **Conditional Go**. "Buildable. Likely to fail in current form. Proceed to Phase 0 with eyes open."

---

## KB-004: Phase 0 Gate Conditions

**Original Source**: `docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

Phase 0 unlocks Phase 1 when both conditions are met:
- 10 real accommodation transactions facilitated
- 80 customer interviews completed

Current progress: unconfirmed (no verified data in memory files).

---

## KB-005: Confirmed Strategic Decisions

**Original Source**: `DECISION_LOG.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

Six confirmed decisions. Full text in `DECISION_LOG.md`. Summary:

- DEC-001: Accommodation marketplace identity confirmed
- DEC-002: Egypt proof-of-concept; GCC is the business
- DEC-003: Arabic-first UX
- DEC-004: Paymob as primary payment processor (conflict exists — see KB-006)
- DEC-005: B2B2C supply strategy
- DEC-006: Trust before scale

---

## KB-006: Active Conflict — Payment Processor

**Original Source**: `DECISION_LOG.md` DEC-004, `FLOWS.md`, `TECH_STACK.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

DECISION_LOG.md DEC-004 specifies Paymob as primary payment processor. FLOWS.md and ENGINEERING_BACKLOG.md reference Stripe. This conflict is documented but unresolved. AI agents must not pick a side. Report and await founder instruction.

---

## KB-007: Phase 0 Governance Decisions

**Original Source**: `SPRINT_MEMORY.md`, `MASTER_PROJECT_MEMORY.md`
**Original Date**: 2026-07-20
**Imported By**: EPOS
**Import Date**: 2026-07-21

Founder confirmed: persistent Project Memory required to prevent lost decisions and roadmap drift. Future work must be validated against previous decisions. Conversation history alone is insufficient as long-term knowledge store.

---

## KB-008: Phase 0 Permitted Work

**Original Source**: `CLAUDE.md`, `AGENTS.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

In Phase 0, the following are permitted:
- Documentation and governance files
- CI/CD workflows (`.github/workflows/`)
- Python tooling (`tools/`) with pytest coverage ≥ 80%
- Architecture decision records (`docs/architecture/adr/`)
- Infrastructure-as-code scaffolding (no execution)
- Test fixtures and schema definitions (no live database)

Not permitted: `src/` application code for Phase 1 features.

---

## KB-009: Repository Layout

**Original Source**: `CLAUDE.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

Key paths:
- `/` — Root strategy and AI context files
- `docs/phase--1/` — Read-only (21 founder discovery docs)
- `docs/02_product/` — Product spec, features, backlog
- `docs/architecture/adr/` — Write ADRs here
- `tools/` — Python scripts (CI-tested)
- `archive/` — Do not read or cite

---

## KB-010: Unresolved Architectural Questions

**Original Source**: `MASTER_CONTEXT.md`, `TECH_STACK.md`
**Original Date**: 2026-07-13
**Imported By**: EPOS
**Import Date**: 2026-07-21

- Frontend framework: "React or Next.js" — awaiting first ADR
- Backend language: "Node.js or Python" — awaiting first ADR

These are intentionally open and must not be resolved without an ADR.

---

## KB-011: FastAPI Request Generic Typing and Dependency Injection

**Original Source**: Session 002 — `src/app/security/rate_limit.py`, `src/app/auth/router.py`
**Original Date**: 2026-07-21
**Imported By**: Session 002
**Import Date**: 2026-07-21

FastAPI dependency injection does not accept `Request[Any]`. Use plain `Request` and add `# type: ignore[type-arg]` to satisfy strict mypy. Dependencies used only for side effects should return `None`.

---

## KB-012: PII Masking Must Preserve Log Record Argument Types

**Original Source**: Session 002 — `src/app/security/logging.py`
**Original Date**: 2026-07-21
**Imported By**: Session 002
**Import Date**: 2026-07-21

When masking PII in `logging.LogRecord.args`, only mask string arguments. Converting all args to strings breaks `%d` and other numeric format specifiers.

---

## KB-013: Resolve Provider Functions by Name for Testability

**Original Source**: Session 002 — `src/app/notifications/services.py`
**Original Date**: 2026-07-21
**Imported By**: Session 002
**Import Date**: 2026-07-21

Storing provider callables directly in a dispatcher registry captures function references at import time, making monkeypatching in tests unreliable. Store provider function names and resolve with `getattr` at dispatch time.

---

## KB-014: Rate Limit Testing Requires Environment Patch

**Original Source**: Session 002 — `tests/test_security.py`
**Original Date**: 2026-07-21
**Imported By**: Session 002
**Import Date**: 2026-07-21

Rate limiting should be disabled in `test` environment for speed. To test the Redis enforcement branch, patch `settings.ENVIRONMENT` to `development` (or non-test) and provide a mocked Redis client.

---

## KB-015: Calendar Concurrency via Exclusion Constraints

**Original Source**: Session 002 — `alembic/versions/009_add_calendar_exclusion.py`, `src/app/reservations/repository.py`
**Original Date**: 2026-07-21
**Imported By**: Session 002
**Import Date**: 2026-07-21

PostgreSQL exclusion constraints on `tsrange` are the safest way to prevent overlapping HOLD/BOOKED calendar rules. Application code should catch `IntegrityError` and translate it into a domain `ConflictError`.

---

## KB-016: Two Parallel Commercial Architectures Exist — Check Before Assuming "No Commission Mechanism"

**Original Source**: Session 006 — `src/app/finance/`, `src/app/reservations/` vs. `src/app/bookings/`, `src/app/payments/`
**Original Date**: 2026-08-24
**Imported By**: Session 006
**Import Date**: 2026-08-24

Before concluding a business rule "doesn't exist in the code," check for a dormant parallel module — a prior sprint may have built the real thing and just never wired it to the live-facing flow. Here, the live `bookings`+`payments` manual-payment flow has zero commission logic, but a complete escrow/wallet/commission-split/payout system already exists in `finance`+`reservations`, inactive only because `STRIPE_SECRET_KEY` is unset. The commission rate itself (`GUEST_SERVICE_FEE_PCT`, `HOST_COMMISSION_PCT`, `PLATFORM_TAKE_RATE_PCT`) was also already configured, identically, across every `.env*` file — a real decision someone made, not a placeholder. Lesson: grep broadly (`config.py`, all env files, dormant-looking modules) before telling a founder a number needs to be invented — it may already exist, just unconnected.

---

## KB-017: A Fixed, Hardcoded Payment-Instructions String Is a Design Signal, Not a Bug

**Original Source**: Session 006 — `src/app/payments/services.py` `_build_instructions`
**Original Date**: 2026-08-24
**Imported By**: Session 006
**Import Date**: 2026-08-24

The guest-facing manual payment instructions showed one fixed bank account (a placeholder, but structurally *one* account, not per-host) — and no host-bank-account field exists anywhere except on the payout side (`finance.PayoutRequest.bank_account_info`, populated only when StayOS pays a Host, never when a Guest pays a Host). Together these prove the product's payment model was always "Guest pays StayOS, StayOS pays Host" (Model A), not "Guest pays Host directly" — even though nothing in any prior document had stated this explicitly. When a payment/instruction field looks suspiciously generic or placeholder-like, check whether the *data model* supports the alternative reading before assuming it's simply unfinished in an unintentional direction.

---

## KB-018: Official Reference Product Benchmark Established

**Original Source**: `docs/governance/REFERENCE_PRODUCT_BENCHMARK.md`, `docs/governance/AGENT_EXECUTION_RULE.md`
**Original Date**: 2026-09-02
**Imported By**: Repository Governance Session
**Import Date**: 2026-09-02

StayOS now has a permanent, version-controlled Official Reference Product Benchmark in `docs/governance/REFERENCE_PRODUCT_BENCHMARK.md`. It consolidates approved findings from existing competitor research and product strategy documents into 30 reference domains. `docs/governance/AGENT_EXECUTION_RULE.md` defines the source-of-truth hierarchy and agent execution rules. No new competitor research was performed.

Source-of-truth hierarchy:
1. Founder Decisions
2. StayOS PRD
3. Reference Product Benchmark
4. Current Repository
5. Execution Prompts

---

## KB-019: Co-host Permissions Integrated Across Listing Operations

**Original Source**: Session 007 — `src/app/listings/services.py`, `src/app/host/`
**Original Date**: 2026-09-02
**Imported By**: Session 007
**Import Date**: 2026-09-02

Co-host permissions from `app.host.permissions` are now enforced across the listing services: update, publish, unpublish, archive, submit, calendar rules, and photo management. A new host-facing listing detail endpoint (`GET /api/v1/host/listings/{unit_id}`) returns listing + photos + readiness + permission scope. Mobile host screens (`HostListing*`, `HostCreateListing`) were added to manage listings end-to-end. Eleven backend tests cover co-host permission enforcement.
