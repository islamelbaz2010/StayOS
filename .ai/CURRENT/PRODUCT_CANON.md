# PRODUCT_CANON.md — Canonical Product Specification

**Purpose**: Single authoritative product definition. All agents, engineers, and reviewers defer to this document when there is ambiguity about scope, features, or constraints.

**This document extracts from — and does not supersede — the following source documents:**
- [`MASTER_CONTEXT.md`](MASTER_CONTEXT.md) — identity, market, strategy
- [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md) — scope freeze
- [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md) — feature definitions
- [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md) — implementation constraints
- [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md) — build order
- [`DECISION_LOG.md`](DECISION_LOG.md) — all accepted decisions

---

## 1. Product Identity

**StayOS** is an AI-powered, two-sided accommodation marketplace for the MENA region.

- **"OS" is a business metaphor** — StayOS is the operating system of accommodation in MENA. It is not a computer operating system. (DEC-001)
- **Supply side**: Property managers, hotels, resort operators, and individual hosts in Egypt and GCC.
- **Demand side**: Egyptian domestic travelers, GCC nationals visiting Egypt, international tourists.
- **Geographic entry**: Egypt first (proof-of-concept), Egypt–GCC corridor as the business, GCC expansion Phase 3+. (DEC-002)

---

## 2. Market Context

| Dimension | Value |
|-----------|-------|
| Egypt online accommodation TAM | $200M–$400M/year |
| Egypt–GCC corridor TAM | $300M–$800M accommodation spend |
| Primary competitor pain point | English-first OTAs, no local payment rails, no Arabic UX |
| Primary differentiator | Arabic-first, Egyptian payment rails, trust infrastructure, local market knowledge |

---

## 3. Product Strategy (Accepted Decisions)

| ID | Decision | Status |
|----|---------|--------|
| DEC-001 | StayOS is an accommodation marketplace, not a computer OS | Accepted |
| DEC-002 | Egypt as proof-of-concept, GCC–Egypt corridor as business | Accepted |
| DEC-003 | Arabic-first UX (RTL primary, culturally appropriate filters) | Accepted |
| DEC-004 | Paymob as primary payment processor for Egypt | Accepted — **CONFLICT with FLOWS.md, see §10** |
| DEC-005 | B2B2C supply strategy: hotels/PMs first, individual hosts second | Accepted |
| DEC-006 | Phase gate model: no Phase 1 code until Phase 0 gates clear | Accepted |
| DEC-007 | Zero commission for first 50 hosts (supply acquisition) | Proposed |
| DEC-008 | AI/ML deferred: Phase 0 = zero AI; Phase 3+ = ML features | Accepted |
| DEC-009 | WhatsApp Business API as primary host-guest communication channel | Accepted |
| DEC-010 | Revenue model: 8–12% host commission + 3–5% guest service fee + B2B SaaS $50–200/month | Proposed |

---

## 4. Phase Gate Model

| Phase | Name | Status | Gate |
|-------|------|--------|------|
| Phase -1 | Founder Discovery | ✅ Complete | 21 docs, 600+ risks catalogued |
| Phase 0 | Customer Validation | 🔴 Active — LOCKED | 50 traveler interviews + 30 host interviews + 10 manual transactions + Guest NPS ≥ 7.0 + Host NPS ≥ 7.0 + wedge identified |
| Phase 1 | MVP Build | ⏳ Pending | Phase 0 gates clear |
| Phase 2 | Growth | ⏳ Future | Phase 1 shipped + PMF signals |
| Phase 3+ | AI & Expansion | ⏳ Future | 50K+ transactions |

Gate conditions source: [`docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md`](docs/phase--1/reports/16_REQUIRED_VALIDATIONS.md)

---

## 5. MVP Scope (Frozen)

**Budget**: $150,000 | **Timeline**: 6 months | **Core loop**: Direct Booking-to-Turnover Completion

Source: [`docs/02_product/MVP_FREEZE.md`](docs/02_product/MVP_FREEZE.md)

### 5.1 In Scope

