# ARCHITECTURE.md — System Architecture

**Read [`CONTEXT.md`](CONTEXT.md) before this file.**

**This document describes the Phase 1 MVP architecture.** It is an engineering design specification, not a build instruction. Phase 1 build is gated behind Phase 0 validation. See [`ROADMAP.md`](ROADMAP.md).

Source documents for this file:
- [`docs/02_product/PRODUCT_NORMALIZATION_REPORT.md`](docs/02_product/PRODUCT_NORMALIZATION_REPORT.md)
- [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md)
- [`docs/02_product/FLOWS.md`](docs/02_product/FLOWS.md)
- [`docs/02_product/ENGINEERING_BACKLOG.md`](docs/02_product/ENGINEERING_BACKLOG.md)
- [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md)

---

## 1. System Type

StayOS Phase 1 MVP is a **two-sided marketplace web platform** with a mobile-first field operations client.

- Not a microservices architecture in Phase 1 — design for modular monolith with clear service boundaries.
- Service boundaries are defined now; physical separation is a Phase 2 decision.
- Mobile app (field staff offline operations) is the only client requiring native mobile capabilities.

---

## 2. Canonical Service Boundaries

Source: [`docs/02_product/PRODUCT_NORMALIZATION_REPORT.md`](docs/02_product/PRODUCT_NORMALIZATION_REPORT.md)

The normalization report identified and merged duplicated modules into four canonical services:

| Service | Canonical Name | Feature | Responsibility |
|---------|---------------|---------|----------------|
| Identity & Auth | **AuthGate** | FC-01 | Session management, KYC verification, OTP, SSO for all personas (Guest, Host, Field Staff) |
| Property Data | **PMS Core** | FC-04 | Unit data object (single immutable record per property), calendar, pricing, listing management |
| Operations | **OpsManager** | FC-05 | Turnover ticket lifecycle, field staff task dispatch, photographic verification, offline sync |
| Finance | **FinancialEngine** | FC-06 | Double-entry ledger, escrow, fee splits, tax withholding, payout ACH |

These four names are canonical. Use them in all code, documentation, API contracts, and ADRs.

### What is NOT a named service in Phase 1:
- Search is a capability of PMS Core + PostGIS, not a standalone service (FC-02)
- Incident console (FC-07) is a UI dashboard over existing service data, not a service boundary

---

## 3. System Diagram (Logical)

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│                                                                  │
│  [Guest Web App]  [Host Dashboard]  [Field Staff Mobile App]     │
│  (Arabic RTL)     (Arabic RTL)      (Offline-first, SQLite)      │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / REST / WebSocket
┌────────────────────────────▼─────────────────────────────────────┐
│                        API Gateway                               │
│                   (Auth middleware: AuthGate)                    │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐ ┌──▼────────────┐
│  AuthGate   │ │  PMS Core  │ │ OpsManager │ │FinancialEngine│
│  (FC-01)    │ │  (FC-04)   │ │  (FC-05)   │ │   (FC-06)     │
│  + KYC      │ │  + FC-02   │ │            │ │               │
│             │ │  Search    │ │            │ │               │
└──────┬──────┘ └─────┬──────┘ └────┬───────┘ └──────┬────────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                      Data Layer                                  │
│                                                                  │
│  PostgreSQL (primary DB)                                         │
│  PostGIS extension (spatial queries — FC-02)                     │
│  Redis (OTP cache, 5-min TTL)                                    │
│  AWS S3 (photo uploads from field app)                           │
└──────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    External Services                             │
│                                                                  │
│  Twilio (SMS OTP)                                                │
│  Firebase Identity or Auth0 (social OAuth)                       │
│  Google Maps API (map rendering — FC-02)                         │
│  WhatsApp Business API (guest-host comms — DEC-009)              │
│  Payment processor: UNRESOLVED — see §7                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Data Flows

Source: [`docs/02_product/FLOWS.md`](docs/02_product/FLOWS.md)

### 4.1 Booking Flow (FC-01 + FC-02 + FC-03)

