# OFFICIAL REFERENCE PRODUCT BENCHMARK — StayOS

**Status:** OFFICIAL
**Version:** 1.0
**Date:** 2026-09-02
**Purpose:** Permanent product-reference benchmark for all future implementation phases
**Source:** Existing approved competitor research and product strategy documents already in this repository
**New competitor research performed during creation of this document:** NONE

---

## 0. How to Read This Document

This document is the **Official Reference Product Benchmark**. It consolidates
approved findings from existing competitor research and product strategy
documents into a permanent, version-controlled reference layer.

### Source-of-Truth Hierarchy

```
1. FOUNDER DECISIONS          (highest authority — explicit StayOS product decisions)
        ↓
2. STAYOS PRD                 (approved product requirements)
        ↓
3. REFERENCE PRODUCT BENCHMARK (this document — approved reference behavior)
        ↓
4. CURRENT REPOSITORY         (implementation truth)
        ↓
5. EXECUTION PROMPTS          (implementation instructions derived from the above)
```

**Rules:**
- The benchmark NEVER overrides an explicit Founder Decision.
- The benchmark NEVER overrides an explicit StayOS PRD requirement.
- The benchmark is a **reference**, not a command to blindly copy another company.
- A Founder Decision may intentionally differ from the reference — that is not a bug.
- If a genuine contradiction is discovered between the benchmark and a Founder
  Decision or PRD, it is **reported**, not silently resolved.

### Entry Classification

Every entry in this document is classified as one of:

| Classification | Meaning |
|----------------|---------|
| **REFERENCE** | What the approved benchmark / competitor research says |
| **STAYOS DECISION** | What StayOS explicitly decided (Founder or PRD) |
| **CURRENT IMPLEMENTATION** | What the repository currently implements |
| **GAP** | A difference supported by evidence (not automatically a bug) |

---

## 1. Source Documents Used

All findings in this benchmark trace to documents already in the repository.
No external research was performed.

| Source Document | Location | Authority |
|----------------|----------|-----------|
| Product Thesis | `reports/executive/01_PRODUCT_THESIS.md` | Constitutional |
| Competitive Advantage Audit | `reports/executive/02_COMPETITIVE_ADVANTAGE_AUDIT.md` | Executive |
| Product Strategy Review | `reports/executive/PRODUCT_STRATEGY_REVIEW.md` | Executive |
| MVP Freeze | `docs/02_product/MVP_FREEZE.md` | Product spec |
| Feature Catalog | `docs/02_product/FEATURE_CATALOG.md` | Product spec |
| Business Rules | `docs/02_product/BUSINESS_RULES.md` | Product spec |
| Flows | `docs/02_product/FLOWS.md` | Product spec |
| Trust Framework | `docs/03_customer_experience/TRUST_FRAMEWORK.md` | CX spec |
| Stop Doing List | `reports/executive/06_STOP_DOING_LIST.md` | Executive |
| V1 Payment & Commission Policy | `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` | Decided |
| Cancellation & Refund Policy V1 | `docs/legal/STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` | Decided (business rules) |
| Founder Action & Decision Pack | `docs/legal/FOUNDER_ACTION_AND_DECISION_PACK_2026-08-26.md` | Founder actions |
| ADR — Mobile Framework | `.ai/DECISIONS/ADR-MOBILE-FRAMEWORK.md` | Decided |
| EPOS Authority | `epos/AUTHORITY.md` | Governance |
| EPOS Knowledge Base | `epos/KNOWLEDGE_BASE.md` | Governance |
| EPOS Project State | `epos/PROJECT_STATE.md` | Governance |
| Single Source of Truth | `docs/SINGLE_SOURCE_OF_TRUTH.md` | Governance |
| Repository Information Architecture | `docs/governance/REPOSITORY_INFORMATION_ARCHITECTURE.md` | Governance |
| Product Experience Design | `docs/PRODUCT_EXPERIENCE_DESIGN.md` | Design spec |
| Mobile Native Design P1–P5 | `docs/MOBILE_NATIVE_DESIGN_P{1-5}.md` | Design spec |
| Visual Design System P1–P4 | `docs/VISUAL_DESIGN_SYSTEM_P{1-4}.md` | Design spec |

---

## 2. Product Scope

### REFERENCE — Competitive Landscape

Source: `02_COMPETITIVE_ADVANTAGE_AUDIT.md` § 1

| Competitor | Strengths | Weaknesses in MENA |
|------------|-----------|-------------------|
| Airbnb | Global brand, massive supply, trust system, reviews | English-first, no local payment, no cultural context, 15-20% fees, slow payout, no Arabic support |
| Booking.com | Global brand, instant booking, hotel + apartment mix | English-first, no local payment, high commission, no cultural context, no Arabic support |
| Local Facebook groups | Arabic-native, free, trusted network | No trust infrastructure, no payment, no calendar, no search, no verification, manual coordination |
| WhatsApp direct booking | Arabic-native, free, personal trust | No platform, no discovery, no payment security, no escrow, no reviews |
| Local real estate agents | Local knowledge, relationships | No online platform, no payment security, limited inventory, no reviews |

**Key insight (approved):** None of these competitors solve all of: Arabic-first UX + local payment + verified supply + cultural context + trust infrastructure. StayOS's competitive advantage is the **combination**, not any single feature.