| FC | Feature | Priority | Sprint |
|----|---------|----------|--------|
| FC-01 | AuthGate & Identity (KYC, OTP, SSO) | P0 | Sprint 1 |
| FC-02 | Spatial Search Engine (geo-filter, map clusters) | P1 | Sprint 2 |
| FC-04 | Property Management System (PMS Core) | P2 | Sprint 2–3 |
| FC-03 | Reservation Lifecycle Engine (booking, payment, calendar lock) | P0 | Sprint 3–4 |
| FC-05 | OpsManager Ticket Engine (turnover task dispatch) | P0 | Sprint 4–5 |
| FC-06 | Treasury Ledger & Payout Processor (escrow, tax, ACH) | P1 | Sprint 5 |
| FC-07 | Incident Resolution Console | P2 | Sprint 6 |

### 5.2 Explicitly Excluded from MVP

- Channel manager integrations (Airbnb, Booking.com, VRBO sync)
- Dynamic pricing / ML pricing algorithms
- Automated CRM dashboards
- Advanced treasury controls (W-8BEN, 1099-K automation)
- Any AI/ML feature (AI is Phase 3+ only per DEC-008)

---

## 6. Feature Definitions

Source: [`docs/02_product/FEATURE_CATALOG.md`](docs/02_product/FEATURE_CATALOG.md)

### FC-01: Universal AuthGate & Identity Profiler
Unified identity gateway for all system personas. Cellular OTP (6-digit SMS via Twilio) and social SSO (Google/Apple). Mandatory KYC sub-service: passport/license OCR parsing and biometric validation.

### FC-02: Spatial Search & Inventory Discovery
Geo-spatial search with interactive map, coordinate pin clustering, and contextual filters (availability, price histograms, amenity checklists). Powered by PostGIS.

### FC-03: Transactional Reservation Lifecycle Engine
Concurrency-locked booking processor. Handles checkout, payment authorization, promotional code evaluation, and calendar locking. Payment processor unresolved — see §10.

### FC-04: Multi-Tenant Property Management System (PMS Core)
Property grid, manual calendar adjustments, tier pricing rules, financial KPIs (ADR, RevPAR, Occupancy).

### FC-05: Unified Operations Ticket Engine (OpsManager)
Local-first task assignment for field staff. Prioritized checklists, photographic verification gates, supply tracking, automated scheduling triggered by checkout hooks. Offline-capable via SQLite.

### FC-06: Treasury Ledger & Payout Processor
Double-entry financial system. Escrow management, platform fee splits, geo-fenced tax withholding, automated ACH/direct deposit to verified accounts.

### FC-07: Incident Resolution Console & Safety Override
CRM command dashboard with communication bridges, booking modifications, and global emergency kill-switches.

---

## 7. Build Order

Strict dependency sequence. Source: [`docs/02_product/FEATURE_DEPENDENCY_MAP.md`](docs/02_product/FEATURE_DEPENDENCY_MAP.md)

```
FC-01 (AuthGate)  ← Build first. All other features depend on it.
       │
       ├── FC-02 (Spatial Search)  ← Parallel with FC-04
       └── FC-04 (PMS Core)        ← Parallel with FC-02
                    │
                    └── FC-03 (Reservation Engine)  ← Requires FC-01 + FC-02 + FC-04
                                  │
                          ┌───────┴───────┐
                          │               │
                       FC-05 (Ops)    FC-06 (Treasury)
```

FC-07 (Incident Console) depends on FC-01 and FC-03.

---

## 8. Business Rules (Non-Negotiable)

Source: [`docs/02_product/BUSINESS_RULES.md`](docs/02_product/BUSINESS_RULES.md)

