# MVP_SLICE.md — Implementation Contract

**Status**: ACTIVE — Engineering Mode Entry Document  
**Authority**: Supersedes any conflicting scope in docs/system-design/ for Phase 1 execution  
**Phase gate**: Phase 0 customer validation must clear before any row below becomes a sprint task  
**Budget**: $150,000 · **Target**: 10 live bookings before adding a single V1.1 feature  
**Last updated**: 2026-07-13

---

## The Slice Principle

The 406-point backlog in [14_ENGINEERING_BACKLOG.md](system-design/14_ENGINEERING_BACKLOG.md) is the full architecture. This document answers a different question:

> **What is the minimum surface area required to complete one real booking, collect payment in EGP, and transfer money to a verified Egyptian host?**

Everything that does not directly serve that transaction is deferred. Deferred does not mean rejected — it means it is not built until the first 10 bookings prove the core loop works.

**MVP v1 target: 65–72 story points.** Two backend engineers × 6 two-week sprints.

---

## Version Legend

| Version | Meaning |
|---------|---------|
| **MVP v1** | Required for first live booking. Not shipped = no revenue. |
| **V1.1** | Ships within 4 weeks of first booking milestone (10 bookings). |
| **V1.5** | Ships after 100 bookings / $15K GTV. |
| **Phase 2** | Ships after PMF signal (~500 listings, ~200 bookings/month). |
| **Phase 3** | Ships after 50K+ transactions (AI/ML data threshold). |
| **Never** | Not strategically aligned. Do not build. |

---

## Category 1 — Infrastructure

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| AWS VPC + subnets + security groups | Isolates all services from internet | 2 | None (enabler) | Low | None (invisible) | AWS account | P0 | **MVP v1** |
| RDS PostgreSQL 16 + PostGIS (single-AZ) | Stores all business data; spatial queries | 3 | None (enabler) | Low | None | VPC | P0 | **MVP v1** |
| ElastiCache Redis 7 (single node) | OTP TTL + Celery broker | 2 | None (enabler) | Low | None | VPC | P0 | **MVP v1** |
| ECS Fargate cluster (API + Celery worker tasks) | Runs the application | 3 | None (enabler) | Low | None | ECR, VPC | P0 | **MVP v1** |
| AWS ALB + HTTPS + ACM certificate | TLS termination; secure API | 2 | None (enabler) | Low | Trust (HTTPS lock) | VPC | P0 | **MVP v1** |
| S3: listings bucket + KYC bucket | Photo storage + identity document storage | 2 | None (enabler) | Low | Listing quality | AWS account | P0 | **MVP v1** |
| AWS Secrets Manager (all API keys) | No secrets in code or environment | 1 | None (enabler) | Low | None | AWS account | P0 | **MVP v1** |
| ECR container registry + GitHub Actions CI/CD | Deploy pipeline; prevents broken deployments | 2 | None (enabler) | Low | None | GitHub repo | P0 | **MVP v1** |
| Vercel project (Next.js frontend) | Frontend hosting + SSR | 1 | None (enabler) | Low | Page speed (SSR vs SPA) | None | P0 | **MVP v1** |
| Alembic migration baseline + extensions | Schema version control | 1 | None (enabler) | Low | None | RDS | P0 | **MVP v1** |
| Sentry error tracking (FastAPI + Next.js) | Know when production breaks | 1 | None (enabler) | Low | None | None | P0 | **MVP v1** |
| CloudFront CDN (listing photos) | Global photo delivery; page speed | 3 | Indirect (conversion) | Low | Photo load time | S3 | P1 | **V1.1** |
| Lambda image resize pipeline (3 variants) | Photo compression; bandwidth cost | 5 | Indirect (cost saving) | Medium | Photo quality | Lambda, S3 | P1 | **V1.1** |
| PgBouncer connection pooling | Prevents DB connection exhaustion at scale | 2 | None | Low | None | RDS | P1 | **V1.1** |
| CloudWatch dashboards + alarms | Proactive incident detection | 3 | None | Low | Uptime | CloudWatch | P1 | **V1.1** |
| PagerDuty on-call integration | P0 incident response | 1 | None | Low | None | CloudWatch | P2 | **V1.1** |
| RDS Multi-AZ + automated failover | High availability; no single-DB failure | 3 | None | Low | Uptime | RDS | P1 | **V1.1** |
| Redis Multi-AZ replica | High availability for OTP + queue | 2 | None | Low | None | Redis | P1 | **V1.1** |

**MVP v1 infra subtotal: 17 SP**

---

