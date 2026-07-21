# ENGINEERING_MASTER_PLAN.md

**Status**: ACTIVE — Engineering Mode Entry Document  
**Scope**: MVP v1 (65 SP) as defined in [docs/MVP_SLICE.md](MVP_SLICE.md)  
**ADR basis**: ADR-001 through ADR-015 in [docs/architecture/adr/](architecture/adr/)  
**Last updated**: 2026-07-13

This document is the single implementation contract for StayOS Phase 1 engineering. Every decision here derives from an approved ADR or MVP_SLICE.md. Nothing in this document may be changed without a corresponding entry in DECISION_LOG.md.

---

## 1. Final Repository Tree

```
stayos/
├── src/                               # FastAPI backend (Python 3.11)
│   └── app/
│       ├── __init__.py
│       ├── main.py                    # App factory, router registration
│       ├── config.py                  # Settings via pydantic-settings
│       ├── database.py                # SQLAlchemy async engine + session
│       ├── celery_app.py              # Celery app factory + queue definitions
│       ├── shared/
│       │   ├── __init__.py
│       │   ├── models.py              # SQLAlchemy declarative base
│       │   ├── schemas.py             # Pydantic base + pagination response
│       │   ├── exceptions.py          # StayOS exception hierarchy
│       │   ├── middleware.py          # CORS, rate limit (Redis sliding window)
│       │   └── outbox.py             # write_event() — Transactional Outbox
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── models.py              # User, KYCRecord
│       │   ├── schemas.py             # OTP, KYC, profile Pydantic models
│       │   ├── router.py              # /auth/* endpoints
│       │   ├── service.py             # Business logic
│       │   ├── dependencies.py        # get_current_user(), require_role()
│       │   ├── clients/
│       │   │   ├── __init__.py
│       │   │   ├── twilio.py          # Twilio Verify wrapper
│       │   │   ├── firebase.py        # Firebase Admin SDK wrapper
│       │   │   └── s3_kyc.py          # KYC bucket pre-signed URL generator
│       │   └── tests/
│       │       ├── __init__.py
│       │       ├── conftest.py
│       │       ├── test_otp.py
│       │       ├── test_kyc.py
│       │       └── test_dependencies.py
│       ├── pms/
│       │   ├── __init__.py
│       │   ├── models.py              # Unit, UnitListing, CalendarRule
│       │   ├── schemas.py
│       │   ├── router.py              # /listings/* endpoints
│       │   ├── service.py
│       │   ├── search.py              # PostGIS + pg_trgm query builders
│       │   ├── clients/
│       │   │   ├── __init__.py
│       │   │   └── s3_listings.py     # Listings bucket pre-signed URL generator
│       │   └── tests/
│       │       ├── __init__.py
│       │       ├── conftest.py
│       │       ├── test_unit_crud.py
│       │       ├── test_search.py
│       │       └── test_calendar.py
│       ├── reservation/
│       │   ├── __init__.py
│       │   ├── models.py              # Reservation, PaymentIntent
│       │   ├── schemas.py
│       │   ├── router.py              # /reservations/* endpoints
│       │   ├── service.py
│       │   ├── calendar_lock.py       # SELECT FOR UPDATE NOWAIT logic
│       │   └── tests/
│       │       ├── __init__.py
│       │       ├── conftest.py
│       │       ├── test_booking.py
│       │       ├── test_calendar_lock.py
│       │       └── test_cancellation.py
│       ├── finance/
│       │   ├── __init__.py
│       │   ├── models.py              # EscrowAccount, PayoutInstruction, SimpleLedger
│       │   ├── schemas.py
│       │   ├── router.py              # /finance/* endpoints + webhook receivers
│       │   ├── service.py
│       │   ├── tasks.py               # Celery: escrow_release, payout_dispatch
│       │   ├── clients/
│       │   │   ├── __init__.py
│       │   │   └── paymob.py          # Paymob API wrapper
│       │   └── tests/
│       │       ├── __init__.py
│       │       ├── conftest.py
│       │       ├── test_escrow.py
│       │       ├── test_paymob_webhook.py
│       │       └── test_payout.py
│       └── notify/
│           ├── __init__.py
│           ├── tasks.py               # Celery: dispatch_whatsapp()
│           ├── templates.py           # WhatsApp template IDs + payload builders
│           ├── clients/
│           │   ├── __init__.py
│           │   └── whatsapp.py        # Meta Cloud API wrapper
│           └── tests/
│               ├── __init__.py
│               └── test_whatsapp.py
│
├── alembic/
│   ├── env.py                         # Async engine, schema discovery
│   ├── script.py.mako
│   └── versions/
│       ├── 001_create_schemas.py      # CREATE SCHEMA auth, pms, reservation, finance, notify, outbox
│       ├── 002_auth_tables.py         # users, kyc_records, enums
│       ├── 003_pms_tables.py          # units, unit_listings, calendar_rules; PostGIS + pg_trgm + GIN indexes
│       ├── 004_reservation_tables.py  # reservations, payment_intents; GIST exclusion constraint
│       ├── 005_finance_tables.py      # escrow_accounts, simple_ledger, payout_instructions
│       └── 006_outbox_table.py        # outbox_events; partial index on unprocessed
│
├── apps/
│   └── web/                           # Next.js 14 (App Router, TypeScript)
│       ├── app/
│       │   ├── layout.tsx             # Root layout (no locale — redirect to /ar)
│       │   ├── [locale]/              # ar | en
│       │   │   ├── layout.tsx         # dir="rtl"/"ltr", font, providers
│       │   │   ├── page.tsx           # Home → redirects to /[locale]/search
│       │   │   ├── search/
│       │   │   │   └── page.tsx       # Primary guest landing — map + list
│       │   │   ├── listings/
│       │   │   │   └── [id]/
│       │   │   │       └── page.tsx   # Listing detail (ISR, revalidate=60)
│       │   │   ├── auth/
│       │   │   │   ├── login/
│       │   │   │   │   └── page.tsx   # Phone entry + OTP
│       │   │   │   └── kyc/
│       │   │   │       └── page.tsx   # KYC document upload
│       │   │   ├── bookings/
│       │   │   │   ├── checkout/
│       │   │   │   │   └── page.tsx   # Checkout (payment method + Paymob iframe)
│       │   │   │   ├── confirmation/
│       │   │   │   │   └── page.tsx   # Booking confirmed
│       │   │   │   └── page.tsx       # Guest booking history
│       │   │   └── host/
│       │   │       ├── listings/
│       │   │       │   ├── new/
│       │   │       │   │   └── page.tsx  # Create listing wizard
│       │   │       │   └── [id]/
│       │   │       │       └── page.tsx  # Edit listing
│       │   │       └── reservations/
│       │   │           └── page.tsx   # Host booking dashboard
│       │   └── api/
│       │       └── proxy/
│       │           └── [...path]/
│       │               └── route.ts   # BFF: forwards to FastAPI with JWT
│       ├── components/
│       │   ├── ui/                    # shadcn/ui primitives (Button, Input, etc.)
│       │   ├── auth/
│       │   │   ├── OtpForm.tsx
│       │   │   └── KycUpload.tsx
│       │   ├── listing/
│       │   │   ├── ListingForm.tsx    # Multi-step create/edit
│       │   │   ├── PhotoUpload.tsx    # Pre-signed S3 direct upload
│       │   │   └── CalendarBlock.tsx  # Date range picker for blocking
│       │   ├── search/
│       │   │   ├── SearchMap.tsx      # Google Maps + pins
│       │   │   ├── ListingCard.tsx    # Search result card
│       │   │   ├── FilterPanel.tsx    # Date, price, type, cultural tags
│       │   │   └── DateRangePicker.tsx
│       │   ├── booking/
│       │   │   ├── CheckoutForm.tsx   # Guests, payment method
│       │   │   └── PaymobIframe.tsx   # Embedded Paymob payment iframe
│       │   └── layout/
│       │       ├── Header.tsx         # Nav, locale switcher, auth state
│       │       └── Footer.tsx
│       ├── lib/
│       │   ├── api.ts                 # Typed fetch client → Next.js /api/proxy
│       │   ├── firebase.ts            # Firebase client SDK init + auth helpers
│       │   ├── i18n.ts                # Locale detection, message loading
│       │   └── utils.ts               # cn(), formatDate(), formatMoney()
│       ├── messages/
│       │   ├── ar.json                # Arabic UI strings
│       │   └── en.json                # English UI strings
│       ├── public/
│       │   └── fonts/                 # Cairo + Tajawal woff2 (self-hosted, no Google Fonts CDN)
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   ├── terraform/
│   │   ├── main.tf                    # Provider, backend (S3 state), workspace
│   │   ├── vpc.tf                     # VPC, 2 public + 2 private subnets, NAT
│   │   ├── rds.tf                     # RDS PostgreSQL 16, single-AZ, parameter group
│   │   ├── elasticache.tf             # Redis 7, single node, subnet group
│   │   ├── ecs.tf                     # ECS cluster, task definitions, services
│   │   ├── alb.tf                     # ALB, HTTPS listener, ACM cert, target groups
│   │   ├── s3.tf                      # Listings bucket + KYC bucket, policies
│   │   ├── ecr.tf                     # ECR repository
│   │   ├── iam.tf                     # ECS task role, ECR push role, S3 access
│   │   ├── secrets.tf                 # Secrets Manager resource blocks (no values)
│   │   └── variables.tf               # env, region, project_name, db_password (sensitive)
│   └── docker/
│       └── api/
│           └── Dockerfile             # Single image for API + Celery worker
│
├── .github/
│   └── workflows/
│       ├── ci.yml                     # PR check: lint + typecheck + security + test
│       ├── deploy-staging.yml         # On push to develop: build → ECR → ECS staging
│       └── deploy-prod.yml            # On push to main: build → ECR → ECS prod + Vercel prod
│
├── docker-compose.yml                 # Local dev: postgres + redis + api + worker
├── docker-compose.test.yml            # CI test: postgres + redis only
├── pyproject.toml                     # Python project config, ruff, mypy, pytest
├── requirements.txt                   # Pinned production dependencies
├── requirements-dev.txt               # Dev + test dependencies
├── .env.example                       # All env var names, no values
├── .env.test                          # Test env (localhost DB, fake credentials)
├── alembic.ini                        # Alembic config (points to src/app/config.py)
└── docs/                              # All documentation (closed — Engineering Mode)
```

