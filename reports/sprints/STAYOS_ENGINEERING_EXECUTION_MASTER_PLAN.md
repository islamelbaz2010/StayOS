# STAYOS ENGINEERING EXECUTION MASTER PLAN

**Document Version:** 1.0  
**Created:** 2026-07-27  
**Status:** ACTIVE — Engineering Execution  
**Classification:** Internal — Engineering Only  

---

## Document Control

| Field | Value |
|---|---|
| Source of Truth | Architecture Readiness Review (2026-07-27) |
| Design Freeze | Confirmed — all 10 design documents frozen |
| Backend State | FastAPI modular monolith, 68% complete, CI green |
| Web State | Next.js 14, 5% complete (scaffold only) |
| Mobile State | 0% — no source code exists |
| Infrastructure State | Terraform defined, NOT provisioned |
| Test Coverage | Backend 80%+, CI gates enforced |

---

## Executive Summary

StayOS has completed documentation, design, and backend foundation. Three execution tracks must now converge to production: **Web Frontend** (90–110 dev-days), **Mobile** (106 dev-days), and **Backend Completion** (24 dev-days). Infrastructure provisioning is the only Day 1 blocker. With the proposed 8.5-FTE team running 9 two-week sprints in parallel, production target is **Week 20** from start date.

**Production ETA: 20 weeks from team start.**

---

## SECTION 1 — Consolidated Gap Analysis

Gaps from the Architecture Readiness Review, grouped and deduplicated.

### Group A — Infrastructure (Blocks everything)

| ID | Gap | Effort |
|---|---|---|
| GAP-A1 | Terraform apply not run — staging infra does not exist | 1 day |
| GAP-A2 | Terraform apply not run — production infra does not exist | 1 day |
| GAP-A3 | AWS Secrets Manager values not populated | 0.5 day |
| GAP-A4 | Vercel project not created — VERCEL_PROJECT_ID missing | 2 hours |
| GAP-A5 | RSA key pair not generated for JWT | 1 hour |
| GAP-A6 | ECS task definitions have placeholder subnet/sg values | 1 day |
| GAP-A7 | CloudFront CDN not configured for S3 media | 1 day |
| GAP-A8 | PgBouncer not configured — connection pooling absent | 1 day |

### Group B — Backend P0 Gaps (Block specific features)

| ID | Gap | Effort |
|---|---|---|
| GAP-B1 | Listing photo upload API missing (presigned PUT URLs for S3_LISTINGS_BUCKET) | 1 day |
| GAP-B2 | FCM push notification token endpoint missing (no device token storage) | 1 day |
| GAP-B3 | Email provider is a stub — no SES/SendGrid wired | 1 day |
| GAP-B4 | Paymob iframe URL not returned to frontend after payment order creation | 1 day |

### Group C — Backend P1 Completion

| ID | Gap | Effort |
|---|---|---|
| GAP-C1 | No messaging data model (no conversations/messages tables) | 2 days |
| GAP-C2 | No WebSocket server for real-time chat | 3 days |
| GAP-C3 | Admin API: user management (list, ban, suspend, search) | 2 days |
| GAP-C4 | Admin API: listing moderation (approve/reject with reason) | 1 day |
| GAP-C5 | Admin API: KPI dashboard (platform-level aggregations) | 2 days |
| GAP-C6 | Admin API: financial reconciliation report | 1 day |
| GAP-C7 | Map-view listings endpoint (lat/lng + minimal payload for clustering) | 1 day |
| GAP-C8 | FCM push notification provider implementation | 2 days |
| GAP-C9 | Analytics event emission (PostHog server-side events) | 1 day |

### Group D — Payment Methods (P1 for launch)

| ID | Gap | Effort |
|---|---|---|
| GAP-D1 | Paymob: Fawry integration (integration ID + callback) | 2 days |
| GAP-D2 | Paymob: Meeza integration | 2 days |
| GAP-D3 | Paymob: Vodafone Cash integration | 2 days |
| GAP-D4 | Paymob: InstaPay integration | 1 day |

### Group E — Open Decisions (Must close before relevant sprint)

| ID | Decision | Deadline |
|---|---|---|
| DEC-OPEN-1 | Mobile framework: Flutter vs React Native | Before Sprint 0 Day 1 |
| DEC-OPEN-2 | Email provider: AWS SES vs SendGrid | Sprint 0 |
| DEC-OPEN-3 | Product analytics: PostHog vs Mixpanel vs Amplitude | Sprint 0 |
| DEC-OPEN-4 | Real-time messaging transport: WebSocket vs SSE | Sprint 0 |
| DEC-OPEN-5 | Mobile state management: Riverpod vs Bloc vs GetX | Sprint 0 |
| DEC-OPEN-6 | Stripe scope: confirm international cards only, Paymob for Egypt | Sprint 0 |

### Group F — DevOps, Security, Scalability

| ID | Gap | Effort |
|---|---|---|
| GAP-F1 | Mobile CI pipeline (build + test + App Store upload) | 1 day |
| GAP-F2 | AWS WAF rules on ALB (OWASP managed rule group) | 1 day |
| GAP-F3 | File upload validation (MIME whitelist, size limit, S3 ingest) | 1 day |
| GAP-F4 | CloudWatch alerting rules (booking failure, payment failure, error rate) | 1 day |
| GAP-F5 | Secrets rotation procedure | 0.5 day |
| GAP-F6 | Terms acceptance tracking (DB field + endpoint) | 0.5 day |
| GAP-F7 | E2E test suite (Playwright — auth, booking, payment flows) | 3 days |
| GAP-F8 | Load test suite (k6 — calendar concurrency, search, checkout) | 2 days |
| GAP-F9 | App Store Connect account setup (iOS) | 0.5 day |
| GAP-F10 | Google Play Console account setup (Android) | 0.5 day |

### Group G — Frontend/Mobile (Primary build work)

All web and mobile screens are build work, not gaps in documentation. They are tracked as epics below.

---

## SECTION 2 — Engineering Epics

### Infrastructure Epics

| Epic ID | Epic Name | Owner Track | Sprints |
|---|---|---|---|
| EPIC-INFRA-01 | Infrastructure Provisioning | DevOps | Sprint 0 |
| EPIC-INFRA-02 | CDN, PgBouncer, WAF, Alerting | DevOps | Sprint 2–3 |
| EPIC-INFRA-03 | Mobile CI Pipeline | DevOps | Sprint 1 |
| EPIC-INFRA-04 | Production Infrastructure | DevOps | Sprint 5 |

### Backend Epics

| Epic ID | Epic Name | Owner Track | Sprints |
|---|---|---|---|
| EPIC-BE-01 | Backend P0 Gap Closure | Backend | Sprint 0 |
| EPIC-BE-02 | Messaging Backend (Data Model + WebSocket) | Backend | Sprint 1–2 |
| EPIC-BE-03 | Admin Portal API | Backend | Sprint 1–3 |
| EPIC-BE-04 | Push Notification Provider (FCM) | Backend | Sprint 1 |
| EPIC-BE-05 | Egyptian Payment Methods (Paymob) | Backend | Sprint 2–3 |
| EPIC-BE-06 | Analytics Integration | Backend | Sprint 3 |

### Web Frontend Epics

| Epic ID | Epic Name | Owner Track | Sprints |
|---|---|---|---|
| EPIC-WEB-01 | Web Foundation (tokens, i18n, API client, state) | Web | Sprint 0 |
| EPIC-WEB-02 | Authentication & KYC (6 screens) | Web | Sprint 1 |
| EPIC-WEB-03 | Search & Discovery (8 screens + maps) | Web | Sprint 2 |
| EPIC-WEB-04 | Property Detail (3 screens) | Web | Sprint 2 |
| EPIC-WEB-05 | Checkout & Payments (5 screens) | Web | Sprint 3 |
| EPIC-WEB-06 | Guest Dashboard (5 screens) | Web | Sprint 4 |
| EPIC-WEB-07 | Host Portal (12 screens) | Web | Sprint 4–5 |
| EPIC-WEB-08 | Admin Portal (15 screens) | Web | Sprint 5–6 |
| EPIC-WEB-09 | Messaging & Notifications (4 screens) | Web | Sprint 6 |

### Mobile Epics

| Epic ID | Epic Name | Owner Track | Sprints |
|---|---|---|---|
| EPIC-MOB-01 | Mobile Foundation (scaffold, tokens, navigation, API client) | Mobile | Sprint 0 |
| EPIC-MOB-02 | Authentication & KYC | Mobile | Sprint 1 |
| EPIC-MOB-03 | Search, Map & Discovery | Mobile | Sprint 2 |
| EPIC-MOB-04 | Property Detail & Calendar | Mobile | Sprint 2–3 |
| EPIC-MOB-05 | Checkout & Payments | Mobile | Sprint 3 |
| EPIC-MOB-06 | Guest Dashboard | Mobile | Sprint 4 |
| EPIC-MOB-07 | Host Dashboard & Listings | Mobile | Sprint 4–5 |
| EPIC-MOB-08 | Messaging & Push Notifications | Mobile | Sprint 5–6 |
| EPIC-MOB-09 | Offline Support & Sync | Mobile | Sprint 6 |
| EPIC-MOB-10 | App Store Readiness | Mobile | Sprint 7–8 |

### QA Epics

| Epic ID | Epic Name | Owner Track | Sprints |
|---|---|---|---|
| EPIC-QA-01 | E2E Test Infrastructure (Playwright) | QA | Sprint 0 |
| EPIC-QA-02 | Auth + Booking + Payment E2E | QA | Sprint 1–3 |
| EPIC-QA-03 | Load & Concurrency Testing (k6) | QA | Sprint 6–7 |
| EPIC-QA-04 | Full Regression Suite | QA | Sprint 7–8 |
| EPIC-QA-05 | Mobile Testing | QA | Sprint 5–8 |

### Security Epics

| Epic ID | Epic Name | Owner Track | Sprints |
|---|---|---|---|
| EPIC-SEC-01 | File Upload Hardening | Security | Sprint 0–1 |
| EPIC-SEC-02 | WAF & Network Security | Security | Sprint 2–3 |
| EPIC-SEC-03 | Penetration Test | Security | Sprint 7 |
| EPIC-SEC-04 | Compliance (Terms, Data Retention) | Security | Sprint 4 |

---

## SECTION 3 — Engineering Tasks

### EPIC-INFRA-01: Infrastructure Provisioning

---

**TASK-INFRA-01-01: Resolve Terraform Placeholder Values**

- **Objective:** Replace `subnet-xxx` and `sg-xxx` placeholders in `deploy-prod.yml` and Terraform files with real AWS resource IDs
- **Description:** Run `terraform plan` to identify all missing values. Update `infra/terraform/variables.tf` with environment-specific values (VPC ID, subnet IDs, SG IDs) for both staging and production. Confirm `me-south-1` region account access.
- **Dependencies:** AWS account with appropriate IAM permissions (admin or Terraform-specific role)
- **Inputs:** AWS account ID, existing VPC configuration (or create new)
- **Outputs:** `infra/terraform/staging.tfvars` and `infra/terraform/prod.tfvars` with all real values
- **Acceptance Criteria:**
  - `terraform plan` produces no errors for staging environment
  - All subnet IDs are real and exist in `me-south-1`
  - Security groups have correct ingress/egress rules for ECS tasks
- **Risks:** AWS service limits in me-south-1 may require quota increase
- **Effort:** 4 hours
- **Priority:** P0 — Day 1

---

**TASK-INFRA-01-02: Provision Staging Infrastructure**

- **Objective:** Run Terraform to create all staging AWS resources
- **Description:** Execute `terraform apply` for staging environment. Resources created: VPC, public/private subnets, NAT gateway, RDS PostgreSQL 16 + PostGIS, ElastiCache Redis 7, ECS cluster, ECR repositories, ALB with HTTPS listener, S3 buckets (listings, KYC), IAM roles, Secrets Manager placeholders
- **Dependencies:** TASK-INFRA-01-01 complete, AWS account access
- **Inputs:** `infra/terraform/staging.tfvars`
- **Outputs:** Staging environment running. Note all output values (ALB DNS, RDS endpoint, ElastiCache endpoint, S3 bucket names)
- **Acceptance Criteria:**
  - `terraform output` shows all resources without errors
  - RDS instance is reachable from ECS subnet (private subnet access test)
  - ALB health check returns 200 (once API is deployed)
  - S3 buckets created with correct policies
- **Risks:** RDS provisioning takes 5–10 min; ElastiCache takes 3–5 min; plan for 30-min window
- **Effort:** 4 hours (including apply time)
- **Priority:** P0 — Day 1

---

**TASK-INFRA-01-03: Populate AWS Secrets Manager**

