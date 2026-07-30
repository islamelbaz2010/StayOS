# Marketplace Health KPIs — StayOS

**Domain**: Marketplace
**Audience**: Founders, Product, Operations, Finance
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly (KPIs reviewed); Quarterly (targets revised)
**Tags**: KPIs, metrics, marketplace-health, GMV, liquidity, NPS, occupancy, take-rate

---

## Purpose

This article defines the metrics that determine whether StayOS is a healthy, growing marketplace — and the difference between metrics that signal real growth versus metrics that can be manipulated to look good while the business deteriorates. Every team member who reviews dashboards or makes resource decisions must understand which numbers to trust.

---

## Background

Marketplaces can look healthy on the wrong metrics while dying on the right ones. A marketplace can show growing GMV while liquidity collapses (a few large transactions masking zero repeat bookings). It can show growing supply while demand stagnates (more hosts, fewer guests per host). Understanding what to measure — and why — is a core operational competency.

StayOS is in Stage 1 (Ignition). At this stage, most traditional marketplace metrics are premature or misleading. The right Stage 1 metrics are radically different from Stage 3 or Stage 5 metrics.

---

## Core Concept: Metric Tiers

Not all metrics are created equal. StayOS uses a three-tier metric system:

| Tier | Name | Description |
|------|------|-------------|
| Tier 1 | North Star | The single metric that best captures value creation for both sides |
| Tier 2 | Health Metrics | 5–7 metrics reviewed weekly that reveal marketplace health |
| Tier 3 | Diagnostic Metrics | Detailed metrics used to diagnose specific problems |

---

## Detailed Explanation

### North Star Metric

**StayOS North Star: Completed Quality Stays per Month**

Definition: The number of reservation-nights that were (a) successfully completed and (b) received a guest satisfaction rating of ≥4.0 out of 5.

Why this is the North Star:
- It captures real guest value (a stay happened and was good)
- It captures host success (the listing earned revenue)
- It captures platform trust (the transaction completed without dispute)
- It cannot be gamed by listing registrations, page views, or GMV manipulation
- It grows if and only if both supply and demand are healthy

Current Stage 1 target: 10 Completed Quality Stays per month by end of Phase 0 pilot.

---

### Tier 2 Health Metrics (Reviewed Weekly)

**1. Active Listing Rate**

Definition: (Listings with at least 1 available night in the next 30 days) ÷ (Total registered listings) × 100

Target: ≥80%

Why it matters: A listing with no available nights contributes nothing to liquidity. A high total listing count combined with low active listing rate signals host churn or calendar mismanagement.

Warning threshold: <70% → investigate immediately (are hosts blocking calendars? Did they leave?)

---

**2. Search-to-Booking Conversion Rate**

Definition: (Bookings initiated) ÷ (Unique searches) × 100

Target Stage 1: ≥5% | Target Stage 2: ≥8% | Target Stage 3: ≥12%

Why it matters: Low conversion means guests are searching but not finding what they need — a liquidity, pricing, or trust problem. Track separately for domestic Egyptian guests and GCC travelers.

Warning threshold: <3% sustained for 2 weeks → emergency diagnosis required

---

**3. Days to First Booking (Host)**

Definition: Calendar days from host listing activation to first confirmed booking

Target: ≤21 days for all new hosts

Why it matters: Hosts who do not receive a booking within 30 days churn at 80%+ rates. If new hosts wait too long, they lose faith in the platform and either deactivate or become unresponsive.

Warning threshold: >30 days average → proactively match new hosts to guest demand manually

---

**4. Guest Repeat Rate (Cohort)**

Definition: Among guests who completed their first booking in month M, what percentage completed a second booking by month M+3?

Target Stage 1: ≥20% | Target Stage 2: ≥35%

Why it matters: In accommodation, repeat bookings are rare compared to ride-share (guests travel less frequently). But a 0–5% repeat rate indicates guests are using StayOS once, finding a problem, and not returning. Even a 20% repeat rate in Stage 1 is exceptional.

---

**5. Host Retention Rate (Monthly)**

Definition: Hosts with ≥1 booking in month M-1 who also have ≥1 available listing night in month M

Target: ≥90%

Why it matters: Host churn is invisible — hosts simply stop logging in and block their calendars without explicitly leaving. A retention rate below 85% signals unaddressed host problems.

---

**6. Gross Merchandise Value (GMV) per Active Listing**

Definition: Total booking revenue in a month ÷ Number of active listings in that month

Target Stage 1: EGP 8,000–15,000 / listing / month (approximately $160–$300 USD at current rates)

Why it matters: This is the host's revenue signal. If GMV per listing is below market alternatives, hosts will leave. If it's above alternatives, hosts become ambassadors.

