# TECHNICAL AUDIT REPORT — StayOS

**Repository:** `/Users/ahmed/Documents/Projects/StayOS`  
**Audit date:** 2026-07-30  
**Auditor:** Cascade automated technical audit  
**Baseline documents:** `01_REPOSITORY_MAP.md` through `10_TESTING_MAP.md`, `docs/architecture/adr/ADR-001` through `ADR-016`, `docs/system-design/*.md`, `STAYOS_IMPLEMENTATION_BASELINE.md`, `ENGINEERING_MASTER_PLAN.md`, `MASTER_EXECUTION_BOARD.md`.

---

## 1. Executive Summary

The StayOS backend is the most mature part of the codebase. It is a FastAPI/SQLAlchemy application with ten Alembic migrations, a working test suite (283 tests passing, 80.42% coverage), JWT RS256 authentication, PostGIS spatial search, calendar booking with an exclusion constraint, payment webhooks for Paymob and Stripe, a finance ledger/escrow, operations tasking, and KYC document processing. `ruff` and `mypy` pass.

However, the project is **not ready for production or public beta** because:

* The frontend (`apps/web`) is a minimal Next.js scaffold with four pages, no product components, no API client, no i18n library, no maps, and no payment UI. `npm audit` reports 18 high/critical vulnerabilities.
* Mobile is 0% implemented (only design docs).
* Several backend subsystems required by the baseline are missing: listing photo upload, device-token/push registration, admin/dispute endpoints, real-time messaging, reviews, and Egyptian wallet payment methods.
* Terraform has HCL syntax errors and placeholder values; the region used in Terraform/CI does not match ADR-007's primary region.
* Security and operational hardening gaps exist (AWS Secrets Manager fallback not implemented, Redis pipeline rate-limiting may not work at runtime, middleware silently swallows exceptions, no WAF, no DAST).

**Executive decision:** **NOT READY** for release. Continue only with staged, backend-only closed testing after resolving the Critical and High findings listed below.

---

## 2. Scope & Methodology

The audit compared the current implementation against the repository's own planning and architecture documents. Evidence was gathered by:

* Static analysis: `ruff check src/ tests/`, `mypy src/`, `bandit -r src/ -ll`, `safety check`, `npm audit`.
* Test execution: `pytest tests/`.
* Build verification: `npm run build` and `npm run type-check` in `apps/web`.
* Manual code inspection of FastAPI routers, SQLAlchemy models, Alembic migrations, Terraform files, Docker files, and GitHub Actions workflows.
* Cross-checking against the ADRs, API specification, database design, and the contractual `STAYOS_IMPLEMENTATION_BASELINE.md`.

---

## 3. Scoring Summary

| # | Audit area | Score | Status |
|---|------------|-------|--------|
| 1 | Architecture compliance (ADRs / system design) | 60% | Needs work |
| 2 | Backend implementation completeness | 70% | Substantial |
| 3 | API endpoints & middleware | 68% | Substantial |
| 4 | Database models & migrations | 65% | Needs work |
| 5 | Frontend implementation | 25% | Critical gap |
| 6 | Mobile implementation | 5% | Not started |
| 7 | Infrastructure (Docker, Terraform, CI/CD) | 50% | Needs work |
| 8 | Testing coverage & quality | 75% | Good |
| 9 | Security (auth, JWT, rate limits, OWASP) | 58% | Needs work |
| 10 | Documentation & dependency consistency | 60% | Needs work |
| **Overall** | **—** | **55%** | **Not ready** |

Scores are qualitative, derived from the ratio of implemented capabilities to the baseline scope, plus the results of automated tooling.

---

## 4. Detailed Findings

Findings are grouped by audit area. Each finding includes a unique ID, severity, description, evidence, affected files, impact, and a recommended action.

### 4.1 Architecture compliance

**Score: 60%**

The modular-monolith structure, FastAPI + SQLAlchemy + Alembic + Celery stack, and the general service boundaries match ADR-002 and ADR-012. Several specific architecture decisions from the ADRs are not reflected in the code, however.

**ARC-01 — AWS primary region does not match ADR-007**  
**Severity:** HIGH  
**Description:** ADR-007 (Deployment Strategy) designates `me-central-1` (UAE) as the primary AWS region and `me-south-1` (Bahrain) as the DR/secondary region. The actual Terraform backend, provider defaults, and GitHub Actions deploy workflows all use `me-south-1` as the effective primary region.  
**Evidence:** `infra/terraform/variables.tf` defaults to `region = "me-south-1"`; `infra/terraform/main.tf` places the S3 state backend in `me-south-1`; `.github/workflows/deploy-staging.yml` and `.github/workflows/deploy-prod.yml` set `aws-region: me-south-1`.  
**Affected files:** `infra/terraform/variables.tf`, `infra/terraform/main.tf`, `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-prod.yml`.  
**Impact:** Latency and data-residency assumptions in ADR-007 are contradicted. A Bahrain-first deployment is a significant architecture drift.  
**Recommended action:** Update the Terraform provider/defaults, S3 backend, and CI workflows to `me-central-1`; reserve `me-south-1` for DR as decided.

