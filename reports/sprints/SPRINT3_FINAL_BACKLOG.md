# SPRINT 3 FINAL BACKLOG — StayOS

**Prepared by:** Executive Product Director, CTO, Operations Director, Investment Committee  
**Date:** 2026-08-03  
**Purpose:** Official implementation backlog for Sprint 3. This is the only backlog allowed after the Commercial Readiness Review.

---

## 1. Backlog Rules

1. **P0 items are non-negotiable.** If they slip, the Closed Alpha is delayed.
2. **P1 items are built only after P0 items are accepted.**
3. **P2/P3 items are postponed unless they unblock P0/P1.**
4. **No new items can be added without written approval from the Product Director and Founder.**
5. **Effort is estimated in story points (SP),** consistent with `MVP_SLICE.md`.

---

## 2. Sprint 3 Goal

**Enable hosts to create and publish verified listings, enable operations to manually seed and claim inventory, and prepare a Closed Alpha with 50–100 listings.**

---

## 3. Epic 1 — Supply Enablement (P0)

### Business Value

Without supply, there is no marketplace. This epic unblocks the host onboarding, listing creation, and admin seeding workflows.

### User Stories

| ID | Story | Priority | Effort (SP) | Dependencies | Business Value | Acceptance Criteria |
|----|-------|----------|-------------|--------------|----------------|---------------------|
| S3-001 | As a host, I can sign up with phone OTP and select my role (guest/host) so that I can begin onboarding. | P0 | 3 | Twilio Verify, user model | Critical — first step of supply funnel | Phone OTP works; role stored; Arabic RTL supported. |
| S3-002 | As a host, I can upload my ID and selfie for KYC so that my identity can be verified. | P0 | 3 | S3-001, S3 KYC bucket, pre-signed S3 | Critical — trust and compliance | Upload succeeds; images stored in S3; metadata saved. |
| S3-003 | As a host, I can create a listing with location, title, description, amenities, and max guests so that I can publish my property. | P0 | 5 | Unit model, PostGIS, listing form | Critical — core supply pipe | Form creates unit and unit_listing; data validated. |
| S3-004 | As a host, I can upload listing photos so that guests can see my property. | P0 | 5 | S3 listings bucket, photo endpoint, `pms.unit_photos` migration | Critical — launch blocker per `SPRINT3_RECOMMENDATIONS.md` | 5+ photos uploaded; displayed on listing; primary photo set. |
| S3-005 | As a host, I can set base price, weekend multiplier, and minimum stay so that my listing is bookable. | P0 | 3 | Pricing endpoint, calendar model | Critical — booking conversion | Price saved; calendar rules respect min stay. |
| S3-006 | As a host, I can set availability and block dates so that guests see accurate calendar. | P0 | 3 | Calendar model, availability endpoint | Critical — prevents invalid bookings | Dates blocked/unblocked; availability filter works. |
| S3-007 | As a host, I can submit my listing for review so that it can be published. | P0 | 2 | Listing state machine | Critical — quality gate | Listing moves to `PENDING_VERIFICATION`. |
| S3-008 | As a host, I receive WhatsApp notifications for KYC and listing status so that I stay informed. | P0 | 3 | WhatsApp Business API, notification service | Critical — host engagement | Messages sent on state change. |

**Epic 1 total: 27 SP**

---

## 4. Epic 2 — Admin Operations Dashboard (P0)

### Business Value

Operations cannot run the Closed Alpha without an internal dashboard for KYC, listing verification, import, and claim.

### User Stories

