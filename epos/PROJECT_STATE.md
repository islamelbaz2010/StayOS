# PROJECT STATE — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Last Updated**: 2026-08-14
**Updated By**: EPOS Session 005
**Source**: git log, MANAGEMENT_SITUATION_ANALYSIS.md, PRODUCT_VERSION_ROADMAP_AUDIT.md, .ai/CURRENT/SPRINT_MEMORY.md

---

## Current Phase

**Code-Complete Pre-Alpha — Closed Alpha Imminent**
**Status**: Engineering ~88–90% complete. Operational execution: 0%. No deployed environment. No real users.
**Phase 0 Gate**: Still formally ACTIVE (10 transactions + 80 interviews not confirmed). In practice, the project has proceeded to full implementation.

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

---

## Implementation Update — 2026-07-21 (Session 002)

**Current Phase**: Phase 0 — Customer Validation remains ACTIVE; however, implementation sprints FC-01 through FC-07 have been completed in code.

**Status**: All FC-01–FC-07 code is implemented, tested (283 tests passing, 80.42% coverage), lint/type clean (`ruff`/`mypy`), and the package builds successfully.

**Active Sprint**: FC-07 Platform Hardening — COMPLETE.

**New Open Items**:
1. Phase 0 gate conditions (10 real transactions + 80 customer interviews) are still unconfirmed.
2. Payment processor conflict (Paymob vs Stripe) remains open.
3. Governance conflict: Phase 1 application code exists while Phase 0 is not cleared; requires founder/EPOS review.

**Next Required Action**: Resolve governance conflict and proceed to staging/Closed Beta readiness sprint.

---

## Implementation Update — 2026-08-14 (Session 005)

**Current Stage**: Code-Complete Pre-Alpha. Closed Alpha launch originally targeted 2026-08-19.

**FACT — Completed since Session 004 (2026-07-27)**:
- Sprint 3 Waves 1–3 committed: host experience, guest trust signals, gallery, search + maps, manual checkout flow with payment proof upload
- Launch blocker fixes (10 deployment blockers resolved, `GO_LIVE_READINESS_REPORT.md` produced)
- P0 items shipped: CSV import template, import data flow fix, owner outreach WhatsApp/SMS template, default `PENDING_VERIFICATION` status
- Discovery Engine (commit `9fd5f63`, 2026-08-10): OSM/Overpass adapter, Google Places adapter, candidate normalization + deduplication + scoring, admin UI, Alembic migrations 020–021, Celery scheduling, 472 tests passing

**FACT — Uncommitted work this session (2026-08-14)**:
- `src/app/favorites/` — new favorites module (models, router, schemas, services)
- `alembic/versions/022_add_favorites_and_locations.py` — favorites + location data migration
- `src/app/finance/services.py` — commission calculation system (~114 lines added)
- `tests/test_alpha_commission.py` — commission system tests (untracked)
- Auth router: enhancements (~27 lines)
- Bookings: flow improvements + additional tests
- Frontend: login page (OTP UX), admin pending page, listing detail page, layout improvements, ListingMap refactor
- `apps/mobile/` — React Native mobile app scaffold (untracked, not yet integrated)
- `railway.toml` + `startup.sh` — Railway deployment configuration (untracked)
- `apps/web/e2e/transaction/` — E2E transaction test suite (untracked)
- `docker-compose.staging.yml` — staging improvements (23 lines)
- Analysis documents: `MANAGEMENT_SITUATION_ANALYSIS.md`, `PRODUCT_VERSION_ROADMAP_AUDIT.md`, `SUPPLY_PIPELINE_AUDIT.md`, `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` (all 2026-08-14)

**Key Metrics (VERIFIED via codebase)**:
| Layer | Status |
|-------|--------|
| Backend | ~90% complete |
| Frontend | 21 routes built (web) |
| Tests | 472 passing (at last commit `9fd5f63`) |
| Mobile | Scaffold exists (`apps/mobile/`) — not integrated |
| Infrastructure | Defined (Terraform) — NOT provisioned |
| Real environment | None — no staging or production running |
| Real users | Zero |

