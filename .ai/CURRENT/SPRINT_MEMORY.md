# SPRINT_MEMORY.md

---

# SPRINT 0 — Engineering Foundation (Active)
**Authorized**: 2026-07-30 | **Stage-Gate**: STAGE-GATE-001 | **Decision**: GO WITH CONDITIONS
**Branch**: tooling/repository-intelligence

## Tasks Completed (2026-07-30)

| # | Task ID | Description | Commit |
|---|---------|-------------|--------|
| 1 | A-01 | Sign STAYOS_IMPLEMENTATION_BASELINE.md | ✅ |
| 2 | A-02/A-05/A-07/A-08 | Write DEC-011, DEC-012, DEC-014, DEC-015 to DECISION_LOG.md | ✅ |
| 3 | A-04/E-01 partial | Fix Terraform region (me-central-1), HCL syntax, DynamoDB lock table, RDS SSL | ✅ |
| 4 | A-11 | Update stale documents (TECH_STACK.md, MASTER_PROJECT_MEMORY.md, SPRINT_MEMORY.md) | ✅ |
| 5 | BCK-05 | Rewrite rate limiter with atomic Lua script; eliminate 13,865 test warnings | ✅ |
| 6 | BCK-06 | Replace bare `except Exception: pass` with debug logging (audit.py, main.py) | ✅ |
| 7 | FE-03 | Upgrade Next.js 14.0.4 → 14.2.x (1 critical SSRF CVE + 17 high vulns) | ✅ |
| 8 | SEC-04 | Lock CORS to explicit method/header allowlists (no more wildcards) | ✅ |
| 9 | B-01 | Migration 011: pms.unit_photos table + UnitPhoto model | ✅ |
| 10 | B-03 | Migration 012: auth.device_tokens table + DeviceToken model | ✅ |
| 11 | B-05 | Migration 013: analytics schema + listing_views, user_searches, booking_funnel_events | ✅ |
| 12 | B-07 | Surface paymob_iframe_url in ReservationResponse | ✅ |
| 13 | B-09 | Add spawn_recurring_tasks to Celery beat at 06:00 UTC daily | ✅ |
| 14 | B-10 | Migration 014: UNIQUE(unit_id, reservation_id) on property_readiness | ✅ |
| 15 | B-12 | ADR-015 compliance: add currency column to 7 financial/reservation tables (migration 015) | ✅ |
| 16 | B-04 | POST /api/v1/auth/device-token endpoint (upsert, ios/android/web platforms) | ✅ |
| 17 | B-08 | Wire AWS Secrets Manager in secrets.py using boto3 | ✅ |
| 18 | C-01 | Frontend deps: next-intl, TanStack Query, zustand, axios, vitest, Playwright | ✅ |
| 19 | C-02 | Tailwind config with StayOS design tokens (Cairo/Inter/JetBrains Mono, full palette) | ✅ |
| 20 | C-03 | i18n + RTL: middleware.ts, i18n.ts, messages/ar.json + en.json, NextIntlClientProvider | ✅ |
| 21 | C-07 | Layout system: GuestLayout, HostLayout, AuthLayout, Header, Footer | ✅ |
| 22 | C-06 | TanStack Query Providers component wired into [locale]/layout.tsx | ✅ |
| 23 | C-08 | ErrorBoundary, Skeleton, error.tsx, not-found.tsx | ✅ |
| 24 | F-01 | Playwright E2E config: smoke/web/mobile projects + stub specs | ✅ |
| 25 | F-05 | Staging seeder: admin, host, guest, 3 listings, 1 reservation | ✅ |

## Tasks Remaining

### BLOCKED
- A-03 + Track D (Mobile) — ADR-016 founder decision required
- C-04 (Typed API client) — requires staging API running (E-05)
- C-05 (Auth context) — requires C-04
- B-02 (Photo upload API) — requires B-01 + S3 buckets (E-03)
- F-02/F-03/F-04 (smoke test execution) — requires staging running (E-05)

### Infrastructure (not yet executed — Terraform only fixes done)
- E-01 remaining items
- E-02 (ECR repositories)
- E-03 (S3 buckets)
- E-04 (ElastiCache)
- E-05 (Terraform apply + ECS deploy to staging)

## Exit Criteria Status
- EXIT-01: ✅ (baseline signed)
- EXIT-02: ✅ (DEC-011 through DEC-015 written)
- EXIT-04: ✅ (region = me-central-1 everywhere)
- EXIT-03, EXIT-05 through EXIT-23: ⬜ (require staging environment)

---

# Closed Beta Staging Readiness Sprint

## Objective
Prepare StayOS for deployment into a staging environment that mirrors production as closely as possible, enabling the founder to invite the first real hosts and guests. No new customer-facing features, no architecture redesign, and no module refactoring beyond what is required for production deployment.

## Infrastructure Audit Findings (Phase 1)

- `docker-compose.yml` lacked a Celery `beat` service; local development did not exercise scheduled tasks.
- `.env.example` was missing `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, and `STRIPE_WEBHOOK_SECRET`.
- Notification Celery task names (`notifications.process_*`) did not match the beat schedule references (`app.notifications.tasks.process_*`).
- `.env.staging` was not ignored, risking secret leakage if created.
- Terraform `ecs.tf` exposes `DATABASE_URL` and `REDIS_URL` but does not attach all remaining required secrets (Firebase, Twilio, Paymob, Stripe, S3, Sentry, JWT) to the task definitions.
- Terraform RDS uses `postgres` engine without an explicit PostGIS parameter group; migration `CREATE EXTENSION postgis` must be verified on RDS before production.
- `app.security.secrets.SecretsManager` AWS backend is a placeholder and cannot retrieve secrets from AWS Secrets Manager at runtime.

## Deployment Artifacts Generated (Phase 2)

- `docker-compose.staging.yml` - staging services with health checks, resource limits, dependency ordering, and a one-off `migrate` service.
- `.env.staging.example` - complete template for all required environment variables.
- `scripts/staging_start.sh` - build + migrate + start.
- `scripts/staging_stop.sh` - graceful stop.
- `scripts/staging_migrate.sh` - Alembic migrations.
- `scripts/staging_rollback.sh` - Alembic rollback.
- `scripts/staging_seed.sh` - create first admin user.
- `scripts/staging_health.sh` - verify containers and health endpoints.

## Operational Readiness (Phase 3)

- Database migrations, Redis connectivity, Celery worker/beat, notification providers, Paymob, Stripe, AWS, JWT keys, backups, health endpoints, metrics, structured logging, Sentry, rate limiting, and audit logging are documented in the runbook and checklists.
- Verification commands and expected outputs are captured in `docs/deployment/RUNBOOK.md`.

## Deliverables (Phases 4-7)

- `docs/deployment/STAGING_DEPLOYMENT_GUIDE.md`
- `docs/deployment/CLOSED_BETA_CHECKLIST.md`
- `docs/deployment/GO_LIVE_CHECKLIST.md`
- `docs/deployment/ROLLBACK_PLAN.md`
- `docs/deployment/RUNBOOK.md`
- `docs/deployment/RISK_REGISTER.md`
- `docs/deployment/BETA_READINESS_REPORT.md`
- `docs/deployment/DEPLOYMENT_CHECKLIST.md`

## Code Changes Made

- `src/app/notifications/tasks.py` - removed explicit Celery task names to align with `app.celery_app` beat schedule.
- `.env.example` - added `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.
- `.gitignore` - added `.env.staging` and `celerybeat-schedule*`.

## Validation

- `ruff check src tests` — passed (no issues)
- `mypy src` — passed (Success: no issues found in 81 source files)
- `pytest tests` — 283 passed, 80.42% coverage (>= 80% gate)
- `python3 -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`

## Notes

- Staging is self-contained Docker Compose; production remains Terraform/AWS ECS/RDS/ElastiCache/ALB.
- All third-party provider credentials must be real sandbox/staging values before `./scripts/staging_start.sh` succeeds.
- The next sprint should focus on production Terraform fixes (PostGIS parameter group, ECS task secrets) and live provider smoke tests.


---

# PHASE 2: Institutional Knowledge System — Sprint Delta

**Sprint Date**: 2026-07-27
**Session**: 004 / 005 (context continuation)

## Sprint Goal

Design and build the complete institutional knowledge base for StayOS — not documentation, but operational knowledge that teaches, explains, and enables autonomous operation by any qualified team member or AI system.

## Deliverables Produced

### 29 Production-Grade Knowledge Articles

**Marketplace Domain (3)**:
- `knowledge/marketplace/marketplace_lifecycle.md` — Five stages, liquidity threshold, stage transition criteria
- `knowledge/marketplace/cold_start_playbook.md` — Five cold-start moves, institutional supply scripts, 10-transaction protocol
- `knowledge/marketplace/marketplace_health_kpis.md` — North Star metric, 7 Tier-2 KPIs, warning thresholds