- **Objective:** Populate all required application secrets in AWS Secrets Manager so ECS tasks can boot
- **Description:** For staging environment, create secrets for: DATABASE_URL (with RDS endpoint), REDIS_URL (ElastiCache endpoint), JWT_PRIVATE_KEY (generate 2048-bit RSA), JWT_PUBLIC_KEY (paired), FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY (from Firebase console), TWILIO_ACCOUNT_SID / AUTH_TOKEN / VERIFY_SERVICE_SID, PAYMOB_API_KEY / HMAC_SECRET / INTEGRATION_ID / IFRAME_ID, META_WHATSAPP_TOKEN / PHONE_NUMBER_ID, AWS_ACCESS_KEY_ID / SECRET_ACCESS_KEY (limited S3 role), SENTRY_DSN
- **Dependencies:** TASK-INFRA-01-02, all third-party accounts active
- **Inputs:** Credentials from: Firebase console, Twilio console, Paymob dashboard, Meta developer portal, Sentry project
- **Outputs:** All secrets populated in `stayos-staging/` prefix in Secrets Manager
- **Acceptance Criteria:**
  - API container boots successfully in ECS with env vars injected from Secrets Manager
  - `GET /health` returns `{"status": "ok", "database": "ok", "redis": "ok"}`
- **Risks:** Firebase private key formatting (embedded newlines) — test locally first
- **Effort:** 4 hours (including credential gathering)
- **Priority:** P0 — Day 1

---

**TASK-INFRA-01-04: Initial Staging Deployment**

- **Objective:** Deploy the API to staging ECS and run Alembic migrations
- **Description:** Build Docker image and push to ECR. Run `alembic upgrade head` via ECS task. Update ECS service. Verify all 10 migrations succeed. Run smoke test against staging ALB.
- **Dependencies:** TASK-INFRA-01-02, TASK-INFRA-01-03
- **Inputs:** Staging ECR repository URL, Docker image built from `infra/docker/api/Dockerfile`
- **Outputs:** Staging API live at `https://api-staging.stayos.com/health`
- **Acceptance Criteria:**
  - All 10 Alembic migrations complete without error
  - `GET https://api-staging.stayos.com/health` returns 200 with all services `ok`
  - `GET https://api-staging.stayos.com/health/ready` returns 200
  - ECS service shows RUNNING task with 0 restarts
- **Risks:** Alembic migration order — verify with `alembic history` before apply
- **Effort:** 3 hours
- **Priority:** P0 — Day 1–2

---

**TASK-INFRA-01-05: Create Vercel Project and Connect Web**

- **Objective:** Create Vercel project for Next.js web app and configure staging/production deployments
- **Description:** Create Vercel project linked to `apps/web/`. Configure `NEXT_PUBLIC_API_URL` environment variable (staging: `https://api-staging.stayos.com`, prod: `https://api.stayos.com`). Set `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as GitHub Actions secrets. Configure custom domains.
- **Dependencies:** Vercel account, GitHub repository access
- **Inputs:** `apps/web/` directory, Vercel account
- **Outputs:** `VERCEL_PROJECT_ID` secret set in GitHub, preview deployments working on PRs
- **Acceptance Criteria:**
  - `pnpm build` succeeds in Vercel build pipeline
  - Preview deployment URL is accessible
  - `NEXT_PUBLIC_API_URL` is correctly injected at build time
- **Risks:** None significant
- **Effort:** 2 hours
- **Priority:** P0 — Day 1

---

### EPIC-BE-01: Backend P0 Gap Closure

---

**TASK-BE-01-01: Listing Photo Upload API**

- **Objective:** Allow hosts to upload photos for their listings via presigned S3 URLs
- **Description:** Create endpoint `POST /api/v1/listings/{unit_id}/photos/upload-url` that generates a presigned PUT URL for S3_LISTINGS_BUCKET. Pattern: replicate `kyc/services.py:_generate_presigned_put_url()`. Add `POST /api/v1/listings/{unit_id}/photos` to register the uploaded photo URL in a new `unit_photos` table (migration required). Add `DELETE /api/v1/listings/{unit_id}/photos/{photo_id}`. Return ordered photo list in `ListingResponse`.
- **Dependencies:** Staging S3 bucket accessible, auth dependency `require_role("host")` (exists)
- **Inputs:** `unit_id`, content type, file index; existing `kyc/services.py` presigned URL pattern
- **Outputs:** New Alembic migration `011_add_unit_photos.py`, new endpoint, updated `ListingResponse` schema
- **Acceptance Criteria:**
  - Host can request presigned URL
  - Host can PUT a JPEG to that URL directly (client-side upload)
  - Photo URL registered via POST endpoint
  - `GET /api/v1/listings/{unit_id}` returns `photos` array
  - Non-host cannot call the endpoint (403)
  - Maximum 20 photos per listing enforced
- **Risks:** S3 CORS policy must allow PUT from frontend origin — add CORS config to S3 bucket
- **Effort:** 1 day
- **Priority:** P0

---

**TASK-BE-01-02: Device Token Registration (FCM/APNs)**

- **Objective:** Allow mobile clients to register push notification device tokens
- **Description:** Add `device_tokens` table to auth schema (user_id FK, token, platform ENUM[ios, android], created_at, last_seen_at, is_active). Create Alembic migration `012_add_device_tokens.py`. Create endpoint `POST /api/v1/users/device-token` (authenticated). Create `DELETE /api/v1/users/device-token` for logout/token invalidation. Add unique constraint on (user_id, token).
- **Dependencies:** Authenticated user endpoint pattern (exists in auth router)
- **Inputs:** `{token: string, platform: "ios" | "android"}`
- **Outputs:** New migration, new endpoints, device_tokens repository
- **Acceptance Criteria:**
  - Authenticated user can register device token
  - Re-registering same token updates last_seen_at (upsert)
  - Logout endpoint marks token inactive
  - Tokens stored per-user allow multi-device push
- **Risks:** FCM tokens rotate — handle gracefully with upsert
- **Effort:** 1 day
- **Priority:** P0

---

**TASK-BE-01-03: Email Provider Integration**

- **Objective:** Replace `send_email()` stub with a real transactional email provider
- **Description:** Choose AWS SES (recommended — already using AWS, same IAM role) or SendGrid. Implement `notifications/providers.py:send_email()` using SES `boto3.client('ses')`. Create SES templates for: booking confirmation, cancellation confirmation, payout notification, OTP fallback. Add `SES_FROM_EMAIL` to config and Secrets Manager. Add `SES_REGION` to config (can differ from primary region).
- **Dependencies:** SES account verified, from-email domain verified in SES (stayos.com)
- **Inputs:** SES SDK, existing `send_email()` function signature
- **Outputs:** Real email delivery in staging and production
- **Acceptance Criteria:**
  - Test email delivered to real inbox from staging
  - `send_email()` matches existing function signature (no caller changes needed)
  - DKIM and SPF configured for stayos.com in SES
  - Bounce and complaint handling configured (SNS topic)
- **Risks:** SES sandbox mode limits to verified emails — request production access in Sprint 0
- **Effort:** 1 day
- **Priority:** P0

---

**TASK-BE-01-04: Paymob Iframe URL Endpoint**

- **Objective:** Return embeddable Paymob iframe URL to frontend after payment order creation
- **Description:** The existing `finance/providers.py` creates Paymob payment orders but does not return the iframe token. The frontend needs the iframe URL (format: `https://accept.paymob.com/api/acceptance/iframes/{IFRAME_ID}?payment_token={token}`) to embed checkout. Update `create_reservation` service to return `payment_iframe_url` in `ReservationResponse`. Verify `PAYMOB_IFRAME_ID` is set in config.
- **Dependencies:** Paymob sandbox credentials, existing finance/providers.py Paymob flow
- **Inputs:** Existing Paymob payment order creation in providers.py
- **Outputs:** `payment_iframe_url` field added to `ReservationResponse` schema
- **Acceptance Criteria:**
  - `POST /api/v1/reservations` response includes `payment_iframe_url`
  - URL is valid and loads Paymob hosted payment form in browser
  - PAYMOB_IFRAME_ID config value is documented and required
- **Risks:** Paymob sandbox vs production iframe IDs differ — use env-specific values
- **Effort:** 1 day
- **Priority:** P0

---

### EPIC-BE-02: Messaging Backend

---

**TASK-BE-02-01: Messaging Data Model**

- **Objective:** Create database schema for host-guest conversations
- **Description:** Create Alembic migration `013_create_messaging_tables.py` with tables: `messaging.conversations` (id, reservation_id FK nullable, host_id FK, guest_id FK, status ENUM[active, archived], last_message_at, created_at), `messaging.messages` (id, conversation_id FK, sender_id FK, content TEXT, message_type ENUM[text, booking_card, system], read_at NULLABLE, created_at). Add GIN index on conversation participants for fast inbox query.
- **Dependencies:** TASK-BE-01-01 not required; independent
- **Inputs:** Messaging schema from PRODUCT_EXPERIENCE_DESIGN.md
- **Outputs:** New migration, SQLAlchemy models, repository layer
- **Acceptance Criteria:**
  - Migration runs cleanly on test DB
  - Conversation is linked to a reservation (optional) or created standalone
  - Read receipts tracked per message per recipient
  - Unread count queryable efficiently (index on read_at IS NULL)
- **Risks:** None — clean new tables
- **Effort:** 1 day
- **Priority:** P1

---

**TASK-BE-02-02: WebSocket Server for Real-Time Chat**