| ID | Rule | Enforced At |
|----|------|-------------|
| BR-ID-01 | No checkout / listing activation without KYC `VERIFIED` | Auth middleware |
| BR-ID-02 | Host legal name in profile must match payout routing and tax forms | Payout service |
| BR-INV-01 | No overlapping reservations on a single unit — ACID row-level lock required | Reservation engine |
| BR-INV-02 | Unit cannot switch to `READY_FOR_OCCUPANCY` unless turnover ticket is `CLOSED` | PMS state machine |
| BR-OPS-01 | Checkout event immediately spawns `UNASSIGNED` turnover ticket | Event hook |
| BR-OPS-02 | Turnover ticket must set 4-hour resolution window from checkout | OpsManager |
| BR-OPS-03 | Ticket cannot move to `VERIFICATION_PENDING` or `CLOSED` without photo array | Field app validation |
| BR-FIN-01 | Guest funds locked in escrow for 24 hours post-check-in | Treasury ledger |
| BR-FIN-02 | Every ledger transaction must split regional occupancy taxes into isolated accounts | Financial engine |
| BR-FIN-03 | Any error in host tax/routing fields halts all pending payouts instantly | Payout scheduler |
| BR-SUP-01 | Safety hazard or lockout incidents auto-classified `CRITICAL_SLA_BREACH` | Incident console |

---

## 9. User Personas

Source: [`docs/02_product/USER_STORIES.md`](docs/02_product/USER_STORIES.md)

| Persona | Role | Primary Flows |
|---------|------|--------------|
| Guest | Traveler booking accommodation | Search → Auth/KYC → Book → Stay → Review |
| Host / Property Manager | Manages listings and properties | List → Calendar → Pricing → Ops oversight |
| Field Staff (Cleaner/Tech) | Executes turnover operations | Task queue → Checklist → Photo verify → Close ticket |
| Finance / Backoffice | Manages ledger and payouts | Audit ledger → Manage payouts → Tax compliance |

---

## 10. Known Conflicts (Reported, Not Resolved)

### CONFLICT-001: Payment Processor (CRITICAL)

| Document | Processor Named |
|----------|----------------|
| `DECISION_LOG.md` DEC-004 | **Paymob** (primary for Egypt) |
| `MASTER_CONTEXT.md` | **Paymob** (primary) |
| `FLOWS.md` | **Stripe** Gateway Protocol |
| `ENGINEERING_BACKLOG.md` FC-03 Task 2 | **Stripe** Merchant Platform Payment Intents |
| `MVP_FREEZE.md` | **Stripe** (third-party payment gateway) |
| `LEAN_PRODUCT.md` | **Stripe** |

**Status**: Unresolved. No payment integration code should be written until the founder makes an explicit ADR in `docs/architecture/adr/` resolving this conflict.

### CONFLICT-002: Frontend Framework

`MASTER_CONTEXT.md` says "React or Next.js" — no decision recorded. No ADR in `docs/architecture/adr/`. No UI scaffolding should proceed until this is resolved.

### CONFLICT-003: Backend Language / Framework

`MASTER_CONTEXT.md` says "Node.js or Python (Django/FastAPI)" — no decision recorded. No service scaffolding should proceed until this is resolved.

---

## 11. Experience Thresholds (Acceptance Criteria)

Source: [`docs/03_customer_experience/EXPERIENCE_RULES.md`](docs/03_customer_experience/EXPERIENCE_RULES.md)

| Metric | Threshold |
|--------|-----------|
| Booking completion | ≤ 3 clicks / ≤ 3 screens |
| Search results load | ≤ 2 seconds |
| WhatsApp initial response | ≤ 30 seconds |
| Refund processed | ≤ 24 hours |
| Dispute resolution | ≤ 15 minutes (contact to solution) |
| Uptime | ≥ 99.5% |

---

## 12. Trust Framework (5 Layers)

Source: [`docs/03_customer_experience/TRUST_FRAMEWORK.md`](docs/03_customer_experience/TRUST_FRAMEWORK.md)

1. **Identity** — Zero-Ghost Protocol: verified IDs, KYC gate on all transactions
2. **Financial** — Vault escrow with T+24h release; transparent fee disclosure
3. **Physical Safety** — Property safety standards, emergency contact protocols
4. **Integrity** — Review system with fraud detection; no pay-to-rank
5. **Dispute Resolution** — 15-minute SLA, dedicated resolution agents

---

## 13. Arabic-First UX Requirements

Source: `DECISION_LOG.md` DEC-003

- RTL layout is the primary layout (not a secondary translation)
- Culturally appropriate filters: halal, family-only, prayer facilities
- Arabic content and UX patterns designed natively, not translated from English
- All UI components must support RTL from day one