**Hospitality Domain (3)**:
- `knowledge/hospitality/property_quality_standards.md` — Three-gate inspection, tier definitions, cultural flags
- `knowledge/hospitality/turnover_operations.md` — Turnover pipeline, BR-OPS-01/02/03 enforcement
- `knowledge/hospitality/guest_host_expectations.md` — Guaranteed expectations, Egyptian/GCC cultural context

**Operations Domain (3)**:
- `knowledge/operations/daily_operations_runbook.md` — Operations clock, morning review, turnover monitoring
- `knowledge/operations/incident_management.md` — P0–P3 severity, 5 incident type playbooks
- `knowledge/operations/escalation_matrix.md` — Authority table, on-call roster, escalation format

**Customer Success Domain (3)**:
- `knowledge/customer_success/host_lifecycle.md` — Six stages, 21-day intervention, referral program
- `knowledge/customer_success/guest_lifecycle.md` — Seven stages, GCC vs. Egyptian differences
- `knowledge/customer_success/retention_playbook.md` — Churn signals, intervention levels, loyalty programs

**Trust & Safety Domain (3)**:
- `knowledge/trust/fraud_detection.md` — Six fraud categories, detection, prevention, response
- `knowledge/trust/dispute_resolution.md` — Five phases, SLA table, 15 decision scenarios
- `knowledge/trust/identity_verification_guide.md` — KYC flow, AWS Textract + Rekognition, edge cases

**Finance Domain (3)**:
- `knowledge/finance/escrow_model.md` — Complete escrow lifecycle, double-entry ledger, BR-FIN-01/02/03
- `knowledge/finance/payout_operations.md` — Payout flow, BR-FIN-03 verification, payout holds
- `knowledge/finance/refund_and_chargeback.md` — Refund types, chargeback response, evidence package

**Support Domain (3)**:
- `knowledge/support/support_workflows.md` — 7-step workflow, SLA table, communication standard
- `knowledge/support/escalation_playbook.md` — 5 escalation levels, authority per level, triggers
- `knowledge/support/communication_templates.md` — Full bilingual (Arabic/English) templates, 7 categories

**Product Domain (3)**:
- `knowledge/product/feature_reasoning.md` — FC-01–FC-07 rationale and deliberate deferrals
- `knowledge/product/product_decision_framework.md` — Four-Gate Test, Decision Log protocol
- `knowledge/product/failure_modes_guide.md` — 9 failure modes with early warning signals

**Founder Domain (3)**:
- `knowledge/founder/vision_and_principles.md` — Six founding principles, MENA vision
- `knowledge/founder/decision_framework.md` — Type 1 vs. Type 2 decisions, governance structure
- `knowledge/founder/scaling_playbook.md` — Stage gates, city playbook, GCC corridor entry

**Training Domain (5)**:
- `knowledge/training/host_success_training.md` — 5-day program
- `knowledge/training/guest_success_training.md` — 4-day program
- `knowledge/training/support_training.md` — 4-day program
- `knowledge/training/operations_training.md` — 5-day program
- `knowledge/training/finance_training.md` — 5-day program

### 4 Index Files

- `knowledge/KNOWLEDGE_INDEX.md` — Complete document index with audience and key topic columns
- `knowledge/SOURCE_MAP.md` — Business rules → docs, source code → docs, Decision Log → docs
- `knowledge/TAG_INDEX.md` — Full tag taxonomy (domain, process, geographic, technical, business rule, audience)
- `knowledge/LEARNING_PATHS.md` — 8 role-based reading sequences including AI/RAG quick-context load

## Quality Standards Applied

- Every article: Purpose, Background, Core Concept, Detailed Explanation, Real-World Scenarios (MENA-specific), Decision Trees, Best Practices, Common Mistakes, FAQs, Checklist, References, Related Documents
- All amounts in EGP, all scenarios in Cairo/Egypt/GCC context
- All communication examples bilingual (Arabic primary, English secondary)
- Business rules (BR-ID-01/02, BR-INV-01/02, BR-OPS-01/02/03, BR-FIN-01/02/03, BR-SUP-01) consistently cross-referenced
- FC-01–FC-07 rationale documented in product domain
- No placeholders. No TODOs. No generic content.

## Constraints Observed

- Source code NOT modified
- Architecture NOT changed
- Infrastructure NOT touched
- No new migrations created
- No APIs implemented
- No refactoring performed

---

> **Scope & Limitation**
>
> This Sprint Memory is based **only on the messages currently available in this conversation context**.
>
> I do **not** claim to have reviewed earlier messages that are no longer available.
>
> I did **not** inspect:
>
> - Repository
> - Source code
> - Git history
> - Uploaded files
> - External documents
>
> Everything below is derived only from verifiable discussion contained in the currently available conversation.

---

# 1. Sprint Goal

## Primary Goal

Shift the project from conversation-driven development toward a persistent institutional memory and governance process.

## Why

The founder identified a recurring problem:

- new ideas were continuously introduced,
- previously agreed work became difficult to track,
- implementation priorities drifted,
- completed planning work risked being forgotten.

The sprint therefore focused on preserving project knowledge before continuing implementation.

---

# 2. Major Discussions

## Discussion A

### Project Status Review

Classification:

**CONFIRMED**

Summary:

A high-level review of the project's current state was requested, including:

- project goal
- completed work
- remaining work
- estimated completion timeline

---

## Discussion B

### Governance Problem

Classification:

**CONFIRMED**

Summary:

The founder observed that new ideas frequently displaced previously agreed work.

The discussion shifted toward preventing historical decisions from being lost.

---

## Discussion C

### Project Memory

Classification:

**CONFIRMED**

Summary:

Agreement that the project requires persistent memory rather than relying on conversation history.

---

## Discussion D

### Decision Management

Classification:

**CONFIRMED**

Summary:

Future work should be validated against previous decisions before becoming active work.

---

## Discussion E

### Conversation-Based Memory Extraction

Classification:

**CONFIRMED**

Summary:

Multiple prompts were discussed whose purpose was extracting institutional memory from conversation only, while explicitly avoiding repository inspection.

---

# 3. Founder Decisions

Only explicit founder-approved decisions visible in this conversation.

---

## Decision

Project Memory should become the project's institutional memory.

Status:

CONFIRMED

---

## Decision

Future work should be checked against previous plans before implementation.

Status:

CONFIRMED

---

## Decision

Conversation history should be treated as the primary historical record when building Project Memory.

Status:

CONFIRMED

---

# 4. Confirmed Decisions

---

## Decision

Introduce persistent Project Memory.

Reason

Prevent loss of historical knowledge.

Still Valid

Yes.

Dependencies

Conversation history.

---

## Decision

Introduce project governance before continuing uncontrolled feature expansion.

Reason

Reduce roadmap drift.

Still Valid

Yes.

Dependencies

Project Memory.

---

## Decision

Validate every new idea against previous decisions.

Reason

Avoid duplicate work.

Still Valid

Yes.

Dependencies

Decision history.

---

## Decision

Extract historical decisions from conversation before repository review.

Reason

Conversation is the historical source for this task.

Still Valid

Yes.

Dependencies

Available conversation context.

---

# 5. Superseded Decisions

---

## Old Decision

Continue discussing new ideas directly.

---

## New Decision

Introduce governance and Project Memory before accepting additional work.

Reason

Prevent forgotten work and duplicated effort.

---

# 6. Rejected Ideas

No explicit idea was clearly rejected during the currently available conversation.

Classification:

UNKNOWN

Could it return later?

Unknown.

---

# 7. Postponed Ideas

---

## Product implementation

Classification

POSTPONED

Reason

Current priority shifted toward governance.

Return Condition

After governance and memory foundation.

---

## Governance implementation details

Classification

POSTPONED

Reason

Only conceptual agreement occurred during this conversation.

Return Condition

Future implementation sprint.

---

# 8. Open Discussions

The following remain unresolved within the visible conversation:

- Final governance workflow.
- Exact Project Memory structure.
- Exact implementation order after governance.
- Sprint breakdown after governance.

Classification:

OPEN

---

# 9. Completed Work

Conceptually completed during this sprint:

- Project status review.
- Identification of governance problem.
- Agreement on Project Memory.
- Agreement on conversation-first historical extraction.
- Agreement on decision tracking.

No implementation work was performed.

---

# 10. Remaining Work

Remaining according to confirmed discussion:

- Create permanent Project Memory.
- Formalize governance process.
- Organize confirmed decisions.
- Resume implementation using governed priorities.

---

# 11. Risks

## High

Roadmap drift.

---

## High

