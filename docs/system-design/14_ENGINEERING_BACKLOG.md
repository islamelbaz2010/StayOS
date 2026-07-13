# 14 — Engineering Backlog

**Cross-references**: [13_IMPLEMENTATION_ORDER.md](13_IMPLEMENTATION_ORDER.md) · [PRODUCT_CANON.md](../../PRODUCT_CANON.md) · [02_DOMAIN_DRIVEN_DESIGN.md](02_DOMAIN_DRIVEN_DESIGN.md) · [04_API_SPECIFICATION.md](04_API_SPECIFICATION.md)

Story points use Fibonacci: 1, 2, 3, 5, 8, 13. A 13-point story must be split before sprint planning.

---

## Epic 1 — Infrastructure Foundation (EPC-01)

**Goal**: All AWS infrastructure provisioned, CI/CD live, and monitoring active before first application code.

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-01-001 | Provision AWS VPC, subnets (public/private), security groups, NAT Gateway | 3 | S0 |
| EPC-01-002 | Provision RDS PostgreSQL 16 with PostGIS, Multi-AZ, PgBouncer | 5 | S0 |
| EPC-01-003 | Provision ElastiCache Redis 7, Multi-AZ, AOF enabled | 3 | S0 |
| EPC-01-004 | Configure ECS Fargate cluster, task definitions (API, worker, beat) | 5 | S0 |
| EPC-01-005 | AWS ALB + HTTPS + ACM certificate + security groups | 3 | S0 |
| EPC-01-006 | CloudFront distributions (CDN for listings + API routing) | 3 | S0 |
| EPC-01-007 | S3 buckets: listings (CloudFront OAC), KYC (SSE-KMS), ops (private) | 3 | S0 |
| EPC-01-008 | AWS Secrets Manager: full secret namespace setup | 2 | S0 |
| EPC-01-009 | ECR container registry setup, push permissions | 1 | S0 |
| EPC-01-010 | GitHub Actions CI: lint, test, security, build, push to ECR, deploy to staging | 5 | S0 |
| EPC-01-011 | Vercel project setup: prod + preview, env vars | 1 | S0 |
| EPC-01-012 | Alembic migration baseline: empty schema, all extensions enabled | 2 | S0 |
| EPC-01-013 | CloudWatch dashboards + alarms (API latency, error rate, DB) | 3 | S0 |
| EPC-01-014 | Sentry projects (FastAPI + Next.js) with source maps | 2 | S0 |
| EPC-01-015 | PagerDuty integration with CloudWatch SNS alarms | 1 | S0 |
| EPC-01-016 | Lambda image resize function (S3 trigger, 3 variants, delete original) | 5 | S0 |

**Epic total**: 47 points

---

## Epic 2 — AuthGate (EPC-02)

**Goal**: All personas (Guest, Host, Field Staff) can authenticate. KYC flow complete. RBAC enforced.

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-02-001 | User model + kyc_records + sessions migrations | 2 | S1 |
| EPC-02-002 | OTP send endpoint: Twilio Verify + Redis TTL (rate-limited) | 3 | S1 |
| EPC-02-003 | OTP verify endpoint: code check + Firebase custom token issuance | 3 | S1 |
| EPC-02-004 | Firebase JWT verification middleware (all protected routes) | 3 | S1 |
| EPC-02-005 | Google OAuth endpoint via Firebase | 2 | S1 |
| EPC-02-006 | Apple Sign-In endpoint via Firebase | 2 | S1 |
| EPC-02-007 | KYC document upload: pre-signed S3 URL generation (KYC bucket) | 2 | S1 |
| EPC-02-008 | KYC processing Celery task: Textract OCR + Rekognition face match | 8 | S1 |
| EPC-02-009 | KYC status endpoint + admin approve/reject endpoint | 2 | S1 |
| EPC-02-010 | Role assignment endpoints (HOST, FIELD_STAFF, OPS_MANAGER) | 2 | S1 |
| EPC-02-011 | Audit log implementation (all admin actions) | 3 | S1 |
| EPC-02-012 | Session revocation (logout + ban cascade) | 2 | S1 |
| EPC-02-013 | RBAC dependency functions (`require_role`, ownership checks) | 3 | S1 |
| EPC-02-014 | Next.js: phone input + OTP verification page (Arabic RTL) | 5 | S1 |
| EPC-02-015 | Next.js: Google/Apple SSO buttons | 2 | S1 |
| EPC-02-016 | Next.js: KYC upload flow (camera, document scan, selfie) | 5 | S1 |
| EPC-02-017 | Next.js: user profile page | 2 | S1 |
| EPC-02-018 | Next.js: RTL layout foundation, Arabic i18n routing | 5 | S1 |

