# MVP SCOPE FREEZE — StayOS

**Prepared by:** Executive Product Director, Marketplace Founder, COO, CTO, Investment Committee  
**Date:** 2026-08-03  
**Purpose:** Definitive statement of what StayOS will build, will not build, and what is on the future roadmap. This document supersedes all informal scope discussions for the Closed Alpha and Stage 1.

---

## 1. Scope Freeze Authority

This document is the official MVP scope freeze. It is based on:

- `MVP_SLICE.md` — budget, version legend, and category priorities
- `SPRINT3_RECOMMENDATIONS.md` — re-scoped Sprint 3
- `knowledge/marketplace/marketplace_lifecycle.md` — Stage 1 rules
- `knowledge/founder/scaling_playbook.md` — scaling gates
- `COMMERCIAL_READINESS_REVIEW.md` — final commercial validation

No new feature may be added to the MVP without written approval from the Product Director and Founder.

---

## 2. MVP Definition

The StayOS MVP is the **minimum set of features required to complete one real booking, collect payment in EGP, and transfer money to a verified Egyptian host.**

MVP v1 target: 10 live bookings.  
Budget: $150,000.  
No V1.1 feature is built until the first 10-booking milestone is achieved.

---

## 3. WILL BUILD

### 3.1 Trust & Safety + Host Onboarding

| Feature | Version | Why |
|---------|---------|-----|
| Phone OTP authentication | MVP v1 | Egypt's primary auth method |
| User model with GUEST/HOST/ADMIN roles | MVP v1 | Foundation for all personas |
| KYC document upload | MVP v1 | Prevents fake listings |
| Manual KYC admin review | MVP v1 | No automation needed for first 50 hosts |
| Next.js host signup and KYC upload (Arabic RTL) | MVP v1 | Host onboarding UI |

### 3.2 Property Management

| Feature | Version | Why |
|---------|---------|-----|
| Unit + unit_listings + calendar migrations | MVP v1 | Foundation for property data |
| PostGIS spatial search | MVP v1 | Discovery and map UX |
| Unit CRUD endpoints | MVP v1 | Hosts manage supply |
| Photo upload endpoint | MVP v1 | Listings need photos |
| Basic calendar: block/unblock | MVP v1 | Accurate availability |
| Base pricing endpoint | MVP v1 | Hosts set rates |
| Unit status state machine | MVP v1 | Prevents unverified listings going live |
| Next.js listing creation form (Arabic) | MVP v1 | Supply acquisition UI |
| Host reservation dashboard | MVP v1 | Host manages bookings |

### 3.3 Search + Booking

| Feature | Version | Why |
|---------|---------|-----|
| PostGIS spatial search | MVP v1 | Core discovery |
| Availability filter | MVP v1 | Reduces bounce |
| Price and property type filters | MVP v1 | Basic search |
| Cultural tags filter (FAMILY_ONLY, HALAL_CERTIFIED) | MVP v1 | Arabic-market differentiator |
| Listing detail page | MVP v1 | Conversion |
| Booking panel with date/guest selection | MVP v1 | Booking initiation |
| Payment checkout (Paymob iframe / Stripe redirect) | MVP v1 | Closes transaction loop |

### 3.4 Admin Operations

| Feature | Version | Why |
|---------|---------|-----|
| Admin KYC review queue | MVP v1 | Verify hosts at scale |
| Admin listing verification queue | MVP v1 | Quality gate |
| Admin bulk CSV import | MVP v1 | Seed institutional supply |
| Admin listing-claim workflow | MVP v1 | Pre-create and transfer listings |
| Duplicate detection | MVP v1 | Catalog integrity |
| Support ticket queue | MVP v1 | Daily operations |
| Payout approval queue | MVP v1 | Host retention |

### 3.5 Finance

| Feature | Version | Why |
|---------|---------|-----|
| Escrow model and ledger | MVP v1 | Hold funds safely |
| Payout routing and verification | MVP v1 | Pay hosts |
| Refund and chargeback workflow | MVP v1 | Trust and legal |

---

## 4. WILL NOT BUILD

### 4.1 Never

| Feature | Why |
|---------|-----|
| Channel manager sync (Airbnb, Booking.com, VRBO) | Strategic decision per `MVP_SLICE.md`. StayOS is a demand channel, not a distribution tool. |
| Native iOS/Android app in Stage 1 | Web PWA is sufficient for first 500 bookings. |
| AI-powered pricing/matching | No transaction data to train models. |
| B2B SaaS subscription billing | Marketplace commission is the revenue model. |

### 4.2 Postponed to V1.1

