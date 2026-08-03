# LAUNCH FINANCIAL MODEL — StayOS

**Prepared by:** Investment Committee, COO, CFO  
**Date:** 2026-08-03  
**Purpose:** Model the cash, burn, runway, and unit economics required to launch the StayOS Closed Alpha and reach Stage 1.

---

## 1. Financial Philosophy

StayOS must preserve capital until the marketplace loop is proven. The MVP target is 10 live bookings before adding any V1.1 features. Every expense in Stage 1 must either (a) build supply, (b) build trust, or (c) generate the first 10 bookings.

**Evidence from the repository:**
- `MVP_SLICE.md` — Budget: $150,000; target 10 live bookings before V1.1.
- `knowledge/finance/payout_operations.md` — Payout flow and commission structure.
- `knowledge/finance/refund_and_chargeback.md` — Refund and chargeback rules.
- `knowledge/marketplace/marketplace_health_kpis.md` — Take rate, GMV per active listing.

---

## 2. Assumptions

### 2.1 Revenue Assumptions

| Metric | Value | Evidence |
|--------|-------|----------|
| Host commission | 10% | `knowledge/finance/payout_operations.md` example |
| Guest service fee | 3–5% | `knowledge/marketplace/marketplace_health_kpis.md` |
| Blended take rate | 13–17% | `knowledge/marketplace/marketplace_health_kpis.md` |
| Average nightly rate | EGP 1,500 | Market estimate for New Cairo/Alexandria |
| Average booking length | 3 nights | Stage 1 estimate |
| Average booking value (ABV) | EGP 4,500 | 1,500 × 3 |
| Cleaning fee | EGP 300 | Pass-through or retained |

### 2.2 Cost Assumptions

| Metric | Value | Evidence |
|--------|-------|----------|
| Founder runway target | 12 months | Pre-seed standard |
| Closed Alpha duration | 4 weeks | `CLOSED_ALPHA_EXECUTION_PLAN.md` |
| Closed Alpha team | 12–14 people | `CLOSED_ALPHA_EXECUTION_PLAN.md` |
| Average local salary (loaded) | EGP 25,000/month | Stage 1 market rate |
| Average founder salary (loaded) | EGP 45,000/month | Founder draw |

### 2.3 Acquisition Assumptions

| Metric | Value | Evidence |
|--------|-------|----------|
| Cost per listing (fully loaded) | EGP 4,000–8,000 | Field photography, verification, onboarding labor |
| Cost per booking (Stage 1) | EGP 200–500 | Founder network and organic channels |
| Host CAC | EGP 1,000–3,000 | Sourcing, onboarding, verification |
| Guest CAC (paid) | EGP 500–1,000 | Paid social at scale |

---

## 3. Monthly Burn

### 3.1 Pre-Launch (Sprint 3 — 8–10 weeks)

| Category | Monthly Cost | Notes |
|----------|-------------|-------|
| Engineering (2–3) | EGP 90,000 | 2 backend, 1 frontend |
| Product/Design (1) | EGP 25,000 | Product Director part-time |
| Founder draw | EGP 45,000 | 1 founder full-time |
| Cloud/infrastructure | EGP 5,000 | AWS dev/staging |
| Tools/SaaS | EGP 3,000 | GitHub, Sentry, Twilio, etc. |
| Office/coworking | EGP 5,000 | |
| Total monthly burn | **EGP 173,000** | |

### 3.2 Closed Alpha (Month 1–2)

| Category | Monthly Cost | Notes |
|----------|-------------|-------|
| Engineering (2–3) | EGP 90,000 | |
| Operations team (5–7) | EGP 140,000 | Supply, host success, ops, support |
| Founder | EGP 45,000 | |
| Field staff/photographers | EGP 30,000 | 2 people |
| Cloud/infrastructure | EGP 8,000 | Production staging |
| Marketing/demand | EGP 19,000 | `EARLY_DEMAND_PLAYBOOK.md` |
| Tools/SaaS | EGP 5,000 | |
| Office | EGP 8,000 | |
| Total monthly burn | **EGP 345,000** | |

### 3.3 Stage 1 (Month 3–6)

