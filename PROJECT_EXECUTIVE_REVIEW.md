# PROJECT EXECUTIVE REVIEW — StayOS

**Prepared by:** Executive Product & Engineering Review Board  
**Review date:** 2026-07-30  
**Mandate:** Pre-Sprint 3 executive review of the entire project. Do not implement. Challenge assumptions. Optimize for business success.

---

## 1. Executive Verdict

StayOS has built an unusually strong technical foundation for a pre-launch marketplace. The backend is modular, well-tested, and largely production-grade. The product vision is clear. However, **the project is currently optimized for engineering completion, not for marketplace launch.** The most important question — *how will StayOS launch with enough rental inventory?* — has not been answered in the code, the roadmap, or the operational plan.

**Board recommendation:** Sprint 3 must be re-scoped from "Payments + Notifications + Launch" to **"Supply Acquisition & Host Enablement."** Engineering should pivot to tools that create inventory, not features that consume it. No amount of booking polish will matter if guests land on an empty search page.

---

## 2. Strategic Context

### 2.1 The Market

StayOS is a two-sided accommodation marketplace targeting MENA, with Egypt as the beachhead and the GCC corridor as the expansion path. The stated TAM is $200M–$400M in Egypt and $1B–$2B in the Egypt-GCC corridor. The opportunity is real, but the market is also fragmented, trust-poor, and dominated by global OTAs with weak Arabic and local-payment support.

### 2.2 The Product Vision

The vision is to become the "accommodation operating system" for MENA by delivering:

- Verified supply
- Arabic-first UX
- Local payment rails (Fawry, Meeza, Vodafone Cash, InstaPay)
- AI-powered matching
- Trust infrastructure (disputes, host guarantee, guest verification)

### 2.3 The Current Phase

Sprint 1 and Sprint 2 are marked complete. The repository contains a working FastAPI backend, a minimal Next.js frontend, and extensive planning documentation. However, the README and Phase-gate documents still state that **Phase 0 customer validation must be completed before building** — 10 manual transactions, 80 interviews, payment-processor conversations, legal decisions, etc. This has not happened. The engineering team has built ahead of validated demand, which is a material business risk.

---

## 3. Architecture Review

### 3.1 Backend

| Area | Assessment | Detail |
|------|------------|--------|
| **Stack & modularity** | Strong | FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL + PostGIS, Redis, Celery. Modular package structure (`auth`, `listings`, `reservations`, `finance`, `operations`, `kyc`, `security`). |
| **Data model** | Mature | `Unit`, `UnitListing`, `CalendarRule`, `UnitPhoto`, `Reservation`, `PaymentIntent`, `Wallet`, `Escrow`, `Ledger`, `KycDocument`, `User`, `Account` are all modeled. PostGIS `Geometry` and GIN indexes on `tsvector` and arrays are present. |
| **Search** | Substantial but incomplete | Spatial search by viewport/radius, text search via `plainto_tsquery('simple', ...)`, price, availability, amenity, and cultural-tag filters are implemented. **Missing:** `pg_trgm`/`unaccent` extensions per ADR-010; no Arabic morphological search. |
| **Booking/reservation engine** | Substantial | `Booking` and `Reservation` models exist, calendar conflict checks, payment-intent records, host/guest status machines. **Gaps:** real-time calendar locks are not SSE/WebSocket based; frontend checkout does not invoke payment flow. |
| **Payments** | Partial | Paymob and Stripe webhook handlers, HMAC verification, idempotency keys, escrow model, payout requests, ledger entries. **Missing:** Egyptian wallet method integration IDs, Paymob iframe flow, Stripe scope decisions, automated payout batch. |
| **KYC** | Partial | Document upload via presigned S3, manual admin review endpoint, RBAC. **Missing:** OCR/biometric automation, front-end KYC flow beyond S3 upload. |
| **Notifications** | Partial | WhatsApp templates referenced, Celery worker. **Missing:** device-token push (FCM), in-app notification center, SMS fallback. |
| **Security** | Improved in S2-08 | Rate limiting, CSP, image URL validation, security headers. **Remaining:** AWS Secrets Manager integration, CORS wildcard, `python-jose` CVE, WAF/CloudFront, DAST, admin kill-switch, dispute console. |
| **Testing** | Good | 326 backend tests pass, mypy and ruff clean, ~80% coverage. Frontend tests are effectively empty. |

