# ARCHITECTURE_FREEZE.md

**Status**: FROZEN
**Date**: 2026-07-13
**Authority**: Islam Elbaz (Founder)
**Phase**: Phase 0 — Architecture Freeze before Phase 1 build

This document records the final engineering decision for every architectural dimension. All decisions are Accepted status. No implementation begins until Phase 0 customer validation gates clear.

**Source of truth for each decision**: `docs/architecture/adr/ADR-XXX-*.md`

---

## Frozen Decision Register

| # | ADR | Dimension | Decision | Status |
|---|-----|-----------|----------|--------|
| 1 | [ADR-001](docs/architecture/adr/ADR-001-frontend-framework.md) | Frontend Framework | **Next.js (App Router, TypeScript)** | Accepted |
| 2 | [ADR-002](docs/architecture/adr/ADR-002-backend-runtime.md) | Backend Runtime | **Python 3.11+ / FastAPI (ASGI) + SQLAlchemy 2.0** | Accepted |
| 3 | [ADR-003](docs/architecture/adr/ADR-003-payment-provider.md) | Payment Provider | **Paymob (primary, Egyptian rails) + Stripe (international cards only)** | Accepted |
| 4 | [ADR-004](docs/architecture/adr/ADR-004-ai-provider.md) | AI Provider | **Anthropic Claude API (Phase 2+) — Zero AI in Phase 1** | Accepted |
| 5 | [ADR-005](docs/architecture/adr/ADR-005-database-strategy.md) | Database Strategy | **PostgreSQL 16+ (AWS RDS Multi-AZ) + PostGIS + Redis 7 (ElastiCache) + SQLite (mobile offline)** | Accepted |
| 6 | [ADR-006](docs/architecture/adr/ADR-006-authentication-strategy.md) | Authentication | **Twilio OTP + Firebase Auth (Google/Apple SSO) + RS256 JWT + AWS Rekognition/Textract (KYC)** | Accepted |
| 7 | [ADR-007](docs/architecture/adr/ADR-007-deployment-strategy.md) | Deployment | **AWS primary (me-central-1 UAE) + Vercel (Next.js frontend) + ECS Fargate (backend)** | Accepted |
| 8 | [ADR-008](docs/architecture/adr/ADR-008-realtime-architecture.md) | Realtime | **Server-Sent Events (SSE) + Redis pub/sub** | Accepted |
| 9 | [ADR-009](docs/architecture/adr/ADR-009-storage-strategy.md) | Storage | **AWS S3 (three-bucket: listings / kyc / ops) + CloudFront CDN** | Accepted |
| 10 | [ADR-010](docs/architecture/adr/ADR-010-search-architecture.md) | Search | **PostGIS (geo-spatial) + PostgreSQL pg_trgm (Phase 1 text) + Algolia (Phase 2 Arabic NLP) + Google Maps API** | Accepted |
| 11 | [ADR-011](docs/architecture/adr/ADR-011-notification-architecture.md) | Notifications | **WhatsApp Business API (primary) + AWS SES (email/receipts) + Twilio (OTP only) + Firebase FCM (in-app push)** | Accepted |
| 12 | [ADR-012](docs/architecture/adr/ADR-012-queue-background-jobs.md) | Queue / Background Jobs | **Celery 5.x + Redis broker + Celery Beat (scheduler)** | Accepted |
| 13 | [ADR-013](docs/architecture/adr/ADR-013-event-driven-architecture.md) | Event-Driven Architecture | **Celery task chains (internal event bus) — EventBridge/Kafka at Phase 3** | Accepted |
| 14 | [ADR-014](docs/architecture/adr/ADR-014-api-style.md) | API Style | **REST + OpenAPI 3.0 (FastAPI auto-generated) + Next.js BFF for browser clients** | Accepted |
| 15 | [ADR-015](docs/architecture/adr/ADR-015-multi-region-expansion.md) | Multi-Region Expansion | **AWS me-central-1 (Phase 1); locale-aware schema + pluggable PaymentAdapter from Sprint 1; Saudi me-central-2 at Phase 3** | Accepted |

---

