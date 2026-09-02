# EPOS WORKING MEMORY — StayOS

**EPOS Registry ID**: EPOS-PROJ-001
**Session**: Session 001
**Session Date**: 2026-07-21
**Session Theme**: EPOS Onboarding

---

## Active Context

**Current Branch**: `tooling/repository-intelligence`
**Current Phase**: Phase 0 — Customer Validation (ACTIVE)
**Active Sprint Theme**: Repository governance and intelligence tooling

---

## This Session — Work Completed

| # | Task | Status |
|---|------|--------|
| 1 | Verify MASTER_PROJECT_MEMORY.md and SPRINT_MEMORY.md exist | ✅ Complete |
| 2 | Operational Gap Check against EPOS requirements | ✅ Complete |
| 3 | Create epos/REGISTRY.md | ✅ Complete |
| 4 | Create epos/PROJECT_STATE.md | ✅ Complete |
| 5 | Create epos/AUTHORITY.md | ✅ Complete |
| 6 | Create epos/KNOWLEDGE_BASE.md | ✅ Complete |
| 7 | Create epos/STARTUP_PROTOCOL.md | ✅ Complete |
| 8 | Create epos/SHUTDOWN_PROTOCOL.md | ✅ Complete |
| 9 | Create epos/WORKING_MEMORY.md | ✅ Complete |
| 10 | Create epos/NEXT_SPRINT.md | ✅ Complete |
| 11 | Create epos/PROJECT_REVIEW.md | ✅ Complete |
| 12 | Create epos/SESSION_RECORD.md | ✅ Complete |
| 13 | Execute real project task (ADR-001) | ✅ Complete |
| 14 | Produce Runtime Validation Report | ✅ Complete |

---

## This Session — Decisions Made

No new product or strategic decisions were made this session.

EPOS governance was adopted as an operational layer on top of the existing project. This is an operational decision, not a product decision.

---

## This Session — Issues Found

| # | Issue | Severity | Action |
|---|-------|----------|--------|
| 1 | MASTER_PROJECT_MEMORY.md `Project` field is `UNKNOWN` | Medium | Update in next session or now |
| 2 | Payment processor conflict (Paymob vs Stripe) | High | Await founder decision — do not resolve |
| 3 | Phase 0 gate progress (transactions/interviews) is unknown | High | Founder to report progress |
| 4 | Frontend and backend framework unresolved | Medium | Await ADRs |
| 5 | SPRINT_MEMORY.md captures governance intent only; no product sprint state | Medium | Normal — governance sprint was recent |

---

## Open Questions Carried Forward

1. How many Phase 0 transactions have been completed? (Gate: 10)
2. How many customer interviews have been completed? (Gate: 80)
3. Is the Paymob vs Stripe conflict resolved or still open?
4. What is the next sprint theme after `tooling/repository-intelligence`?

---

## Files Modified This Session

All files created new. No existing project files were modified.

```
epos/REGISTRY.md           — Created
epos/PROJECT_STATE.md      — Created
epos/AUTHORITY.md          — Created
epos/KNOWLEDGE_BASE.md     — Created
epos/STARTUP_PROTOCOL.md   — Created
epos/SHUTDOWN_PROTOCOL.md  — Created
epos/WORKING_MEMORY.md     — Created
epos/NEXT_SPRINT.md        — Created
epos/PROJECT_REVIEW.md     — Created
epos/SESSION_RECORD.md     — Created
docs/architecture/adr/ADR-016-epos-governance-adoption.md — Created
```

---

## Session 002 — 2026-07-21

### Active Context

**Current Branch**: `main`  
**Current Phase**: Phase 0 — Customer Validation (ACTIVE) / Implementation sprints FC-01–FC-07 completed  
**Active Sprint Theme**: FC-07 Platform Hardening for Closed Beta

### This Session — Work Completed

| # | Task | Status |
|---|------|--------|
| 1 | Complete FC-07 Platform Hardening (calendar concurrency, notifications, security, operations) | ✅ Complete |
| 2 | Resolve ruff/mypy errors across `src/` and `tests/` | ✅ Complete |
| 3 | Add/update tests for hardening features; reach ≥80% coverage | ✅ Complete |
| 4 | Run `pytest tests` (283 passed, 80.42% coverage) | ✅ Complete |
| 5 | Build wheel/sdist with `python3 -m build` | ✅ Complete |
| 6 | Execute `END_SESSION.md` and update EPOS memory files | ✅ Complete |