---

## 2. Source Code Layout Rules

**Backend root**: `src/app/` — all Python application code lives here. Import as `from app.auth.service import ...`.

**Module isolation rule** (ADR-013): A module may only import from:
- Its own subpackage: `from app.auth.models import User`
- `app.shared`: `from app.shared.exceptions import NotFoundError`
- `app.config`: `from app.config import settings`
- `app.database`: `from app.database import get_session`

A module must never import directly from a sibling module:

```python
# FORBIDDEN — reservation cannot import from pms directly
from app.pms.models import Unit

# CORRECT — use the service interface via dependency injection,
# or pass IDs and let each module own its own queries
```

Cross-module data is passed as scalar IDs (UUID). Cross-module coordination happens through domain events (Outbox) or FastAPI route dependencies.

**Test co-location**: Tests live inside each module under `tests/`. A test for `app/auth/service.py` lives at `app/auth/tests/test_service.py`. The `conftest.py` at `app/auth/tests/conftest.py` contains module-specific fixtures.

**Frontend root**: `apps/web/` — Next.js project. All imports use `@/` path alias mapped to `apps/web/`.

---

## 3. Backend Package Structure

### 3.1 `app/main.py` — App Factory

```
Responsibilities:
  - Create FastAPI() instance
  - Mount all routers with /api/v1 prefix
  - Register global exception handlers (StayOSException → RFC 7807)
  - Register middleware (CORS, rate limit, request ID)
  - Health endpoint: GET /health → {"status": "ok", "db": "ok", "redis": "ok"}

Does NOT contain:
  - Any business logic
  - Any database queries
  - Any configuration values (reads from config.py only)
```

### 3.2 `app/config.py` — Settings

```
Source: AWS Secrets Manager in production; .env file in development
Library: pydantic-settings (BaseSettings)
Loading: settings = Settings() — singleton, imported everywhere

Required settings (all must be present or app refuses to start):
  DATABASE_URL, REDIS_URL, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID, PAYMOB_API_KEY, PAYMOB_HMAC_SECRET,
  META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID, S3_LISTINGS_BUCKET,
  S3_KYC_BUCKET, AWS_REGION, SENTRY_DSN, ENVIRONMENT, CORS_ORIGINS

Optional (with defaults):
  LOG_LEVEL=INFO, OTP_TTL_SECONDS=300, OTP_MAX_ATTEMPTS=3,
  OTP_RATE_LIMIT_WINDOW=900, CALENDAR_LOCK_TIMEOUT_MS=5000
```

### 3.3 `app/database.py` — Database Session

```
Engine: SQLAlchemy 2.0 async (asyncpg driver)
Session factory: async_sessionmaker with expire_on_commit=False
FastAPI dependency: get_session() → AsyncSession (yields, commits or rolls back)
Connection pool: pool_size=10, max_overflow=20 (pre-PgBouncer values for MVP)
```

### 3.4 `app/celery_app.py` — Celery Factory

```
Broker: REDIS_URL (database 1 — separate from OTP cache on database 0)
Result backend: REDIS_URL (database 2)
Queues:
  - "high"    → payment webhooks, escrow create
  - "default" → notifications, outbox dispatch
  - "low"     → reporting, batch jobs
Task autodiscovery: ['app.auth.tasks', 'app.finance.tasks', 'app.notify.tasks']
Serializer: json (never pickle)
Task acks_late: True (re-queue on worker crash before acknowledgement)
```

### 3.5 `app/shared/outbox.py` — Outbox Writer

```python
# Signature (not implementation — do not write application code)
async def write_event(
    session: AsyncSession,     # Must be the SAME session as the state change
    aggregate_type: str,       # e.g. "Reservation"
    aggregate_id: UUID,
    event_type: str,           # e.g. "booking.payment_confirmed"
    payload: dict,
) -> None:
    # Inserts one row into outbox.outbox_events within the caller's transaction.
    # Called BEFORE session.commit() — inside the same transaction block.
```

### 3.6 `app/auth/dependencies.py` — RBAC Enforcement

```python
# Signature (not implementation)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    # 1. Verify Firebase ID token via firebase_admin.auth.verify_id_token()
    # 2. Extract user_id from decoded["user_id"] custom claim
    # 3. Load User from DB; raise 401 if not found or status != ACTIVE

def require_role(*roles: str) -> Callable:
    # Returns a FastAPI Depends that checks current_user.role in roles
    # Raises 403 if role not in allowed set
```

---

## 4. Frontend App Structure

### 4.1 Locale Routing

Next.js i18n is configured via `next.config.ts`:
- Supported locales: `["ar", "en"]`
- Default locale: `ar`
- Root `/` redirects to `/ar`
- All pages exist under `/app/[locale]/`
- `dir` attribute set in `/app/[locale]/layout.tsx` based on locale param

### 4.2 BFF Proxy (`/app/api/proxy/[...path]/route.ts`)

All client-side API calls go through this proxy. It:
1. Reads the Firebase ID token from `httpOnly` cookie (set at login)
2. Adds `Authorization: Bearer <token>` header
3. Forwards the request to `NEXT_PUBLIC_API_URL` (FastAPI backend)
4. Returns the response unchanged

The browser never has direct access to the FastAPI URL. This is the only security-relevant constraint in the frontend.

### 4.3 Component Rules

