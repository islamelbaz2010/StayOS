# SPRINT 0 — ENGINEERING FOUNDATION
## Official Execution Program

**Document Version:** 1.0  
**Date:** 2026-07-29  
**Status:** READY TO EXECUTE  
**Authority:** Derived from STAYOS_PROJECT_READINESS_AUDIT.md (2026-07-29)  
**Supersedes:** All informal pre-sprint planning discussions  
**Classification:** ENGINEERING EXECUTION — INTERNAL  

---

> **BINDING STATEMENT:** This document transforms audit findings into executable engineering work. It does not redesign anything. Every task traces directly to an audit finding or an existing approved document. No new product scope, no new architecture, no new UX.

---

## EXECUTIVE SUMMARY

### Why Sprint 0 Exists

The Project Readiness Audit (2026-07-29) found three areas with no foundation whatsoever — Frontend (5%), Mobile (0%), and Infrastructure (0% provisioned) — alongside six governance decisions that have never been formally made. If Sprint 1 feature development begins without resolving these gaps, every engineering team will build against assumptions that may shift, on infrastructure that does not exist, with undefined tool choices that will require rework.

Sprint 0 is the **foundation sprint**. It has one purpose: make Sprint 1 executable by removing every blocker that was not a feature-level gap.

### Why Sprint 1 Must Not Start Yet

Six conditions from the audit are blocking ALL Sprint 1 tracks simultaneously:

1. `STAYOS_IMPLEMENTATION_BASELINE.md` is unsigned — engineering has no mandate
2. The Phase 0 / Phase 1 governance conflict is unresolved — teams lack authority to build
3. Mobile framework is undecided — 40 screens and the CI pipeline cannot start
4. AWS deployment region is undecided — Terraform cannot be applied
5. GitHub Secrets are not configured — no CI/CD pipeline can deploy
6. No staging infrastructure exists — there is nothing to deploy to

Starting Sprint 1 today means engineers write code they cannot deploy, against APIs that have no runtime environment, with a toolchain half the team has not yet agreed on.

### How Sprint 0 Reduces Project Risk

Sprint 0 eliminates the five highest-risk categories identified in the audit:

| Risk Category | Sprint 0 Action | Risk After Sprint 0 |
|---------------|-----------------|-------------------|
| Infrastructure non-existence | Terraform apply → staging live | Eliminated |
| No web foundation | Next.js i18n + API client + auth context | Reduced to feature build risk |
| No mobile foundation | Framework scaffold + navigation + API client | Reduced to feature build risk |
| Governance ambiguity | Six decisions made, signed, documented | Eliminated |
| No CI/CD | GitHub Secrets + first successful deployment | Eliminated |

After Sprint 0, every Sprint 1 task has: a running environment to deploy to, a typed API client to call, an auth context to consume, a foundation scaffold to build screens in, and a governance mandate to operate under.

---

## SPRINT 0 OBJECTIVES

**One Objective Only: Engineering Foundation Completion**

Sprint 0 is complete when — and only when — every engineering track has a working foundation that Sprint 1 engineers can build features on top of, without making any architectural decisions themselves.

Sprint 0 does NOT include:
- Any guest-facing screen (zero)
- Any host-facing screen (zero)
- Any admin screen (zero)
- Any new product feature
- Any new API beyond the audit-identified gaps
- Any design iteration

Sprint 0 DOES include:
- Every governance decision that was blocked
- Every infrastructure task that had never been executed
- Every foundation layer that Sprint 1 depends on
- Every CI/CD pipe that must run before the first Sprint 1 commit

---

## EXIT CRITERIA

Sprint 0 is officially complete when **every item in this table passes its acceptance test**. Partial completion is not Sprint 0 completion. No partial credit.

| ID | Criterion | Measurement | Gate |
|----|-----------|-------------|------|
| EXIT-01 | `STAYOS_IMPLEMENTATION_BASELINE.md` signed by Founder | Signed document in repository | Governance |
| EXIT-02 | Phase 0 / Phase 1 decision recorded in `DECISION_LOG.md` | New entry DEC-011 present and committed | Governance |
| EXIT-03 | Mobile framework decided and ADR committed to `docs/architecture/adr/` | New ADR file merged to main | Governance |
| EXIT-04 | AWS deployment region resolved and Terraform region variable set to confirmed value | `terraform output` shows correct region | Governance |
| EXIT-05 | Staging environment running and healthy | `curl https://api.staging.stayos.com/health` returns `{"status": "ok"}` | Infrastructure |
| EXIT-06 | All Alembic migrations applied on staging database | `alembic current` shows `010_add_notifications_and_security` | Infrastructure |
| EXIT-07 | GitHub Actions CI pipeline green on `main` | All 5 CI jobs pass on last commit to main | CI/CD |
| EXIT-08 | First successful staging deployment via CI/CD | `deploy-staging.yml` run completes with no errors | CI/CD |
| EXIT-09 | Next.js frontend deployed to Vercel staging URL | Vercel deployment URL loads without error | Frontend |
| EXIT-10 | Next.js i18n working: Arabic RTL and English side-by-side | `/ar/` loads RTL, `/en/` loads LTR — visually confirmed | Frontend |
| EXIT-11 | Typed API client generates from OpenAPI spec and compiles | `pnpm type-check` passes with API client imported | Frontend |
| EXIT-12 | Auth context stores and refreshes tokens end-to-end | E2E smoke test: OTP login → access protected route → refresh — passes | Frontend |
| EXIT-13 | Mobile scaffold runs on iOS Simulator and Android Emulator | Screenshot or screen recording of scaffold running | Mobile |
| EXIT-14 | Mobile API client calls staging backend successfully | Mobile smoke test: `GET /health` returns 200 on device | Mobile |
| EXIT-15 | Mobile auth flow reaches OTP entry screen | Navigation: splash → onboarding → phone entry — functional | Mobile |
| EXIT-16 | Photo upload API implemented and tested | `pytest tests/test_listings.py -k photo` — passes | Backend |
| EXIT-17 | Migration 015 (analytics event log tables) applied | Table `analytics.listing_views` exists in staging DB | Backend |
| EXIT-18 | AWS Secrets Manager client wired and fetching on startup | Staging API logs show "secrets loaded from AWS Secrets Manager" | Backend |
| EXIT-19 | Paymob iframe URL present in `POST /reservations/` response | Smoke test: create reservation → response contains `paymob_iframe_url` | Backend |
| EXIT-20 | CORS production origins locked (no wildcard) | Response header `Access-Control-Allow-Origin` matches staging URL | Backend |
| EXIT-21 | Playwright E2E smoke suite passes against staging | `npx playwright test --project=smoke` — 3 tests green | QA |
| EXIT-22 | Sprint 1 planning session complete | Sprint 1 board created with Day-1 tasks assigned | Delivery |

---

## TRACK A — GOVERNANCE

**Track Owner:** Founder + TPM  
**Timeline:** All items must close on Day 1. No engineering track can be fully unblocked until Track A is complete.  
**Parallelism:** A-01 and A-02 can be done simultaneously. A-03 through A-09 require Founder availability.

---

### A-01 — Sign STAYOS_IMPLEMENTATION_BASELINE.md

| Field | Detail |
|-------|--------|
| **Owner** | Founder (Islam Elbaz) |
| **Priority** | P0 — BLOCKING ALL TRACKS |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Read STAYOS_IMPLEMENTATION_BASELINE.md Section 17 (Production Validation & Executive Decision). Add a signed statement at the end of the document in the format: `APPROVED: [Date] — Islam Elbaz, Founder`. Commit to main branch. |
| **Acceptance Criteria** | Document contains signed approval block. Commit is on `main`. Engineering teams can now reference it as the contractual baseline. |
| **Risk if Skipped** | Engineering has no mandate. Teams may implement against different priorities. |

---

### A-02 — Resolve Phase 0 / Phase 1 Governance Conflict

| Field | Detail |
|-------|--------|
| **Owner** | Founder (Islam Elbaz) |
| **Priority** | P0 — BLOCKING ALL TRACKS |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Add new entry to `DECISION_LOG.md` as DEC-011 with the following fields: Decision, Context, Rationale, Status: Accepted. The decision must explicitly state whether: (a) Phase 1 code (FC-01–FC-07) is retroactively authorized, OR (b) a new Phase designation supersedes Phase 0, OR (c) Phase 0 gates are considered cleared. Do not leave this ambiguous. |
| **Acceptance Criteria** | DEC-011 appears in `DECISION_LOG.md`, committed to `main`. The entry contains no hedging language. It is a clear, dated founder decision. |
| **Risk if Skipped** | Engineers operate without clear authority. Future audits flag this as unresolved. |

---

### A-03 — Mobile Framework Decision

| Field | Detail |
|-------|--------|
| **Owner** | Founder + Mobile Lead |
| **Priority** | P0 — BLOCKING TRACK D |
| **Effort** | 2 hours (decision session) |
| **Dependencies** | Mobile Lead must be identified before this session |
| **Action** | Founder and Mobile Lead conduct a 90-minute decision session. Framework: Flutter vs React Native. Evaluation axes: team familiarity, hire availability in MENA, Paymob mobile SDK support, SQLite/offline support, CI tooling maturity. Decision must be made and committed as a new ADR in `docs/architecture/adr/ADR-016-mobile-framework.md` following the existing ADR template. Simultaneously decide state management: Riverpod (Flutter) or Redux Toolkit (React Native). |
| **Acceptance Criteria** | ADR-016 committed to `main`. ADR status: Accepted. Contains: chosen framework, state management library, rationale, alternatives considered. Mobile Lead can begin scaffold on Day 1 afternoon. |
| **Risk if Skipped** | All 40 mobile screens, mobile CI pipeline, and Push Notifications backend cannot start. |

