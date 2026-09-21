# RELEASE TECHNICAL HANDOFF — StayOS

**Version:** 2.0
**Date:** 2026-09-20
**Branch:** `product-completion-review`
**Head commit at writing:** `d534c37` (frontend hardening) / `044f94e` (backend package — same tree state)
**Supersedes:** v1.0 @ `3129415` (same-day earlier revision; this version reflects the completed Web Acceptance Hardening cycle)
**Status:** Canonical evidence-based handoff for release review. Every claim cites repository state, live deployment configuration, or verified runtime behavior. Unverifiable items are marked `UNKNOWN` or `MANUAL ACTION REQUIRED` — nothing is invented.

Status legend used throughout: `VERIFIED` · `PARTIALLY VERIFIED` · `UNKNOWN / NEEDS FOUNDER INPUT` · `MANUAL ACTION REQUIRED` · `SECRET — DO NOT EXPORT`

---

## SECTION 1 — PROJECT IDENTITY

| Field | Value | Status |
|---|---|---|
| Project name | StayOS — AI-powered two-sided accommodation marketplace for MENA | VERIFIED |
| Repository path | `/Users/ahmed/Documents/Projects/StayOS` | VERIFIED |
| Canonical repository URL | `https://github.com/islamelbaz2010/StayOS` | VERIFIED (`git remote -v`) |
| Working branch | `product-completion-review` | VERIFIED |
| Latest commit | `d534c37` — `fix(auth): surface API error detail on login/register failures` | VERIFIED |
| Latest deployed commit | `044f94e` — Railway deployments `a692196f` (API), `c25459c9` (worker), `7eeda980` (beat), all SUCCESS; `d534c37` is frontend-only on top of it | VERIFIED (Railway deployment list) |
| Protected branch | `main` — merge-base with working branch is `8a09fcb`; working branch is ~110 commits ahead | VERIFIED |
| Project phase | Phase 0 LOCKED (commercial validation not complete); Phase 1 engineering authorized in parallel under DEC-011 | VERIFIED (`.ai/CURRENT/AGENTS.md`, `DECISION_LOG.md`) |
| Current release state | Closed-alpha preparation. Web Acceptance Hardening cycle complete; Founder visual acceptance pending on latest preview. Railway "production" environment is functioning as the acceptance/staging deployment. | VERIFIED |
| Backend status | FastAPI modular monolith; **1190 tests passing**, coverage **80.38%** (gate ≥80%) | VERIFIED |
| Web status | Next.js 14 App Router; typecheck/lint/**Vitest (23)**/production build all passing | VERIFIED |
| Mobile status | Expo ~51 / RN 0.74.5 app in `apps/mobile/`; `tsc --noEmit` passes; preview-only (not production-ready); device-level P0 bugs open on physical Android (booking CTA, map/list toggle); framework decision ADR-016/DEC-014 still gates mobile engineering | PARTIALLY VERIFIED |
| Major blockers | Real payment collection account (placeholder), AWS/S3 credentials (empty on Railway), **Firebase credentials absent (Google/Apple sign-in blocked)**, legal entity, unresolved Paymob-vs-Stripe decision, unresolved KYC ML architecture | VERIFIED |
| Web Acceptance Hardening | Completed 2026-09-20: booking calendar (month navigation + sliding fetch window), staff E.164 enforcement, email+password auth, admin payment-detail 500 fix, profile/account consistency, header/footer permission filtering, canonical cover images. All ENGINEERING VERIFIED; Founder visual acceptance pending. | VERIFIED |

---

## SECTION 2 — COMPLETE URL INVENTORY

| Purpose | URL | Status |
|---|---|---|
| GitHub repository | `https://github.com/islamelbaz2010/StayOS` | VERIFIED |
| GitHub Actions | `https://github.com/islamelbaz2010/StayOS/actions` | VERIFIED (8 workflows in `.github/workflows/`) |
| Vercel project | `web` — project ID `prj_xHnVLuqrcTaEpM94ckt2cabr9CDo`, team `team_39m7lWlAV3vikfMHneAoZrtG` ("islam-elbaz-s-projects") | VERIFIED (`apps/web/.vercel/project.json`) |
| Vercel Preview (live) | `https://stayos-git-product-completion-review-islam-elbaz-s-projects.vercel.app` | VERIFIED — Ready on `d534c37`; **SSO-protected** (Vercel authentication gate; project owner can access) |
| Vercel production domain | UNKNOWN — no production domain configured in repo; only preview deployments observed | UNKNOWN / NEEDS FOUNDER INPUT |
| Railway project | `stayos-demo` — project ID `fcfb039d-bf12-4bb9-8434-98de4742c4cf`, environment `production` (`841e69f7-dc16-41da-b70b-f72df7161bda`) | VERIFIED (Railway API) |
| API base URL | `https://stayos-demo-production.up.railway.app` | VERIFIED — `/health` returns `{"status":"ok","database":"ok","redis":"ok"}` |
| API health | `https://stayos-demo-production.up.railway.app/health` (+ `/health/live`, `/health/ready`, `/health/deep`, `/metrics`, `/version`) | VERIFIED live 200 |
| API docs / OpenAPI | `https://stayos-demo-production.up.railway.app/docs` (200) · `/openapi.json` | VERIFIED live |
| Web login | `https://stayos-git-product-completion-review-islam-elbaz-s-projects.vercel.app/en/auth/login` | VERIFIED (route exists in build output) |
| Admin UI | `…/en/admin` (sub-routes: bookings, discovery, disputes, import, kyc, payments, pending, staff) | VERIFIED (build output) |
| Guest KYC | `…/en/kyc` · API `POST /api/v1/kyc/initiate` | VERIFIED (live: 503 until AWS configured) |
| Host area | `…/en/host` (bookings, calendar, earnings, kyc, listings, profile) | VERIFIED (build output) |
| Checkout | `…/en/checkout/[bookingId]` | VERIFIED (build output) |
| Dev-token endpoint | `POST /api/v1/auth/dev-token` — 404 unless `ENVIRONMENT` is `development`/`staging` | VERIFIED (code; reachable on deployed env — see §12) |
| Firebase project | `FIREBASE_PROJECT_ID` **EMPTY** on Railway API/worker (verified 2026-09-20); `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` absent; `NEXT_PUBLIC_FIREBASE_*` absent on Vercel — Google/Apple sign-in is a CONFIGURATION BLOCKER | VERIFIED |
| Google Cloud / Maps console | UNKNOWN | UNKNOWN / NEEDS FOUNDER INPUT |
| AWS console | UNKNOWN — account-level Access Denied observed on some security widgets; root/admin identity needed | PARTIALLY VERIFIED |
| Supabase / Neon | Not used — Postgres is Railway Postgres + local PostGIS docker | VERIFIED (no references) |
| Vercel dashboard | `https://vercel.com/islam-elbaz-s-projects/web` (derived from org slug `islam-elbaz-s-projects`) | PARTIALLY VERIFIED |
| Railway dashboard | `https://railway.com/project/fcfb039d-bf12-4bb9-8434-98de4742c4cf` | PARTIALLY VERIFIED (project ID verified; URL format assumed) |
| Paymob dashboard | UNKNOWN — vars defined, no integration live | UNKNOWN |
| Akedly / Twilio / Meta dashboards | UNKNOWN | UNKNOWN / NEEDS FOUNDER INPUT |