**Epic total**: 56 points

---

## Epic 3 — PMS Core + Spatial Search (EPC-03)

**Goal**: Hosts can create and manage listings. Guests can search by map and filters.

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-03-001 | Units + unit_listings + calendar_rules + pricing_tiers migrations | 3 | S2 |
| EPC-03-002 | PostGIS GIST spatial index on units.coordinates | 1 | S2 |
| EPC-03-003 | pg_trgm GIN index + search_vector trigger on unit_listings | 2 | S2 |
| EPC-03-004 | Unit CRUD endpoints (create, update, archive) | 3 | S2 |
| EPC-03-005 | Listing photo upload: pre-signed URLs (max 20, max 10MB each) | 2 | S2 |
| EPC-03-006 | Calendar management endpoints (block/unblock date ranges) | 3 | S2 |
| EPC-03-007 | Pricing tier management endpoints | 2 | S2 |
| EPC-03-008 | Availability check endpoint (PostGIS + calendar query) | 3 | S2 |
| EPC-03-009 | Spatial search endpoint: viewport + radius + filters (PostGIS) | 5 | S2 |
| EPC-03-010 | Full-text search: pg_trgm + Arabic unaccent normalization | 3 | S2 |
| EPC-03-011 | Unit status state machine (PENDING_VERIFICATION → LISTED → SUSPENDED → ARCHIVED) | 3 | S2 |
| EPC-03-012 | PMS KPI endpoint: ADR, RevPAR, occupancy rate | 3 | S2 |
| EPC-03-013 | Next.js: search page with Google Maps + listing card grid (Arabic) | 8 | S2 |
| EPC-03-014 | Next.js: listing detail page (ISR, Arabic/English) | 5 | S2 |
| EPC-03-015 | Next.js: host listing creation form (multi-step wizard) | 5 | S2 |
| EPC-03-016 | Next.js: photo upload UI (drag-drop + camera) | 3 | S2 |
| EPC-03-017 | Next.js: calendar management UI (date range picker + blocking) | 5 | S2 |
| EPC-03-018 | Next.js: pricing configuration UI | 3 | S2 |

**Epic total**: 62 points

---

## Epic 4 — Reservation Engine (EPC-04)

**Goal**: Guest can book, pay (Fawry/card), and both parties receive confirmation. Host can check in / check out.

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-04-001 | Reservations + payment_intents + promo migrations | 2 | S3 |
| EPC-04-002 | Calendar lock service: SELECT FOR UPDATE NOWAIT on calendar_rules | 5 | S3 |
| EPC-04-003 | Booking initiation endpoint (lock + create reservation + create payment intent) | 5 | S3 |
| EPC-04-004 | Paymob integration: auth → create order → get payment key → iframe | 8 | S3 |
| EPC-04-005 | Stripe integration: payment intent + confirm | 5 | S3 |
| EPC-04-006 | Payment routing: Paymob vs Stripe by payment method and geography | 3 | S3 |
| EPC-04-007 | Paymob webhook: HMAC verify + status processing + idempotency | 5 | S3 |
| EPC-04-008 | Stripe webhook: signature verify + status processing + idempotency | 3 | S3 |
| EPC-04-009 | Booking confirmation state machine (PENDING → CONFIRMED) | 3 | S3 |
| EPC-04-010 | Promo code model + application endpoint + validation rules | 3 | S3 |
| EPC-04-011 | Cancellation endpoint: refund policy calculation + calendar release | 5 | S3 |
| EPC-04-012 | Check-in / check-out endpoints | 2 | S3 |
| EPC-04-013 | SSE endpoint: booking status stream (Redis pub/sub) | 3 | S3 |
| EPC-04-014 | Outbox events: booking.initiated, payment_confirmed, cancelled, checked_in, checked_out | 3 | S3 |
| EPC-04-015 | Next.js: checkout flow (dates, guests, payment method) | 5 | S3 |
| EPC-04-016 | Next.js: Paymob iframe integration | 5 | S3 |
| EPC-04-017 | Next.js: Stripe Elements card form | 3 | S3 |
| EPC-04-018 | Next.js: booking confirmation page (SSE listener) | 2 | S3 |
| EPC-04-019 | Next.js: guest + host reservation dashboards | 5 | S3 |