- All user-facing text comes from `messages/ar.json` or `messages/en.json` — no hardcoded Arabic or English strings in components
- Arabic (RTL) is the default; `dir` is set at layout level, never per-component
- Currency display: always EGP (ج.م) with comma-separated thousands, e.g. `٣٬٥٠٠ ج.م`
- Date display: Gregorian calendar formatted for locale (`ar-EG` or `en-EG`)
- No `console.log` in production code (ESLint rule enforced in CI)

### 4.4 State Management

- Server state: React Server Components fetch directly from FastAPI via the BFF; no client-side data fetching library in MVP v1
- Client state: React `useState` / `useContext` only — no Redux, no Zustand in MVP v1
- Auth state: Firebase `onAuthStateChanged` listener in a client Provider component; token stored in `httpOnly` cookie via `/api/auth/session` Next.js route

### 4.5 Font Loading

Cairo and Tajawal font files are self-hosted in `public/fonts/`. No external font CDN requests. Font files are referenced in `tailwind.config.ts` and preloaded in the root `layout.tsx` with `<link rel="preload">`.

---

## 5. Infrastructure Folders

```
infra/
├── terraform/          # Declarative AWS infrastructure
│   ├── main.tf         # terraform required_providers, backend, workspace
│   ├── vpc.tf          # aws_vpc, subnets, internet_gateway, nat_gateway, route tables
│   ├── rds.tf          # aws_db_instance, aws_db_parameter_group, aws_db_subnet_group
│   ├── elasticache.tf  # aws_elasticache_cluster, subnet group, security group
│   ├── ecs.tf          # aws_ecs_cluster, task definitions (api + worker), services, autoscaling
│   ├── alb.tf          # aws_lb, listeners, target groups, aws_acm_certificate
│   ├── s3.tf           # aws_s3_bucket (listings + kyc), bucket policies, CORS rules
│   ├── ecr.tf          # aws_ecr_repository, lifecycle policy
│   ├── iam.tf          # ECS task execution role, ECS task role, S3 access policies
│   ├── secrets.tf      # aws_secretsmanager_secret resource blocks (values set manually)
│   └── variables.tf    # Input variables (env, region, project_name, db_password)
└── docker/
    └── api/
        └── Dockerfile  # Single image for API service and Celery worker
```

**Terraform state**: Stored in S3 bucket `stayos-terraform-state` (created manually before `terraform init`). State locking via DynamoDB table `stayos-terraform-locks`. Both created manually — not managed by Terraform to avoid circular dependency.

**Workspace per environment**: `terraform workspace select staging` / `terraform workspace select prod`. Variables differ by workspace via `terraform.tfvars` files (not committed; stored in AWS SSM for CI retrieval).

---

## 6. Docker Layout

### 6.1 `infra/docker/api/Dockerfile`

```
Base image:  python:3.11-slim
Build stage: Install gcc, libpq-dev; pip install -r requirements.txt
Run stage:   Copy src/; set PYTHONPATH=/; no root user (USER nobody)
Port:        8000 (API) — Celery worker uses same image with different CMD
CMD:         ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
Worker CMD:  ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "-Q", "high,default,low", "--concurrency=4"]
```

One Dockerfile, two ECS task definitions. The task definition's `command` override switches between API and worker.

### 6.2 `docker-compose.yml` (Local Development)

```yaml
# Services defined:
#   postgres  — postgres:16 image, with postgis extension enabled via SQL init script
#   redis     — redis:7-alpine
#   api       — builds from infra/docker/api/Dockerfile, mounts src/ as volume
#   worker    — same image as api, CMD override to celery worker
#
# Volumes: postgres_data, redis_data
# Network: stayos_dev (bridge)
# Env: loads from .env file at project root
```

### 6.3 `docker-compose.test.yml` (CI)

```yaml
# Services defined:
#   postgres  — postgres:16 + postgis extension; no persistent volume
#   redis     — redis:7-alpine; no persistent volume
#
# Used by CI: docker-compose -f docker-compose.test.yml up -d
# Then: pytest runs against TEST_DATABASE_URL pointing to this postgres
# Teardown: docker-compose -f docker-compose.test.yml down -v
```

---

## 7. GitHub Actions Layout

### 7.1 `.github/workflows/ci.yml` — PR Validation

```
Trigger:     pull_request (any branch → develop or main)
Runner:      ubuntu-latest
Services:    postgres:16, redis:7 (for integration tests)

Steps (in order):
  1. checkout
  2. setup-python 3.11
  3. cache pip (key: requirements.txt hash)
  4. pip install -r requirements-dev.txt
  5. ruff check src/           — lint; fails on any error
  6. mypy src/                 — type check; fails on any error
  7. bandit -r src/ -ll        — security; fails on MEDIUM+ findings
  8. safety check              — dependency CVE scan; fails on known vulns
  9. docker-compose -f docker-compose.test.yml up -d
  10. alembic upgrade head      — apply all migrations to test DB
  11. pytest src/ --cov=app --cov-report=term-missing --cov-fail-under=80
  12. docker-compose -f docker-compose.test.yml down -v
  13. (frontend) setup-node 20, pnpm install
  14. pnpm --filter web lint    — ESLint; fails on errors
  15. pnpm --filter web type-check — tsc --noEmit; fails on errors
  16. pnpm --filter web build   — next build; fails if build fails

Artifacts: coverage report uploaded to PR comment
Blocking: All steps must pass. No exceptions. No --no-verify bypasses.
```

### 7.2 `.github/workflows/deploy-staging.yml` — Staging Deploy

```
Trigger:     push to develop branch (after PR merge)
Runner:      ubuntu-latest
Needs:       ci.yml passes (enforced via branch protection)

Steps:
  1. checkout
  2. Configure AWS credentials (OIDC — no long-lived keys)
  3. Login to ECR
  4. Build Docker image: stayos-api:sha-{GITHUB_SHA}
  5. Push to ECR
  6. Run Alembic migrations as ECS one-off task (before new service tasks)
  7. Update ECS service (api) to new image — rolling update
  8. Update ECS service (worker) to new image — rolling update
  9. Wait for ECS services stable (timeout 5 minutes)
  10. Smoke test: curl https://api-staging.stayos.com/health → 200
  11. Deploy Next.js to Vercel preview (via vercel --env staging)
```

### 7.3 `.github/workflows/deploy-prod.yml` — Production Deploy

```
Trigger:     push to main branch (from release PR merge)
Runner:      ubuntu-latest
Requires:    Manual approval gate (GitHub Environment: "production")

Steps:
  1-8: Same as staging but targeting prod ECS cluster and prod ECR tag
  9. Alembic upgrade head on prod DB (one-off ECS task)
  10. ECS rolling update (api + worker)
  11. Wait for stable
  12. Smoke test: curl https://api.stayos.com/health → 200
  13. Deploy Next.js to Vercel production: vercel --prod
  14. Create GitHub Release with tag v{SEMVER}
  15. Notify Sentry of new release: sentry-cli releases new
```

---

## 8. Database Migration Order

Migrations are run in numbered order. The number prefix enforces order. A migration, once merged to `develop`, is immutable — new changes require a new migration file.

| File | Creates | Depends On |
|------|---------|-----------|
| `001_create_schemas.py` | `CREATE SCHEMA` for auth, pms, reservation, finance, notify, outbox; `CREATE EXTENSION postgis CASCADE`; `CREATE EXTENSION pg_trgm`; `CREATE EXTENSION uuid-ossp` | Nothing |
| `002_auth_tables.py` | `user_role` enum, `user_status` enum, `kyc_document_type` enum, `kyc_status` enum; `auth.users`; `auth.kyc_records` with FK; all auth indexes | 001 |
| `003_pms_tables.py` | `property_type` enum, `unit_status` enum, `calendar_status` enum; `pms.units` with GIST spatial index; `pms.unit_listings` with GIN full-text + GIN array indexes + search_vector trigger; `pms.calendar_rules` with GIST exclusion constraint | 001, 002 |
| `004_reservation_tables.py` | `reservation_status` enum, `payment_provider` enum, `payment_status` enum; `reservation.reservations`; `reservation.payment_intents`; all reservation indexes | 001, 002, 003 |
| `005_finance_tables.py` | `escrow_status` enum, `ledger_account_type` enum; `finance.escrow_accounts`; `finance.simple_ledger` (not full double-entry — MVP v1 simplification); `finance.payout_instructions`; partial index on HELD escrows | 001, 004 |
| `006_outbox_table.py` | `outbox.outbox_events`; partial index on unprocessed rows | 001 |