### STAYOS DECISION — Product Identity

Source: `01_PRODUCT_THESIS.md`, `epos/KNOWLEDGE_BASE.md` KB-001

StayOS is an AI-powered, two-sided accommodation marketplace for MENA. "OS" is a business metaphor — the operating system of accommodation. Core layers: Trust Infrastructure, Arabic-First Marketplace, Local Payment Rails, AI Intelligence, B2B Supply Tools.

### STAYOS DECISION — Market Entry

Source: `epos/AUTHORITY.md` DEC-002

Egypt as proof-of-concept; GCC is the business. Primary entry market: Egypt. Primary business: Egypt-GCC travel corridor.

### STAYOS DECISION — Supply Strategy

Source: `epos/AUTHORITY.md` DEC-005

B2B2C supply strategy — hotels and property managers first.

### STAYOS DECISION — Trust Before Scale

Source: `epos/AUTHORITY.md` DEC-006

Trust before scale — no shortcuts on verification.

### STAYOS DECISION — Channel Manager Exclusion

Source: `06_STOP_DOING_LIST.md` #3, `PRODUCT_STRATEGY_REVIEW.md` § 4.2

Channel manager sync (Airbnb/Booking.com) is **NEVER** to be built. StayOS is not a channel manager. StayOS functions as a clean vertical platform ecosystem.

---

## 3. Guest Experience

### REFERENCE — Why Guests Switch (from Airbnb)

Source: `01_PRODUCT_THESIS.md` "Why Guests Switch"

A guest switches from Airbnb to StayOS when they experience:

1. **Arabic that feels native** — not translated, not placeholder, but written for them
2. **Cultural filters that matter** — "family-only" and "halal-certified" as visible, usable filters
3. **Trust they can see** — verified host badges, escrow protection displayed at checkout
4. **Payment they can use** — Vodafone Cash, Fawry, not just Visa/Mastercard
5. **Support that responds** — Arabic WhatsApp, not an English chatbot

**Switch threshold (approved):** If a guest cannot perceive at least 3 of these 5 within the first minute, they will not switch.

### REFERENCE — Guest Journey Gaps (as of audit date)

Source: `PRODUCT_STRATEGY_REVIEW.md` § 3.1

- No map (search was grid-only at audit time)
- No availability on cards (guests cannot see which listings are available for their dates without opening each one)
- No checkout/payment (booking panel created a request but did not collect payment)
- No reviews or host profile (trust signals missing)
- No Arabic voice/UX polish (copy was mostly string keys and placeholders)

### STAYOS DECISION — Arabic-First UX

Source: `epos/AUTHORITY.md` DEC-003

Arabic-first UX (not translated). RTL-native, written in Arabic by Arabs.

### CURRENT IMPLEMENTATION — Guest Experience

Source: repository code, `epos/PROJECT_STATE.md`

- Web: 21 routes built, search with PostGIS, booking flow, payment proof upload
- Mobile: React Native/Expo app with discovery, booking, reviews, favorites, trips, messaging
- Reviews system implemented (guest review system + web parity)
- Favorites/wishlists implemented (mobile + web parity)
- Map-based search implemented (ListingMap component)
- Arabic i18n strings present (web + mobile)

---

## 4. Host Experience

### REFERENCE — Why Hosts Switch (from Airbnb)

Source: `01_PRODUCT_THESIS.md` "Why Hosts Switch"

A host switches from Airbnb to StayOS when they experience:

1. **Lower fees** — 10% vs 15-20%. More money in their pocket.
2. **Faster payout** — 48 hours vs weeks. Cash flow matters.
3. **Arabic onboarding** — they can create a listing without struggling through English
4. **Local support** — someone who speaks their language and understands their context
5. **Founding host incentives** — 0% commission for first 3 bookings, free photography

**Switch threshold (approved):** If a host cannot create a listing with photos in under 30 minutes with founder assistance, they will not switch.

### REFERENCE — Host Journey Gap (as of audit date)

Source: `PRODUCT_STRATEGY_REVIEW.md` § 3.2

The host journey was essentially missing at audit time. A host could not: register as a host, upload KYC documents from the web, create a listing, add photos, set calendar and pricing, or publish.

### STAYOS DECISION — Host Onboarding

Source: `PRODUCT_STRATEGY_REVIEW.md` § 4.3, `06_STOP_DOING_LIST.md` #38

Host onboarding wizard is a required MVP feature. However, automated host onboarding (no human touch) is deferred to V1.5 — 60%+ of hosts need founder assistance.

### CURRENT IMPLEMENTATION — Host Experience

Source: repository code (`src/app/host/`, `apps/mobile/src/screens/host/`)

- Host Operating System module implemented: permissions, co-hosts, repository, services, router
- Host listing management: create, edit, photos, availability, co-hosts
- Host calendar, reservations, earnings, messages, today dashboard
- Mobile host screens: HostListings, HostListingDetail, HostListingEditor, HostListingPhotos, HostListingAvailability, HostListingCoHosts, HostCreateListing
- Co-host permission system: owner, admin, full_access, calendar_messaging, calendar_only

---

## 5. Property / Unit / Listing

### REFERENCE — Listing Creation

Source: `MVP_FREEZE.md` § 2, `FEATURE_CATALOG.md` FC-04