## Category 2 — Trust & Safety + Host Onboarding

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| User model + KYC record migrations | Foundation for all personas | 1 | None (enabler) | Low | None | Alembic | P0 | **MVP v1** |
| Phone OTP via Twilio Verify (rate-limited) | Egypt's primary auth method; no email needed | 3 | Enables signups | Low | Frictionless login | Redis, Twilio | P0 | **MVP v1** |
| Firebase JWT middleware (all routes) | Stateless auth; scales horizontally | 2 | None (enabler) | Low | None | Firebase | P0 | **MVP v1** |
| KYC document upload (pre-signed S3 URL) | Host verification; prevents fake listings | 2 | Enables host supply | Low | Trust in listings | S3 KYC bucket | P0 | **MVP v1** |
| Manual KYC admin review (approve/reject endpoint) | Admin reviews ID scans; no automation needed for first 50 hosts | 2 | Enables host supply | Low | Listing authenticity | KYC upload | P0 | **MVP v1** |
| RBAC: GUEST, HOST, ADMIN roles only | Access control without over-engineering | 1 | None (enabler) | Low | None | JWT middleware | P0 | **MVP v1** |
| User profile endpoint (GET + PATCH) | Guest/host can see and update profile | 1 | None | Low | Self-service | User model | P0 | **MVP v1** |
| Next.js: phone input + OTP verification page (Arabic RTL) | Signup UX in Arabic; primary user action | 3 | Converts visitors to users | Low | First impression | Vercel, Twilio | P0 | **MVP v1** |
| Next.js: KYC upload flow (document camera, selfie) | Host onboarding; required for listing | 2 | Enables supply | Medium | Host friction | Pre-signed URL | P0 | **MVP v1** |
| Google Sign-In (Firebase OAuth) | Reduces friction for tech-savvy users | 2 | +5–10% signup conversion | Low | Convenience | Firebase | P1 | **V1.1** |
| Apple Sign-In (Firebase OAuth) | Required for iOS App Store compliance | 2 | iOS users | Low | iOS users | Firebase | P1 | **V1.1** |
| KYC automation: AWS Textract OCR | Removes admin bottleneck at scale | 5 | Faster host activation | Medium | Faster approval | Textract, Lambda | P1 | **V1.1** |
| KYC automation: AWS Rekognition biometric | Reduces fraud; removes manual photo review | 3 | Fraud reduction | Medium | Trust | Rekognition | P1 | **V1.1** |
| Session revocation (logout + ban cascade) | Security; ban propagates to active sessions | 2 | None | Low | Security | JWT middleware | P1 | **V1.1** |
| FIELD_STAFF + OPS_MANAGER roles | Needed for turnover operations | 2 | Operational scale | Low | Invisible | RBAC | P2 | **V1.5** |
| Audit log (all admin actions, 7yr retention) | Legal/compliance requirement | 3 | None | Low | Compliance | User model | P2 | **V1.5** |

**MVP v1 auth/onboarding subtotal: 17 SP**

---

## Category 3 — Property Management

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| Unit + unit_listings + calendar migrations | Foundation for all property data | 2 | None (enabler) | Low | None | Alembic, PostGIS | P0 | **MVP v1** |
| PostGIS GIST spatial index on coordinates | Enables search < 2s; Egyptian map search | 1 | Search quality → bookings | Low | Search speed | PostGIS | P0 | **MVP v1** |
| Unit CRUD endpoints (create, update, archive) | Hosts can build and manage their supply | 2 | Supply volume | Low | Listing quality | User model | P0 | **MVP v1** |
| Photo upload endpoint (pre-signed S3, original storage) | Listings need photos; guests won't book without them | 2 | Conversion rate | Low | Listing quality | S3 listings | P0 | **MVP v1** |
| Basic calendar: block/unblock date ranges | Host controls availability | 2 | Prevents invalid bookings | Low | Accurate availability | Unit model | P0 | **MVP v1** |
| Base pricing endpoint (one price, min nights) | Hosts set their rate | 1 | Revenue per booking | Low | Price discovery | Unit model | P0 | **MVP v1** |
| Unit status state machine (PENDING → LISTED → SUSPENDED) | Listing lifecycle; prevents unverified listings going live | 2 | Trust | Low | Listing authenticity | KYC status | P0 | **MVP v1** |
| Next.js: host listing creation form (Arabic, multi-step) | Host onboarding UX | 3 | Supply acquisition | Medium | Host experience | Unit CRUD | P0 | **MVP v1** |
| Next.js: host reservation dashboard (list of bookings, check-in/check-out CTA) | Host manages their business | 2 | Host retention | Low | Host satisfaction | Reservation model | P0 | **MVP v1** |
| Weekend / peak pricing multipliers | Revenue optimization for hosts | 2 | Host revenue → platform commission | Low | Host earnings | Pricing endpoint | P1 | **V1.1** |
| Custom date price override (e.g., Eid surcharge) | High-demand period monetization | 2 | GTV increase during peaks | Low | Host revenue | Calendar model | P1 | **V1.1** |
| Photo deletion endpoint | Content management | 1 | None | Low | Listing accuracy | S3 | P1 | **V1.1** |
| PMS KPIs: ADR, RevPAR, occupancy rate | Host retention; "see your performance" | 3 | Retention → commission | Low | Host value | Reservation data | P2 | **V1.5** |
| Calendar grid dashboard UI (full month view) | Advanced host calendar management | 3 | Host efficiency | Low | Host UX | Calendar API | P2 | **V1.5** |
| Multi-unit portfolio view (property manager dashboard) | Needed for B2B supply (hotel chains) | 5 | B2B revenue | Medium | Property manager UX | Unit model | P2 | **Phase 2** |
| Channel manager sync (Airbnb, Booking.com, VRBO) | Distribution breadth | 13 | Supply utilization | High | Host revenue | External APIs | P3 | **Never** |

