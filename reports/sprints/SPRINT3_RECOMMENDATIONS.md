# SPRINT 3 RECOMMENDATIONS — StayOS

**Prepared by:** Executive Product & Engineering Review Board  
**Review date:** 2026-07-30  
**Purpose:** Determine whether the current roadmap is correct and define what Sprint 3 should actually do.

---

## 1. Is the Current Roadmap Correct?

### 1.1 Current Plan

The repository and `docs/ENGINEERING_MASTER_PLAN.md` plan Sprint 3 as:

- **Finance + Webhooks**
- **Admin (incident console)**
- **Payments + Notifications + Launch**

The `MASTER_DELIVERY_BACKLOG.md` (line 1950) describes Sprint 3 as:

> *"Sprint 3 — Booking Flow Web + Mobile, Host Listings (Weeks 7–8)"*

This is internally inconsistent and commercially misaligned. Both versions over-index on booking/payment completion and under-index on **supply creation**.

### 1.2 Board Assessment

**The current roadmap is NOT correct for a pre-launch marketplace.**

A two-sided marketplace cannot launch without inventory. The current plan assumes supply will appear magically while the team finishes payments and notifications. That is a dangerous assumption. Engineering has already built a strong backend; the missing piece is the **host-facing supply pipe**, not another payment refinement.

**Verdict:** Re-scope Sprint 3 before it begins.

---

## 2. What Is Missing?

### 2.1 Hard Blockers

| Missing Item | Why It Blocks Sprint 3 |
|--------------|------------------------|
| `pms.unit_photos` migration | Listings cannot have photos; guests will not book. |
| Photo upload endpoint | Hosts cannot create real listings. |
| Host onboarding wizard | No supply acquisition UI. |
| Listing creation form | Hosts cannot publish. |
| Admin claim/import console | No manual seeding of inventory. |
| Admin KYC review UI | Hosts cannot be approved at scale. |

### 2.2 Product Gaps

| Missing Item | Why It Blocks Launch |
|--------------|----------------------|
| Map on search page | Expected UX for property discovery in MENA. |
| Payment checkout (Paymob iframe / Stripe) | Booking panel only creates a request; no money changes hands. |
| Host dashboard with calendar/pricing | Hosts cannot manage supply. |
| Reviews | Trust signals missing. |
| Cancellation/refund policy UX | Legal and guest trust requirement. |

### 2.3 Commercial Gaps

| Missing Item | Why It Blocks Sprint 3 |
|--------------|------------------------|
| Paymob integration/iframe IDs | Payment code cannot be wired. |
| Stripe scope decision | GCC payment strategy undefined. |
| WhatsApp template approvals | Notifications cannot be sent. |
| Host acquisition playbook | No documented way to get listings. |
| Phase 0 customer validation | Engineering is ahead of validated demand. |

---

## 3. What Should Be Postponed?

| Item | Current Sprint/Phase | Board Recommendation | Reason |
|------|----------------------|----------------------|--------|
| Native iOS/Android app | Sprint 3 / Phase 2 | Postpone to Phase 2+ | Web PWA is sufficient for first 500 bookings. |
| Mobile offline UI | Month 3 | Postpone | Not needed for web alpha. |
| AI-powered pricing/matching | Phase 3 | Postpone | No data yet. |
| Automated KYC OCR/biometric | V1.1 | Postpone | Manual review is fine for first 100 hosts. |
| Field operations / turnover tickets | V1.5 | Postpone | Relevant after 50+ active units. |
| Channel manager sync | Never | Keep out of scope | Confirmed strategy; do not revisit. |
| Real-time messaging (SSE/WebSocket) | S6 | Defer | Email/WhatsApp works for alpha. |
| Reviews | V1.1 | Keep V1.1 | Add minimum review collection at 10-booking milestone. |
| Advanced admin incident console | S3/S6 | Simplify | Build only KYC/listing moderation in Sprint 3. |

---

## 4. What Should Become a Higher Priority?

| Item | New Priority | Reason |
|------|--------------|--------|
| **Listing photo upload** | P0, Sprint 3 | Hard supply blocker. |
| **Host onboarding wizard** | P0, Sprint 3 | Without it, no new listings. |
| **Admin listing claim/import console** | P0, Sprint 3 | Seed inventory manually. |
| **Manual KYC review UI** | P0, Sprint 3 | Unblock first hosts. |
| **Listing creation form** | P0, Sprint 3 | Core self-serve supply pipe. |
| **Map-based search** | P1, Sprint 3 | Conversion and differentiator. |
| **Payment checkout completion** | P1, Sprint 3 | Close booking loop after supply exists. |
| **Host calendar/pricing dashboard** | P1, Sprint 3 | Host retention. |
| **Trust signals (verified badges, host card)** | P1, Sprint 3 | Guest conversion. |
| **Concierge booking flow** | P2, Sprint 3 | Allow manual transactions before full automation. |

---

## 5. Recommended Sprint 3 Scope

### 5.1 Theme

**Sprint 3: Supply Enablement & Closed Alpha Preparation**

### 5.2 Sprint 3 Objectives

1. Enable hosts to create and publish listings with photos.
2. Enable the operations team to manually seed and claim inventory.
3. Enable admins to review KYC and listings at scale.
4. Stabilize the search/discovery experience with map and availability signals.
5. Close the payment checkout loop only if supply is on track.

### 5.3 Sprint 3 Backlog (Proposed)