Historical decisions becoming forgotten.

---

## High

Duplicate implementation caused by missing decision history.

---

## Medium

Implementation delayed while governance is established.

---

## Low

None explicitly identified.

---

# 12. Lessons Learned

- Conversation alone is not a sufficient long-term knowledge store.
- Large projects require institutional memory.
- Governance becomes increasingly important as project complexity grows.
- Decisions require persistent tracking.
- New ideas should not bypass existing priorities.

---

# 13. Execution Queue

Derived only from confirmed decisions.

1. Build Project Memory.
2. Organize historical decisions.
3. Establish governance process.
4. Validate future work against decision history.
5. Resume implementation under governance.

---

# 14. Future Dependencies

Project Memory

↓

Decision History

↓

Governance Process

↓

Controlled Planning

↓

Future Implementation

No additional dependencies were explicitly confirmed.

---

# 15. Artifacts Produced

Artifacts explicitly produced during this sprint:

- Executive project status report (conversation response).
- Governance proposal (conversation response).
- Project Memory prompt refinements.
- Sprint Memory drafts (conversation response).

No repository files or permanent project documents were created within this conversation.

---

# 16. Executive Sprint Review

## Where the Sprint Started

Focus was on reviewing project status and discussing future work.

---

## What Changed

Priority shifted from discussing additional features toward preserving institutional knowledge.

---

## What Was Accomplished

- Governance need identified.
- Project Memory agreed conceptually.
- Decision tracking agreed conceptually.
- Conversation-first memory extraction approach established.

---

## What Remains

- Formal Project Memory.
- Governance implementation.
- Controlled execution process.

---

## Biggest Risk

Continuing feature discussions without preserving historical decisions.

---

# 17. Memory Validation

Validation performed using only currently available conversation.

Verified:

- No confirmed decision intentionally omitted.
- No superseded decision left active within this summary.
- No rejected idea incorrectly marked as active.
- No repository-derived information included.

Limitation:

Earlier messages outside the available conversation context could not be reviewed.

---

# 18. Memory Confidence

## Coverage

**Medium**

## Reason

The summary is fully grounded in the messages currently available in this conversation.

However, I cannot verify or reconstruct earlier messages that are no longer accessible.

## Missing Context

Any discussion that occurred earlier than the currently available conversation context is outside my visibility and has intentionally not been inferred or reconstructed.

---

# 19. Implementation Session — 2026-07-21

## Work Completed

- Inspected the current repository implementation, ADRs, and documentation.
- Identified and fixed broken/incomplete production scaffolding:
  - `src/app/shared/schemas.py` — fixed missing `Optional` import and modernized to `str | None`.
  - `src/app/config.py` — migrated Pydantic Settings to `SettingsConfigDict` (Pydantic v2).
  - `src/app/database.py` — corrected `get_session` async generator type annotation.
  - `src/app/main.py` — added proper Redis async typing, return annotations, CORS setup, and request-ID middleware integration.
  - `src/app/shared/middleware.py` — added full type annotations.
  - `src/app/shared/outbox.py` — switched raw SQL string to `sqlalchemy.text()` and used timezone-aware UTC timestamps.
  - `src/app/shared/models.py` — added the `OutboxEvent` model for the outbox schema.
  - `src/app/celery_app.py` — removed references to non-existent task modules.
  - `alembic/versions/002_create_outbox_events.py` — added migration to create the outbox events table.
  - `alembic/env.py` — fixed `sys.path` to include `src/` so Alembic can import app modules.
  - `infra/docker/api/Dockerfile` — corrected `PYTHONPATH` to `/app/src`.
  - `apps/web/next.config.ts` — replaced unsupported `.ts` config with `next.config.mjs` and removed invalid App Router `i18n` block.
  - `apps/web/app/layout.tsx` — converted redirect-only layout into a valid root HTML layout.
  - `apps/web/app/page.tsx` and `apps/web/app/ar/page.tsx` — added root redirect and Arabic landing page.
  - `apps/web/app/[locale]/page.tsx` — fixed locale redirect to use matched locale.
  - `apps/web/app/[locale]/search/page.tsx` — replaced placeholder "Coming soon" with a real Arabic-first search form that reads URL query params.
  - `.github/workflows/ci.yml` — updated backend lint/test commands to run against `src/` and `tests/` and to execute `pytest tests/`.
  - `pyproject.toml` — added pydantic mypy plugin, excluded `tests/` from strict mypy, and switched pytest discovery to `tests/`.
- Added a new `tests/` suite with `conftest.py`, `test_main.py`, `test_schemas.py`, `test_models.py`, `test_celery_app.py`, `test_outbox.py`, `test_exceptions.py`, and `test_database.py`.
- Validation run:
  - `ruff check src/ tests/` — passing.
  - `mypy src/` — passing.
  - `pytest tests/` — 24 tests passing, 100% coverage.
  - `npm ci`, `npm run build`, `npm run lint`, `npm run type-check` in `apps/web` — passing.
  - `safety check` — no known vulnerabilities.

## What Remains

- Full feature modules (auth, PMS, reservation, finance, ops, notify) are not yet implemented.
- Payment processor conflict (Paymob vs Stripe) remains unresolved pending founder decision.
- Phase 0 gates (10 transactions, 80 interviews, NPS thresholds) still need to be tracked and cleared before Phase 1 production code.
- No live database or Redis integration tests were run; unit tests use mocks.

---

# 20. FC-01 AuthGate & KYC Implementation Session — 2026-07-21

## Work Completed

Implemented the complete FC-01 production foundation: AuthGate identity gateway with OTP, Firebase SSO, JWT session management, refresh-token rotation, and the KYC document upload/verification flow backed by AWS S3 pre-signed URLs, Textract OCR, and Rekognition face comparison.

### Models & Migration

- `src/app/auth/models.py` — `User`, `Account`, and `RefreshToken` SQLAlchemy models in the `auth` schema.
- `src/app/kyc/models.py` — `KycDocument` SQLAlchemy model in the `auth` schema.
- `src/app/shared/models.py` — fixed `UUIDMixin.id` type annotation to `Mapped[str]` so it matches the `String(36)` column and `str(uuid4())` default.
- `alembic/versions/003_create_auth_tables.py` — migration creating `auth.users`, `auth.accounts`, `auth.refresh_tokens`, and `auth.kyc_documents` with indexes, foreign keys, and downgrade.
- `alembic/env.py` — imported `app.auth.models` and `app.kyc.models` so Alembic sees the new tables.

### Configuration

- `src/app/config.py` — added `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_TTL_MINUTES`, `JWT_REFRESH_TOKEN_TTL_DAYS`.
- `src/app/shared/redis.py` — new shared `redis_client` module to avoid circular imports between `main.py` and auth/KYC services.
- `src/app/main.py` — switched lifespan/health-check to `app.shared.redis`; registered auth and kyc routers; added global `StayOSError` exception handler returning proper 401/403/422/500 JSON responses.
- `pyproject.toml` — added mypy per-module overrides for `app.auth.*` and `app.kyc.*` to handle unstubbed Firebase, Twilio, boto3, and jose APIs.

### Auth Services & Endpoints

- `src/app/auth/constants.py` — `UserRole`, `KycStatus`, `KycDocumentType` enums.
- `src/app/auth/schemas.py` — `UserCreate`, `UserResponse`, `AccountUpdate`, `AccountResponse`, `TokenPair`, `OtpSendRequest`, `OtpVerifyRequest`, `FirebaseAuthRequest`.
- `src/app/auth/repository.py` — async repository for `User`, `Account`, and `RefreshToken`.
- `src/app/auth/services.py` —
  - RS256 JWT access/refresh token creation, decoding, rotation, and Redis-backed revocation.
  - Twilio Verify OTP send/verify with `asyncio.to_thread` for sync client calls.
  - Firebase ID-token verification using `firebase-admin` with lazy app initialization.
  - Account profile creation/update.
