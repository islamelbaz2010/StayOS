# 07 — FINAL EXECUTIVE DECISION

**Committee:** Executive Steering Committee — StayOS  
**Date:** 2026-08-03  
**Subject:** Final Executive Gate decision before Sprint 3 implementation begins

---

## 1. Decision

### OPTION B — SMALL ROADMAP ADJUSTMENTS

The committee approves Sprint 3 implementation with **small but mandatory adjustments** to the revised roadmap. The overall direction is correct. The scope reduction from `02_REVISED_SPRINT3_ROADMAP.md` (Option C from the prior executive review) is confirmed. However, the committee identifies critical gaps in vision alignment that require 4.5 SP of additional work before the MVP can prove the StayOS vision.

---

## 2. Why Not Option A (Proceed Immediately)

Option A is rejected because:

1. **The MVP as currently planned does not prove the vision.** Sprint 3 builds a supply pipe and admin tooling. It does not surface any guest-visible differentiator from Airbnb. A guest using the platform would perceive grid search, placeholder Arabic text, no visible trust signals, no cultural filters, and card-only payment — indistinguishable from a worse version of Airbnb.

2. **11 SP of trust infrastructure produces zero guest-visible ROI.** KYC, escrow, and listing verification exist in the backend but are invisible to guests. This is wasted investment unless 1.5 SP of frontend work surfaces it.

3. **The #1 differentiator ("Arabic-first") is placeholder text.** The i18n structure exists but actual Arabic copy is missing. "Arabic-first" with placeholder keys is not Arabic-first.

4. **Cultural tags — a unique competitive advantage no incumbent offers — are invisible.** The data model supports them. The search UI does not filter by them.

These are not large changes. They are 4.5 SP. But without them, the MVP proves engineering capability, not vision validity.

---

## 3. Why Not Option C (Reorder Roadmap)

Option C is not necessary because the prior executive review (`02_REVISED_SPRINT3_ROADMAP.md`) already reordered the roadmap correctly:

- Deferred S3-012, S3-013, S3-014, S3-015 (-16 SP)
- Elevated S3-018 to P0 (+5 SP)
- Simplified S3-003, S3-008, S3-011 (-5 SP)
- Reduced timeline from 5 weeks to 3 weeks

The committee confirms this reordering. The remaining issue is not ordering but **completeness** — the roadmap is missing the vision-aligned features that make StayOS different.

---

## 4. Why Not Option D (Major Redesign)

Option D is not necessary because:

1. The backend architecture is sound. No redesign needed.
2. The frontend stack is modern and capable. No redesign needed.
3. The marketplace strategy is directionally correct. No redesign needed.
4. The supply acquisition plan is viable. No redesign needed.
5. The financial model is realistic. No redesign needed.

The project needs **additions**, not **redesign**. 4.5 SP of frontend features that surface existing backend capabilities.

---

## 5. Mandatory Adjustments to Sprint 3

The committee mandates the following additions to Sprint 3 P0 scope:

### 5.1 Vision-Aligned Features (4.5 SP)

| Feature | Effort | Vision Pillar | Risk Mitigated |
|---------|--------|---------------|----------------|
| Real Arabic copy for all guest-facing pages | 2 SP | Arabic-first UX | P-01, P-07 |
| Verified Host badge on listing detail page | 0.5 SP | Trust infrastructure | T-04, P-01 |
| Cultural tag filter chips on search page | 1 SP | Cultural context | P-01 |
| Escrow trust message on booking page | 0.5 SP | Trust infrastructure | T-04, P-01 |
| Cancellation policy text on booking page | 0.5 SP | Trust infrastructure | L-03, P-01 |

**Total: 4.5 SP.** This fits within the 16 SP saved by deferring S3-012 through S3-015.

### 5.2 Revised Total P0 Effort

| Metric | Prior Revised Roadmap | Committee-Adjusted | Change |
|--------|----------------------|-------------------|--------|
| Total P0 SP | 44 | 48.5 | +4.5 |
| Remaining P0 SP | ~25 | ~29.5 | +4.5 |
| Engineering timeline | 3 weeks (15 days) | 3 weeks (16-17 days) | +1-2 days |

The 4.5 SP of additions extend the timeline by 1-2 days. This is acceptable. The timeline remains 3 weeks, not 5.

### 5.3 Operational Adjustments