**MVP v1 property management subtotal: 17 SP**

---

## Category 4 — Search + Maps

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| PostGIS spatial search (viewport + radius query) | Core discovery; map-first Egyptian UX | 3 | Bookings | Low | Discovery quality | PostGIS GIST index | P0 | **MVP v1** |
| Availability filter (check-in / check-out dates) | Filter out unavailable units | 2 | Reduces bounce rate | Low | Search relevance | Calendar rules | P0 | **MVP v1** |
| Price range filter + property type filter | Basic filtering | 1 | Conversion | Low | Search relevance | unit_listings | P0 | **MVP v1** |
| Cultural tags filter (FAMILY_ONLY, HALAL_CERTIFIED) | Core Arabic-market differentiator; no global OTA has this | 1 | GCC segment conversion | Low | Arabic guest UX | unit_listings | P0 | **MVP v1** |
| Basic text search (pg_trgm, Arabic + English) | Find by name / area | 2 | Discovery | Low | Finding listings | pg_trgm GIN index | P0 | **MVP v1** |
| Google Maps integration (Arabic locale, ar&region=EG) | Map-first search; Arabic geocoding | 2 | SEO + discovery | Low | Arabic UX | Google Maps API | P0 | **MVP v1** |
| Listing pins on map | Guests see property locations before booking | 1 | Conversion | Low | Location confidence | PostGIS | P0 | **MVP v1** |
| Next.js: search page (map + card list, Arabic RTL, SSR) | Primary guest acquisition surface | 5 | All booking revenue | Medium | First guest impression | All search APIs | P0 | **MVP v1** |
| Next.js: listing detail page (SSR/ISR, Arabic, photos) | Converts searcher to booker | 3 | Booking conversion | Low | Booking confidence | Unit model | P0 | **MVP v1** |
| Guest count filter | Filter by capacity | 1 | Conversion | Low | Search accuracy | unit_listings | P0 | **MVP v1** |
| Map pin clustering (dense area grouping) | UX for high-density results | 2 | Indirect conversion | Low | Map readability | Google Maps | P1 | **V1.1** |
| Price overlay on map pins | Scan prices without opening cards | 2 | Conversion speed | Low | UX quality | Search endpoint | P1 | **V1.1** |
| Amenities filter (pool, wifi, parking, etc.) | Common guest filter | 2 | Conversion | Low | Filter quality | unit_listings | P1 | **V1.1** |
| Sort by price / distance | Standard marketplace UX | 1 | Conversion | Low | Search UX | Search endpoint | P1 | **V1.1** |
| Algolia full-text (Arabic morphological stemming) | "شقة" matches "شقق"; correct Arabic search | 5 | Arabic segment retention | Low | Arabic UX quality | Algolia account | P2 | **Phase 2** |
| Saved search / alerts | Re-engagement | 3 | Repeat visits | Low | Convenience | User model | P3 | **Phase 2** |

**MVP v1 search + maps subtotal: 21 SP**

---