| ID | Story | Priority | Effort (SP) | Dependencies | Business Value | Acceptance Criteria |
|----|-------|----------|-------------|--------------|----------------|---------------------|
| S3-009 | As a KYC Reviewer, I can view pending KYC submissions and approve/reject with a reason so that hosts are verified. | P0 | 3 | S3-002, admin auth | Critical — manual KYC is MVP | Approve/reject updates host status; reason logged. |
| S3-010 | As a Listing Verifier, I can view pending listings and approve/reject so that only quality listings go live. | P0 | 3 | S3-007, listing state machine | Critical — quality gate | Approve sets `LISTED`; reject with reason. |
| S3-011 | As an Operations Specialist, I can bulk upload a CSV of properties so that institutional supply can be imported. | P0 | 5 | CSV parser, unit/photo creation | Critical — seeding inventory | 20+ listings created from CSV; errors reported. |
| S3-012 | As an Operations Specialist, I can create an unclaimed listing and invite an owner to claim it so that supply can be seeded before self-registration. | P0 | 5 | Admin unit creation, claim workflow | Critical — flips supply funnel | Unclaimed listing created; claim link generated. |
| S3-013 | As a Trust & Safety Lead, I can review ownership claims and approve/reject/transfer ownership so that listings have correct owners. | P0 | 5 | S3-012, KYC, ownership docs | Critical — prevents fraud | Claim approved → ownership transferred; rejected → reason logged. |
| S3-014 | As an admin, I can view and resolve duplicate listing alerts so that the catalog is clean. | P0 | 3 | Duplicate detection service | Critical — trust and search quality | Duplicates flagged; merge/reject action works. |
| S3-015 | As a Support Lead, I can triage support tickets and assign them to agents so that SLAs are met. | P0 | 3 | Support ticket model | Critical — daily operations | Tickets by priority; assign/escalate/close. |

**Epic 2 total: 27 SP**

---

## 5. Epic 3 — Search, Discovery, and Booking (P1)

### Business Value

Once supply exists, guests must find, evaluate, and book listings. This epic improves conversion and closes the booking loop.

### User Stories

| ID | Story | Priority | Effort (SP) | Dependencies | Business Value | Acceptance Criteria |
|----|-------|----------|-------------|--------------|----------------|---------------------|
| S3-016 | As a guest, I can search by map viewport so that I can discover properties visually. | P1 | 5 | PostGIS, map library | Important — MENA conversion booster | Map pins render; viewport query works. |
| S3-017 | As a guest, I can see availability on search cards so that I know a listing is bookable. | P1 | 3 | Calendar availability | Important — liquidity signal | Unavailable listings de-emphasized. |
| S3-018 | As a guest, I can complete payment checkout via Paymob iframe or Stripe redirect so that my booking is confirmed. | P1 | 5 | Payment gateways, booking service | Important — closes loop | Payment processed; booking confirmed; ledger updated. |
| S3-019 | As a host, I can view a dashboard with my listings, bookings, and calendar so that I can manage supply. | P1 | 5 | Host dashboard, reservation model | Important — host retention | Dashboard lists host's units and bookings. |
| S3-020 | As a host, I can edit pricing and availability from my dashboard so that I can optimize occupancy. | P1 | 3 | Calendar/pricing endpoints | Important — host retention | Changes saved and reflected in search. |
| S3-021 | As a guest, I can view verified badges and host info on listing detail so that I trust the listing. | P1 | 2 | Listing detail, KYC status | Important — conversion | Verified badge shown; host name/phone visible. |

**Epic 3 total: 23 SP**

---

## 6. Epic 4 — Trust, Safety, and Quality (P1)

### Business Value

Trust is the currency of the marketplace. This epic ensures verification, fraud detection, and quality control.

### User Stories

| ID | Story | Priority | Effort (SP) | Dependencies | Business Value | Acceptance Criteria |
|----|-------|----------|-------------|--------------|----------------|---------------------|
| S3-022 | As a Trust & Safety Lead, I can suspend a host or listing and document the reason so that bad actors are removed. | P1 | 3 | Account state, admin role | Important — fraud containment | Suspension hides listings; reason logged. |
| S3-023 | As a Listing Verifier, I can flag photos for reverse-image search review so that photo fraud is caught. | P1 | 3 | Photo review, image hash | Important — trust | Flagged photos held for review. |
| S3-024 | As a host, I can set my cancellation policy so that guests know the terms before booking. | P1 | 2 | Cancellation model | Important — trust, legal | Policy displayed at booking. |
| S3-025 | As an admin, I can view a listing quality score before approval so that substandard listings do not go live. | P1 | 3 | Quality score algorithm | Important — quality gate | Score computed from photos, price, calendar, docs. |

**Epic 4 total: 11 SP**

---

## 7. Epic 5 — Demand and Guest Experience (P2)