**Migration rules**:
- Never edit a committed migration. Add a new one.
- Every migration must be reversible (`downgrade()` must restore prior state).
- Migrations that add a NOT NULL column without a default are forbidden on a live table — always add nullable first, backfill, then add NOT NULL in a subsequent migration.
- Run `alembic upgrade head` before starting the API server in every environment.

---

## 9. API Implementation Order

Within each module, implement in this order. Subsequent work depends on what precedes it.

### Sprint 0 (Infra — no business logic)
1. `GET /health` — returns `{"status": "ok"}` — first endpoint, proves the stack works

### Sprint 1 — Auth (implement in this order)
2. `POST /api/v1/auth/otp/send` — Twilio Verify send
3. `POST /api/v1/auth/otp/verify` — code check + Firebase custom token
4. `GET /api/v1/auth/me` — requires JWT middleware (implement middleware first)
5. `PATCH /api/v1/auth/me` — profile update
6. `POST /api/v1/auth/kyc/upload-url` — pre-signed S3 URL
7. `GET /api/v1/auth/kyc/status` — KYC status for current user
8. `PATCH /api/v1/admin/users/{id}/kyc` — admin approve/reject

### Sprint 1 — PMS (implement in this order, parallel with Auth)
9. `POST /api/v1/listings` — create unit (requires auth middleware from step 4)
10. `GET /api/v1/listings/{id}` — public listing detail
11. `PATCH /api/v1/listings/{id}` — update listing
12. `POST /api/v1/listings/{id}/photos/upload-url` — pre-signed S3 photo URL
13. `PUT /api/v1/listings/{id}/calendar` — block/unblock dates
14. `PUT /api/v1/listings/{id}/pricing` — update base price + min nights
15. `PATCH /api/v1/listings/{id}/status` — admin suspend/activate

### Sprint 2 — Search (implement in this order)
16. `GET /api/v1/listings` — spatial search + text + filters (PostGIS + pg_trgm)
17. `GET /api/v1/listings/{id}/availability` — date range availability check

### Sprint 2 — Reservation (implement in this order, parallel with Search)
18. `POST /api/v1/reservations` — booking initiation (calendar lock + Paymob order)
19. `GET /api/v1/reservations/{id}` — reservation detail
20. `GET /api/v1/reservations` — user reservation list (guest or host)
21. `POST /api/v1/reservations/{id}/cancel` — cancellation + refund routing
22. `POST /api/v1/reservations/{id}/check-in` — record check-in
23. `POST /api/v1/reservations/{id}/check-out` — record check-out + emit event

### Sprint 3 — Finance + Webhooks (implement in this order)
24. `POST /api/v1/finance/webhooks/paymob` — HMAC verify + status processing (implement first — booking loop depends on it)
25. `POST /api/v1/finance/admin/payout-run` — manual payout trigger
26. `GET /api/v1/finance/host/balance` — host current balance
27. `GET /api/v1/finance/host/payouts` — payout history

### Sprint 3 — Admin (implement alongside Finance)
28. `PATCH /api/v1/admin/users/{id}` — ban/suspend user

---

## 10. Sprint-by-Sprint File Creation Order

### Sprint 0 (2 weeks) — Infrastructure + Scaffold

**Week 1 — Repository scaffold and AWS:**

Backend files created (in order):
```
pyproject.toml                     ← Python project definition first
requirements.txt                   ← Pinned deps
requirements-dev.txt               ← Dev/test deps
.env.example                       ← All env var names, empty values
.env.test                          ← Test env with localhost URLs
alembic.ini                        ← Points to app.config.settings.DATABASE_URL
src/app/__init__.py
src/app/config.py                  ← Settings — required before any other app file
src/app/database.py                ← Engine — required before models
src/app/celery_app.py              ← Celery factory
src/app/main.py                    ← Health endpoint + router stubs
src/app/shared/__init__.py
src/app/shared/models.py           ← Base — required before any model file
src/app/shared/schemas.py          ← BaseResponse + PaginatedResponse
src/app/shared/exceptions.py       ← Exception hierarchy
src/app/shared/middleware.py       ← CORS + rate limit middleware
src/app/shared/outbox.py           ← write_event() function
alembic/env.py
alembic/script.py.mako
alembic/versions/001_create_schemas.py
infra/docker/api/Dockerfile
docker-compose.yml
docker-compose.test.yml
.github/workflows/ci.yml
.github/workflows/deploy-staging.yml
.github/workflows/deploy-prod.yml
```

Frontend files created:
```
apps/web/package.json
apps/web/tsconfig.json
apps/web/next.config.ts
apps/web/tailwind.config.ts
apps/web/.eslintrc.json
apps/web/app/layout.tsx            ← Root layout (locale redirect)
apps/web/app/[locale]/layout.tsx   ← Locale layout with dir + font
apps/web/lib/utils.ts              ← cn(), formatMoney(), formatDate()
apps/web/messages/ar.json          ← Empty object initially (filled per feature)
apps/web/messages/en.json
```

Infrastructure:
```
infra/terraform/variables.tf       ← Variable declarations (no values)
infra/terraform/main.tf            ← Provider + backend + workspace
infra/terraform/vpc.tf
infra/terraform/rds.tf
infra/terraform/elasticache.tf
infra/terraform/ecs.tf
infra/terraform/alb.tf
infra/terraform/s3.tf
infra/terraform/ecr.tf
infra/terraform/iam.tf
infra/terraform/secrets.tf
```

**Week 2 — CI/CD, AWS provisioning, first deployment:**
- Run `terraform apply` for staging environment
- Push scaffold to `develop` branch; CI runs green
- `GET /health` deploys to staging and returns 200

---

### Sprint 1 (3 weeks) — Auth + Listings

**Week 1 — Auth backend:**
```
alembic/versions/002_auth_tables.py
src/app/auth/__init__.py
src/app/auth/models.py
src/app/auth/schemas.py
src/app/auth/clients/__init__.py
src/app/auth/clients/twilio.py
src/app/auth/clients/firebase.py
src/app/auth/clients/s3_kyc.py
src/app/auth/service.py
src/app/auth/dependencies.py       ← get_current_user(), require_role()
src/app/auth/router.py
src/app/auth/tests/__init__.py
src/app/auth/tests/conftest.py
src/app/auth/tests/test_otp.py
src/app/auth/tests/test_kyc.py
src/app/auth/tests/test_dependencies.py
```

**Week 1 — PMS backend (parallel with Auth, different engineer):**
```
alembic/versions/003_pms_tables.py
src/app/pms/__init__.py
src/app/pms/models.py
src/app/pms/schemas.py
src/app/pms/clients/__init__.py
src/app/pms/clients/s3_listings.py
src/app/pms/search.py
src/app/pms/service.py
src/app/pms/router.py
src/app/pms/tests/__init__.py
src/app/pms/tests/conftest.py
src/app/pms/tests/test_unit_crud.py
src/app/pms/tests/test_calendar.py
src/app/pms/tests/test_search.py
```

**Week 2–3 — Frontend (begins after auth backend OTP endpoint is deployed to staging):**
```
apps/web/lib/firebase.ts
apps/web/lib/api.ts
apps/web/app/api/proxy/[...path]/route.ts
apps/web/components/ui/Button.tsx   ← shadcn/ui
apps/web/components/ui/Input.tsx
apps/web/components/ui/Card.tsx
apps/web/components/auth/OtpForm.tsx
apps/web/components/auth/KycUpload.tsx
apps/web/app/[locale]/auth/login/page.tsx
apps/web/app/[locale]/auth/kyc/page.tsx
apps/web/components/layout/Header.tsx
apps/web/components/layout/Footer.tsx
apps/web/components/listing/ListingForm.tsx
apps/web/components/listing/PhotoUpload.tsx
apps/web/components/listing/CalendarBlock.tsx
apps/web/app/[locale]/host/listings/new/page.tsx
apps/web/app/[locale]/host/listings/[id]/page.tsx
```