## Category 5 — Guest Booking

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| Reservation model + payment_intents migration | Foundation for all booking data | 1 | None (enabler) | Low | None | Alembic | P0 | **MVP v1** |
| Calendar lock service (SELECT FOR UPDATE NOWAIT) | Prevents double-booking; core marketplace trust | 3 | Prevents revenue-destroying disputes | **High** | Trust in platform | PostgreSQL | P0 | **MVP v1** |
| Booking initiation endpoint (lock → create reservation → create payment intent) | The money transaction begins here | 3 | 100% of revenue | High | Core booking UX | Calendar lock, Paymob | P0 | **MVP v1** |
| Check-in / check-out recording endpoints | Triggers escrow T+24h and host payment | 1 | Unlocks payout | Low | Booking lifecycle | Reservation model | P0 | **MVP v1** |
| Guest reservation list (own bookings) | Guests manage their trips | 1 | Retention | Low | Self-service | Reservation model | P0 | **MVP v1** |
| Guest-initiated cancellation + refund routing | Legal requirement; trust | 2 | Refund cost (acceptable) | Low | Guest trust | Payment model | P0 | **MVP v1** |
| Next.js: checkout flow (dates, guests, payment method selector, Arabic) | The most critical UX in the product | 5 | 100% of bookings | High | Conversion rate | Booking endpoint | P0 | **MVP v1** |
| Next.js: booking confirmation page | Guest knows booking succeeded | 1 | Retention | Low | Anxiety reduction | Payment webhook | P0 | **MVP v1** |
| Real-time calendar lock (SSE — Guest B sees HOLD while Guest A pays) | Reduces abandoned checkouts due to false availability | 3 | Reduces payment failures | Medium | UX quality | Redis pub/sub | P1 | **V1.1** |
| Promo / discount codes | Demand stimulation for early adopters | 3 | CAC reduction | Low | Guest incentive | Reservation model | P2 | **V1.5** |
| Instant booking vs. host approval toggle | Reduces booking friction | 2 | Conversion | Low | Speed | Reservation model | P2 | **V1.5** |
| Group booking / split payment | Larger party accommodation | 5 | GTV increase | Medium | Edge case | Reservation model | P3 | **Phase 2** |

**MVP v1 booking subtotal: 17 SP**

---

## Category 6 — Payments

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| Paymob: auth token + create order + payment key (Fawry + card iframe) | Every Egyptian can pay; 40% unbanked market | 5 | 100% of EG revenue | **High** | Market access | Paymob account | P0 | **MVP v1** |
| Paymob webhook: HMAC-SHA512 verify + idempotent status processing | Booking not confirmed until payment actually captured | 5 | Revenue integrity | **High** | Payment trust | Paymob, Redis | P0 | **MVP v1** |
| Basic escrow: hold on payment_confirmed, release T+24h (Celery task) | Guest protection + host payment timeline | 3 | Host confidence → supply | Medium | Host trust | Celery, Redis | P0 | **MVP v1** |
| Host payout via Paymob disbursement (manual trigger, admin) | Hosts receive money → they stay on platform | 3 | Host retention | Medium | Host satisfaction | Paymob disburse API | P0 | **MVP v1** |
| Host payout history (basic balance endpoint) | Host sees what they earned | 1 | Retention | Low | Transparency | Ledger | P0 | **MVP v1** |
| Cancellation refund (Paymob void/refund API) | Legal/trust requirement | 2 | Refund cost | Medium | Guest trust | Paymob | P0 | **MVP v1** |
| Next.js: Paymob iframe embedded in checkout | Guest completes payment without leaving platform | 3 | Conversion (iframe reduces friction vs redirect) | Medium | Checkout UX | Paymob token | P0 | **MVP v1** |
| Stripe integration (Visa/Mastercard for GCC travelers) | GCC traveler segment access | 5 | GCC revenue segment | Medium | GCC guest UX | Stripe account | P1 | **V1.1** |
| Automated payout batch (Celery Beat, daily 09:00) | Removes manual admin payout step | 3 | Operational scale | Low | Host reliability | Celery Beat | P1 | **V1.1** |
| Full double-entry ledger | Accounting-grade financial records | 5 | None (compliance) | Low | None (invisible) | Ledger model | P2 | **V1.5** |
| VAT + withholding tax by governorate | Egyptian tax compliance | 3 | None (compliance cost) | Low | Legal compliance | Tax config table | P2 | **V1.5** |
| B2B SaaS subscription billing | Second revenue stream | 8 | +15–20% revenue | Medium | Property manager value | Stripe subscriptions | P3 | **Phase 3** |

**MVP v1 payments subtotal: 22 SP**

---