**Critical Blocker**: No deployed environment. AWS infrastructure not provisioned. Real API credentials not configured (Twilio, Firebase, Paymob, WhatsApp). Platform has never run with real data.

**Active Blockers** (VERIFIED):
1. Infrastructure not provisioned — Terraform defined only; no `terraform apply` executed
2. Real API credentials not in place
3. No staging or production URL exists
4. WhatsApp Business API approval pending (external — Meta)
5. All external service tests are mocked — never tested against real providers

**Open Decisions**:
- Mobile framework: React Native scaffold exists in `apps/mobile/` but no ADR written; founder has not formally decided
- Deployment platform: Railway config (`railway.toml`) created but not activated; AWS Terraform also exists — dual path, no decision

**Next Required Action**: Deploy to a real environment (Railway is faster path). Commit uncommitted work. Provision credentials.

---

## Implementation Update — 2026-08-24 (Session 006)

**Current Stage (revised, live-verified):** Railway backend and Vercel frontend ARE deployed and reachable (confirmed by direct probe this session — supersedes the "no deployed environment" line above, which was accurate as of 2026-08-14 but is now stale). **Real transactions remain at zero** — the blockers are now precisely scoped rather than general.

**FACT — verified via live production probes this session (read-only, no data mutated):**
- OTP (Twilio) is **not configured** in production (`POST /auth/otp/send` → `"OTP provider is not configured"`).
- `POST /auth/dev-token` **is live and functional** in production (environment reports as `staging`) — issued a real signed JWT for the seeded admin account (`seed-admin-0000-0000-000000000001`); this is a working, code-provided bypass for OTP that does not require fixing Twilio to test/operate the rest of the platform.
- S3 photo-presign returns `500 Internal Server Error` in production — AWS credentials are not functional; local `.env`/`.env.staging` AWS/Twilio values are 4–10 character placeholder-length strings, not real credentials.
- CSV import (`POST /import/confirm`, admin-only) accepts external `image_urls` and does **not** depend on S3 — **the first real listing is not blocked by the S3 issue.**
- Guest payment-proof upload has **no non-S3 code path** — this **is** blocked until real AWS credentials exist.

**FACT — discovered this session, previously unknown:** the codebase already contains a complete, dormant Model-A commercial architecture (`src/app/finance/` + `src/app/reservations/`: escrow ledger, wallet, automatic commission split, Paymob/Stripe/internal payout branches) with a real, pre-configured commission rate identical across every environment file (`GUEST_SERVICE_FEE_PCT=4%`, `HOST_COMMISSION_PCT=10%`, `PLATFORM_TAKE_RATE_PCT=2%`). It is inactive only because `STRIPE_SECRET_KEY` is empty everywhere. This resolves the "Payment processor conflict (Paymob vs Stripe)" open item below with new information: **Stripe is not being activated; the dormant module is referenced as evidence only, and the V1 model targets Paymob (unconfirmed) for its long-term automation path, with a fully manual process for the alpha.**

**DECISION — made this session under explicit founder delegation** ("Project Director" authority, session-scoped): StayOS's V1 commercial model, commission rate, cancellation tiers, refund/payment timing rules, and host-authorization process for the first 1–10 listings are now **decided**, not open. Full table: `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1. **Explicitly not decided** (remains with Egyptian legal counsel): whether the Guest→StayOS-account→Host model requires Central Bank of Egypt PSP/PSO licensing (Law 194/2020, EGP 10–30M capital threshold); whether StayOS's KYC (ID + biometric face-match) processing requires Personal Data Protection Center licensing before the **31 October 2026** PDPL compliance deadline; final legal characterization of StayOS's platform role.