**ARC-02 — Search implementation does not match ADR-010**  
**Severity:** HIGH  
**Description:** ADR-010 Search Architecture requires PostgreSQL full-text search with `pg_trgm` trigram similarity, Arabic `unaccent` normalization, and an English dictionary. The implemented search uses only a generated `tsvector` column and `plainto_tsquery('simple', ...)`. No `pg_trgm`, `unaccent`, or Arabic dictionary is installed or used.  
**Evidence:** `alembic/versions/004_create_pms_tables.py` creates a `tsvector` search_vector; `src/app/listings/repository.py:148` calls `func.plainto_tsquery("simple", filters.q)`. Migrations and repository do not create/use `pg_trgm` or `unaccent`.  
**Affected files:** `src/app/listings/repository.py`, `alembic/versions/004_create_pms_tables.py`, `alembic/versions/009_add_calendar_exclusion.py`.  
**Impact:** Arabic morphological search will not work as specified, degrading FC-02 Spatial Search quality.  
**Recommended action:** Add `CREATE EXTENSION pg_trgm` and `unaccent` migrations and update `search_listings` to use trigram + language-aware tsvector.

**ARC-03 — Push notification / FCM not implemented**  
**Severity:** MEDIUM  
**Description:** ADR-011 specifies Firebase Cloud Messaging for in-app push. There is no `device_tokens` table, no device-token registration endpoint, and no FCM dispatch code.  
**Evidence:** `grep -R "device_token" src/` returns nothing. `STAYOS_IMPLEMENTATION_BASELINE.md` marks E-19 (Mobile Notifications) as BLOCKED because `auth.device_tokens` is missing.  
**Affected files:** `src/app/auth/models.py`, `src/app/notifications/providers.py`, `src/app/notifications/services.py`.  
**Impact:** Mobile push notifications cannot be delivered; E-19 blocked.  
**Recommended action:** Add `auth.device_tokens` table and `POST /auth/device-token` endpoint; integrate `firebase-admin` messaging in notification dispatch.

**ARC-04 — Real-time messaging / SSE not implemented**  
**Severity:** MEDIUM  
**Description:** The API specification defines `/api/v1/stream/*` SSE endpoints. No WebSocket, SSE, or messaging service exists.  
**Evidence:** `grep -R "stream\|sse\|messaging" src/app/` finds no matching router. `STAYOS_IMPLEMENTATION_BASELINE.md` E-08/E-20 marked NOT STARTED/BLOCKED.  
**Affected files:** `src/app/main.py` (router mount list), `docs/system-design/04_API_SPECIFICATION.md`.  
**Impact:** Guest↔Host chat and real-time booking/ticket updates are not available.  
**Recommended action:** Implement the `messaging` schema and either SSE or WebSocket delivery.

**ARC-05 — Frontend is a scaffold only**  
**Severity:** MEDIUM  
**Description:** ADR-001 expects Next.js App Router with SSR, i18n routing, Google Maps, and BFF API routes. The actual `apps/web` only has `/`, `/ar`, `/[locale]`, and `/[locale]/search` with no components, no API client, and no map integration.  
**Evidence:** `find apps/web/app -type f` lists only four pages; `apps/web/package.json` does not include `next-intl`, `@vis.gl/react-google-maps`, or state-management libraries.  
**Affected files:** `apps/web/**`.  
**Impact:** Product UI for web is not present; FC-02/FC-03/FC-04 frontend epics (E-10 through E-13) are NOT STARTED.  
**Recommended action:** Begin building the planned Next.js screens and API client layer.

---

### 4.2 Backend implementation completeness

**Score: 70%**

Core services (auth, KYC, listings, reservations, finance, operations, notifications) are implemented and tested. However, several features in the baseline are absent.

**BCK-01 — Listing photo upload is missing**  
**Severity:** HIGH  
**Description:** `STAYOS_IMPLEMENTATION_BASELINE.md` REQ-021 and the Alpha checklist require listing photo upload. No `pms.unit_photos` table, model, or endpoint exists.  
**Evidence:** `grep -R "unit_photos\|photo" src/app/listings` and `alembic/versions/` return no relevant hits. `apps/web` has no photo upload UI.  
**Affected files:** `src/app/listings/models.py`, `src/app/listings/router.py`, `alembic/versions/`.  
**Impact:** Hosts cannot add listing photos; SCR-038 (New Listing Step 4) and listing detail gallery cannot be built.  
**Recommended action:** Add `pms.unit_photos` table, S3 presigned upload endpoint, and listing detail response enrichment.