- **Objective:** Implement WebSocket endpoint for real-time message delivery
- **Description:** Add `GET /api/v1/messaging/ws/{conversation_id}` WebSocket endpoint using FastAPI's native WebSocket support. Implement `ConnectionManager` class (in-process for MVP — upgrade to Redis pub/sub in Phase 2 when multi-instance needed). JWT authentication on WebSocket handshake (pass token as query param `?token=`). On message send: persist to DB, broadcast to all active connections for conversation, emit WhatsApp notification for offline participants. Implement connection cleanup on disconnect.
- **Dependencies:** TASK-BE-02-01, Auth token validation (exists)
- **Inputs:** FastAPI WebSocket, existing auth token decode
- **Outputs:** WebSocket endpoint, ConnectionManager, REST endpoints: `GET /conversations`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages` (REST fallback)
- **Acceptance Criteria:**
  - Two users can exchange messages in real-time in staging
  - JWT validation rejects unauthenticated connections (code 4001)
  - Non-participant cannot join conversation (code 4003)
  - Message persisted to DB before broadcast (no loss on disconnect)
  - Offline participant receives WhatsApp notification
  - Connection manager handles concurrent connections without race conditions
- **Risks:** In-process ConnectionManager does not survive ECS task restart — acceptable for MVP with sticky sessions; document as Phase 2 upgrade
- **Effort:** 3 days
- **Priority:** P1

---

### EPIC-BE-03: Admin Portal API

---

**TASK-BE-03-01: Admin User Management API**

- **Objective:** Allow admins to view, search, ban, and manage user accounts
- **Description:** Add to `auth/router.py` under `require_role("admin")`: `GET /api/v1/admin/users` (paginated, filterable by role/kyc_status/is_active), `GET /api/v1/admin/users/{user_id}` (full profile + reservation history count + KYC status), `POST /api/v1/admin/users/{user_id}/ban` (body: reason, duration_days or permanent), `POST /api/v1/admin/users/{user_id}/unban`, `POST /api/v1/admin/users/{user_id}/kyc/override` (admin force approve/reject with reason)
- **Dependencies:** None — all required models and auth exist
- **Inputs:** Existing User, Account, KycDocument models
- **Outputs:** Admin user management endpoints
- **Acceptance Criteria:**
  - Pagination works with 10,000+ users (cursor-based or offset with limit 50)
  - Ban sets `is_active=False` and logs to audit trail
  - Non-admin cannot access any `/admin/` route (403)
  - KYC override creates audit log entry with admin user ID and reason
- **Risks:** None
- **Effort:** 2 days
- **Priority:** P1

---

**TASK-BE-03-02: Admin Listing Moderation API**

- **Objective:** Allow admins to approve, reject, and manage listings
- **Description:** Add to `listings/router.py` under `require_role("admin")`: `GET /api/v1/admin/listings` (filterable by status: pending_verification, active, suspended), `POST /api/v1/admin/listings/{unit_id}/approve` (sets status to active), `POST /api/v1/admin/listings/{unit_id}/reject` (body: reason, sets status to rejected), `POST /api/v1/admin/listings/{unit_id}/suspend` (body: reason). All status transitions logged to audit trail.
- **Dependencies:** None — UnitStatus enum already includes all states
- **Inputs:** Existing Unit, UnitListing models
- **Outputs:** Admin listing moderation endpoints
- **Acceptance Criteria:**
  - Approve sets `unit.status = "active"` and triggers host notification (WhatsApp)
  - Reject sends rejection reason to host
  - Audit log captures admin_id, action, reason, timestamp for every moderation action
- **Risks:** None
- **Effort:** 1 day
- **Priority:** P1

---

**TASK-BE-03-03: Admin KPI Dashboard API**

- **Objective:** Provide platform-wide KPIs for the admin portal dashboard
- **Description:** Create new router `admin/router.py`. Endpoint `GET /api/v1/admin/dashboard/kpis` returns: total_users (by role), total_listings (by status), total_reservations (by status), gmv_egp (last 30d / all time), platform_revenue_egp (last 30d / all time), avg_booking_value_egp, occupancy_rate, kyc_pending_count, pending_moderation_count. Queries must be efficient — use DB aggregations not in-memory aggregation.
- **Dependencies:** TASK-BE-03-01, TASK-BE-03-02
- **Inputs:** All existing models (users, units, reservations, finance)
- **Outputs:** Single KPI endpoint with all dashboard metrics
- **Acceptance Criteria:**
  - Response time < 500ms on staging DB (add DB indexes if needed)
  - All metrics accurate to within 1 minute (no caching for MVP)
  - Non-admin returns 403
- **Risks:** Full table scans on large tables — add partial indexes on status fields
- **Effort:** 2 days
- **Priority:** P1

---

**TASK-BE-03-04: Admin Financial Reconciliation API**

- **Objective:** Allow admins to view transaction ledger and trigger manual payouts
- **Description:** Expose existing finance data to admin: `GET /api/v1/admin/finance/transactions` (filterable by status, provider, date range), `GET /api/v1/admin/finance/escrow` (active escrows by status), `GET /api/v1/admin/finance/payouts` (payout history and pending), `POST /api/v1/admin/finance/payouts/{payout_id}/process` (trigger manual payout). All existing finance logic is implemented — these are admin-authorized wrappers.
- **Dependencies:** Existing FinancialEngine models and services
- **Inputs:** Existing finance repository
- **Outputs:** Admin financial endpoints
- **Acceptance Criteria:**
  - Transaction list returns double-entry ledger entries with correct amounts
  - Manual payout trigger works in staging with Paymob sandbox
  - Export capability: `GET /api/v1/admin/finance/transactions?format=csv` returns CSV
- **Risks:** CSV generation — use Python `csv` module, stream large exports
- **Effort:** 1 day
- **Priority:** P1

---

**TASK-BE-04-01: FCM Push Notification Provider**

- **Objective:** Implement Firebase Cloud Messaging for mobile push notifications
- **Description:** Add FCM provider to `notifications/providers.py`. Use `firebase_admin.messaging` (already imported via `firebase-admin` dependency). Implement `send_push_notification(device_tokens: list[str], title: str, body: str, data: dict)`. Query device_tokens table to get active tokens for a user. Integrate into existing notification dispatch flow (WhatsApp is primary; push is secondary channel). Add push notification to: new message received, booking status change, payout processed, reservation check-in reminder (T-24h).
- **Dependencies:** TASK-BE-01-02 (device tokens must exist), Firebase Admin SDK already installed
- **Inputs:** `firebase-admin` SDK, existing `notifications/providers.py`
- **Outputs:** FCM push delivery in staging
- **Acceptance Criteria:**
  - Push notification received on physical device in staging
  - Multi-device: user with two registered devices receives on both
  - Invalid/expired tokens are marked inactive (do not retry)
  - Notification payload includes deep link data for routing
- **Risks:** APNs requires Apple Developer account + provisioning profile — coordinate with mobile team in Sprint 0
- **Effort:** 2 days
- **Priority:** P0 — mobile notifications blocked

---

**TASK-BE-05-01 through BE-05-04: Paymob Egyptian Payment Methods**

> Each method follows the same pattern: configure integration ID, create payment order with correct `integration_id`, handle Paymob callback, map to existing `PaymentProvider` enum.

**BE-05-01: Fawry** — Effort: 2 days | Sprint 2  
**BE-05-02: Meeza** — Effort: 2 days | Sprint 2  
**BE-05-03: Vodafone Cash** — Effort: 2 days | Sprint 3  
**BE-05-04: InstaPay** — Effort: 1 day | Sprint 3  

**Acceptance Criteria (all):**
- Payment order created with correct integration_id for each method
- Callback signature verified via existing `verify_paymob_hmac()`
- Payment result updates reservation and finance records
- Sandbox test transaction completes end-to-end

---

### EPIC-WEB-01: Web Foundation

---

**TASK-WEB-01-01: Design Token Integration**

- **Objective:** Wire the Visual Design System tokens into the Next.js app as CSS custom properties
- **Description:** Create `apps/web/styles/tokens.css` with all design tokens from VISUAL_DESIGN_SYSTEM_P1.md: color tokens (`--color-brand-50` through `--color-brand-900`, neutral scale, semantic colors), spacing tokens (`--space-px` through `--space-32`), typography tokens, shadow tokens, border-radius tokens, animation tokens. Import in `app/layout.tsx`. Update `tailwind.config.ts` to reference CSS custom properties for color palette. Add dark mode token overrides under `[data-theme="dark"]` selector.
- **Dependencies:** None
- **Inputs:** VISUAL_DESIGN_SYSTEM_P1.md (complete token table)
- **Outputs:** `apps/web/styles/tokens.css`, updated `tailwind.config.ts`
- **Acceptance Criteria:**
  - `var(--color-brand-600)` resolves to `#2C5FFF` in browser
  - Tailwind classes `bg-brand-600` work correctly
  - Dark mode tokens apply when `data-theme="dark"` on `<html>`
  - All token names match the design system exactly
- **Risks:** None
- **Effort:** 0.5 day
- **Priority:** P0

---

**TASK-WEB-01-02: i18n Setup (Arabic RTL)**

- **Objective:** Configure next-intl for Arabic and English with full RTL support
- **Description:** Install `next-intl`. Update `next.config.mjs` to configure `i18n` with locales `['ar', 'en']`, `defaultLocale: 'ar'`. Create `middleware.ts` for locale detection (accept-language header first, URL prefix second). Implement `dir` attribute on `<html>` (`rtl` for Arabic, `ltr` for English). Update `apps/web/messages/ar.json` and `apps/web/messages/en.json`. Implement `useLocale()` hook wrapper. Verify existing `[locale]` route group works correctly.
- **Dependencies:** TASK-WEB-01-01
- **Inputs:** Existing `messages/ar.json`, `messages/en.json`, existing `[locale]` route structure
- **Outputs:** `middleware.ts`, updated `next.config.mjs`, functional `useTranslations()` in all pages
- **Acceptance Criteria:**
  - `https://stayos.com/ar/` renders right-to-left
  - `https://stayos.com/en/` renders left-to-right
  - Locale persists via cookie across page navigations
  - Arabic number formatting uses Eastern Arabic numerals where specified
- **Risks:** next-intl 3.x API — verify compatibility with Next.js 14 App Router
- **Effort:** 1 day
- **Priority:** P0

---

**TASK-WEB-01-03: API Client Layer**

- **Objective:** Create a typed, authenticated HTTP client for all API calls
- **Description:** Install `@tanstack/react-query` and create `apps/web/lib/api/client.ts`. Implement base fetch wrapper with: automatic JWT Bearer header injection (from cookie/localStorage), automatic token refresh on 401 (call `/auth/refresh`, retry original request), typed error handling (`ApiError` class with `code` and `message_ar`), request/response logging in development. Create typed query hooks for each domain: `useListings()`, `useReservation()`, `useCurrentUser()`, etc. Configure `QueryClientProvider` in `app/layout.tsx`.
- **Dependencies:** TASK-WEB-01-02
- **Inputs:** Existing API contracts (FastAPI OpenAPI spec at `/docs`)
- **Outputs:** `apps/web/lib/api/client.ts`, `apps/web/lib/api/hooks/` directory with per-domain hooks
- **Acceptance Criteria:**
  - `const { data } = useListings({ filters })` works in a page component
  - Token refresh happens transparently on 401
  - Arabic error message (`message_ar`) surfaces in UI
  - TypeScript types derived from API response shapes (no `any`)
- **Risks:** JWT stored in httpOnly cookie (recommended) vs localStorage — decide and document
- **Effort:** 1.5 days
- **Priority:** P0

---

**TASK-WEB-01-04: State Management Setup**

- **Objective:** Install and configure client-side state management
- **Description:** Install `zustand`. Create stores: `useAuthStore` (current user, JWT token, logout action), `useSearchStore` (search params: location, dates, guests — persisted to URL searchParams), `useUIStore` (modal open states, locale preference, theme). Server state (API data) is handled by React Query from TASK-WEB-01-03. Client state (UI, auth) handled by Zustand.
- **Dependencies:** TASK-WEB-01-03
- **Inputs:** None
- **Outputs:** `apps/web/stores/` directory with 3 stores
- **Acceptance Criteria:**
  - Auth state persists across page refreshes (from cookie)
  - Search params sync to URL (shareable search links)
  - Logout clears all state and cookie
- **Risks:** None
- **Effort:** 0.5 day
- **Priority:** P0

---

**TASK-WEB-01-05: Component Library Foundation**

- **Objective:** Build the base component set used across all 81 screens
- **Description:** Implement 15 base components from VISUAL_DESIGN_SYSTEM_P3.md: Button (6 variants × 5 sizes × 6 states), TextInput (with error, label, RTL support), PhoneInput (country code selector + E.164), OTPInput (6-box with auto-advance), DateRangePicker (calendar picker), GuestSelector, PropertyCard (full, compact variants), Badge/Tag (12 status variants), Modal, BottomSheet (mobile breakpoint), Toast/Snackbar, SkeletonLoader, EmptyState, StarRating, Avatar. All components: TypeScript strict, RTL-aware, dark mode supported, WCAG AA compliant.
- **Dependencies:** TASK-WEB-01-01 (tokens)
- **Inputs:** VISUAL_DESIGN_SYSTEM_P3.md (exact specifications for all components)
- **Outputs:** `apps/web/components/ui/` directory — 15 production-ready components
- **Acceptance Criteria:**
  - All components render correctly in Storybook (install Storybook)
  - RTL layout mirrors correctly (logical CSS properties)
  - Dark mode works for all components
  - Button loading state disables interaction
  - OTPInput auto-advances on digit entry and handles paste
- **Risks:** This is the highest-effort foundation task — prioritize correctness over completeness; add components iteratively
- **Effort:** 4 days
- **Priority:** P0

---

### EPIC-WEB-02: Authentication & KYC (Web)

---

**TASK-WEB-02-01: Phone Input & OTP Screens**

- **Objective:** Implement phone number entry and OTP verification UI
- **Description:** Create `app/[locale]/auth/page.tsx` (phone input) and `app/[locale]/auth/verify/page.tsx` (OTP entry). Phone screen: country dial code selector (default +20 Egypt), E.164 validation, submit calls `POST /auth/otp/send`, Arabic error messages. OTP screen: 6-box auto-advance input, 60-second countdown timer, resend button, auto-submit on 6th digit, calls `POST /auth/otp/verify`, stores JWT in httpOnly cookie on success, redirects to KYC if kyc_status is pending.
- **Dependencies:** TASK-WEB-01-05 (PhoneInput, OTPInput components), TASK-WEB-01-03 (API client)
- **Inputs:** VISUAL_DESIGN_SYSTEM_P2.md Login and OTP screen specs
- **Outputs:** Two production pages
- **Acceptance Criteria:**
  - OTP received on real phone number in staging
  - Countdown timer shows "أعد الإرسال بعد 00:45"
  - Wrong OTP shows Arabic error inline (not toast)
  - After 3 failed attempts: form locked for 5 minutes
  - Successful auth: JWT set in cookie, redirect to intended destination
- **Risks:** Rate limit on staging OTP — use test phone numbers
- **Effort:** 1.5 days

---

**TASK-WEB-02-02: Social Authentication (Google/Apple)**

- **Objective:** Implement Firebase social auth buttons
- **Description:** Install `firebase` client SDK. Add Google Sign-In and Apple Sign-In buttons below the phone input. On Firebase token received, call `POST /api/v1/auth/firebase` to exchange for StayOS JWT. Handle error case where Firebase email is already registered via phone (merge accounts prompt).
- **Dependencies:** TASK-WEB-02-01, Firebase web SDK config
- **Inputs:** Firebase project config (public values: projectId, apiKey, authDomain)
- **Outputs:** Working Google and Apple sign-in in staging
- **Acceptance Criteria:**
  - Google sign-in completes and returns StayOS JWT
  - Apple sign-in completes (requires Apple Developer account)
  - New social user is created in DB with correct role (guest by default)
- **Risks:** Apple Sign-In requires app running on registered domain — configure in Apple Developer console
- **Effort:** 1 day

---

**TASK-WEB-02-03: KYC Wizard (4-Step)**