- `src/app/auth/dependencies.py` — `get_current_user`, `require_active_user`, `require_role`, `require_kyc_verified`, plus a public-key endpoint helper.
- `src/app/auth/router.py` — endpoints:
  - `POST /auth/otp/send`
  - `POST /auth/otp/verify`
  - `POST /auth/firebase`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`
  - `GET /auth/me/account`
  - `PATCH /auth/me/account`
  - `GET /auth/.well-known/jwks.json`

### KYC Services & Endpoints

- `src/app/kyc/schemas.py` — `KycInitiateRequest`, `KycInitiateResponse`, `KycUploadUrls`, `KycDocumentResponse`, `KycStatusResponse`, `KycSubmitResponse`.
- `src/app/kyc/repository.py` — async repository for `KycDocument`.
- `src/app/kyc/services.py` —
  - S3 pre-signed PUT URL generation for front/back/selfie images.
  - KYC document initiation and submission, setting status to `pending` and enqueueing OCR processing.
  - AWS Textract `analyze_id` parsing and AWS Rekognition `compare_faces` biometric validation.
  - Automatic update of user `kyc_status` and account `legal_name` upon verification.
- `src/app/kyc/tasks.py` — Celery task `app.kyc.tasks.process_kyc_document` running OCR in `asyncio.run` with a fresh async DB session.
- `src/app/kyc/router.py` — endpoints:
  - `POST /kyc/initiate`
  - `POST /kyc/documents/{document_id}/submit`
  - `GET /kyc/status`
  - `POST /kyc/documents/{document_id}/process` (admin-only)

### Tests

- `tests/conftest.py` — generates test RSA JWT key pair and exports `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`; added shared `client` and `fake_session` fixtures with a mocked Redis client.
- `tests/test_auth.py` — 15 integration tests covering OTP send/verify, Firebase login, refresh, logout, me, account get/update, public key, and JWT round-trip.
- `tests/test_kyc.py` — 6 integration tests covering KYC initiate, submit, status, admin process, role gating, and service-level OCR processing.
- `tests/test_repositories.py` — 16 unit tests for auth and KYC repository functions.

### Validation Results

- `python3 -m ruff check src/ tests/` — passing.
- `python3 -m mypy src/` — passing.
- `python3 -m pytest tests/ -q` — 58 tests passing, 84% coverage (exceeds 80% gate).
- `apps/web` — `npm install`, `npm run type-check`, `npm run lint`, `npm run build` all passing.

## Business Rules Enforced

- **BR-ID-01 (Mandatory Verification):** `require_kyc_verified` dependency is available; KYC status is embedded in the JWT access token (`kyc_status` claim) so any downstream endpoint can gate checkout/listing actions without a DB lookup.
- **BR-ID-02 (Identity Structural Alignment):** KYC `process_kyc_document` updates the linked `Account.legal_name` when verification succeeds, ensuring the legal name on the identity profile can be reconciled with payout routing later.
- Session and refresh-token revocation is enforced in Redis with TTL matching the refresh-token expiry.

## Files Added or Modified

- Added: `src/app/auth/__init__.py`, `constants.py`, `models.py`, `schemas.py`, `repository.py`, `services.py`, `dependencies.py`, `router.py`.
- Added: `src/app/kyc/__init__.py`, `models.py`, `schemas.py`, `repository.py`, `services.py`, `tasks.py`, `router.py`.
- Added: `src/app/shared/redis.py`, `alembic/versions/003_create_auth_tables.py`.
- Added: `tests/test_auth.py`, `tests/test_kyc.py`, `tests/test_repositories.py`.
- Modified: `src/app/main.py`, `src/app/config.py`, `src/app/shared/models.py`, `src/app/shared/exceptions.py`, `alembic/env.py`, `pyproject.toml`, `tests/conftest.py`.

## What Remains / Next Recommended Feature

- Integrate real Twilio/Firebase credentials and run live OTP/SSO smoke tests; add rate-limiting middleware for OTP endpoints.
- Configure S3 bucket lifecycle, CORS, and KMS encryption policies for `stayos-kyc-{env}` per ADR-009.
- Add host onboarding UI flow in `apps/web` for KYC image upload using the pre-signed URLs returned by `/kyc/initiate`.
- **Next recommended feature:** FC-02 Spatial Search & Inventory Discovery, which can now build on the authenticated user model and verified KYC gate from FC-01.

---

## FC-01 Critical Readiness Fixes — 2026-07-21

The following Critical findings from the FC-01 Production Readiness Review were implemented without introducing new features or redesigning FC-01:

1. **API versioning:** Mounted `auth` and `kyc` routers under `/api/v1` in `src/app/main.py` and updated tests to use the new paths.
2. **ADR-014 error responses:** Added `ErrorResponse` schema in `src/app/shared/schemas.py` and registered handlers in `src/app/main.py` for `StayOSError`, `HTTPException`, `RequestValidationError`, and generic `Exception` returning `{ "error": { "code", "message", "message_ar", "details" } }`.
3. **KYC status token invalidation:** `src/app/auth/dependencies.py` `get_current_user` now rejects access tokens whose embedded `kyc_status` no longer matches the user's `verified`/`rejected` state, forcing a refresh after KYC decisions.
4. **OTP rate limiting:** `src/app/auth/services.py` now enforces per-phone Redis counters for `send_otp` and `verify_otp` using `OTP_MAX_ATTEMPTS` and `OTP_RATE_LIMIT_WINDOW`, resetting limits on successful verification.
5. **Celery KYC task registration/retry/idempotency:** `src/app/celery_app.py` includes `app.kyc.tasks`; `src/app/kyc/tasks.py` uses `bind=True`, `autoretry_for=(Exception,)`, `max_retries=3`, `retry_backoff=True`, and skips processing when the document is not `pending`.

### Verification

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/` — **58 passed**, **82.75%** coverage.

---

## FC-02 Spatial Search & Inventory Discovery — 2026-07-21

Implemented the FC-02 feature set reusing the existing FastAPI/SQLAlchemy/asyncpg architecture and following ADR-005 (PostgreSQL 16 + PostGIS), ADR-010 (PostGIS spatial search, `pg_trgm` full-text search), and ADR-014 (REST `/api/v1`, plural nouns, OpenAPI auto-generated).

### Domain Models & Migrations

- Added `src/app/listings/constants.py` with `PropertyType`, `UnitStatus`, `CalendarStatus`, and `CulturalTag`.
- Added `src/app/listings/models.py` under the `pms` schema:
  - `Unit` — host ownership, `GEOMETRY(POINT, 4326)` coordinates, property metadata, GIST spatial index.
  - `UnitListing` — localized titles/descriptions, amenities, cultural tags, pricing, computed `TSVECTOR` search vector, GIN indexes.
  - `CalendarRule` — per-unit date ranges with `AVAILABLE`/`BLOCKED`/`BOOKED`/`HOLD` status and an exclusion-safe range check.
- Added `alembic/versions/004_create_pms_tables.py` to create `pms.units`, `pms.unit_listings`, and `pms.calendar_rules` with PostGIS geometry, array columns, computed tsvector, and required indexes/check constraints.
- Imported `app.listings.models` in `alembic/env.py` for migration discovery.

### API Endpoints

All endpoints are mounted under `/api/v1/listings` via `src/app/listings/router.py`:

- `GET /listings` — public spatial/text search with viewport, radius, date availability, price, property type, guests, amenities, cultural tags, and cursor pagination.
- `GET /listings/{unit_id}` — public listing detail.
- `POST /listings` — host-only listing creation (KYC verified + role gating).
- `PATCH /listings/{unit_id}` — host owner listing update.
- `GET /listings/{unit_id}/availability` — public per-day availability for a date range.

### Services & Repositories

- `src/app/listings/repository.py` — PostGIS `ST_Within`, `ST_DWithin` (geography cast), array overlap, tsvector full-text, calendar overlap exclusions, and CRUD helpers.
- `src/app/listings/services.py` — business logic for create/search/update/availability, KYC/role authorization, and coordinate extraction via `ST_X`/`ST_Y`.
- `src/app/listings/schemas.py` — Pydantic v2 request/response models including `ListingSearchFilters`, `ListingSearchResponse`, `ListingResponse`, `AvailabilityResponse`.

### Application Wiring

- `src/app/main.py` mounts the `listings` router under `/api/v1`.
- `pyproject.toml` and `requirements.txt` include `geoalchemy2` and the `[tool.hatch.build.targets.wheel]` package selector so `python -m build` succeeds.

### Tests

- `tests/test_listings.py` — 7 router integration tests covering public search, validation, detail, availability, host-only create/update, and role gating.
- `tests/test_listings_services.py` — unit tests for all service functions with mocked repository.
- `tests/test_listings_repository.py` — unit tests for repository functions with mocked `AsyncSession`.