## Category 7 — Notifications

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| WhatsApp template: booking confirmation (guest, Arabic) | Guest knows booking succeeded | 1 | Retention | Low | Anxiety reduction | WhatsApp API | P0 | **MVP v1** |
| WhatsApp template: new booking received (host, Arabic) | Host acts on booking | 1 | Host engagement | Low | Host operation | WhatsApp API | P0 | **MVP v1** |
| WhatsApp template: KYC approved (host, Arabic) | Host knows they can list | 1 | Supply activation | Low | Host UX | WhatsApp API | P0 | **MVP v1** |
| WhatsApp template: payout dispatched (host, Arabic) | Host knows money is coming | 1 | Retention | Low | Host satisfaction | WhatsApp API | P0 | **MVP v1** |
| WhatsApp template: booking cancelled (guest + host, Arabic) | Both parties informed | 1 | None (trust) | Low | Transparency | WhatsApp API | P0 | **MVP v1** |
| Celery notification worker (async dispatch, retry on failure) | Notifications don't block booking response | 2 | Delivery reliability | Low | UX speed | Celery, Redis | P0 | **MVP v1** |
| WhatsApp Business API account setup + template submission | All 5 templates need Meta pre-approval (72h) | 2 | Enabler | Low | None | Meta Business Mgr | P0 | **MVP v1** |
| WhatsApp template: check-in reminder (24h before) | Reduces no-shows | 1 | Occupancy | Low | Guest convenience | WhatsApp API | P1 | **V1.1** |
| WhatsApp template: checkout confirmation + review request | Review funnel | 1 | Review volume | Low | Prompt | WhatsApp API | P1 | **V1.1** |
| AWS SES email (secondary channel, booking receipts) | PDF receipt; formal record | 3 | None | Low | Formal communications | SES, domain | P1 | **V1.1** |
| Twilio SMS fallback (when WhatsApp undeliverable) | Message delivery guarantee | 2 | None | Low | Delivery rate | Twilio | P2 | **V1.5** |
| In-app notification center | Platform-native notifications | 5 | Engagement | Low | Convenience | Push infra | P3 | **Phase 2** |

**MVP v1 notifications subtotal: 9 SP**

---

## Category 8 — Reviews

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| Guest reviews host (5-star + text, after checkout) | Trust signal; drives booking confidence | 3 | Conversion rate | Low | Booking trust | Completed reservation | P1 | **V1.1** |
| Host reviews guest (5-star, after checkout) | Trust signal for host acceptance | 2 | Host confidence | Low | Supply side | Completed reservation | P1 | **V1.1** |
| Review display on listing page | Social proof on the conversion page | 2 | Conversion | Low | Guest confidence | Reviews model | P1 | **V1.1** |
| Rating aggregation (average score display) | Single trust signal at a glance | 1 | Conversion | Low | Trust signal | Reviews | P1 | **V1.1** |
| Review moderation (admin remove/flag) | Prevents fake/abusive reviews | 2 | None | Low | Trust integrity | Admin endpoints | P2 | **V1.5** |
| Review response (host replies to guest review) | Professional host image | 2 | Retention | Low | Host value | Reviews model | P2 | **V1.5** |
| Verified stay badge (review only after real checkout) | Prevents fraudulent reviews | 1 | Trust | Low | Review credibility | Reservation model | P1 | **V1.1** |

**MVP v1 reviews subtotal: 0 SP** (Reviews are V1.1 — not blocking first booking)

---

## Category 9 — Operations (OpsManager)

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| Turnover ticket auto-creation on checkout | Operational discipline at scale | 5 | Repeat booking quality | Medium | Property readiness | Checkout event | P2 | **V1.5** |
| Field staff assignment (proximity-based) | Automation at > 50 active units | 5 | Operational cost reduction | Medium | Turnover speed | PostGIS, staff model | P2 | **V1.5** |
| Checklist task management | Standard operating procedure | 3 | None | Low | Property quality | Ticket model | P2 | **V1.5** |
| Verification photo gate (ticket not closed without photos) | Quality control proof | 2 | None | Low | Property quality | S3 ops bucket | P2 | **V1.5** |
| Field staff mobile app (React Native, offline-first, SQLite) | Field operations at scale | 13 | Operational cost reduction | **High** | Turnover speed | All ops APIs | P3 | **Phase 2** |
| Supply tracking (consumables per turnover) | Cost management at scale | 3 | None | Low | Invisible | Ticket model | P3 | **Phase 2** |
| Offline sync (SQLite reconciliation) | Connectivity-resilient field ops | 5 | None | Medium | Field staff UX | Mobile app | P3 | **Phase 2** |
| Automated scheduling from checkout calendar | Zero-touch dispatch | 5 | Operational scale | Medium | Invisible | Calendar model | P3 | **Phase 2** |

**MVP v1 operations subtotal: 0 SP** (Manual operations acceptable for first 50 units — matches Phase 0 approach)

---

## Category 10 — Admin / Incident Console