- **Objective:** Implement the KYC identity verification wizard for new users
- **Description:** Create 4-step wizard at `app/[locale]/kyc/`. Step 1: Document type selection (National ID, Passport). Step 2: Front photo upload (use S3 presigned URL from `POST /kyc/initiate`). Step 3: Back photo upload (National ID only). Step 4: Selfie / face match. Progress bar shows step completion. After upload, call `POST /kyc/documents/{id}/submit`. Show processing state. Poll KYC status every 10 seconds or use WebSocket notification. On `verified`: redirect to intended destination.
- **Dependencies:** TASK-WEB-02-01, TASK-BE-01-01 (photo upload pattern exists in KYC), camera access API
- **Inputs:** VISUAL_DESIGN_SYSTEM_P2.md KYC Wizard spec
- **Outputs:** KYC wizard pages, camera integration
- **Acceptance Criteria:**
  - Camera capture works on desktop (file upload) and mobile browser (camera)
  - Upload progress shown during S3 PUT
  - KYC processing screen shows animated waiting state
  - Approved/rejected states handled with correct UI
  - User cannot access booking until KYC is verified (enforced by backend and frontend route guard)
- **Risks:** Browser camera API requires HTTPS — staging must have valid SSL
- **Effort:** 2 days

---

### EPIC-WEB-03: Search & Discovery (Web)

---

**TASK-WEB-03-01: Home Page**

- **Objective:** Build the landing page with search initiation
- **Description:** Implement `app/[locale]/page.tsx` with: hero section (city background image, search widget — location autocomplete, date range picker, guest count), featured listings carousel (6 listings from `GET /listings?featured=true`), how-it-works section, trust signals. Search widget submission navigates to `/search?location=...&checkin=...&checkout=...&guests=...`.
- **Dependencies:** TASK-WEB-01-05, TASK-WEB-03-03 (search URL structure), Google Places Autocomplete
- **Inputs:** VISUAL_DESIGN_SYSTEM_P2.md Home/Landing spec
- **Effort:** 2 days

---

**TASK-WEB-03-02: Search Results with List View**

- **Objective:** Display search results as a paginated list with filters
- **Description:** Implement `app/[locale]/search/page.tsx`. Read search params from URL. Call `GET /api/v1/listings` with filters. Display: PropertyCard grid (2 col desktop, 1 col mobile), sort controls (price, rating, distance), results count. Filter drawer: price range slider, property type, amenities, bedrooms, bathrooms, instant book toggle. Skeleton loading while fetching. "No results" empty state with suggestions. Infinite scroll or pagination.
- **Dependencies:** TASK-WEB-01-05, TASK-WEB-01-03
- **Inputs:** VISUAL_DESIGN_SYSTEM_P2.md Search Results spec
- **Effort:** 3 days

---

**TASK-WEB-03-03: Search Results Map View**

- **Objective:** Display search results on an interactive Google Map
- **Description:** Install `@vis.gl/react-google-maps`. Implement map toggle from list view. Render property pins on map (custom pin with price). Cluster overlapping pins. On pin hover: show mini property card. On pin click: navigate to property detail. Viewport-based search: when map moves, trigger new API call with bounding box params. Map shows Google Maps tiles with Arabic labels (language parameter).
- **Dependencies:** TASK-WEB-03-02, Google Maps API key in env, backend map-view endpoint (GAP-C7)
- **Inputs:** Google Maps JavaScript API, VISUAL_DESIGN_SYSTEM_P2.md map section
- **Effort:** 3 days

---

**TASK-WEB-03-04: Property Detail Page**

- **Objective:** Build the full property detail page
- **Description:** Implement `app/[locale]/listings/[id]/page.tsx`. Sections: photo gallery (lightbox, swipe), property title and highlights, host info card, description (Arabic primary, toggle English), amenities grid, location map (static embed), reviews carousel, availability calendar (read-only month view), pricing breakdown, sticky booking widget (sidebar on desktop, bottom sheet on mobile). The booking widget shows price and opens checkout flow.
- **Dependencies:** TASK-WEB-03-02, Google Maps static embed
- **Inputs:** VISUAL_DESIGN_SYSTEM_P2.md Property Detail spec
- **Effort:** 3 days

---

### EPIC-WEB-04 through WEB-09: Remaining Web Screens

> These epics follow the same task structure as above. Full task detail omitted for brevity; effort estimates are binding.

| Epic | Screens | Key Dependencies | Effort |
|---|---|---|---|
| WEB-04: Checkout & Payments | 5 screens (trip summary, guest details, payment method, Paymob iframe, confirmation) | TASK-BE-01-04, WEB-03 | 5 days |
| WEB-05: Guest Dashboard | 5 screens (home, reservation detail, cancellation, profile, KYC status) | WEB-02, WEB-04 | 4 days |
| WEB-06: Host Portal | 12 screens (listing creation wizard 9-step, photo upload, calendar, pricing, dashboard, reservation management, profile) | TASK-BE-01-01, WEB-02 | 10 days |
| WEB-07: Admin Portal | 15 screens (KPI dashboard, user management, KYC review queue, listing moderation, financial reconciliation, operations dashboard, dispute management) | EPIC-BE-03, WEB-02 | 12 days |
| WEB-08: Messaging & Notifications | 4 screens (inbox list, conversation, notification center, preferences) | EPIC-BE-02, WEB-05 | 4 days |

---

### EPIC-MOB-01: Mobile Foundation

---

**TASK-MOB-01-00: Mobile Framework Decision [DEC-OPEN-1]**

- **Objective:** Choose between Flutter and React Native before any mobile code is written
- **Description:** Decision criteria: team's existing expertise, P4/P5 documentation covers both equally. **Recommendation: Flutter** — single codebase, better performance on MENA mid-range Android devices, MOBILE_NATIVE_DESIGN_P4.md provides complete Flutter widget mapping. This decision must be made and committed to before Sprint 0 Day 1. Once chosen, never revisit.
- **Effort:** 2 hours decision meeting
- **Priority:** P0 CRITICAL BLOCKER

---

**TASK-MOB-01-01: Project Initialization (Flutter)**

- **Objective:** Initialize Flutter project with full dependency tree from MOBILE_NATIVE_DESIGN_P4.md
- **Description:** Run `flutter create stayos_mobile`. Configure: `go_router` for navigation (GoRouter with named routes matching all screens), `flutter_riverpod` for state management (or `bloc` per DEC-OPEN-5), `dio` for HTTP client, `hive` for local storage, `flutter_secure_storage` for JWT token, `firebase_messaging` for push, `firebase_auth` for social auth, `google_maps_flutter` for maps, `table_calendar`, `shimmer`, `lottie`, `photo_view`, `image_picker`, `camera`, `local_auth` for biometrics, `url_launcher` for deep links. Set up `assets/fonts/` with Cairo (Arabic) and Inter (Latin) from Google Fonts. Configure Android and iOS app IDs (com.stayos.app).
- **Dependencies:** Flutter SDK installed, DEC-OPEN-1 resolved
- **Inputs:** `pubspec.yaml` package list from MOBILE_NATIVE_DESIGN_P4.md Flutter mapping tables
- **Outputs:** `apps/mobile/` directory with runnable Flutter app on iOS Simulator and Android Emulator
- **Acceptance Criteria:**
  - `flutter run` succeeds on both platforms without errors
  - All packages in pubspec.yaml resolve without conflicts
  - Bundle ID set to `com.stayos.app` (iOS) and `com.stayos.app` (Android)
  - App icon placeholder configured (will be replaced in Sprint 8)
- **Risks:** google_maps_flutter requires API key in `AndroidManifest.xml` and `AppDelegate.swift` — add keys in Sprint 0
- **Effort:** 1 day
- **Priority:** P0

---

**TASK-MOB-01-02: Mobile Design Token Implementation**

- **Objective:** Implement design system tokens as Flutter ThemeData and constants
- **Description:** Create `lib/core/theme/` with: `app_colors.dart` (all color tokens from VISUAL_DESIGN_SYSTEM_P1.md as `Color` constants), `app_typography.dart` (all type scale tokens using Inter + Cairo fonts, mapped to `TextStyle`), `app_spacing.dart` (all spacing constants as `double`), `app_theme.dart` (MaterialApp ThemeData with light and dark themes, Arabic locale), `app_radius.dart`, `app_shadows.dart`. Override `MediaQuery.textScaleFactor` to clamp Dynamic Type.
- **Dependencies:** TASK-MOB-01-01
- **Inputs:** VISUAL_DESIGN_SYSTEM_P1.md token tables, MOBILE_NATIVE_DESIGN_P1.md grid system
- **Outputs:** `lib/core/theme/` with 6 files
- **Acceptance Criteria:**
  - `AppColors.brand600` equals `Color(0xFF2C5FFF)`
  - Arabic locale displays Cairo font on all text
  - Dark theme applies correct surface tokens
  - Text does not overflow at 200% text scale
- **Effort:** 1 day

---

**TASK-MOB-01-03: Navigation Shell**

- **Objective:** Build the persistent bottom navigation and routing architecture
- **Description:** Implement GoRouter with 5 bottom-nav destinations: Explore (Home), Search, Trips (Guest), Messages, Profile. `ScaffoldWithNavBar` wrapper persists nav bar. `StatefulShellRoute.indexedStack` maintains tab state. Deep link URL scheme: `stayos://listing/{id}`, `stayos://reservation/{id}`, `stayos://conversation/{id}`. All routes defined in `app_router.dart`. Route guards: unauthenticated users redirect to Auth, unverified KYC redirects to KYC wizard.
- **Dependencies:** TASK-MOB-01-01, TASK-MOB-01-02
- **Inputs:** MOBILE_NATIVE_DESIGN_P3.md Deep Link URL Scheme table, iOS/Android navigation specs from P4
- **Outputs:** Full navigation graph, route guards, deep link handlers
- **Acceptance Criteria:**
  - Tab switching preserves scroll position (IndexedStack)
  - Back gesture (Android predictive back) works correctly
  - Deep link `stayos://listing/123` opens PropertyDetail directly
  - Unauthenticated deep link: saves destination, opens auth, redirects after login
- **Effort:** 1.5 days

---

**TASK-MOB-01-04: API Client and Repository Layer**

- **Objective:** Create typed HTTP client with JWT auth and offline queue
- **Description:** Create `lib/core/api/` with: `api_client.dart` (Dio client with baseUrl, JWT interceptor, 401 refresh interceptor), `api_error.dart` (typed error model with Arabic message), one repository class per domain (AuthRepository, ListingRepository, ReservationRepository, FinanceRepository, MessagingRepository). Implement offline queue: `lib/core/offline/sync_queue.dart` using Hive to persist failed writes and retry on connectivity restore.
- **Dependencies:** TASK-MOB-01-01
- **Inputs:** API base URL from staging, existing API contracts
- **Outputs:** `lib/core/api/` and `lib/core/offline/` directories
- **Acceptance Criteria:**
  - API calls include `Authorization: Bearer {token}` header
  - 401 response triggers silent token refresh and retries
  - Network error stores request in Hive sync queue
  - On connectivity restore, sync queue processes in order
- **Effort:** 2 days

---

**TASK-MOB-01-05: Splash Screen and App Lifecycle**

- **Objective:** Implement iOS and Android splash screens and cold start behavior
- **Description:** iOS: configure `LaunchScreen.storyboard` per MOBILE_NATIVE_DESIGN_P5.md App Icon spec (blue `#2C5FFF` background, white S mark). Android: configure `launch_background.xml` and Android 12+ `SplashScreen` API. Cold start sequence: show splash (0ms), initialize DI and routing (400ms), check JWT validity (600ms), navigate to appropriate screen (800ms), dismiss splash (900ms). Background launch from push notification: restore to correct screen via deep link.
- **Dependencies:** TASK-MOB-01-03
- **Inputs:** MOBILE_NATIVE_DESIGN_P5.md splash screen spec
- **Effort:** 1 day

---

### EPIC-MOB-02 through MOB-10: Remaining Mobile Screens

> All screens follow the Flutter component mapping in MOBILE_NATIVE_DESIGN_P4.md. Full task detail omitted; effort estimates from MOBILE_NATIVE_DESIGN_P5.md Engineering Handoff are binding.

| Epic | Screens | Key Dependencies | Effort |
|---|---|---|---|
| MOB-02: Auth & KYC | Phone, OTP, Firebase, KYC wizard (4-step + camera), biometric setup | TASK-MOB-01-04, TASK-BE-01-02 | 6 days |
| MOB-03: Search & Map | Home, Search + filters, Map view, Property detail, Photo gallery | TASK-MOB-01-03, Google Maps | 8 days |
| MOB-04: Property Detail + Calendar | Property detail (all sections), Calendar picker with drag-to-select | TASK-MOB-03 | 4 days |
| MOB-05: Checkout & Payments | Checkout 3-step, Payment method selector, Paymob WebView, Booking confirmation + confetti | TASK-BE-01-04 | 6 days |
| MOB-06: Guest Dashboard | Trips (upcoming/past), Trip detail, Cancellation flow, Profile, Saved listings | TASK-MOB-05 | 5 days |
| MOB-07: Host Dashboard | Host dashboard, Listing management, Calendar management, Earnings screen | TASK-MOB-05, TASK-BE-01-01 | 8 days |
| MOB-08: Messaging & Push | FCM setup, Push notification handling, Messaging inbox, Chat screen (WebSocket) | EPIC-BE-02, TASK-BE-04-01 | 7 days |
| MOB-09: Offline Support | Offline banner, Cached listing browsing, Sync queue UI, Reconnect animation | TASK-MOB-01-04 | 4 days |
| MOB-10: App Store Readiness | App icon (all sizes), Screenshots (3 device sizes × 8), Privacy manifest, App Store metadata | Sprint 7 design approval | 4 days |