### Verification

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **77 passed**, **84.58%** coverage (exceeds 80% gate).
- `python -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

---

## FC-03 Booking Engine — 2026-07-21

Implemented FC-03 Booking Engine reusing the existing FastAPI/SQLAlchemy/AsyncSession architecture and following ADR-005, ADR-010, ADR-013 (transactional outbox), and ADR-014.

### Domain Models & Migration

- Added `src/app/reservations/constants.py` with `ReservationStatus`, `PaymentProvider`, `PaymentStatus`, `PaymentMethod`, and `CancellationReason`.
- Added `src/app/reservations/models.py` under the `reservation` schema:
  - `Reservation` — guest, unit, dates, guest counts, pricing breakdown, status, cancellation metadata.
  - `PaymentIntent` — provider, provider reference, amount, status, provider metadata.
  - `PromoCode` — discount percentage, usage limits, validity window.
  - `PromoApplication` — links promo codes to reservations.
- Added `alembic/versions/005_create_reservation_tables.py` to create `reservation.reservations`, `reservation.payment_intents`, `reservation.promo_codes`, and `reservation.promo_applications` with proper FKs, indexes, and constraints.
- Imported `app.reservations.models` in `alembic/env.py` for migration discovery.

### API Endpoints

All endpoints are mounted under `/api/v1/reservations` via `src/app/reservations/router.py`:

- `POST /reservations` — guest-only initiate booking (KYC verified).
- `GET /reservations` — list reservations for guest/host/admin with cursor pagination.
- `GET /reservations/{reservation_id}` — reservation detail.
- `POST /reservations/{reservation_id}/confirm` — payment webhook confirmation.
- `POST /reservations/{reservation_id}/cancel` — cancel by guest/host/admin.
- `POST /reservations/{reservation_id}/check-in` — host/field staff check-in.
- `POST /reservations/{reservation_id}/check-out` — host/field staff check-out.
- `POST /reservations/{reservation_id}/promo` — apply a promo code to a pending reservation.

### Services & Repositories

- `src/app/reservations/repository.py` — unit/listing/availability lookup, calendar lock acquisition and release, payment intent and promo CRUD, transactional outbox writes.
- `src/app/reservations/services.py` — booking creation with atomic calendar locking (`SELECT ... FOR UPDATE`), pricing engine (base price, weekend multipliers, guest service fee, host commission, platform take), payment confirmation, cancellation refund policy, check-in/check-out, and promo application.
- `src/app/reservations/schemas.py` — Pydantic v2 request/response models.
- Pricing and cancellation policy added to `app.config.py` as tunable settings.

### Business Rules Enforced

- **BR-ID-01 (Mandatory Verification):** only `KYC` `VERIFIED` guests can create reservations.
- **BR-INV-01 (Atomic Calendar Isolation):** `create_reservation` locks the unit row and uses a `HOLD` calendar rule to prevent concurrent double-booking; `confirm` upgrades to `BOOKED`, cancellation releases the lock.
- **Booking lifecycle status transitions** with validation (e.g., cannot check in before check-in date, cannot cancel an active/completed stay).
- **Cancellation refund policy**: full refund > 7 days, partial refund 3–7 days, no refund < 3 days, with protection against zero refund when cancelling within 24h and > 7 days before check-in.
- Transactional outbox events emitted for `booking.initiated`, `booking.payment_confirmed`, `booking.cancelled`, `booking.checked_in`, and `booking.checked_out`.

### Application Wiring

- `src/app/main.py` mounts the `reservations` router under `/api/v1`.
- `pyproject.toml` already configured for hatchling wheel builds.

### Tests

- `tests/test_reservations.py` — 9 router integration tests with auth patching.
- `tests/test_reservations_services.py` — 15 unit tests for service functions.
- `tests/test_reservations_repository.py` — 14 unit tests for repository functions.

### Verification

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **114 passed**, **84.80%** coverage (exceeds 80% gate).
- `python -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

### Remaining Work After FC-03

- **Finance integration:** consume `booking.payment_confirmed` and `booking.checked_in` to create escrow, release after T+24h, and process refunds (FC-06).
- **Payment gateway integration:** replace the placeholder Paymob/Stripe webhook handler with HMAC-signature verification and real provider API calls.
- **Operations integration:** consume `booking.checked_out` to generate turnover tickets within 5 minutes (FC-05).
- **Calendar management:** expose host endpoints for blocking/unblocking dates and pricing tiers on the listing router.
- **Notifications:** add outbox consumers for guest/host confirmation, reminder, and refund messages.

---

## FC-03 Architectural Checkpoint — 2026-07-21

Reviewed architecture consistency, duplication, outbox usage, transaction boundaries, dependency direction, and ADR/event compliance after completing FC-01, FC-02, and FC-03.

### Issues Found and Fixed

- **Duplicated repository queries:** `reservations.repository` duplicated `get_unit_with_listing` and `get_calendar_rules_in_range` from `listings.repository`. Removed them from `reservations.repository` and routed `reservations.services` to use `app.listings.repository` for all PMS reads. Moved `get_host_unit_ids` to `listings.repository` because it queries the `Unit` aggregate.
- **Duplicated pricing business logic:** `listings/services.py` `get_availability` and `reservations/services.py` both computed nightly prices independently. Extracted a shared `src/app/listings/pricing.py` module with `find_rule_for_day`, `get_day_price`, `is_mena_weekend`, and `compute_subtotal`. Both services now import from it, ensuring availability and booking prices are consistent.
- **Event contract gaps:** Outbox payloads for `booking.checked_in` and `booking.checked_out` were missing `checked_in_at`/`checked_out_at` and `next_check_in`. The `booking.cancelled` event was missing `refund_policy_applied`. Added these fields to align with `docs/system-design/06_EVENT_CATALOG.md`.
- **Default multiplier values:** `UnitListing` creation in `listings/repository.py` and test fixtures did not set `weekend_mult`/`peak_mult`, causing `None` pricing errors in memory. Set explicit `1.0` defaults.

### Verification

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **112 passed**, **84.86%** coverage (exceeds 80% gate).
- `python -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

### Conclusion

FOUNDATION ARCHITECTURE VERIFIED after remediation.

---

## FC-04 Host Operations — 2026-07-21

Implemented host-focused property, calendar, and reservation management on top of the existing `listings` module, reusing auth, KYC, and reservations.

### Completed Work

- **Extended listing model/schema:** Added `house_rules`, `check_in_instructions`, `policies`, `weekend_mult`, and `peak_mult` to `UnitListing` and `ListingCreate`/`ListingUpdate`/`ListingResponse` schemas.
- **Status lifecycle:** Added `DRAFT` and `UNLISTED` to `UnitStatus`; created `publish_listing`, `unpublish_listing`, and `archive_listing` services/endpoints. KYC verification enforced for publish.
- **Calendar management:** Added `block_type` to `CalendarRule` and `CalendarBlockType` enum (`MANUAL`, `CLEANING`, `MAINTENANCE`). Implemented create/update/delete calendar rule endpoints.
- **Bulk operations:** Added `bulk-availability` and `bulk-pricing` endpoints to update date ranges in a single call.
- **Host dashboard:** Added `GET /listings/host/dashboard` returning total/listed listings, total/upcoming reservations, revenue, and occupancy rate.
- **Reservation calendar:** Added `GET /listings/host/reservations` returning reservations overlapping a date range for all host units or a single unit.
- **Migration:** Created `006_add_host_operations_columns.py` to add new `unit_listings` and `calendar_rules` columns.
- **Tests:** Added `tests/test_host_services.py`, `tests/test_host_repository.py`, and updated existing listings fixtures for the new response fields.

### Files Modified/Added

- `src/app/listings/constants.py`
- `src/app/listings/models.py`
- `src/app/listings/schemas.py`
- `src/app/listings/repository.py`
- `src/app/listings/services.py`
- `src/app/listings/router.py`
- `alembic/versions/006_add_host_operations_columns.py`
- `tests/test_host_services.py`
- `tests/test_host_repository.py`
- `tests/test_listings.py`
- `tests/test_listings_services.py`
- `tests/test_listings_repository.py`

### Endpoints

- `POST /api/v1/listings` (now supports `is_draft` and host fields)
- `PATCH /api/v1/listings/{unit_id}`
- `POST /api/v1/listings/{unit_id}/publish`
- `POST /api/v1/listings/{unit_id}/unpublish`
- `POST /api/v1/listings/{unit_id}/archive`
- `POST /api/v1/listings/{unit_id}/calendar`
- `PATCH /api/v1/listings/{unit_id}/calendar/{rule_id}`
- `DELETE /api/v1/listings/{unit_id}/calendar/{rule_id}`
- `POST /api/v1/listings/{unit_id}/calendar/bulk-availability`
- `POST /api/v1/listings/{unit_id}/calendar/bulk-pricing`
- `GET /api/v1/listings/host/dashboard`
- `GET /api/v1/listings/host/reservations`

### Database Migrations

- `006_add_host_operations_columns.py` adds `house_rules`, `check_in_instructions`, `policies` to `pms.unit_listings` and `block_type` to `pms.calendar_rules`.

### Tests

- `tests/test_host_services.py` — 13 unit tests for host services.
- `tests/test_host_repository.py` — 10 unit tests for host repository helpers.
- Existing listings tests updated for new response fields.

### Verification

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **137 passed**, **83.86%** coverage (exceeds 80% gate).
- `python -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

### Remaining Work