**BCK-02 — Egyptian wallet payment methods not configured**  
**Severity:** HIGH  
**Description:** The baseline lists Fawry, Meeza, Vodafone Cash, and InstaPay (REQ-062 through REQ-065) as Paymob integration methods. The Paymob provider only supports the generic Accept API; no integration/iframe IDs for these methods are wired.  
**Evidence:** `src/app/finance/providers.py` `create_paymob_payment_intent` uses `settings.PAYMOB_INTEGRATION_ID` which is optional; `settings.PAYMOB_IFRAME_ID` is optional. No branch for Fawry/Meeza/etc.  
**Affected files:** `src/app/finance/providers.py`, `src/app/config.py`, `.env.example`.  
**Impact:** Egyptian market payment options required for MVP are not available.  
**Recommended action:** Add Paymob integration/iframe IDs per method and branch the payment-intent creation logic.

**BCK-03 — Admin / incident-console endpoints missing**  
**Severity:** MEDIUM  
**Description:** The API specification defines `/api/v1/admin/users`, `/api/v1/admin/disputes`, `/api/v1/admin/kill-switch/listing/{unit_id}`. No admin router is mounted in `main.py`.  
**Evidence:** `src/app/main.py` mounts only `auth`, `kyc`, `listings`, `operations`, `reservations`, `finance`. `grep -R "admin" src/app` returns no admin router.  
**Affected files:** `src/app/main.py`, `docs/system-design/04_API_SPECIFICATION.md`.  
**Impact:** Admin moderation, user bans, dispute resolution, and emergency delisting cannot be performed.  
**Recommended action:** Implement an `admin` package with the specified endpoints.

**BCK-04 — Device-token endpoint not implemented**  
**Severity:** MEDIUM  
**Description:** Required for FCM push (REQ-057). No table or route exists.  
**Evidence:** Same as ARC-03.  
**Affected files:** `src/app/auth/router.py`, `src/app/auth/models.py`.  
**Impact:** Blocks push-notification delivery.  
**Recommended action:** Add `POST /auth/device-token` and persist tokens in `auth.device_tokens`.

**BCK-05 — Redis rate limiter does not await pipeline commands**  
**Severity:** HIGH  
**Description:** `src/app/security/rate_limit.py` records Redis commands on a pipeline but does not `await` each command before `pipe.execute()`. In `redis-py` async, pipeline commands return coroutines; not awaiting them means the commands may not actually be queued, and `pipe.execute()` may receive stale/incorrect results.  
**Evidence:** `src/app/security/rate_limit.py:32-35` calls `pipe.zremrangebyscore(...)`, `pipe.zcard(...)`, `pipe.zadd(...)`, `pipe.expire(...)` without `await`. `pytest` emits `RuntimeWarning: coroutine ... was never awaited` for rate-limit tests.  
**Affected files:** `src/app/security/rate_limit.py`, `tests/test_security.py`.  
**Impact:** Rate limiting may fail to enforce limits, enabling brute-force and SMS-OTP flooding.  
**Recommended action:** Rewrite the rate-limiter to await pipeline commands or use a single Lua script.

**BCK-06 — Exception swallowing in middleware and PII masking**  
**Severity:** MEDIUM  
**Description:** `src/app/security/audit.py`, `src/app/main.py`, and several service modules use bare `except Exception: pass` blocks. This can hide failures in PII masking, body reading, token parsing, and external calls.  
**Evidence:** `src/app/security/audit.py:35-36` (`except Exception: pass` during JSON/masking), `src/app/security/audit.py:60-61` (body read), `src/app/main.py:157-158` (token decode), `src/app/auth/services.py` (Firebase/Twilio initialization).  
**Affected files:** `src/app/security/audit.py`, `src/app/main.py`, `src/app/auth/services.py`, `src/app/finance/services.py`, `src/app/kyc/services.py`.  
**Impact:** Failures are silently ignored, complicating debugging and potentially leaking unmasked PII.  
**Recommended action:** Replace bare `except: pass` with explicit exception types and logging.

---

### 4.3 API endpoints & middleware

**Score: 68%**

Implemented endpoints: 66 across auth (9), KYC (4), listings (15), reservations (8), finance (11), operations (19), plus 6 global endpoints. Several specified endpoints are missing or deviate from the contract.

**API-01 — Error response format is not RFC 7807**  
**Severity:** LOW  
**Description:** The API spec (§6) requires RFC 7807 Problem Details with `type`, `title`, `status`, `detail`, `instance`, `trace_id`. The actual error format is `{"error": {"code": ..., "message": ..., "message_ar": ..., "details": ...}}`.  
**Evidence:** `src/app/main.py:91-107` defines `_error_response` using a custom shape.  
**Affected files:** `src/app/main.py`.  
**Impact:** Consumers expecting the documented RFC 7807 format must adapt; API contract mismatch.  
**Recommended action:** Align error responses with RFC 7807 or update the spec.