---

### EPIC-QA-01: E2E Test Infrastructure

---

**TASK-QA-01-01: Playwright Setup and Test Data Factory**

- **Objective:** Initialize E2E test framework with fixture-based test data
- **Description:** Install Playwright in `apps/web/`. Configure for Chromium, Firefox, and WebKit. Create `tests/fixtures/` with: `createUser(role)`, `createListing(hostId)`, `createReservation(guestId, listingId)` factory functions that call API directly (not UI) to seed test state. Create shared auth fixture that logs in a user and provides authenticated context. Configure test to run against staging URL in CI.
- **Dependencies:** Staging API accessible from CI runner
- **Inputs:** Playwright docs, existing test data patterns from backend `tests/conftest.py`
- **Outputs:** `apps/web/tests/` with Playwright config and factory functions
- **Acceptance Criteria:**
  - `npx playwright test` runs without configuration errors
  - Auth fixture creates and logs in a real user end-to-end
  - Tests clean up created data after each run
- **Effort:** 1 day

---

**TASK-QA-01-02 through QA-01-05: E2E Test Suites**

| Task | Coverage | Effort |
|---|---|---|
| QA-01-02: Auth E2E | Phone → OTP → KYC → Redirect, Social auth, Rate limit | 1.5 days |
| QA-01-03: Booking E2E | Search → Property → Checkout → Payment → Confirmation | 2 days |
| QA-01-04: Host Flow E2E | Create listing → Upload photos → Set calendar → Approve guest | 2 days |
| QA-01-05: Load Tests (k6) | Calendar concurrency (100 concurrent bookings same unit), Search (500 RPS), Checkout (50 RPS) | 2 days |

---

## SECTION 4 — Sprint Breakdown

### Sprint 0 — Foundation (Weeks 1–2)

**Goal:** All teams can develop against a running staging environment. No feature is blocked on Day 1 of Sprint 1.

| Track | Stories | Tasks |
|---|---|---|
| DevOps | Provision staging infra | TASK-INFRA-01-01 through 01-05 |
| Backend | Close all P0 gaps | TASK-BE-01-01 through BE-01-04, TASK-BE-04-01 |
| Web | Foundation setup | TASK-WEB-01-01 through WEB-01-05 |
| Mobile | Project init + foundation | TASK-MOB-01-00 through MOB-01-05 |
| QA | Framework setup | TASK-QA-01-01 |
| Security | File upload validation plan | GAP-F3 analysis |
| Release | App Store accounts | GAP-F9, GAP-F10 |

**Definition of Done:**
- [ ] Staging API live at `https://api-staging.stayos.com/health` returning `{"status": "ok"}`
- [ ] All 10 Alembic migrations complete on staging DB
- [ ] Listing photo upload API passes acceptance criteria
- [ ] Paymob iframe URL returned in reservation creation response
- [ ] FCM device token endpoint deployed to staging
- [ ] Email delivery working (real email received from staging)
- [ ] Next.js app renders at Vercel preview URL with correct design tokens
- [ ] Arabic RTL working in Next.js app
- [ ] Flutter app runs on iOS Simulator and Android Emulator
- [ ] Flutter navigation shell: 5 tabs navigable
- [ ] Mobile framework decision (DEC-OPEN-1) committed and documented
- [ ] Email provider decision (DEC-OPEN-2) committed
- [ ] Analytics provider decision (DEC-OPEN-3) committed
- [ ] Open decisions DEC-OPEN-4, 5, 6 resolved

**Blocked by:** AWS account access, Firebase project, Twilio account, Paymob sandbox, Meta WhatsApp API access  
**Owner:** Engineering Manager  
**Duration:** 2 weeks

---

### Sprint 1 — Authentication (Weeks 3–4)

**Goal:** Users can register and authenticate on all three platforms (Web, iOS, Android).

| Track | Stories |
|---|---|
| Backend | Messaging data model (TASK-BE-02-01), Admin user management API (TASK-BE-03-01) |
| Web | Phone + OTP screens (TASK-WEB-02-01), Social auth (TASK-WEB-02-02), KYC wizard (TASK-WEB-02-03) |
| Mobile | Auth screens (EPIC-MOB-02: all tasks) |
| DevOps | Monitoring alerts setup, Mobile CI pipeline (GAP-F1) |
| QA | Auth E2E tests (TASK-QA-01-02) |
| Security | File upload validation implementation (GAP-F3) |

**Definition of Done:**
- [ ] User can register via phone OTP on Web (Playwright test passes)
- [ ] User can register via phone OTP on iOS (manual test on device)
- [ ] User can register via phone OTP on Android (manual test on device)
- [ ] KYC wizard completes end-to-end with real document photo
- [ ] AWS Textract returns extracted ID data in staging
- [ ] JWT stored securely on all platforms
- [ ] Rate limiting blocks OTP abuse (test: 6th OTP send rejected)
- [ ] Mobile CI pipeline runs on every PR
- [ ] Auth E2E tests green in CI

**Blocked by:** Sprint 0 complete  
**Owner:** Backend Lead + Web Lead + Mobile Lead  
**Duration:** 2 weeks

---

### Sprint 2 — Search & Discovery (Weeks 5–6)

**Goal:** Authenticated users can search for properties, see results on a map, and view property details.

| Track | Stories |
|---|---|
| Backend | Map-view endpoint (GAP-C7), Admin listing moderation (TASK-BE-03-02), Messaging WebSocket start (TASK-BE-02-02) |
| Web | Home page (TASK-WEB-03-01), Search results (TASK-WEB-03-02), Map view (TASK-WEB-03-03), Property detail (TASK-WEB-03-04) |
| Mobile | Search + map + property detail (EPIC-MOB-03 + MOB-04) |
| DevOps | CloudFront CDN (GAP-A7), WAF rules (GAP-F2) |
| QA | Search E2E (manual) |

**Definition of Done:**
- [ ] Search returns geo-filtered results within 500ms on staging
- [ ] Map view renders property pins with correct coordinates
- [ ] Property detail page loads with photos (served via CloudFront)
- [ ] Date availability calendar correctly blocks unavailable dates
- [ ] Arabic search works (Arabic text in search bar returns results)
- [ ] CloudFront distribution serving S3 photos < 100ms response time in me-south-1
- [ ] WAF OWASP managed rule group active on ALB

**Blocked by:** Sprint 1, Google Maps API key configured  
**Owner:** Web Lead + Mobile Lead  
**Duration:** 2 weeks

---

### Sprint 3 — Booking & Payments (Weeks 7–8) → ALPHA MILESTONE

**Goal:** Complete booking flow from search to payment confirmation. Alpha milestone reached.

| Track | Stories |
|---|---|
| Backend | Messaging WebSocket complete (TASK-BE-02-02), Fawry + Meeza integration (TASK-BE-05-01/02), Admin KPI dashboard (TASK-BE-03-03) |
| Web | Checkout flow (EPIC-WEB-04 all tasks) |
| Mobile | Checkout + payment (EPIC-MOB-05 all tasks) |
| DevOps | Payment webhook staging verification |
| QA | Booking E2E (TASK-QA-01-03), Calendar concurrency test |
| Security | Payment flow security review |

**Definition of Done:**
- [ ] Guest can complete booking: Search → Property → Checkout → Paymob payment → Confirmation
- [ ] Payment recorded in finance ledger with correct amounts
- [ ] Escrow created after payment confirmation
- [ ] Host notified via WhatsApp on new booking
- [ ] Guest notified via WhatsApp on booking confirmation
- [ ] Calendar blocks dates after confirmed booking
- [ ] Concurrent booking attempt on same dates returns ConflictError (409)
- [ ] Booking E2E Playwright test green
- [ ] Fawry payment completes in sandbox
- [ ] Meeza payment completes in sandbox

**ALPHA RELEASE CHECKLIST:**
- [ ] Auth flow ✓
- [ ] Search + Discovery ✓
- [ ] Booking + Payment ✓
- [ ] Internal team testing only (no external users)

**Blocked by:** Sprint 2, Paymob sandbox integration IDs for Fawry and Meeza  
**Owner:** Full team  
**Duration:** 2 weeks

---

### Sprint 4 — Guest & Host Portals (Weeks 9–10)

**Goal:** Full guest dashboard and host portal functional. Hosts can list properties end-to-end.

| Track | Stories |
|---|---|
| Backend | Admin financial reconciliation (TASK-BE-03-04), FCM push notifications wired to events |
| Web | Guest dashboard (EPIC-WEB-05), Host portal (EPIC-WEB-06) |
| Mobile | Guest dashboard (EPIC-MOB-06), Host dashboard (EPIC-MOB-07 start) |
| DevOps | PgBouncer setup (GAP-A8), Production Terraform plan |
| QA | Dashboard E2E tests, Mobile testing setup (EPIC-QA-05) |
| Security | Terms acceptance tracking (GAP-F6), Compliance review |

**Definition of Done:**
- [ ] Host can create listing with photos end-to-end (9-step wizard)
- [ ] Host can set calendar availability and pricing rules
- [ ] Guest can view upcoming and past reservations
- [ ] Guest can initiate cancellation with correct refund calculation shown
- [ ] Push notification received on iOS physical device (new booking)
- [ ] Push notification received on Android physical device
- [ ] PgBouncer active for staging DB connections
- [ ] Terms acceptance endpoint deployed and called on first login

**ALPHA INTERNAL TEST:** Release to internal team (5–10 people). Collect feedback.

**Blocked by:** Sprint 3, Apple Developer account for APNs  
**Owner:** Web Lead + Mobile Lead  
**Duration:** 2 weeks

---

### Sprint 5 — Admin & Operations (Weeks 11–12)

**Goal:** Admin portal fully functional. Operations team can manage the platform.

| Track | Stories |
|---|---|
| Backend | Analytics backend events (GAP-C9), Vodafone Cash + InstaPay integration (TASK-BE-05-03/04) |
| Web | Admin portal (EPIC-WEB-07 all tasks) |
| Mobile | Host dashboard complete (EPIC-MOB-07 complete), Offline support (EPIC-MOB-09 start) |
| DevOps | Production Terraform apply, production secrets |
| QA | Admin flow tests, Mobile testing active |

**Definition of Done:**
- [ ] Admin can approve/reject KYC from review queue
- [ ] Admin can approve/reject listing from moderation queue
- [ ] Admin can ban user with reason
- [ ] Admin KPI dashboard loads in < 500ms with real data
- [ ] Admin can view financial transactions and trigger manual payouts
- [ ] Vodafone Cash payment completes in sandbox
- [ ] InstaPay payment completes in sandbox
- [ ] Production infrastructure exists (not yet receiving traffic)
- [ ] Analytics events firing for: booking start, booking complete, listing view, search performed

**Blocked by:** Sprint 4  
**Owner:** Web Lead + Backend Lead  
**Duration:** 2 weeks

---

### Sprint 6 — Messaging & Notifications (Weeks 13–14) → BETA MILESTONE

**Goal:** Full messaging and notification system live. Beta release to external testers.

| Track | Stories |
|---|---|
| Backend | Email templates completed, notification system refinements |
| Web | Messaging & notifications (EPIC-WEB-08 all tasks) |
| Mobile | Messaging + push (EPIC-MOB-08 all tasks), Offline support complete (EPIC-MOB-09) |
| DevOps | Auto-scaling verification, CloudWatch dashboard |
| QA | Notification E2E tests, messaging tests |
| Security | WAF tuning based on real traffic patterns |

**Definition of Done:**
- [ ] Host and guest can exchange real-time messages in web app
- [ ] Host and guest can exchange real-time messages in mobile app
- [ ] WhatsApp notification sent for new message (when recipient offline)
- [ ] Push notification sent for new message (when recipient offline)
- [ ] Email confirmation sent for booking (SES delivery confirmed)
- [ ] Notification center shows read/unread state correctly
- [ ] WebSocket reconnects automatically on connection loss
- [ ] Offline message queue sends pending messages on reconnect

**BETA RELEASE CHECKLIST:**
- [ ] All P0 features complete
- [ ] All P1 features complete
- [ ] TestFlight (iOS) external beta link
- [ ] Google Play Open Testing track
- [ ] Web beta deployed to production URL (limited invite)

**Blocked by:** Sprint 5  
**Owner:** Full team  
**Duration:** 2 weeks

---