### Business Value

Demand-side features that improve conversion but are not launch blockers.

### User Stories

| ID | Story | Priority | Effort (SP) | Dependencies | Business Value | Acceptance Criteria |
|----|-------|----------|-------------|--------------|----------------|---------------------|
| S3-026 | As a guest, I can create a wishlist of favorite listings so that I can compare later. | P2 | 3 | Favorites model | Optional — retention | Add/remove favorites; persist. |
| S3-027 | As a guest, I can leave a review after checkout so that trust artifacts are created. | P2 | 3 | Review model, post-stay flow | Optional — trust signal | Review form after checkout; admin moderation. |
| S3-028 | As a guest, I can sign up with Google or Apple so that friction is reduced. | P2 | 3 | Firebase OAuth | Optional — conversion | OAuth sign-in works; account linked. |
| S3-029 | As a founder, I can view a founder executive dashboard with key metrics so that I can operate the marketplace in 5 minutes. | P2 | 5 | Analytics data, dashboard UI | Optional — management | Dashboard shows 5-minute view. |

**Epic 5 total: 14 SP**

---

## 8. Epic 6 — Infrastructure and Platform (P0 Enablers)

### Business Value

These are the technical enablers that support P0 features.

### User Stories

| ID | Story | Priority | Effort (SP) | Dependencies | Business Value | Acceptance Criteria |
|----|-------|----------|-------------|--------------|----------------|---------------------|
| S3-030 | As an engineer, I can create the `pms.unit_photos` migration and S3 integration so that photo upload is possible. | P0 | 2 | S3 listings bucket, Alembic | Critical — hard blocker | Migration runs; table and S3 path work. |
| S3-031 | As an engineer, I can create pre-signed S3 upload URLs for KYC and listing photos so that direct upload is secure. | P0 | 2 | S3, IAM roles | Critical — security and scale | URLs generated; uploads succeed. |
| S3-032 | As an engineer, I can ensure the listing state machine supports `DRAFT`, `PENDING_VERIFICATION`, `LISTED`, `SUSPENDED`, `ARCHIVED`. | P0 | 2 | Unit listing model | Critical — moderation | State transitions enforced. |
| S3-033 | As an engineer, I can configure AWS S3 for listing photos and KYC documents with correct IAM and CORS. | P0 | 2 | AWS account | Critical — storage | Buckets accessible from web; CORS configured. |

**Epic 6 total: 8 SP**

---

## 9. Backlog Summary

| Epic | Priority | Total SP | Focus |
|------|----------|----------|-------|
| Epic 1: Supply Enablement | P0 | 27 | Host onboarding, listing creation, photos, pricing, calendar |
| Epic 2: Admin Operations Dashboard | P0 | 27 | KYC, listing verification, import, claim, duplicates, support |
| Epic 3: Search, Discovery, and Booking | P1 | 23 | Map, availability, payment, host dashboard, trust badges |
| Epic 4: Trust, Safety, and Quality | P1 | 11 | Suspensions, photo review, cancellation, quality score |
| Epic 5: Demand and Guest Experience | P2 | 14 | Wishlist, reviews, OAuth, founder dashboard |
| Epic 6: Infrastructure and Platform | P0 | 8 | Photos, S3, state machine |

**Total backlog: 110 SP**

---

## 10. Prioritization Matrix