#### P0 — Must Have

| ID | Task | Owner | Est. |
|----|------|-------|------|
| S3-01 | Add Alembic migration for `pms.unit_photos` | Backend | 1d |
| S3-02 | `POST /listings/{id}/photos` presigned S3 upload endpoint | Backend | 2d |
| S3-03 | `DELETE /listings/{id}/photos/{photo_id}` endpoint | Backend | 1d |
| S3-04 | Host onboarding wizard (role selection, KYC intro) | Frontend | 2d |
| S3-05 | Listing creation multi-step form (location, details, pricing, photos, calendar, publish) | Frontend | 5d |
| S3-06 | KYC document upload flow (web) | Frontend | 2d |
| S3-07 | Admin KYC review queue + approve/reject | Frontend + Backend | 2d |
| S3-08 | Admin listing-claim queue (create claim, approve/reject, transfer ownership) | Frontend + Backend | 2d |
| S3-09 | Admin bulk CSV import for listings | Backend + Frontend | 2d |
| S3-10 | Duplicate detection service (coordinate + phone + title) | Backend | 2d |

#### P1 — Should Have

| ID | Task | Owner | Est. |
|----|------|-------|------|
| S3-11 | Map integration on search page (Google Maps, Arabic locale, listing pins) | Frontend | 3d |
| S3-12 | Search card availability overlay (available/unavailable for selected dates) | Frontend | 2d |
| S3-13 | Host calendar/pricing dashboard | Frontend | 3d |
| S3-14 | Payment checkout flow (Paymob iframe / Stripe redirect) | Frontend | 4d |
| S3-15 | Reservation confirmation page | Frontend | 1d |
| S3-16 | Host landing page (value prop, sign-up CTA, fee calculator) | Frontend | 2d |
| S3-17 | Listing quality score + search ranking boost | Backend | 2d |

#### P2 — Could Have

| ID | Task | Owner | Est. |
|----|------|-------|------|
| S3-18 | WhatsApp host onboarding templates | Backend/Notifications | 1d |
| S3-19 | Referral tracking (host invites host) | Backend | 2d |
| S3-20 | Reviews model + post-checkout review request | Backend | 2d |

### 5.4 Sprint 3 Exit Criteria

The sprint is successful only if:

1. A host can sign up, complete KYC, create a listing with photos, set pricing/calendar, and publish.
2. An admin can bulk import, claim, review, and approve listings.
3. At least 50 draft listings can be created in staging by ops.
4. The search page displays map pins and availability for date ranges.
5. The booking panel can initiate a reservation and redirect to Paymob/Stripe checkout.

---

## 6. Sprint 3 Trade-offs

### 6.1 We Are Choosing Supply Over Payment Polish

The team may want to finish payment webhooks and admin console first. The board rejects this. Payment is useless without listings. The admin console is useful only if it can moderate listings. The bottleneck is **supply creation**, not transaction processing.

### 6.2 We Are Deferring Mobile

Mobile is strategically important, but building a native app before 100 bookings is wasteful. The web app must be mobile-responsive and PWA-ready. Native apps come after product-market fit.

### 6.3 We Are Accepting Manual Processes

Manual KYC review, manual listing approval, and concierge onboarding are acceptable for the first 100–500 listings. Automation is a scale problem, not a launch problem.

---

## 7. Dependencies That Must Close Before Sprint 3

| Dependency | Owner | Deadline |
|------------|-------|----------|
| Paymob sandbox account + integration/iframe IDs | Founder | Day 1 of Sprint 3 |
| Stripe scope decision (GCC cards only?) | Founder | Day 3 of Sprint 3 |
| WhatsApp Business API account + template approvals | Founder/PM | Week 1 of Sprint 3 |
| Legal entity + bank account for payouts | Founder | Before first real transaction |
| Host acquisition target (50 listings) | Operations | Week 2 of Sprint 3 |
| AWS region decision (ADR-007) | Founder/Architect | Day 1 of Sprint 3 |

---

## 8. What Should Sprint 4 Look Like?

If Sprint 3 succeeds, Sprint 4 should be:

**Sprint 4: Closed Alpha Launch**

- Onboard 50–100 listings in Cairo/Alexandria.
- Run concierge-led bookings with first 50 guests.
- Collect 10 manual transactions.
- Gather host and guest feedback.
- Fix conversion blockers.
- Begin WhatsApp template approvals and Paymob live integration.

---

## 9. What Should NOT Happen in Sprint 3

- Do NOT build native mobile apps.
- Do NOT build real-time messaging.
- Do NOT build advanced AI pricing.
- Do NOT build a full admin CRM.
- Do NOT build channel manager integrations.
- Do NOT launch a public marketing campaign.
- Do NOT accept payments for non-existent listings.

---

## 10. Final Recommendation

**The board overrides the current Sprint 3 plan.** Sprint 3 must be redefined as a supply-acquisition sprint. The engineering team has done excellent foundational work. The next step is not to polish payments; it is to create the host and inventory tools that turn that foundation into a marketplace.

**Approve the following motion:**

> Sprint 3 is re-scoped to "Supply Enablement & Closed Alpha Preparation." The sprint will deliver host onboarding, listing creation with photo upload, admin claim/import, KYC review UI, map-based search, and payment checkout. Sprint 4 will be a closed alpha with 50–100 live listings and 10 manual transactions.

This is the highest-probability path to a successful marketplace launch.
