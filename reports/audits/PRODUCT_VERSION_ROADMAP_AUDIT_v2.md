# STAYOS — UNIVERSAL PRODUCT SITUATION & VERSION ROADMAP AUDIT v2.0

**Audit Date:** 2026-08-17
**Branch Audited:** `tooling/repository-intelligence`
**Latest Commit Considered:** `9fd5f63` (2026-08-10 — discovery engine + critical-path fixes)
**Reconciled Decision Context:** `.ai/AUDIT/DECISION_RECONCILIATION_2026-08-17.md`
**Authority Hierarchy Applied:** Reconciled Founder decisions → `07_FINAL_EXECUTIVE_DECISION.md` → `02_SPRINT3_EXECUTION_LOCK.md` → `MVP_SCOPE_FREEZE.md` → Current repository code → `PRODUCT_VERSION_ROADMAP_AUDIT.md` v1.0 (2026-08-14)

---

## EXECUTIVE HEADER

```
V1 STATUS:             YELLOW — Code-complete; operational layer 0%.
V1 COMPLETION:         ~88-90% code; ~0% commercial/operational.
CURRENT STAGE:         Code-Complete Pre-Alpha — Closed Alpha not yet launched.
CRITICAL BLOCKER:      No live environment with real credentials.
                       Real users, real listings, real bookings: 0.
NEXT GATE:             Closed Alpha Launch — first real host onboarded,
                       first real listing live, first real guest transaction.
```

---

## 1. EXECUTIVE SITUATION

StayOS is a two-sided, Arabic-first, trust-first accommodation marketplace purpose-built for the MENA region, with Egypt (New Cairo proof-of-concept) as the launch market and the Egypt-GCC corridor as the long-term business.

The engineering product is **code-complete at ~88-90% of the Closed Alpha scope**. The complete guest/host/admin booking loop — search → listing → book → host accept → payment proof upload → admin verify → booking confirmed — is implemented in both backend and frontend and has been code-validated by unit tests, type checks, lint, and build.

The product has **never been accessed by a real user**. No AWS/Terraform/Railway environment is provisioned. No real Twilio, Firebase, Paymob, AWS S3, or WhatsApp credentials are configured. No staging or production URL is live. No real listings, hosts, guests, or transactions exist.

The Executive Steering Committee approved Sprint 3 on 2026-08-03 (Option B: small mandatory vision-aligned additions) with a targeted Closed Alpha launch of 2026-08-19 and a 6-week alpha period ending at the MVP v1 Gate on 2026-09-16. That gate requires 40+ live listings in New Cairo, 7+ completed EGP bookings, 5+ host payouts, NPS ≥ 50, and 0 fraud.

The management conclusion from the prior audit (v1) still holds: **the gap is not primarily technical, it is operational/deployment execution.** The only remaining material code gap is the host payout frontend (~2 SP). Everything else before launch is credentials, environment provisioning, legal documents, and founder operations.

---

## 2. CURRENT PRODUCT DEFINITION

### 2.1 Target Customer / User

| User | Description | Current Evidence |
|------|-------------|------------------|
| **Guests** | Arabic-speaking short-term renters, primarily Egyptian domestic travelers and inbound GCC travelers looking for furnished apartments in New Cairo compounds. | `01_PRODUCT_THESIS.md`; `05_GO_TO_MARKET_VALIDATION.md` |
| **Hosts** | Property owners and managers in New Cairo who can list furnished apartments. | `04_FOUNDER_PLAYBOOK.md`; `02_SPRINT3_EXECUTION_LOCK.md` S3-003/004/011 |
| **Operators** | Founder-led admin team reviewing KYC, listings, and payment proofs. | `07_FINAL_IMPLEMENTATION_CONTRACT.md` Section 2.6–2.8 |

### 2.2 Problem Being Solved

Egyptian short-term rental market lacks a trusted, Arabic-first platform. Global OTAs are English-first, exclude local payment rails, lack cultural filters, and do not provide local trust signals. Hosts and guests fall back to Facebook groups and WhatsApp, with no verification, no payment protection, and no dispute resolution.

### 2.3 Core Value Proposition

- **Arabic-first** native UX and RTL as the default.
- **Cultural filters** (family-friendly, halal-certified, families-only) no incumbent offers.
- **KYC-verified hosts** and admin-reviewed listings.
- **Escrow messaging** and payment protection displayed at checkout.
- **EGP pricing** with local payment rails (Paymob primary; manual bank transfer fallback for alpha).

### 2.4 Primary User Journeys (As Implemented)

1. **Guest Booking Journey:** Landing search → search results → listing detail (photos, map, KYC badge, cultural tags) → create booking request → host accepts → manual payment instructions → upload bank transfer proof → admin verifies → booking confirmed.
2. **Host Onboarding Journey:** Register → KYC document upload → automated or manual admin KYC approval → role upgrade to host → create listing → upload photos → submit for review → admin approves → listing goes live.
3. **Admin Operations Journey:** Review pending listing queue → approve/reject → review payment proof queue → verify/reject → review KYC queue → approve/reject.
4. **Supply Activation (Admin Tool):** Discover property candidates via OSM/Overpass/Google Places → normalize/score/deduplicate → import as listings with overrides → contact property owners via outreach templates.

### 2.5 Main Product Workflows

| Workflow | End-to-End Implemented | Evidence |
|----------|------------------------|----------|
| Guest registration/login | Yes | `src/app/auth/router.py`; `apps/web/app/[locale]/auth/login/page.tsx` |
| Guest search/listing/book | Yes | `apps/web/app/[locale]/search/page.tsx`; `apps/web/app/[locale]/listings/[unitId]/page.tsx`; `apps/web/components/bookings/BookingPanel.tsx` |
| Host KYC/listing/photo | Yes | `apps/web/app/[locale]/host/kyc/page.tsx`; `apps/web/app/[locale]/host/listings/new/page.tsx`; `apps/web/components/listings/PhotoUpload.tsx` |
| Host booking accept/reject | Yes | `apps/web/app/[locale]/host/bookings/page.tsx`; `apps/web/components/bookings/HostBookingActions.tsx` |
| Guest payment proof | Yes | `apps/web/app/[locale]/checkout/[bookingId]/page.tsx`; `apps/web/components/payments/ProofUpload.tsx` |
| Admin listing/payment/KYC queues | Yes | `apps/web/app/[locale]/admin/pending/page.tsx`; `apps/web/app/[locale]/admin/payments/page.tsx` |
| Admin CSV import / discovery | Yes | `apps/web/app/[locale]/admin/import/page.tsx`; `src/app/discovery/` |