---

## SECTION 3 — ENVIRONMENT MATRIX

| Component | LOCAL | RAILWAY "production" (de-facto staging/acceptance) | VERCEL PREVIEW | TRUE PRODUCTION |
|---|---|---|---|---|
| Frontend | `next dev` (`apps/web`) | — | Vercel project `web`, preview per branch | NONE — no prod domain/deployment exists |
| Backend API | `uvicorn app.main:app --reload` (docker-compose `stayos_api`) | Railway service `stayos-demo`, domain `stayos-demo-production.up.railway.app`, region `sfo`, 1 replica | same | NONE |
| Worker | `celery -A app.celery_app worker -Q high,default,low --concurrency=4` | Railway `worker`, same Dockerfile, `--concurrency=2` | — | NONE |
| Beat | `celery -A app.celery_app beat` | Railway `beat`, `PersistentScheduler -s /tmp/celerybeat-schedule` | — | NONE |
| Database | `postgis/postgis:16-3.3-alpine` (docker-compose `stayos_postgres`) | Railway `Postgres` service (PG* vars injected) | — | NONE |
| Redis | `redis:7-alpine` (`stayos_redis`) | Railway `Redis` service (`REDIS_URL`) | — | NONE |
| Storage (S3) | none local; vars empty | `S3_*`/`AWS_*` vars defined but **EMPTY** on API/worker/beat → presign endpoints return controlled 503 | — | MANUAL ACTION REQUIRED |
| Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | `GOOGLE_MAPS_API_KEY` on API only; worker/beat have malformed `GoogleـMapsـAPI` (Arabic tatweel in name) | set at Vercel env | UNKNOWN |
| Places (discovery) | `GOOGLE_PLACES_API_KEY` | defined on API service | — | UNKNOWN |
| Email (SES) | test-mode stub | `AWS_*` empty → `send_email` raises "Email provider is not configured" | — | MANUAL ACTION REQUIRED |
| SMS/OTP | test-mode stub | OTP path = **Akedly** (`AKEDLY_*` defined); Twilio vars defined but OTP code path uses Akedly | — | VERIFIED — Founder received a real OTP and authenticated (2026-09-20); live signed-challenge endpoint returns 200 |
| Payments | manual Model A instructions from `PAYMENT_*` settings | `PAYMOB_*`, `STRIPE_*` vars defined; no live gateway flow wired | — | MANUAL ACTION REQUIRED (real account + provider decision) |
| Monitoring | — | `SENTRY_DSN` not defined on Railway; `/metrics` endpoint live | — | MANUAL ACTION REQUIRED |
| Deployment source | working tree | repo `islamelbaz2010/StayOS`, branch `product-completion-review`, checkSuites off | Vercel git integration | — |
| `ENVIRONMENT` var | `development` | value SECRET; dev-token reachable live → effectively `staging` | n/a | `production` would disable dev-token |

Variable names only are documented; values are `SECRET — DO NOT EXPORT`.

---

## SECTION 4 — ARCHITECTURE

Actual implemented architecture (not the intended AWS/ECS architecture — see §11):

| Subsystem | Technology | Directory / key files | Dependencies | Status |
|---|---|---|---|---|
| Web | Next.js 14.2, React 18, TS, next-intl (ar/en), TanStack Query | `apps/web/` | Railway API via `NEXT_PUBLIC_API_URL` | VERIFIED |
| Mobile | Expo ~51, RN 0.74.5, React Navigation 6, TanStack Query, axios, react-native-maps | `apps/mobile/` (`src/screens/`, `src/lib/api.ts`) | `EXPO_PUBLIC_API_URL` | PARTIALLY VERIFIED |
| Backend | Python 3.11, FastAPI, SQLAlchemy async, Pydantic v2 | `src/app/` — 18 routers mounted at `/api/v1` (`main.py:209-225`) | Postgres, Redis, S3, Firebase, Akedly | VERIFIED |
| Database | PostgreSQL 16 + PostGIS | `alembic/` (41 versions), models under `src/app/*/models.py` | — | VERIFIED |
| Redis | Redis 7 — rate limits, OTP throttle, caching | `src/app/shared/redis.py` | — | VERIFIED |
| Celery | `app.celery_app`, queues `high,default,low`, beat schedule in `celery_app.py:33` | `src/app/celery_app.py`, `*/tasks.py` | Redis broker | VERIFIED |
| Storage | AWS S3 presigned PUT/GET (KYC, listing photos, payment proofs) | `kyc/services.py`, `listings/services.py`, `payments/services.py` | S3 buckets + IAM — **unconfigured** | PARTIALLY VERIFIED (503 guard) |
| Auth | Firebase ID-token verify (`firebase_admin`) + backend-issued RS256 JWT pair + Akedly phone OTP | `auth/services.py`, `auth/router.py`, `auth/dependencies.py` | Firebase project, Akedly | VERIFIED |
| RBAC | `UserRole` (guest/host/staff/admin) + `StaffPermission` grants + `host/permissions.py` scopes | `auth/constants.py`, `auth/staff.py`, `host/permissions.py` | — | VERIFIED |
| KYC | initiate→presigned upload→submit→worker ML (Textract/Rekognition)→admin manual review | `kyc/` | S3 (+ML services unavailable in me-central-1) | VERIFIED manual path; ML path blocked by region |
| Payments | Manual Model A: instructions→proof upload→staff verify; dormant finance escrow/wallet/ledger | `payments/`, `finance/` | S3 proof bucket, provider keys | PARTIALLY VERIFIED |
| Messaging | DB-backed conversations/messages | `messages/` | — | VERIFIED |
| Notifications | Outbox events → providers (WhatsApp Meta, SES email, Twilio SMS) | `notifications/` | Meta/SES/Twilio — unconfigured | PARTIALLY VERIFIED |
| Maps | Google Maps (web/mobile display), Google Places (server-side discovery) | `discovery/`, frontend components | Google keys | PARTIALLY VERIFIED |
| Supply Discovery | External-source listing discovery + import | `discovery/`, `importer/` | Places API, OSM/Overpass | VERIFIED |
| Reviews | Booking-scoped host/guest reviews | `reviews/` | — | VERIFIED |
| Booking lifecycle | `reservations/` (request/expire flow) + `bookings/` (state machine, host accept/reject 24h `REQUEST_EXPIRATION_HOURS`) | `reservations/`, `bookings/` | — | VERIFIED |
| Search | PostGIS geo search + filters + all-in pricing | `listings/services.py`, `listings/pricing.py` | PostGIS | VERIFIED |
| Pricing | Canonical: `PLATFORM_TOTAL_SHARE_PCT=0.12`, `HOST_SIDE_SHARE_PCT=0.06`, `GUEST_SIDE_SHARE_PCT=0.06` (FD-19). Legacy `GUEST_SERVICE_FEE_PCT`/`HOST_COMMISSION_PCT`/`PLATFORM_TAKE_RATE_PCT` retained for old rows only | `config.py`, `finance/commercial.py`, `listings/pricing.py`, `payments/services.py`, `finance/services.py` | `docs/STAYOS_PAYMENT_AND_COMMERCIAL_MODEL.md` | VERIFIED (decided values) |
| Refunds | Cancellation tiers via `CANCELLATION_*` + `REFUND_PROCESSING_DAYS=5` (wired into `booking.cancelled` payload) | `config.py`, `reservations/services.py`, `bookings/services.py` | manual processing | VERIFIED (rules decided; payout manual) |
| Admin ops | KYC queue, listing moderation, disputes, staff management, CSV import, payments review, discovery console | `operations/`, `staff/`, `importer/`, `apps/web/app/[locale]/admin/` | — | VERIFIED |