## Technology Summary (All Layers)

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLIENT                                                              │
│  Web App (Guest + Host):  Next.js (App Router, TypeScript, RTL)    │
│  Field Staff Mobile:      React Native + SQLite offline             │
│  CDN:                     CloudFront (listings) + Vercel Edge       │
├─────────────────────────────────────────────────────────────────────┤
│ API LAYER                                                           │
│  API Style:               REST + OpenAPI 3.0 (auto-generated)       │
│  BFF:                     Next.js API routes (browser clients)      │
│  Auth:                    RS256 JWT (access 15min, refresh 7d)      │
│  Realtime:                Server-Sent Events + Redis pub/sub        │
├─────────────────────────────────────────────────────────────────────┤
│ APPLICATION SERVICES                                                │
│  Runtime:                 Python 3.11+ / FastAPI (ASGI/uvicorn)     │
│  ORM:                     SQLAlchemy 2.0 (async) + GeoAlchemy2      │
│  Containerization:        Docker + AWS ECS Fargate                  │
│  Service Boundaries:      AuthGate | PMS Core | OpsManager | FinancialEngine │
├─────────────────────────────────────────────────────────────────────┤
│ BACKGROUND / ASYNC                                                  │
│  Queue broker:            Redis 7 (ElastiCache)                     │
│  Task worker:             Celery 5.x                                │
│  Scheduler:               Celery Beat (escrow timer, payout batch)  │
│  Event bus:               Celery task chains (Phase 1)              │
├─────────────────────────────────────────────────────────────────────┤
│ DATA                                                                │
│  Primary DB:              PostgreSQL 16+ (AWS RDS Multi-AZ)         │
│  Spatial:                 PostGIS extension                         │
│  Full-text:               pg_trgm + unaccent (Phase 1) → Algolia (Phase 2) │
│  Cache / sessions:        Redis 7 (ElastiCache)                     │
│  Mobile offline:          SQLite / Room (field staff app only)      │
├─────────────────────────────────────────────────────────────────────┤
│ STORAGE                                                             │
│  File storage:            AWS S3 (three buckets: listings/kyc/ops)  │
│  KYC encryption:          AWS KMS (customer-managed key)            │
│  CDN:                     AWS CloudFront (listing photos)           │
├─────────────────────────────────────────────────────────────────────┤
│ EXTERNAL SERVICES                                                   │
│  Payments (local):        Paymob (Fawry, Meeza, Vodafone Cash, InstaPay, EGP cards) │
│  Payments (intl cards):   Stripe (Visa, Mastercard, Apple/Google Pay) │
│  OTP:                     Twilio Verify API                         │
│  Social OAuth:            Firebase Authentication (Google + Apple)  │
│  KYC / OCR:               AWS Rekognition + Textract                │
│  Maps:                    Google Maps API (Arabic locale)           │
│  Primary comms:           WhatsApp Business API                     │
│  Email:                   AWS SES                                   │
│  In-app push:             Firebase Cloud Messaging (FCM)            │
│  AI (Phase 2+):           Anthropic Claude API                      │
├─────────────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE                                                      │
│  Primary region:          AWS me-central-1 (UAE — Abu Dhabi)        │
│  DR region:               AWS me-south-1 (Bahrain — warm standby)   │
│  Frontend hosting:        Vercel                                    │
│  Container registry:      AWS ECR                                   │
│  DNS:                     AWS Route 53                              │
│  CI/CD:                   GitHub Actions → ECR → ECS Fargate        │
│  IaC:                     Terraform (module per region)             │
├─────────────────────────────────────────────────────────────────────┤
│ DEVELOPER TOOLING                                                   │
│  Linting:                 ruff                                      │
│  Types:                   mypy (strict)                             │
│  Testing:                 pytest (≥ 80% coverage)                   │
│  Security scan:           bandit + safety + trufflehog              │
│  API docs:                FastAPI auto-generated OpenAPI 3.0        │
│  Migrations:              Alembic                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Conflicts Resolved by This Freeze

All three open conflicts recorded in `TECH_STACK.md` are now resolved:

| Conflict | Resolution | ADR |
|----------|-----------|-----|
| **Frontend: React vs Next.js** | Next.js | ADR-001 |
| **Backend: Node.js vs Python** | Python / FastAPI | ADR-002 |
| **Payment: Paymob vs Stripe** | Both — Paymob (local rails) + Stripe (intl cards) | ADR-003 |

---

## Phase 1 Build Prerequisites (From ADRs)

Before Sprint 1 begins, the following must be provisioned:

| Item | Owner | ADR |
|------|-------|-----|
| AWS account + me-central-1 VPC | Founder | ADR-007 |
| AWS RDS PostgreSQL (PostGIS enabled) | DevOps | ADR-005 |
| AWS ElastiCache Redis cluster | DevOps | ADR-005 |
| AWS S3 buckets (3: listings, kyc, ops) | DevOps | ADR-009 |
| AWS ECR container registry | DevOps | ADR-007 |
| Vercel project linked to repo | DevOps | ADR-007 |
| Firebase project (Auth enabled) | DevOps | ADR-006 |
| Twilio account (Verify API enabled) | DevOps | ADR-006 |
| Paymob merchant account | Founder | ADR-003 |
| Stripe account | Founder | ADR-003 |
| Google Maps API key | DevOps | ADR-010 |
| WhatsApp Business API account | Founder | ADR-011 |
| AWS SES domain verification | DevOps | ADR-011 |
| AWS Rekognition + Textract enabled | DevOps | ADR-006 |
| Meta Business Manager verified | Founder | ADR-011 |

---

## Phase 1 Schema Non-Negotiables (From ADR-015)

The following must be in the Sprint 1 schema regardless of Phase 1 market scope:

1. **All monetary amounts**: `amount_minor INTEGER + currency CHAR(3)` — no single-currency assumptions
2. **All user records**: `locale VARCHAR(10)` field (e.g., `ar-EG`, `ar-SA`, `ar-AE`)
3. **All listing records**: `country CHAR(2)` + `currency CHAR(3)` — not hardcoded to Egypt
4. **Event log tables**: `user_searches`, `listing_views`, `booking_funnel_events` — AI training data from Sprint 1

---

## What Is NOT Decided Here

These decisions are intentionally deferred:

| Topic | Reason Deferred | Trigger |
|-------|----------------|---------|
| GCC deployment (Saudi/UAE regions) | Phase 3 — not Phase 1 | Saudi/UAE licensing obtained |
| Algolia (full Arabic search) | Phase 2 — after customer validation of search quality | Customer feedback: search quality friction |
| WebSocket (live chat) | Phase 2 — live chat not in MVP scope | FC-07 expansion or new feature |
| Kafka / RabbitMQ | Phase 3 — message volume threshold | > 100K messages/day |
| ML model selection (Phase 3 AI) | Phase 3 — after 50K transactions | ADR-004 Phase 3 review |
| Microservice physical separation | Phase 3 — currently modular monolith | Scaling bottleneck identified in a specific service |
| Sumsub / Onfido (advanced KYC) | Phase 2 — if CBE requires AML reporting | Regulatory requirement |

---

## Freeze Enforcement Rules

1. **No technology not listed in this document may be added to Phase 1 without a new ADR.**
2. **No ADR may be reversed without Founder sign-off and a superseding ADR.**
3. **Every Sprint 1 PR must reference at least one ADR that authorized the technical choice.**
4. **The payment processor conflict is resolved. No further debate. ADR-003 is final.**
5. **Phase 1 AI features: ZERO. No LLM API calls, no ML libraries, no vector stores in Phase 1 production code.**

---

## Document Links

| Document | Purpose |
|---------|---------|
| [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) | Project identity and market |
| [`PRODUCT_CANON.md`](PRODUCT_CANON.md) | Canonical product specification |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture and service boundaries |
| [`TECH_STACK.md`](TECH_STACK.md) | Technology with conflicts (now resolved) |
| [`ENGINEERING_RULES.md`](ENGINEERING_RULES.md) | Code standards and build rules |
| [`docs/architecture/adr/`](docs/architecture/adr/) | All 15 ADRs with full rationale |

---

**Architecture Freeze: Active**
**Implementation: Gated behind Phase 0 validation**
**Next gate review**: When Phase 0 conditions clear — see [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)