**API-02 — Pagination uses offset/limit instead of cursor**  
**Severity:** MEDIUM  
**Description:** The API spec (§4) mandates cursor-based pagination. Search and list endpoints use SQL `OFFSET`/`LIMIT` and an opaque next-cursor that is not a stable cursor.  
**Evidence:** `src/app/listings/repository.py:164` uses `stmt.offset(offset).limit(limit)`; responses use `PaginationInfo` from `offset`/`limit`.  
**Affected files:** `src/app/listings/repository.py`, `src/app/listings/schemas.py`, `src/app/reservations/repository.py`.  
**Impact:** Page drift on concurrent inserts; does not meet the API contract.  
**Recommended action:** Implement keyset/cursor pagination using `created_at`/`id`.

**API-03 — Missing listing and admin endpoints from the API spec**  
**Severity:** MEDIUM  
**Description:** The spec lists `POST /listings/{unit_id}/photos/upload-url`, `DELETE /listings/{unit_id}/photos/{photo_id}`, `PUT /listings/{unit_id}/pricing`, `PATCH /listings/{unit_id}/status`, all `/api/v1/admin/*`, and all `/api/v1/stream/*`. None are implemented.  
**Evidence:** `src/app/listings/router.py` has no photo, pricing-tier, or admin-status endpoints. `src/app/main.py` does not include an `admin` or `stream` router.  
**Affected files:** `src/app/listings/router.py`, `src/app/main.py`.  
**Impact:** Complete product flows (host listing creation, admin moderation, real-time updates) are blocked.  
**Recommended action:** Add the missing routers and endpoints per `docs/system-design/04_API_SPECIFICATION.md`.

---

### 4.4 Database models & migrations

**Score: 65%**

Ten migrations create the `auth`, `pms`, `reservation`, `finance`, `operations`, `notify`, `outbox`, and `security` schemas. The core tables match the design, but several planned tables are absent.

**DB-01 — `pms.unit_photos` table missing**  
**Severity:** HIGH  
**Description:** No table for listing photos.  
**Evidence:** `alembic/versions/004_create_pms_tables.py` creates `units`, `unit_listings`, `calendar_rules`; no `unit_photos`. `src/app/listings/models.py` has no `UnitPhoto` model.  
**Affected files:** `alembic/versions/004_create_pms_tables.py`, `src/app/listings/models.py`.  
**Impact:** Photo upload cannot be persisted.  
**Recommended action:** Add migration 011 and model for `pms.unit_photos`.

**DB-02 — `auth.device_tokens` table missing**  
**Severity:** MEDIUM  
**Description:** No device-token table for FCM.  
**Evidence:** `src/app/auth/models.py` has `User`, `Account`, `RefreshToken`, no `DeviceToken`.  
**Affected files:** `src/app/auth/models.py`, `alembic/versions/003_create_auth_tables.py`.  
**Impact:** Push notifications blocked.  
**Recommended action:** Add `auth.device_tokens` table and migration.

**DB-03 — Messaging and reviews schemas not created**  
**Severity:** MEDIUM  
**Description:** The database design defines `messaging.conversations`/`messaging.messages` and `reviews.reviews`. No schemas, models, or migrations exist.  
**Evidence:** `grep -R "conversation\|review" src/app/` returns nothing. `alembic/versions/` has only 001–010.  
**Affected files:** `alembic/versions/001_create_schemas.py`, `src/app/`.  
**Impact:** Messaging and post-stay reviews cannot be built.  
**Recommended action:** Add `messaging` and `reviews` schemas with tables and models.

**DB-04 — `pg_trgm` and `unaccent` extensions missing**  
**Severity:** HIGH  
**Description:** Required by ADR-010 and `docs/system-design/05_DATABASE_DESIGN.md` for full-text/trigram search.  
**Evidence:** No `CREATE EXTENSION pg_trgm` or `unaccent` in any migration. `search_vector` is a plain `tsvector` computed with `simple` dictionary.  
**Affected files:** `alembic/versions/`, `src/app/listings/models.py`, `src/app/listings/repository.py`.  
**Impact:** Search quality does not meet architecture; Arabic stemming absent.  
**Recommended action:** Add extensions and update the `search_vector` generation/indexing.