---

## SECTION 5 — DATABASE

| Item | Value | Status |
|---|---|---|
| Engine | PostgreSQL 16 + PostGIS (local `postgis/postgis:16-3.3-alpine`; CI `16-3.4-alpine`; Railway `Postgres` service) | VERIFIED |
| Schemas | `auth`, `pms`, plus app tables (bookings, payments, kyc, messages, reviews, finance, operations, discovery) | VERIFIED (migration `001_create_schemas`) |
| Migration system | Alembic (`alembic.ini`, `alembic/env.py`, `alembic/versions/`) | VERIFIED |
| Migration count / head | **42 versions**, head `041_user_password_hash` (adds `auth.users.password_hash`; applied on Railway DB 2026-09-20) | VERIFIED |
| Migration command | `alembic upgrade head` (CI deploy workflows run it via ECS task; Railway path is manual/`railway run`) | VERIFIED |
| User/role model | `auth.users` — `role` (guest/host/staff/admin), `kyc_status`, `is_active`; `StaffPermission` for staff grants | VERIFIED |
| Booking source of truth | `bookings` module (state machine) + `reservations` module (request lifecycle/expiration); booking events written to outbox | VERIFIED |
| Payment source of truth | `payments` module (`Payment` rows: pending→proof_uploaded→verified/rejected; resubmission counters) | VERIFIED |
| KYC source of truth | `kyc` module (`KycDocument`: unverified→pending→verified/rejected) | VERIFIED |
| Review model | `reviews` — booking-scoped host & guest reviews | VERIFIED |
| Listing/unit model | `pms.units` + `pms.unit_listings` + `pms.unit_photos` (moderation_state) + calendar rules | VERIFIED |
| Calendar model | `CalendarRule`/`CalendarBlockType`/`CalendarStatus` + `CALENDAR_LOCK_TIMEOUT_MS` locking | VERIFIED |
| PostGIS usage | `Unit.coordinates` (geography 4326), geo-filtered search | VERIFIED |
| Important indexes | PostGIS spatial index on coordinates; standard FK indexes | PARTIALLY VERIFIED |
| Backups | `scripts/backup.py`, `scripts/restore_verify.py` exist; no scheduled Railway backup evidenced | PARTIALLY VERIFIED |
| Rollback | `scripts/staging_rollback.sh`; `alembic downgrade` available | PARTIALLY VERIFIED |
| Drift risks | Railway "production" env shares one Postgres; migrations must be run manually on deploy (no auto-migrate evidenced in Railway start command) | VERIFIED — MANUAL ACTION REQUIRED before schema changes ship |
| Connection strings | `DATABASE_URL`, `PG*` — SECRET — DO NOT EXPORT | SECRET |

---

## SECTION 6 — API INVENTORY

Source: generated `openapi.json` — **156 paths** (regenerated 2026-09-20; includes reviews `q` param), title "StayOS API" v0.1.0. Routers mounted in `src/app/main.py:209-225`.

| Group | Paths | Notable endpoints | Auth/permission |
|---|---|---|---|
| auth | 16 | `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/register` + `POST /auth/login` (email+password), `POST /auth/password` (set/change), `POST /auth/firebase` (Firebase), `POST /auth/refresh`, `POST /auth/dev-token` (env-gated), `GET /auth/.well-known/jwks.json`, device tokens | public + bearer |
| listings | 28 | `GET/POST /listings`, `GET/PATCH /listings/{unit_id}`, `POST /{unit_id}/photos/presign` (host/admin, MIME allowlist, storage-guarded), photos CRUD/reorder/cover, submit-for-review, co-hosts | owner-or-admin, staff scopes |
| operations | 19 | ops tasks, admin moderation, disputes | staff/admin permissions |
| host | 13 | `/host/today`, `/host/reservations`, `/host/bookings`, earnings, calendar, profile | host role + ownership |
| auth/kyc | 7 | `POST /kyc/initiate` (guest, storage-guarded 503), `POST /kyc/documents/{id}/submit`, `GET /kyc/status`, admin pending/review/download | guest + `require_staff_permission("kyc")` |
| bookings | 11 | `POST /bookings`, `GET /bookings`, guest/host lists, accept/reject (host only — admin denied at API level), cancel | guest/host ownership |
| discovery | 10 | sources, stats, configs, candidates | staff/admin |
| finance | 11 | wallets, ledger, escrow, payouts — dormant (Stripe unset) | user/staff |
| reservations | 8 | `POST /reservations`, list/detail, cancel | guest |
| payments | 8 | quote, payment CRUD, `POST /{id}/proof/presign` (KYC-verified guest/admin, storage-guarded), `GET /{id}/proof/download`, `POST /{id}/verify` (staff `payments` perm) | guest-owner/host/staff |
| messages | 9 | conversations, unread, send/reply | participant-scoped |
| favorites | 4 | favorites CRUD, `GET /locations/autocomplete` | guest |
| availability | 2 | `GET/PATCH /availability/{unit_id}` | public read / host write |
| reviews | 2 | `POST /bookings/{id}/reviews`, `GET /listings/{id}/reviews` | guest/host post-booking |
| import | 2 | `POST /import/preview`, `POST /import/confirm` | staff/admin |
| health/meta | 7 | `/health`, `/health/live`, `/health/ready`, `/health/deep`, `/metrics`, `/version`, `/` | public |

All routers wrap service calls in `StayOSError → to_http_exception` mapping (`shared/exceptions.py`): 404/429/422/401/403/409/503. Generic 500 handler re-adds CORS headers (`main.py:150-185`).

---