### Sprint 7 — Hardening (Weeks 15–16)

**Goal:** All features complete. System hardened, performance verified, accessibility checked.

| Track | Stories |
|---|---|
| Backend | Bug fixes from beta feedback, query optimization |
| Web | RTL verification audit, accessibility audit (no design changes — implementation fixes only), bug fixes |
| Mobile | Animation polish, haptic feedback, accessibility labels, bug fixes |
| DevOps | Load testing (k6 — 500 concurrent users), auto-scaling stress test, backup verification |
| QA | Full regression suite, load tests (EPIC-QA-03), UAT sign-off |
| Security | External penetration test (contractor), findings remediation |

**Definition of Done:**
- [ ] k6 load test: 500 concurrent users with 0% error rate on core flows
- [ ] Calendar concurrency test: 100 simultaneous booking attempts on same unit — exactly 1 succeeds
- [ ] Penetration test complete, no Critical/High findings unresolved
- [ ] Playwright full regression: 100% pass rate
- [ ] Web Lighthouse score > 85 on mobile (Performance, Accessibility, Best Practices)
- [ ] Arabic RTL verified on all 81 screens (manual checklist)
- [ ] All beta feedback critical issues resolved
- [ ] Database backup restore verified (restore test completed)

**Blocked by:** Sprint 6 complete  
**Owner:** QA Director + Security  
**Duration:** 2 weeks

---

### Sprint 8 — Release Candidate (Weeks 17–18)

**Goal:** Production-ready build. App Store submissions. RC sign-off.

| Track | Stories |
|---|---|
| Backend | Critical bug fixes only (no new features) |
| Web | Critical bug fixes only, production deployment rehearsal |
| Mobile | App Store submission (TestFlight → Review, Google Play Internal → Production) (EPIC-MOB-10) |
| DevOps | Production cutover checklist, traffic routing verification, rollback plan |
| QA | Sign-off regression (full suite on production infra), RC approval sign-off |
| Security | Final security sign-off |
| Release | Release notes, support documentation |

**Definition of Done:**
- [ ] App submitted to Apple App Store Review (processing time: 1–3 days)
- [ ] App submitted to Google Play production review
- [ ] Web production deployment complete at `https://stayos.com`
- [ ] API production deployment complete at `https://api.stayos.com`
- [ ] `GET https://api.stayos.com/health` returns `{"status": "ok"}`
- [ ] All smoke tests pass against production
- [ ] QA Director sign-off document completed
- [ ] Rollback plan documented and tested

**Blocked by:** Sprint 7 sign-off  
**Owner:** Engineering Manager + Release Manager  
**Duration:** 2 weeks

---

### Sprint 9 — Production (Weeks 19–20)

**Goal:** Live in production. Monitor, respond, stabilize.

| Track | Stories |
|---|---|
| All | Monitor production metrics (Prometheus, Sentry, CloudWatch) |
| Mobile | App Store approval tracking (App Store review: 1–3 days buffer) |
| DevOps | Traffic cutover, DNS TTL management, CloudFront cache warming |
| QA | Production smoke tests every 4 hours |
| Backend | Hotfix response team on-call |

**Definition of Done:**
- [ ] App live in App Store for iOS
- [ ] App live in Google Play for Android
- [ ] Web live at `https://stayos.com`
- [ ] Error rate < 0.1% over 24 hours
- [ ] P95 API response time < 300ms
- [ ] Payment success rate > 98%
- [ ] Zero P0 incidents for 48 hours = PRODUCTION LAUNCH ✓

---

## SECTION 5 — Dependency Graph

```
                    ┌─────────────────────────────────┐
                    │     DEC-OPEN-1 (Mobile Framework)│
                    │     DEC-OPEN-2 (Email Provider)  │
                    │     DEC-OPEN-3 (Analytics)       │ ← Must resolve BEFORE Sprint 0 Day 1
                    │     DEC-OPEN-4 (WS vs SSE)       │
                    │     DEC-OPEN-5 (Mobile State)    │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────▼───────────────────┐
              │           SPRINT 0 — FOUNDATION         │
              │  ┌──────────────┐  ┌─────────────────┐ │
              │  │ INFRA-01-01  │  │  BE P0 Gaps      │ │
              │  │ (Terraform)  │  │  (photo, push,   │ │
              │  │              │  │   email, Paymob)  │ │
              │  └──────┬───────┘  └────────┬─────────┘ │
              │         │                   │            │
              │  ┌──────▼───────┐  ┌────────▼─────────┐ │
              │  │ Staging API  │  │ Web Foundation   │ │
              │  │    LIVE      │  │ Mobile Scaffold  │ │
              │  └──────┬───────┘  └────────┬─────────┘ │
              └─────────┼───────────────────┼────────────┘
                        │                   │
         ┌──────────────▼──────────────┐    │
         │      SPRINT 1 — AUTH        │◄───┘
         │  (Web Auth + Mobile Auth)   │
         │  Depends on: Staging API    │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    SPRINT 2 — SEARCH        │
         │  (Web + Mobile Discovery)   │
         │  Depends on: Auth complete  │
         │  Parallel: Admin API start  │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   SPRINT 3 — BOOKING        │ ← ALPHA
         │  (Checkout + Payments)      │
         │  Depends on: Search done    │
         │  Depends on: Paymob iframe  │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   SPRINT 4 — PORTALS        │
         │  (Guest + Host dashboard)   │
         │  Depends on: Booking done   │
         │  Depends on: Photo upload   │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   SPRINT 5 — ADMIN          │
         │  (Admin portal complete)    │
         │  Depends on: Admin API      │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  SPRINT 6 — MESSAGING       │ ← BETA
         │  (Chat + Notifications)     │
         │  Depends on: WS backend     │
         │  Depends on: FCM provider   │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  SPRINT 7 — HARDENING       │
         │  (Load test + Sec + Perf)   │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  SPRINT 8 — RC              │
         │  (App Store + Prod deploy)  │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  SPRINT 9 — PRODUCTION ✓   │
         └────────────────────────────┘

PARALLEL TRACKS (run simultaneously throughout):
DevOps: Infra → CDN/WAF → PgBouncer → Prod infra → Load tests → Prod cutover
QA: Framework → Auth E2E → Booking E2E → Dashboard tests → Load tests → Regression → Sign-off
Security: Upload validation → WAF → Compliance → Pen test → Sign-off
```

---

## SECTION 6 — Parallel Engineering Tracks

### Track A — Backend

**Engineers:** BE-1 (Auth/Listings/Reservations/Messaging), BE-2 (Finance/Operations/Admin)

| Sprint | BE-1 Focus | BE-2 Focus |
|---|---|---|
| 0 | Photo upload API, Push token endpoint | Paymob iframe URL, Email provider |
| 1 | Messaging data model, WebSocket start | Admin user management API |
| 2 | WebSocket server complete, Map-view endpoint | Admin listing moderation API |
| 3 | Fawry + Meeza integration | Admin KPI dashboard, Financial reconciliation |
| 4 | FCM push provider | Vodafone Cash + InstaPay, Analytics events |
| 5 | Bug fixes, query optimization | Terms tracking, data retention |
| 6 | Email templates | Notification system tuning |
| 7–9 | Critical fixes only | Critical fixes only |

---

### Track B — Flutter (Mobile)

**Engineers:** MOB-1 (Auth/Search/Booking/Payments), MOB-2 (Dashboards/Messaging/Offline)

| Sprint | MOB-1 Focus | MOB-2 Focus |
|---|---|---|
| 0 | Project init, navigation shell, API client | Design tokens, splash screen, local storage |
| 1 | Auth screens (phone, OTP, social) | KYC wizard, biometric auth |
| 2 | Home screen, Search + filters | Map view, property detail, photo gallery |
| 3 | Checkout flow (3 steps) | Paymob WebView, booking confirmation |
| 4 | Guest dashboard, Trips | Host dashboard, listing management |
| 5 | Calendar management (host) | Earnings screen, host listing creation |
| 6 | Messaging inbox, Chat screen | Push notifications, notification center |
| 7 | Animation polish, offline support | Accessibility labels, bug fixes |
| 8 | App Store metadata | App icon, screenshots, submission |
| 9 | Monitor, hotfix | Monitor, hotfix |

---

### Track C — Web Frontend

**Engineers:** FE-1 (Foundation/Auth/Search/Checkout), FE-2 (Dashboards/Admin/Messaging)

| Sprint | FE-1 Focus | FE-2 Focus |
|---|---|---|
| 0 | Tokens, i18n, API client | Component library foundation |
| 1 | Phone + OTP + Social auth | KYC wizard |
| 2 | Home page, Search results list | Map view, property detail |
| 3 | Checkout flow (5 screens) | Paymob iframe integration |
| 4 | Guest dashboard (5 screens) | Host portal start (listing creation wizard) |
| 5 | Host portal complete (calendar, pricing, dashboard) | Admin portal start (KPI dashboard, user mgmt) |
| 6 | Messaging inbox + conversation | Admin portal complete + notification center |
| 7 | RTL audit, Lighthouse fixes | Bug fixes, accessibility fixes |
| 8 | Production deployment | Production smoke tests |
| 9 | Monitor | Monitor |

---

### Track D — DevOps

**Engineer:** DevOps-1

| Sprint | Focus |
|---|---|
| 0 | Terraform staging, secrets, Vercel, ECS task definitions, deploy pipeline |
| 1 | Monitoring alerts, mobile CI pipeline, staging stability |
| 2 | CloudFront CDN, WAF rules, PostGIS tuning |
| 3 | Payment webhook verification, staging load test (light) |
| 4 | PgBouncer, production Terraform plan |
| 5 | Production Terraform apply, production secrets |
| 6 | Auto-scaling configuration, CloudWatch dashboard |
| 7 | Load testing execution (k6), backup restore test |
| 8 | Production cutover preparation, rollback plan |
| 9 | DNS cutover, traffic routing, monitoring |

---

### Track E — QA

**Engineer:** QA-1

| Sprint | Focus |
|---|---|
| 0 | Playwright setup, test data factory, test environment |
| 1 | Auth E2E tests (web + mobile manual) |
| 2 | Search E2E, property detail manual |
| 3 | Booking E2E, concurrency test |
| 4 | Dashboard E2E, mobile regression |
| 5 | Admin portal tests, mobile host flow |
| 6 | Notification tests, messaging tests |
| 7 | Full regression suite, load tests |
| 8 | Sign-off regression, production smoke tests |
| 9 | Production monitoring |

---

### Track F — Security

**Resource:** 0.5 FTE Security Contractor (Sprints 0–8)

| Sprint | Focus |
|---|---|
| 0 | File upload validation design |
| 1 | File upload validation implementation |
| 2 | WAF rules configuration |
| 3 | Payment flow security review |
| 4 | Terms compliance, data retention implementation |
| 5 | Secrets rotation procedure |
| 6 | WAF tuning |
| 7 | External penetration test execution and remediation |
| 8 | Final security sign-off |

---

### Track G — Release Management

**Owner:** Engineering Manager

| Sprint | Focus |
|---|---|
| 0 | App Store accounts (Apple Developer, Google Play Console), app bundle IDs registered |
| 1 | Firebase project configured for both platforms |
| 2 | — |
| 3 | Alpha internal release preparation |
| 4 | Alpha internal release (TestFlight internal, Google Play internal track) |
| 5 | — |
| 6 | Beta release (TestFlight external, Google Play open testing) |
| 7 | Release candidate preparation |
| 8 | App Store submission, production deploy |
| 9 | Launch monitoring, public announcement |

---

## SECTION 7 — Sprint Definitions (Summary)

| Sprint | Weeks | Goal | Milestone | Blocked By |
|---|---|---|---|---|
| 0 | 1–2 | All teams unblocked, staging live | Staging API live | AWS access, all third-party accounts |
| 1 | 3–4 | Auth on all platforms | Auth working | Sprint 0, Apple Developer account |
| 2 | 5–6 | Search + Discovery functional | Search + Map live | Sprint 1, Google Maps API |
| 3 | 7–8 | Booking + Payments complete | **Alpha** | Sprint 2, Paymob sandbox IDs |
| 4 | 9–10 | Guest + Host portals done | Alpha internal testing | Sprint 3, FCM/APNs |
| 5 | 11–12 | Admin portal complete | — | Sprint 4, Admin API |
| 6 | 13–14 | Messaging + Notifications live | **Beta** | Sprint 5, WebSocket backend |
| 7 | 15–16 | System hardened, load tested | — | Sprint 6, Pen test contractor |
| 8 | 17–18 | RC submitted to App Stores | RC | Sprint 7 sign-off |
| 9 | 19–20 | Live in production | **Production** | App Store review (1–3 days) |

---

## SECTION 8 — Release Roadmap

### Alpha (End of Sprint 3 — Week 8)