**Epic total**: 74 points

---

## Epic 5 — OpsManager (EPC-05)

**Goal**: Automatic turnover ticket on checkout. Field staff mobile app with offline support.

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-05-001 | Turnover tickets + task + photos + assignments migrations | 2 | S4 |
| EPC-05-002 | Ticket creation Celery task (booking.checked_out event → ticket within 5 min) | 5 | S4 |
| EPC-05-003 | TurnoverDispatcher: proximity-based field staff selection | 5 | S4 |
| EPC-05-004 | Ticket CRUD + assignment endpoints | 3 | S4 |
| EPC-05-005 | Checklist task completion endpoint | 2 | S4 |
| EPC-05-006 | Verification photo upload endpoint (ops S3 bucket, pre-signed) | 2 | S4 |
| EPC-05-007 | Ticket closure + unit status update event (ops.turnover_complete) | 3 | S4 |
| EPC-05-008 | Offline batch sync endpoint (SQLite reconciliation) | 5 | S4 |
| EPC-05-009 | Escalation logic (auto-escalate if not accepted in 30 min) | 2 | S4 |
| EPC-05-010 | React Native: ticket list + detail screens (offline-first, SQLite) | 8 | S4 |
| EPC-05-011 | React Native: checklist interaction | 3 | S4 |
| EPC-05-012 | React Native: camera capture + offline photo queue | 5 | S4 |
| EPC-05-013 | React Native: background sync on reconnect | 5 | S4 |

**Epic total**: 50 points

---

## Epic 6 — FinancialEngine (EPC-06)

**Goal**: Escrow holds funds. T+24h auto-release. Daily payout batch. Full double-entry ledger.

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-06-001 | Escrow + ledger + payout + tax migrations | 2 | S5 |
| EPC-06-002 | Escrow creation on booking.payment_confirmed event | 3 | S5 |
| EPC-06-003 | T+24h escrow release: Celery Beat task + eligibility query | 5 | S5 |
| EPC-06-004 | Double-entry ledger service (CREDIT/DEBIT pair for every transaction) | 5 | S5 |
| EPC-06-005 | Fee split calculation (guest 3–5%, host commission 8–12%) | 3 | S5 |
| EPC-06-006 | Tax withholding calculator (VAT by governorate, withholding config table) | 3 | S5 |
| EPC-06-007 | Payout batch Celery Beat task (daily 09:00) + Paymob disbursement | 5 | S5 |
| EPC-06-008 | Host balance + payout history endpoints | 2 | S5 |
| EPC-06-009 | Refund processing (booking.cancelled event → Paymob/Stripe refund API) | 5 | S5 |
| EPC-06-010 | Admin revenue report endpoint | 2 | S5 |
| EPC-06-011 | Ledger entry append-only enforcement (RLS policy on PostgreSQL) | 2 | S5 |

**Epic total**: 37 points

---

## Epic 7 — Notification Service (EPC-07)