| Feature | Business Value | Eng Cost (SP) | Revenue Impact | Tech Risk | Customer Impact | Dependencies | Priority | Version |
|---------|---------------|--------------|---------------|-----------|----------------|-------------|---------|---------|
| Admin: approve/reject KYC endpoint | Required for host activation | 1 | Supply activation | Low | Trust | KYC model | P0 | **MVP v1** (already counted in Auth) |
| Admin: suspend/ban user endpoint | Trust & safety enforcement | 1 | None | Low | Platform safety | User model | P0 | **MVP v1** |
| Admin: emergency delist listing endpoint | Kill-switch for fraud/safety | 1 | None | Low | Platform trust | Unit model | P1 | **V1.1** |
| Admin: manual payout trigger endpoint | Enables host payment before automation | 1 | Host satisfaction | Low | Payout | Finance model | P0 | **MVP v1** (counted in Payments) |
| Incident Console UI (Next.js admin dashboard) | Admin UX for managing disputes | 5 | None | Low | Admin efficiency | All APIs | P2 | **V1.5** |
| Dispute queue + resolution workflow | Formal dispute handling | 5 | Dispute rate reduction | Low | Guest/host trust | Reservation, Finance | P2 | **V1.5** |
| Audit log viewer UI | Compliance visibility | 2 | None | Low | Compliance | Audit log | P2 | **V1.5** |
| Platform kill-switch (halt all new bookings) | Emergency stop | 2 | None | Low | Crisis management | Reservation flow | P2 | **V1.5** |

**MVP v1 admin subtotal: 2 SP** (just the two new endpoints; KYC approve and payout trigger already counted above)

---

## MVP v1 — Final Scope

### Total Story Points: 65 SP

| Category | MVP v1 SP |
|----------|----------|
| Infrastructure (slim) | 17 |
| Auth + Trust + Host Onboarding | 17 |
| Property Management | 17 |
| Search + Maps | 21 |
| Guest Booking | 17 |
| Payments | 22 |
| Notifications | 9 |
| Reviews | 0 |
| Operations | 0 |
| Admin (incremental) | 2 |
| **TOTAL** | **65 SP** |

> Note: Search + Maps is the largest because the guest-facing experience (search page + listing detail) is the highest-converting surface. It is correctly sized as the MVP's primary investment.

### What MVP v1 Delivers

A guest can:
1. Register with an Egyptian phone number (OTP, Arabic UI)
2. Search for verified listings on a Google Maps interface, filtered by dates, price, cultural preferences
3. Open a listing detail page with photos, description, amenities, and availability
4. Book and pay via Fawry, Meeza, Vodafone Cash, or card through Paymob
5. Receive WhatsApp booking confirmation in Arabic
6. View and manage their bookings
7. Cancel with a refund per the cancellation policy

A host can:
1. Register, upload national ID for KYC (admin approves manually)
2. Create a listing with photos, calendar, and price
3. Receive WhatsApp notification when a booking arrives
4. Record check-in and check-out
5. Receive payout via Paymob disbursement (admin-triggered)
6. See their booking history and balance

An admin can:
1. Approve or reject KYC submissions (manual review of uploaded documents)
2. Suspend or ban users
3. Trigger manual payouts to hosts

---

## Features Removed from MVP v1

These were in the 406-point backlog but are cut entirely from MVP v1:

| Feature | Removed From | Reason |
|---------|-------------|--------|
| Lambda image resize (3 photo variants) | EPC-01-016 (5 SP) | Photos display fine without resize for first 500 listings; bandwidth cost acceptable |
| CloudFront CDN | EPC-01-006 (3 SP) | Vercel + S3 direct is acceptable latency for Phase 1 Egypt traffic |
| PgBouncer connection pooling | EPC-01 (2 SP) | SQLAlchemy pool is sufficient at < 50 concurrent connections |
| CloudWatch dashboards + PagerDuty | EPC-01-013/015 (4 SP) | Sentry + basic CloudWatch logs sufficient for first sprint |
| Multi-AZ RDS + Redis | EPC-01-002/003 (5 SP) | Single-AZ with daily RDS snapshot is acceptable for MVP; upgrade before 100 bookings |
| Google + Apple SSO | EPC-02-005/006 (4 SP) | OTP is sufficient; SSO is a convenience addition, not a requirement |
| KYC automation (Textract + Rekognition) | EPC-02-008 (8 SP) | Manual admin review works for first 50 hosts; automation is V1.1 |
| Session revocation / audit log | EPC-02-011/012 (5 SP) | Firebase handles token expiry; audit log is compliance, not day-1 need |
| Weekend / peak pricing multipliers | EPC-03 (2 SP) | One price is sufficient for pilot; hosts can approximate manually |
| PMS KPIs (ADR, RevPAR, occupancy) | EPC-03-012 (3 SP) | Hosts don't need analytics before their first 5 bookings |
| Calendar grid UI (full dashboard) | EPC-03 (3 SP) | Simple list-based calendar management is sufficient for MVP hosts |
| Map pin clustering | EPC-03-013 partial (2 SP) | No dense clusters at 500 listings; visible pins are fine |
| Amenities + sort filters | EPC-03 (3 SP) | Core filters (dates, price, cultural tags, type) are sufficient for discovery |
| Real-time SSE calendar lock | EPC-04-013 (3 SP) | Page reload shows updated availability; SSE adds complexity not needed at Phase 1 volume |
| Promo / discount codes | EPC-04-010 (3 SP) | Not needed to prove the booking loop; add for growth campaigns |
| Stripe integration | EPC-04-004/005 (8 SP) | Paymob card handles Egyptian cards; Stripe (GCC) is V1.1 after Egypt validation |
| Automated payout batch (Celery Beat) | EPC-06-007 (5 SP) | Manual admin-triggered payout works for < 100 bookings/month |
| Full double-entry ledger | EPC-06-004 (5 SP) | Simple balance tracking sufficient for audit until 100+ hosts |
| VAT / tax withholding | EPC-06-006 (3 SP) | Tax compliance deferred until legal entity registration complete |
| Reviews system | EPC entire | First 50 guests book on trust + KYC; reviews are V1.1 |
| OpsManager (all) | EPC-05 (50 SP) | Manual operations acceptable for Phase 1 (< 50 units); matches Phase 0 model |
| Field staff mobile app | EPC-05-010 to 013 (21 SP) | Manual turnover management until V1.5 |
| AWS SES email | EPC-07-003 (2 SP) | WhatsApp is primary; email is secondary and not needed for MVP |
| Incident Console UI | EPC-08-001 to 006 (18 SP) | Admin uses API endpoints directly; UI after first 100 bookings |
| E2E integration tests | EPC-08-007/008 (8 SP) | Unit + API tests in CI are sufficient for MVP; Playwright added in V1.1 |
| Security hardening sprint | EPC-09 (31 SP) | Core security built-in (HMAC, JWT, Pydantic validation); dedicated hardening sprint before 1K bookings |