---

### Sprint 2 (3 weeks) — Search + Booking

**Week 1 — Search backend + Reservation backend (parallel):**
```
# Reservation (depends on pms models being available)
alembic/versions/004_reservation_tables.py
src/app/reservation/__init__.py
src/app/reservation/models.py
src/app/reservation/schemas.py
src/app/reservation/calendar_lock.py
src/app/reservation/service.py
src/app/reservation/router.py
src/app/reservation/tests/__init__.py
src/app/reservation/tests/conftest.py
src/app/reservation/tests/test_booking.py
src/app/reservation/tests/test_calendar_lock.py
src/app/reservation/tests/test_cancellation.py
```

**Week 2–3 — Frontend:**
```
apps/web/components/search/DateRangePicker.tsx
apps/web/components/search/FilterPanel.tsx
apps/web/components/search/ListingCard.tsx
apps/web/components/search/SearchMap.tsx     ← Google Maps integration
apps/web/app/[locale]/search/page.tsx        ← Primary landing page
apps/web/app/[locale]/listings/[id]/page.tsx ← ISR listing detail
apps/web/components/booking/CheckoutForm.tsx
apps/web/app/[locale]/bookings/checkout/page.tsx
apps/web/app/[locale]/bookings/page.tsx      ← Guest history
apps/web/app/[locale]/host/reservations/page.tsx
```

---

### Sprint 3 (2 weeks) — Payments + Notifications + Launch

**Week 1 — Finance + Notify backend:**
```
alembic/versions/005_finance_tables.py
alembic/versions/006_outbox_table.py
src/app/finance/__init__.py
src/app/finance/models.py
src/app/finance/schemas.py
src/app/finance/clients/__init__.py
src/app/finance/clients/paymob.py
src/app/finance/service.py
src/app/finance/tasks.py            ← escrow_release Celery task
src/app/finance/router.py           ← webhooks + host balance endpoints
src/app/finance/tests/__init__.py
src/app/finance/tests/conftest.py
src/app/finance/tests/test_escrow.py
src/app/finance/tests/test_paymob_webhook.py
src/app/finance/tests/test_payout.py
src/app/notify/__init__.py
src/app/notify/clients/__init__.py
src/app/notify/clients/whatsapp.py
src/app/notify/templates.py
src/app/notify/tasks.py
src/app/notify/tests/__init__.py
src/app/notify/tests/test_whatsapp.py
```

**Week 2 — Frontend + end-to-end smoke test:**
```
apps/web/components/booking/PaymobIframe.tsx
apps/web/app/[locale]/bookings/checkout/page.tsx  ← updated with Paymob iframe
apps/web/app/[locale]/bookings/confirmation/page.tsx
```

---

## 11. Exact Dependencies Between Sprints

```
Phase 0 gate clearance
    │
    ▼
Sprint 0: Infrastructure
    │ BLOCKS
    ├── Sprint 1 Auth backend (needs: database.py, shared/models.py, 001 migration)
    ├── Sprint 1 PMS backend (needs: database.py, shared/models.py, 001 migration)
    └── Sprint 1 Frontend (needs: Vercel deployed, API /health live, Firebase project)
    │
    ▼
Sprint 1: Auth + Listings
    │ BLOCKS
    ├── Sprint 2 Search (needs: pms/models.py + 003 migration)
    ├── Sprint 2 Booking (needs: auth/dependencies.py for JWT; pms/models.py for Unit FK)
    └── Sprint 2 Frontend Search page (needs: auth/router.py login + pms/router.py listings)
    │
    ▼
Sprint 2: Search + Booking
    │ BLOCKS
    ├── Sprint 3 Finance (needs: reservation/models.py + 004 migration for FK)
    ├── Sprint 3 Webhooks (needs: reservation/service.py to update status on payment)
    └── Sprint 3 Frontend Checkout (needs: reservation POST endpoint + Paymob client)
    │
    ▼
Sprint 3: Payments + Notifications
    │
    ▼
First live booking in staging
```

**Hard cross-sprint dependencies** (cannot be reordered):
- `app/shared/models.py` must exist before any `models.py` in any module
- `app/config.py` must exist before `app/database.py`
- `app/database.py` must exist before any Alembic migration runs
- Migration `001` must run before `002`, `002` before `003`, etc.
- `app/auth/dependencies.py` must exist before any protected endpoint in any module
- Paymob webhook endpoint must exist before the booking flow can be tested end-to-end
- WhatsApp templates must be pre-approved by Meta before Sprint 3 notification tasks can send

---

## 12. Files Created First (Before All Others)

These files are the foundation. Nothing works without them. Create in this exact order on Day 1 of Sprint 0.

| Order | File | Why First |
|-------|------|----------|
| 1 | `pyproject.toml` | Defines the Python project; all tool configs live here |
| 2 | `requirements.txt` | Pinned deps; Docker and CI both read this |
| 3 | `.env.example` | Documents all required environment variables |
| 4 | `src/app/config.py` | Settings singleton; everything else imports from it |
| 5 | `src/app/shared/models.py` | SQLAlchemy `Base`; all ORM models inherit from it |
| 6 | `src/app/shared/exceptions.py` | Exception base; error handlers reference it |
| 7 | `src/app/database.py` | Async engine; Alembic `env.py` and all sessions need it |
| 8 | `src/app/main.py` | App factory with health endpoint; proves the stack boots |
| 9 | `alembic/env.py` | Links Alembic to the async engine |
| 10 | `alembic/versions/001_create_schemas.py` | Schemas + extensions; all other migrations depend on it |
| 11 | `infra/docker/api/Dockerfile` | Required for CI build step |
| 12 | `.github/workflows/ci.yml` | First PR must run CI |

---

## 13. Files That Must Never Be Modified After Creation

Once the following files are merged to `develop`, they are immutable. Changes require a new file, not an edit.

| File | Reason |
|------|--------|
| `alembic/versions/001_*.py` through `006_*.py` | Database migrations are append-only; editing a merged migration corrupts state on any instance that has already run it |
| `docs/MVP_SLICE.md` | Implementation contract; changes require DECISION_LOG.md entry; no silent edits |
| `docs/ENGINEERING_MASTER_PLAN.md` | This document; changes require founder decision |
| `docs/architecture/adr/ADR-001-*.md` through `ADR-015-*.md` | Accepted ADRs; supersede with a new ADR, never edit |
| `.env.example` (variable names only) | Removing or renaming a variable name here breaks developer onboarding; add new vars, never remove |
| `src/app/shared/outbox.py` (function signature) | All modules call `write_event()` with this signature; changing it breaks all callers silently |

What "immutable" means: the file may receive spelling corrections via PR, but its semantic content — the decisions, schema, function signature — does not change.

---

## 14. Testing Strategy

### 14.1 Test Pyramid

```
         ┌──────────┐
         │    E2E   │  (Post-MVP v1 — Playwright for critical flows)
         └──────────┘
       ┌─────────────────┐
       │  Integration    │  FastAPI test client + real test DB
       └─────────────────┘
    ┌─────────────────────────┐
    │         Unit            │  Pure functions, service layer with mocked clients
    └─────────────────────────┘
```

### 14.2 Integration Test Pattern (FastAPI)

```python
# Every module's conftest.py follows this pattern
@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        async with AsyncSession(conn) as session:
            yield session
            await session.rollback()  # No data persists between tests
```

Tests use a real PostgreSQL instance (from `docker-compose.test.yml`). No in-memory SQLite. No mocked database.