- Manual listing creation interface: address maps, baseline room metrics, text property outlines, simple photo array setups
- Multi-dimensional grid calendar rendering active reservation metrics and blocking operations

### REFERENCE — Listing Quality

Source: `02_COMPETITIVE_ADVANTAGE_AUDIT.md` § 3

- Photo upload is a hard blocker for listing quality and conversion
- Verified host badge on listing detail is a critical trust signal (backend exists, frontend is a badge component)
- Cultural tag filter chips on search page are a core differentiator (data model exists, UI is filter chip row)

### STAYOS DECISION — Listing Status Lifecycle

Source: `docs/02_product/BUSINESS_RULES.md` BR-INV-02, repository code

Unit status lifecycle: DRAFT → PENDING_VERIFICATION → LISTED / UNLISTED / ARCHIVED / REJECTED / SUSPENDED. A unit cannot switch to READY_FOR_OCCUPANCY unless its turnover ticket holds a CLOSED state.

### CURRENT IMPLEMENTATION — Property/Unit/Listing

Source: `src/app/listings/`, `src/app/host/`

- Unit + UnitListing models with full CRUD
- Photo upload via S3 presigned URLs
- Calendar rules (available, blocked, booked) with PostgreSQL exclusion constraints
- Listing readiness checks (title, description, photos, price, amenities)
- Host listing detail endpoint combining listing + photos + readiness + permission scope
- Co-host permissions integrated into all listing operations

---

## 6. Search / Discovery

### REFERENCE — Search Expectations

Source: `PRODUCT_STRATEGY_REVIEW.md` § 3.1, § 3.6

- Map-based search is "non-negotiable" for property discovery in Egypt
- Egyptian users expect map-first discovery
- Grid-only search feels inferior to Airbnb
- Availability on cards (guests should see which listings are available for their dates without opening each one)

### REFERENCE — Cultural Filters

Source: `01_PRODUCT_THESIS.md`, `02_COMPETITIVE_ADVANTAGE_AUDIT.md` § 3

- Cultural tags (family-only, halal-certified) as first-class search filters
- Data model exists; UI is a filter chip row (~1 SP effort)
- If < 20% of searches use cultural filters, the differentiator is weak (assumption A3)

### STAYOS DECISION — PostGIS Spatial Search

Source: `02_COMPETITIVE_ADVANTAGE_AUDIT.md` #20

PostGIS spatial search is implemented (table stakes, not a differentiator).

### CURRENT IMPLEMENTATION — Search/Discovery

Source: `src/app/listings/`, `apps/web/components/listings/ListingMap.tsx`

- PostGIS spatial search with geo-spatial query engine
- Map-based search (ListingMap component on web, react-native-maps on mobile)
- Amenity and cultural tag filters
- Price range filtering
- Mobile discovery screen with search, filters, map view

---

## 7. Availability

### REFERENCE — Calendar Integrity

Source: `BUSINESS_RULES.md` BR-INV-01

Under no conditions shall overlapping confirmed reservations be written to a single unit. The database must apply an atomic exclusion lock to prevent race conditions during concurrent booking sessions.

### STAYOS DECISION — Calendar Concurrency

Source: `epos/KNOWLEDGE_BASE.md` KB-015

PostgreSQL exclusion constraints on `tsrange` are the safest way to prevent overlapping HOLD/BOOKED calendar rules. Application code should catch `IntegrityError` and translate it into a domain `ConflictError`.

### CURRENT IMPLEMENTATION — Availability

Source: `src/app/listings/models.py`, `src/app/reservations/repository.py`

- Calendar rules with status: available, blocked, booked
- PostgreSQL exclusion constraints on tsrange
- Calendar rule CRUD (create, update, delete) with co-host permission checks
- Bulk availability/pricing updates
- Mobile availability management screen

---

## 8. Calendar

### REFERENCE — Calendar Management

Source: `MVP_FREEZE.md` § 2, `FEATURE_CATALOG.md` FC-04

- Multi-dimensional grid calendar rendering active reservation metrics and blocking operations
- Host can manually adjust calendar, set pricing rules

### CURRENT IMPLEMENTATION — Calendar

Source: `src/app/host/`, `apps/mobile/src/screens/host/HostCalendarScreen.tsx`

- Host calendar API with day-level status (available, booked, blocked)
- Guest name and price per day
- Mobile calendar screen with stats (available, booked, blocked counts)
- Block dates form with block type (manual, cleaning, maintenance) and price override

---

## 9. Pricing

### REFERENCE — Commission Structure