### This Session — Decisions Made

- Technical: PostgreSQL exclusion constraints enforce calendar concurrency at the database level.
- Technical: Notification providers are resolved by name at dispatch time to support testing and avoid stale references.
- Technical: `Request[Any]` is not compatible with FastAPI dependency injection; use plain `Request` with `# type: ignore[type-arg]`.
- Technical: PII log filter preserves non-string `LogRecord.args` to avoid breaking `%d` formatting.

### This Session — Issues Found

| # | Issue | Severity | Action |
|---|-------|----------|--------|
| 1 | Phase 0 gates (10 transactions / 80 interviews) status still unknown | High | Founder to report |
| 2 | Payment processor conflict (Paymob vs Stripe) remains open | High | Await founder decision |
| 3 | **Governance conflict**: Phase 1 application code (FC-01–FC-07) was implemented while Phase 0 is still ACTIVE per `AUTHORITY.md` | High | Flag for founder/EPOS review |
| 4 | MASTER_PROJECT_MEMORY.md `Project` field still `UNKNOWN` | Medium | Update with delta; founder to confirm |

### Open Questions Carried Forward

1. Are Phase 0 gate conditions cleared, or should implementation be rolled back/reconciled with `AUTHORITY.md`?
2. Which payment processor will be primary in production?
3. Is the next sprint staging/Closed Beta readiness or governance reconciliation?

---

## Session 003 — 2026-07-26 → 2026-07-27

### Active Context

**Current Branch**: `tooling/repository-intelligence`
**Current Phase**: Phase 0 — Customer Validation (ACTIVE)
**Active Sprint Theme**: Bootstrap only — no active sprint work this session

### This Session — Work Completed

| # | Task | Status |
|---|------|--------|
| 1 | Execute START_SESSION.md (verify structure, load files, write startup log) | ✅ Complete |
| 2 | Execute END_SESSION.md (write session record, update working memory, write session log) | ✅ Complete |

### This Session — Decisions Made

None.

### This Session — Issues Found

No new issues. Blockers carried forward unchanged from Session 002.

### Open Questions Carried Forward

1. Are Phase 0 gate conditions cleared?
2. Which payment processor is primary?
3. Is the next active sprint Closed Beta staging readiness or governance reconciliation?

### Files Modified This Session

- `epos/SESSION_RECORD.md` — Session 003 appended
- `epos/WORKING_MEMORY.md` — Session 003 appended
- `.ai/LOGS/startup-2026-07-26.md` — Created
- `.ai/LOGS/session-2026-07-27.md` — Created

### Files Modified This Session

Source code and tests:
- `src/app/reservations/repository.py`
- `src/app/notifications/*`
- `src/app/security/*`
- `src/app/operations/metrics.py`
- `src/app/main.py`
- `src/app/auth/router.py`
- `src/app/celery_app.py`
- `alembic/versions/009_add_calendar_exclusion.py`
- `alembic/versions/010_add_notifications_and_security.py`
- `scripts/backup.py`
- `scripts/restore_verify.py`
- `tests/test_*.py`
- `SPRINT_MEMORY.md` (root)
- `.ai/CURRENT/SPRINT_MEMORY.md`

AI memory:
- `epos/WORKING_MEMORY.md`
- `epos/PROJECT_STATE.md`
- `epos/NEXT_SPRINT.md`
- `epos/KNOWLEDGE_BASE.md`
- `epos/SESSION_RECORD.md`
- `epos/REGISTRY.md`
- `.ai/CURRENT/DECISION_LOG.md`
- `.ai/CURRENT/MASTER_PROJECT_MEMORY.md`
- `.ai/EXPORT/AI_READY/StayOS/SOURCE_INDEX.md`
- `.ai/LOGS/session-2026-07-21.md`

---

## Session 004 — 2026-07-27

### Work Completed