**DB-05 — `pms.pricing_tiers` table missing**  
**Severity:** MEDIUM  
**Description:** The database design lists `pms.pricing_tiers` for advanced pricing rules. Not implemented.  
**Evidence:** `src/app/listings/models.py` has only `UnitListing` with base/weekend/peak multipliers and `CalendarRule.price_override`.  
**Affected files:** `src/app/listings/models.py`, `docs/system-design/05_DATABASE_DESIGN.md`.  
**Impact:** The `PUT /listings/{id}/pricing` endpoint and dynamic pricing cannot be supported.  
**Recommended action:** Add `pms.pricing_tiers` or update the API spec to remove the feature.

---

### 4.5 Frontend implementation

**Score: 25%**

`apps/web` builds and type-checks, but it is not a product implementation.

**FE-01 — Web frontend is a placeholder**  
**Severity:** CRITICAL  
**Description:** Only five pages exist (`/`, `/ar`, `/_not-found`, `/[locale]`, `/[locale]/search`). There are no components, no API client, no auth UI, no host dashboard, no listing detail, no booking flow, no maps, no payment integration.  
**Evidence:** `find apps/web/app -type f` (only 4 files). `apps/web/app/[locale]/search/page.tsx` is a static search form with no data fetching.  
**Affected files:** `apps/web/**`.  
**Impact:** The web frontend cannot support any user story from the baseline; E-10 through E-13 are NOT STARTED.  
**Recommended action:** Develop the planned Next.js pages, component library, API client, and state management.

**FE-02 — No i18n/routing integration**  
**Severity:** MEDIUM  
**Description:** Translation JSON files (`apps/web/messages/*.json`) exist but are not wired through `next-intl` or Next.js i18n config. There is no `i18n.ts`, `middleware.ts`, or `next.config.js` i18n config.  
**Evidence:** `apps/web/next.config.mjs` has only `reactStrictMode` and `swcMinify`; `apps/web/package.json` does not list `next-intl`; no `middleware.ts`.  
**Affected files:** `apps/web/next.config.mjs`, `apps/web/package.json`, `apps/web/app/[locale]/layout.tsx`.  
**Impact:** RTL Arabic-first UX and locale routing cannot be maintained at scale.  
**Recommended action:** Integrate `next-intl` with middleware and config-driven i18n.

**FE-03 — npm audit shows 18 high/critical vulnerabilities**  
**Severity:** HIGH  
**Description:** `npm audit --audit-level=high` reports 1 critical (Next.js SSRF) and 17 high-severity advisories (postcss, brace-expansion/minimatch, Next.js DoS/cache-poisoning).  
**Evidence:** `npm audit` output in the attached evidence. Vulnerable `next@14.0.4` is pinned.  
**Affected files:** `apps/web/package.json`, `apps/web/package-lock.json`.  
**Impact:** Self-hosted Next.js is exposed to multiple known CVEs.  
**Recommended action:** Upgrade Next.js to a patched 14.2.x release and run `npm audit fix`.

---

### 4.6 Mobile implementation

**Score: 5%**

**MOB-01 — No mobile code exists**  
**Severity:** CRITICAL  
**Description:** No mobile framework or source code. Only design documents (`docs/MOBILE_NATIVE_DESIGN_P*.md`).  
**Evidence:** `find . -type d -name "mobile\|flutter\|react-native\|ios\|android"` returns no project directories. `STAYOS_IMPLEMENTATION_BASELINE.md` Mobile Summary: 0 of 40 screens implemented.  
**Affected files:** N/A (missing).  
**Impact:** All mobile epics (E-14 through E-20) are NOT STARTED or BLOCKED.  
**Recommended action:** Select a mobile framework and create the scaffold.

**MOB-02 — Push prerequisites missing**  
**Severity:** HIGH  
**Description:** Device-token table and registration endpoint are absent (same as BCK-04/ARC-03).  
**Evidence:** `STAYOS_IMPLEMENTATION_BASELINE.md` E-19 BLOCKED.  
**Affected files:** `src/app/auth/models.py`, `src/app/auth/router.py`.  
**Impact:** Push notifications cannot be implemented.  
**Recommended action:** Implement `auth.device_tokens` and the device-token endpoint.

---

### 4.7 Infrastructure

**Score: 50%**

Docker, GitHub Actions, and Terraform files are present and generally well-structured, but the code is not provisionable as-is.

**INF-01 — Terraform HCL syntax error in `main.tf`**  
**Severity:** HIGH  
**Description:** `locals.common_tags` has `Project var.project_name` and `Environment var.environment` without `=` assignment operators. This is invalid HCL and will fail `terraform validate`/`plan`.  
**Evidence:** `infra/terraform/main.tf:27-28`.  
**Affected files:** `infra/terraform/main.tf`.  
**Impact:** Infrastructure cannot be provisioned until fixed.  
**Recommended action:** Add `=` between keys and values, e.g. `Project = var.project_name`.