- Payout/escrow automation (FC-06) consuming `booking.payment_confirmed` and `booking.checked_in`.
- Real payment provider webhook verification and capture.
- Notification outbox consumers for host/guest messages.

---

## FC-05 Operations & Turnover — 2026-07-21

Implemented post-booking operations on top of the existing outbox/Celery foundation, reusing auth, listings, and reservations.

### Completed Work

- **Operations module** (`src/app/operations/`) created with constants, models, schemas, repository, services, router, consumers, and Celery tasks.
- **Database models:** `FieldStaff`, `OperationTask`, `TaskEvent`, `MaintenanceRequest`, `PropertyReadiness`, `RecurringMaintenance`.
- **Alembic migration** `007_add_operations_tables.py` creates the `operations` schema and all operations tables.
- **Task lifecycle:** create, assign, start, complete, add notes/attachments, timeline. Parent/child task support for turnover workflows.
- **Business rules:** checkout creates a `TURNOVER` task + `CLEANING` + `INSPECTION` subtasks; property readiness stays `NOT_READY` until all subtasks complete; completion auto-completes parent and emits `ops.turnover_complete`; cancellation cancels pending tasks.
- **Outbox consumer:** `operations/consumers.py` polls `outbox.outbox_events` and dispatches `booking.checked_out`, `booking.checked_in`, and `booking.cancelled` events with Redis idempotency.
- **Celery tasks:** `app.operations.tasks.process_outbox_events` and `process_single_outbox_event` registered in `celery_app`.
- **API endpoints:** full CRUD for tasks, staff, maintenance requests, recurring maintenance, property readiness, and operations dashboard.
- **Authorization:** endpoints restricted to `admin`, `operations`, `field_staff`, `host`, and `guest` roles as appropriate.

### Files Modified/Added

- `src/app/main.py`
- `src/app/celery_app.py`
- `alembic/env.py`
- `alembic/versions/007_add_operations_tables.py`
- `src/app/operations/__init__.py`
- `src/app/operations/constants.py`
- `src/app/operations/models.py`
- `src/app/operations/schemas.py`
- `src/app/operations/repository.py`
- `src/app/operations/services.py`
- `src/app/operations/router.py`
- `src/app/operations/consumers.py`
- `src/app/operations/tasks.py`
- `tests/test_operations_services.py`
- `tests/test_operations_repository.py`
- `tests/test_operations_consumers.py`

### Database Migrations

- `007_add_operations_tables.py` creates `operations.field_staff`, `operations.operation_tasks`, `operations.task_events`, `operations.maintenance_requests`, `operations.property_readiness`, and `operations.recurring_maintenance`.

### API Endpoints

- `POST /api/v1/operations/tasks`
- `GET /api/v1/operations/tasks/{task_id}`
- `PATCH /api/v1/operations/tasks/{task_id}`
- `POST /api/v1/operations/tasks/{task_id}/assign`
- `POST /api/v1/operations/tasks/{task_id}/start`
- `POST /api/v1/operations/tasks/{task_id}/complete`
- `POST /api/v1/operations/tasks/{task_id}/notes`
- `POST /api/v1/operations/tasks/{task_id}/attachments`
- `GET /api/v1/operations/tasks/{task_id}/timeline`
- `POST /api/v1/operations/staff`
- `GET /api/v1/operations/staff`
- `POST /api/v1/operations/maintenance`
- `GET /api/v1/operations/maintenance`
- `GET /api/v1/operations/maintenance/{request_id}`
- `PATCH /api/v1/operations/maintenance/{request_id}`
- `GET /api/v1/operations/readiness/{unit_id}`
- `PATCH /api/v1/operations/readiness/{unit_id}`
- `GET /api/v1/operations/dashboard`
- `POST /api/v1/operations/recurring-maintenance`

### Event Consumers

- `process_outbox_events` Celery task polls `outbox.outbox_events` for `booking.checked_out`, `booking.checked_in`, `booking.cancelled`.
- `process_single_outbox_event` Celery task processes a specific outbox row.
- Consumer handlers:
  - `booking.checked_out` → creates turnover + cleaning + inspection tasks, sets `NOT_READY`, emits `ops.ticket_created`.
  - `booking.checked_in` → validates readiness state.
  - `booking.cancelled` → cancels pending operations tasks for the reservation.

### Celery Tasks

- `app.operations.tasks.process_outbox_events`
- `app.operations.tasks.process_single_outbox_event`

### Tests Added

- `tests/test_operations_services.py` — 20 service tests covering task lifecycle, events, dashboard, and business rules.
- `tests/test_operations_repository.py` — 20 repository tests.
- `tests/test_operations_consumers.py` — outbox consumer and idempotency tests.

### Validation Results

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **182 passed**, **82.74%** coverage (exceeds 80% gate).
- `python -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

### Remaining Work

- FC-06 Payout/escrow automation (consume `booking.payment_confirmed` and `booking.checked_in`).
- Notification outbox consumers for host/guest messages.
- Real payment provider webhook verification and capture.

### Recommended Next Feature

**FC-06 Payout & Escrow** — implement payout disbursement, escrow release timer, and `finance.payout_dispatched` / `finance.escrow_released` event flows.

---

## Production Readiness Review — 2026-07-22

### Scope

Reviewed architecture/module boundaries, DDD/repositories/services/transaction boundaries, authentication/authorization/KYC enforcement, outbox/Celery/Redis/idempotency, database consistency/concurrency/race conditions, API consistency/business rules/error handling, and testing quality/coverage.

### Critical Findings Fixed

1. **Unauthenticated payment confirmation endpoint** — `POST /api/v1/reservations/{reservation_id}/confirm` had no authentication or authorization, allowing any caller to confirm a reservation and bypass payment. Fixed by adding `auth_dependencies.require_role("admin")` to `src/app/reservations/router.py` and updating `tests/test_reservations.py` to authenticate as an admin.
2. **Outbox poller not scheduled** — `app.operations.tasks.process_outbox_events` was registered but Celery Beat had no schedule, so `booking.checked_out`/`checked_in`/`cancelled` events would never be processed automatically. Fixed by adding `beat_schedule` in `src/app/celery_app.py` to poll every 30 seconds.
3. **Calendar lock conflicts raised `ValueError`** — `reservations/repository.py` `acquire_calendar_lock` raised `ValueError` on unavailable dates or missing unit, mapping to HTTP 500. Fixed to raise `ConflictError` (409) and `NotFoundError` (404).

### Files Modified

- `src/app/reservations/router.py`
- `src/app/reservations/repository.py`
- `src/app/celery_app.py`
- `tests/test_reservations.py`
- `.ai/CURRENT/SPRINT_MEMORY.md`

### Verification

- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **182 passed**, **82.75%** coverage (exceeds 80% gate).
- `python3 -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

### Remaining High/Medium Findings

- **Calendar rule overlap:** no unique constraint/index prevents overlapping `CalendarRule` rows for a unit; host-created rules can overlap with booking holds, producing ambiguous availability/pricing.
- **Property readiness duplicates:** `PropertyReadiness` lacks a unique constraint on `(unit_id, reservation_id)`, so concurrent outbox handlers can create duplicate readiness rows.
- **Idempotency if Redis unavailable:** `_acquire_idempotency` in `operations/consumers.py` treats a missing Redis client as success, disabling exactly-once processing.
- **Task completion bypass:** `PATCH /api/v1/operations/tasks/{task_id}` allows `field_staff` to set `status=COMPLETED` directly, bypassing checklist validation in the dedicated `complete_task` endpoint.
- **Recurring maintenance scheduling:** `spawn_recurring_tasks` is implemented but not scheduled via Celery Beat.
- **Payment webhook verification:** real payment-provider HMAC verification is not implemented; admin auth is a temporary guard.
- **KYC event contract:** KYC verification does not emit `user.kyc_verified` / `user.kyc_rejected` outbox events as described in the event catalog.
- **Test coverage:** overall 82.75% but `auth/services.py`, `listings/router.py`, and `operations/router.py` have significant uncovered branches.

---

## FC-06 Finance & Escrow — Completed

### Scope
Implemented finance domain models, repository, services, routers, Celery tasks, and payment provider integrations for escrow, settlement, refund, and payouts.

### Files Added
- `src/app/finance/constants.py`
- `src/app/finance/models.py`
- `src/app/finance/schemas.py`
- `src/app/finance/repository.py`
- `src/app/finance/services.py`
- `src/app/finance/router.py`
- `src/app/finance/providers.py`
- `src/app/finance/consumers.py`
- `src/app/finance/tasks.py`
- `alembic/versions/008_create_finance_tables.py`
- `tests/test_finance.py`
- `tests/test_finance_consumers.py`
- `tests/test_finance_tasks.py`
- `tests/test_finance_repository.py`