| Category | Monthly Cost | Notes |
|----------|-------------|-------|
| Engineering (3–4) | EGP 120,000 | |
| Operations team (8–10) | EGP 200,000 | |
| Founder | EGP 45,000 | |
| Field staff/photographers | EGP 40,000 | 3 people |
| Cloud/infrastructure | EGP 15,000 | |
| Marketing/demand | EGP 55,000 | `EARLY_DEMAND_PLAYBOOK.md` |
| Tools/SaaS | EGP 8,000 | |
| Office | EGP 10,000 | |
| Total monthly burn | **EGP 493,000** | |

---

## 4. Founder Runway and Cash Requirements

### 4.1 Runway Scenarios

Assuming $150,000 raised ≈ EGP 7,500,000 at current rates.

| Scenario | Monthly Burn | Runway (months) | Notes |
|----------|-------------|-----------------|-------|
| Pre-launch only | EGP 173,000 | 43 | Not realistic if product is strong |
| Closed Alpha | EGP 345,000 | 22 | 4–8 weeks of alpha |
| Stage 1 average | EGP 420,000 | 18 | Burn increases over time |
| High-burn scenario | EGP 493,000 | 15 | Full Stage 1 team |

### 4.2 Cash Required to Reach 100 Bookings

| Phase | Duration | Burn | Cumulative |
|-------|----------|------|------------|
| Sprint 3 + pre-launch | 2 months | EGP 346,000 | EGP 346,000 |
| Closed Alpha | 1 month | EGP 345,000 | EGP 691,000 |
| Stage 1 (Months 3–6) | 4 months | EGP 1,972,000 | EGP 2,663,000 |
| **Total to 100 bookings** | 7 months | **EGP 2,663,000** | |

This is approximately **$53,000** of the $150,000 budget, leaving meaningful runway.

---

## 5. Unit Economics

### 5.1 Cost Per Listing

| Cost Item | EGP per Listing |
|-----------|-----------------|
| Sourcing labor | 1,500 |
| Onboarding labor | 1,000 |
| Photography | 500 |
| Verification/inspection | 800 |
| KYC review | 200 |
| **Total cost per listing** | **4,000** |

At 100 listings: **EGP 400,000**.

### 5.2 Cost Per Booking

| Cost Item | EGP per Booking |
|-----------|-----------------|
| Demand acquisition (organic) | 200 |
| Operations support | 300 |
| Payment processing (2.5%) | 110 |
| **Total cost per booking** | **610** |

At 100 bookings: **EGP 61,000**.

### 5.3 Host CAC

| Cost Item | EGP per Host |
|-----------|---------------|
| Sourcing | 1,000 |
| Onboarding | 1,000 |
| Photography | 500 |
| Verification | 500 |
| **Total host CAC** | **3,000** |

For institutional hosts with 10 units: **EGP 300 per listing**.
For individual hosts with 1 unit: **EGP 3,000 per listing**.

### 5.4 Guest CAC

| Channel | CAC |
|---------|-----|
| Founder network | EGP 0–100 |
| WhatsApp/Facebook organic | EGP 50–200 |
| Corporate BD | EGP 300–500 |
| Paid social (Stage 2) | EGP 500–1,000 |

### 5.5 Revenue Per Booking

| Item | EGP |
|------|-----|
| Booking value (3 nights × 1,500) | 4,500 |
| Host commission (10%) | 450 |
| Guest service fee (4%) | 180 |
| **Total platform revenue per booking** | **630** |
| Take rate | 14% |

### 5.6 LTV Assumptions

| Metric | Value |
|--------|-------|
| Guest repeat rate (Year 1) | 25% |
| Average bookings per repeat guest | 2 |
| Average booking value | EGP 4,500 |
| Platform revenue per repeat booking | EGP 630 |
| Contribution margin per booking | EGP 20 (early stage) |
| **Estimated Guest LTV (Year 1)** | **EGP 630 × 1.5 = EGP 945** |

At Stage 1, LTV is low because repeat rates and margins are low. The focus is on learning, not profit.

### 5.7 Payback Period

- Guest CAC (paid): EGP 500–1,000.
- Contribution margin per booking: EGP 20 (early) → EGP 100 (after 100 bookings).
- Payback period: 5–50 bookings per guest, depending on organic vs. paid.