Source: `PRODUCT_STRATEGY_REVIEW.md` § 2.3, `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 2

| Fee | Rate | Notes |
|-----|------|-------|
| Host commission | 10% | Competitive with Airbnb (3-14%) |
| Platform take rate | 2% | Small but additive |
| Guest service fee | 4% | Reasonable for MENA |

Combined StayOS take: ~14-16% of GTV. Airbnb takes ~15.5% host-only (or 3%+6-12% split). Booking.com takes 10-25%.

### STAYOS DECISION — Alpha Incentives

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 2

- **First 3 completed bookings per Host:** 0% host commission (2% platform take still applies)
- **First 10 completed guest bookings globally:** 0% guest service fee
- After those thresholds, standard V1 rates apply

### STAYOS DECISION — Manual Pricing

Source: `06_STOP_DOING_LIST.md` #39, `MVP_FREEZE.md` § 3

Dynamic pricing engine is deferred to Phase 2+. Unit night valuations are defined manually by host input. No predictive machine learning demand calculation.

### CURRENT IMPLEMENTATION — Pricing

Source: `src/app/listings/models.py`, `src/app/finance/services.py`

- Base price, cleaning fee, weekend multiplier, peak multiplier
- Min/max nights configuration
- Commission calculation system in `finance/services.py`
- Alpha incentive logic implemented (first 3 bookings per host, first 10 guest bookings)
- Price override per calendar rule

---

## 10. Booking

### REFERENCE — Booking Flow

Source: `FLOWS.md` § 1, `MVP_FREEZE.md` § 2

1. Discovery search (dates, geospatial geofence)
2. AuthGate triggered (OTP/SSO validation)
3. KYC verification gate
4. Reservation workflow (atomic database inventory calendar lease lock)
5. Payment authorization
6. Terminal confirmation (generate booking ref ID, distribute notifications)

### REFERENCE — Booking States

Source: `BUSINESS_RULES.md`, repository code

Booking lifecycle: requested → accepted → pending (payment proof) → confirmed → checked_in → checked_out / cancelled / rejected / no_show

### STAYOS DECISION — Payment Deadline

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1

Guest must submit payment proof within **24 hours** of Host acceptance. If proof is not submitted within 24 hours, the booking may be cancelled by the Host or an admin. (No automatic timer exists — enforced manually for V1.)

### CURRENT IMPLEMENTATION — Booking

Source: `src/app/bookings/`, `apps/mobile/src/screens/`

- Full booking lifecycle with state machine
- Booking request, acceptance, payment proof upload, verification
- Cancellation with reason tracking
- Check-in/check-out tracking
- Mobile booking flow (search → listing detail → booking → payment proof)
- Cancel booking modal (mobile + web)

---

## 11. Cancellation / Refund

### REFERENCE — Cancellation Tiers

Source: `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` § 3, `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1

| Tier | Full accommodation refund if cancelled... | After that cutoff |
|------|------------------------------------------|-------------------|
| Flexible | ≥24 hours before check-in | No refund |
| Moderate | ≥5 days before check-in | No refund |
| Strict | 50% refund if ≥1 week before check-in | No refund |

### STAYOS DECISION — Service Fee on Cancellation

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1

- **Guest-initiated cancellation:** Guest service fee (4%) is **non-refundable**, regardless of tier or timing
- **Host cancellation:** Guest receives **100% refund of everything** (accommodation + service fee). StayOS charges Host no commission. Repeated host cancellations (2+ in alpha) trigger manual admin review.
- **Property unavailable / double-booked:** Same as Host cancellation — 100% guest refund, listing flagged for review
- **Guest no-show:** No refund of accommodation or service fee
- **Host no-show / property inaccessible:** Treated as Host failure — 100% guest refund

### STAYOS DECISION — Refund Timing

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1

Refunds processed within **5 business days** after refund approval. Host payout within **3 business days** of payment verification.

### CURRENT IMPLEMENTATION — Cancellation/Refund

Source: `src/app/bookings/`, `apps/web/components/bookings/CancelBookingButton.tsx`

- Cancellation flow implemented (guest + host + admin)
- Cancellation policy tiers displayed to guests (web i18n: `trust.cancellation.*`)
- Cancel booking modal (mobile + web)
- GAP: No backend code currently computes or enforces refund amounts automatically — manual for V1 alpha

---

## 12. Payments

### REFERENCE — Payment Infrastructure

Source: `01_PRODUCT_THESIS.md`, `02_COMPETITIVE_ADVANTAGE_AUDIT.md` #2

- Local payment rails (Paymob, Fawry, Vodafone Cash, Meeza, InstaPay) for Egypt
- 60%+ of Egyptians have no credit card — wallet payments are the real payment infrastructure
- Card-only excludes the majority of the market

### STAYOS DECISION — Payment Model

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 3, `epos/KNOWLEDGE_BASE.md` KB-016, KB-017

**Model A:** Guest pays StayOS-controlled account → StayOS pays Host. Not described as regulated "escrow" — StayOS holds funds briefly, manually, before forwarding.

Payment method for V1: Manual bank transfer or Vodafone Cash; reference number + proof upload; admin verification.

### STAYOS DECISION — Payment Processor

Source: `epos/AUTHORITY.md` DEC-004, `epos/PROJECT_STATE.md` Session 006

Paymob as primary payment processor (targeted for scale). V1 alpha uses manual payment. Stripe is NOT being activated. The dormant `finance`/`reservations` Stripe path is referenced as evidence only.

**Known conflict (superseded):** The original Paymob vs Stripe conflict (DEC-004 vs FLOWS.md/ENGINEERING_BACKLOG.md) is now superseded: V1 model decided (Model A, manual for alpha, Paymob-targeted for scale).

### STAYOS DECISION — Off-Platform Payment

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1

Off-platform payment is not supported for bookings made through StayOS. StayOS's payment verification and cancellation protections apply only to payments made through the Platform's instructed account.

### CURRENT IMPLEMENTATION — Payments

Source: `src/app/payments/`, `src/app/finance/`