| Adjustment | Rationale | Source |
|------------|-----------|--------|
| Extend alpha from 4 weeks to 6 weeks | Supply and demand forecasts are optimistic. 6 weeks provides buffer. | `04_MARKETPLACE_ECONOMICS_REVIEW.md` |
| Concentrate ALL supply in New Cairo only | 50 listings in 1 area creates density. 50 across 4 areas creates 4 empty marketplaces. | `05_GO_TO_MARKET_VALIDATION.md` |
| Lower MVP gate to 7 bookings if supply < 40 | Realistic target based on revised forecasts. | `04_MARKETPLACE_ECONOMICS_REVIEW.md` |
| Hire 1 operations person by Week 2 | Founder becomes bottleneck at 30+ listings. | `04_MARKETPLACE_ECONOMICS_REVIEW.md` |
| Start agency outreach in Week 1 | Agency sales cycles are 2-4 weeks. Don't wait until Week 2. | `05_GO_TO_MARKET_VALIDATION.md` |
| 0% host commission for first 3 bookings | Primary host acquisition incentive. | `05_GO_TO_MARKET_VALIDATION.md` |
| 0% guest fee for first 10 bookings | Remove friction for alpha guests. | `05_GO_TO_MARKET_VALIDATION.md` |
| 15% founding guest discount | Customer acquisition cost, not revenue loss. | `05_GO_TO_MARKET_VALIDATION.md` |
| Activate referral program at 10 bookings | Accelerate retention. Don't wait until Month 2. | `04_MARKETPLACE_ECONOMICS_REVIEW.md` |
| Founder visits first 10 properties personally | Trust building and quality assurance. | `05_GO_TO_MARKET_VALIDATION.md` |
| Create Arabic FAQ page | Reduce support load by 30-50%. | `05_GO_TO_MARKET_VALIDATION.md` |
| Create 3-5 Arabic SEO landing pages | Start long-term organic channel. | `05_GO_TO_MARKET_VALIDATION.md` |
| Publish ToS, privacy policy, cancellation policy | Legal protection before processing payments. | `06_PRODUCT_RISK_REGISTER.md` |
| File trademark application for "StayOS" | Protect brand. Cost: ~EGP 2,000-5,000. | `06_PRODUCT_RISK_REGISTER.md` |

---

## 6. Revised Success Metrics (The ONLY Metrics That Matter)

### 6.1 Supply Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Live listings in New Cairo | 40 by Week 6 | Count of LISTED listings in New Cairo | Daily |
| Verified hosts | 12 by Week 6 | Count of users with kyc_status=VERIFIED | Daily |
| Listings with 5+ photos | 100% | Count of listings with >= 5 photos | Daily |
| Listings with cultural tags | >= 60% | Count of listings with at least 1 cultural tag | Daily |
| Time from host signup to live listing | < 5 days | Manual tracking | Per host |

### 6.2 Demand Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Completed bookings | 7-10 by Week 6 | Count of reservations with status=CHECKED_OUT | Daily |
| Bookings from warm contacts | >= 70% | Manual tracking | Per booking |
| Search-to-booking conversion | >= 3% | Completed bookings / total searches | Weekly |
| Guest NPS | >= 50 | Manual survey via WhatsApp | Per guest |

### 6.3 Conversion Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Search-to-listing-view | >= 20% | Analytics | Weekly |
| Listing-view-to-booking-initiated | >= 8% | Analytics | Weekly |
| Booking-initiated-to-completed | >= 40% | Reservations (confirmed / initiated) | Weekly |

### 6.4 Retention Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Host retention (active after 4 weeks) | >= 60% | Count of hosts with active listings | Weekly |
| Guest repeat rate (alpha cohort) | >= 10% | Manual tracking | Per guest |
| Referral conversions | >= 2 by Week 6 | Manual tracking | Weekly |

### 6.5 Revenue Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| GMV | EGP 30,000-45,000 | Sum of booking values | Weekly |
| Platform revenue | EGP 0 (0% commission for alpha) | N/A | N/A |
| Payments collected in EGP | 100% of bookings | Count | Per booking |
| Payouts processed | >= 5 hosts paid | Count | Per payout |

### 6.6 Liquidity Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Listings in New Cairo | 40 by Week 6 | Count | Daily |
| Search results for "New Cairo" on typical dates | >= 10 results | Manual search test | Weekly |
| Available listings for weekend dates | >= 5 | Manual search test | Weekly |