---

### A-04 — AWS Deployment Region Decision

| Field | Detail |
|-------|--------|
| **Owner** | Founder + DevOps Lead |
| **Priority** | P0 — BLOCKING TRACK E |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Action** | Resolve the conflict between ADR-007 (me-central-1, UAE) and the current Terraform state backend (me-south-1, Bahrain). Considerations: service availability (PostGIS on RDS, ElastiCache, Fargate in chosen region), latency to Egyptian users, compliance, cost. Update `infra/terraform/variables.tf` with the confirmed region value. Update ADR-007 if the decision changes from its current accepted state. |
| **Acceptance Criteria** | `infra/terraform/variables.tf` `region` default is set to the confirmed region. If ADR-007 is unchanged (me-central-1), Terraform state backend must be moved from me-south-1. DevOps Lead can proceed with `terraform init` on Day 1 afternoon. |
| **Risk if Skipped** | `terraform apply` cannot run. Infrastructure provisioning is blocked. |

---

### A-05 — Decide Email Provider

| Field | Detail |
|-------|--------|
| **Owner** | Founder + Backend Lead |
| **Priority** | P1 — BLOCKING Backend task B-06 |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Choose between AWS SES and SendGrid. Evaluation: SES requires domain verification (1–3 days, already on AWS); SendGrid is faster to sandbox but adds a vendor. For consistency with the existing AWS-first infrastructure, SES is the default recommendation. Record decision as DEC-012 in `DECISION_LOG.md`. |
| **Acceptance Criteria** | DEC-012 committed. Backend Lead can proceed with email provider implementation. |

---

### A-06 — Decide Analytics Provider

| Field | Detail |
|-------|--------|
| **Owner** | Founder |
| **Priority** | P1 — BLOCKING Backend task B-11 |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Choose between PostHog, Mixpanel, and Amplitude. For an early-stage MENA startup with budget constraints, PostHog (open-source, self-hostable, EU/US cloud available) is the recommendation. It eliminates per-event cost until scale. Record as DEC-013 in `DECISION_LOG.md`. |
| **Acceptance Criteria** | DEC-013 committed. Analytics event emission can be planned for Sprint 3. |

---

### A-07 — Decide Messaging Transport

| Field | Detail |
|-------|--------|
| **Owner** | Founder + Backend Lead |
| **Priority** | P1 — BLOCKING Sprint 6 Messaging |
| **Effort** | 30 minutes |
| **Dependencies** | None |
| **Action** | Choose between WebSocket and SSE (Server-Sent Events). ADR-008 already accepts SSE + Redis pub/sub for real-time. Messaging chat should use the same SSE pattern for consistency. Record as DEC-014. |
| **Acceptance Criteria** | DEC-014 committed. Messaging architecture can be designed in Sprint 5 without re-opening the decision. |

---

### A-08 — Confirm Stripe Scope

| Field | Detail |
|-------|--------|
| **Owner** | Founder |
| **Priority** | P1 — Clarification for Sprint 3 |
| **Effort** | 15 minutes |
| **Dependencies** | None |
| **Action** | Confirm in writing (DEC-015 in `DECISION_LOG.md`) that Stripe is scoped to international cards only (Visa, Mastercard, Apple Pay, Google Pay). Paymob handles all Egyptian rails (Fawry, Meeza, Vodafone Cash, InstaPay, EGP cards). This is already the ADR-003 position — this task simply confirms it as a business decision so the Finance team has a clear mandate. |
| **Acceptance Criteria** | DEC-015 committed. |

---

### A-09 — Submit WhatsApp Business API Application

| Field | Detail |
|-------|--------|
| **Owner** | Founder |
| **Priority** | P0 — LONG LEAD TIME (4–8 weeks) |
| **Effort** | 4 hours |
| **Dependencies** | Registered business entity in Egypt or UAE |
| **Action** | Apply for Meta Business Manager verification and WhatsApp Business API access. Required information: registered business name, business address, business phone number, Meta Business Manager account, Facebook Business verification. Begin this on Day 1. It cannot be started after Day 1 without pushing the Beta release. |
| **Acceptance Criteria** | Meta Business Manager application submitted. Application reference number recorded. Estimated approval date noted in project risk register. |
| **Risk if Skipped** | WhatsApp (primary notification channel) unavailable at Alpha launch. |

---

### A-10 — Register App Store and Play Store Accounts

| Field | Detail |
|-------|--------|
| **Owner** | Founder |
| **Priority** | P0 — LONG LEAD TIME (1–7 days) |
| **Effort** | 3 hours |
| **Dependencies** | None |
| **Action** | (1) Create Apple Developer Account at developer.apple.com ($99/year). (2) Create Google Play Console account at play.google.com/console ($25 one-time). Both require a verified business entity. App Store review takes 1–3 days per submission. First submission should be planned for Sprint 7–8. Starting accounts now avoids the first-time setup delay at launch. |
| **Acceptance Criteria** | Both accounts created and confirmed. Account IDs recorded in the project credential store. |

---

### A-11 — Update Stale Documents

| Field | Detail |
|-------|--------|
| **Owner** | TPM |
| **Priority** | P2 — Advisory |
| **Effort** | 1 hour |
| **Dependencies** | A-04 (region decision) |
| **Action** | (1) Add a header banner to `TECH_STACK.md` and `ARCHITECTURE.md` stating "CONFLICTS RESOLVED — See ARCHITECTURE_FREEZE.md". (2) Update `MASTER_PROJECT_MEMORY.md` `Project:` field from `UNKNOWN` to `StayOS`. (3) Remove or redirect root-level `SPRINT_MEMORY.md` to `.ai/CURRENT/SPRINT_MEMORY.md`. |
| **Acceptance Criteria** | No document in the repository shows the Paymob/Stripe conflict as open. `Project` field is `StayOS`. |

---

## TRACK B — BACKEND FOUNDATION

**Track Owner:** Backend Lead  
**Timeline:** Days 1–4  
**Parallelism:** B-01 through B-05 can run in parallel after Day 1. B-06 depends on A-05. B-07 depends on E-09.  
**Note:** No new feature modules (Messaging, Reviews, Admin Portal) in Sprint 0. Only audit-identified foundation gaps.

---

### B-01 — Migration 011: unit_photos Table

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Files** | `alembic/versions/011_create_unit_photos.py`, `src/app/listings/models.py` |
| **Description** | Create `pms.unit_photos` table: `id UUID PK`, `unit_id UUID FK → pms.units`, `s3_key TEXT NOT NULL`, `url TEXT NOT NULL`, `order INT NOT NULL DEFAULT 0`, `is_primary BOOL DEFAULT false`, `uploaded_by UUID FK → auth.users`, `created_at TIMESTAMPTZ`. Add `unit_photos` relationship to `Unit` SQLAlchemy model. |
| **Acceptance Criteria** | Migration applies cleanly with `alembic upgrade head`. Downgrade reverses cleanly. `Unit.photos` relationship navigable in Python. |
| **Risk** | Low — additive migration, no existing table affected |

---

### B-02 — Photo Upload API

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | B-01, E-05 (S3 buckets provisioned) |
| **Files** | `src/app/listings/services.py`, `src/app/listings/router.py`, `src/app/listings/schemas.py`, `src/app/listings/repository.py`, `tests/test_listings.py` |
| **Description** | Implement `POST /api/v1/listings/{unit_id}/photos` (host-only, KYC-verified). Flow: (1) validate file count ≤ 20 per listing, (2) generate S3 presigned PUT URL for `S3_LISTINGS_BUCKET/{unit_id}/{uuid}.{ext}`, (3) create `pms.unit_photos` record with `status=pending`, (4) return presigned URL to client for direct S3 upload. Implement `DELETE /api/v1/listings/{unit_id}/photos/{photo_id}` (host-only, owns listing). Implement `GET /api/v1/listings/{unit_id}/photos` (public). Enforce MIME whitelist: `image/jpeg`, `image/png`, `image/webp`. Max size: 10MB per file. |
| **Acceptance Criteria** | `pytest tests/test_listings.py -k photo` passes. Manual test: presigned URL returned, S3 upload succeeds, photo record created. |
| **Risk** | Medium — depends on S3 bucket being provisioned |

---