**Audience:** Internal team only (5–10 people)  
**Scope:** Auth → Search → Booking → Payment (Paymob sandbox)  
**Platforms:** Web (staging URL), iOS (TestFlight internal), Android (internal testing)  
**Required deliverables:**
- [ ] Complete booking flow works end-to-end
- [ ] Paymob sandbox payment completes
- [ ] All P0 backend gaps resolved
- [ ] Auth via OTP works on physical devices

---

### Beta (End of Sprint 6 — Week 14)

**Audience:** External testers (50–100 invited users)  
**Scope:** All features including messaging, notifications, admin portal, host portal  
**Platforms:** Web (beta.stayos.com), iOS (TestFlight external), Android (open testing)  
**Required deliverables:**
- [ ] All epic deliverables complete
- [ ] Push notifications working on both platforms
- [ ] Real-time messaging working
- [ ] Egyptian payment methods (Fawry, Meeza, Vodafone Cash, InstaPay) in sandbox
- [ ] Host can list a property end-to-end
- [ ] Admin can manage platform via admin portal
- [ ] Load test: 100 concurrent users, 0% error rate

---

### Release Candidate (End of Sprint 8 — Week 18)

**Audience:** N/A — production build under review  
**Required deliverables:**
- [ ] Penetration test complete, no Critical/High unresolved
- [ ] Full Playwright regression suite: 100% pass
- [ ] Performance: P95 API < 300ms, Lighthouse Mobile > 85
- [ ] App Store submission approved or in review
- [ ] Production infrastructure live
- [ ] Rollback plan documented

---

### Production (Week 20) — v1.0

**Required deliverables:**
- [ ] iOS app live in App Store
- [ ] Android app live in Google Play
- [ ] Web live at stayos.com
- [ ] Error rate < 0.1% for 48 hours
- [ ] Payment success rate > 98%
- [ ] Zero P0 incidents for 48 hours

---

## SECTION 9 — Milestones and Required Approvals

| Milestone | Week | Required Deliverables | Required Testing | Required Approvals |
|---|---|---|---|---|
| Staging Live | Week 2 | Staging API health check passes | Manual smoke test | Engineering Manager |
| Alpha | Week 8 | Auth + Search + Booking complete | Internal manual testing | Engineering Manager + Founder |
| Beta | Week 14 | All features complete | E2E regression + load test (100 users) | Engineering Manager + QA Director |
| RC | Week 18 | Pen test clean, all regressions pass | Full regression + load test (500 users) | CTO + QA Director + Security |
| Production | Week 20 | Apps approved, prod infra stable | Production smoke tests | Founder sign-off |

---

## SECTION 10 — Implementation Order

This is the canonical build order. No engineer may begin a step before its predecessor is complete.

```
Step 1  AWS Infrastructure Provisioned (INFRA-01-01 → 01-04)
        ↓
Step 2  Backend P0 Gaps Closed (BE-01-01 → BE-01-04)
        ↓
Step 3  Mobile Framework Decision (DEC-OPEN-1)
        ↓ (parallel branches begin)
        ┌──────────────────────────────────────┐
        ↓                                      ↓
Step 4A Web Foundation                  Step 4B Mobile Foundation
        ↓                                      ↓
Step 5A Web Auth                        Step 5B Mobile Auth
        ↓                                      ↓
Step 6A Web Search + Discovery          Step 6B Mobile Search + Discovery
        ↓                                      ↓
Step 7A Web Checkout + Payments         Step 7B Mobile Checkout + Payments
        ↓                                      ↓
Step 8A Web Guest + Host Portals        Step 8B Mobile Dashboards
        ↓                                      ↓
Step 9A Web Admin Portal                Step 9B Mobile Messaging
        ↓                                      ↓
Step 10A Web Messaging                  Step 10B Mobile App Store
        ↓                                      ↓
        └──────────────────────────────────────┘
        ↓ (tracks merge for hardening)
Step 11 Security Hardening (Pen Test + WAF + Load Tests)
        ↓
Step 12 Release Candidate (RC)
        ↓
Step 13 Production Deployment
        ↓
Step 14 Post-Launch Monitoring (48-hour stability window)
        ↓
Step 15 Production ✓

BACKEND ORDER (runs in parallel with frontend/mobile):
BE Step 1: P0 gaps (Sprint 0) → must complete before Sprint 1 begins
BE Step 2: Messaging data model (Sprint 1) → must complete before Sprint 6
BE Step 3: Admin API (Sprints 1–3) → must complete before Sprint 5 web
BE Step 4: FCM push provider (Sprint 1–2) → must complete before Sprint 6 mobile
BE Step 5: Egyptian payment methods (Sprints 2–3) → must complete before Sprint 3 web
BE Step 6: Analytics integration (Sprint 3) → admin KPI dashboard dependency
```

---

## SECTION 11 — Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| RISK-01 | Apple App Store rejection delaying launch | Medium | High | Submit alpha build in Sprint 4 (Week 10) for early review. 2-sprint buffer before RC. Use App Store Review guidelines checklist from MOBILE_NATIVE_DESIGN_P5.md | Mobile Lead |
| RISK-02 | Paymob local payment method integration complexity (Fawry, Meeza) | High | High | Start Paymob sandbox setup Sprint 0. Allocate 2 days per method. Have Paymob technical support contact before Sprint 2 | BE-2 |
| RISK-03 | WebSocket scalability — in-process ConnectionManager fails under load | Medium | Medium | ECS sticky sessions for MVP. Load test WebSocket in Sprint 7 with 500 concurrent connections. Phase 2: Redis pub/sub for multi-instance | BE-1 |
| RISK-04 | Calendar concurrency bug in production — double booking | Low | Critical | PostgreSQL EXCLUSION constraint in migration 009 prevents this at DB level. Load test with k6: 100 concurrent writes to same unit. Existing test: `test_calendar_concurrency.py` | QA-1 |
| RISK-05 | FCM/APNs configuration delay (Apple Developer provisioning) | Medium | High | Register Apple Developer account Sprint 0. APNs auth key generated Sprint 0. Flutter configure Sprint 0. Do not wait until Sprint 4. | Mobile Lead + DevOps-1 |
| RISK-06 | AWS me-south-1 service limits (ECS tasks, RDS instance class) | Low | High | Request quota increases for ECS tasks and RDS me-south-1 on Day 1. Check service availability before Terraform apply. | DevOps-1 |
| RISK-07 | Arabic RTL layout bugs across 81 screens | High | Medium | RTL is implemented in design tokens (logical CSS). Dedicated RTL audit in Sprint 7. Use Chrome devtools to force RTL during development. Playwright tests run in Arabic locale. | FE-1 |
| RISK-08 | Google Maps API quota exhaustion in production | Medium | Medium | Request quota increase before launch. Implement server-side map-view endpoint (GAP-C7) so pins are fetched once not per-viewport. Enable Maps Platform billing alerts at 80% quota. | DevOps-1 |
| RISK-09 | AWS SES in sandbox mode — cannot send to unverified emails | High | High | Request SES production access in Sprint 0. Takes 24–48 hours. Do not wait until Sprint 3 to discover this. | BE-2 |
| RISK-10 | Flutter team velocity below estimate on first sprint | Medium | Medium | Week 1–2 is foundation only (scaffold, tokens, navigation) — low risk of under-delivery. Track velocity at Sprint 1 retrospective and adjust Sprint 2–3 scope. | Engineering Manager |
| RISK-11 | Penetration test finds Critical vulnerability in Sprint 7 | Low | High | Begin security hardening in Sprint 0 (file upload validation). WAF active by Sprint 2. All OWASP headers already implemented. Rate limiting active. Buffer: pen test in Sprint 7 gives Sprint 8 for remediation. | Security Contractor |
| RISK-12 | Paymob webhook delivery failures in production | Medium | High | Webhook idempotency already implemented in `finance/router.py:_acquire_webhook_idempotency()`. Configure webhook retry in Paymob dashboard (3 retries). Monitor webhook delivery in CloudWatch. | BE-2 |

---

## SECTION 12 — Decision Register

| ID | Decision | Status | Notes |
|---|---|---|---|
| DEC-001 | StayOS is an accommodation marketplace | **LOCKED** | DEC-001 accepted |
| DEC-002 | Egypt primary market, GCC expansion | **LOCKED** | DEC-002 accepted |
| DEC-003 | Arabic-first UX, RTL primary | **LOCKED** | DEC-003 accepted, implemented in design system |
| DEC-004 | Local payment infrastructure (Paymob primary) | **LOCKED** | Config.py enforces Paymob as primary. Stripe for international cards (Stripe keys optional in config) |
| DEC-005 | B2B2C supply strategy | **LOCKED** | DEC-005 accepted |
| DEC-006 | KYC required before booking | **LOCKED** | Enforced in backend `require_kyc_verified` dependency |
| DEC-007 | Manual operations in Phase 0 | **LOCKED** | Phase 1 is now active |
| DEC-008 | AI deferred to Phase 3 | **LOCKED** | No AI dependencies in codebase |
| DEC-009 | WhatsApp as primary communication | **LOCKED** | Implemented in `notifications/providers.py` |
| DEC-010 | Revenue model | Proposed | Does not block engineering |
| DEC-S02-001 | PostgreSQL EXCLUSION for calendar | **LOCKED** | Migration 009 complete |
| DEC-S02-002 | Notification retry + DLQ | **LOCKED** | Implemented in Celery |
| DEC-S02-003 | Redis rate limiting | **LOCKED** | `security/rate_limit.py` |
| DEC-S02-004 | Notification provider by name | **LOCKED** | `notifications/providers.py` |
| **DEC-OPEN-1** | **Mobile framework: Flutter vs React Native** | **OPEN — P0 BLOCKER** | Resolve before Sprint 0 Day 1. Recommendation: Flutter (better MENA Android performance, complete widget mapping in P4) |
| **DEC-OPEN-2** | **Email provider: AWS SES vs SendGrid** | **OPEN — Sprint 0** | Recommendation: AWS SES (same IAM role, lower cost, MENA region available) |
| **DEC-OPEN-3** | **Analytics: PostHog vs Mixpanel vs Amplitude** | **OPEN — Sprint 0** | Recommendation: PostHog self-hosted on AWS (MENA data residency, open source, no per-event cost) |
| **DEC-OPEN-4** | **Real-time messaging: WebSocket vs SSE** | **OPEN — Sprint 0** | Recommendation: WebSocket (bidirectional required for read receipts, FastAPI supports natively) |
| **DEC-OPEN-5** | **Mobile state management: Riverpod vs Bloc** | **OPEN — Sprint 0** | Recommendation: Riverpod (less boilerplate, better for async-heavy apps) |
| **DEC-OPEN-6** | **Stripe international scope** | **OPEN — Sprint 0** | Confirm: Paymob handles all Egyptian payments, Stripe handles international credit/debit cards only |

---

## SECTION 13 — Resource Plan

### Minimum Viable Team (8.5 FTEs)

| Role | Count | Tracks | Sprint Allocation |
|---|---|---|---|
| Backend Engineer (BE-1) | 1 | Track A | Sprints 0–8 full time, Sprint 9 on-call |
| Backend Engineer (BE-2) | 1 | Track A | Sprints 0–8 full time, Sprint 9 on-call |
| Flutter Engineer (MOB-1) | 1 | Track B | Sprints 0–9 full time |
| Flutter Engineer (MOB-2) | 1 | Track B | Sprints 0–9 full time |
| Frontend Engineer (FE-1) | 1 | Track C | Sprints 0–8 full time, Sprint 9 on-call |
| Frontend Engineer (FE-2) | 1 | Track C | Sprints 0–8 full time, Sprint 9 on-call |
| DevOps Engineer | 1 | Track D | Sprints 0–9 full time |
| QA Engineer | 1 | Track E | Sprints 0–9 full time |
| Security Contractor | 0.5 | Track F | Sprints 0–8, part-time |
| Engineering Manager | 1 | Cross-track | Full time — coordinates all tracks |

**Total: 8.5 FTEs + 1 Engineering Manager**

### Recommended Skills Per Role

| Role | Required Skills |
|---|---|
| BE-1 | Python 3.11, FastAPI, SQLAlchemy async, PostgreSQL, Redis, WebSocket |
| BE-2 | Python 3.11, FastAPI, Paymob API, Celery, AWS SDK (Boto3, SES, S3) |
| MOB-1 | Flutter 3.x, Dart, GoRouter, Dio, Riverpod, Google Maps Flutter |
| MOB-2 | Flutter 3.x, Firebase Messaging, SQLite/Hive, WebSocket, camera packages |
| FE-1 | Next.js 14 App Router, React Query, TypeScript strict, Tailwind, RTL |
| FE-2 | Next.js 14, Zustand, data visualization (charts for admin KPI), Playwright |
| DevOps | AWS ECS/RDS/ElastiCache/S3, Terraform, Docker, GitHub Actions, k6 |
| QA | Playwright, k6, mobile testing (Appium or Flutter integration tests) |
| Security | OWASP, penetration testing tools (Burp Suite), AWS WAF |