- Manual payment flow: guest transfers to StayOS account → uploads proof → admin verifies
- Payment proof upload via S3
- Dormant `finance` module: escrow ledger, wallet, commission split, payout branches (inactive — `STRIPE_SECRET_KEY` empty)
- Commission calculation implemented in `finance/services.py`
- GAP: Real StayOS collection account needed (placeholder in `payments/services.py`)
- GAP: CBE PSP/PSO licensing question open (LEGAL COUNSEL REQUIRED)

---

## 13. Trips / Stay

### REFERENCE — Trip Management

Source: `PRODUCT_EXPERIENCE_DESIGN.md` sitemap

Guest zone includes: My Trips, Booking Detail, Wishlist, Messages, Reviews, Notifications, Wallet & Payments, Profile, Settings, Support Request.

### CURRENT IMPLEMENTATION — Trips/Stay

Source: `apps/mobile/src/screens/`

- Mobile: TripsScreen, TripDetailScreen with full booking details
- Web: bookings page with booking management
- Trip detail includes: booking status, dates, property info, host info, cancellation
- Check-in/check-out tracking in backend

---

## 14. Arrival / Check-in / Checkout

### REFERENCE — Check-in Instructions

Source: `TRUST_FRAMEWORK.md` § 3, `BUSINESS_RULES.md` BR-OPS-01

- Every property must provide a physical "StayOS Emergency Guide" in the room
- Pre-arrival information release: configurable hours before check-in
- Check-in instructions stored on listing (door code, etc.)

### STAYOS DECISION — Pre-Arrival Info Release

Source: repository code (`src/app/listings/models.py`)

`pre_arrival_info_release_hours` field on listing — controls when check-in instructions are released to the guest before arrival.

### CURRENT IMPLEMENTATION — Arrival/Check-in/Checkout

Source: `src/app/bookings/models.py`, `src/app/listings/models.py`

- Check-in/check-out time fields on listing
- Check-in instructions field (released based on `pre_arrival_info_release_hours`)
- Booking check-in/check-out tracking (`checked_in_at`, `checked_out_at`)
- Mobile trip detail with arrival information

---

## 15. Messaging

### REFERENCE — Messaging Approach

Source: `06_STOP_DOING_LIST.md` #10, `PRODUCT_STRATEGY_REVIEW.md` § 7.1

- Real-time messaging (SSE/WebSocket) deferred to Phase 2
- WhatsApp/phone is sufficient for alpha
- Guest messaging was identified as a product gap

### STAYOS DECISION — Messaging for V1

Source: `06_STOP_DOING_LIST.md` #10

WhatsApp/phone is the support channel for alpha. In-app real-time messaging is Phase 2.

### CURRENT IMPLEMENTATION — Messaging

Source: `src/app/messages/`, `apps/mobile/src/screens/MessageScreen.tsx`

- In-app messaging module implemented (`src/app/messages/`)
- Mobile message screen with conversation view
- Host messages screen on mobile
- GAP: This exceeds the "WhatsApp only" V1 decision — in-app messaging was built. This is not a conflict (building more than the minimum is acceptable), but the reference behavior for V1 alpha was WhatsApp/phone.

---

## 16. Notifications / Automation

### REFERENCE — Notification Channels

Source: `06_STOP_DOING_LIST.md` #11, #12, #34

- SMS is the notification channel for alpha
- In-app notification center deferred to V1.1
- Push notifications (FCM) deferred to Phase 2 (no mobile app at time of decision)
- Email notifications deferred to V1.1

### STAYOS DECISION — SMS via Twilio

Source: `PRODUCT_STRATEGY_REVIEW.md` § 2.2, `epos/PROJECT_STATE.md`

Phone OTP via Twilio Verify. Firebase JWT auth. SMS is the primary notification channel.

### CURRENT IMPLEMENTATION — Notifications

Source: `src/app/notifications/`

- Notification system with templates
- SMS channel via Twilio
- Notification consumers
- Booking event notifications (requested, accepted, confirmed, cancelled, etc.)
- GAP: OTP (Twilio) is not configured in production (as of Session 006 audit)

---

## 17. Reviews

### REFERENCE — Reviews as Trust Signal

Source: `02_COMPETITIVE_ADVANTAGE_AUDIT.md` #15, § 3

- Reviews and ratings are HIGH priority (missing at audit time)
- Trust signals drive conversion — no reviews = no social proof
- Guest has no reason to trust a listing without reviews
- Originally deferred to V1.1; manual review collection for alpha

### REFERENCE — Review Integrity

Source: `TRUST_FRAMEWORK.md` § 4

- Immutable reviews: reviews can only be submitted by verified guests who completed a stay
- System prevents "review bombing" or fraudulent endorsements

### CURRENT IMPLEMENTATION — Reviews

Source: `src/app/reviews/`, `apps/mobile/src/screens/`

- Guest review system implemented
- Web Airbnb-benchmark parity
- Mobile review UI
- Reviews linked to completed bookings (verified guests only)

---

## 18. Wishlists

### REFERENCE — Wishlist Priority

Source: `06_STOP_DOING_LIST.md` #17

Wishlist was classified as a "vanity feature" with "no impact on transactions" and deferred to V1.1 (if at all).

### CURRENT IMPLEMENTATION — Wishlists

Source: `src/app/favorites/`, `apps/mobile/src/screens/`