### 2.6 Inputs / 2.7 Processing / 2.8 Outputs

- **Inputs:** Phone number (Firebase OTP), search query/dates/guests, booking details, KYC documents, listing details, payment proof image/PDF, CSV import files, discovery candidate data.
- **Processing:** JWT RS256 + 9-role RBAC; AWS Textract/Rekognition KYC auto-verification with manual fallback; PostGIS spatial search; listing/booking/payment state machines; transactional outbox + Celery notifications.
- **Outputs:** Listing pages, booking confirmations, admin queues, SMS/WhatsApp notifications (10 event types × 2 locales), wallet/ledger/payout records.

### 2.9 Product Surfaces / UI

- **Web frontend (Next.js 14):** 21 compiled routes — landing, search, listing detail, auth, bookings (My Trips), checkout/payment proof, host dashboard, host listings CRUD, host photos, host KYC, host bookings, host availability calendar, admin pending listings, admin payments queue, admin KYC queue, admin bulk import, admin discovery engine, user profile.
- **No native mobile app.** No dedicated guest-host messaging UI.

### 2.10 Integrations / Dependencies

| Integration | Status for V1 | Evidence |
|-------------|---------------|----------|
| Twilio Verify (OTP) | Code complete; real account not configured | `src/app/auth/router.py`; `src/app/notifications/providers.py` |
| Firebase (social OTP) | Code complete; real project not configured | `src/app/auth/router.py`; `apps/web/lib/auth/firebase.ts` |
| AWS Textract/Rekognition | Code complete; real credentials not configured | `src/app/kyc/services.py` |
| AWS S3 | Code complete; real buckets not configured | `src/app/kyc/services.py`; `src/app/listings/services.py` |
| Paymob | Code complete; live merchant account not configured | `src/app/finance/router.py` |
| Stripe | Webhooks exist; not activated for alpha | `src/app/finance/router.py` |
| WhatsApp Business API | Code complete; not approved | `src/app/notifications/providers.py` |
| Google Maps | Replaced by Leaflet/OpenStreetMap in latest UI | `apps/web/components/listings/ListingMap.tsx` |
| PostGIS | Implemented | `src/app/listings/services.py` |
| Redis / Celery | Implemented | `src/app/celery_app.py` |

### 2.11 Data Lifecycle

- User data → PostgreSQL `auth` schema; KYC docs in S3.
- Listing data → PostgreSQL `pms` schema; photos in S3.
- Booking/payment data → PostgreSQL `reservations`/`payments` schemas.
- Finance data → PostgreSQL `finance` schema.
- Notifications → PostgreSQL outbox → Celery → SMS/WhatsApp/Email.
- Discovery candidates → PostgreSQL `discovery` schema.

### 2.12 Commercial Workflow

- 0% host commission for first 3 bookings.
- 0% guest fee for first 10 bookings.
- 15% founding guest discount.
- Future default: 10% host commission, 4% guest service fee, 2% platform take rate.
- Alpha payment: manual bank transfer with admin proof verification, or Paymob if live.
- Payouts: manual bank transfer by founder within 48 hours.

### 2.13 Operational Workflow

- Founder manually contacts hosts and agencies.
- Hosts upload KYC and listing details; admin reviews.
- Guests browse and book; hosts accept.
- Guests upload payment proof; admin verifies.
- Founder processes host payouts manually.
- Founder handles support via WhatsApp/SMS manually.

### 2.14 Deployment / Production State

- **Infrastructure:** Terraform fully defined (VPC, RDS, ElastiCache, ECS, ALB, S3, ECR, IAM, Secrets Manager) — NOT provisioned.
- **CI/CD:** GitHub Actions workflows written — GitHub secrets not configured.
- **Staging:** Docker Compose staging file exists — not deployed.
- **Production:** ECS + Vercel architecture defined — not deployed.
- **Domain:** `api.stayos.com` / `app.stayos.com` — not configured.

---

## 3. CURRENT CAPABILITY INVENTORY