### B-03 — Migration 012: device_tokens Table

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Files** | `alembic/versions/012_create_device_tokens.py`, `src/app/auth/models.py` |
| **Description** | Create `auth.device_tokens` table: `id UUID PK`, `user_id UUID FK → auth.users`, `fcm_token TEXT NOT NULL`, `platform ENUM('ios','android','web') NOT NULL`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`. Add unique constraint on `(user_id, fcm_token)`. |
| **Acceptance Criteria** | Migration applies and reverses cleanly. |

---

### B-04 — Device Token Registration Endpoint

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 3 hours |
| **Dependencies** | B-03 |
| **Files** | `src/app/auth/router.py`, `src/app/auth/schemas.py`, `src/app/auth/repository.py`, `src/app/auth/services.py`, `tests/test_auth.py` |
| **Description** | Implement `POST /api/v1/auth/device-token` (authenticated). Body: `{ "fcm_token": "string", "platform": "ios|android|web" }`. Upsert device token for the current user. On duplicate `fcm_token`, update `user_id` (token transferred to new user after re-login). |
| **Acceptance Criteria** | Test: authenticated user registers token → token stored. Re-registration updates record. Unauthenticated request returns 401. |

---

### B-05 — Migration 015: Analytics Event Log Tables (ADR-015 Non-Negotiable)

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 — ADR-015 non-negotiable, must be in Sprint 1 schema |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Files** | `alembic/versions/015_create_analytics_events.py` |
| **Description** | Create `analytics` schema. Create tables: `analytics.listing_views` (`id`, `listing_id FK`, `user_id FK nullable`, `session_id`, `locale`, `device_type`, `referrer`, `viewed_at TIMESTAMPTZ`), `analytics.user_searches` (`id`, `user_id nullable`, `query`, `geo_lat`, `geo_lng`, `date_from`, `date_to`, `guests`, `filters JSONB`, `result_count INT`, `searched_at TIMESTAMPTZ`), `analytics.booking_funnel_events` (`id`, `user_id FK nullable`, `listing_id FK`, `event_type ENUM`, `session_id`, `occurred_at TIMESTAMPTZ`). All tables use `TIMESTAMPTZ` with UTC default. |
| **Acceptance Criteria** | Migration applies cleanly. All three tables present in staging. ADR-015 non-negotiable met. |

---

### B-06 — Wire Email Provider (AWS SES)

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P1 |
| **Effort** | 1 day |
| **Dependencies** | A-05 (email provider decision), E-05 (SES domain verified) |
| **Files** | `src/app/notifications/providers.py`, `src/app/notifications/services.py`, `tests/test_notifications.py` |
| **Description** | Replace email provider stub with real AWS SES implementation using `boto3.client('ses')`. Template: `send_email(to: str, subject: str, body_html: str, body_text: str)`. Use SES `send_email` API. Add `SES_FROM_EMAIL` and `SES_REGION` to `src/app/config.py`. Handle `ClientError` with retry up to 3 times. Route to dead-letter on 4th failure. |
| **Acceptance Criteria** | Integration test (with mocked boto3): email send called with correct parameters. No stub references remain in production code paths. SES verified in staging (see E-05). |

---

### B-07 — Fix Paymob Iframe URL in Reservation Response

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 — BOOKING FLOW IS BROKEN WITHOUT THIS |
| **Effort** | 3 hours |
| **Dependencies** | None |
| **Files** | `src/app/reservations/services.py`, `src/app/reservations/schemas.py`, `tests/test_reservations_services.py` |
| **Description** | `create_reservation` in `src/app/reservations/services.py` calls the Paymob provider to create a payment order and payment key but does not return the iframe URL to the caller. Modify `ReservationCreateResponse` schema to include `paymob_iframe_url: str | None` and `stripe_client_secret: str | None`. Populate these fields from the provider response in `create_reservation`. |
| **Acceptance Criteria** | `POST /api/v1/reservations/` response body contains `paymob_iframe_url` for Paymob payments. Existing tests updated and passing. New test: create reservation → verify `paymob_iframe_url` is a valid URL string. |
| **Risk** | Low — data is already present in the service layer, just not returned |

---

### B-08 — Wire AWS Secrets Manager Client

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | E-07 (Secrets Manager populated with staging values) |
| **Files** | `src/app/security/secrets.py`, `src/app/config.py`, `src/app/main.py` |
| **Description** | Replace the placeholder `SecretsManager` AWS backend with a working implementation. On startup (in `lifespan`), fetch the secret bundle from AWS Secrets Manager secret named `stayos/{environment}/app-secrets`. Parse JSON bundle and inject values into `settings` overrides. Fail fast if secrets cannot be fetched in production environment. Allow fallback to environment variables in `development` and `test` environments. |
| **Acceptance Criteria** | Staging API startup log shows "Loaded secrets from AWS Secrets Manager: stayos/staging/app-secrets". If Secrets Manager is unreachable in production, app exits with non-zero code. Unit test: mock `boto3.client` → verify values loaded into settings. |

---

### B-09 — Fix Recurring Maintenance Celery Beat Schedule

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P2 |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Files** | `src/app/celery_app.py` |
| **Description** | Add `app.operations.tasks.spawn_recurring_tasks` to `CELERY_BEAT_SCHEDULE` with a daily schedule at 06:00 UTC. |
| **Acceptance Criteria** | `celery_app.beat_schedule` contains the recurring maintenance task. CI test: `test_celery_app.py` verifies the entry. |

---

### B-10 — Add PropertyReadiness Unique Constraint

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P1 |
| **Effort** | 1 hour |
| **Dependencies** | None |
| **Files** | `alembic/versions/016_add_property_readiness_unique.py`, `src/app/operations/models.py` |
| **Description** | Create migration 016 to add `UNIQUE(unit_id, reservation_id)` constraint to `operations.property_readiness`. Add `UniqueConstraint` to the SQLAlchemy model. Handle `IntegrityError` in `operations/repository.py` as a `ConflictError`. |
| **Acceptance Criteria** | Migration applies cleanly. Attempting to insert a duplicate `(unit_id, reservation_id)` raises `ConflictError (409)`. |

---

### B-11 — Lock CORS to Production Origins

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P0 |
| **Effort** | 1 hour |
| **Dependencies** | E-05 (Vercel URL known) |
| **Files** | `src/app/shared/middleware.py`, `src/app/config.py` |
| **Description** | Add `CORS_ORIGINS: list[str]` to settings (comma-separated in environment variables). Replace any wildcard CORS with explicit origin list. Staging: `["https://staging.stayos.com", "http://localhost:3000"]`. Production: `["https://stayos.com", "https://www.stayos.com"]`. |
| **Acceptance Criteria** | `curl -H "Origin: https://evil.com" https://api.staging.stayos.com/api/v1/listings/` — response does NOT include `Access-Control-Allow-Origin: *`. Legitimate staging origin returns correct CORS headers. |

---

### B-12 — ADR-015 Schema Compliance Verification

| Field | Detail |
|-------|--------|
| **Owner** | Backend Lead |
| **Priority** | P1 |
| **Effort** | 2 hours |
| **Dependencies** | None |
| **Files** | All migration files 003–010, `src/app/*/models.py` |
| **Description** | Audit every table against ADR-015 non-negotiables: (1) All monetary `amount` columns — verify type is `INTEGER` (minor units) and a companion `currency CHAR(3)` column exists. If not, create patch migration. (2) `auth.accounts` — verify `locale VARCHAR(10)` column exists. (3) `pms.unit_listings` — verify `country CHAR(2)` and `currency CHAR(3)` columns exist. Create patch migrations for any missing columns. |
| **Acceptance Criteria** | All three ADR-015 non-negotiables verified present in staging DB. Any missing columns added via migrations that apply cleanly. |

---

## TRACK C — FRONTEND FOUNDATION

**Track Owner:** Web Lead  
**Timeline:** Days 1–5  
**Parallelism:** C-01 through C-03 run in parallel. C-04 depends on C-01 (API spec URL). C-05 through C-10 depend on C-01 and C-02.  
**Tooling Selections** (decided here, not open): `next-intl` for i18n, `TanStack Query` for server state, `Zustand` for client state, `Tailwind CSS` for styling, `openapi-typescript` for type generation, `Vitest` + `React Testing Library` for unit tests, `Playwright` for E2E.

---

### C-01 — Project Configuration and Environment

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 3 hours |
| **Dependencies** | E-05 (staging URL known) |
| **Deliverables** | Updated `apps/web/next.config.mjs`, `apps/web/.env.local.example`, `apps/web/package.json` |
| **Description** | (1) Update `next.config.mjs`: add `images.domains` (S3 bucket + CloudFront domain), `async rewrites()` proxying `/api` to the backend URL in non-production, remove `swcMinify` (deprecated in Next.js 14). (2) Create `.env.local.example` with all required variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, `NEXT_PUBLIC_FIREBASE_CONFIG`, `NEXT_PUBLIC_PAYMOB_IFRAME_ID`, `NEXT_PUBLIC_SENTRY_DSN`. (3) Install production dependencies: `next-intl`, `@tanstack/react-query`, `zustand`, `axios`. Install dev dependencies: `openapi-typescript`, `vitest`, `@testing-library/react`, `@playwright/test`. Update `pnpm-lock.yaml`. |
| **Acceptance Criteria** | `pnpm install` completes. `pnpm build` produces no errors. `pnpm type-check` passes. |

---

### C-02 — Tailwind CSS and Design Token Implementation

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | None — design system is frozen in VISUAL_DESIGN_SYSTEM_P1.md |
| **Deliverables** | `apps/web/tailwind.config.ts`, `apps/web/app/globals.css` |
| **Description** | Install Tailwind CSS + `@tailwindcss/typography` + `tailwindcss-rtl` plugin. Configure `tailwind.config.ts` with all design tokens from VISUAL_DESIGN_SYSTEM_P1.md: (1) `colors` — all color tokens (primary, secondary, semantic, neutrals). (2) `fontFamily` — Inter (LTR), Cairo (Arabic/RTL). (3) `spacing` — 4px base grid (1 = 4px). (4) `boxShadow` — all 5 shadow tokens. (5) `borderRadius` — all radius tokens. In `globals.css`: define CSS custom properties for all tokens. Set `html[dir="rtl"]` base styles. Import Cairo and Inter fonts from Google Fonts. |
| **Acceptance Criteria** | `pnpm build` passes. A test page using `className="text-primary-500 font-arabic"` renders correctly. RTL: `className="ps-4"` (padding-start) renders correctly in RTL direction. |