### 3.2 Frontend

| Area | Assessment | Detail |
|------|------------|--------|
| **Stack** | Modern | Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, `next-intl`, `zustand`, `@tanstack/react-query`. |
| **Pages built** | Minimal | `/[locale]`, `/[locale]/search`, `/[locale]/listings/[unitId]`, `/[locale]/auth/login`, `/[locale]/host` (placeholder), `/[locale]/host/availability/[unitId]`, `/[locale]/host/bookings`. |
| **Search UX** | Basic | Grid of cards, filters via query params, skeletons, empty/error states. **No map, no price histogram, no date availability overlay on cards.** |
| **Listing detail** | Basic | Cover image (Next.js Image optimized), amenity chips, booking panel, house rules. **No photo gallery, no map pin, no host card, no review section.** |
| **Booking panel** | Partial | Date/guest selector calls `POST /bookings` and returns success. **It does not call the reservation/payment flow, display Paymob iframe, or collect payment method.** This is a request-to-book flow, not a checkout flow. |
| **Host onboarding** | Missing | No host registration funnel, no listing creation wizard, no photo upload UI, no KYC document capture flow. |
| **Admin** | Missing | No admin UI for KYC review, dispute handling, or listing moderation. |

### 3.3 Database

PostgreSQL 16 with PostGIS is the right choice. The schema uses separate PostgreSQL schemas (`auth`, `pms`, `reservation`, `finance`, `operations`) which is clean for a modular monolith. Migrations are managed by Alembic and include spatial indexes, GIN indexes, and a calendar exclusion constraint. The `UnitPhoto` table exists in the model but the migration for it appears incomplete or missing (`BCK-01`, `DB-01` in the audit). This blocks listing photo upload and, by extension, listing creation.

### 3.4 API

The API surface is well-structured:

- `GET/POST /api/v1/listings` — public search and host listing creation
- `GET /api/v1/listings/{id}` and `/availability` — public detail/calendar
- `POST /api/v1/bookings` and `PATCH /api/v1/bookings/{id}` — request-to-book flow
- `POST /api/v1/reservations` and `POST /confirm`, `/cancel`, `/check-in`, `/check-out` — reservation lifecycle
- `POST /api/v1/finance/webhooks/paymob` and `/stripe` — payment webhooks
- `GET/POST /api/v1/finance/payouts`, `/escrow`, `/wallets` — treasury
- `POST /api/v1/auth/otp/*`, `/firebase`, `/refresh`, `/me/account` — identity
- `POST /api/v1/kyc/initiate`, `/documents/{id}/submit`, `/process` — KYC

**Missing API surface (per baseline):** listing photo upload, admin CRUD, device-token/push, messaging/SSE, reviews, analytics, B2B multi-unit portfolio, channel manager APIs.

### 3.5 Security

After S2-08, the application has:

- `next/image` with remote-pattern allowlist.
- Rate limiting on public listing endpoints.
- Improved CSP and conditional HSTS.
- Image URL host allowlist.

**Still open:** AWS Secrets Manager runtime loading, CORS wildcard, `python-jose` dependency, WAF, CloudFront, DAST, admin kill-switch, and security response headers for Paymob iframe compatibility.

### 3.6 Scalability & Infrastructure