- Favorites/wishlist module implemented (models, router, schemas, services)
- Mobile + web parity
- GAP: This exceeds the V1 reference (which deferred wishlists). Not a conflict — building more than the minimum is acceptable.

---

## 19. Profiles

### REFERENCE — Profile Requirements

Source: `TRUST_FRAMEWORK.md` § 1, `BUSINESS_RULES.md` BR-ID-01

- Universal ID verification: every user must complete mandatory biometric identity verification
- No anonymous accounts — every profile is cross-referenced against government and social data
- No guest may access checkout, and no host may accept listings, until KYC status returns VERIFIED

### STAYOS DECISION — KYC for V1

Source: `06_STOP_DOING_LIST.md` #18, #40

- KYC OCR/biometric automation deferred to V1.1 — manual review is sufficient for 50 hosts
- Guest verification (ID upload for guests) deferred to V1.1 — phone OTP is sufficient for guests during alpha
- Host KYC: identity only + Host Agreement ownership/authorization declaration

### CURRENT IMPLEMENTATION — Profiles

Source: `src/app/auth/`, `src/app/host/`

- User model with role (GUEST, HOST, ADMIN), KYC status, display name, phone, email
- Phone OTP authentication
- Firebase JWT auth
- KYC document upload + manual admin review
- Host profile with co-host management

---

## 20. Support / Disputes

### REFERENCE — Support Model

Source: `06_STOP_DOING_LIST.md` #5, `PRODUCT_STRATEGY_REVIEW.md` § 7.1

- Support ticket system deferred — WhatsApp is the support channel for alpha
- A ticketing system for 15 hosts is over-engineering
- Arabic customer support (WhatsApp Business) is a differentiator

### REFERENCE — Dispute Resolution

Source: `TRUST_FRAMEWORK.md` § 5, `BUSINESS_RULES.md` BR-SUP-01

- Evidence-based decisions using time-stamped, geo-tagged photo/video evidence
- Resolution SLA: any dispute must be resolved by a human agent within 15 minutes of initial contact
- Safety hazard alerts or structural lockout events are automatically categorized as CRITICAL_SLA_BREACH
- Impartial mediation by dedicated "Trust & Safety" council

### STAYOS DECISION — Alpha Dispute Resolution

Source: `06_STOP_DOING_LIST.md` #32, `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 4

Founder mediates disputes during alpha. Host guarantee fund deferred to V1.1.

### CURRENT IMPLEMENTATION — Support/Disputes

- No support ticket system implemented (correctly deferred per reference)
- Admin can suspend listings/hosts
- Manual dispute resolution via founder/admin
- GAP: No formal support channel configured (P1 action item)

---

## 21. Permissions / Co-hosts

### REFERENCE — Co-host Model

Source: `02_COMPETITIVE_ADVANTAGE_AUDIT.md` (not explicitly covered in competitor research)

### STAYOS DECISION — Co-host Permission Scopes

Source: `src/app/host/constants.py`, `src/app/host/permissions.py`

Five permission scopes:
| Scope | Can Edit Listing | Can Manage Calendar | Can Publish/Archive | Can Manage Co-hosts |
|-------|-----------------|--------------------|--------------------|--------------------|
| owner | Yes | Yes | Yes | Yes |
| admin | Yes | Yes | Yes | Yes |
| full_access | Yes | Yes | No | No |
| calendar_messaging | No | Yes | No | No |
| calendar_only | No | Yes | No | No |

### CURRENT IMPLEMENTATION — Permissions/Co-hosts

Source: `src/app/host/`, `alembic/versions/027_create_host_operating_system.py`

- Co-host model with permission scopes
- Permission enforcement on all listing operations (update, publish, unpublish, archive, submit, calendar, photos)
- Co-host CRUD (invite, update, remove, toggle active)
- Mobile co-host management screen
- 11 backend tests for co-host permission enforcement

---

## 22. Admin / Operations

### REFERENCE — Admin Journey

Source: `PRODUCT_STRATEGY_REVIEW.md` § 3.3

There was no admin UI at audit time. Admin functions (KYC review, listing moderation, dispute resolution, payout approval) had to be performed via raw API calls. Acceptable for closed alpha with concierge team, not for public beta.

### REFERENCE — Operations / Field Staff

Source: `MVP_FREEZE.md` § 2, `FEATURE_CATALOG.md` FC-05, `06_STOP_DOING_LIST.md` #22

- Operations workforce app: priority task list, field operations step checklists, photo verification
- Deferred to V1.5 — relevant only after 50+ active units
- Turnover tickets: checkout triggers high-priority turnover ticket (BR-OPS-01)

### CURRENT IMPLEMENTATION — Admin/Operations

Source: `apps/web/app/[locale]/admin/`

- Admin pending page (KYC review)
- Admin listing moderation
- Discovery engine admin UI (OSM/Overpass, Google Places)
- GAP: No field operations / turnover ticket system (correctly deferred)

---

## 23. UX / UI Patterns

### REFERENCE — Design Principles

Source: `PRODUCT_EXPERIENCE_DESIGN.md` Design Principles