### Files Modified
- `src/app/config.py` — added Stripe/Paymob/escrow settings.
- `src/app/celery_app.py` — registered finance tasks and scheduled outbox polling.
- `src/app/main.py` — registered the finance router under `/api/v1`.
- `src/app/operations/consumers.py` — reverted to operations-only event handling.
- `alembic/env.py` — imported finance models for migration discovery.

### Implementation Highlights
- Double-entry ledger entries posted for every financial transaction.
- Idempotent transactions via idempotency keys and Redis deduplication.
- Escrow lifecycle: created on `booking.payment_confirmed`, release scheduled on `booking.checked_in`, refund on `booking.cancelled`.
- Payout requests enforce available balance and no payout before escrow release.
- Paymob and Stripe webhook signature verification helpers and endpoints.
- Celery tasks for escrow release, payout processing, pending-payout polling, and finance outbox processing.

### Validation
- `ruff check src/ tests/` — passed.
- `mypy src/` — passed.
- `pytest tests/ -q` — **225 passed**, **80.83%** coverage (exceeds 80% gate).
- `python3 -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

---

## FC-06 Real Payment Integration — Completed

### Scope
Replaced the synthetic payment flow with real Paymob and Stripe integrations. The reservation lifecycle now creates provider payment intents during booking and only confirms the reservation after provider webhook verification. Admin confirmation remains available as a manual override. Added production-safe webhook handlers with HMAC/signature verification, duplicate event detection, retries, logging, and failure handling.

### Files Added/Modified
- `src/app/shared/exceptions.py` — added `PaymentError` exception class.
- `src/app/main.py` — added `PaymentError` error code (`PAYMENT_ERROR`) and Arabic translation.
- `src/app/config.py` — added `PAYMOB_IFRAME_ID` for hosted checkout URL generation.
- `src/app/finance/providers.py` — added Paymob auth/order/payment-key/iframe creation, Stripe PaymentIntent create/capture/refund, retry wrappers, HMAC/signature verification, and extraction helpers.
- `src/app/finance/router.py` — updated Paymob and Stripe webhook endpoints to verify signatures, deduplicate events, route successes to confirmation and failures to cancellation.
- `src/app/finance/consumers.py` — added `reservation.confirmed` to finance outbox event handling.
- `src/app/reservations/repository.py` — added `provider_metadata` to `create_payment_intent`, plus `get_payment_intent_by_provider_ref` and `update_payment_intent`.
- `src/app/reservations/schemas.py` — exposed `provider_metadata` on `PaymentIntentResponse`.
- `src/app/reservations/services.py` — refactored `create_reservation` to call real payment providers, added `_confirm_reservation`, `confirm_reservation_by_provider`, `fail_reservation_by_provider`, and outbox event publishing for `payment.created`, `payment.captured`, `payment.failed`, and `reservation.confirmed`.
- `tests/test_finance.py` — updated webhook tests and added coverage for successful/failed payments, duplicate/invalid webhooks, retries, timeout, idempotency, and provider creation.
- `tests/test_reservations_services.py` — updated mocks for provider payment and outbox, added provider confirmation/failure tests.
- `tests/test_finance_consumers.py` — updated tests to use `reservation.confirmed`.

### Endpoints
- `POST /api/v1/finance/webhooks/paymob` — Paymob transaction callback/webhook.
- `POST /api/v1/finance/webhooks/stripe` — Stripe webhook.
- `POST /api/v1/reservations` — creates a reservation and a real Paymob/Stripe payment intent.
- `POST /api/v1/reservations/{reservation_id}/confirm` — admin override confirmation.

### Events Published (Outbox)
- `payment.created` — when a payment intent is created for a new reservation.
- `payment.captured` — when a payment is successfully verified by the provider or admin.
- `payment.failed` — when a provider reports a failed/cancelled payment.
- `reservation.confirmed` — when provider verification succeeds and the reservation becomes `CONFIRMED`.

### Tests
- 244 tests passed.
- New/updated tests cover: successful Paymob and Stripe webhook confirmations, failed payment webhooks, duplicate webhook handling, invalid signature rejection, network timeout retry on Paymob/Stripe POST helpers, Paymob order/iframe generation, Stripe PaymentIntent/refund/capture, and provider failure propagation during reservation creation.

### Validation
- `ruff check src tests` — passed.
- `mypy src` — passed.
- `pytest tests` — **244 passed**, **80.73%** coverage (exceeds 80% gate).
- `python3 -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

---

## FC-07 Platform Hardening — 2026-07-21

### Scope
Harden the StayOS platform for Closed Beta release by improving stability, security, and operational robustness. No new customer-facing features or architectural redesigns.

### Completed Work
- **Calendar concurrency:** added PostgreSQL exclusion constraint migration `009_add_calendar_exclusion.py` and updated `src/app/reservations/repository.py` to catch `IntegrityError` and raise `ConflictError` on overlapping bookings.
- **Notification module:** created `src/app/notifications/` with constants, models, repository, services, providers (WhatsApp, Email via SES, SMS via Twilio), templates, consumers, schemas, and Celery tasks; implemented retry logic and a dead-letter queue for failed notifications.
- **Security hardening:** created `src/app/security/` with audit logging, security headers middleware, Redis-backed rate limiting, PII masking, secrets manager, structured JSON logging, and Sentry integration; wired middleware into `src/app/main.py` and applied rate limits to auth endpoints.
- **Operations hardening:** added `src/app/operations/metrics.py` with Prometheus collection and middleware, added `/health`, `/health/live`, `/health/ready`, `/health/deep`, `/metrics`, and `/version` endpoints, and created `scripts/backup.py` and `scripts/restore_verify.py`.
- **Database migration:** added `010_add_notifications_and_security.py` for `notify` and `security` schemas.

### Files Added/Modified
- `src/app/reservations/repository.py`
- `src/app/notifications/*`
- `src/app/security/*`
- `src/app/operations/metrics.py`
- `src/app/main.py`
- `src/app/auth/router.py`
- `src/app/celery_app.py`
- `alembic/versions/009_add_calendar_exclusion.py`
- `alembic/versions/010_add_notifications_and_security.py`
- `alembic/env.py`
- `scripts/backup.py`
- `scripts/restore_verify.py`
- `tests/test_calendar_concurrency.py`
- `tests/test_notifications.py`
- `tests/test_security.py`
- `tests/test_operations_hardening.py`
- `tests/test_hardening_coverage.py`

### Validation
- `ruff check src tests` — passed.
- `mypy src` — passed (81 source files).
- `pytest tests` — **283 passed**, **80.42%** coverage (exceeds 80% gate).
- `python3 -m build` — successfully built `stayos-0.1.0.tar.gz` and `stayos-0.1.0-py3-none-any.whl`.

### Remaining Work / Next Steps
- Deploy to staging and run Closed Beta readiness checks.
- Monitor rate limiting, audit logs, notification delivery, and metrics in production.
- Prepare operational runbooks for backup/restore and incident response.

---

## Phase 1 — Launch Operations Program — 2026-07-26

### Scope
Design the complete business operating foundation required before onboarding the first real host or guest. No source code, architecture, API, database, or infrastructure changes. The output is a full set of operational documents in `business/operations/` covering business model, revenue/escrow/trust models, operating model, organization structure, roles, approval and escalation matrices, host and guest operations, marketplace operations, dashboards, KPIs, risk register, and launch readiness.

### Operational Decisions
- **Commission and escrow:** Host commission and guest service fee are recognized as platform revenue; guest total includes nightly subtotal plus guest service fee and taxes; net host payout is released after check-in or a T+24h hold, with escrow frozen while disputes are open.
- **Verification trust gate:** No host receives a payout without verified identity and a reviewed listing; no guest can transact without KYC verification.
- **Cancellation and refunds:** Full refund >7 days, partial 3–7 days, no refund <3 days, with protection for cancellations within 24h and >7 days; refund value reduces both guest payout and platform fee proportionally.
- **Operational cadence:** Daily monitoring of bookings, cancellations, payouts, support backlog, and incidents; weekly host pipeline, listing quality, and KPI review; monthly financial close and risk/OKR review.
- **Decision authority:** Operational decisions carry approval thresholds (e.g., refunds outside policy > USD 500 require COO, host suspension requires Operations Director, market launch requires Founder). Escalation follows P1–P4 severity with strict response times and documented post-incident review.
- **KPI and dashboard ownership:** Founder Dashboard is weekly; Operations Dashboards are daily/weekly/monthly plus incident, support, and finance views; every KPI has a formula, target, frequency, and owner.
- **Launch readiness:** Readiness is scored across 10 categories before go/no-go; Founder accepts residual risk in writing if any item is waived.