| # | Task | Status |
|---|------|--------|
| 1 | Create STAYOS_IMPLEMENTATION_BASELINE.md (17 sections, 1,354 lines) | ✅ Complete |
| 2 | Append Session 004 to SPRINT_MEMORY.md | ✅ Complete |
| 3 | Append Section 24 to MASTER_PROJECT_MEMORY.md | ✅ Complete |
| 4 | Append Session 004 to session-2026-07-27.md | ✅ Complete |
| 5 | Append Session 004 to epos/SESSION_RECORD.md | ✅ Complete |
| 6 | Update epos/WORKING_MEMORY.md | ✅ Complete |

### Current Project State

| Layer | Completeness | Notes |
|-------|-------------|-------|
| Design Specs | 100% | 10 documents, frozen |
| Backend | 78% | Core done; messaging/reviews/FCM/photos missing |
| Web Frontend | 5% | Next.js scaffold only |
| Mobile | 0% | Framework not chosen (Day-1 blocker) |
| Infrastructure | 40% | Terraform defined, not provisioned |
| Implementation Baseline | COMPLETE | Awaiting founder signature |

### Day-1 Actions Required (Development Start Gate)

1. Founder signs `STAYOS_IMPLEMENTATION_BASELINE.md`
2. Mobile framework chosen (Flutter recommended)
3. `terraform apply` in me-south-1
4. GitHub Secrets configured

### Active Blockers

13 total blockers documented in `STAYOS_IMPLEMENTATION_BASELINE.md` Section 17.3.

### Files Modified This Session

| File | Action |
|------|--------|
| `STAYOS_IMPLEMENTATION_BASELINE.md` | **CREATED** |
| `.ai/CURRENT/SPRINT_MEMORY.md` | Session 004 delta appended |
| `.ai/CURRENT/MASTER_PROJECT_MEMORY.md` | Section 24 appended |
| `.ai/LOGS/session-2026-07-27.md` | Session 004 appended |
| `epos/SESSION_RECORD.md` | Session 004 appended |
| `epos/WORKING_MEMORY.md` | Session 004 appended |

---

## Session 005 — 2026-08-14

### Active Context

**Current Branch**: `tooling/repository-intelligence`
**HEAD Commit**: `9fd5f63` (2026-08-10) — discovery engine
**Current Stage**: Code-Complete Pre-Alpha. Closed Alpha targeted 2026-08-19.
**Uncommitted Changes**: 35 modified tracked files + 10+ new untracked files (see SESSION_RECORD.md Session 005)

### This Session — Work Completed

| # | Task | Status |
|---|------|--------|
| 1 | Produce MANAGEMENT_SITUATION_ANALYSIS.md (situational snapshot) | ✅ Complete (untracked) |
| 2 | Produce PRODUCT_VERSION_ROADMAP_AUDIT.md (V1 audit) | ✅ Complete (untracked) |
| 3 | Produce SUPPLY_PIPELINE_AUDIT.md (supply chain verification) | ✅ Complete (untracked) |
| 4 | Produce SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md | ✅ Complete (untracked) |
| 5 | Implement favorites module (backend + migration 022) | ✅ Coded, NOT committed |
| 6 | Implement commission calculation system (finance/services.py + tests) | ✅ Coded, NOT committed |
| 7 | Auth, bookings, listings, payments enhancements | ✅ Coded, NOT committed |
| 8 | Frontend improvements (login, admin, listing detail, layouts) | ✅ Coded, NOT committed |
| 9 | Create Railway deployment config (railway.toml + startup.sh) | ✅ Coded, NOT committed |
| 10 | Create mobile app scaffold (apps/mobile/) | ✅ Coded, NOT committed |
| 11 | Create E2E transaction tests | ✅ Coded, NOT committed |
| 12 | Update EPOS continuity files (this session close) | ✅ Complete |

### This Session — Decisions Made

None. Two open decisions created:
1. Deployment platform: Railway vs AWS (both prepared, no founder decision)
2. Mobile framework: React Native scaffold exists, no ADR

### This Session — Issues Found

| # | Issue | Severity |
|---|---|---|
| 1 | No deployed environment | CRITICAL |
| 2 | 35 files uncommitted | HIGH |
| 3 | Dual deployment path, no decision | HIGH |
| 4 | Mobile scaffold without framework ADR | HIGH |
| 5 | Closed Alpha gate missed (targeted 2026-08-19, 0% operational) | CRITICAL |