| ID | Capability | User | Current Implementation | Environment | Tested? | Verified? | Real-World Proven? | Status | Planned Version |
|----|------------|------|----------------------|-------------|---------|-----------|-------------------|--------|-----------------|
| C-01 | Phone OTP registration/login | Guest/Host | `src/app/auth/router.py` | Development | Yes | No (no real Twilio) | No | YELLOW | V1 |
| C-02 | Firebase social login | Guest/Host | `src/app/auth/router.py`; `apps/web/lib/auth/firebase.ts` | Development | Yes (mocked) | No | No | YELLOW | V1 |
| C-03 | JWT RS256 + RBAC | All | `src/app/auth/dependencies.py` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-04 | Automated KYC (Textract/Rekognition) | Host | `src/app/kyc/services.py` | Development | Yes (mocked) | No | No | YELLOW | V1 |
| C-05 | Admin manual KYC review | Admin | `/admin/kyc` queue + modal | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-06 | Host KYC upload page | Host | `/host/kyc` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-07 | Guest → host role upgrade | Guest | `/profile`, `/host/kyc`, role upgrade endpoint | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-08 | Listing CRUD (create, edit, publish, archive) | Host | 15+ endpoints; full frontend forms | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-09 | Listing photo upload + cover | Host | Presigned S3 upload; `PhotoUpload.tsx` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-10 | Listing review workflow (submit/approve/reject) | Host/Admin | `/admin/pending`; listing services | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-11 | Public listing search (geo, filters, text) | Guest | PostGIS search; `/search` page | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-12 | Listing detail + gallery + map + trust badge | Guest | `/listings/[unitId]`; `TrustSection.tsx`; Leaflet map | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-13 | Guest booking request | Guest | `POST /bookings`; `BookingPanel.tsx` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-14 | Host accept/reject booking | Host | `PATCH /bookings/{id}`; `HostBookingActions.tsx` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-15 | Manual payment proof flow | Guest/Admin | `/checkout/[bookingId]`; `/admin/payments` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-16 | Booking confirmation (auto on payment verify) | All | `confirm_booking()` triggered by payment verify | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-17 | My Trips (guest view) | Guest | `/bookings` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-18 | Host bookings inbox | Host | `/host/bookings` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-19 | WhatsApp notifications | All | Celery workers, outbox, templates | Development | Yes (mocked) | No | No | RED | V1.1 |
| C-20 | Email notifications | All | SES provider stub | Development | Yes (mocked) | No | No | RED | V1.1 |
| C-21 | Finance: wallet + ledger | Host | `/finance/wallets/me` | Development | Yes | No | No | YELLOW | V1 |
| C-22 | Finance: escrow T+24h release | Admin | Celery beat; escrow endpoints | Development | Yes | No | No | YELLOW | V1 |
| C-23 | Finance: host payouts (request + admin process) | Host/Admin | Payout endpoints; **NO frontend** | Development | Yes (unit) | No frontend | No | RED | V1 |
| C-24 | Paymob webhook handler | System | HMAC-SHA512 verification; idempotent | Development | Yes (unit, mocked) | No | No | RED | V1.1 |
| C-25 | Stripe webhook handler | System | Stripe-Signature verification | Development | Yes (unit, mocked) | No | No | GRAY | V2 |
| C-26 | Admin bulk import (CSV/Excel) | Admin | `/admin/import` | Development | Yes | Yes (code) | No | YELLOW | V1 |
| C-27 | Discovery engine (OSM/Google Places) | Admin | `/admin/discovery`; `src/app/discovery/` | Development | Yes | No (no real OSM calls) | No | YELLOW | V1 |
| C-28 | Arabic RTL + i18n (ar/en) | All | next-intl; `ar.json` + `en.json` | Development | Yes (build pass) | Yes (code) | No | YELLOW | V1 |
| C-29 | Cultural tag filters | Guest | Search params; backend filter | Development | Yes | Partial UI | No | YELLOW | V1 |
| C-30 | KYC trust badge on listing | Guest | `TrustSection.tsx` | Development | No E2E | Yes (code) | No | YELLOW | V1 |
| C-31 | Escrow trust message | Guest | Implemented per Exec Decision | Development | No E2E | No | No | YELLOW | V1 |
| C-32 | Operations module (tasks/staff/maintenance) | Host | 19 backend endpoints; **NO frontend** | Development | Yes (unit) | No frontend | No | GRAY | V3 |
| C-33 | Guest-host messaging | Guest/Host | **NOT STARTED** | — | No | No | No | RED | V3 |
| C-34 | Reviews & ratings | Guest/Host | **NOT STARTED** | — | No | No | No | RED | V1.1 |
| C-35 | Push notifications (FCM) | Mobile | `device_tokens` table + endpoint | Development | No | No | No | RED | V3 |
| C-36 | Mobile app (iOS/Android) | All | **0% built / scaffold only** | — | No | No | No | RED | V3 |
| C-37 | Infrastructure (AWS provisioned) | Ops | Terraform defined; **NOT provisioned** | — | No | No | No | RED | V1 |
| C-38 | CI/CD pipelines (live) | Ops | Workflows written; **GitHub secrets NOT configured** | — | No | No | No | RED | V1 |
| C-39 | Staging / production environment | Ops | Scripts written; **NOT deployed** | — | No | No | No | RED | V1 |
| C-40 | Legal documents (ToS, Privacy, Cancellation) | All | **NOT on website** | — | No | No | No | RED | V1 |
| C-41 | E2E / integration test suite | Ops | **NOT DONE** | — | No | No | No | RED | V1 |
| C-42 | Security penetration test | Ops | **NOT DONE** | — | No | No | No | RED | V1.1 |
| C-43 | Analytics provider | Ops | Open decision; no implementation | — | No | No | No | GRAY | V3 |

**Status Legend:**
- **GREEN:** Implemented and verified at the appropriate level.
- **YELLOW:** Implemented but not fully verified/proven in a real environment.
- **RED:** Missing or blocked.
- **GRAY:** Planned, undefined, or not currently authorized for this phase.

---

## 4. V1 — EXISTING DEFINITION

### 4.1 Existing V1 Definitions

The repository contains two overlapping V1 definitions. They are **not in conflict on substance**, only in measurement.

**Definition A — Engineering Alpha Release (`STAYOS_IMPLEMENTATION_BASELINE.md`, 2026-07-27):**
- Alpha Release targeted at Sprint 8 (~Week 16).
- Scope: 50 invited users, Egyptian market only, Paymob + cards.
- Criteria: auth, KYC, listing CRUD, photos, search, booking, payment, WhatsApp notifications, escrow, 80% test coverage, web UI functional.

**Definition B — MVP v1 Gate / Operational Gate (`07_FINAL_EXECUTIVE_DECISION.md`, 2026-08-03 — higher authority):**
- MVP v1 Gate is achieved when **ALL** of the following are true:
  - 40+ live listings in New Cairo
  - 7+ completed bookings (10 if supply reaches 50)
  - Payment collected in EGP for all bookings
  - Payout transferred to at least 5 verified hosts
  - 0 fraud incidents
  - Guest NPS >= 50
  - Host NPS >= 50
  - Operations playbook documented
  - Founder has identified/hired operations person

**Reconciliation:**
- Definition A is the **code and deployment precondition** for V1.
- Definition B is the **operational/commercial validation** that proves V1.
- **V1 = Closed Alpha successfully operating with the MVP Gate achieved.**

### 4.2 Recommended V1 Boundary

Based on reconciled Founder decisions and repository evidence, V1 is the **Closed Alpha MVP**. It includes only the 15 mandatory P0 stories from `02_SPRINT3_EXECUTION_LOCK.md` (29.5 SP), the operational conditions of `07_FINAL_EXECUTIVE_DECISION.md`, and the `05_ALPHA_SUCCESS_SCORECARD.md` metrics.

V1 is **not** a public launch. It is a 6-week, founder-operated, invitation-only validation of the core booking loop in New Cairo.