**INF-02 — DynamoDB lock table for Terraform state not provisioned**  
**Severity:** MEDIUM  
**Description:** The S3 backend in `main.tf` references `dynamodb_table = "stayos-terraform-locks"`, but no `aws_dynamodb_table` resource is defined.  
**Evidence:** `infra/terraform/main.tf:14`. No matching `dynamodb_table` resource in `infra/terraform/`.  
**Affected files:** `infra/terraform/main.tf`.  
**Impact:** Terraform state locking is not available unless the table is created manually.  
**Recommended action:** Add an `aws_dynamodb_table` resource for state locking.

**INF-03 — CI/CD workflows contain placeholder values**  
**Severity:** HIGH  
**Description:** `deploy-staging.yml` and `deploy-prod.yml` use `subnet-xxx` and `sg-xxx` placeholders in the ECS `network-configuration` override. They also rely on many GitHub secrets that are not configured in the repository.  
**Evidence:** `.github/workflows/deploy-staging.yml:39`, `.github/workflows/deploy-prod.yml:41`.  
**Affected files:** `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-prod.yml`.  
**Impact:** Deployment workflows will fail if run.  
**Recommended action:** Replace placeholders with actual subnet/security-group IDs and provision GitHub Secrets.

**INF-04 — AWS region mismatch (same as ARC-01)**  
**Severity:** HIGH  
**Description:** See ARC-01.  
**Impact:** See ARC-01.  
**Recommended action:** See ARC-01.

**INF-05 — ALB certificate without DNS / validation**  
**Severity:** MEDIUM  
**Description:** `infra/terraform/alb.tf` creates an `aws_acm_certificate` for `api.stayos.com` with DNS validation, but no Route 53 zone or validation records are defined.  
**Evidence:** `infra/terraform/alb.tf:142-153`. No Route 53 or validation resources found.  
**Affected files:** `infra/terraform/alb.tf`.  
**Impact:** HTTPS cannot be validated automatically.  
**Recommended action:** Add Route 53 zone and certificate validation records, or use a manual certificate ARN.

**INF-06 — Missing operational infrastructure**  
**Severity:** MEDIUM  
**Description:** Auto-scaling, WAF, CloudFront, log aggregation, alerting, and backup scheduling are not defined.  
**Evidence:** `infra/terraform/` has no `waf.tf`, `cloudfront.tf`, `autoscaling.tf`, or `backup.tf`.  
**Affected files:** `infra/terraform/**`.  
**Impact:** Production operations, security, and observability are incomplete.  
**Recommended action:** Add the missing modules per `STAYOS_IMPLEMENTATION_BASELINE.md` §11.

---

### 4.8 Testing coverage & quality

**Score: 75%**

Backend tests pass and meet the 80% coverage gate. Coverage is uneven, however, and security scanning tooling is unreliable in the current environment.

**TST-01 — Pytest passes but emits 13,865 warnings**  
**Severity:** MEDIUM  
**Description:** `pytest tests/` reports `283 passed, 13865 warnings`. Many warnings are `RuntimeWarning: coroutine ... was never awaited` from mocked Redis and httpx calls, indicating missing `await`s in the code under test (most visibly in `rate_limit.py` and `audit.py`).  
**Evidence:** Test output in the Appendix.  
**Affected files:** `src/app/security/rate_limit.py`, `src/app/security/audit.py`, `tests/`.  
**Impact:** Passing tests may not exercise async paths correctly; potential runtime bugs in rate limiting and audit logging.  
**Recommended action:** Fix unawaited coroutines and add an `asyncio`-specific warning filter to CI.

**TST-02 — Web and mobile test coverage is 0%**  
**Severity:** HIGH  
**Description:** No Playwright/Cypress, no mobile integration tests, and no E2E/performance/DAST suites.  
**Evidence:** `find tests -name '*web*\|*e2e*\|*mobile*'` returns nothing. `STAYOS_IMPLEMENTATION_BASELINE.md` §9.2 lists these as missing.  
**Affected files:** `tests/`, `apps/web/**`.  
**Impact:** Cannot validate end-to-end user flows or mobile behavior.  
**Recommended action:** Add frontend E2E and mobile integration tests.

**TST-03 — Bandit and Safety fail to run on Python 3.14**  
**Severity:** HIGH  
**Description:** `bandit -r src/` reports `No issues identified` but skips 64 files due to `AttributeError: module 'ast' has no attribute 'Num'` (Python 3.14 removed `ast.Num`). `safety check` fails with `No module named 'pkg_resources'`.  
**Evidence:** Tool outputs in the Appendix.  
**Affected files:** `.github/workflows/ci.yml`, `requirements-dev.txt`.  
**Impact:** The security scan CI steps are non-functional under the current Python/tool versions, giving a false sense of security.  
**Recommended action:** Fix the local environment, pin compatible tool versions, or run scans in CI with a supported Python version.

