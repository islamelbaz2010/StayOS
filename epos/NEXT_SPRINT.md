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

---

## Updated Next Sprint — Closed Alpha Launch (2026-08-14)

**Sprint Theme**: Deploy to real environment and execute first real transaction.

**Single Highest-Value Action**: Commit uncommitted work → choose Railway or AWS → deploy → configure credentials → onboard first host → get first listing live.

**Immediate Actions (ordered)**:

| Priority | Action | Rationale |
|---|---|---|
| P0 | Commit the uncommitted 35-file diff | Work is lost if not committed; git is the single source of truth |
| P0 | Founder decides: Railway or AWS for Closed Alpha | Two deployment configs exist; cannot proceed until one is chosen |
| P0 | Deploy chosen environment and verify health endpoints | No real environment = no Closed Alpha |
| P0 | Configure real credentials (Twilio, Firebase, Paymob/Stripe, WhatsApp) | All external integrations are mocked |
| P1 | Run alembic migrations on live database | |
| P1 | Run seed script on staging | |
| P1 | End-to-end test: import listing → approve → search → book → payment → confirm | Verify full loop with real data |
| P1 | Onboard first real host | Core marketplace metric |
| P2 | Write ADR for mobile framework (React Native scaffold exists in `apps/mobile/`) | Unblocks mobile development |
| P2 | Write ADR for deployment platform (whichever is NOT chosen above) | Clears open decision |

**What must NOT be done before committing + deploying**:
- Do not add new features
- Do not redesign completed flows
- Do not write new documents that reanalyze the same state already documented in MANAGEMENT_SITUATION_ANALYSIS.md + PRODUCT_VERSION_ROADMAP_AUDIT.md

---

## Prior Next Sprint — Closed Beta Readiness (Post FC-07)

**Sprint Theme**: Staging deployment and Closed Beta readiness verification.

**Objective**: Deploy the hardened platform to staging and verify operational, security, and performance readiness.

**Scope**:
- Apply all migrations up to `010_add_notifications_and_security.py` on staging.
- Validate health, metrics, and version endpoints.
- Test notification delivery end-to-end (WhatsApp/Email/SMS) in staging.
- Verify backup and restore scripts against staging data.
- Conduct security review of rate limiting, audit logs, and secrets management.
- Prepare operational runbooks for incident response.

**Exclusions**:
- No new customer-facing features.
- No production deployment until readiness gates pass.

**Acceptance Criteria**:
- All migrations apply cleanly.
- `/health`, `/metrics`, `/version` respond within SLA.
- At least one notification channel delivers successfully end-to-end.
- Backup/restore scripts verified.
- No critical/high security findings.

**Risks**:
- Staging environment differences.
- Provider credential availability (Twilio, SES, Meta WhatsApp).
- Sentry/Redis availability and configuration.
- Governance conflict around Phase 0/Phase 1 boundary.

**Dependencies**:
- Staging Postgres 16 + PostGIS, Redis, Celery worker.
- Provider credentials and Sentry DSN.
- Founder decision on governance conflict and payment processor.

---

## Updated Next Sprint — First Real Transaction (2026-08-24, Session 006)

**Sprint Theme**: Clear the last founder/legal-counsel blockers standing between the current live Railway/Vercel deployment and one real, paid, closed-alpha transaction. Engineering is not the constraint — see `epos/PROJECT_STATE.md` Session 006 update and `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` for full evidence.

**Single Highest-Value Action**: Founder obtains a real bank/Vodafone Cash account and puts it into the payment instructions (currently a fake placeholder) — this is the one item nothing else in the sequence can substitute for.

**Immediate Actions (ordered)**:

| Priority | Action | Owner | Rationale |
|---|---|---|---|
| P0 | Obtain a real collection account; replace the placeholder in `_MANUAL_INSTRUCTIONS_*` | Founder (content) | No real payment can complete without it |
| P0 | Obtain legal entity/registration details | Founder | Required for a publishable Terms of Service (Consumer Protection Law Art. 37) |
| P0 | Engage Egyptian counsel on: CBE PSP licensing of the chosen payment model, PDPL/KYC licensing (deadline 31 Oct 2026), platform-role characterization | Founder → Legal Counsel | Three genuine open legal questions, not business decisions |
| P0 | Populate `refund_days=5` at the notification call site | Engineering | Tiny, scoped, prevents a broken/empty guest-facing message |
| P1 | Provision real AWS credentials (S3 buckets + IAM user per `docs/legal`-adjacent handoff produced this session — actually filed under the AWS S3 handoff, not `docs/legal/`) | Founder + Engineering | Needed for payment-proof upload and in-app KYC upload; NOT needed for the first listing |
| P1 | Confirm real Twilio-or-Akedly OTP credentials in Railway (Akedly is the closed decision — see prior session) | Founder | Normal guest login currently broken; `/auth/dev-token` is a working interim bypass |
| P1 | Send the finalized Paymob outreach (`docs/legal/PAYMOB_REQUIREMENTS_REQUEST.md`) | Founder | Long-term automated payout path |
| P1 | Build a refund-calculation function matching the decided cancellation tiers | Engineering | Not needed for a manually-computed 1–10-transaction alpha |
| P2 | Everything already listed under "Closed Alpha Launch (2026-08-14)" above that's still unaddressed (deployment platform choice, mobile ADR, 188-line uncommitted diff) | Founder/Engineering | Unchanged by this session |

**What must NOT be done**: implement Paymob, Stripe, AWS/S3 changes, or Akedly this sprint (all explicitly deferred by founder instruction in Session 006); re-litigate the 14 V1 commercial decisions made in Session 006 without new evidence; reorganize the repository or re-audit it generally.