| # | Principle | What It Means |
|---|-----------|---------------|
| 1 | Trust First | Every touchpoint must reduce anxiety and increase confidence |
| 2 | Progressive Disclosure | Show the minimum required; reveal complexity on demand |
| 3 | Speed as Feature | Skeleton states everywhere. No blank screens. Ever. |
| 4 | Zero Ambiguity | Price, availability, and terms are always explicit and visible |
| 5 | Mobile Native | Design mobile first; enhance progressively for larger screens |
| 6 | Role Precision | Every role sees exactly what they need — nothing more |
| 7 | Recoverable Errors | Every error state offers a clear next action |

### REFERENCE — Price Transparency

Source: `02_COMPETITIVE_ADVANTAGE_AUDIT.md` § 3

Total price including fees must be shown before checkout. Hidden fees destroy trust. Airbnb learned this the hard way. Guest feels deceived at checkout → abandonment.

### REFERENCE — Mobile-First

Source: `PRODUCT_STRATEGY_REVIEW.md` § 3.4

MENA users are mobile-first. The product strategy assumed mobile is Phase 2/3, but the MVP should at least be a strong PWA or mobile-responsive web.

### STAYOS DECISION — Mobile Framework

Source: `.ai/DECISIONS/ADR-MOBILE-FRAMEWORK.md`

React Native with Expo for Mobile V1. Framework: React Native 0.74.5, Expo SDK ~51, React Navigation 6, TanStack Query + Axios, react-native-maps, AsyncStorage, custom i18n/RTL context.

### CURRENT IMPLEMENTATION — UX/UI

Source: `apps/mobile/`, `apps/web/`

- Web: Next.js with Tailwind, next-intl for i18n, Arabic RTL
- Mobile: React Native/Expo with custom theme system, i18n, RTL support
- Loading, empty, error states (States component on mobile)
- Design system: colors, typography, spacing, radius tokens
- Visual Design System documents (P1-P4) as reference

---

## 24. Business Rules

### REFERENCE — Core Business Rules

Source: `BUSINESS_RULES.md`

| Rule | Description |
|------|-------------|
| BR-ID-01 | No guest checkout, no host listings until KYC VERIFIED |
| BR-ID-02 | Host legal name must match payout routing name |
| BR-INV-01 | No overlapping confirmed reservations (atomic exclusion lock) |
| BR-INV-02 | Unit cannot be READY_FOR_OCCUPANCY until turnover ticket is CLOSED |
| BR-OPS-01 | Checkout immediately spawns turnover ticket (UNASSIGNED) |
| BR-OPS-02 | Cleaning tickets: 4-hour processing limit following checkout |
| BR-OPS-03 | No ticket → VERIFICATION_PENDING/CLOSED without required photos |
| BR-FIN-01 | Escrow time lock: funds barred from distribution until 24h post-check-in |
| BR-FIN-02 | Automatic tax interleaving per geofence boundaries |
| BR-FIN-03 | Payout execution halts on tax/routing profile errors |
| BR-SUP-01 | Safety hazard alerts = CRITICAL_SLA_BREACH priority |

### STAYOS DECISION — V1 Business Rules (Decided)

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`

The V1 Payment & Commission Policy is the canonical source of truth for commercial business rules. Terms of Service, Host Agreement, and Cancellation & Refund Policy are reconciled to match it exactly. If any document appears to say something different, the V1 Payment & Commission Policy controls.

### CURRENT IMPLEMENTATION — Business Rules

- BR-ID-01: Implemented (KYC gate)
- BR-INV-01: Implemented (PostgreSQL exclusion constraints)
- BR-FIN-01: Partially implemented (dormant finance module; manual for alpha)
- BR-OPS-01/02/03: Not implemented (correctly deferred to V1.5)
- BR-FIN-02: Not implemented (deferred)
- BR-FIN-03: Not implemented (deferred)

---

## 25. States / Edge Cases

### REFERENCE — Failure Conditions

Source: `01_PRODUCT_THESIS.md` "Definition of Failure"

MVP v1 has failed if ANY of the following are true:
1. Fewer than 20 live listings after 6 weeks — supply pipe is broken
2. Fewer than 3 completed bookings after 6 weeks — transaction loop is broken
3. Payment cannot be collected in EGP — commercial model is broken
4. Guests cannot identify why StayOS is different from Airbnb — vision is not proven
5. Founder cannot operate without engineering support — product is incomplete
6. Fraud or trust incident occurs and cannot be resolved — trust model is broken

### REFERENCE — MVP Success Criteria

Source: `01_PRODUCT_THESIS.md` "Definition of MVP Success"

1. 40+ live, verified listings in New Cairo
2. 7+ completed bookings with payment collected in EGP
3. Payouts processed to 5+ verified hosts
4. 0 fraud incidents
5. Guest NPS >= 50
6. >= 70% of surveyed guests cite at least one StayOS differentiator
7. Founder can recruit, approve, publish, book, collect payment, and pay hosts without engineering support

### STAYOS DECISION — Edge Cases (V1)

Source: `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1

- Duplicate payment: admin identifies via matching reference numbers, refunds extra within standard timing
- Failed/rejected payment proof: 3 attempts within 48 hours of first rejection, then cancellation
- No-show (guest): no refund, declared by host, confirmed by admin
- No-show (host): 100% guest refund (treated as host failure)

---

## 26. Domain Relationships

### REFERENCE — Core Domain Map

Source: `FEATURE_CATALOG.md`, `PRODUCT_EXPERIENCE_DESIGN.md` sitemap