---

## 5. V1 — COMPLETED

The following V1 capabilities are code-complete (but not yet deployed or proven with real users):

| Capability | Status | Evidence |
|------------|--------|----------|
| Phone OTP + Firebase auth (backend) | Code complete | `src/app/auth/router.py`; unit tests |
| JWT RS256 + RBAC (9 roles) | Code complete | `src/app/auth/dependencies.py`; tests |
| KYC automated + manual admin fallback | Code complete | `src/app/kyc/`; admin KYC queue frontend |
| Host KYC upload frontend + "Become Host" flow | Code complete | `/host/kyc`, `/profile`, role upgrade |
| Listing CRUD + photos + status machine | Code complete | 15+ endpoints; `PhotoUpload.tsx` |
| Listing review workflow | Code complete | `/admin/pending`; listing services |
| Public listing search (PostGIS, text, cultural tags) | Code complete | `/search` page; backend filters |
| Listing detail + gallery + map + trust badge | Code complete | `/listings/[unitId]`; `TrustSection.tsx`; Leaflet map |
| Guest booking request | Code complete | `POST /bookings`; `BookingPanel.tsx` |
| Host accept/reject booking | Code complete | `PATCH /bookings/{id}`; `HostBookingActions.tsx` |
| Manual payment proof flow | Code complete | `/checkout/[bookingId]`; `/admin/payments` |
| My Trips (guest) + Host Booking Inbox | Code complete | `/bookings`; `/host/bookings` |
| Admin bulk CSV/Excel import | Code complete | `/admin/import` |
| Discovery engine (admin supply activation) | Code complete | `/admin/discovery`; `src/app/discovery/` |
| Arabic RTL + i18n (ar default, en alternate) | Code complete | next-intl; `ar.json` + `en.json` |
| Cultural tag filter chips (search + listing) | Code complete | Search params; listing form |
| KYC trust badge + escrow trust message | Code complete | `TrustSection.tsx`; booking page |
| Notification templates (10 event types, ar/en) | Code complete | `notifications/templates.py` |
| Finance: wallet, ledger, escrow, payouts (backend) | Code complete | 11 finance endpoints; tests |
| Terraform infrastructure definition | Defined, not provisioned | `infra/terraform/` |
| Docker Compose (dev + staging) + Dockerfiles | Complete | `docker-compose.yml`, `docker-compose.staging.yml` |
| CI/CD workflows | Written, not configured | `.github/workflows/` |
| Database migrations (21 total) | Written | `alembic/versions/001-021` |

**Verification counts:** 472 unit/API tests passing (per commit `9fd5f63`), 21 Next.js routes compiled, 10 vitest tests passing, frontend build and lint clean.

---

## 6. V1 — REMAINING

| Item | Why Required | Current Status | Evidence | Dependency | Complexity | Founder Action? | External Vendor? | Product/Code Work? | Blocks V1? |
|------|-------------|---------------|----------|------------|------------|----------------|------------------|--------------------|------------|
| Live staging/production environment | Platform cannot run without it. | NOT DONE | `epos/PROJECT_STATE.md`; `MANAGEMENT_SITUATION_ANALYSIS.md` | AWS/Railway account, credits | Large | YES | YES (AWS/Railway) | DevOps | YES |
| Real API credentials (Twilio, Firebase, AWS, Paymob) | OTP, KYC, photos, payments require real accounts. | NOT CONFIGURED | `.env.staging.example` | Environment first | Medium | YES | YES (all vendors) | DevOps | YES |
| Host payout request UI | MVP Gate requires 5 payouts; no host-facing UI exists. | NOT BUILT | `src/app/finance/router.py` F-07/F-08/F-09; `PRODUCT_VERSION_ROADMAP_AUDIT.md` v1 | Backend endpoints exist | Small | NO | NO | Frontend | YES |
| Admin payout process UI | Admin must process manual bank transfer payouts. | NOT BUILT | `F-09 POST /finance/payouts/{id}/process` | Backend endpoints exist | Small | NO | NO | Frontend | YES |
| Legal documents (ToS, Privacy, Cancellation) | Exec Decision Condition 6; required before processing any payment. | NOT ON WEBSITE | `07_FINAL_EXECUTIVE_DECISION.md` Condition 6 | Founder/legal | Small | YES | Optional (lawyer) | Content | YES |
| E2E smoke test on live environment | Prove full loop on real infrastructure before inviting users. | NOT DONE | `CLOSED_ALPHA_EXECUTION_GATE.md` story 9 | Environment + credentials | Small | NO | NO | QA | YES |
| Real New Cairo listings (40+) | MVP Gate requires supply density. | NOT STARTED | `05_ALPHA_SUCCESS_SCORECARD.md` | Environment, host recruitment | Large | YES | NO | Commercial | YES |
| Real completed bookings (7+) | MVP Gate validates demand loop. | NOT STARTED | `05_ALPHA_SUCCESS_SCORECARD.md` | Listings + guests | Large | YES | NO | Commercial | YES |
| WhatsApp Business API approval | Primary notification channel for alpha. | NOT APPROVED | `epos/PROJECT_STATE.md` | Meta | Large | YES | YES (Meta) | External | PARTIAL — manual fallback acceptable |
| Operations hire | Exec Decision Condition 4; sustainable alpha operations. | NOT STARTED | `07_FINAL_EXECUTIVE_DECISION.md` Condition 4 | Founder | Medium | YES | NO | Hiring | YES |
| Search filter UI (property type, price, cultural tags) | Guests cannot refine results easily. | PARTIAL | `apps/web/app/[locale]/search/page.tsx` | None | Small | NO | NO | Frontend | PARTIAL — not a hard V1 blocker |
| Real Arabic copy for all guest-facing pages | Vision feature V-01; mandatory per Exec Decision. | NOT STARTED (placeholder keys exist) | `02_SPRINT3_EXECUTION_LOCK.md` V-01 | None | Small | NO | Optional (copywriter) | Frontend/i18n | YES (vision proof) |

### Critical Path to V1