---

**7. Platform Take Rate**

Definition: StayOS revenue ÷ GMV × 100

Target: 13–17% blended (8–12% host commission + 3–5% guest service fee)

Why it matters: Too high and hosts list elsewhere. Too low and the business is unsustainable. Track separately for institutional supply (negotiated rates) vs individual hosts (standard rates).

---

### Tier 3 Diagnostic Metrics

Used when health metrics show a problem — to find the root cause.

| Metric | Formula | Use Case |
|--------|---------|----------|
| Listing view-to-contact rate | Contacts / Views | Is content quality (photos, description) converting interest to intent? |
| Contact-to-booking rate | Bookings / Contacts | Is the booking process itself losing people? |
| Calendar availability density | Available nights / Total possible nights | Are hosts keeping calendars updated? |
| Check-in success rate | Frictionless check-ins / Total check-ins | Is the operational hand-off working? |
| Dispute rate | Disputes / Completed bookings | Is trust holding? |
| Refund rate | Refunds issued / Total payments | Are guests dissatisfied after booking? |
| Average review score | Sum of all scores / Count of reviews | Is quality consistent? |
| Host NPS | (Promoters - Detractors) / Total × 100 | Would hosts recommend StayOS to other hosts? |
| Guest NPS | (Promoters - Detractors) / Total × 100 | Would guests recommend StayOS to other guests? |
| Support ticket rate | Support tickets / Completed bookings | Are there systemic operational failures? |
| Average resolution time | Time from ticket open to close | Is support effective? |

---

## Stage-Appropriate Metric Prioritization

| Stage | Focus Metrics | Ignore (For Now) |
|-------|--------------|-----------------|
| Stage 1 | Listings active, days-to-first-booking, completed stays, host retention | GMV, revenue, traffic, social media followers |
| Stage 2 | Search conversion, guest repeat rate, host NPS, liquidity by area | Profitability, international expansion metrics |
| Stage 3 | GMV per listing, take rate, RevPAR, review scores by category | AI/ML metrics (not enough data yet) |
| Stage 4 | All of the above + demand forecasting accuracy, personalization lift | — |

---

## Real-World Examples

### Example 1: The Vanity GMV Trap
Month 3: GMV = EGP 450,000. The team celebrates.
Reality: 3 corporate bookings (company-negotiated long-stay apartments) generated 90% of GMV. The other 10% came from 5 individual bookings. Search-to-booking conversion: 1.8%. Days to first booking for new hosts: 45 days. Host retention: 72%.

The marketplace is not growing — it is being kept alive by 3 corporate relationships that are not representative of the consumer marketplace. Any one of the 3 leaving would be catastrophic.

**Lesson**: Never let GMV replace the health metrics. Decompose GMV by booking source.

### Example 2: The High NPS Illusion
Guest NPS = 72. Celebrated as evidence of product-market fit.
Reality: Only 18 guests have been surveyed. The 3 guests who had bad experiences were refunded and never followed up with a survey. The NPS is from the 18 guests who had good experiences.

**Lesson**: NPS below n=100 responses is statistically meaningless. Focus on leading indicators (conversion, repeat, days-to-first-booking) over NPS in Stage 1.

### Example 3: Reading a Healthy Dashboard
Month 6:
- Active listing rate: 84% (target ≥80%) ✅
- Search-to-booking conversion: 6.2% (target ≥5%) ✅
- Days to first booking (new hosts): 18 days (target ≤21) ✅
- Guest repeat rate (3-month cohort): 24% (target ≥20%) ✅
- Host retention: 91% (target ≥90%) ✅
- GMV per active listing: EGP 11,000 (target EGP 8,000–15,000) ✅

**Conclusion**: All Tier 2 health metrics in range. This is a healthy Stage 1 marketplace. The right move is to continue supply concentration and begin selective demand marketing — not to expand geography yet.

---

## Decision Tree: What the Metrics Are Telling You

```
Is Active Listing Rate < 70%?
  YES → Host problem. Are hosts blocking calendars? Not logging in? Churn starting?
       Trigger immediate host retention investigation.

Is Search-to-Booking Conversion < 3%?
  YES → Split by cause:
        - Is availability low? (liquidity problem → more supply)
        - Are prices too high? (pricing problem → host education)
        - Are photos/descriptions poor? (content problem → StayOS content team)
        - Is checkout friction high? (product problem → UX review)

Is Days-to-First-Booking > 30 days?
  YES → New hosts are not getting matched to demand quickly enough.
       Manually match top 5 waiting hosts to current guest searches immediately.

Is Host Retention < 85%?
  YES → Find the churned hosts and call them. What happened?
       Common causes: no bookings in 30 days, guest cancelled last minute, pricing confusion.

Is Guest Repeat Rate < 15% after 3 months?
  YES → Post-stay experience is broken.
       Check: Were reviews requested? Was there a reason guests did not return?
       Survey the cohort directly via WhatsApp.
```