External service clients (Twilio, Firebase, Paymob, WhatsApp, S3) are mocked via `unittest.mock.AsyncMock` in test fixtures. The client wrapper modules (`src/app/auth/clients/twilio.py`) accept injected clients to enable this.

### 14.3 Coverage Requirements

| Module | Minimum Coverage |
|--------|-----------------|
| `app/auth/` | 85% |
| `app/pms/` | 80% |
| `app/reservation/` | 90% (calendar lock + payment flow are business-critical) |
| `app/finance/` | 85% (webhook handler must have 100% branch coverage) |
| `app/notify/` | 75% (no external call in tests) |
| `app/shared/` | 90% |
| Overall | ≥ 80% |

Coverage below threshold fails CI. `# pragma: no cover` is allowed only for abstract base class stubs and type-only imports. It must be accompanied by a comment explaining why.

### 14.4 Test Naming Convention

```
test_{verb}_{subject}_{condition}.py

Examples:
  test_send_otp_success()
  test_send_otp_rate_limited()
  test_lock_calendar_conflict_raises_error()
  test_paymob_webhook_duplicate_is_noop()
```

### 14.5 Critical Test Cases (Must Exist Before Sprint Completes)

| Sprint | Test | Why Critical |
|--------|------|-------------|
| S1 | `test_otp_rate_limited()` | Prevents SMS flooding; cost control |
| S1 | `test_kyc_required_for_listing()` | Core trust invariant |
| S2 | `test_calendar_lock_prevents_double_booking()` | Core marketplace invariant |
| S2 | `test_lock_times_out_on_concurrent_request()` | Concurrency correctness |
| S3 | `test_paymob_webhook_duplicate_is_noop()` | Idempotency on duplicate delivery |
| S3 | `test_escrow_not_released_before_24h()` | BR-FIN-01 invariant |
| S3 | `test_refund_calculated_correctly_by_policy()` | Revenue integrity |

---

## 15. Branch Strategy

```
main          ← Production. Protected. Only release PRs merge here.
develop       ← Staging. Protected. Feature PRs merge here.
feature/EPC-XX-YYY-description    ← All new work
fix/short-description              ← Bug fixes (branch from develop)
hotfix/short-description           ← Production fixes (branch from main)
```

**Branch naming rule**: Feature branches must reference an epic+story ID from MVP_SLICE.md. Example: `feature/EPC-02-003-firebase-jwt-middleware`. This links every branch to a scoped story.

**Hotfix rule**: Branch from `main`. Merge to `main` first. Immediately cherry-pick or merge to `develop` to keep both branches in sync. Never let `main` diverge from `develop` by more than one hotfix.

**Branch lifetime**: Feature branches are deleted after the PR is merged. No stale branches.

**Branch protection rules (GitHub)**:

| Branch | Requires PR | Required checks | Requires approval | Force push |
|--------|------------|----------------|------------------|-----------|
| `main` | Yes | ci.yml all pass | 1 review | Blocked |
| `develop` | Yes | ci.yml all pass | 0 reviews (solo founder period) | Blocked |

---

## 16. Merge Strategy

**Feature → develop**: Squash merge. One commit per feature branch. Commit message follows `type(scope): description` convention from `docs/standards/commit_conventions.md`. The squashed commit title = the feature's user story title.

**develop → main**: Merge commit (no squash). Preserves the full history of what shipped in each release. The merge commit is the release event.

**Hotfix → main**: Squash merge (single commit describes the fix). Then: `git cherry-pick <sha>` onto `develop` immediately.

**No rebase on shared branches**: `main` and `develop` are never rebased. Rebase is allowed only on local feature branches before the first PR push.

---

## 17. Release Strategy

**Versioning**: Semantic versioning (`MAJOR.MINOR.PATCH`).

| Increment | Trigger |
|-----------|---------|
| PATCH | Bug fix merged to main |
| MINOR | A sprint completes and its features ship to production |
| MAJOR | MVP v1 complete (first live booking milestone) |

**Release process**:
1. Open a PR from `develop` → `main` titled "release: v{SEMVER}"
2. PR description lists all stories shipped (from squash commit titles)
3. CI must pass
4. Founder reviews and merges
5. `deploy-prod.yml` triggers automatically
6. GitHub Release created by the workflow with auto-generated changelog

**No feature flags**: MVP v1 does not use feature flags. A feature is either deployed or not. Feature flags are V1.5 tooling.

**Rollback**: If production deploy fails smoke test, the workflow fails. The prior ECS task definition revision is re-deployed via `aws ecs update-service --task-definition {prior-revision}`. The prior Vercel deployment is re-promoted via `vercel rollback`.

---

## 18. CI/CD Order

Every action in CI must complete in this order. No step runs if a prior step fails.

```
On every PR:
  Lint (ruff)
    → Type check (mypy)
      → Security static analysis (bandit)
        → Dependency vulnerability scan (safety)
          → Start test services (docker-compose)
            → Apply migrations (alembic upgrade head)
              → Run tests (pytest --cov)
                → Tear down test services
                  → Frontend lint (eslint)
                    → Frontend type check (tsc)
                      → Frontend build (next build)

On merge to develop:
  (All PR checks have already passed)
  Build Docker image
    → Push to ECR (tag: sha-{GITHUB_SHA})
      → Run DB migrations on staging (ECS one-off task)
        → Deploy API service to staging (rolling update)
          → Deploy Celery worker to staging (rolling update)
            → Wait for ECS stable
              → Smoke test (/health returns 200)
                → Deploy Next.js to Vercel preview

On merge to main:
  (Same as staging, targeting prod cluster)
  Build Docker image
    → Push to ECR (tag: v{SEMVER}, latest)
      → Manual approval gate
        → Run DB migrations on prod
          → Deploy API to prod
            → Deploy worker to prod
              → Wait for stable
                → Smoke test
                  → Deploy Next.js to Vercel production
                    → Create GitHub Release
                      → Notify Sentry of release
```

**CI runtime target**: PR checks complete in under 8 minutes. If CI exceeds 10 minutes, investigate and optimize before adding more checks.

---

## 19. Environment Variables

All variables must be present in `.env.example` with descriptive comments. No variable is optional unless explicitly marked `# optional — has default`.

```bash
# ── Application ──────────────────────────────────────────────────────────────
ENVIRONMENT=development                    # development | staging | production
LOG_LEVEL=INFO                             # DEBUG | INFO | WARNING | ERROR
CORS_ORIGINS=http://localhost:3000         # comma-separated list

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://stayos:password@localhost:5432/stayos
# asyncpg driver required; no psycopg2
TEST_DATABASE_URL=postgresql+asyncpg://stayos:password@localhost:5432/stayos_test

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0         # database 0: OTP + rate limits
# Celery broker uses /1; result backend uses /2 — configured in celery_app.py

# ── Firebase ──────────────────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=stayos-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@stayos-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
# Newlines in private key must be \n literals; pydantic-settings handles unescaping

# ── Twilio ────────────────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Paymob ────────────────────────────────────────────────────────────────────
PAYMOB_API_KEY=ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5...
PAYMOB_HMAC_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYMOB_IFRAME_ID=12345                     # Numeric iframe ID from Paymob dashboard

# ── Meta / WhatsApp ───────────────────────────────────────────────────────────
META_WHATSAPP_TOKEN=EAAxxxxxxx...
META_PHONE_NUMBER_ID=1234567890123         # WhatsApp Business phone number ID
META_WHATSAPP_API_VERSION=v18.0            # optional — has default

# ── AWS ───────────────────────────────────────────────────────────────────────
AWS_REGION=me-central-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX     # Not used in ECS (OIDC instead); local dev only
AWS_SECRET_ACCESS_KEY=xxxxxxxx            # Not used in ECS (OIDC instead); local dev only
S3_LISTINGS_BUCKET=stayos-listings-staging
S3_KYC_BUCKET=stayos-kyc-staging
KYC_PRESIGNED_URL_TTL=900                  # optional — has default (seconds)

# ── Google Maps ───────────────────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Server-side key (geocoding); restricted to backend service IP only
# Frontend key is NEXT_PUBLIC_GOOGLE_MAPS_KEY (different key, referrer-restricted)

# ── Sentry ────────────────────────────────────────────────────────────────────
SENTRY_DSN=https://xxxxxxxx@xxxxxxxx.ingest.sentry.io/xxxxxxxx

# ── Business Rules ────────────────────────────────────────────────────────────
OTP_TTL_SECONDS=300                        # optional — has default
OTP_MAX_ATTEMPTS=3                         # optional — has default
OTP_RATE_LIMIT_WINDOW_SECONDS=900          # optional — has default
ESCROW_RELEASE_HOURS=24                    # optional — has default (BR-FIN-01)
CALENDAR_LOCK_TIMEOUT_MS=5000             # optional — has default
GUEST_SERVICE_FEE_PCT=0.04                # optional — has default (4%)
HOST_COMMISSION_PCT=0.10                  # optional — has default (10%)

# ── Next.js (NEXT_PUBLIC_* exposed to browser) ────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stayos-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stayos-prod
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Frontend key separate from server key; restricted to stayos.com referrer
```