**NEW DOCUMENTS — `docs/legal/` (new directory, created this session):** `STAYOS_TERMS_OF_SERVICE_V1_DRAFT.md`, `STAYOS_PRIVACY_POLICY_V1_DRAFT.md`, `STAYOS_HOST_AGREEMENT_V1_DRAFT.md`, `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md`, `LEGAL_GAP_REGISTER.md`, `LEGAL_COUNSEL_REVIEW_CHECKLIST.md`, `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`, `PAYMOB_REQUIREMENTS_REQUEST.md`. All DRAFTS — no legal approval obtained, no legal entity/registration details exist yet to insert.

**FIXED this session (the one code change made, justified as correcting a proven contradiction, not new engineering):** live guest-facing web copy falsely claimed "Escrow Protection — Your payment is held securely until you check in" (`apps/web/messages/en.json`/`ar.json`) — no such mechanism exists in the code. Replaced with accurate "Payment Verification" copy.

**Revised Open Items (supersedes the stale list above where noted):**
1. ~~Payment processor conflict (Paymob vs Stripe)~~ — **superseded**: V1 model decided (Model A, manual for alpha, Paymob-targeted for scale); Stripe not being activated.
2. Real bank/Vodafone Cash account needed to replace the placeholder in payment instructions — **the current single P0 blocker to transaction #1.**
3. Legal entity/registration details needed before a publishable Terms of Service (Consumer Protection Law Art. 37).
4. CBE PSP licensing question, PDPL/KYC licensing question (time-sensitive), platform-role characterization — all `LEGAL COUNSEL REQUIRED`.
5. Deployment platform (Railway vs. AWS), mobile framework ADR, uncommitted diff, Phase 0 gate conditions — **unchanged, not addressed this session.**

**Next Required Action**: Founder obtains a real collection account and sends the finalized Paymob outreach (`docs/legal/PAYMOB_REQUIREMENTS_REQUEST.md`); in parallel, engage Egyptian counsel on the three `LEGAL COUNSEL REQUIRED` items.

---

## Implementation Update — 2026-09-02 (Session 007)

**Current Stage:** Repository governance and product reference benchmark hardening.

**FACT — completed this session:**
- Co-host permissions integrated across `src/app/listings/services.py` (update, publish, unpublish, archive, submit, calendar rules, photos).
- New host listing detail endpoint `GET /api/v1/host/listings/{unit_id}` combining listing data, photos, readiness, and permission scope.
- Mobile host listing management screens built: `HostListingDetailScreen`, `HostListingEditorScreen`, `HostListingPhotosScreen`, `HostListingAvailabilityScreen`, `HostListingCoHostsScreen`, `HostCreateListingScreen`.
- Mobile `HostListingsScreen` updated with real actions, readiness display, and navigation.
- 11 new backend tests added for co-host permission enforcement on listing operations.
- Quality gates passed: ruff, mypy, pytest (635 passed, 3 pre-existing discovery failures), mobile TypeScript (`tsc --noEmit`), OpenAPI schema regenerated.

**NEW GOVERNANCE DOCUMENTS — `docs/governance/`:**
- `REFERENCE_PRODUCT_BENCHMARK.md` — consolidates approved findings from existing competitor research and product strategy documents into 30 reference domains.
- `AGENT_EXECUTION_RULE.md` — defines the source-of-truth hierarchy and agent execution rules.

**NO NEW COMPETITOR RESEARCH PERFORMED.** All benchmark content traces to documents already in the repository.

**Revised Open Items (supersedes the stale list above where noted):**
1. Real bank/Vodafone Cash account needed to replace the placeholder in payment instructions — **the current single P0 blocker to transaction #1.**
2. Legal entity/registration details needed before a publishable Terms of Service (Consumer Protection Law Art. 37).
3. CBE PSP licensing question, PDPL/KYC licensing question (time-sensitive), platform-role characterization — all `LEGAL COUNSEL REQUIRED`.
4. Phase 0 gate conditions (10 real transactions + 80 customer interviews) still unconfirmed.

**Next Required Action:** Founder provides real collection account and legal entity details; engineering can then finalize payment instructions and proceed to transaction #1.