## SECTION 7 — AUTHENTICATION / TEST ACCOUNTS

Auth mechanism (VERIFIED, `auth/services.py`, `auth/router.py`):

- **OTP login**: `POST /auth/otp/send` → `POST /auth/otp/verify` — provider is **Akedly** (`AKEDLY_API_KEY`, `AKEDLY_PIPELINE_ID`, `AKEDLY_BASE_URL`; 6-digit OTP; Redis rate limits `OTP_TTL_SECONDS=300`, `OTP_MAX_ATTEMPTS=3`, `OTP_RATE_LIMIT_WINDOW=900`). **Live delivery verified** — Founder received OTP and authenticated (2026-09-20).
- **Email + password**: `POST /auth/register` (email/password/display_name → token pair), `POST /auth/login` (email/password → token pair), `POST /auth/password` (authenticated set/change — lets OTP-only accounts add a password). Passwords hashed with bcrypt over a SHA-256 pre-hash (avoids bcrypt's 72-byte limit without truncation). `auth.users.password_hash` nullable column (migration `041`); `has_password` flag on `UserResponse`. Live-verified: register 200, wrong password 401, unknown email 401, duplicate email 409, change 204.
- **Firebase login**: `POST /auth/firebase` verifies Firebase ID token via `firebase_admin`. Code path complete but **unusable until credentials exist** — `FIREBASE_*` empty on Railway, `NEXT_PUBLIC_FIREBASE_*` absent on Vercel; Google/Apple buttons render disabled. CONFIGURATION BLOCKER.
- **Tokens**: backend-issued RS256 JWT pair (`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`, access 15min, refresh 7d); JWKS at `/api/v1/auth/.well-known/jwks.json`.
- **Dev Login**: `POST /auth/dev-token` issues a token pair for a user ID — **no static password exists**; gated to `ENVIRONMENT in (development, staging)`; used by web login page and mobile (`EXPO_PUBLIC_ENABLE_DEV_LOGIN`).

Acceptance fixtures (VERIFIED, seed scripts + `apps/web/app/[locale]/auth/login/page.tsx`):

| Role | Identifier | Fixture | KYC | Safe to use |
|---|---|---|---|---|
| Guest (acceptance) | `seed-accept-gues-0000-000000000001` · `acceptance-guest@stayos.test` · `+201000000001` | `scripts/seed_acceptance_guest.py` | unverified | YES — staging only |
| Admin | `seed-admin-0000-0000-000000000001` | dev-login fixture | n/a | YES — staging only |
| Staff | `seed-staff-0000-0000-000000000001` | `scripts/seed_acceptance_staff.py` | n/a | YES — staging only |
| Host | `seed-host-0000-0000-000000000002` — "Omar Hassan" | `scripts/seed_acceptance.py` | verified | YES — staging only |
| Legacy guest | `seed-guest-000-0000-000000000003` | `scripts/seed_acceptance.py` | — | YES |

No production passwords, OTP secrets, keys, or tokens are exported anywhere in this document. `SECRET — DO NOT EXPORT`.

---

## SECTION 8 — SEED DATA

Source: `scripts/seed_acceptance.py`, `seed_acceptance_guest.py`, `seed_acceptance_staff.py`, `seed_staging.py`, `cleanup_acceptance.py`. Run against dev/staging DB only.

| Fixture | ID | Details |
|---|---|---|
| Listing A — Zamalek (Request-to-Book) | `seed-unit-0001-0000-000000000001` | "Chic Nile View Apartment in Zamalek" — Cairo/Zamalek, coords 30.0608,31.0563; 1500 EGP/night + 200 cleaning; 4 guests, 2BR/3bed/2bath; MODERATE cancel; 10 amenities; pets, self-check-in (smart_lock/keypad), accessibility features, sleeping arrangements; `instant_book=false` |
| Listing B — Maadi (Instant Book) | `seed-unit-0002-0000-000000000002` | "Modern Garden Apartment in Maadi" — Cairo/Maadi, coords 29.9602,31.2587; 2000 EGP/night + 300 cleaning; 6 guests, 3BR/4bed/2bath; FLEXIBLE cancel; 14 amenities incl. pool/gym/parking; `instant_book=true` |
| Host | `seed-host-0000-0000-000000000002` | Omar Hassan, bio + languages [ar,en,fr], kyc_status=verified |
| Acceptance Guest | `seed-accept-gues-0000-000000000001` | role=guest; stays Guest until KYC+host-upgrade flow authorizes transition |
| Photos | — | seed script attaches photo records for both listings |

Live DB fixture state is **PARTIALLY VERIFIED** — the seeds ran previously against the Railway DB (acceptance flows exercised live in earlier sessions); current row-level state not re-queried this session.

---

## SECTION 9 — DEPLOYMENT / CI-CD

| Item | Value | Status |
|---|---|---|
| **Railway deploy flow** | Push to `product-completion-review` → auto-deploy on all 3 services (source repo connected, `checkSuites: false`); alternative: `scripts/railway_deploy_guard.sh --deploy` → `railway up` (guards against deploying `main`) | VERIFIED |
| Railway build | API service reports builder `RAILPACK` + `RAILWAY_DOCKERFILE_PATH` var; worker/beat builder `DOCKERFILE` → `infra/docker/api/Dockerfile` (python:3.11-slim, `uvicorn app.main:app --workers 4`, non-root `nobody`) | VERIFIED |
| Railway restart policy | `railway.toml`: `ON_FAILURE`, max 10 retries | VERIFIED |
| Railway region/replicas | `sfo`, 1 replica per service | VERIFIED |
| Health behavior | `/health` (db+redis), `/health/live`, `/health/ready`, `/health/deep`; live `/health` returns ok | VERIFIED |
| Rollback | Railway dashboard redeploy previous deployment / `railway redeploy`; `scripts/staging_rollback.sh` | PARTIALLY VERIFIED |
| **Vercel flow** | Git-integrated previews; project `web` (Next.js 14). Build: `next build`; output `.next`. Env separation via Vercel env vars (`NEXT_PUBLIC_API_URL` pointed at Railway). | VERIFIED (preview live) |
| Vercel rollback | Redeploy previous deployment in Vercel dashboard | VERIFIED (platform behavior) |
| **GitHub Actions** (8 workflows) | `ci.yml` (ruff, mypy, bandit, pytest w/ Postgres16+Redis7 services — on PRs to develop/main) · `deploy-staging.yml` (push `develop` → **AWS ECS staging**) · `deploy-prod.yml` (push `main` → **AWS ECS prod**) · `build-mobile-android.yml`, `build-android-local.yml` · `release.yml`, `security.yml`, `docs.yml` | VERIFIED |
| ⚠ Deploy-path duality | The ECS workflows target the **intended** AWS architecture; the **actual** running system is Railway+Vercel. Pushing `main` would trigger an ECS deploy to infrastructure that is not provisioned — do not merge to `main` casually. | VERIFIED |
| Migrations on deploy | ECS workflows run `alembic upgrade head` as a task; Railway has **no** auto-migration step evidenced — run manually after deploy when schema changes ship | MANUAL ACTION REQUIRED |
| Test commands | `.venv/bin/python -m pytest tests` (coverage gate 80%) · `npx tsc --noEmit` · `npx next lint` · `npx vitest run` · `npx next build` | VERIFIED |
| API types regen | `python3 scripts/export_openapi.py && npx openapi-typescript lib/openapi.json -o lib/api-types.ts` | VERIFIED |

---

## SECTION 10 — MOBILE

| Item | Value | Status |
|---|---|---|
| Framework | Expo ~51.0.28, React Native 0.74.5, React 18.2.0 | VERIFIED |
| App name / slug / scheme | StayOS / `stayos-mobile` / `stayos` | VERIFIED (`app.json`) |
| Android package | `com.stayos.mobile` | VERIFIED |
| iOS bundle ID | `com.stayos.mobile` | VERIFIED |
| EAS project | `04b13a13-9ae5-4bdb-8211-a2b862116bbc`, owner `islamelbaz` | VERIFIED |
| EAS profiles | only `preview` (internal distribution, Android APK); **no production profile** | VERIFIED (`eas.json`) |
| API config | `EXPO_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`), axios + refresh-token interceptor | VERIFIED |
| Maps config | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` injected via `app.config.js` into android `googleMaps` + iOS `googleMapsApiKey`; screens render map fallback when unset | VERIFIED |
| Other env | `EXPO_PUBLIC_DEV_GUEST_ID`, `EXPO_PUBLIC_ENABLE_DEV_LOGIN`, `EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER` | VERIFIED |
| Screens | 16+: Login, Home, Search, ListingDetail, Booking, Trips, TripDetail, Inbox, Message, Favorites, Account, Kyc, Payment, Payments, Support, HostProfile, `host/` | VERIFIED |
| Plugins | expo-image-picker (camera/photos for KYC+receipts), expo-document-picker | VERIFIED |
| Signing | no credentials/keystore files in repo; EAS-managed or manual — UNKNOWN | UNKNOWN / NEEDS FOUNDER INPUT |
| Store readiness | no `production` EAS profile, no store listing evidence; Google Play / App Store status UNKNOWN | UNKNOWN |
| Local APKs | `StayOS-preview.apk` present in `apps/mobile/`; latest EAS build `9d4c1255-1cea-4275-98db-e91ac4547839` | VERIFIED |
| Open device bugs (P0) | Booking CTA `احجز الآن` non-tappable on OPPO CPH2481 (Android 15); search map/list toggle doesn't switch — see `.ai/AUDIT/STAYOS_V1_PHASE_3_TARGETED_FIX_REPORT_2026-08-18.md` | VERIFIED open |
| Governance | Mobile engineering gated by ADR-016/DEC-014 (framework decision); an Expo app nonetheless exists and was device-validated | VERIFIED |
| Typecheck | `tsconfig.json` present; `npx tsc --noEmit` available — not part of CI evidence | PARTIALLY VERIFIED |

---

## SECTION 11 — EXTERNAL SERVICES

| Provider | Purpose | Env vars (names only) | Integration point | Status |
|---|---|---|---|---|
| Vercel | Web hosting/previews | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_IMAGE_HOSTS`, `NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER` | `apps/web/` | VERIFIED — preview live; production domain UNKNOWN |
| Railway | API, worker, beat, Postgres, Redis | 44 vars on API (full list §3/§Railway) | repo-connected auto-deploy | VERIFIED |
| AWS S3 | KYC docs, listing photos, payment proofs | `S3_KYC_BUCKET`, `S3_LISTINGS_BUCKET`, `S3_PAYMENT_PROOF_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | `kyc/`, `listings/`, `payments/` presign | MANUAL ACTION REQUIRED — vars empty on Railway; buckets/IAM not provisioned (Terraform intended, never applied); `S3_PAYMENT_PROOF_BUCKET` not even defined on Railway |
| AWS Textract/Rekognition | KYC auto-verification in worker | same AWS vars | `kyc/tasks.py`, `kyc/services.py` | BLOCKED — services do not exist in canonical region `me-central-1` (verified vs botocore endpoints + AWS regional list); manual review is the live path; architecture decision open |
| AWS SES | Email notifications | `AWS_*` | `notifications/providers.py` (unsigned HTTPS call — code comment says SigV4 signing needed for prod) | MANUAL ACTION REQUIRED |
| Firebase | ID-token auth (Google/Apple sign-in) | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_*` | `auth/services.py` | **CONFIGURATION BLOCKER** — all server creds empty on Railway; client vars absent on Vercel (verified 2026-09-20); code path complete, buttons render disabled, fails safely |
| Akedly | Phone OTP | `AKEDLY_API_KEY`, `AKEDLY_PIPELINE_ID`, `AKEDLY_BASE_URL` | `auth/services.py` | VERIFIED — vars defined on Railway; Founder received real OTP and authenticated (2026-09-20) |
| Twilio | SMS notification channel (legacy OTP path) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | `notifications/providers.py` | PARTIALLY VERIFIED — vars defined; OTP code path uses Akedly, not Twilio |
| Meta WhatsApp | WhatsApp notifications | `META_WHATSAPP_TOKEN`, `META_PHONE_NUMBER_ID` | `notifications/providers.py` | MANUAL ACTION REQUIRED — vars not defined on Railway |
| Google Maps | Web/mobile map rendering | `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | frontend + `app.config.js` | PARTIALLY VERIFIED — see leaked-key history §12 |
| Google Places | Supply Discovery (server-side; intentionally separate credential from Maps key) | `GOOGLE_PLACES_API_KEY` | `discovery/` | PARTIALLY VERIFIED |
| OSM/Nominatim + Overpass | Discovery geo lookups | none | `discovery/` | VERIFIED (code) |
| Paymob | Primary Egypt-alpha processor (FD-01/FD-25) | `PAYMOB_API_KEY`, `PAYMOB_HMAC_SECRET` on Railway; `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_INTEGRATION_ID` (TEST `5935386`), `PAYMOB_IFRAME_ID` required for Payment Intention flow | Intention API + HMAC-SHA512 webhook implemented; TEST sandbox only | PENDING TEST CREDENTIALS — Founder enters TEST values in Railway; production credentials BLOCKED — PROVIDER |
| Stripe | Alternative processor / dormant finance module | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `finance/` dormant without key | UNRESOLVED — same conflict |
| Manual bank/Vodafone Cash | V1 Model A collection | `PAYMENT_BANK_NAME_AR/EN`, `PAYMENT_ACCOUNT_NAME`, `PAYMENT_BANK_ACCOUNT_NUMBER`, `PAYMENT_VODAFONE_CASH_NUMBER` | `payments/services.py` `_build_instructions` | MANUAL ACTION REQUIRED — placeholders; real account needed |
| Sentry | Error monitoring | `SENTRY_DSN` | `security/sentry.py` | MANUAL ACTION REQUIRED — not defined on Railway |

---

## SECTION 12 — SECURITY

| Area | State | Status |
|---|---|---|
| Authentication | Firebase ID-token verify + RS256 JWT pair; refresh tokens hashed; OTP via Akedly w/ Redis rate limiting | VERIFIED |
| RBAC | `UserRole` guest/host/staff/admin; `require_role`; `require_staff_permission("<scope>")` checks `StaffPermission` grants; admin bypass | VERIFIED |
| Admin/host boundary | Admin cannot accept/reject bookings (API-level deny, commit `2dae63d`); admin booking ops UI hides host actions; listing edits scoped by `assert_can_edit_listing` (owner, co-host scope, or admin) | VERIFIED |
| KYC permissions | User initiate/submit = self; admin queue/review/download = `require_staff_permission("kyc")` | VERIFIED |
| Payment permissions | Proof upload = guest-owner or `payments` staff perm; download adds host; verify = `payments` perm; KYC-verified required for proof presign | VERIFIED |
| Tenant/ownership | Payments/bookings/messages scoped by guest_id/host_id/participant checks | VERIFIED |
| CORS | `CORS_ORIGINS` list + `CORS_ORIGIN_REGEX` tightened to `https://stayos-[^.]+-islam-elbaz-s-projects\.vercel\.app` (was `*.vercel.app` — commit `418dca8`); generic-500 handler re-adds CORS headers | VERIFIED |
| Upload security | Presigned PUTs: KYC MIME allowlist (jpeg/png/webp signed into URL); listings presign now server-validated to same set; payment proofs allow jpeg/png/webp/pdf into a dedicated private bucket (`S3_PAYMENT_PROOF_BUCKET` — must never share the public listings bucket, P0-3) | VERIFIED |
| Storage guards | All three presign paths fail closed: unconfigured storage → controlled 503 naming missing vars (no unhandled 500, no orphan rows) | VERIFIED (commits `eaf347c`, `3129415`) |
| Secret handling | Settings via env vars; JWT RS256 keypair; `security/secrets.py` (Secrets Manager integration for AWS path); no secrets in repo | VERIFIED |
| Middleware | security headers, audit logging, request ID, ops metrics, rate limiting (`security/rate_limit.py`) | VERIFIED |
| Leaked-key history | A Google Maps API key literal was previously committed to the repo and redacted (commit `45ab4c0`); commit `23cc371` corrected stale credential docs — **rotation status UNKNOWN** | PARTIALLY VERIFIED — MANUAL ACTION REQUIRED (confirm rotation) |
| Railway var anomaly | worker/beat carry a variable literally named `GoogleـMapsـAPI` (contains Arabic tatweel characters) instead of `GOOGLE_MAPS_API_KEY` — malformed; also missing on those services | VERIFIED — MANUAL ACTION REQUIRED |
| Dev-token exposure | `/auth/dev-token` is reachable on the deployed Railway env because `ENVIRONMENT` ≠ `production` — acceptable for closed acceptance; must be `production` before public launch | VERIFIED — release gate |
| Security blockers | KYC bucket CORS (PUT for Vercel origins — see §13); payment-proof bucket entirely undefined on Railway; Google key rotation unconfirmed | VERIFIED |