**In production**: All of the above (except `NEXT_PUBLIC_*`) are read from AWS Secrets Manager at container start using the AWS SDK in `config.py`. The ECS task role has `secretsmanager:GetSecretValue` permission scoped to `arn:aws:secretsmanager:me-central-1:*:secret:stayos/*`.

---

## 20. Secrets Management

### 20.1 Secrets Manager Namespace

All secrets stored under `stayos/{environment}/{service}/{key}`:

```
stayos/prod/db/url
stayos/prod/redis/url
stayos/prod/firebase/project_id
stayos/prod/firebase/client_email
stayos/prod/firebase/private_key
stayos/prod/twilio/account_sid
stayos/prod/twilio/auth_token
stayos/prod/twilio/verify_service_sid
stayos/prod/paymob/api_key
stayos/prod/paymob/hmac_secret
stayos/prod/paymob/iframe_id
stayos/prod/meta/whatsapp_token
stayos/prod/meta/phone_number_id
stayos/prod/aws/s3_listings_bucket
stayos/prod/aws/s3_kyc_bucket
stayos/prod/google/maps_api_key
stayos/prod/sentry/dsn
```

Staging mirrors the same structure under `stayos/staging/*`.

### 20.2 Access Control

| Service | Secrets It Can Access |
|---------|----------------------|
| API (ECS task role) | All `stayos/prod/*` secrets |
| Celery worker (same task role) | All `stayos/prod/*` secrets |
| CI/CD (GitHub Actions OIDC role) | `stayos/staging/*` only; no prod access |
| Developer local | `.env` file (never committed); `.env.example` shows all keys |

### 20.3 Rotation Schedule

| Secret | Rotation | Method |
|--------|---------|--------|
| Paymob API key | Every 90 days | Manual — generate in Paymob dashboard, update Secrets Manager |
| Paymob HMAC secret | Every 90 days | Manual |
| Meta WhatsApp token | Every 60 days | Manual (Meta token expiry) |
| Twilio auth token | Every 90 days | Manual |
| Firebase service account | On demand (suspected breach) | Rotate via GCP IAM |
| RDS password | Every 180 days | AWS Secrets Manager rotation Lambda |
| Google Maps API key | On demand | Rotate via GCP console |

### 20.4 Developer Secret Hygiene Rules

1. `.env` is in `.gitignore`. It is never committed.
2. `git log --all -S "AIzaSy"` is run in CI (trufflehog) on every push to detect accidental commits.
3. If a secret is accidentally committed: rotate the secret immediately, then remove from git history using `git filter-repo`.
4. Secrets are never passed as Docker build arguments (`ARG`). They are injected at container runtime via ECS task definition secrets injection.
5. Secrets are never logged. `config.py` marks all secret fields with `repr=False` in pydantic-settings.

---

## 21. Developer Onboarding

The following steps bring a new engineer from zero to a running local environment. Every step must work without additional verbal instruction.

### Prerequisites (install before starting)
- Python 3.11 (`pyenv install 3.11.9`)
- Docker Desktop (for local postgres + redis)
- Node.js 20 + pnpm (`npm install -g pnpm`)
- AWS CLI v2
- Terraform 1.8+
- `direnv` (auto-loads `.env` per directory)

### Steps

```bash
# 1. Clone and enter the repository
git clone git@github.com:islamelbaz2010/StayOS.git
cd StayOS

# 2. Create Python virtual environment
python3.11 -m venv .venv
source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements-dev.txt

# 4. Copy and fill environment variables
cp .env.example .env
# Open .env and fill in all values (obtain from team lead)

# 5. Start local infrastructure
docker-compose up -d postgres redis

# 6. Apply database migrations
alembic upgrade head

# 7. Verify backend starts
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → GET http://localhost:8000/health should return {"status": "ok"}

# 8. Install frontend dependencies
cd apps/web
pnpm install
cd ../..

# 9. Start frontend dev server
pnpm --filter web dev
# → http://localhost:3000 should show the Arabic home page

# 10. Run tests to verify everything works
pytest src/ -x --tb=short
# All tests must pass

# 11. Start Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=debug -Q high,default,low --concurrency=2
```

### Verification checklist

After onboarding, the engineer must be able to:
- [ ] `GET /health` returns `{"status": "ok", "db": "ok", "redis": "ok"}`
- [ ] `pytest src/ --cov` runs and passes with ≥ 80% coverage
- [ ] `ruff check src/` produces zero errors
- [ ] `mypy src/` produces zero errors
- [ ] `pnpm --filter web build` completes without errors
- [ ] The Arabic search page loads at `http://localhost:3000/ar/search`

---

## 22. Repository Bootstrap Checklist

This checklist is completed once, by DevOps, before Sprint 0 ends. It is a one-time action.

### AWS Account Setup
- [ ] AWS prod account created with MFA on root user
- [ ] AWS staging account created with MFA on root user
- [ ] IAM admin user created in each account (never use root for operations)
- [ ] AWS CLI configured with staging profile (`aws configure --profile stayos-staging`)
- [ ] S3 state bucket created: `aws s3 mb s3://stayos-terraform-state --region me-central-1`
- [ ] DynamoDB lock table created: `aws dynamodb create-table --table-name stayos-terraform-locks ...`
- [ ] Terraform initialized: `cd infra/terraform && terraform init`
- [ ] Staging infrastructure applied: `terraform workspace select staging && terraform apply`
- [ ] Prod infrastructure applied: `terraform workspace select prod && terraform apply`

### Secrets Population (manual, one-time)
- [ ] All 17 Secrets Manager keys created in staging with real values
- [ ] All 17 Secrets Manager keys created in prod with real values
- [ ] GitHub Actions OIDC role created and connected to GitHub repo
- [ ] GitHub Actions repository secrets set: `AWS_ROLE_ARN_STAGING`, `AWS_ROLE_ARN_PROD`

### External Service Registration (founder, not engineering)
- [ ] Paymob merchant account approved; API key + HMAC secret received
- [ ] WhatsApp Business API account approved; 5 templates submitted and pre-approved by Meta
- [ ] Firebase project created; service account JSON downloaded
- [ ] Twilio account created; Verify service SID generated
- [ ] Google Maps API key generated; restricted to `stayos.com` referrer
- [ ] Sentry projects created: `stayos-api` (Python) and `stayos-web` (Next.js)

### Repository Configuration
- [ ] `develop` branch created from `main`
- [ ] Branch protection rules applied to `main` and `develop` (see Section 15)
- [ ] GitHub Environment `production` created with required reviewers
- [ ] Vercel project linked to GitHub repo; auto-deploy configured for `develop` → preview

