# 01 — System Overview

**Cross-references**: [ARCHITECTURE.md](../../ARCHITECTURE.md) · [MASTER_CONTEXT.md](../../MASTER_CONTEXT.md) · [ADR-001](../architecture/adr/ADR-001-frontend-framework.md) through [ADR-015](../architecture/adr/ADR-015-multi-region-expansion.md) · [03_MICROSERVICES.md](03_MICROSERVICES.md) · [11_DEPLOYMENT_ARCHITECTURE.md](11_DEPLOYMENT_ARCHITECTURE.md)

---

## 1. Product Identity

StayOS is an **AI-powered, two-sided accommodation marketplace** for MENA. It is not a computer operating system — "OS" is a business metaphor. The platform connects property owners and managers (supply) with guests and travelers (demand), built for Egypt first and the GCC corridor as the primary business.

See [MASTER_CONTEXT.md](../../MASTER_CONTEXT.md) and [DECISION_LOG.md](../../DECISION_LOG.md) DEC-001.

---

## 2. Architecture Style

**Phase 1**: Modular monolith with explicit service boundaries. Physical microservice separation is a Phase 2 decision. Each boundary is a Python package within a single FastAPI application, deployable as separate ECS tasks if needed.

**Rationale**: A small Phase 1 team cannot operate a full microservice mesh. Boundaries are drawn now to avoid future rewrites. The service contract (REST API, event schema) is the same whether co-located or distributed.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                   │
│                                                                         │
│   [Guest Web]         [Host Dashboard]        [Field Staff Mobile]      │
│   Next.js 14 App      Next.js 14 App          React Native (offline)   │
│   Arabic RTL (ar)     Arabic RTL (ar)          SQLite local store       │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │  HTTPS / REST / SSE
┌───────────────────────────▼─────────────────────────────────────────────┐
│                       API Gateway Layer                                 │
│               AWS ALB → FastAPI (ASGI / uvicorn)                       │
│              JWT verification · rate limiting · routing                 │
└──────┬────────────┬────────────┬────────────┬────────────┬─────────────┘
       │            │            │            │            │
┌──────▼──────┐ ┌───▼──────┐ ┌──▼──────┐ ┌──▼────────┐ ┌▼────────────┐
│  AuthGate   │ │ PMS Core │ │Reserva- │ │OpsManager │ │Financial    │
│  (FC-01)    │ │ (FC-04)  │ │tion     │ │ (FC-05)   │ │Engine       │
│             │ │ +Search  │ │Engine   │ │           │ │(FC-06)      │
│             │ │ (FC-02)  │ │(FC-03)  │ │           │ │             │
└──────┬──────┘ └───┬──────┘ └──┬──────┘ └──┬────────┘ └┬────────────┘
       │            │            │            │            │
       └────────────┴────────────┴────────────┴────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                         Data Layer                                      │
│                                                                         │
│  PostgreSQL 16 + PostGIS 3       Redis 7 (OTP · queue broker · SSE)    │
│  AWS S3 (photos · KYC docs)      Celery + Beat (background jobs)        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                       External Services                                 │
│                                                                         │
│  Paymob (EG rails)  Stripe (intl cards)  Twilio (SMS OTP)              │
│  WhatsApp Business API              Firebase Auth (Google/Apple SSO)    │
│  Google Maps API (Arabic geocoding) AWS SES (transactional email)       │
│  AWS Textract / Rekognition (KYC OCR)                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Service Inventory

| Service | Feature | Tech Boundary | Phase |
|---------|---------|---------------|-------|
| AuthGate | FC-01 | FastAPI router + Firebase Admin SDK | Phase 1 |
| PMS Core + Search | FC-02, FC-04 | FastAPI router + PostGIS + SQLAlchemy | Phase 1 |
| Reservation Engine | FC-03 | FastAPI router + async row-level locking | Phase 1 |
| OpsManager | FC-05 | FastAPI router + Celery worker + SQLite sync | Phase 1 |
| FinancialEngine | FC-06 | FastAPI router + Celery Beat + double-entry ledger | Phase 1 |
| Incident Console | FC-07 | Next.js dashboard (UI only — no new service boundary) | Phase 1 |
| Notification Service | Cross-cutting | Celery worker — WhatsApp · email · SMS | Phase 1 |

Full service specs: [03_MICROSERVICES.md](03_MICROSERVICES.md).

---

## 4. Technology Decisions (Resolved ADRs)

| Layer | Decision | ADR |
|-------|---------|-----|
| Frontend | Next.js 14 (App Router, TypeScript) | ADR-001 |
| Backend | Python 3.11 + FastAPI + SQLAlchemy 2.0 + Pydantic v2 | ADR-002 |
| Payment | Paymob (Egypt rails) + Stripe (intl cards) | ADR-003 |
| AI/ML | Deferred to Phase 3 (no AI in Phase 1) | ADR-004 / DEC-008 |
| Database | PostgreSQL 16 + PostGIS 3 + Redis 7 | ADR-005 |
| Auth | Firebase Authentication + Twilio OTP | ADR-006 |
| Deployment | AWS `me-central-1` (UAE) — ECS Fargate | ADR-007 |
| Realtime | Server-Sent Events (SSE) via Redis pub/sub | ADR-008 |
| Storage | AWS S3 (3 buckets: listings · KYC · ops-photos) | ADR-009 |
| Search | PostGIS (spatial) + pg_trgm (text) → Algolia Phase 2 | ADR-010 |
| Notifications | WhatsApp Business API + AWS SES + Twilio SMS | ADR-011 |
| Background Jobs | Celery + Redis broker + Celery Beat | ADR-012 |
| Events | Transactional Outbox pattern (PostgreSQL) | ADR-013 |
| API Style | REST + OpenAPI 3.0 (auto-generated by FastAPI) | ADR-014 |
| Multi-region | AWS ME-Central-1 → KSA region → UAE → Qatar | ADR-015 |

---

## 5. Request Lifecycle

```
Browser (Next.js SSR) → AWS CloudFront → AWS ALB → FastAPI (ASGI)
    → JWT middleware (Firebase Admin SDK verify)
    → Rate limiter (Redis sliding window)
    → Route handler (service module)
    → SQLAlchemy async session → PostgreSQL
    → (async) Celery task enqueue → Redis broker
    → Celery worker → external services (WhatsApp, Paymob, S3)
    → Response stream back to browser
```

---

## 6. Data Residency

All user data stored in AWS `me-central-1` (UAE). Compliant with Egypt CBE guidance and acceptable for GCC expansion without data migration. Saudi Arabia expansion requires a `me-central-2` (KSA) replica. See [ADR-015](../architecture/adr/ADR-015-multi-region-expansion.md) and [12_SCALABILITY_PLAN.md](12_SCALABILITY_PLAN.md).

---

## 7. Non-Goals (Phase 1)

- No microservice mesh, Kubernetes, or service mesh (Istio/Linkerd)
- No GraphQL API
- No AI/ML features (DEC-008)
- No channel manager integrations (Airbnb/Booking.com sync)
- No mobile app for guests or hosts (web only; field staff app is the exception)
- No multi-language backend (Arabic strings are data, not code)