---

### C-03 — i18n and RTL Configuration

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | C-01 |
| **Deliverables** | `apps/web/i18n.ts`, `apps/web/middleware.ts`, `apps/web/messages/ar.json`, `apps/web/messages/en.json`, `apps/web/app/[locale]/layout.tsx` |
| **Description** | Configure `next-intl` for Arabic (`ar`) and English (`en`). (1) Create `i18n.ts` with locale configuration, defaultLocale: `ar`, locales: `['ar', 'en']`. (2) Create `middleware.ts` using `next-intl` middleware to detect locale from URL. (3) Update `apps/web/app/[locale]/layout.tsx` to set `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`. (4) Create initial `messages/ar.json` and `messages/en.json` with at least 20 base keys covering navigation, auth, errors, and common labels. (5) Wrap root layout with `NextIntlClientProvider`. |
| **Acceptance Criteria** | `/ar/` URL loads with `dir="rtl"` on `<html>`. `/en/` URL loads with `dir="ltr"`. `useTranslations('common')` returns Arabic string on `/ar/`. CI: `pnpm type-check` passes. |

---

### C-04 — Typed API Client

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | E-05 (staging API running with OpenAPI at `/openapi.json`) |
| **Deliverables** | `apps/web/lib/api/generated.ts`, `apps/web/lib/api/client.ts`, `apps/web/lib/api/index.ts` |
| **Description** | (1) Run `openapi-typescript https://api.staging.stayos.com/openapi.json -o apps/web/lib/api/generated.ts` to generate TypeScript types from the FastAPI OpenAPI spec. Add this as a `pnpm generate:api` script. (2) Create `apps/web/lib/api/client.ts` using `axios`: configure `baseURL` from `NEXT_PUBLIC_API_URL`, attach `Authorization: Bearer {token}` header from session, handle 401 by triggering token refresh, handle 422 validation errors and surface field-level errors. (3) Export typed endpoint wrappers in `apps/web/lib/api/index.ts` — one function per API endpoint group (auth, listings, reservations, finance, operations). |
| **Acceptance Criteria** | `pnpm generate:api` completes without errors. `apps/web/lib/api/generated.ts` compiles. Calling `api.listings.list({ locale: 'ar' })` is typed and returns the correct response type. |

---

### C-05 — Authentication Context

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | C-04 |
| **Deliverables** | `apps/web/lib/auth/context.tsx`, `apps/web/lib/auth/session.ts`, `apps/web/middleware.ts` (updated) |
| **Description** | (1) Implement `AuthContext` with: `user: User | null`, `isLoading: boolean`, `login(phone: string): Promise<void>`, `verifyOtp(otp: string): Promise<void>`, `logout(): Promise<void>`, `refreshToken(): Promise<void>`. (2) Store access token in memory (React state), refresh token in `httpOnly` cookie via a Next.js API route `/api/auth/set-cookie` (BFF pattern per ADR-014). (3) On app mount, call `GET /auth/me` to hydrate user. On 401, call refresh token; on refresh failure, clear session and redirect to `/[locale]/login`. (4) Create `useAuth()` hook. (5) Create `ProtectedRoute` wrapper component that redirects to login if `user === null`. |
| **Acceptance Criteria** | E2E smoke test (Playwright): OTP login → `user` is populated → access protected page → user shown. Refresh: manually expire access token → next API call triggers refresh → succeeds without logout. |

---

### C-06 — Server State Management (TanStack Query)

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 3 hours |
| **Dependencies** | C-04, C-05 |
| **Deliverables** | `apps/web/lib/query/client.ts`, `apps/web/app/providers.tsx` |
| **Description** | (1) Configure `QueryClient` with defaults: `staleTime: 5 * 60 * 1000` (5 minutes), `retry: 2`, `refetchOnWindowFocus: false`. (2) Create `apps/web/app/providers.tsx` wrapping children with `QueryClientProvider` and `NextIntlClientProvider`. (3) Create first query hook: `useListings(filters: ListingSearchFilters)` calling `api.listings.list(filters)` with TanStack Query. |
| **Acceptance Criteria** | `pnpm type-check` passes. Search results page can import and call `useListings()` without type errors. |

---

### C-07 — Layout System and Routing

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | C-02, C-03 |
| **Deliverables** | `apps/web/app/[locale]/layout.tsx`, `apps/web/components/layouts/GuestLayout.tsx`, `apps/web/components/layouts/HostLayout.tsx`, `apps/web/components/layouts/AuthLayout.tsx`, `apps/web/components/nav/Header.tsx`, `apps/web/components/nav/Footer.tsx` |
| **Description** | (1) Root locale layout: `<html lang dir>` wrapper with Google Fonts, global CSS, `Providers`. (2) `GuestLayout`: header with search bar, language toggle, login/signup CTA, footer. (3) `HostLayout`: sidebar navigation, language toggle, user avatar menu. (4) `AuthLayout`: centered card layout for login, signup, KYC screens. (5) `Header`: Arabic-first navigation — Arabic text rendered correctly in RTL, LTR toggle switches direction. (6) `Footer`: minimal, Arabic primary. |
| **Acceptance Criteria** | Navigating to `/ar/search` shows Arabic RTL header. Navigating to `/en/search` shows English LTR header. Language toggle switches locale and maintains current path. `pnpm build` passes. |

---

### C-08 — Error Handling and Loading States

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Dependencies** | C-04, C-06 |
| **Deliverables** | `apps/web/components/ui/ErrorBoundary.tsx`, `apps/web/components/ui/Skeleton.tsx`, `apps/web/app/[locale]/error.tsx`, `apps/web/app/[locale]/not-found.tsx` |
| **Description** | (1) `ErrorBoundary` React component: catches render errors, shows Arabic-first error message with retry CTA. (2) `Skeleton` component: matches listing card, search results, and profile form shapes from VISUAL_DESIGN_SYSTEM_P3.md skeleton states. (3) Next.js `error.tsx` page: bilingual error message with back-home CTA. (4) Next.js `not-found.tsx` page: Arabic-first 404 with navigation. |
| **Acceptance Criteria** | Throwing an error inside a page renders the Arabic error boundary, not a blank screen. A route that doesn't exist renders the Arabic 404 page. |

---

### C-09 — Frontend Unit Test Configuration

| Field | Detail |
|-------|--------|
| **Owner** | Web Lead |
| **Priority** | P1 |
| **Effort** | 3 hours |
| **Dependencies** | C-01 |
| **Deliverables** | `apps/web/vitest.config.ts`, `apps/web/tests/setup.ts`, first passing unit test |
| **Description** | Configure Vitest with `@testing-library/react`, `@testing-library/user-event`, and `msw` for API mocking. Set up jsdom environment. Write first unit test: render `Header` component → assert "StayOS" text present → assert `dir="rtl"` attribute present when locale is `ar`. Add `pnpm test` and `pnpm test:coverage` scripts. |
| **Acceptance Criteria** | `pnpm test` runs and first test passes. CI frontend job updated to run `pnpm test`. |

---

## TRACK D — MOBILE FOUNDATION

**Track Owner:** Mobile Lead  
**Timeline:** Days 1–5 (Day 1 afternoon after A-03 completes)  
**Parallelism:** D-01 is a prerequisite for all others. D-02 through D-06 run in parallel after D-01.  
**Note:** All tasks below assume Flutter is selected. If React Native is selected, substitute equivalent tooling as noted.

---

### D-01 — Framework Scaffold

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P0 — FIRST TASK |
| **Effort** | 4 hours |
| **Dependencies** | A-03 (framework decision) |
| **Flutter Deliverable** | `apps/mobile/` directory with Flutter project, `pubspec.yaml`, `lib/main.dart` |
| **React Native Deliverable** | `apps/mobile/` directory with RN project, `package.json`, `App.tsx` |
| **Description** | Initialize the mobile project inside `apps/mobile/`. For Flutter: `flutter create --org com.stayos --project-name stayos_mobile apps/mobile`. For React Native: `npx react-native init StayOSMobile --template react-native-template-typescript --directory apps/mobile`. Configure `.gitignore` for mobile artifacts. Add `apps/mobile` to the monorepo structure. |
| **Acceptance Criteria** | `flutter run` (or `npx react-native run-ios`) launches the scaffold on simulator. Clean build with no warnings. |

---

### D-02 — Navigation Architecture

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | D-01 |
| **Flutter** | `go_router` package, `lib/router/app_router.dart` |
| **React Native** | React Navigation 6, `src/navigation/AppNavigator.tsx` |
| **Description** | Implement the navigation structure matching the screen hierarchy in the Implementation Baseline (SCR-001 through SCR-032 for guest; SCR-033 through SCR-054 for host). Route definitions only — screens are stub placeholders. Structure: (1) Unauthenticated stack: Splash → Onboarding → Phone Entry → OTP Verify → Social Login. (2) KYC gate: KYC Start → Document Capture → Selfie → Pending. (3) Guest tab bar: Home, Search, Trips, Messages, Profile. (4) Host tab bar: Dashboard, Listings, Operations, Payouts, Profile. Deep link structure: `stayos://listing/{id}`, `stayos://reservation/{id}`. |
| **Acceptance Criteria** | Navigation between all defined routes works. Deep links open correct stub screen. No navigation crashes on back-press from any stub screen. |