### 6.7 Trust Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Listings with verified host badge | 100% of live listings | Count | Daily |
| Fraud incidents | 0 | Manual tracking | Per incident |
| Disputes resolved | 100% | Manual tracking | Per dispute |

### 6.8 Marketplace Health Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Active listing rate | >= 80% | LISTED / total listings | Weekly |
| Host response time to booking | < 4 hours | Manual tracking | Per booking |
| Guest response time to host message | < 4 hours | Manual tracking | Per message |

### 6.9 Founder Workload Metrics

| Metric | Target | How to Measure | Frequency |
|--------|--------|----------------|-----------|
| Hours on host recruitment | >= 3 hours/day | Self-reported | Daily |
| Hours on manual operations | < 3 hours/day (after Week 2) | Self-reported | Daily |
| Hours on guest acquisition | >= 1 hour/day | Self-reported | Daily |
| Founder days off | >= 1 day/week | Self-reported | Weekly |

### 6.10 Vanity Metrics (Explicitly Excluded)

The following metrics are **NOT tracked** during alpha because they are vanity metrics that do not inform decisions:

- Total page views
- Total unique visitors
- Social media followers
- App store ratings (no app)
- Email list size
- Press mentions
- Total signups (without listing creation or booking)

---

## 7. Revised Timeline

| Milestone | Date | Owner |
|-----------|------|-------|
| Committee decision approved | 2026-08-03 | Committee |
| Engineering sprint begins | 2026-08-04 | CTO |
| S3 buckets configured | 2026-08-06 | Engineering |
| Photo upload works | 2026-08-08 | Engineering |
| Listing form works | 2026-08-11 | Engineering |
| Admin queues work | 2026-08-13 | Engineering |
| CSV import works | 2026-08-15 | Engineering |
| Vision features (Arabic copy, badges, filters) | 2026-08-16 | Engineering |
| Payment checkout works | 2026-08-18 | Engineering |
| Platform deployed | 2026-08-19 | Engineering |
| Closed Alpha begins | 2026-08-19 | Founder |
| 5 listings live | 2026-08-19 | Founder |
| Operations person hired | 2026-08-26 (Week 2) | Founder |
| 15 listings live | 2026-08-26 | Founder |
| 25 listings live | 2026-09-02 | Founder |
| First booking completed | 2026-09-02 | Founder |
| 35 listings live | 2026-09-09 | Founder |
| 5 bookings completed | 2026-09-09 | Founder |
| 40+ listings live | 2026-09-16 | Founder |
| 7-10 bookings completed | 2026-09-16 | Founder |
| MVP v1 Gate achieved | 2026-09-16 | Committee |
| V1.1 planning begins | 2026-09-17 | Committee |

**Total: 3 weeks engineering + 6 weeks alpha = 9 weeks to MVP gate.**

---

## 8. Conditions of Approval

The committee approves Sprint 3 implementation with the following conditions:

### Condition 1: Vision-Aligned Features Are Mandatory

The 4.5 SP of vision-aligned features (Arabic copy, verified badge, cultural filters, escrow message, cancellation text) are **mandatory P0**. They are not optional. They are not "nice-to-have." They are the proof of the vision. Without them, Sprint 3 is not approved.

### Condition 2: Alpha Extended to 6 Weeks

The alpha duration is extended from 4 weeks to 6 weeks. The 4-week target was optimistic. 6 weeks provides buffer for supply and demand to reach target.

### Condition 3: All Supply in New Cairo

All supply acquisition efforts target New Cairo (5th Settlement, Rehab, compounds) exclusively for the first 50 listings. No 6th October, no Zamalek, no Maadi until New Cairo has 50 listings.

### Condition 4: Operations Hire by Week 2

Founder must hire 1 operations person by Week 2 of alpha. Budget: EGP 15,000-20,000/month. If hiring is delayed, founder must reduce operations workload and increase host recruitment time.

### Condition 5: No Paid Acquisition

No paid marketing, no paid social ads, no PR until 50+ listings and 10+ organic bookings. Paid traffic to a thin marketplace is waste.

### Condition 6: Legal Documents Published

Terms of service, privacy policy, and cancellation policy must be published on the website before processing any payments. Template documents are acceptable for alpha, reviewed by a lawyer.

### Condition 7: Weekly Board Report