| Feature | Why |
|---------|-----|
| Google/Apple OAuth | +5–10% conversion but not a blocker. |
| KYC automation: AWS Textract OCR + Rekognition | Manual review is sufficient for first 100 hosts. |
| CloudFront CDN and Lambda image resize | Page speed improvement, not launch-critical. |
| RDS Multi-AZ + Redis replica | High availability, not needed for alpha. |
| Reviews and ratings system | Manual review collection at 10-booking milestone can substitute. |
| Field operations / turnover tickets | Relevant after 50+ active units. |
| Weekend/peak pricing multipliers | Revenue optimization after first bookings. |
| Photo deletion endpoint | Content management after first 100 listings. |

### 4.3 Postponed to V1.5

| Feature | Why |
|---------|-----|
| PMS KPIs (ADR, RevPAR, occupancy) | Host retention after scale. |
| Calendar grid dashboard (full month view) | Advanced host UX. |
| Multi-unit portfolio view for property managers | Needed after 100+ B2B units. |
| `FIELD_STAFF` and `OPS_MANAGER` roles | Turnover operations at scale. |
| Audit log (7-year retention) | Compliance after product-market fit. |

### 4.4 Postponed to Phase 2

| Feature | Why |
|---------|-----|
| Multi-property portfolio dashboard | After PMF and B2B scale. |
| Advanced admin incident console | After 100+ active bookings. |
| Real-time messaging (SSE/WebSocket) | Email/WhatsApp sufficient for alpha. |
| Mobile app | After 500+ bookings. |

### 4.5 Postponed to Phase 3

| Feature | Why |
|---------|-----|
| AI pricing and matching | Requires 50K+ transactions. |
| Demand forecasting | Requires 12+ months of data. |
| Personalization engine | Requires network effects and data. |

---

## 5. Future Roadmap

### 5.1 V1.1 (4 weeks after first 10 bookings)

- Google/Apple OAuth
- KYC OCR/biometric automation
- Reviews and ratings
- CloudFront CDN
- Photo deletion and management
- Weekend/peak pricing

### 5.2 V1.5 (after 100 bookings / $15K GTV)

- PMS KPIs for hosts
- Calendar grid dashboard
- Field operations / turnover tickets
- Multi-unit portfolio view
- Audit logging

### 5.3 Phase 2 (after PMF: 500 listings, 200 bookings/month)

- Second Cairo zone expansion
- Mobile app development begins
- Advanced admin CRM
- Real-time messaging
- Corporate/B2B features

### 5.4 Phase 3 (after 50K+ transactions)

- AI pricing and matching
- Demand forecasting
- Personalization
- GCC corridor activation
- Category dominance plays

---

## 6. Stage-Gate Criteria

No stage below may be entered until the previous stage's criteria are met.

### 6.1 MVP v1 Gate

- [ ] 10 live bookings completed.
- [ ] Payment collected in EGP.
- [ ] Payout transferred to verified Egyptian host.
- [ ] 0 P0 safety or fraud incidents.

### 6.2 V1.1 Gate

- [ ] First 10-booking milestone achieved.
- [ ] Host onboarding < 14 days median.
- [ ] Guest NPS ≥ 50.
- [ ] Operational playbook documented.

### 6.3 V1.5 Gate

- [ ] 100 bookings or $15K GTV.
- [ ] 50+ active listings.
- [ ] Host retention ≥ 90%.
- [ ] Search-to-booking conversion ≥ 5%.

### 6.4 Phase 2 Gate

- [ ] 500 listings.
- [ ] 200+ bookings/month.
- [ ] Positive unit economics in Zone 1.
- [ ] Operations autonomous without founder.

---

## 7. What Is In Scope for Sprint 3

Sprint 3 is the engineering effort to build the MVP v1 foundation. The official Sprint 3 backlog is `SPRINT3_FINAL_BACKLOG.md`. It contains only:

- P0 items required for supply enablement and admin operations.
- P1 items to close the booking loop and improve conversion.
- P2 items that can be built if capacity allows.

Sprint 3 does **not** include any V1.1, V1.5, Phase 2, or Phase 3 features unless a critical blocker is discovered.

---

## 8. What Is Out of Scope for Sprint 3

The following are explicitly out of scope for Sprint 3:

- Native mobile app
- AI pricing/matching
- Channel manager sync
- Real-time messaging
- Field operations automation at scale
- Advanced admin incident console
- Reviews (unless time allows)
- Google/Apple OAuth
- KYC OCR/biometric automation
- CloudFront CDN
- Multi-AZ infrastructure
- PMS KPIs
- Calendar grid dashboard
- Multi-unit portfolio
- B2B SaaS billing
- Multi-city expansion

---

## 9. Scope Change Process

1. **Proposer** writes a one-page scope change request with business justification.
2. **Product Director** reviews against MVP objectives.
3. **Founder** approves or rejects.
4. If approved, the change is added to `SPRINT3_FINAL_BACKLOG.md` with a new story ID.
5. A corresponding item is removed or postponed to maintain sprint capacity.

---

## 10. Sign-Off

This scope freeze is effective immediately. All product, engineering, and operations work must align with the `WILL BUILD`, `WILL NOT BUILD`, and `FUTURE ROADMAP` sections above.