**Cross-sprint — starts in Sprint 1, completes in Sprint 6.**

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-07-001 | WhatsApp Business API integration (Cloud API v18) | 5 | S1 |
| EPC-07-002 | WhatsApp template submission: 8 templates (Arabic + English) | 3 | S1 |
| EPC-07-003 | AWS SES domain verification + email template setup | 2 | S1 |
| EPC-07-004 | Notification routing: WhatsApp → email → SMS priority chain | 3 | S2 |
| EPC-07-005 | Booking confirmation notification (guest + host, Arabic) | 2 | S3 |
| EPC-07-006 | KYC status notifications (approved / rejected) | 1 | S1 |
| EPC-07-007 | Check-in / check-out notifications | 1 | S3 |
| EPC-07-008 | OpsManager ticket assignment notification (field staff) | 1 | S4 |
| EPC-07-009 | Payout dispatched notification (host) | 1 | S5 |
| EPC-07-010 | Refund processed notification (guest) | 1 | S5 |
| EPC-07-011 | Retry logic: exponential backoff, dead letter queue | 3 | S2 |

**Epic total**: 23 points

---

## Epic 8 — Incident Console + Integration (EPC-08)

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-08-001 | Next.js admin dashboard shell (auth-gated, ADMIN only) | 3 | S6 |
| EPC-08-002 | Dispute queue UI + resolution workflow | 5 | S6 |
| EPC-08-003 | User management UI (view, ban, suspend, KYC review) | 3 | S6 |
| EPC-08-004 | Emergency listing delist endpoint + UI | 2 | S6 |
| EPC-08-005 | Booking override UI (admin cancel, refund initiation) | 3 | S6 |
| EPC-08-006 | Audit log viewer UI | 2 | S6 |
| EPC-08-007 | End-to-end booking flow integration test (Playwright) | 5 | S6 |
| EPC-08-008 | Payment webhook simulation test | 3 | S6 |

**Epic total**: 26 points

---

## Epic 9 — Security Hardening + Launch Readiness (EPC-09)

| ID | Story | Points | Sprint |
|----|-------|--------|--------|
| EPC-09-001 | AWS WAF: managed rules + rate-based rules | 3 | S7 |
| EPC-09-002 | Load test: 500 concurrent search sessions (Locust) | 3 | S7 |
| EPC-09-003 | Load test: 50 concurrent booking sessions (calendar lock contention) | 3 | S7 |
| EPC-09-004 | Penetration test: auth bypass, IDOR, injection, SSRF | 8 | S7 |
| EPC-09-005 | S3 KYC bucket access audit (IAM roles, no public access) | 1 | S7 |
| EPC-09-006 | Secrets rotation dry-run (all 8 secrets) | 2 | S7 |
| EPC-09-007 | CloudWatch alarm configuration (all P0/P1 signals) | 2 | S7 |
| EPC-09-008 | Runbooks: payment outage, double-booking, payout failure, WhatsApp outage | 5 | S7 |
| EPC-09-009 | PgBouncer connection pool tuning (production load) | 2 | S7 |
| EPC-09-010 | HSTS, CSP, security headers on ALB and Next.js | 2 | S7 |

**Epic total**: 31 points

---

## Backlog Summary

| Epic | Points | Sprint |
|------|--------|--------|
| EPC-01: Infrastructure | 47 | S0 |
| EPC-02: AuthGate | 56 | S1 |
| EPC-03: PMS + Search | 62 | S2 |
| EPC-04: Reservation Engine | 74 | S3 |
| EPC-05: OpsManager | 50 | S4 |
| EPC-06: FinancialEngine | 37 | S5 |
| EPC-07: Notifications | 23 | S1–S6 |
| EPC-08: Incident Console | 26 | S6 |
| EPC-09: Security Hardening | 31 | S7 |
| **Total** | **406 points** | **8 sprints** |

At 50 points/sprint (2-person team): ~8 sprints × 2 weeks = **16 weeks** (within 19-week budget from sprint plan).  
At 35 points/sprint (1-person team): ~12 sprints × 2 weeks = **24 weeks**.

Team sizing recommendation: minimum 2 backend engineers + 1 frontend engineer for 19-week delivery.