**TST-04 — Backend coverage is uneven**  
**Severity:** LOW  
**Description:** Several Celery task files (`kyc/tasks.py`, `operations/tasks.py`) and notification `schemas.py` have 0% coverage; `notifications/providers.py` and `consumers.py` are under 40%.  
**Evidence:** Pytest coverage table.  
**Affected files:** `src/app/kyc/tasks.py`, `src/app/operations/tasks.py`, `src/app/notifications/providers.py`, `src/app/notifications/consumers.py`.  
**Impact:** Unexercised background and notification code paths.  
**Recommended action:** Add unit tests for task and provider modules.

---

### 4.9 Security

**Score: 58%**

Basic controls exist: JWT RS256, refresh-token hashing, RBAC, CORS, security headers, Paymob HMAC/Stripe signature verification, and PII masking. Significant operational and hardening gaps remain.

**SEC-01 — AWS Secrets Manager runtime fetch is not implemented**  
**Severity:** HIGH  
**Description:** `src/app/security/secrets.py` only reads from environment variables. The `_fetch_from_aws` method raises `SecretNotFoundError` for every AWS ARN.  
**Evidence:** `src/app/security/secrets.py:42-48`.  
**Affected files:** `src/app/security/secrets.py`.  
**Impact:** The intended fallback to AWS Secrets Manager does not work; all secrets must be in environment variables.  
**Recommended action:** Implement the `boto3` `get_secret_value` call with IAM role credentials.

**SEC-02 — Rate limiter may be ineffective (same as BCK-05)**  
**Severity:** HIGH  
**Description:** See BCK-05.  
**Impact:** Auth brute-force / OTP flood risk.  
**Recommended action:** See BCK-05.

**SEC-03 — Exception swallowing in auth/audit middleware (same as BCK-06)**  
**Severity:** MEDIUM  
**Description:** See BCK-06.  
**Impact:** See BCK-06.  
**Recommended action:** See BCK-06.

**SEC-04 — CORS allows all methods and headers**  
**Severity:** LOW  
**Description:** `src/app/shared/middleware.py:12-19` configures `CORSMiddleware` with `allow_methods=["*"]` and `allow_headers=["*"]`. `allow_origins` is at least configurable.  
**Evidence:** `src/app/shared/middleware.py`.  
**Impact:** Slightly wider attack surface; preflight security relies on origin list.  
**Recommended action:** Restrict to the actual method/header set needed.

**SEC-05 — HSTS always enabled regardless of environment**  
**Severity:** LOW  
**Description:** `src/app/security/middleware.py:21` sets `Strict-Transport-Security` unconditionally. The comment says it should only be added in production.  
**Evidence:** `src/app/security/middleware.py:20-21`.  
**Impact:** Local development may enforce HSTS on non-TLS origins.  
**Recommended action:** Gate HSTS by environment or upstream TLS termination.

**SEC-06 — CSP and Permissions-Policy are restrictive but may break Paymob iframe**  
**Severity:** MEDIUM  
**Description:** The CSP `script-src 'self'` and `default-src 'self'` will block Paymob's hosted iframe scripts and Stripe redirects unless explicitly allowed.  
**Evidence:** `src/app/security/middleware.py:17-19`.  
**Impact:** Payment and third-party integrations may be blocked by the browser.  
**Recommended action:** Add Paymob/Stripe frame/script sources and nonces to the CSP.

**SEC-07 — `python-jose` dependency in requirements**  
**Severity:** MEDIUM  
**Description:** `python-jose` is a known source of CVEs and has less active maintenance than `PyJWT` or `joserfc`. Because `safety` failed, this could not be verified automatically.  
**Evidence:** `requirements.txt:11` and `pyproject.toml:17` list `python-jose[cryptography]>=3.3.0`.  
**Affected files:** `requirements.txt`, `pyproject.toml`.  
**Impact:** Potential JWT security library risk.  
**Recommended action:** Migrate to `PyJWT` or `joserfc` and remove `python-jose`.

---

### 4.10 Documentation & dependency consistency

**Score: 60%**

Repository maps and planning documents are extensive and consistent. Dependency management has issues.

**DOC-01 — Local virtual environment is not populated**  
**Severity:** MEDIUM  
**Description:** `.venv` only contains `pip`; all packages are installed in the system Python (`/Library/Frameworks/Python.framework/Versions/3.14`). This causes the bandit/safety failures and means `requirements-dev.txt` is not actually being used in the local environment.  
**Evidence:** `ls .venv/lib/python3.14/site-packages` shows only `pip`; `which pytest` and `python -c "import redis"` fail unless using the system Python.  
**Affected files:** `.venv/`, `requirements-dev.txt`.  
**Impact:** Reproducibility and static-analysis reliability suffer; CI may differ from local.  
**Recommended action:** Recreate the virtual environment from `requirements-dev.txt` and use it.