### Files Modified This Session (EPOS only)

| File | Action |
|---|---|
| `epos/PROJECT_STATE.md` | Updated: phase, metrics, Session 005 block appended |
| `epos/SESSION_RECORD.md` | Session 005 appended |
| `epos/WORKING_MEMORY.md` | Session 005 appended (this entry) |
| `epos/NEXT_SPRINT.md` | Updated: current priorities |
| `/Users/ahmed/.claude/projects/…/memory/MEMORY.md` | Updated: project state pointer |
| `/Users/ahmed/.claude/projects/…/memory/project_implementation_baseline.md` | Updated: current metrics |

---

## Session 006 — 2026-08-24 — P0 Readiness + Legal + Commercial Decision Sprint

**Current Branch**: `tooling/repository-intelligence` (unchanged)
**Session shape**: four linked founder-directed sprints in one session — (1) P0 real-transaction-readiness diagnostic, (2) AWS S3 handoff prep, (3) legal-document drafting, (4) commercial payment-model decision + document reconciliation. No commits made; all work is new/edited files sitting uncommitted alongside the pre-existing diff from prior sessions.

### This Session — Work Completed

| # | Task | Status |
|---|------|--------|
| 1 | Live diagnostic probes against Railway production (`/auth/otp/send`, `/auth/dev-token`, `/listings/.../photos/presign`) | ✅ Complete — read-only, no data mutated |
| 2 | Confirmed OTP (Twilio) not configured in production; confirmed `/auth/dev-token` bypass works (seed admin account) | ✅ Confirmed FACT |
| 3 | Confirmed S3 presign returns 500 in production; confirmed CSV import bypasses S3 via `image_urls` | ✅ Confirmed FACT |
| 4 | Airbnb/Booking.com legitimate-integration research | ✅ Complete — both classified FUTURE CHANNEL, no code written |
| 5 | AWS S3 production handoff document (architecture, IAM, bucket, Railway vars, provider message) | ✅ Complete — no AWS resources created |
| 6 | Egyptian legal/regulatory research (PDPL 151/2020 + Nov 2025 Executive Regs, Consumer Protection Law 181/2018, CBE payment-licensing rules) | ✅ Complete |
| 7 | Created `docs/legal/` — 6 bilingual (EN/AR) draft documents: Terms of Service, Privacy Policy, Host Agreement, Cancellation & Refund Policy, Legal Gap Register, Legal Counsel Review Checklist | ✅ Complete — DRAFTS, not legally approved |
| 8 | Discovered dormant `finance`/`reservations` module already implements full escrow/wallet/commission-split/payout architecture (Model A), inactive only because `STRIPE_SECRET_KEY` is unset | ✅ Confirmed FACT |
| 9 | Discovered real, pre-configured commission rate in code: `GUEST_SERVICE_FEE_PCT=0.04`, `HOST_COMMISSION_PCT=0.10`, `PLATFORM_TAKE_RATE_PCT=0.02` — identical across all env files | ✅ Confirmed FACT |
| 10 | Payment & Commission Policy + Paymob Requirements Request documents created | ✅ Complete — Paymob not contacted, not integrated |
| 11 | Fixed live false "Escrow Protection — held until check-in" guest-facing copy (no such mechanism exists in code) | ✅ Fixed — `apps/web/messages/{en,ar}.json`, copy-only |
| 12 | Legal & Commercial Decision Gate — made 14 previously-open business decisions (commission, cancellation tiers, refund timing, payment deadline, proof resubmission, host-cancellation treatment, no-show, duplicate payment, payout timing, service-fee refundability, V1 host-authorization process) under explicit founder delegation in this session | ✅ Complete — see Decisions Made below |
| 13 | Reconciled all 6 legal/commercial documents to be internally consistent with the above decisions | ✅ Complete |

### This Session — Decisions Made