---

### D-03 — Localization (Arabic RTL First)

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | D-01 |
| **Flutter** | `flutter_localizations`, `intl` package, `lib/l10n/` ARB files |
| **React Native** | `react-native-localization` or `i18next-react-native-language-detector` |
| **Description** | Configure the app to support Arabic (`ar`) and English (`en`). Arabic is the default. RTL layout must be the default. All text strings extracted to localization files from Day 1 — no hardcoded strings. Set up `ar.arb` and `en.arb` (Flutter) or `ar.json` and `en.json` (RN). Initial strings: app name, navigation labels, auth screen labels, error messages. |
| **Acceptance Criteria** | App launches in Arabic RTL. Switching to English changes direction to LTR. All text in the scaffold uses localization keys, not hardcoded strings. |

---

### D-04 — Theme System

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | D-01 |
| **Flutter** | `lib/theme/app_theme.dart` with `ThemeData` |
| **React Native** | `src/theme/theme.ts` with `StyleSheet` tokens |
| **Description** | Implement the mobile design tokens from MOBILE_NATIVE_DESIGN_P1.md: primary color `#2C5FFF`, font families (Cairo for Arabic, Inter for English), spacing grid (8px base), border radii, shadow styles. Configure both light and dark mode themes. Apply theme to the scaffold root widget/component. |
| **Acceptance Criteria** | Scaffold screens use the correct primary color and font. Dark mode toggle switches theme. No hardcoded hex colors anywhere. |

---

### D-05 — Mobile API Client

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | D-01, E-05 (staging API running) |
| **Flutter** | `dio` package, `lib/services/api_client.dart` |
| **React Native** | `axios`, `src/services/apiClient.ts` |
| **Description** | Create typed API client targeting `NEXT_PUBLIC_API_URL` (configurable via `--dart-define` or `.env`). Features: (1) Base URL from environment. (2) Attach `Authorization: Bearer {token}` header. (3) On 401, call refresh token endpoint; on refresh failure, emit logout event. (4) Map API error responses (`{ "error": { "code", "message", "message_ar" } }`) to typed `ApiError` class. (5) Implement methods for: `auth.*`, `listings.*`, `reservations.*`, `finance.*` — returning typed models. |
| **Acceptance Criteria** | Smoke test: call `GET /health` from running app on simulator → returns `{"status": "ok"}` — log visible in console. Unauthenticated call to protected endpoint receives `ApiError(code: "NOT_AUTHENTICATED")`. |

---

### D-06 — Mobile Authentication Context

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | D-05 |
| **Flutter** | `lib/providers/auth_provider.dart` (Riverpod) or `lib/bloc/auth/` (Bloc) |
| **React Native** | `src/store/authSlice.ts` (Redux Toolkit) |
| **Description** | Implement auth state: `user: User?`, `isLoading: bool`, `error: String?`. Implement actions: `sendOtp(phone)`, `verifyOtp(phone, code)`, `logout()`, `refreshToken()`. Store tokens in `FlutterSecureStorage` (Flutter) or `react-native-keychain` (RN). On app launch, read stored refresh token → call `/auth/refresh` → populate user. On 401 refresh failure, clear storage and navigate to login. |
| **Acceptance Criteria** | Navigating to a protected route while unauthenticated redirects to phone entry. After OTP verification, user state is populated and persists across app restarts. Logout clears all stored tokens. |

---

### D-07 — Push Notification SDK Setup

| Field | Detail |
|-------|--------|
| **Owner** | Mobile Lead |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Dependencies** | D-01, A-10 (Firebase project created) |
| **Flutter** | `firebase_core`, `firebase_messaging` packages |
| **React Native** | `@react-native-firebase/messaging` |
| **Description** | Integrate Firebase Cloud Messaging SDK. (1) Connect to the Firebase project created in A-10. (2) Request permission on app launch (iOS requires explicit permission). (3) On permission granted, call `POST /api/v1/auth/device-token` with the FCM token. (4) Handle foreground messages: display in-app notification banner. (5) Handle background/terminated: navigate to correct screen on tap using deep link. |
| **Acceptance Criteria** | Device token registered in `auth.device_tokens` table after first app launch. Test push from Firebase Console: notification appears on device. Tapping notification opens the app. |

---

### D-08 — Mobile CI Pipeline

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead + Mobile Lead |
| **Priority** | P0 |
| **Effort** | 1 day |
| **Dependencies** | A-03 (framework decision), A-10 (store accounts) |
| **Deliverables** | `.github/workflows/mobile-ci.yml` |
| **Description** | Create GitHub Actions workflow for mobile CI: (1) Trigger on PR to `develop` or `main`. (2) Set up Flutter (or Node.js + Java for RN). (3) Run `flutter analyze` (or `eslint`). (4) Run `flutter test` (or `jest`). (5) Build release APK (Android): `flutter build apk --release` or equivalent. (6) Build iOS archive (macOS runner): `flutter build ipa --release` or equivalent. Do NOT upload to stores — that is a Sprint 7 task. |
| **Acceptance Criteria** | Mobile CI workflow triggers on PR. `flutter analyze` and `flutter test` pass. Android APK builds successfully. iOS build succeeds on `macos-latest` runner. |

---

## TRACK E — INFRASTRUCTURE

**Track Owner:** DevOps Lead  
**Timeline:** Days 1–3 (critical path — everything depends on staging being live)  
**Parallelism:** E-01 and E-02 must run before E-03. E-04 through E-10 can run in parallel after E-03.

---

### E-01 — Resolve Terraform Configuration

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P0 — FIRST TASK |
| **Effort** | 4 hours |
| **Dependencies** | A-04 (region decision) |
| **Files** | `infra/terraform/rds.tf`, `infra/terraform/ecs.tf`, `infra/terraform/variables.tf`, `infra/terraform/main.tf` |
| **Description** | (1) Update `infra/terraform/variables.tf`: set confirmed `region` default. (2) Fix `infra/terraform/rds.tf`: add custom parameter group `aws_db_parameter_group` with `family = "postgres16"`, parameter `rds.force_ssl = 1`, and `shared_preload_libraries = pg_stat_statements,pg_stat_bgwriter`. Set `parameter_group_name` on the `aws_db_instance`. (3) Fix `infra/terraform/ecs.tf`: replace all `subnet-xxx` and `sg-xxx` placeholder values with Terraform data sources or variables. Reference `aws_vpc.main.id`, `aws_subnet.private[*].id`, `aws_security_group.ecs_tasks.id`. (4) Move Terraform state backend to confirmed region if different from current `me-south-1`. (5) Create `infra/terraform/staging.tfvars` with all variable values for staging environment. |
| **Acceptance Criteria** | `terraform validate` passes. `terraform plan -var-file=staging.tfvars` produces no errors. No placeholder values remain. |

---

### E-02 — Configure GitHub Secrets

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead + Founder |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | None (can run in parallel with E-01) |
| **Description** | Populate all required GitHub Actions secrets in the repository Settings → Secrets and Variables → Actions: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (after creating Vercel project), `FIREBASE_SERVICE_ACCOUNT_JSON`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `PAYMOB_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENTRY_DSN`, `JWT_PRIVATE_KEY` (staging RSA key), `JWT_PUBLIC_KEY`. |
| **Acceptance Criteria** | All secrets listed above present in GitHub Actions secret store. Running `deploy-staging.yml` manually does not fail with "secret not found" errors. |

---

### E-03 — Provision Staging Infrastructure

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P0 — CRITICAL PATH |
| **Effort** | 1 day |
| **Dependencies** | E-01, E-02 |
| **Description** | Execute `terraform init` then `terraform apply -var-file=staging.tfvars -auto-approve` for the staging environment. Resources to confirm created: VPC + subnets + NAT Gateway, RDS PostgreSQL 16 (PostGIS parameter group applied), ElastiCache Redis 7, ECS cluster, ECR repositories (api, celery-worker, celery-beat), ALB with HTTPS listener + ACM certificate, S3 buckets (`stayos-listings-staging`, `stayos-kyc-staging`, `stayos-ops-staging`), IAM roles (ECS task execution role, Celery task role). Note all `terraform output` values: RDS endpoint, Redis endpoint, ALB DNS, S3 bucket names. |
| **Acceptance Criteria** | `terraform output` shows all resources. RDS is reachable from private subnet. ALB returns 503 (no backend yet — expected). S3 buckets exist with correct policies. Redis endpoint pings. |

---

### E-04 — AWS Secrets Manager Population

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | E-03 |
| **Description** | Create AWS Secrets Manager secret `stayos/staging/app-secrets` as a JSON blob containing all application runtime secrets: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, `FIREBASE_CREDENTIALS_JSON`, `PAYMOB_API_KEY`, `PAYMOB_IFRAME_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AWS_S3_LISTINGS_BUCKET`, `AWS_S3_KYC_BUCKET`, `AWS_S3_OPS_BUCKET`, `SENTRY_DSN`. |
| **Acceptance Criteria** | Secret exists in AWS Secrets Manager. `aws secretsmanager get-secret-value --secret-id stayos/staging/app-secrets` returns the full JSON. |

---