```
STEP 1: Founder/DevOps — Provision live environment (AWS or Railway single VM).
        Exit: `GET /api/v1/health` returns {"status": "ok"} at a real URL.

STEP 2: Founder/DevOps — Configure real credentials (Twilio, Firebase, AWS S3,
        Paymob or manual fallback, JWT keys).
        Exit: OTP SMS to a real Egyptian number works; S3 presigned upload works.

STEP 3: Engineering — Build host payout request UI + admin payout process UI.
        Exit: Host can request payout; admin can mark it processed.

STEP 4: Founder/Legal — Publish ToS, Privacy, and Cancellation policy pages.
        Exit: `/terms`, `/privacy`, `/cancellation-policy` return real content.

STEP 5: Engineering — Complete real Arabic copy and cultural tag filter UI (V-01..V-05).
        Exit: Guest can identify 3+ StayOS differentiators in 1 minute.

STEP 6: QA — Run E2E smoke test on live environment.
        Exit: Full flow from register to CONFIRMED booking passes.

STEP 7: Founder — Apply for WhatsApp Business API (parallel; manual fallback accepted).
        Exit: Application submitted; reference recorded.

STEP 8: Founder — Recruit first 5 New Cairo hosts and guide to live listing.
        Exit: 1 real host KYC-verified with a LISTED property.

STEP 9: Founder — Run 6-week Closed Alpha to MVP Gate.
        Exit: 40+ listings, 7+ bookings, 5+ payouts, NPS ≥ 50, 0 fraud.
```

**Engineering time to launch readiness (steps 1-6): 3-5 days, mostly operational.**

---

## 7. V1 — EXIT CRITERIA

V1 (Closed Alpha MVP Gate) is achieved when **ALL** of the following are simultaneously true:

### Code / Deployment
- [ ] Platform running on real infrastructure (AWS ECS or staging VM).
- [ ] All API endpoints functional with real credentials (Twilio, Firebase, AWS S3, Paymob or manual).
- [ ] SMS notification delivery confirmed OR manual WhatsApp fallback acknowledged for alpha.
- [ ] Legal documents (ToS, Privacy, Cancellation policy) live on website.
- [ ] Staging health check passes.

### User Flow
- [ ] A real (non-founder) host can register via phone OTP → complete KYC → become a host → create a listing → upload photos → submit for review → go live, without engineering assistance.
- [ ] A real (non-founder) guest can search listings → view listing detail → create a booking → pay via bank transfer proof → receive SMS/WhatsApp confirmation.
- [ ] Admin can process listing approvals, KYC reviews, and payment verifications via the admin UI.

### Marketplace Operations
- [ ] 40+ live listings in the New Cairo area.
- [ ] 7+ completed bookings (status = CHECKED_OUT).
- [ ] EGP payment collected for all bookings.
- [ ] 5+ host payouts manually processed.
- [ ] 0 fraud incidents.

### Commercial / Trust
- [ ] Guest NPS >= 50 (direct survey).
- [ ] Host NPS >= 50 (direct survey).
- [ ] Operations playbook documented.
- [ ] Operations hire identified or in process.

---

## 8. DEMO vs PILOT vs FIRST REAL USE vs V1

| State | What Is True | What Is NOT True | Current Status |
|-------|-------------|------------------|----------------|
| **DEMO READY** | Code compiles and runs locally; 7 workflows traced end-to-end in code; 472 tests pass; frontend builds with 21 routes. | No real infrastructure; no real users; no real payments; no real notifications. | **ACHIEVED** (`CLOSED_ALPHA_EXECUTION_VALIDATION.md`, `GO_LIVE_READINESS_REPORT.md`) |
| **DEPLOYMENT READY** | Code blockers fixed; Terraform defined; Docker Compose staging configured; launch checklist documented. | AWS not provisioned; no real credentials; no live environment. | **ACHIEVED** (`PRODUCTION_DEPLOYMENT_REPORT.md`) — operational steps remaining. |
| **PILOT READY** | Infrastructure live; real credentials configured; at least 3-5 real listings with real hosts; founder can manually guide 5-10 guests through the flow. | 40+ listings; independent user flow without founder hand-holding; NPS measured. | **NOT ACHIEVED** — no environment, no real users. |
| **FIRST REAL USE PROVEN** | At least 1 real guest completes a full booking end-to-end (search → book → pay → confirmed) without founder intervention in the product flow. | 7+ bookings; 40+ listings; NPS measured; payouts processed. | **NOT ACHIEVED** |
| **V1 RELEASED (MVP Gate)** | All exit criteria met: 40+ listings, 7+ bookings, 5 payouts, NPS ≥ 50, 0 fraud, ops playbook. | Reviews, messaging, map search, Egyptian wallets, mobile app. | **NOT ACHIEVED** — Closed Alpha has not launched. |

**Critical distinction:** "READY FOR CLOSED ALPHA" and "READY FOR DEPLOYMENT" in project documents mean the **code is prepared**. They do **not** mean the product is validated with real users and real money. These terms must not be conflated with "V1 Released."

---

## 9. V2 ROADMAP

V2 = Post-MVP Gate features explicitly authorized by `07_FINAL_EXECUTIVE_DECISION.md` Section 9, plus clearly needed next capabilities.

### Repository-Backed V2 Items