**Session-confirmed under explicit in-session founder delegation** ("You are authorized to make BUSINESS/PRODUCT decisions... DO NOT ASK ME TO MAKE THE BUSINESS DECISIONS AGAIN") — these are Project-Director-level product/commercial decisions, not yet a separate formal `DECISION_LOG.md`-style founder ratification distinct from this session. Full table: `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1.

1. V1 commercial architecture = Model A: Guest → StayOS-controlled account → StayOS verifies → deducts commission → pays Host net.
2. Commission: 10% host + 2% platform + 4% guest (kept as-found in code, adopted as official).
3. Cancellation tiers: Flexible/Moderate/Strict = 24h/5d/1wk before check-in → 100%/100%/50% accommodation refund (adopted from existing live UI copy).
4. Guest service fee: non-refundable on guest-initiated cancellation; refundable in full otherwise.
5. Refund timing: 5 business days. Payment deadline: 24h post-acceptance. Proof resubmission: 3 attempts/48h. Host payout timing: 3 business days post-verification.
6. Host cancellation / property-unavailable / host no-show: 100% guest refund, no StayOS commission retained, no invented monetary penalty; 2+ host cancellations in alpha triggers manual review.
7. Guest no-show: no refund.
8. V1 host authorization: founder personally confirms ownership for the first 1–10 (personal-network) listings; declaration + identity KYC only thereafter.
9. Preserved as explicitly NOT decided (Project Director authority does not extend here): CBE PSP/payment-facilitator licensing classification, PDPL/KYC licensing obligation, final platform-role (marketplace vs. supplier) legal characterization — all marked `LEGAL COUNSEL REQUIRED`.
10. Paymob, AWS/S3, Stripe, Akedly: explicitly not touched/implemented this session, per founder instruction.

### This Session — Issues Found (new, in addition to prior open items)

| # | Issue | Severity |
|---|---|---|
| 8 | Production OTP (Twilio) confirmed non-functional live — "provider is not configured" | HIGH — blocks normal login, but `/auth/dev-token` bypass exists |
| 9 | Production S3/AWS credentials confirmed non-functional live (500 on presign) — blocks payment-proof upload and in-app KYC upload, does NOT block first listing (CSV import bypass exists) | HIGH |
| 10 | No legal entity/registration exists to disclose per Consumer Protection Law Art. 37 | HIGH — required before real money |
| 11 | Egypt PDPL (151/2020) Executive Regulations compliance deadline is **31 October 2026** — StayOS's KYC (ID + biometric face-match) processing may require PDPC licensing; unresolved | HIGH, time-sensitive |
| 12 | Egypt CBE Law 194/2020 + June 2025 PSP/PSO licensing rules may apply to StayOS's chosen Guest→StayOS-account→Host payment model; unresolved | HIGH |
| 13 | Payment instructions shown to guests point to a fake placeholder bank account (`Bank of Egypt`, `1234567890123456`) — real account required before real money | CRITICAL — this session's single P0 |
| 14 | `{{refund_days}}` notification placeholder now has a decided value (5) but is not yet wired into the (dormant) call site | MEDIUM |

### Files Modified/Created This Session

| File | Action |
|---|---|
| `docs/legal/STAYOS_TERMS_OF_SERVICE_V1_DRAFT.md` | Created, then reconciled |
| `docs/legal/STAYOS_PRIVACY_POLICY_V1_DRAFT.md` | Created |
| `docs/legal/STAYOS_HOST_AGREEMENT_V1_DRAFT.md` | Created, then reconciled |
| `docs/legal/STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` | Created, then rewritten with final decided rules |
| `docs/legal/LEGAL_GAP_REGISTER.md` | Created, then updated (items closed) |
| `docs/legal/LEGAL_COUNSEL_REVIEW_CHECKLIST.md` | Created, then updated (P0 priority section added) |
| `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` | Created, then rewritten as canonical decision source |
| `docs/legal/PAYMOB_REQUIREMENTS_REQUEST.md` | Created, then finalized |
| `apps/web/messages/en.json` | Edited — false escrow copy replaced |
| `apps/web/messages/ar.json` | Edited — false escrow copy replaced |
| `epos/WORKING_MEMORY.md` | Session 006 appended (this entry) |
| `epos/SESSION_RECORD.md`, `epos/PROJECT_STATE.md`, `epos/NEXT_SPRINT.md`, `epos/REGISTRY.md` | Session 006 appended (end-of-session shutdown) |
| `.ai/LOGS/session-2026-08-24.md` | Session log created |

**No git commit, push, or deploy performed.** No AWS/Paymob/Twilio/Akedly credentials created or requested. No production code touched except the two message-file copy edits above.