### E-05 — First Backend Deployment to Staging

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P0 — CRITICAL PATH |
| **Effort** | 4 hours |
| **Dependencies** | E-03, E-04, B-08 (Secrets Manager wired in code) |
| **Description** | (1) Build Docker image locally: `docker build -f infra/docker/api/Dockerfile -t stayos-api:staging .`. (2) Push to ECR: `aws ecr get-login-password | docker login ... && docker push ...`. (3) Run `alembic upgrade head` against staging RDS from a one-off ECS task (or locally with the staging DATABASE_URL). (4) Register new ECS task definition pointing to the pushed image. (5) Update ECS service to use new task definition. (6) Verify ALB health check passes. |
| **Acceptance Criteria** | `curl https://api.staging.stayos.com/health` returns `{"status": "ok", "database": "ok", "redis": "ok"}`. API logs show "Loaded secrets from AWS Secrets Manager". ECS task definition running with 0 restart errors. |

---

### E-06 — Link Vercel Project and Deploy Frontend

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead + Web Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | E-02, C-01 |
| **Description** | (1) Create Vercel project linked to the repository `apps/web` directory. (2) Configure Vercel environment variables for staging: `NEXT_PUBLIC_API_URL=https://api.staging.stayos.com`. (3) Run first Vercel deployment via `vercel --prod --token $VERCEL_TOKEN`. (4) Record `VERCEL_PROJECT_ID` and add to GitHub Secrets. (5) Verify the CI frontend job in `ci.yml` triggers Vercel preview deployments on PR. |
| **Acceptance Criteria** | Vercel dashboard shows staging deployment URL. `https://stayos.vercel.app` (or custom staging domain) loads the Next.js scaffold. |

---

### E-07 — Configure SES Domain Verification

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead + Founder |
| **Priority** | P1 |
| **Effort** | 2 hours (plus up to 72 hours DNS propagation) |
| **Dependencies** | E-03 (SES enabled in the chosen region) |
| **Description** | (1) In AWS SES console, add `stayos.com` as a verified domain. (2) Add the SES DKIM and SPF DNS records to the domain registrar. (3) Request production sending limit increase in AWS SES (default sandbox limits 200 emails/day). |
| **Acceptance Criteria** | SES console shows domain as "Verified". A test email from `noreply@stayos.com` is received in inbox (not spam). |

---

### E-08 — Configure CloudFront for S3 Listings Bucket

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P1 |
| **Effort** | 3 hours |
| **Dependencies** | E-03 |
| **Description** | Create CloudFront distribution with S3 `stayos-listings-staging` as the origin. Configure: (1) Origin Access Control (OAC) so S3 is not publicly accessible directly. (2) HTTPS only. (3) Compress assets (gzip + brotli). (4) Cache policy: `CachingOptimized` for images (TTL 86400s). (5) WAF association (if WAF is provisioned in E-10). (6) Record CloudFront domain and add to `next.config.mjs` `images.domains`. |
| **Acceptance Criteria** | `curl https://{cloudfront-domain}/{test-key}` returns a test image with `Cache-Control: max-age=86400`. Photo URL stored in `pms.unit_photos.url` uses CloudFront domain, not S3 domain. |

---

### E-09 — Configure PgBouncer

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P1 |
| **Effort** | 4 hours |
| **Dependencies** | E-03 |
| **Description** | Add PgBouncer as an ECS sidecar or a dedicated ECS service in the Terraform configuration. Configure: (1) `pool_mode = transaction` (compatible with SQLAlchemy async). (2) `max_client_conn = 1000`. (3) `default_pool_size = 25` per database. (4) Update `DATABASE_URL` in Secrets Manager to point to PgBouncer endpoint, not RDS directly. (5) Verify SQLAlchemy `POOL_PRE_PING = True` is set to handle connection recycling. |
| **Acceptance Criteria** | `psql -h pgbouncer-endpoint -U stayos -c "SELECT 1"` succeeds. Backend connects via PgBouncer. RDS `pg_stat_activity` shows connections originating from PgBouncer. |

---

### E-10 — Configure WAF on ALB

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P1 |
| **Effort** | 3 hours |
| **Dependencies** | E-03 |
| **Description** | Create `aws_wafv2_web_acl` Terraform resource in the deployed region. Associate with the ALB. Enable managed rule groups: (1) `AWSManagedRulesCommonRuleSet` (OWASP Top 10). (2) `AWSManagedRulesSQLiRuleSet` (SQL injection). (3) `AWSManagedRulesKnownBadInputsRuleSet`. Set WAF to `BLOCK` mode. Add rate limit rule: max 100 requests per IP per 5 minutes. |
| **Acceptance Criteria** | `aws wafv2 get-web-acl --name stayos-staging --scope REGIONAL` returns the ACL. Sending a SQLi payload to `GET /api/v1/listings?query=1' OR '1'='1` returns HTTP 403 (blocked by WAF). |

---

### E-11 — Configure CloudWatch Alerting

| Field | Detail |
|-------|--------|
| **Owner** | DevOps Lead |
| **Priority** | P2 |
| **Effort** | 2 hours |
| **Dependencies** | E-03 |
| **Description** | Create CloudWatch alarms for staging: (1) ECS task CPU > 80% for 5 minutes → SNS alert. (2) 5XX error rate on ALB > 1% for 3 minutes → SNS alert. (3) RDS CPU > 80% → SNS alert. (4) Redis memory > 75% → SNS alert. Create SNS topic → email subscription to the DevOps Lead. |
| **Acceptance Criteria** | CloudWatch console shows 4 alarms in OK state. Test: trigger a 500 error manually → alarm transitions to ALARM state → email received. |

---

## TRACK F — QA FOUNDATION

**Track Owner:** QA Lead  
**Timeline:** Days 2–5 (depends on staging being live for E2E tests)  
**Parallelism:** F-01 can start Day 1. F-02 through F-05 start Day 3 after E-05 (staging live).

---

### F-01 — Playwright E2E Test Infrastructure

| Field | Detail |
|-------|--------|
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | C-01 (pnpm installed) |
| **Deliverables** | `apps/web/playwright.config.ts`, `apps/web/tests/e2e/` directory |
| **Description** | Install Playwright: `pnpm add -D @playwright/test`. Install browsers: `npx playwright install --with-deps chromium`. Configure `playwright.config.ts`: base URL from environment, 3 parallel workers, screenshots on failure, video on first retry, HTML report. Create 3 projects: `smoke` (Chromium only, 1 worker), `web` (Chromium + Firefox), `mobile` (Mobile Chrome + Mobile Safari). |
| **Acceptance Criteria** | `npx playwright test --project=smoke` runs (even with 0 test files — should output "no tests found"). Configuration file has no TypeScript errors. `pnpm test:e2e` script added to `package.json`. |

---

### F-02 — Smoke Test: Health Check

| Field | Detail |
|-------|--------|
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 1 hour |
| **Dependencies** | F-01, E-05 (staging live) |
| **Deliverables** | `apps/web/tests/e2e/smoke/health.spec.ts` |
| **Description** | Test 1: `GET https://api.staging.stayos.com/health` → response body `status === "ok"`. Test 2: `GET https://api.staging.stayos.com/health/ready` → response body `database === "ok" && redis === "ok"`. Test 3: Load `https://stayos.vercel.app/ar/` → page title contains "StayOS" → `html` element has `dir="rtl"`. |
| **Acceptance Criteria** | All 3 tests pass in CI against staging. Test runtime < 10 seconds. |

---

### F-03 — Smoke Test: Authentication Flow

| Field | Detail |
|-------|--------|
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | F-01, E-05, C-05 (auth context), F-05 (test data seeded) |
| **Deliverables** | `apps/web/tests/e2e/smoke/auth.spec.ts` |
| **Description** | Test: (1) Navigate to `/ar/login`. (2) Enter a test phone number (pre-registered in staging). (3) Assert OTP request sent (mock OTP in staging using `settings.MOCK_OTP=true` and fixed OTP `123456`). (4) Enter OTP `123456`. (5) Assert redirect to `/ar/search` (or home). (6) Assert user avatar visible in header. (7) Assert `GET /auth/me` returns user object. Test cleanup: logout. |
| **Acceptance Criteria** | Auth smoke test passes in CI. Add `MOCK_OTP` config to staging Secrets Manager (value: `true`). |

---

### F-04 — Smoke Test: Listing Search

| Field | Detail |
|-------|--------|
| **Owner** | QA Lead |
| **Priority** | P0 |
| **Effort** | 2 hours |
| **Dependencies** | F-01, E-05, F-05 (test listing seeded) |
| **Deliverables** | `apps/web/tests/e2e/smoke/search.spec.ts` |
| **Description** | Test: (1) Navigate to `/ar/search?q=Cairo` (unauthenticated). (2) Assert at least one listing card visible. (3) Assert listing card contains Arabic title text. (4) Assert listing card contains price in EGP format. |
| **Acceptance Criteria** | Search smoke test passes. At least one seed listing returned. |

---

### F-05 — Test Data Seeder

| Field | Detail |
|-------|--------|
| **Owner** | QA Lead + Backend Lead |
| **Priority** | P0 |
| **Effort** | 4 hours |
| **Dependencies** | E-05 (staging DB live) |
| **Deliverables** | `scripts/seed_staging.py` |
| **Description** | Extend the existing `scripts/staging_seed.sh` with a Python seeder `scripts/seed_staging.py`. Creates: (1) Admin user (`admin@stayos.com`, verified, `role=admin`). (2) Host user (`host@stayos.com`, KYC verified). (3) Guest user with test phone number (`+201000000001`, KYC verified). (4) 3 test listings in Cairo (one published, one draft, one unlisted) with seeded latitude/longitude for PostGIS. (5) One completed reservation (for E2E test of finance and operations flows). Run as part of staging startup script. |
| **Acceptance Criteria** | Running `python scripts/seed_staging.py` against staging populates all five data entities. Idempotent: running twice does not create duplicates. |