- **Application:** FastAPI on ECS Fargate with ALB is a reasonable MVP target. Async SQLAlchemy + Redis + Celery supports horizontal scaling.
- **Database:** PostGIS is the right spatial engine. As the catalog grows, `pg_trgm` and materialized search views may be needed.
- **Search:** Current offset pagination is not suitable for large catalogs; cursor-based pagination is planned but not implemented.
- **Photos:** S3 + CloudFront is the intended architecture but not wired; currently photos would not upload because the `UnitPhoto` migration/endpoint is missing.
- **Payments:** Escrow and ledger are modeled; payout disbursement requires Paymob commercial agreement.
- **Infrastructure as Code:** Terraform has HCL syntax errors, placeholder values, and a region mismatch (`me-south-1` vs ADR-007's `me-central-1`). CI/CD workflows are not fully configured.

---

## 4. Product & Business Model Review

### 4.1 Business Model

StayOS is a commission marketplace: host commission 10%, platform take rate 2%, guest service fee 4%. It also envisions B2B SaaS subscriptions for property managers in Phase 3. The finance model supports commission splits, escrow, and host payouts. This is sound, but **revenue depends on transaction volume, which depends on supply density.**

### 4.2 Marketplace Flywheel

The intended flywheel is:

> More verified listings → more search results → more bookings → more host revenue → more listings.

The flywheel is currently broken at the first node. The platform cannot launch with one or two listings. A marketplace needs **critical mass** in each geography before demand converts.

### 4.3 Trust & Safety

KYC, host verification, and escrow are strong trust signals. However, the **guest protection story is incomplete:**

- No dispute resolution console.
- No host guarantee fund.
- No review system yet.
- No cancellation/NO-SHOW policy in the frontend.

### 4.4 Local Payments

Paymob integration is the right local choice. Stripe is the right GCC choice. The webhook plumbing is in place, but the commercial integration (Paymob account, integration/iframe IDs) and the Egyptian wallet method configuration are unresolved.

### 4.5 Launch Readiness

The application is **not ready for public launch**. It is closer to a **closed backend-only alpha** if the missing photo/upload and host-onboarding UI are added. The frontend is 25% complete. Mobile is 0%.

---

## 5. Critical Findings

### 5.1 Phase 0 Has Not Been Executed

The repository explicitly states that Phase 0 (customer validation) must be completed before building. Engineering has outrun validation. This is the highest-risk finding. Building a two-sided marketplace without 80 interviews and 10 manual transactions is a recipe for building the wrong product.

### 5.2 The Catalog Cannot Grow Without Host Tools

There is no end-to-end host onboarding. A host cannot:

- Sign up as a host.
- Complete KYC from the web.
- Create a listing with photos.
- Set prices and availability.
- Publish.

This is a supply-blocking gap.

### 5.3 Photo Upload Is a Hard Blocker

The `UnitPhoto` model exists, but the migration (`pms.unit_photos`) and the `POST /listings/{id}/photos` endpoint are missing. A marketplace without listing photos will not convert guests and hosts cannot complete listings.

### 5.4 The Booking Panel Does Not Complete a Transaction

The `BookingPanel` sends a booking request but does not handle reservation creation, payment method selection, Paymob iframe, or Stripe checkout. A guest can "request to book" but cannot pay.

### 5.5 Admin & Moderation Are Missing

There is no admin UI or sufficient admin endpoints to approve KYC, moderate listings, resolve disputes, or manually claim/import listings.

### 5.6 Mobile Track Is Empty

Mobile is a future phase, but the MENA audience is mobile-first. Deferring mobile until after 50K transactions may be too late.

---

## 6. Recommendations (High-Level)

1. **Declare a Supply-First Sprint 3.** Prioritize host onboarding, listing creation, photo upload, and manual listing-claim/import tools over payment polish.
2. **Run a Parallel Phase 0 Sprint.** Founder must complete 10 manual transactions and 50 traveler + 30 host interviews in the next 4–6 weeks.
3. **Do Not Launch Publicly Yet.** Target a **closed alpha in one city (e.g., Cairo/Alexandria)** with 50–100 hand-onboarded listings.
4. **Fix the Hard Blockers First.** Photo upload migration + endpoint, host listing-creation UI, and admin KYC/listing-claim console.
5. **Add a Concierge/Operations Layer.** Manual onboarding, CSV import, and property-manager outreach must happen before self-serve scales.
6. **Re-evaluate Mobile Timing.** Build a PWA or mobile web first, then decide on native iOS/Android after 100 bookings.
7. **Secure Payment Commercial Agreements.** Paymob integration/iframe IDs and Stripe scope must be closed before payment code is written.
8. **Fix Terraform & CI.** Infrastructure blockers do not block code, but they do block staging and alpha.

---

## 7. Go / No-Go for Sprint 3

**GO — conditional.** The board approves proceeding to Sprint 3, but only if the sprint scope is redefined to focus on supply acquisition and hard blockers. The current plan ("Payments + Notifications + Launch") is **NOT approved** because it does not solve the supply problem and would deliver polished booking features with insufficient inventory to book.

**Next step:** Founder and product lead must present a revised Sprint 3 backlog within 48 hours that reflects the priorities in `SPRINT3_RECOMMENDATIONS.md` and the supply strategy in `MARKETPLACE_SUPPLY_STRATEGY.md`.