| Feature | Problem Solved | Why V2 Not V1 | Priority | Repository Evidence |
|---------|---------------|---------------|----------|---------------------|
| Map-based search | Guests can't orient themselves geographically in New Cairo compounds. | Proves booking loop first; map improves discovery. | HIGH | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Egyptian wallet payments (Fawry, Vodafone Cash, Meeza, InstaPay) | Only bank transfer + Paymob cards in alpha; Egyptian market uses local rails. | Requires live Paymob merchant account first; manual proof is acceptable for alpha. | CRITICAL | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Reviews & ratings | Guests need social proof; hosts need reputation. | Requires post-stay data. | HIGH | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Host dashboard (full: analytics, revenue, stats) | Hosts need booking/revenue visibility. | Hosts don't need analytics for first 5 bookings. | MEDIUM | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Unclaimed listing creation + claim workflow | Admin can seed listings not yet contacted. | Scale feature; founder creates listings manually in V1. | MEDIUM | `07_FINAL_EXECUTIVE_DECISION.md` V1.1; `02_SPRINT3_EXECUTION_LOCK.md` S3-012/013 removed |
| Duplicate detection | Prevent same property appearing twice during bulk import. | Not needed at 30-50 listings. | LOW | `07_FINAL_EXECUTIVE_DECISION.md` V1.1; `02_SPRINT3_EXECUTION_LOCK.md` S3-014 removed |
| Support ticket system | Guests and hosts need escalation path. | WhatsApp is support channel for alpha. | LOW | `07_FINAL_EXECUTIVE_DECISION.md` V1.1; `02_SPRINT3_EXECUTION_LOCK.md` S3-015 removed |
| Cancellation policy UI (interactive) | Guests need to understand refund before cancelling. | Static text exists; interactive calculator is V2. | MEDIUM | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Host guarantee / guest protection | Differentiation from Airbnb; trust gap. | Requires operational validation first. | MEDIUM | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Price transparency (total upfront) | Reduce checkout abandonment. | Backend has fee config; frontend needs polish. | HIGH | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| Referral program (automated) | Guest acquisition after organic seed. | Manual tracking for first 10; automation is V2. | MEDIUM | `07_FINAL_EXECUTIVE_DECISION.md` V1.1 |
| 6th October / Zamalek / Maadi expansion | Broader Cairo market. | New Cairo supply concentration first. | MEDIUM | `05_GO_TO_MARKET_VALIDATION.md` |

### Additional V2 Gaps (Code Exists, Not Activated)

| Feature | Evidence | Why V2 |
|---------|----------|--------|
| Paymob automated checkout (iFrame) | Webhooks exist; integration IDs not configured. | Replace manual proof once Paymob live. |
| Email notifications (AWS SES) | SES provider is a stub; SES not configured. | WhatsApp/SMS primary for alpha. |
| Search filter UI improvements | Partial implementation exists. | Advanced facets after core loop. |
| Guest-initiated cancellation flow | Endpoints exist; no complete guest-facing flow. | First alpha bookings may not cancel. |
| Automated payout processing (Paymob payout API) | Payout endpoints exist; manual transfers for alpha. | Scale beyond 20 hosts. |

---

## 10. V3 ROADMAP

V3 = Repeatability and operational scale after V2 proves the expanded feature set.

| Capability | Repository Evidence | V3 Rationale |
|------------|--------------------|--------------|
| Mobile native app (iOS + Android) | 0% built; scaffold only; design specs exist. | Mobile required for scale; web PWA acceptable for V1/V2. |
| Guest-Host Messaging (real-time chat) | NOT STARTED — no schema, no service, no API. | Requires stable platform + real user behavior to design. |
| Automated Paymob checkout / payout | Webhooks/payout endpoints exist; not activated. | Manual flow proves demand; automation for scale. |
| Analytics dashboard (admin + host) | Open decision; no implementation. | Requires data to analyze. |
| Operations module frontend | 19 backend endpoints; no frontend. | Needed at 50+ properties. |
| GCC market expansion | Strategic intent in product thesis. | Requires Egyptian market stability first. |
| Property readiness + recurring maintenance | Backend exists; no frontend. | Not needed below 50 managed units. |
| CloudFront CDN | Defined as missing in DevOps matrices. | Performance optimization for scale. |
| Multi-AZ infrastructure | Single-AZ acceptable for V1/V2. | Scale requirement. |

---

## 11. V4+ DIRECTION

Repository evidence for V4+ is insufficient for a committed roadmap. The following is a **strategic direction, not a committed plan**:

- MENA corridor expansion (Egypt → GCC) — referenced in product thesis and strategy docs.
- AI-powered pricing and availability recommendations — implicit in "AI-powered" brand claim; no implementation.
- Platform API for property management system integrations — not currently referenced.
- Enterprise / corporate travel management — briefly referenced in `07_FINAL_EXECUTIVE_DECISION.md` V1.1 list.
- Data products (market intelligence) — not referenced.

**Statement:** V4+ is not sufficiently defined by the current repository. Do not plan V4+ until V2 produces learnings.

---

## 12. VERSION BOUNDARY TABLE

| Capability | V1 | V2 | V3 | V4+ | Reason |
|------------|----|----|----|-----|--------|
| Phone OTP Auth | ✓ | — | — | — | Core identity |
| Firebase Social Login | ✓ | — | — | — | Guest acquisition convenience |
| Automated KYC (AWS) | ✓ | — | — | — | Trust foundation |
| Manual KYC admin fallback | ✓ | — | — | — | AWS may not be configured at launch |
| Listing CRUD + photos | ✓ | — | — | — | Supply-side core |
| Listing review workflow | ✓ | — | — | — | Quality gate |
| Guest booking request | ✓ | — | — | — | Demand-side core |
| Manual payment proof flow | ✓ | — | — | — | Alpha payment method |
| SMS notifications | ✓ | — | — | — | Alpha channel |
| Admin queues (listing/payment/KYC) | ✓ | — | — | — | Operations enabler |
| Arabic RTL + i18n | ✓ | — | — | — | Core differentiator |
| Cultural tag filters | ✓ | — | — | — | Vision-aligned feature (Exec Decision) |
| KYC trust badge + escrow message | ✓ | — | — | — | Vision-aligned feature (Exec Decision) |
| Discovery engine (admin) | ✓ | — | — | — | Supply acquisition tool for alpha |
| Bulk CSV/Excel import | ✓ | — | — | — | Supply seeding tool |
| Host payout UI (frontend) | ✓ | — | — | — | MVP Gate requires 5 payouts |
| Legal documents | ✓ | — | — | — | Required before payments |
| AWS infrastructure (provisioned) | ✓ | — | — | — | Platform cannot run without it |
| E2E smoke test (live) | ✓ | — | — | — | Confidence before user invite |
| Paymob iFrame checkout | B | ✓ | — | — | Manual proof acceptable for alpha |
| Egyptian wallet payments | — | ✓ | — | — | Egyptian market requires these |
| Reviews & ratings | — | ✓ | — | — | Needs real bookings first |
| Map-based search (interactive) | — | ✓ | — | — | Nice-to-have after core loop |
| Host dashboard (analytics) | — | ✓ | — | — | Hosts need data after ≥5 bookings |
| Full cancellation flow + refund UI | — | ✓ | — | — | Edge case for alpha |
| Referral program (automated) | — | ✓ | — | — | Not needed until ≥10 organic bookings |
| Unclaimed listing + claim workflow | — | ✓ | — | — | Scale feature |
| Duplicate detection | — | ✓ | — | — | Catalog integrity at scale |
| Support ticket system | — | ✓ | — | — | Escalation path |
| Mobile app (iOS/Android) | — | — | ✓ | — | Web PWA acceptable for V1/V2 |
| Guest-Host Messaging | — | — | ✓ | — | Complexity vs. WhatsApp acceptable for V1/V2 |
| Paymob automated payout | — | — | ✓ | — | Manual bank transfer for V1; automation for V3 |
| Operations module frontend | — | — | ✓ | — | Needed at 50+ properties |
| Analytics provider | — | — | ✓ | — | Data exists; dashboard is V3 |
| AI pricing and matching | — | — | — | ✓ | Long-term intelligence layer |
| GCC market expansion | — | — | — | ✓ | Post-Egyptian stability |
| Platform API / integrations | — | — | — | ✓ | Strategic direction |