---

### F-06 — CI Integration: E2E Smoke on Deploy

| Field | Detail |
|-------|--------|
| **Owner** | QA Lead + DevOps Lead |
| **Priority** | P1 |
| **Effort** | 2 hours |
| **Dependencies** | F-02, F-03, F-04, E-05, E-08 (first CI deploy working) |
| **Deliverables** | Updated `.github/workflows/deploy-staging.yml` |
| **Description** | Add a post-deploy step to `deploy-staging.yml` that runs `npx playwright test --project=smoke` against the freshly deployed staging URL. If smoke tests fail, mark the deployment as failed. Store Playwright HTML report as a GitHub Actions artifact. |
| **Acceptance Criteria** | After a successful staging deploy, Playwright smoke tests run automatically. A smoke test failure causes the deploy workflow to fail. |

---

## DEPENDENCIES

### Critical Path

The critical path for Sprint 0 — the sequence where any delay directly delays Sprint 0 completion:

```
A-04 (Region Decision)
    ↓
E-01 (Fix Terraform)
    ↓
E-02 (GitHub Secrets) — parallel
    ↓
E-03 (Terraform Apply → Staging Live)
    ↓
E-04 (Populate Secrets Manager)
    ↓
E-05 (First Backend Deployment)         B-08 (Wire Secrets Manager) ─→ E-05
    ↓                                   B-07 (Paymob iframe fix) ─→ E-05
F-05 (Test Data Seed)
    ↓
F-03 / F-04 (E2E Smoke Tests)
    ↓
EXIT-21 (E2E Smoke Suite Passes)
    ↓
EXIT-CRITERIA ALL MET → Sprint 1 Authorized
```

### Parallel Work (Independent of Critical Path)

| Track | Tasks | Can Start |
|-------|-------|-----------|
| Governance | A-01, A-02, A-05 through A-11 | Day 1 morning |
| Backend B | B-01, B-03, B-05, B-09, B-10, B-12 | Day 1 |
| Frontend C | C-01, C-02, C-03 | Day 1 |
| Mobile D | D-01 (after A-03), then D-02 through D-07 | Day 1 afternoon |

### Blocked Work (Cannot Start in Sprint 0)

| Work | Blocked By | Expected Sprint |
|------|-----------|----------------|
| Messaging module | A-07 (transport decision), then design + implementation | Sprint 6 |
| Reviews module | No decision blocker — scheduled Sprint 7 | Sprint 7 |
| Admin portal screens | E2E scaffolding, then design implementation | Sprint 5–6 |
| FCM push implementation | D-07 (FCM SDK), A-10 (Firebase project) | Sprint 4 |
| Egyptian payment methods (Fawry, Meeza, etc.) | Paymob merchant integration IDs | Sprint 5 |
| Penetration test | All features complete | Sprint 7 |

---

## TEAM ALLOCATION

### Recommended Roles and Assignments

| Role | Count | Sprint 0 Responsibilities |
|------|-------|--------------------------|
| **Founder** | 1 | A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-08, A-09, A-10 — Day 1 only, then back to business |
| **Backend Lead** | 1 | B-01 through B-12 |
| **Backend Engineer** | 1 | Support B-01, B-05, B-12; write tests for B-02, B-04 |
| **Web Lead** | 1 | C-01 through C-09 |
| **Mobile Lead** | 1 | D-01 through D-07 |
| **DevOps Lead** | 1 | E-01 through E-11, D-08 support |
| **QA Lead** | 1 | F-01 through F-06 |
| **TPM** | 1 | A-11, track coordination, daily standup, blockers, EXIT-22 (Sprint 1 planning) |

**Minimum viable team for Sprint 0: 7 people (or 6 with Backend Lead covering both backend slots).**

### Staffing Risk

If Mobile Lead is not yet hired, D-01 cannot start. This delays the mobile track but does not block backend, frontend, or infrastructure. Mobile Lead must be identified and onboarded no later than Day 1. If Mobile Lead starts on Day 3, the mobile track completes by the end of Week 2.

---

## SPRINT TIMELINE

### Sprint 0 Duration: 10 Working Days (2 Weeks)

A 5-day sprint is theoretically possible if all governance decisions are made on Day 1 and all team members are available full-time. Given the dependency on infrastructure provisioning (which has external wait times), the 10-day window provides buffer and delivers a more stable foundation.

**Mid-Point Gate (Day 5):** Infrastructure must be live and backend deployed by end of Day 5. If not, investigate and escalate.

---

### DAY 1 — Governance and Foundation Setup

| Time | Owner | Task |
|------|-------|------|
| 09:00–09:30 | Founder | A-01: Sign Implementation Baseline |
| 09:30–10:00 | Founder | A-02: Write DEC-011 (Phase 0/Phase 1 resolution) |
| 10:00–12:00 | Founder + Mobile Lead | A-03: Mobile framework decision session → ADR-016 |
| 10:00–11:00 | Founder + DevOps | A-04: AWS region decision → update Terraform variables |
| 11:00–12:00 | Founder | A-05, A-06, A-07, A-08: Batch rapid decisions → DEC-012 through DEC-015 |
| 12:00–12:30 | Founder | A-09: Submit WhatsApp Business API application |
| 12:30–13:00 | Founder | A-10: Create App Store Connect + Google Play Console accounts |
| 13:00–14:00 | — | Lunch |
| 14:00–18:00 | DevOps Lead | E-01: Fix Terraform (rds.tf PostGIS, ecs.tf placeholders, region) |
| 14:00–18:00 | DevOps Lead | E-02: Configure GitHub Secrets (parallel with E-01) |
| 14:00–18:00 | Backend Lead | B-01: Migration 011 (unit_photos) |
| 14:00–18:00 | Backend Lead | B-03: Migration 012 (device_tokens) |
| 14:00–18:00 | Backend Lead | B-05: Migration 015 (analytics events) — ADR-015 |
| 14:00–18:00 | Backend Lead | B-07: Fix Paymob iframe URL in reservation response |
| 14:00–18:00 | Backend Lead | B-09: Fix recurring_maintenance Celery Beat |
| 14:00–18:00 | Backend Lead | B-10: PropertyReadiness unique constraint migration |
| 14:00–18:00 | Web Lead | C-01: Next.js project configuration |
| 14:00–18:00 | Web Lead | C-02: Tailwind CSS + design tokens |
| 14:00–18:00 | Mobile Lead | D-01: Mobile framework scaffold |
| 14:00–18:00 | QA Lead | F-01: Playwright infrastructure setup |
| 14:00–18:00 | TPM | A-11: Update stale documents |

---

### DAY 2 — Infrastructure Provisioning + Foundation Build

| Time | Owner | Task |
|------|-------|------|
| 09:00–18:00 | DevOps Lead | E-03: `terraform apply` staging — all day |
| 09:00–12:00 | Backend Lead | B-04: Device token registration endpoint |
| 09:00–12:00 | Backend Lead | B-12: ADR-015 schema compliance audit |
| 09:00–12:00 | Web Lead | C-03: i18n + RTL configuration (next-intl) |
| 09:00–12:00 | Mobile Lead | D-02: Navigation architecture |
| 09:00–12:00 | Mobile Lead | D-03: Localization setup |
| 12:00–18:00 | Backend Lead | B-02: Photo upload API (start — depends on S3 being provisioned) |
| 12:00–18:00 | Web Lead | C-04: Typed API client (can start with mock OpenAPI spec) |
| 12:00–18:00 | Mobile Lead | D-04: Theme system |
| 12:00–18:00 | QA Lead | F-02: Health check smoke test (can write before staging is live) |

---

### DAY 3 — First Backend Deployment + Frontend Auth

| Time | Owner | Task |
|------|-------|------|
| 09:00–12:00 | DevOps Lead | E-03 complete: verify terraform output, test RDS connectivity |
| 09:00–12:00 | DevOps Lead | E-04: Populate AWS Secrets Manager |
| 09:00–12:00 | Backend Lead | B-08: Wire Secrets Manager client in code |
| 09:00–12:00 | Backend Lead | B-11: Lock CORS origins |
| 09:00–12:00 | Web Lead | C-05: Authentication context |
| 09:00–12:00 | Mobile Lead | D-05: Mobile API client |
| 09:00–12:00 | QA Lead | F-05: Test data seeder (write against staging DB once live) |
| 13:00–18:00 | DevOps Lead | E-05: First backend deployment to ECS |
| 13:00–18:00 | DevOps Lead | E-06: Link Vercel + frontend deployment |
| 13:00–18:00 | Backend Lead | B-06: Wire email provider (SES) |
| 13:00–18:00 | Web Lead | C-06: TanStack Query configuration |
| 13:00–18:00 | Mobile Lead | D-06: Mobile authentication context |
| 13:00–18:00 | QA Lead | F-03: Auth smoke test (writes against staging) |

---

### DAY 4 — Integration + Hardening