| Story | P0 Blocker | P1 Important | P2 Optional | Postpone |
|-------|------------|--------------|-------------|----------|
| S3-001 Host phone OTP/role | X | | | |
| S3-002 Host KYC upload | X | | | |
| S3-003 Listing creation form | X | | | |
| S3-004 Listing photo upload | X | | | |
| S3-005 Base pricing | X | | | |
| S3-006 Calendar availability | X | | | |
| S3-007 Listing submit for review | X | | | |
| S3-008 Host WhatsApp notifications | X | | | |
| S3-009 Admin KYC review queue | X | | | |
| S3-010 Admin listing verification | X | | | |
| S3-011 Bulk CSV import | X | | | |
| S3-012 Admin unclaimed listing | X | | | |
| S3-013 Claim review/transfer | X | | | |
| S3-014 Duplicate detection | X | | | |
| S3-015 Support ticket queue | X | | | |
| S3-030 `unit_photos` migration | X | | | |
| S3-031 Pre-signed S3 URLs | X | | | |
| S3-032 Listing state machine | X | | | |
| S3-033 S3/KYC bucket config | X | | | |
| S3-016 Map search | | X | | |
| S3-017 Search availability overlay | | X | | |
| S3-018 Payment checkout | | X | | |
| S3-019 Host dashboard | | X | | |
| S3-020 Host pricing/calendar | | X | | |
| S3-021 Verified badges | | X | | |
| S3-022 Account/listing suspension | | X | | |
| S3-023 Photo fraud flag | | X | | |
| S3-024 Cancellation policy | | X | | |
| S3-025 Listing quality score | | X | | |
| S3-026 Wishlist | | | X | |
| S3-027 Reviews | | | X | |
| S3-028 Google/Apple OAuth | | | X | |
| S3-029 Founder dashboard | | | X | |

---

## 11. Sprint 3 Execution Plan

### Week 1–2: Supply Pipe

**Focus:** Epic 1 + Epic 6.

- S3-030, S3-031, S3-032, S3-033 (infrastructure)
- S3-001, S3-002, S3-003, S3-004, S3-005, S3-006, S3-007, S3-008 (host supply)

### Week 3–4: Admin Dashboard

**Focus:** Epic 2.

- S3-009, S3-010, S3-011, S3-012, S3-013, S3-014, S3-015 (operations)

### Week 5–6 (if capacity allows): Conversion and Booking

**Focus:** Epic 3 + Epic 4 (P1 items).

- S3-016, S3-017, S3-018, S3-019, S3-020, S3-021
- S3-022, S3-023, S3-024, S3-025

### Week 7+ (reserved): Demand and Guest Experience

**Focus:** Epic 5.

- S3-026, S3-027, S3-028, S3-029

---

## 12. Dependencies and Risks

### 12.1 External Dependencies

| Dependency | Owner | Status | Risk |
|------------|-------|--------|------|
| Paymob integration/iframe IDs | Founder | Unresolved | HIGH — blocks S3-018 |
| Stripe scope confirmation | Founder | Unresolved | MEDIUM — blocks GCC/international |
| WhatsApp Business API approval | Operations | Unresolved | HIGH — blocks S3-008 |
| AWS S3 buckets for listings/KYC | Engineering | Unresolved | HIGH — blocks S3-004, S3-002 |
| Operations team hiring | Founder/COO | Not started | HIGH — blocks Closed Alpha |

### 12.2 Internal Dependencies

| Dependency | Blocks |
|------------|--------|
| S3-030 `unit_photos` migration | S3-004 photo upload |
| S3-001 host signup | S3-002 KYC, S3-003 listing creation |
| S3-002 KYC upload | S3-009 admin KYC review |
| S3-003 listing creation | S3-007 submit for review, S3-010 listing verification |
| S3-012 unclaimed listing | S3-013 claim review |
| S3-018 payment checkout | S3-019 host dashboard, S3-020 pricing |

---

## 13. Definition of Done

A Sprint 3 story is done when:

1. Code is written, tested, and reviewed.
2. Acceptance criteria are met.
3. Backend tests pass (326+).
4. Frontend lint and type-check pass.
5. Manual QA by Product/Operations is passed.
6. Documentation is updated if user-facing.
7. Deployed to staging.

---

## 14. Freeze Conditions

No new stories can be added to Sprint 3 unless:

1. A P0 item is discovered to be incomplete or wrong.
2. A critical external dependency changes.
3. The Founder and Product Director both approve in writing.

---

## 15. Post-Sprint 3 Criteria

Sprint 3 is successful when:

1. A host can sign up, complete KYC, create a listing with photos, set pricing/calendar, and submit for review.
2. An admin can review KYC, verify listings, bulk import, create/claim listings, and detect duplicates.
3. Staging has at least 50 draft or live listings created by ops.
4. Search page displays results with availability signal.
5. Payment checkout is wired (Paymob/Stripe or manual fallback).
6. Operations team can use the dashboard without engineering help.