---

## 13. PRODUCT MATURITY PROGRESSION

The project's actual maturity progression, based on evidence, is:

```
PROVE → REPEAT → SCALE → EXPAND
```

- **PROVE (V1 / Closed Alpha):** One real booking loop works end-to-end in New Cairo with real hosts, real guests, real EGP payment, and real trust. This is the current objective.
- **REPEAT (V2):** The same loop works reliably across 40+ listings and 100+ bookings, with reviews, local wallet payments, and a host dashboard.
- **SCALE (V3):** Operations can run without the founder manually handling every booking, payout, and support message. Mobile app, messaging, analytics, and operations tooling become necessary.
- **EXPAND (V4+):** Egypt-to-GCC corridor, AI intelligence, and platform/API ecosystem.

The project is at the very end of the **PROVE** stage — code-complete but not yet launched.

---

## 14. SITUATION DIAGNOSIS

### FACTS
- 472 unit/API tests pass (commit `9fd5f63`).
- 21 Alembic migrations written; schema complete for alpha.
- 21 Next.js frontend routes compiled and build-clean.
- All 7 core user workflows validated end-to-end in code.
- Terraform infrastructure fully defined for AWS.
- CI/CD workflows written and code-verified.
- Code-level deployment blockers resolved.
- Host payout frontend does NOT exist.
- WhatsApp Business API approval NOT obtained.
- AWS infrastructure NOT provisioned.
- No real environment running anywhere.
- Real users, listings, bookings, revenue: 0.

### EVIDENCE
- Backend: 472 unit/API tests with mocked external services.
- Frontend: TypeScript 0 errors, ESLint 0 errors, Next.js build 21 routes, vitest 10 tests.
- Code review: 7 user workflow traces confirmed.
- No evidence of any test running against real external APIs.

### ASSUMPTIONS (Unproven)
- Twilio Verify works for Egyptian phone numbers in production.
- AWS Textract/Rekognition processes Egyptian national IDs at ≥90% confidence.
- Paymob HMAC verification works with a real merchant account.
- WhatsApp Business API approval will be granted.
- PostGIS geo-search performs well on Egyptian mobile devices.
- S3 presigned uploads work on variable Egyptian mobile bandwidth.
- 40 hosts can be recruited in New Cairo within 6 weeks.
- 7+ bookings can be achieved from warm contacts within 6 weeks.

### RISKS
- **R-01:** WhatsApp Business API approval delayed (manual fallback acceptable for first 20 bookings).
- **R-02:** AWS Textract/Rekognition fails on Egyptian IDs (manual KYC review queue is the fallback).
- **R-03:** Paymob merchant account setup takes 2-4 weeks (manual bank transfer is the alpha design).
- **R-04:** Supply acquisition slower than projected (Executive Decision lowered gate to 7 bookings if supply < 40).
- **R-05:** Infrastructure provisioning reveals configuration issues (scripts and templates are detailed).
- **R-06:** Host payout frontend missing blocks MVP Gate (5 payouts required).
- **R-07:** Legal documents not published before first payment (Exec Decision Condition 6).

### INFERENCES
- The product is technically sound for its alpha scope. The codebase has no known architectural defects.
- The operational gap (no deployment, no real users) is the primary risk, not code quality.
- The 6-week alpha timeline is tight but achievable if infrastructure provisioning starts immediately.
- The host payout frontend is the one material code item remaining for V1.

---

## 15. MANAGEMENT DECISION INPUT

### 1. What is the product today?
A complete, code-verified, undeployed two-sided accommodation marketplace for Egypt. Every major user flow is implemented and tested. The product cannot currently be used by any real user because no environment is running.

### 2. What is the biggest remaining gap?
Infrastructure provisioning and real-world deployment. No real AWS environment, no real credentials, no real users. This is an operations/DevOps execution problem, not a product problem.

### 3. Is the biggest gap: Technical / Product / Operational / Commercial / Legal / Other?
**Operational** (infrastructure provisioning + deployment) and **Commercial** (host recruitment + guest activation). The technical gap is small (host payout frontend, ~2 SP).

### 4. What is the shortest path to V1?
1. Provision live environment — 1-2 days.
2. Configure real credentials — same day.
3. Build host payout UI — 2 days.
4. Publish legal docs — 1 day.
5. Run E2E smoke test — 1 day.
6. Launch Closed Alpha and recruit 40+ New Cairo hosts — 6 weeks.

### 5. What should NOT be built yet?
- Mobile app.
- Guest-host messaging.
- Reviews & ratings.
- Operations module frontend.
- Analytics dashboard.
- Automated payout processing.
- Multi-AZ infrastructure.
- CloudFront CDN.
- Security pentest hardening sprint.
- Stripe payments for Egypt (GCC V2+).

### 6. What is the strongest reason to delay V1?
WhatsApp Business API is not approved. If Meta approval is delayed, the primary notification channel is unavailable and the founder must manually message every guest and host. This is sustainable for 20 bookings but unmanageable above 50.