---

## SECTION 13 — CURRENT MANUAL ACTIONS

### A. Critical before public launch

1. **Real collection account** — replace `PAYMENT_BANK_ACCOUNT_NUMBER`/`PAYMENT_VODAFONE_CASH_NUMBER`/`PAYMENT_BANK_NAME_*`/`PAYMENT_ACCOUNT_NAME` placeholders (guest-facing instructions). No real payment can complete without this. (Founder)
2. **AWS KYC/photo/proof storage** — as root/admin identity in `me-central-1`: create buckets `stayos-staging-kyc` (+listings, +private payment-proof bucket), add CORS on KYC+listings buckets (`PUT` for `https://stayos-*-islam-elbaz-s-projects.vercel.app` + preview URL + `http://localhost:3000`, header `content-type`, expose `ETag`), create IAM user scoped `s3:PutObject`/`s3:GetObject`, then set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_KYC_BUCKET`, `S3_LISTINGS_BUCKET`, `S3_PAYMENT_PROOF_BUCKET` on Railway API **and** worker. (Founder + ops)
3. **Legal entity/registration** — required for publishable ToS (Consumer Protection Law Art. 37); drafts exist in `docs/legal/` but are NOT legally approved. (Founder → counsel)
4. **Egyptian legal counsel** on: CBE Law 194/2020 PSP licensing of Model A money flow (PSP/PSO licensing rules issued June 2025, ~June 2026 transition), PDPL 151/2020 + Executive Regulations Decree 816/2025 (in force Nov 2025; compliance deadline **2026-11-01**), platform-role characterization. (Founder → counsel)
5. **KYC ML architecture decision** — Textract/Rekognition do not exist in `me-central-1`; decide manual-only vs non-MENA ML region vs other provider. Manual review works today. (Founder/architecture)
6. **Payment processor decision** — Paymob (DEC-004) vs Stripe (FLOWS/backlog) remains unresolved; do not write integration code until decided. (Founder)
7. **`ENVIRONMENT=production`** on Railway before public traffic — disables `/auth/dev-token`. (Ops)

### B. Required before production

8. Fix worker/beat malformed `GoogleـMapsـAPI` variable → `GOOGLE_MAPS_API_KEY`; add `S3_PAYMENT_PROOF_BUCKET`, `META_*`, `SENTRY_DSN`, `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` (if Firebase admin path needed server-side) on Railway.
9. ~~Confirm Akedly OTP delivers end-to-end on staging~~ — **RESOLVED 2026-09-20**: Founder received a real OTP and authenticated; live challenge endpoint verified.
10. Confirm Google Maps key **rotation** after the historical literal leak (redacted in `45ab4c0`).
11. Set `SENTRY_DSN`; verify `/metrics` consumer/monitoring.
12. Database backup schedule on Railway Postgres (scripts exist; no schedule evidenced).
13. Vercel production domain + `CORS_ORIGINS` update for it; production `NEXT_PUBLIC_API_URL`.
14. Mobile production EAS profile + signing credentials + store listings (after ADR-016 decision).

### C. Recommended

15. `terraform apply` is **NOT** the path for the current Railway architecture — if the ECS architecture is ever adopted, provision it deliberately; otherwise keep Terraform as intended-state documentation only.
16. Wire SigV4 signing into `notifications/providers.py` SES path before real email (currently unsigned HTTPS POST — will fail against real SES).
17. Add Railway deploy step or startup hook for `alembic upgrade head` so schema drift can't ship.
18. Resolve `python` vs `.venv/bin/python` doc drift — use `.venv/bin/python` locally.

### D. Deferred by decision

19. Paymob outreach (`docs/legal/PAYMOB_REQUIREMENTS_REQUEST.md`) — ready to send; deferred pending processor decision.
20. Refund-calculation function matching decided tiers — deferred (manual computation acceptable for 1–10 transaction alpha).
21. Airbnb/Booking.com channel integrations — classified FUTURE CHANNEL.
22. `{{refund_days}}` — **CLOSED**: `REFUND_PROCESSING_DAYS=5` is wired into `booking.cancelled` payloads (`reservations/services.py`, `bookings/services.py`) with test coverage.

---

## SECTION 14 — RELEASE BLOCKERS

Reconciled 2026-09-20 (post Web Acceptance Hardening). RB numbering is canonical for the release review workbook.

| RB | BLOCKER | EVIDENCE | IMPACT | OWNER | DEPENDENCY | STATUS | NEXT ACTION |
|---|---|---|---|---|---|---|---|
| RB-01 | Placeholder payment account | `config.py` `PAYMENT_*` defaults are placeholders; `payments/services.py` renders them to guests | No real transaction possible | Founder | Real bank/Vodafone Cash account | OPEN | Founder supplies account → set Railway vars |
| RB-02 | AWS storage unconfigured | Railway vars empty (verified); presign endpoints return 503 live | KYC upload, photo upload, payment-proof upload all blocked | Founder+Ops | AWS console admin access | OPEN | §13-A2 steps |
| RB-02a | S3_PAYMENT_PROOF_BUCKET undefined | Not in Railway var list on any service | Proof presign will 503 even after AWS keys exist | Ops | Bucket created | OPEN | Add var + create private bucket |
| RB-02b | KYC bucket CORS | `infra/terraform/s3.tf` has no CORS on KYC bucket; browser PUT required | Uploads blocked by browser even with credentials | Ops | Bucket exists | OPEN | Apply CORS block §13-A2 |
| RB-03 | Payment processor conflict | `DECISION_LOG` DEC-004 (Paymob) vs `FLOWS.md`/`ENGINEERING_BACKLOG.md` (Stripe) | Blocks all gateway integration code | Founder | Decision | OPEN | Founder rules |
| RB-04 | Legal entity | `docs/legal/` drafts exist; no registration | ToS cannot publish; Art. 37 disclosure missing | Founder | Registration | OPEN | Founder registers entity |
| RB-05 | CBE counsel | `LEGAL_COUNSEL_REVIEW_CHECKLIST.md`; readiness pack v3 | Money-flow model may need CBE PSP licensing (~Jun 2026 transition) | Founder→Counsel | Egyptian counsel | OPEN | Engage counsel |
| RB-06 | PDPL counsel | PDPL 151/2020 + Exec Regs 816/2025 in force Nov 2025 — compliance by 2026-11-01 | Data-protection compliance | Founder→Counsel | Egyptian counsel | OPEN | Engage counsel |
| RB-07 | Tourism licensing counsel | Platform-role characterization for STR/tourism activity | Regulatory exposure | Founder→Counsel | Egyptian counsel | OPEN | Engage counsel |
| RB-08 | KYC ML region | Textract/Rekognition absent from `me-central-1`/`me-south-1` (botocore + AWS list verified) | Auto-verification cannot run in canonical region | Founder | Architecture ruling | OPEN — manual review is viable interim | Decide manual-only vs alt region/provider |
| RB-09 | ~~OTP provider unverified~~ | Akedly vars defined; **live delivery verified — Founder received OTP and authenticated 2026-09-20** | — | — | — | **RESOLVED** | — |
| RB-10 | `ENVIRONMENT` not production | dev-token reachable on deployed env | Public launch would expose dev-login | Ops | Launch checklist | OPEN | Set `production` at launch |
| RB-11 | Production domain/CORS | No production domain configured; `CORS_ORIGIN_REGEX` covers `stayos-*-islam-elbaz-s-projects.vercel.app` previews only | True production domain unset | Founder+Ops | Domain purchase + Vercel prod deploy | OPEN | Set domain → update CORS + `NEXT_PUBLIC_API_URL` |
| RB-12 | Google Maps key hygiene | Leaked-key history (redacted `45ab4c0`, rotation unconfirmed); worker/beat carry malformed `GoogleـMapsـAPI` var (Arabic tatweel in name — verified still present 2026-09-20) | Maps may fail on worker; key rotation unconfirmed | Ops | GCP console | OPEN | Confirm rotation; fix worker/beat var name |
| RB-13 | Sentry | `SENTRY_DSN` not defined on Railway (verified 2026-09-20); `/metrics` live | No error monitoring | Ops | Sentry project | OPEN | Set `SENTRY_DSN` |
| RB-14 | DB backups | `scripts/backup.py`/`restore_verify.py` exist; no scheduled Railway backup evidenced | Data-loss risk | Ops | Railway Postgres plan | OPEN | Schedule backups |
| RB-15 | Mobile device bugs | OPPO validation report (P0): booking CTA, map toggle | Mobile alpha unusable on that device | Engineering | Repro/fix | OPEN | TouchableOpacity diagnostic + rebuild |
| RB-16 | Mobile governance | ADR-016 not committed (DEC-014); numbering collision with epos ADR | Mobile engineering formally gated | Founder | ADR | OPEN | Commit framework ADR (new number) |
| RB-17 | Store credentials/signing | No production EAS profile; no keystore/store listing evidence | Cannot ship mobile stores | Founder+Ops | EAS + store accounts | OPEN | Create prod profile + signing |
| RB-18 | ETA e-invoice/e-receipt | Applicability to marketplace collections unanalyzed | Tax compliance | Accountant | Egyptian accountant | OPEN | Accountant confirms |
| RB-19 | Google/Apple sign-in (Firebase) | `FIREBASE_*` empty on Railway; `NEXT_PUBLIC_FIREBASE_*` absent on Vercel (verified 2026-09-20); code path complete, buttons disabled, fails safely | Social login unavailable | Founder+Ops | Firebase project + service account + Vercel env | **CONFIGURATION BLOCKER** | Configure Firebase project → set Railway + Vercel vars |

---

### E. Legal/accounting pack refresh

The legal/accounting review pack (`StayOS_Legal_Accounting_Regulatory_Readiness_Egypt_2026-09-20_v3.pdf` + AR version) is a **classification/review pack — not legal advice**, and was authored before the Web Acceptance Hardening changes. It must be **refreshed to reflect the current technical state**, which now includes: email+password authentication (`auth.users.password_hash`, bcrypt over SHA-256 pre-hash), E.164 staff phone validation, profile/account identity synchronization, plus the pre-existing KYC/payment/AWS/Railway processing. These engineering changes do not authorize legal conclusions.

LEGAL COUNSEL TO CONFIRM: marketplace characterization · CBE PSP applicability · PDPL · tourism licensing · consumer protection · contracts · staff/co-host characterization.
ACCOUNTANT TO CONFIRM: VAT/tax · e-invoice/e-receipt · commission/service-fee treatment.
FOUNDER DECISION: legal entity · processor · real collection account · KYC architecture where applicable.

---

## SECTION 15 — FINAL DEVELOPER ONBOARDING

1. **Repo**: `git clone https://github.com/islamelbaz2010/StayOS.git` → branch `product-completion-review` (current development line; `main` is protected and ~106 commits behind).
2. **Read first**: `.ai/CURRENT/CONTEXT.md` → `AGENTS.md` → `MASTER_CONTEXT.md` → `DECISION_LOG.md` → `docs/02_product/MVP_FREEZE.md` → `TECH_STACK.md` (known conflicts).
3. **Local infra**: `docker-compose up` → Postgres 16+PostGIS, Redis 7, API (`uvicorn --reload`), worker, beat. Copy `.env.example` → `.env` (values required: `DATABASE_URL`, `REDIS_URL`, `JWT_*` keys — generate dev RSA keypair).
4. **Backend**: `.venv/bin/python -m uvicorn app.main:app --reload` with `PYTHONPATH=src` (or use compose). Health: `http://localhost:8000/health`.
5. **Worker**: `celery -A app.celery_app worker --loglevel=info -Q high,default,low` (NullPool already configured for fork safety).
6. **Frontend**: `cd apps/web && npm install && npm run dev` → `http://localhost:3000` (needs `NEXT_PUBLIC_API_URL`).
7. **Tests**: `.venv/bin/python -m pytest tests` (≥80% coverage gate) · `cd apps/web && npx tsc --noEmit && npx next lint && npx vitest run && npx next build`.
8. **Seed acceptance data**: `DATABASE_URL=… .venv/bin/python scripts/seed_acceptance.py && scripts/seed_acceptance_guest.py && scripts/seed_acceptance_staff.py`.
9. **Login as Guest**: login page → Dev Login → Guest (`seed-accept-gues-0000-000000000001`) — dev/staging envs only. Alternatively register a real email+password account via the "Email" tab (works on the deployed env), or phone OTP via Akedly.
10. **Login as Host**: Dev Login → Host (`seed-host-0000-0000-000000000002`, Omar Hassan, KYC-verified).
11. **Admin access**: Dev Login → Admin (`seed-admin-0000-0000-000000000001`) → `/en/admin`.
12. **API inspection**: `/docs` (Swagger), `/openapi.json`; regenerate TS types via `npm run generate:api` in `apps/web`.
13. **DB/migrations**: `alembic upgrade head` / `alembic history`; head = `041_user_password_hash` (42 versions).
14. **Safe Preview deploy**: push to `product-completion-review` → Railway auto-deploys API/worker/beat and Vercel builds a preview. For manual: `scripts/railway_deploy_guard.sh --deploy` (refuses `main`, requires clean tree).
15. **NEVER without founder approval**: Paymob/Stripe choice; KYC ML region/provider; pricing/cancellation/refund rules; `MASTER_CONTEXT.md`, `ROADMAP.md`, `DECISION_LOG.md` (append-only), `docs/phase--1/*`, `archive/*`; Terraform apply; AWS resource creation; credential rotation; production infra changes; merging to `main` (triggers dormant ECS deploy path).