**Total removed from MVP v1**: 341 SP cut → 65 SP remaining

---

## Deferred Features by Version

### V1.1 — Ships within 4 weeks of 10-booking milestone (without gate clearance)

- Google + Apple SSO
- KYC automation (Textract OCR + Rekognition biometric)
- Stripe (international card payments — GCC travelers)
- CloudFront CDN (listing photo delivery)
- Lambda image resize (thumbnail, preview, full)
- PgBouncer + Multi-AZ RDS + Multi-AZ Redis
- CloudWatch dashboards + PagerDuty
- Real-time SSE calendar lock
- AWS SES email (booking receipts, backup channel)
- WhatsApp: check-in reminder + checkout + review request templates
- Reviews (guest reviews host, host reviews guest, display, aggregation)
- Map pin clustering + price overlays
- Amenities filter + sort
- Stripe webhook handler
- Session revocation + audit log foundation
- Automated payout batch (Celery Beat)
- Emergency listing delist endpoint
- E2E Playwright tests

### V1.5 — Ships after 100 bookings / $15K GTV

- OpsManager: turnover tickets, field staff assignment, verification photos
- Weekend / peak / custom date pricing
- Promo / discount codes
- PMS KPIs dashboard (ADR, RevPAR, occupancy)
- Calendar grid dashboard UI
- Full double-entry ledger
- VAT + withholding tax by governorate
- Incident Console UI
- Dispute resolution workflow
- Platform kill-switch
- Audit log viewer
- FIELD_STAFF + OPS_MANAGER roles
- Review moderation + host reply
- Twilio SMS fallback
- Security hardening sprint (WAF, load test, pentest)

### Phase 2 — After PMF signal (~500 listings, ~200 bookings/month)

- Field staff mobile app (React Native, offline-first, SQLite)
- Algolia Arabic morphological full-text search
- Multi-unit property manager portfolio dashboard
- Multi-region architecture (Saudi Arabia / AWS KSA region)
- HyperPay / STC Pay for Saudi expansion
- In-app push notifications
- Saved search + price alerts
- Automated cleaning schedule from checkout calendar
- CQRS read/write split for Reservation Engine

### Phase 3 — After 50K+ transactions (data threshold for AI)

- Claude API: pricing recommendation assistant
- ML demand forecasting (RevPAR optimization)
- Personalized search ranking (ML matching)
- Fraud detection ML model
- B2B SaaS subscription billing + channel manager dashboard
- Arabic NLP semantic search (embeddings)

### Never

- Channel manager integrations (Airbnb, Booking.com, VRBO calendar sync)
- Dynamic pricing algorithm (rule-based only until Phase 3 data threshold)
- W-8BEN / 1099-K automated tax document pipeline
- Consumer mobile app (iOS/Android) for guests/hosts — Web PWA is sufficient through Phase 2
- Multi-language backend i18n (Arabic strings are data, not code)
- Cryptocurrency payment methods

---

## Critical Path