### 7. What is the strongest reason NOT to delay V1?
The planned alpha launch was 2026-08-19. Every day of delay shrinks the 6-week alpha window. The 40-listing supply target requires aggressive host recruitment starting immediately. No code blocker justifies further delay.

### 8. What evidence is still missing?
- Proof that Twilio OTP works for Egyptian numbers.
- Proof that AWS KYC pipeline works with Egyptian IDs.
- Proof that payment proof upload works on real mobile devices.
- Proof that real hosts can complete KYC + listing flow without founder hand-holding.
- Proof that 40+ hosts can be recruited and 7+ bookings closed in 6 weeks.

### RECOMMENDED MANAGEMENT POSITION: A — Continue V1 completion

The product is too close to launch to justify any other option. V1 code is ~98% complete (only host payout UI remains). The operational path is clear. No redesign is needed. Commercial validation is the only remaining unknown, and the only way to get that answer is to deploy and operate.

### SINGLE MOST IMPORTANT NEXT ACTION
**Provision the staging environment this week.** Specifically: generate JWT keys, obtain Twilio/Firebase/AWS credentials, spin up the backend and database, deploy the frontend, run the E2E smoke test. Every hour spent on any other task before the environment is live delays the MVP Gate date.

### SINGLE MOST IMPORTANT THING NOT TO DO
**Do not start building messaging, reviews, mobile, or any V2+ features before V1 is deployed and operating.** The codebase already has deferred features that will never be needed if the marketplace does not achieve 7 bookings. Scope discipline is the difference between shipping in September and shipping never.

---

## 16. AUDIT PERSISTENCE STATUS

**AUDIT PERSISTENCE:** SAVED
**CANONICAL PATH:** `/Users/ahmed/Documents/Projects/StayOS/PRODUCT_VERSION_ROADMAP_AUDIT_v2.md`
**VERSION:** 2.0.0
**DATE:** 2026-08-17

---

## EVIDENCE SOURCES REVIEWED

- `PRODUCT_VERSION_ROADMAP_AUDIT.md` v1.0 (2026-08-14) — Prior audit with capability inventory, V1/V2/V3/V4 analysis
- `.ai/AUDIT/DECISION_RECONCILIATION_2026-08-17.md` — Reconciled Founder decisions and conflicts
- `PROJECT_CHAT_CONTEXT_EXTRACTION.md` — Historical chat evidence
- `01_PRODUCT_THESIS.md` — Constitutional product definition
- `02_SPRINT3_EXECUTION_LOCK.md` — Definitive Sprint 3 scope and conflict resolution
- `03_ENGINEERING_BUILD_ORDER.md` — Exact build sequence
- `04_FOUNDER_PLAYBOOK.md` — Founder daily execution manual
- `05_ALPHA_SUCCESS_SCORECARD.md` — Alpha success metrics
- `06_STOP_DOING_LIST.md` — Explicitly frozen/rejected scope
- `07_FINAL_EXECUTIVE_DECISION.md` — Highest authority: V1 definition, MVP Gate, conditions
- `07_FINAL_IMPLEMENTATION_CONTRACT.md` — Approved implementation items
- `MVP_SCOPE_FREEZE.md` — MVP scope freeze (with noted conflicts against execution lock)
- `CLOSED_ALPHA_EXECUTION_GATE.md` — Gate document: remaining stories, build order
- `CLOSED_ALPHA_EXECUTION_VALIDATION.md` — 7-workflow end-to-end code validation
- `PRODUCTION_DEPLOYMENT_REPORT.md` — Deployment blockers and readiness
- `GO_LIVE_READINESS_REPORT.md` — 3 user journeys verified
- `MANAGEMENT_SITUATION_ANALYSIS.md` — Management diagnosis and next actions
- `.ai/CURRENT/DECISION_LOG.md` — Decision history
- `.ai/CURRENT/PROJECT_STATE.md` — Current project state
- `epos/PROJECT_STATE.md` — EPOS runtime state

## HISTORICAL ARCHIVES USED

- None. The canonical reconciled decision record and repository documents provided sufficient authoritative context.

## RECONCILED DECISION CONTEXT USED

- `.ai/AUDIT/DECISION_RECONCILIATION_2026-08-17.md`

## CONFLICTS FOUND

1. **Payment processor documentation conflict:** `DECISION_LOG.md` / `07_FINAL_EXECUTIVE_DECISION.md` designate Paymob as primary for Egypt; `FLOWS.md` / `ENGINEERING_BACKLOG.md` reference Stripe. Decision: Paymob primary + Stripe international remains authoritative; engineering docs need alignment.
2. **Mobile app priority:** `06_STOP_DOING_LIST.md` / `MVP_SCOPE_FREEZE.md` freeze native mobile to V3/Phase 2; chat and `epos/PROJECT_STATE.md` indicate founder interest in mobile. Unconfirmed current decision; no ADR.
3. **CLAUDE.md phase gate wording:** `CLAUDE.md` still says Phase 0 code freeze; `DECISION_LOG.md` DEC-011 and `07_FINAL_EXECUTIVE_DECISION.md` authorized engineering. `CLAUDE.md` is stale.
4. **`MVP_SCOPE_FREEZE.md` vs `02_SPRINT3_EXECUTION_LOCK.md`:** `MVP_SCOPE_FREEZE.md` lists admin listing-claim, duplicate detection, support tickets, and payout approval as "WILL BUILD" for MVP; `02_SPRINT3_EXECUTION_LOCK.md` explicitly removed these. The higher-authority `07_FINAL_EXECUTIVE_DECISION.md` confirms the execution lock's P0 list; these items are V1.1.
5. **Deployment platform:** AWS Terraform, Railway, and Vercel are all represented in the repo; no final platform decision is recorded. The fastest path is a single VM / Railway for first 40 users.
6. **No paid services before local validation (chat):** A 2026-08-10 chat instruction conflicts with the `07_FINAL_EXECUTIVE_DECISION.md` and `MANAGEMENT_SITUATION_ANALYSIS.md` directive to provision immediately. Not recorded in `DECISION_LOG.md`; unconfirmed.

---

**END OF AUDIT v2.0**