```
User (Guest/Host/Admin)
  ├── Auth (OTP, JWT, KYC)
  ├── Listings (Unit + UnitListing + Photos + Calendar)
  │     ├── Co-hosts (Permissions)
  │     └── Readiness Checks
  ├── Bookings (Request → Accept → Pay → Confirm → Check-in → Check-out)
  │     ├── Payments (Proof → Verify → Commission → Payout)
  │     └── Cancellations (Tiers → Refund)
  ├── Messages (Guest ↔ Host)
  ├── Reviews (Post-stay, verified guests only)
  ├── Favorites/Wishlists
  └── Notifications (SMS)
```

### REFERENCE — Feature Build Order

Source: `docs/02_product/FEATURE_DEPENDENCY_MAP.md` (referenced in SSOT)

Feature dependencies follow: Auth → KYC → Listings → Calendar → Search → Booking → Payment → Notifications → Reviews → Operations.

### CURRENT IMPLEMENTATION — Domain Map

Source: `src/app/`

Implemented domains: auth, listings, host (operating system), bookings, payments, finance (dormant), reservations (dormant), notifications, reviews, favorites, messages, discovery, kyc.

---

## 27. Conflicts and Discrepancies

### Known Conflicts (Do Not Resolve)

| # | Conflict | Documents | Status |
|---|----------|-----------|--------|
| 1 | Payment processor (original) | DEC-004 (Paymob) vs FLOWS.md/ENGINEERING_BACKLOG.md (Stripe) | **SUPERSEDED** — V1 model decided (Model A, manual, Paymob-targeted). Stripe not activated. |
| 2 | Frontend framework (original) | MASTER_CONTEXT.md "React or Next.js" | **RESOLVED** — Next.js implemented (web), React Native (mobile) |
| 3 | Backend language (original) | MASTER_CONTEXT.md "Node.js or Python" | **RESOLVED** — Python/FastAPI implemented |
| 4 | Mobile framework (original) | ADR-016 Flutter vs React Native | **RESOLVED** — React Native/Expo (ADR-MOBILE-FRAMEWORK) |

### Discrepancies Between Reference and Implementation (Not Conflicts)

| # | Reference | Implementation | Classification |
|---|-----------|----------------|----------------|
| 1 | WhatsApp-only messaging for V1 | In-app messaging module built | Exceeds reference — not a conflict |
| 2 | Wishlists deferred to V1.1 | Favorites/wishlist implemented | Exceeds reference — not a conflict |
| 3 | Reviews deferred to V1.1 | Reviews implemented | Exceeds reference — not a conflict |
| 4 | No refund calculation in backend | Manual for alpha | GAP — correctly scoped, P1 engineering action |
| 5 | Real collection account needed | Placeholder in payments/services.py | GAP — P0 founder action (B1) |

---

## 28. Founder Decisions Requiring Action

The following items from `FOUNDER_ACTION_AND_DECISION_PACK_2026-08-26.md` remain open and require Founder action. They are **not** resolved by this benchmark.

| # | Item | Urgency |
|---|------|---------|
| A1 | Legal entity name, type, registration number, tax card, registered address | P0 |
| A3 | Platform role characterization (marketplace intermediary) | P0 |
| A6 | Suspension/appeal process definition | P1 |
| A7 | Account deletion / data-export process | P1 |
| A8 | Data retention periods | P1 |
| A9 | Fraud escalation/reporting process | P1 |
| A10 | Notice mechanism for Terms/Privacy changes | P1 |
| B1 | Provide real StayOS collection account | P0 |
| B2 | Provide legal entity / registration details | P0 |
| B3 | Confirm first 1-10 listings and owners | P0 |
| B4 | Recruit first real guest(s) for transaction #1 | P0 |

---

## 29. Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-09-02 | Initial creation. Consolidated approved findings from existing competitor research and product strategy documents. No new competitor research performed. |

**Update rule:** This document is updated only when:
1. A new Founder Decision changes a STAYOS DECISION entry, or
2. The CURRENT IMPLEMENTATION status of a domain changes materially, or
3. A future Founder explicitly authorizes a new research phase (which would add new REFERENCE entries).

**Update prohibition:** This document must NEVER be updated with new competitor research unless a Founder explicitly authorizes a new research phase.

---

## 30. Agent Execution Rule

Every future coding agent operating on StayOS must follow this execution order:

```
FOUNDER DECISIONS
        +
    PRD
        +
REFERENCE PRODUCT BENCHMARK (this document)
        +
CURRENT REPOSITORY
        ↓
IMPLEMENTATION
```

**Agents must NOT:**
- Use new competitor research to fill gaps unless a future Founder explicitly authorizes a new research phase
- Browse competitor websites, APIs, or repositories
- Supplement the benchmark with general knowledge about competitors
- Treat a difference between the benchmark and the repository as automatically a bug — it may be an intentional Founder Decision

**Agents MUST:**
- Read this document before starting any major implementation domain
- Check `epos/AUTHORITY.md` for decision authority
- Check `docs/02_product/` for PRD requirements
- Check `docs/governance/REPOSITORY_INFORMATION_ARCHITECTURE.md` for file placement
- Report (not resolve) any contradictions between the benchmark and Founder Decisions or PRD

---

**End of Official Reference Product Benchmark.**