```
Unauthenticated User
  → Discovery Search (dates, geo-filter via PostGIS)
  → AuthGate triggered (OTP or SSO)
  → KYC verification gate (ID OCR)
  → Reservation workflow: atomic calendar lock (row-level isolation)
  → Payment authorization hold [PAYMENT PROCESSOR UNRESOLVED — see §7]
  → Transaction ledger registration (FinancialEngine)
  → Booking confirmation: generate reference ID → dispatch notifications (WhatsApp)
```

### 4.2 Checkout-to-Turnover Loop (FC-03 → FC-05)

```
Guest Checkout Event (11:00 AM hook)
  → OpsManager: query location pool → auto-generate UNASSIGNED turnover ticket
  → Field Staff App: accept priority queue card
  → TaskStepWizard: step checklists → local image capture → SQLite storage
  → Data sync on connectivity recovery: local cache → S3 upload
  → PMS Core: unit status → READY_FOR_OCCUPANCY
```

### 4.3 Escrow Settlement (FC-06)

```
Guest Check-In Event
  → Escrow trigger: T+24h countdown begins
  → Tax engine: geo-boundary query → split regional occupancy taxes
  → Financial batch: aggregate unlocked balances → format ACH/wire
  → Payout dispatch to verified host bank account
```

---

## 5. Critical Concurrency Requirement

Source: [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md) BR-INV-01

**Calendar booking writes must use ACID-compliant transactions with row-level isolation locking.**

No overlapping confirmed reservations may be written to a single unit. This must be enforced at the database transaction level, not in application logic. This is the highest-risk technical component per the feature dependency map (FC-03: "High Financial Risk").

---

## 6. Offline Architecture (Field Staff Mobile)

Source: [`docs/02_product/ENGINEERING_BACKLOG.md`](docs/02_product/ENGINEERING_BACKLOG.md) FC-05

Field staff operate in environments with unreliable network connectivity. The mobile client must:

- Use **SQLite/Room** for local-first data storage of ticket states, checklists, and text entries.
- Store captured images in device sandbox storage when offline.
- Run a background sync queue service that monitors connectivity and uploads queued assets to **AWS S3** on recovery.
- Never require connectivity to advance a task step checklist.

---

## 7. Known Conflicts (Do Not Resolve)

### CONFLICT-001: Payment Processor (CRITICAL — blocks FC-03 implementation)

| Document | Processor |
|----------|-----------|
| `DECISION_LOG.md` DEC-004 | **Paymob** — Egypt primary |
| `MASTER_CONTEXT.md` | **Paymob** |
| `FLOWS.md` | **Stripe** Gateway Protocol |
| `ENGINEERING_BACKLOG.md` FC-03 | **Stripe** Merchant Platform Payment Intents |
| `MVP_FREEZE.md` | **Stripe** |

**Impact**: FC-03 Reservation Engine cannot be implemented until this is resolved. An ADR must be written in `docs/architecture/adr/` naming one payment processor before any FC-03 code is written.

### CONFLICT-002: Frontend Framework

`MASTER_CONTEXT.md` says "React or Next.js." No ADR written. Frontend scaffold requires this decision first.

### CONFLICT-003: Backend Language

`MASTER_CONTEXT.md` says "Node.js or Python (Django/FastAPI)." No ADR written. Service scaffold requires this decision first.

---

## 8. ADR Process

No ADRs have been written yet. The ADR template is at [`docs/architecture/`](docs/architecture/).

ADRs are required before:
- Choosing the frontend framework (React vs Next.js)
- Choosing the backend language (Node.js vs Python)
- Resolving the payment processor conflict (Paymob vs Stripe)
- Any decision to split the monolith into physical microservices

---

## 9. What Does NOT Exist Yet

- No codebase (Phase 0 active; Phase 1 is gated)
- No infrastructure provisioned
- No database schemas
- No API contracts
- No ADRs written

The service boundaries, data flows, and concurrency rules in this document define the target state for Phase 1. They are not descriptions of current code.