### Artifacts Produced
- `business/operations/Business_Model.md`
- `business/operations/Revenue_Model.md`
- `business/operations/Marketplace_Model.md`
- `business/operations/Trust_Model.md`
- `business/operations/Escrow_Model.md`
- `business/operations/Operations_Model.md`
- `business/operations/Organization_Structure.md`
- `business/operations/Roles_and_Responsibilities.md`
- `business/operations/Approval_Matrix.md`
- `business/operations/Escalation_Matrix.md`
- `business/operations/Host_Operations_Playbook.md`
- `business/operations/Guest_Operations_Playbook.md`
- `business/operations/Marketplace_Operations_Playbook.md`
- `business/operations/Founder_Dashboard.md`
- `business/operations/Operations_Dashboard.md`
- `business/operations/KPIs.md`
- `business/operations/Risk_Register.md`
- `business/operations/Launch_Readiness.md`

### Validation
- All requested output files created under `business/operations/`.
- Every document includes Purpose, Scope, Owner, Inputs, Outputs, Workflow, Exceptions, KPIs, Dependencies, Best Practices, and Review Frequency.
- `SPRINT_MEMORY.md` updated with operational decisions.

### What Remains / Recommended Phase 2
- Fill Launch_Readiness.md readiness scores during a live go/no-go review.
- Populate dashboards with real data once staging is live and first bookings occur.
- Train the operations team on the playbooks and run tabletop incident exercises.
- Integrate operational documents with the web-based runbook and on-call tooling.
- Phase 2 likely focus: pilot closed-beta operations with a curated host/guest cohort and iterate on SOPs, then scale to a second MENA city.

---

# SESSION 004 — Product Design Sprints + Implementation Baseline — 2026-07-27

**Session Date**: 2026-07-27
**Session**: 004 (context continuation from prior run-out)

## Sprint Goal

Transform all StayOS documentation into production visual/mobile design specs, then produce the contractual implementation baseline document that authorizes engineering to begin immediately.

---

## Design Sprints Completed (Prior Context)

### Sprint 1 — Product Experience Design
- Output: `/docs/PRODUCT_EXPERIENCE_DESIGN.md` (2,082 lines, 11,184 words)
- Complete sitemap, URL structure, navigation for 9 roles, 12 user flows, 81 screens, wireframes, design system tokens, dashboard layouts, mobile responsive patterns, micro interactions, WCAG 2.1 AA checklist
- Brand primary: `#2C5FFF`, Inter + Cairo fonts, 4px grid

### Sprint 2 — Visual Design System
- Output: `/docs/VISUAL_DESIGN_SYSTEM_P1–P4.md` (3,428 lines, 17,191 words across 4 files)
- P1: Visual identity, color tokens, typography (19 tokens), spacing, shadows, dark mode
- P2: High-fidelity screen specs (exact px measurements)
- P3: Full component library (Button 6×6×5, all form inputs, cards, nav, modals, data tables, skeleton states, motion system)
- P4: WCAG 2.1 AA, ARIA, keyboard navigation, RTL layout rules, component build order

### Sprint 3 — Native Mobile Design System
- Output: `/docs/MOBILE_NATIVE_DESIGN_P1–P5.md` (5,268 lines across 5 files)
- P1: 12 mobile design principles, layout system, 8-breakpoint grid (320–768px), Dynamic Type
- P2: Full mobile component library, 10 user flows
- P3: Gesture catalog, animations, offline architecture, push notifications, app lifecycle
- P4: iOS spec (UITabBarController, Dynamic Island, Apple Pay), Android spec (NavGraph, Material 3, Predictive Back), Flutter + React Native mapping tables
- P5: VoiceOver/TalkBack accessibility, RTL/Arabic, App icon spec, App Store metadata, Engineering Handoff (6 phases, 58 items, ~106 dev days, ~53 QA days)

### Sprint 4 — Architecture Readiness Review
- Reviewed 30 areas across backend, infrastructure, web, mobile, security
- Result: GO recommendation with 9 partial areas and known gaps
- Critical finding: TECH_STACK.md Paymob/Stripe conflict was stale — code correctly implements Paymob primary + Stripe secondary

### Sprint 5 — Engineering Execution Master Plan
- Output: `/STAYOS_ENGINEERING_EXECUTION_MASTER_PLAN.md` (1,865 lines, 14,003 words)
- 16 sections: Gap Analysis (38 gaps), 23 Engineering Epics, 9 Sprints, 7 Parallel Tracks, Release Roadmap (Alpha W8, Beta W14, RC W18, Prod W20), Resource Plan (8.5 FTE), Risk Register, Decision Register

---

## Session 004 — Implementation Baseline

### Deliverable Produced

**`STAYOS_IMPLEMENTATION_BASELINE.md`** — 1,354 lines, 15,842 words

The contractual execution baseline for all engineering teams. Contains:
- Section 1: RTM — 70 requirements traced from design → epic → backend → API → DB → web → mobile → test → sprint → release
- Section 2: Epic Coverage Matrix — all 23 epics with objective, screens, backend, DB, dependencies, sprint, DoD, status
- Section 3: Screen Coverage Matrix — all 81 screens across Web + Mobile (9 roles × platforms)
- Section 4: API Coverage Matrix — 61 existing + 20 missing endpoints documented with auth, validation, error codes, tests, sprint
- Section 5: Database Coverage Matrix — 26 existing + 5 planned tables documented
- Section 6: Backend Service Matrix — 8 services (AuthGate, KYC, PMS Core, Reservation, FinancialEngine, OpsManager, Notification, Security)
- Section 7: Web Coverage Matrix — all pages with components, hooks, state, infrastructure gaps
- Section 8: Mobile Coverage Matrix — all 40 mobile screens, 0% built, framework OPEN
- Section 9: Test Coverage Matrix — 30 existing test files documented + missing tests identified
- Section 10: Security Coverage Matrix — 28-item security review
- Section 11: DevOps Coverage Matrix — 23-item infra review (all Terraform defined, none provisioned)
- Section 12: Production Readiness Matrix — 8/32 items complete (25%)
- Section 13: Release Checklists — Alpha / Beta / RC / Production
- Section 14: Definition of Done — Story / Epic / Sprint / Release levels
- Section 15: Completeness Validation — 20 missing APIs, 74 web screens not built, 40 mobile screens not built
- Section 16: Consistency Validation — 83% overall consistency score
- Section 17: Production Validation + Executive GO decision

### Key Metrics From Baseline

| Metric | Score |
|--------|-------|
| Overall Completeness | 42% |
| Backend Completeness | 78% |
| Web Frontend Completeness | 5% |
| Mobile Completeness | 0% |
| Infrastructure Completeness | 40% (defined, not provisioned) |
| Test Coverage (Backend) | ~85% |
| API Traceability | 76% (61/85 endpoints) |
| Production Readiness | 25% (8/32 items) |
| Security Completeness | 72% |

### Executive Decision: GO

Development authorized immediately upon resolution of 3 Day-1 blockers:
1. Mobile framework decision (Flutter recommended)
2. Terraform apply (infrastructure provisioning)
3. GitHub Secrets configured

### 13 Remaining Blockers

| # | Blocker | Sprint |
|---|---------|--------|
| B-01 | Mobile framework not chosen — BLOCKS ALL mobile | Day 1 |
| B-02 | Terraform not provisioned | Day 1 |
| B-03 | GitHub Secrets not configured | Day 1 |
| B-04 | Missing migration 011 (unit_photos) | S3 |
| B-05 | Missing migration 012 (device_tokens) | S4 |
| B-06 | Missing migration 013 (messaging) | S6 |
| B-07 | No API client in web frontend | S1 |
| B-08 | No auth context in web | S1 |
| B-09 | No i18n/RTL configured in web | S1 |
| B-10 | Messaging service not implemented | S6 |
| B-11 | Email provider not wired (stub) | S5 |
| B-12 | FCM push provider not implemented | S4 |
| B-13 | Egyptian payment methods not configured (Fawry, Meeza, VodaCash, InstaPay) | S5 |

### 6 Open Decisions (UNRESOLVED)

| Decision | Deadline | Blocker |
|----------|----------|---------|
| Mobile Framework (Flutter vs RN) | Day 1 | ALL mobile development |
| Email Provider | Sprint 4 | Email notifications |
| Analytics Provider | Sprint 8 | Analytics/funnel |
| WebSocket vs SSE | Sprint 5 | Messaging |
| Mobile State Management | Day 1 | Mobile architecture |
| Stripe Scope (international) | Sprint 3 | International bookings |

---

## Session 004 — Constraints Observed

- No source code was modified
- No architecture was changed
- No infrastructure was provisioned
- No new migrations created
- No APIs added
- All work was documentation / planning baseline