At Stage 1, organic and founder-led demand is required to keep CAC near zero.

---

## 6. Commission Revenue

### 6.1 Closed Alpha Revenue

| Metric | Value |
|--------|-------|
| Target transactions | 10 |
| Average booking value | EGP 4,500 |
| GMV | EGP 45,000 |
| Take rate | 14% |
| **Gross revenue** | **EGP 6,300** |

### 6.2 Stage 1 Revenue (100 bookings)

| Metric | Value |
|--------|-------|
| Target bookings | 100 |
| Average booking value | EGP 4,500 |
| GMV | EGP 450,000 |
| Take rate | 14% |
| **Gross revenue** | **EGP 63,000** |

### 6.3 Stage 2 Revenue (500 bookings)

| Metric | Value |
|--------|-------|
| Target bookings | 500 |
| Average booking value | EGP 4,500 |
| GMV | EGP 2,250,000 |
| Take rate | 14% |
| **Gross revenue** | **EGP 315,000** |

---

## 7. Break-Even Scenarios

### 7.1 Best Case

| Assumption | Value |
|------------|-------|
| Monthly burn | EGP 350,000 |
| Take rate | 17% |
| Average booking value | EGP 5,000 |
| **Monthly bookings needed to cover burn** | **4,118** |

Not achievable in Stage 1. Break-even is a Stage 2/3 target.

### 7.2 Expected Case

| Assumption | Value |
|------------|-------|
| Monthly burn | EGP 420,000 |
| Take rate | 14% |
| Average booking value | EGP 4,500 |
| **Monthly bookings needed to cover burn** | **6,667** |

### 7.3 Worst Case

| Assumption | Value |
|------------|-------|
| Monthly burn | EGP 500,000 |
| Take rate | 13% |
| Average booking value | EGP 4,000 |
| **Monthly bookings needed to cover burn** | **9,615** |

### 7.4 Reality Check

At 100 listings with 50% occupancy, Stage 1 generates ~150 bookings/month (assuming 3-night average). This is far below break-even. Stage 1 is not expected to be profitable. It is a learning and proof-of-market phase.

---

## 8. Cash Flow Projection

| Month | Burn | GMV | Revenue | Cumulative Cash Used |
|-------|------|-----|---------|----------------------|
| 1 | 173,000 | 0 | 0 | 173,000 |
| 2 | 173,000 | 0 | 0 | 346,000 |
| 3 | 345,000 | 45,000 | 6,300 | 684,700 |
| 4 | 420,000 | 225,000 | 31,500 | 1,073,200 |
| 5 | 450,000 | 450,000 | 63,000 | 1,460,200 |
| 6 | 493,000 | 900,000 | 126,000 | 1,827,200 |
| 7 | 493,000 | 1,350,000 | 189,000 | 2,131,200 |

**Total cash used to reach 100+ bookings/month and positive unit economics signals: ~$43,000–$50,000 of the $150,000 budget.**

---

## 9. Financial Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| EGP devaluation vs USD | Burn in EGP increases if FX deteriorates | Keep 3–6 months of USD reserve, price in EGP for local market |
| Payment processor fees | Take rate compressed if fees rise | Negotiate volume rates, use Paymob for local rails |
| Chargebacks | Direct loss and merchant risk | Strong T&S, manual review for first transactions |
| Host commission pressure | Hosts may demand lower commission | Use zero-commission pilot, then 8–10% for institutional |
| Demand shortfall | Revenue below projection | Founder-led demand, manual transactions before paid ads |

---

## 10. Investment Committee Recommendations

1. **Preserve the $150,000 budget for 12 months of runway.** Stage 1 burn should not exceed EGP 420,000/month.
2. **Do not spend on paid ads until 50 verified listings exist.** Paid demand before liquidity is waste.
3. **Cap operational hiring at 12–14 people for the Closed Alpha.** Expand only after Go decision.
4. **Track GMV per active listing weekly.** If it falls below EGP 8,000, investigate pricing and occupancy.
5. **Set a monthly cash review.** Founder and finance review burn, runway, and revenue every first Monday.