Founder sends a 1-page status report to the committee every Sunday with: metrics (from Section 6), progress vs. target, top risks, and asks. Committee reviews and responds within 48 hours.

### Condition 8: MVP Gate Criteria

MVP v1 Gate is achieved when ALL of the following are true:
- 40+ live listings in New Cairo
- 7+ completed bookings (10 if supply reaches 50)
- Payment collected in EGP for all bookings
- Payout transferred to at least 5 verified hosts
- 0 fraud incidents
- Guest NPS >= 50
- Host NPS >= 50
- Operations playbook documented
- Founder has identified operations hire (or hired)

---

## 9. What Happens After MVP Gate

### V1.1 Scope (Post-Alpha)

| Feature | Priority | Source |
|---------|----------|--------|
| Map-based search | HIGH | `02_COMPETITIVE_ADVANTAGE_AUDIT.md` |
| Egyptian wallet payments (Fawry, Vodafone Cash, Meeza) | CRITICAL | `02_COMPETITIVE_ADVANTAGE_AUDIT.md` |
| Reviews and ratings | HIGH | `02_COMPETITIVE_ADVANTAGE_AUDIT.md` |
| Host dashboard | MEDIUM | Deferred from Sprint 3 |
| Unclaimed listing creation (S3-012) | MEDIUM | Deferred from Sprint 3 |
| Claim review workflow (S3-013) | MEDIUM | Deferred from Sprint 3 |
| Duplicate detection (S3-014) | LOW | Deferred from Sprint 3 |
| Support ticket system (S3-015) | LOW | Deferred from Sprint 3 |
| Cancellation policy UI (interactive) | MEDIUM | `02_COMPETITIVE_ADVANTAGE_AUDIT.md` |
| Host guarantee / guest protection | MEDIUM | `02_COMPETITIVE_ADVANTAGE_AUDIT.md` |
| Price transparency (total upfront) | HIGH | `02_COMPETITIVE_ADVANTAGE_AUDIT.md` |
| Referral program (automated) | MEDIUM | `04_MARKETPLACE_ECONOMICS_REVIEW.md` |
| 6th October expansion | MEDIUM | `05_GO_TO_MARKET_VALIDATION.md` |
| Corporate travel partnerships | MEDIUM | `05_GO_TO_MARKET_VALIDATION.md` |
| Tourism company partnerships | LOW | `05_GO_TO_MARKET_VALIDATION.md` |

---

## 10. Committee Sign-Off

| Role | Approval | Date |
|------|----------|------|
| Founder | APPROVED | 2026-08-03 |
| CEO | APPROVED | 2026-08-03 |
| CTO | APPROVED | 2026-08-03 |
| Chief Product Officer | APPROVED | 2026-08-03 |
| COO | APPROVED | 2026-08-03 |
| Marketplace Director | APPROVED | 2026-08-03 |
| Growth Director | APPROVED | 2026-08-03 |
| Trust & Safety Director | APPROVED | 2026-08-03 |
| PMO Director | APPROVED | 2026-08-03 |
| Investment Committee | APPROVED | 2026-08-03 |

---

## 11. Executive Statement

> The Executive Steering Committee has reviewed the entire StayOS project — vision, product strategy, engineering plans, marketplace economics, go-to-market strategy, and risk profile. The project is directionally sound. The engineering foundation is strong. The marketplace strategy is viable. The prior executive review's scope reduction (Option C) is confirmed.
>
> However, the committee identifies a critical gap: **the MVP as currently planned does not prove the StayOS vision.** The supply pipe is necessary but not sufficient. A marketplace that looks like Airbnb with placeholder Arabic text and invisible trust signals does not solve problems that Airbnb doesn't solve.
>
> The committee mandates 4.5 SP of vision-aligned features — real Arabic copy, verified host badges, cultural tag filters, escrow trust messaging, and cancellation policy text. These small additions transform the MVP from "a supply pipe with a booking engine" to "a marketplace that proves why StayOS exists."
>
> The committee extends the alpha from 4 to 6 weeks, concentrates all supply in New Cairo, and requires an operations hire by Week 2. These operational adjustments reflect realistic assumptions about supply and demand conversion rates.
>
> **Decision: OPTION B — Small roadmap adjustments. Sprint 3 is approved with the mandatory additions and conditions specified in this document. Implementation may begin immediately.**
>
> The founder is the critical path. The platform is the enabler. The vision is the goal. The MVP must prove all three.