**DOC-02 — Python dependencies are consistent but `safety` could not scan them**  
**Severity:** MEDIUM  
**Description:** `pip check` reports no broken requirements. `requirements.txt` and `pyproject.toml` are in sync. However, `safety check` crashed and `python-jose` remains.  
**Evidence:** `pip check` output; `diff` of installed vs required packages (only `pip` in `.venv`).  
**Affected files:** `requirements.txt`, `pyproject.toml`, `.venv/`.  
**Impact:** Cannot assert dependency CVE status.  
**Recommended action:** Resolve `safety` environment issue and audit `python-jose`.

**DOC-03 — Frontend `npm audit` critical/high findings (same as FE-03)**  
**Severity:** HIGH  
**Description:** See FE-03.  
**Impact:** See FE-03.  
**Recommended action:** See FE-03.

---

## 5. Scoring Rationale

* **Architecture (60%):** Core stack is correct, but region, search, push, and messaging decisions are not reflected.
* **Backend (70%):** Most services exist and are tested, but major sub-features (photos, payment methods, admin, push) are missing.
* **API (68%):** 66 endpoints implemented, but the spec's admin, photo, pricing, stream, and cursor-pagination requirements are not met.
* **Database (65%):** Ten migrations cover the core schema, but missing tables and extensions break several planned features.
* **Frontend (25%):** Builds and type-checks, but it is a four-page scaffold with no product value.
* **Mobile (5%):** No code; design docs only.
* **Infrastructure (50%):** Terraform and CI are written but contain syntax errors, placeholders, and region drift.
* **Testing (75%):** Backend test gate met, but warning volume, uneven coverage, and broken security scanners reduce confidence.
* **Security (58%):** Basic controls present, but operational secrets, rate limiting, and exception handling need hardening.
* **Documentation/Deps (60%):** Maps are thorough; dependency tooling is unreliable and frontend has CVEs.

---

## 6. Executive Decision

**Decision: NOT READY**

The StayOS backend demonstrates strong engineering fundamentals and passes its own test-coverage gate, but the project cannot be released or put into public closed beta in its current state. The most critical blockers are:

1. **Frontend and mobile are not built.** The web app is a scaffold; mobile does not exist.
2. **Listing photo upload, payment method options, and admin tooling are missing.** These are Alpha release checklist items.
3. **Infrastructure is unprovisionable and regionally inconsistent.** Terraform has a syntax error and placeholder deploy values.
4. **Security scanners are not functional locally, and rate limiting may fail silently.** These must be resolved before any security gate.

**Conditions to proceed to staged backend-only closed testing:**

* Fix `INF-01`, `INF-02`, `INF-03`, `ARC-01`, `BCK-05`, `SEC-01`, and `SEC-02`.
* Add `pms.unit_photos`, listing photo endpoints, and migration 011.
* Verify `bandit` and `safety` on the target Python 3.11 environment and fix or replace `python-jose`.

**Conditions to proceed to public Alpha:**

* Complete the frontend MVP (auth, search, listing detail, booking, host dashboard, RTL Arabic).
* Select and scaffold the mobile framework.
* Implement messaging/reviews or formally defer them with an updated baseline.
* Resolve all CRITICAL and HIGH findings.

---

## 7. Appendix — Evidence

### A.1 Static analysis

* `ruff check src/ tests/` → exit 0, no output.
* `mypy src/` → `Success: no issues found in 81 source files`.

### A.2 Security scans

* `bandit -r src/ -ll` → `No issues identified`, but 64 files skipped due to `AttributeError: module 'ast' has no attribute 'Num'` under Python 3.14.
* `safety check` → `Unhandled exception happened: No module named 'pkg_resources'`.

### A.3 Test results

* `pytest tests/` → `283 passed, 13865 warnings in 27.68s`; coverage `80.42%`.

### A.4 Frontend build

* `npm run type-check` → exit 0.
* `npm run build` → success; 5 static/dynamic pages generated.
* `npm audit --audit-level=high` → 18 vulnerabilities (1 critical, 17 high) in `next`, `postcss`, `brace-expansion`/`minimatch`.

### A.5 Dependency check

* `pip check` → `No broken requirements found.`
* `.venv` contains only `pip`; all tooling and dependencies are running from the system Python 3.14 environment.

### A.6 Terraform review

* `infra/terraform/main.tf` has invalid HCL at lines 27–28 (`Project var.project_name` / `Environment var.environment`).
* `dynamodb_table = "stayos-terraform-locks"` is referenced but not provisioned.
* Terraform and `aws` CLI are not installed in the audit environment, so `terraform validate`/`plan` could not be run.