| Time | Owner | Task |
|------|-------|------|
| 09:00–12:00 | DevOps Lead | E-07: SES domain verification |
| 09:00–12:00 | DevOps Lead | E-08: CloudFront for listings bucket |
| 09:00–12:00 | DevOps Lead | E-09: PgBouncer setup |
| 09:00–12:00 | Web Lead | C-07: Layout system and routing |
| 09:00–12:00 | Mobile Lead | D-07: FCM SDK integration |
| 09:00–12:00 | Mobile Lead | D-08: Mobile CI pipeline |
| 09:00–12:00 | QA Lead | F-04: Search smoke test |
| 13:00–18:00 | DevOps Lead | E-10: WAF configuration |
| 13:00–18:00 | DevOps Lead | E-11: CloudWatch alerts |
| 13:00–18:00 | Web Lead | C-08: Error handling + loading states |
| 13:00–18:00 | Web Lead | C-09: Frontend unit test configuration |
| 13:00–18:00 | QA Lead | F-06: CI post-deploy smoke hook |
| 13:00–18:00 | Backend Lead | B-02: Photo upload API complete + tests |

---

### DAY 5 — Mid-Point Gate + First Full CI/CD Run

| Time | Owner | Task |
|------|-------|------|
| 09:00–10:00 | TPM | Mid-point gate review: check EXIT-01 through EXIT-12 |
| 10:00–13:00 | All | Address any blockers found in mid-point review |
| 13:00–15:00 | DevOps | Trigger `deploy-staging.yml` via GitHub Actions — first full CI/CD run |
| 15:00–17:00 | QA | Run E2E smoke suite against staging via CI |
| 17:00–18:00 | TPM | Update sprint board, document blockers for Week 2 |

**Mid-Point Gate Decision:** If EXIT-05 (staging live) is not met by end of Day 5, escalate to Founder immediately. Infrastructure provisioning is the critical path.

---

### DAYS 6–10 — Completion, Integration Testing, Sprint 1 Planning

| Day | Focus |
|-----|-------|
| Day 6 | Complete any incomplete tasks from Days 1–5. Begin integration testing. |
| Day 7 | Mobile: complete D-02 through D-06 if delayed. Web: complete C-05 through C-09. |
| Day 8 | Full end-to-end smoke test: frontend → API → database → external services. |
| Day 9 | Fix all failures found in Day 8 integration test. Verify all EXIT criteria. |
| Day 10 | Final EXIT criteria checklist. Sprint 1 planning session. Sprint 0 retrospective. |

---

## RISK MITIGATION

Every audit risk, its Sprint 0 mitigation, owner, and Day 0 deadline:

| Risk ID | Risk | Sprint 0 Mitigation | Owner | Deadline |
|---------|------|---------------------|-------|---------|
| R-C01 | Infrastructure never provisioned | E-01 + E-02 + E-03 — entire Track E | DevOps Lead | Day 3 |
| R-C02 | PostGIS not on RDS — migration fails | E-01: add PostGIS parameter group to rds.tf before apply | DevOps Lead | Day 1 |
| R-C03 | GitHub Secrets not configured | E-02 | DevOps Lead | Day 1 |
| R-C04 | Governance conflict unresolved | A-01 + A-02 | Founder | Day 1, 10:00 |
| R-C05 | Mobile framework not decided | A-03 | Founder + Mobile Lead | Day 1, 12:00 |
| R-H01 | WhatsApp not verified (4–8 week lead) | A-09: submit application Day 1 | Founder | Day 1 |
| R-H02 | AWS Secrets Manager is placeholder | B-08: wire client before E-05 | Backend Lead | Day 3 |
| R-H03 | Frontend 5% complete | Track C: C-01 through C-09 | Web Lead | Day 5 (foundation) |
| R-H04 | No E2E tests | F-01 through F-06 | QA Lead | Day 5 |
| R-H05 | No PgBouncer | E-09 | DevOps Lead | Day 4 |
| R-H06 | Paymob iframe URL missing | B-07 | Backend Lead | Day 1 |
| R-H07 | Egyptian payment methods not configured | Not Sprint 0 — planned Sprint 5 | Backend Lead | Sprint 5 |
| R-H08 | Region conflict | A-04 + E-01 | Founder + DevOps | Day 1 |
| R-H09 | Stale documents mislead engineers | A-11 | TPM | Day 1 |
| R-M01 | Missing migrations 011–014 | B-01, B-03, B-05 in Sprint 0; 013–014 in Sprint 5–7 | Backend Lead | Day 1–2 |
| R-M02 | Email is a stub | B-06 | Backend Lead | Day 3 |
| R-M04 | No CDN for photos | E-08 | DevOps Lead | Day 4 |
| R-M05 | ADR-015 analytics tables missing | B-05 | Backend Lead | Day 1 |
| R-M06 | PropertyReadiness no unique constraint | B-10 | Backend Lead | Day 1 |
| R-M08 | App Store / Play Store not created | A-10 | Founder | Day 1 |

---

## DEFINITION OF DONE

Sprint 0 is officially complete when all of the following are true simultaneously:

### Governance DoD
- [ ] `STAYOS_IMPLEMENTATION_BASELINE.md` contains founder signature block
- [ ] `DECISION_LOG.md` contains DEC-011 through DEC-015 (all committed to `main`)
- [ ] ADR-016 (mobile framework) committed to `docs/architecture/adr/`
- [ ] No document in the repository shows a resolved conflict as open

### Infrastructure DoD
- [ ] `terraform output` shows all staging resources present
- [ ] `curl https://api.staging.stayos.com/health` returns `{"status":"ok","database":"ok","redis":"ok"}`
- [ ] `alembic current` on staging shows migration `016` (latest) applied
- [ ] CloudFront distribution serving listing images with correct cache headers
- [ ] PgBouncer healthy and receiving application connections
- [ ] WAF blocking test SQLi payload
- [ ] CloudWatch alarms in OK state

### CI/CD DoD
- [ ] `deploy-staging.yml` has run successfully at least once via GitHub Actions
- [ ] All 5 existing CI jobs green on latest `main` commit
- [ ] Mobile CI job green (even with no feature code)
- [ ] Playwright smoke suite passes in CI post-deploy

### Backend DoD
- [ ] Photo upload API implemented with tests passing
- [ ] Device token endpoint implemented with tests passing
- [ ] Paymob iframe URL present in `POST /reservations/` response
- [ ] AWS Secrets Manager client fetching secrets at staging startup
- [ ] CORS locked to staging origin — no wildcard
- [ ] ADR-015 compliance: analytics tables, currency/locale/country fields verified

### Frontend DoD
- [ ] Next.js staging deployment live at Vercel URL
- [ ] Arabic RTL renders correctly at `/ar/` path
- [ ] English LTR renders correctly at `/en/` path
- [ ] Design tokens (colors, fonts, spacing) applied in Tailwind config
- [ ] Typed API client compiles and type-checks
- [ ] Auth context: OTP login → session → protected route — works end-to-end

### Mobile DoD
- [ ] Mobile scaffold runs on iOS Simulator and Android Emulator
- [ ] Navigation structure defined for all 40 screens (stub placeholders)
- [ ] Localization: Arabic default, English toggle — working
- [ ] API client calls staging backend successfully
- [ ] Auth flow reaches OTP entry screen and processes login

### QA DoD
- [ ] 3 Playwright smoke tests passing in CI against staging
- [ ] Test data seeder runs idempotently against staging
- [ ] Coverage gate ≥80% maintained on backend

### Sprint Planning DoD
- [ ] Sprint 1 board created with all Day-1 Sprint 1 tasks assigned and estimated
- [ ] Sprint 1 planning session completed with all track leads present
- [ ] Sprint 0 retrospective conducted and notes committed

---

## AUTHORIZATION

### Sprint 0 Task Completeness Check

| Track | Tasks Defined | Executable? |
|-------|-------------|-------------|
| A — Governance | 11 tasks | ✅ Each has owner, effort, acceptance criteria |
| B — Backend Foundation | 12 tasks | ✅ Each has files, dependencies, acceptance criteria |
| C — Frontend Foundation | 9 tasks | ✅ Each has deliverables, dependencies, acceptance criteria |
| D — Mobile Foundation | 8 tasks | ✅ Each has framework-specific guidance, acceptance criteria |
| E — Infrastructure | 11 tasks | ✅ Each has Terraform/AWS specifics, acceptance criteria |
| F — QA Foundation | 6 tasks | ✅ Each has test specifications, acceptance criteria |
| **Total** | **57 tasks** | **✅ All executable** |

### Dependency Resolution Check

| Dependency Type | Status |
|----------------|--------|
| Critical path identified | ✅ A-04 → E-01 → E-03 → E-05 → F-05 → F-03/F-04 |
| All blocking dependencies mapped | ✅ |
| Parallel work identified | ✅ |
| Long-lead-time items called out (WhatsApp, App Stores) | ✅ |
| Every audit blocker converted to a task | ✅ |
| Exit criteria are measurable | ✅ Every criterion is pass/fail, not subjective |

### Verdict

Every audit finding has been converted to an executable task.  
Every task has an owner, effort estimate, dependencies, and acceptance criteria.  
Every exit criterion is measurable with a specific, observable outcome.  
The critical path is known.  
The team allocation is defined.  
The day-by-day timeline is actionable.  

---

## ✅ READY TO EXECUTE

**Sprint 0 may begin immediately upon Founder completing Track A governance tasks on Day 1.**  
**Sprint 1 is authorized upon meeting all 22 Exit Criteria above.**  
**Target Sprint 0 completion: Day 10 from authorization date.**