---

## FINAL PRODUCT BENCHMARK STATUS

- **Benchmark status**: **PASSED — subject to founder decisions.** The Airbnb 1:1 behavioral/product-depth register is closed with **0 unresolved implementable benchmark gaps**. The two implementable gaps found during the closure audit (listing-page availability calendar; review keyword search) were implemented, tested, and verified in the same pass.
- **Benchmark closure document**: `docs/benchmark/FINAL_AIRBNB_BENCHMARK_CLOSURE.md` — 204 requirements across 14 domains; companion gate: `docs/benchmark/STAYOS_DIFFERENTIATION_GATE.md` (framework prepared, no ideas populated).
- **Remaining product gaps**: none implementable. All remaining product-level items are founder decisions (LIST 3 of the register): guest-type split occupancy semantics, booking alterations, pre-approval, special offers, review report/moderation policy, length-of-stay discounts, smart pricing, multi-currency, KYC-ML architecture, Paymob-vs-Stripe processor choice.
- **Founder decisions**: unchanged in nature from SECTION 13/14 — the register records them under LIST 3; none were decided by engineering.
- **Non-product release blockers**: unchanged — see SECTION 14 (real collection account, AWS storage config incl. `S3_PAYMENT_PROOF_BUCKET`, legal entity + CBE/PDPL counsel, processor decision, OTP verification, mobile P0s + ADR-016, `ENVIRONMENT=production`, prod domain/backups/Sentry). These are deliberately excluded from the product benchmark.
- **LEGAL/ACCOUNTING REVIEW ITEM**: the closure pass produced no new technical evidence affecting payment flow, money custody, KYC processing, personal data, hosting/transfer, marketplace role, or invoicing beyond what SECTION 12–14 already records. Review search and the availability calendar introduce no regulated-data change.
- **Benchmark verification this pass**: 1160 backend tests / 80.60% coverage; frontend typecheck + lint + 12 Vitest + production build green; OpenAPI regenerated with the new `q` param (no drift); mobile unchanged.
- **Acceptance package (2026-09-20)**: `docs/release/FOUNDER_DECISION_REGISTER.md` (FD-01..FD-16 + deferred items + ADR-016 numbering collision), `docs/release/FOUNDER_WEB_ACCEPTANCE_REGISTER.md` (all consumer/host/admin surfaces + blank observation register), `StayOS_Technical_Release_Review_Master_2026-09-20.xlsx` (20 sheets), `StayOS_Legal_Accounting_Regulatory_Readiness_Egypt_2026-09-20_v2.pdf` (founder's bilingual dossier preserved). Mobile gate restated: web founder acceptance + relevant FD resolutions + mobile requirements freeze — not yet met.

---

## EVIDENCE NOTES & KNOWN UNKNOWNS

- Live verification this session: `/health` ok, `/docs` 200, preview 302, `/kyc/initiate` 503 (unconfigured storage), `image/gif` → 422, Railway deployments for `3129415` SUCCESS on all 3 services.
- Railway variable **values** are never visible to tooling — all configuration claims about values are structural (existence/emptiness verified in earlier session for AWS vars; others unknown).
- `ENVIRONMENT` value on Railway is not directly readable; dev-token reachability implies `development`/`staging`.
- Vercel production domain, Firebase console project, Google Cloud project, Paymob/Akedly/Twilio/Meta dashboards, store listings, signing state, AWS account state: **UNKNOWN / NEEDS FOUNDER INPUT** — not evidenced in repo.
- This document does not assert any PR lifecycle state.