---

## Best Practices

1. **Review Tier 2 metrics every Monday morning.** Make this a standing ritual before any other planning discussion. If any metric is outside target, the root cause must be identified before the week's other work begins.

2. **Track metrics by cohort, not just aggregate.** Aggregate metrics hide deteriorating cohorts. The January host cohort's 30-day retention may be 95% while the March cohort's is 60% — and the aggregate reads 80%, hiding the problem.

3. **Separate institutional supply metrics from individual host metrics.** A hotel chain booking 50 nights per month skews the days-to-first-booking metric in ways that hide the reality for individual hosts. Track both groups separately.

4. **Never report only good metrics in team meetings.** Normalize discussing metrics below target. The meeting where a leader says "our conversion dropped 2 points this week, here's what we're doing about it" is more valuable than 10 meetings celebrating metrics that are fine.

5. **Establish a metric owner for each Tier 2 metric.** Each metric has one named person responsible for its direction. Not responsible for making it go up (that requires cross-functional action) — responsible for explaining what it means and proposing the right response.

---

## Common Mistakes

**Mistake 1: Optimizing for GMV at the expense of health metrics**
A discount campaign can spike GMV by 40% in a week while simultaneously destroying host retention (hosts receive discounted rates without agreeing to them) and suppressing repeat rate (guests who got a bargain expect bargain pricing every time). GMV is an output metric — it follows from health, it does not create it.

**Mistake 2: Combining segments in aggregate metrics**
Mixing hotel chain bookings with individual host bookings in the same metrics makes both look misleadingly average. A hotel chain with 90% occupancy and a struggling individual host with 15% occupancy averaged together looks like 52% — which is neither the success of one nor the crisis of the other.

**Mistake 3: Measuring metrics that can only go up**
Total registered hosts, total listings ever created, total page views — these can only increase and therefore tell you nothing about business health. Trend metrics (week-over-week, month-over-month) always matter more than cumulative counts.

---

## FAQs

**Q: What is a good GMV for StayOS in Phase 0?**
A: GMV is not a Phase 0 metric. The Phase 0 target is 10 completed transactions. GMV becomes meaningful at Stage 2 when you have enough completed transactions to establish a baseline.

**Q: Should we track RevPAR (Revenue Per Available Room)?**
A: Yes, starting at Stage 2. RevPAR = (Total room revenue) ÷ (Total available room-nights). This is the hospitality industry standard for measuring property performance. It helps hosts understand how they compare to market and helps StayOS identify underperforming listings for intervention.

**Q: How do we track NPS when we have small numbers?**
A: Do not use NPS as a leading indicator below n=50 responses. Instead, use direct qualitative feedback: after every completed stay, have a team member (the founder in Stage 1) call or WhatsApp the guest personally. Record the conversation. This produces better insights than NPS at small scale.

**Q: When should we set up a proper BI dashboard?**
A: When manual tracking in Google Sheets takes more than 2 hours per week. Until that threshold, manual tracking is faster and reveals more than dashboard setup time costs.

---

## Checklist

### Weekly Metrics Review Checklist
- [ ] Active listing rate calculated and reviewed
- [ ] Search-to-booking conversion rate calculated
- [ ] Days-to-first-booking for new hosts (last 30 days cohort)
- [ ] Host retention rate compared to prior week
- [ ] Any metric outside target — root cause identified and documented
- [ ] One action owner assigned per out-of-target metric

### Monthly Metrics Review Checklist
- [ ] Guest repeat rate for 3-month cohort
- [ ] GMV per active listing by segment (institutional vs individual)
- [ ] Take rate confirmed within target range
- [ ] All diagnostic metrics reviewed for trend
- [ ] Host NPS and guest NPS surveys sent and results reviewed
- [ ] Metrics compared to prior month with explanation of significant changes

---

## References

- `DECISION_LOG.md` — DEC-010 (revenue model, take rate targets)
- `epos/PROJECT_STATE.md` — Current phase gate conditions
- `docs/system-design/01_SYSTEM_OVERVIEW.md` — System overview and data flows

## Related Documents

- `knowledge/marketplace/marketplace_lifecycle.md`
- `knowledge/operations/daily_operations_runbook.md`
- `knowledge/finance/escrow_model.md`
- `knowledge/founder/decision_framework.md`