### Capacity per Sprint (2 weeks)

| Role | Available Days | Note |
|---|---|---|
| Each Engineer | 8 days | 10 days minus 2 for meetings/review |
| DevOps | 8 days | |
| QA | 8 days | |
| Engineering Manager | 5 days | Remaining: coordination, reviews |

---

## SECTION 14 — Execution Timeline (Week by Week)

```
WEEK  MON           SPRINT    BACKEND          WEB FRONTEND     MOBILE           DEVOPS           QA
────  ────────────  ──────    ──────────────   ──────────────   ──────────────   ──────────────   ──────────────
  1   SPRINT 0      FOUND.    Photo upload     Tokens + i18n    Flutter init     Terraform plan   Playwright init
                              Push token API   API client       Navigation       Terraform apply  Test factory
  2                           Paymob iframe    State mgmt       API client       Secrets Manager  —
                              Email provider   Component lib    Design tokens    Vercel setup
                              FCM token EP     Component lib    Splash screen    Staging deploy

  3   SPRINT 1      AUTH      Messaging model  Phone + OTP UI   Phone screen     Mobile CI        Auth E2E setup
                              Admin users API  Social auth      OTP screen
  4                           WebSocket start  KYC wizard       KYC wizard       Monitoring       Auth E2E tests
                                              Profile          Biometric auth   alerts

  5   SPRINT 2      SEARCH    WebSocket done   Home page        Home screen      CloudFront       Search E2E
                              Map-view EP      Search list      Search screen
  6                           Admin listing    Map view         Map view         WAF rules        Property E2E
                              moderation       Property detail  Property detail

  7   SPRINT 3      BOOKING   Fawry + Meeza    Checkout flow    Checkout flow    Webhook verify   Booking E2E
                              Admin KPI API    Paymob iframe    Paymob WebView                    Concurrency
  8   ── ALPHA ──            Fin. reconcile   Confirmation     Confirmation                      Calendar test
                              InstaPay + VF Cash               screens

  9   SPRINT 4      PORTALS   FCM wired        Guest dashboard  Guest dashboard  PgBouncer        Dashboard E2E
                              Admin fin API    Host wizard      Host dashboard
 10                           Analytics        Host calendar    Host listings    Prod TF plan     Mobile tests
                              Terms tracking   Host dashboard

 11   SPRINT 5      ADMIN     Analytics done   Admin KPI        Calendar mgmt    Prod TF apply    Admin tests
                              Vodafone Cash    User management  Earnings
 12                           InstaPay         Listing mod.     Host creation    Prod secrets     Mobile host
                              Email templates  Financial rpt                     Prod deployed

 13   SPRINT 6      MESSAGE   Email final      Messaging inbox  FCM setup        Auto-scaling     Notif tests
                              Notif tuning     Conversation     Chat screen
 14   ── BETA ──              —               Notif center     Push notifs      CW dashboard     Messaging E2E
                                              Admin complete   Notif center                      Beta regression

 15   SPRINT 7      HARDEN    Query optim.     RTL audit        Animation polish Load test (k6)   Full regression
                              Bug fixes        A11y fixes       A11y labels      Backup restore   Pen test support
 16                           —               Lighthouse fixes Bug fixes                         Sign-off prep

 17   SPRINT 8      RC        Critical only    Prod deploy      App Store meta   Prod cutover     Sign-off tests
                                              Smoke tests      Screenshots      plan             RC regression
 18   ── RC ──                —               —               Submission       Rollback plan    QA sign-off
                                                                                DNS prep

 19   SPRINT 9      PROD      On-call          Monitor          App Store        DNS cutover      Prod smoke
                                              —                approval wait    Traffic routing  every 4hrs
 20   ── PROD ✓ ──            —               —               LIVE ✓           LIVE ✓           STABLE ✓
```

---

## SECTION 15 — Critical Path

The minimum sequence of work required to reach production. Any delay on the critical path delays the launch date by the same duration.

```
Day 1
  │
  ▼
[Resolve DEC-OPEN-1: Mobile Framework] ────────── 2 hours — MUST happen before any mobile code
  │
  ▼
[AWS Account Access] ───────────────────────────── External dependency — Day 1 blocker
  │
  ▼
[INFRA-01-01: Terraform variable resolution] ───── 4 hours
  │
  ▼
[INFRA-01-02: Staging Terraform apply] ─────────── 4 hours
  │
  ▼
[INFRA-01-03: Secrets Manager population] ────────  4 hours — requires all third-party credentials
  │
  ▼
[INFRA-01-04: Staging API deployment + migrations] 3 hours
  │
  ├──────────────────────────────────────────────────────┐
  ▼                                                      ▼
[BE-01 P0 gaps] ← Week 1–2                    [Web + Mobile Foundation] ← Week 1–2
  │                                                      │
  ▼                                                      ▼
[Auth backend — DONE]                         [Auth UI — Week 3–4]
  │                                                      │
  ▼                                                      ▼
[Search backend — DONE]                       [Search UI — Week 5–6]
  │                                                      │
  ▼                                                      ▼
[Paymob iframe URL — Week 1]                  [Checkout + Payment UI — Week 7–8]
  │                                                      │
  ▼                                                      ▼
[Reservation backend — DONE]                  [ALPHA — Week 8] ← CRITICAL MILESTONE
  │                                                      │
  ▼                                                      ▼
[FCM push provider — Week 3–4]                [Dashboards — Week 9–10]
  │                                                      │
  ▼                                                      ▼
[Admin API — Week 3–6]                        [Admin Portal — Week 11–12]
  │                                                      │
  ▼                                                      ▼
[WebSocket server — Week 5–6]                 [Messaging UI — Week 13–14]
  │                                                      │
  └──────────────────────────────────────────────────────┘
                                │
                                ▼
                  [BETA — Week 14] ← CRITICAL MILESTONE
                                │
                                ▼
                  [Hardening + Load Tests — Week 15–16]
                                │
                                ▼
                  [Pen Test — Week 15–16]
                                │
                                ▼
                  [RC — Week 17–18] + App Store submission
                                │
                                ▼
                  [App Store Review — 1–3 days]
                                │
                                ▼
                  [PRODUCTION — Week 20] ✓

CRITICAL PATH DURATION: 20 weeks

ITEMS WITH NO FLOAT (any slip = launch delay):
1. AWS account access on Day 1
2. DEC-OPEN-1 (mobile framework) on Day 1
3. Staging infrastructure live by end of Week 2
4. Paymob iframe URL endpoint by end of Week 2
5. Auth UI on all platforms by end of Week 4
6. Checkout UI + payment by end of Week 8 (ALPHA)
7. App Store submission by end of Week 18
```

---

## SECTION 16 — Execution Dashboard

```
╔══════════════════════════════════════════════════════════════════════╗
║          STAYOS ENGINEERING EXECUTION DASHBOARD                      ║
║          Generated: 2026-07-27 | Target Production: Week 20          ║
╚══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│ OVERALL PROGRESS                                                      │
├──────────────────┬─────────────────────────────────────────────────┤
│ Backend          │ ████████████████░░░░░░░░ 68%                     │
│ Web Frontend     │ █░░░░░░░░░░░░░░░░░░░░░░░  5%                     │
│ Mobile           │ ░░░░░░░░░░░░░░░░░░░░░░░░  0%                     │
│ Infrastructure   │ ████████████░░░░░░░░░░░░ 50% (defined, not run)  │
│ QA               │ ████░░░░░░░░░░░░░░░░░░░░ 18% (backend only)      │
│ Security         │ ████████░░░░░░░░░░░░░░░░ 33%                     │
│ Overall          │ ████████░░░░░░░░░░░░░░░░ 34%                     │
└──────────────────┴─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CRITICAL BLOCKERS (must resolve before development can begin)        │
├─────┬───────────────────────────────────────────────┬──────────────┤
│ #1  │ DEC-OPEN-1: Mobile framework not chosen        │ DAY 1 ACTION │
│ #2  │ AWS account access not confirmed               │ DAY 1 ACTION │
│ #3  │ Firebase project not configured for mobile     │ DAY 1 ACTION │
│ #4  │ Paymob sandbox credentials not obtained        │ DAY 1 ACTION │
│ #5  │ Apple Developer account status unknown         │ DAY 1 ACTION │
└─────┴───────────────────────────────────────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ OPEN DECISIONS (resolve by end of Sprint 0)                          │
├─────────────┬─────────────────────────────────┬───────────────────┤
│ DEC-OPEN-1  │ Flutter vs React Native          │ Recommend Flutter │
│ DEC-OPEN-2  │ SES vs SendGrid                  │ Recommend SES     │
│ DEC-OPEN-3  │ Analytics provider               │ Recommend PostHog │
│ DEC-OPEN-4  │ WebSocket vs SSE                 │ Recommend WS      │
│ DEC-OPEN-5  │ Riverpod vs Bloc                 │ Recommend Riverpod│
│ DEC-OPEN-6  │ Stripe scope confirmation        │ Intl cards only   │
└─────────────┴─────────────────────────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ CURRENT SPRINT: Sprint 0 — Foundation (Weeks 1–2)                   │
├──────────────────────────┬──────────────────────────────────────────┤
│ Primary Deliverable       │ Staging API live at api-staging.stayos.com│
│ Secondary Deliverable     │ All P0 backend gaps resolved              │
│ Secondary Deliverable     │ Web foundation: tokens, i18n, API client  │
│ Secondary Deliverable     │ Mobile: scaffold, navigation, tokens      │
│ Gate to Sprint 1          │ GET /health returns {"status": "ok"}      │
└──────────────────────────┴──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ NEXT SPRINT: Sprint 1 — Authentication (Weeks 3–4)                  │
├──────────────────────────┬──────────────────────────────────────────┤
│ Primary Deliverable       │ User can register and auth on all 3 platforms│
│ Gate to Sprint 2          │ OTP received on physical device           │
│ Gate to Sprint 2          │ KYC wizard complete end-to-end            │
└──────────────────────────┴──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ HIGH RISKS                                                            │
├────┬──────────────────────────────────────┬────────────┬───────────┤
│ #1 │ Apple App Store rejection            │ Medium/High│ Submit W10│
│ #2 │ Paymob local payment complexity      │ High/High  │ Start W1  │
│ #3 │ AWS SES sandbox mode delay           │ High/High  │ Request W1│
│ #4 │ FCM/APNs provisioning delay          │ Med/High   │ Setup W1  │
│ #5 │ Flutter velocity below estimate      │ Medium/Med │ Track W4  │
└────┴──────────────────────────────────────┴────────────┴───────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ RELEASE TIMELINE                                                      │
├────────────────────┬────────────────────────────────────────────────┤
│ Alpha              │ Week 8  — Internal team only                    │
│ Beta               │ Week 14 — External testers (TestFlight/Play)    │
│ Release Candidate  │ Week 18 — App Store submission                  │
│ Production         │ Week 20 — Public launch                         │
└────────────────────┴────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PRODUCTION ETA: Week 20 from team start date                         │
│ CONFIDENCE: HIGH if team starts Week 1 with AWS access confirmed     │
│             MEDIUM if AWS/Firebase/Paymob access takes > 1 week      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A — Third-Party Account Checklist (Must complete before Sprint 0)

| Service | Account | Action Required | Owner |
|---|---|---|---|
| AWS | Production AWS account in me-south-1 | Confirm IAM access for Terraform | DevOps-1 |
| Firebase | Project configured | Get service account credentials | BE-1 |
| Twilio | Verify service configured | Get VERIFY_SERVICE_SID | BE-1 |
| Paymob | Sandbox account | Get API key, HMAC secret, integration IDs for each payment method | BE-2 |
| Meta | WhatsApp Business API | Get TOKEN and PHONE_NUMBER_ID | BE-2 |
| SES (or SendGrid) | Email sending configured | Verify stayos.com domain, request production access | BE-2 |
| Sentry | Project created | Get DSN | DevOps-1 |
| Apple Developer | Program membership | Required for APNs and App Store | Engineering Manager |
| Google Play Console | Developer account | Required for Android publishing | Engineering Manager |
| Vercel | Team account | Project created | DevOps-1 |
| PostHog (if chosen) | Self-hosted instance or cloud | API key obtained | BE-2 |

---

## Appendix B — Definition of Done (Global)

Applies to every task in this plan:

- [ ] Code reviewed and approved by one other engineer
- [ ] All tests pass in CI (lint, type-check, unit, integration)
- [ ] No new Sentry errors introduced
- [ ] No security warnings from bandit or safety
- [ ] Feature tested manually on staging environment
- [ ] Arabic (RTL) version verified for any UI task
- [ ] Dark mode verified for any UI task
- [ ] Acceptance criteria from task definition explicitly verified

---

*End of STAYOS ENGINEERING EXECUTION MASTER PLAN v1.0*  
*This document replaces all prior planning documents. It is the single source of execution truth.*