```
Phase 0 gate clearance (non-engineering prerequisite)
    ↓
Sprint 0 [2w]: Infrastructure
    AWS VPC → RDS → Redis → ECS → ALB → S3 → Secrets Manager → CI/CD → Vercel
    EXIT: GET /health returns 200; CI deploys to staging
    ↓
Sprint 1 [3w]: Auth + Listings (parallel backend tracks)
    Track A: OTP → JWT middleware → KYC upload → Admin review endpoint → RBAC
    Track B: Unit model → PostGIS index → Unit CRUD → Photo upload → Calendar → Pricing
    Frontend: Arabic RTL foundation → signup/OTP page → host listing creation form
    EXIT: A verified host has a listed property with photos
    ↓
Sprint 2 [3w]: Search + Booking
    Track A: PostGIS search → text search → filters → availability endpoint
    Track B: Reservation model → Calendar lock service → Booking initiation → Checkout frontend
    Frontend: Search page (map + cards) → Listing detail (ISR) → Checkout flow
    EXIT: A guest can find a listing and reach the payment step
    ↓
Sprint 3 [2w]: Payments + Launch
    Paymob integration → webhook handler → escrow task → payout endpoint
    Notification Celery worker → 5 WhatsApp templates
    Frontend: Paymob iframe → confirmation page → booking history
    Smoke test: complete one end-to-end booking with Fawry in staging
    EXIT: One real booking completed in production
```

**Critical path length**: 10 weeks from infrastructure start to first live booking.

**Parallel opportunities**:
- WhatsApp Business API application (Meta, 72h review) → submit on Day 1 of Sprint 0
- Paymob merchant account registration → submit on Day 1 of Sprint 0
- Firebase project creation → Sprint 0 week 1
- KYC admin review workflow (spreadsheet) → operational before Sprint 1 ends

---

## Engineering Start Checklist

Before writing the first line of application code, the following must be complete:

### Phase 0 Gate (Founder — not engineering)
- [ ] 50 traveler interviews completed and synthesized
- [ ] 30 host/property manager interviews completed
- [ ] 10 manual bookings executed (WhatsApp + bank transfer)
- [ ] Guest NPS ≥ 7.0 / Host NPS ≥ 7.0 confirmed
- [ ] Founding wedge identified (beach resort? Cairo urban? GCC inbound?)

### Legal (Founder + Legal Advisor — not engineering)
- [ ] Egyptian legal entity registered (LLC or joint stock)
- [ ] Egypt Tourism Authority license application submitted
- [ ] Central Bank of Egypt payment processing compliance reviewed
- [ ] VAT registration initiated

### External Accounts (Founder — must happen before Sprint 0 ends)
- [ ] **Paymob merchant account** approved and test API keys received
- [ ] **WhatsApp Business API** application submitted to Meta Business Manager (72h+ review — submit immediately)
- [ ] **Firebase project** created (prod + dev environments)
- [ ] **Twilio account** created, Verify service SID received
- [ ] **Google Cloud Platform** account; Maps API key generated, restricted to stayos.com
- [ ] **AWS account** (prod) created with MFA; IAM admin user created for DevOps

### Team (Founder — not engineering, but blocks delivery timeline)
- [ ] At minimum: 1 backend engineer hired (Python + FastAPI)
- [ ] At minimum: 1 frontend engineer hired (React / Next.js, Arabic RTL experience preferred)
- [ ] DevOps capacity identified (can be founder + one engineer initially)

### Repository (Engineering — Sprint 0 Day 1)
- [ ] `tooling/document-extractor` branch merged to `main` (or this branch promoted)
- [ ] `src/` directory created (Python FastAPI project scaffold)
- [ ] `apps/web/` directory created (Next.js project scaffold)
- [ ] `pyproject.toml` with ruff, mypy, pytest dependencies
- [ ] `.github/workflows/ci.yml` running ruff + mypy + pytest on every PR
- [ ] Environment variable structure documented (`.env.example`, no actual secrets)

### Product (Founder + Engineering — before Sprint 1)
- [ ] 5 host seed listings confirmed (real Egyptian properties willing to list for Phase 1)
- [ ] Admin (founder) can access backend to manually approve KYC and trigger payouts
- [ ] First WhatsApp message template content written in Arabic (native speaker review)
- [ ] Photo style guide defined (minimum 5 photos, natural light, no filters)

---

## How to Use This Document

1. **Before any sprint**: engineer opens this file, finds their epic, verifies the feature is in MVP v1 before building it.
2. **Feature not in MVP v1?**: Stop. Do not build. Add to sprint backlog for the correct version.
3. **New feature request?**: It starts as Never until a booking-flow argument is made for earlier inclusion.
4. **V1.1 features**: Not unlocked until 10 bookings are confirmed in production. The 10-booking count is tracked in TASKS.md.
5. **Version changes**: Require founder decision recorded in DECISION_LOG.md before the sprint starts.

**This document does not change without a decision entry in DECISION_LOG.md.**