### Verification
- [ ] `git push origin feature/test-ci-pipeline` — CI runs and passes
- [ ] `GET https://api-staging.stayos.com/health` returns `{"status": "ok"}`
- [ ] Staging Vercel preview URL loads the Arabic home page

---

## 23. Definition of Done — Per Sprint

A sprint is done when every criterion below is met. A sprint is not done when "the code is written but tests aren't passing yet."

### Sprint 0 — Infrastructure
- [ ] `GET /health` on staging returns `{"status": "ok", "db": "ok", "redis": "ok"}`
- [ ] GitHub Actions CI pipeline runs and passes on a test PR
- [ ] Docker image builds successfully and pushes to ECR
- [ ] All 6 Alembic migrations run cleanly against a fresh staging database
- [ ] Next.js frontend deploys to Vercel and shows the Arabic root page
- [ ] All env vars documented in `.env.example`

### Sprint 1 — Auth + Listings
- [ ] A new user can register with an Egyptian phone number and receive an OTP via Twilio
- [ ] A user with role HOST can create a listing and upload photos to S3
- [ ] An admin can approve or reject a KYC submission
- [ ] A host with `status=PENDING_KYC` cannot create a listing (403 returned)
- [ ] All auth and PMS tests pass with ≥ 80% module coverage
- [ ] Listing creation form renders in Arabic RTL on the staging frontend
- [ ] `ruff check src/` and `mypy src/` report zero errors

### Sprint 2 — Search + Booking
- [ ] A guest can search for listings by map viewport, date range, price, and cultural tags
- [ ] Listing detail page renders from ISR (check Vercel build output for static generation)
- [ ] A verified guest can initiate a booking and a `PaymentIntent` record is created with status `PENDING`
- [ ] Attempting to book the same dates on the same unit concurrently results in exactly one success and one `409 calendar-conflict` response (concurrency test in pytest)
- [ ] Guest cancellation endpoint returns the correct refund amount per the cancellation policy
- [ ] All reservation tests pass with ≥ 90% module coverage

### Sprint 3 — Payments + Notifications + Launch
- [ ] A Paymob webhook with a valid HMAC signature and `success=true` transitions the reservation to `CONFIRMED`
- [ ] A duplicate Paymob webhook with the same `order_id` is a no-op (idempotency key in Redis)
- [ ] An `EscrowAccount` record is created on booking confirmation
- [ ] A Celery task for `escrow_release` is scheduled and runs without error in staging
- [ ] An admin can trigger a manual payout for a host and the Paymob disbursement API is called
- [ ] A WhatsApp booking confirmation message is delivered to the test number after a confirmed payment
- [ ] All finance and notify tests pass with ≥ 85% module coverage
- [ ] One complete end-to-end booking (search → book → Paymob sandbox payment → confirmation → WhatsApp) is demonstrated in staging

---

## 24. Parallel Work Opportunities

These workstreams can proceed simultaneously without blocking each other.

| Sprint | Parallel Track A | Parallel Track B | Sync Point |
|--------|-----------------|-----------------|-----------|
| S0 | AWS infrastructure (Terraform) | GitHub Actions CI + Docker | Both needed before first staging deploy |
| S0 | Backend scaffold (`src/app/`) | Frontend scaffold (`apps/web/`) | Sprint 1 start |
| S1 | Auth backend (OTP, KYC, JWT) | PMS backend (Unit CRUD, photos, calendar) | End of Sprint 1 backend |
| S1 | Backend S1 features | Frontend RTL foundation + auth pages | Frontend starts after health endpoint is live |
| S2 | Reservation backend | Search endpoint refinement | End of Sprint 2 backend |
| S2 | Backend S2 features | Frontend search page + checkout form | Checkout page requires booking endpoint |
| S3 | Finance backend (Paymob, escrow) | Notification tasks (WhatsApp) | Both needed for end-to-end test |
| All | WhatsApp template submission to Meta | Engineering | 72h async review; submit on Sprint 0 Day 1 |
| All | Paymob sandbox testing | Stripe (deferred to V1.1) | Paymob is MVP v1 only |

**Earliest parallelism**: The auth backend and PMS backend can be developed simultaneously from the first day of Sprint 1 because they share no runtime dependencies — they only share `app.shared` imports.

---

## 25. Critical Path

The critical path is the sequence of work where any delay causes a corresponding delay to the first live booking.

```
Day 0:   Phase 0 gate clears (external — non-engineering)
         ↕ parallel with Days 0–14
         Submit WhatsApp template applications to Meta (72h review — start immediately)
         Register Paymob merchant account (async process)

Week 1:  Provision AWS infrastructure (Terraform staging)
         Create Python + Next.js scaffolds
         CI/CD pipeline live
         → EXIT: GET /health returns 200 in staging

Week 2:  Complete infra + first Vercel deploy (Sprint 0 DoD met)

Week 3:  Auth backend: OTP + JWT middleware + KYC upload
         PMS backend: Unit CRUD + photos + calendar (parallel)

Week 4:  Auth frontend: OTP page + KYC upload page (Arabic RTL)
         PMS backend: Search endpoint (parallel)

Week 5:  Reservation backend: calendar lock + booking initiation
         Frontend: Search page + listing detail (ISR)
         → EXIT: Guest reaches the payment step in staging

Week 6:  Paymob integration: order + payment key + webhook handler
         Notification tasks: Celery worker + WhatsApp client
         → EXIT: Payment succeeds in Paymob sandbox; WhatsApp confirmation sent

Week 7:  Escrow + manual payout
         Frontend: Paymob iframe + confirmation page + booking history
         End-to-end staging test

Week 8:  Security review (HMAC, JWT, input validation audit — not a full sprint)
         Production deploy
         → EXIT: First live booking in production

Critical path length: 8 weeks from Phase 0 gate clearance to first live booking.
```

**Bottlenecks on the critical path**:
1. **Paymob integration** (Week 6): Most complex backend task. No shortcuts. The HMAC webhook handler must be tested with real Paymob sandbox webhooks before production.
2. **WhatsApp template pre-approval** (start on Day 1): 72h review from Meta. Delay here directly delays the first booking notification. Submit on Day 1 of Sprint 0.
3. **KYC admin approval** (Week 3–4): Before any host can list, an admin must manually review their document. The founder is the admin for the first 50 hosts. This is a human bottleneck, not an engineering one.

---

## 26. Estimated Timeline

| Week | Sprint | Deliverable | DoD Milestone |
|------|--------|------------|--------------|
| 1–2 | S0 (Infra) | AWS + CI/CD + scaffold | `GET /health` → 200 in staging |
| 3–5 | S1 (Auth + Listings) | Register, KYC, create listing | Verified host has a listed property |
| 6–8 | S2 (Search + Booking) | Search, listing detail, checkout | Guest can reach payment step |
| 9–10 | S3 (Payments + Notify) | Paymob, escrow, WhatsApp | One real booking confirmed in staging |
| 11 | Integration + smoke | End-to-end staging validation | Full booking loop in staging |
| 12 | Production deploy | Live on stayos.com | First live booking in production |

**Total**: 12 weeks (3 months) from Phase 0 gate to first live booking.

**Team required for this timeline**:
- 1 Backend engineer (Python/FastAPI) — full time
- 1 Frontend engineer (Next.js/TypeScript, Arabic RTL experience) — full time
- Founder acts as: DevOps (Terraform), Admin (KYC reviewer), QA (end-to-end testing), and Product Owner

**Single-engineer timeline**: 20–24 weeks. The frontend and backend cannot effectively be developed sequentially by one person at the speed the product requires.

---

## Document Authority

This document does not require updates when:
- An engineer creates a file in the expected location
- A sprint completes its DoD

This document requires an update (via PR + DECISION_LOG.md entry) when:
- A new required environment variable is added
- A module is renamed
- A sprint scope changes
- A dependency between sprints changes
- A "must never be modified" file needs to be modified

**One final rule**: When in doubt about whether to build something, check MVP_SLICE.md first. If the feature is not listed as MVP v1, do not build it.
