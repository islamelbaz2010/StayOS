# KPIs

## Purpose
Define the complete set of operational, financial, marketplace, support, trust, and growth metrics for StayOS, including definitions, formulas, targets, frequencies, and owners.

## Scope
Applies to all operational areas before and after launch. Product and engineering metrics are included only where they intersect with operations.

## Owner
COO / Operations Director

## Inputs
- Business_Model.md
- Marketplace_Model.md
- Trust_Model.md
- Escrow_Model.md
- Operations_Dashboard.md
- Founder_Dashboard.md
- Transaction, support, and user data

## Outputs
- KPI scorecard
- Performance reports
- Target review recommendations
- Executive review inputs

## Workflow
1. Each KPI has a single owner and a defined calculation.
2. Data is collected automatically where possible, manually otherwise.
3. KPIs are reviewed at their defined frequency.
4. Out-of-target KPIs trigger an action item and escalation if required.
5. Targets are reviewed quarterly and adjusted for seasonality and growth stage.

## KPI Definitions

### Marketplace

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| GMV | Total booking value transacted | `sum(reservation.total_amount)` confirmed/completed | Plan + 10% WoW early stage | Weekly | Finance Lead |
| Take rate | Platform revenue as % of GMV | `net platform revenue / GMV` | Plan (e.g., 12-18%) | Weekly | Finance Lead |
| Occupancy rate | Bookable nights actually booked | `booked nights / (booked + available nights)` | > 50% mature markets | Weekly | Marketplace Ops |
| Search conversion rate | Searches leading to booking | `confirmed bookings / search sessions` | Baseline + 5% | Weekly | Marketplace Ops |
| Listing quality score | Composite listing quality | See Host_Operations_Playbook | > 75 | Weekly | Host Success |
| Supply coverage | Active bookable units per market | Count of verified live listings | Market-specific | Weekly | Marketplace Ops |

### Finance

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| Net revenue | Revenue after refunds and provider costs | `platform fees - payment provider costs - refunds` | Plan | Weekly | Finance Lead |
| Gross margin | Profitability of marketplace revenue | `net revenue / platform revenue` | Plan | Monthly | Finance Lead |
| Refund rate | Refunds as % of GMV | `refund amount / GMV` | < 5% | Weekly | Customer Success |
| Chargeback rate | Chargebacks per transactions | `chargeback count / total transactions` | < 0.5% | Weekly | Finance Lead |
| Payout on-time rate | Payouts released within SLA | `on-time payouts / total payouts` | > 98% | Weekly | Finance Lead |
| Escrow reconciliation variance | Unexplained escrow differences | `|escrow ledger - provider settlements|` | 0 | Daily | Reconciliation Analyst |

### Support

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| First response time (FRT) | Time from ticket open to first response | Average by priority | SLA: P1 < 15m, P2 < 1h, P3 < 4h | Daily | Guest Support Lead |
| Resolution time | Time from ticket open to close | Average by priority | SLA: P1 < 4h, P2 < 24h, P3 < 72h | Daily | Guest Support Lead |
| SLA compliance | Tickets resolved within SLA | `within SLA tickets / total tickets` | > 90% | Daily | Guest Support Lead |
| CSAT | Customer satisfaction score | Average post-resolution rating | > 4.0 / 5 | Weekly | Customer Success Director |
| Ticket backlog | Open tickets beyond SLA | Count | < 5% of open queue | Daily | Guest Support Lead |

### Operations

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| Incident MTTA | Mean time to acknowledge | `sum(time to acknowledge) / incident count` | Per severity SLA | Per incident | Operations Director |
| Incident MTTR | Mean time to resolve | `sum(time to resolve) / incident count` | Per severity SLA | Per incident | Operations Director |
| Listing review turnaround | Hours from submission to decision | Average | < 24h | Daily | Marketplace Ops |
| KYC turnaround | Hours from document submission to decision | Average | < 4h auto, < 24h manual | Daily | Trust & Safety |
| SOP compliance | Audits passing vs total | `passing audits / audits performed` | > 95% | Monthly | Operations Director |

### Hosts

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| Host activation rate | Verified hosts with live listing | `active hosts / verified hosts` | > 70% | Weekly | Host Success |
| Time to first booking | Days from listing to first booking | Average | < 14 days | Weekly | Host Success |
| Host response rate | Inquiries answered within SLA | `responses within 1h / total inquiries` | > 90% | Weekly | Host Success |
| Host NPS | Host likelihood to recommend StayOS | Survey score | > 50 | Monthly | Host Success |
| Host churn | Hosts becoming inactive or removed | `churned hosts / active hosts` | < 5% | Monthly | Host Success |

### Guests

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| Guest conversion rate | Searches or views to booking | `bookings / listing views` | Baseline + | Weekly | Marketplace Ops |
| Repeat booking rate | Bookings by returning guests | `return guest bookings / total bookings` | > 20% | Monthly | Customer Success |
| Guest NPS | Guest likelihood to recommend | Survey score | > 50 | Monthly | Customer Success |
| Cancellation rate | Bookings cancelled before check-in | `cancelled bookings / total bookings` | < 5% | Weekly | Customer Success |
| Average review rating | Post-stay rating average | `sum(ratings) / count(ratings)` | > 4.5 / 5 | Weekly | Customer Success |

### Growth

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| Host CAC | Cost to acquire an active host | `host marketing + sales cost / new active hosts` | Plan | Monthly | COO |
| Guest CAC | Cost to acquire a booking guest | `guest marketing cost / new booking guests` | Plan | Monthly | COO |
| New host signups | Hosts starting onboarding | Count | Plan | Weekly | Host Success |
| New guest signups | KYC-verified guests registering | Count | Plan | Weekly | Marketing / COO |
| Viral/referral rate | Bookings from referrals | `referral bookings / total bookings` | > 5% | Monthly | Marketing |

### Trust & Safety

| KPI | Definition | Formula | Target | Frequency | Owner |
|---|---|---|---|---|---|
| KYC pass rate | Verified users / submitted | `verified / total submitted` | > 90% | Weekly | Trust & Safety |
| Dispute rate | Disputes per bookings | `disputes / completed bookings * 100` | < 1% | Weekly | Trust & Safety |
| Fraud detection rate | Confirmed fraud cases / flagged | `confirmed / flagged` | > 20% | Weekly | Trust & Safety |
| False positive rate | Innocent users incorrectly flagged | `false positives / total flags` | < 5% | Monthly | Trust & Safety |
| Chargeback rate | Chargebacks / transactions | `chargeback count / total transactions` | < 0.5% | Weekly | Finance / Trust & Safety |

## Exceptions
- Targets are initial launch estimates and should be adjusted based on baseline data.
- Seasonality and local holidays may be excluded from certain week-over-week comparisons.
- New markets may have separate targets for the first 90 days.

## Dependencies
- Founder_Dashboard.md
- Operations_Dashboard.md
- Data warehouse / reporting tools
- Support ticketing system
- Payment provider reports
- KYC/verification system

## Best Practices
- Every KPI must have one owner and one clear target.
- Prefer leading indicators (response time, activation rate) over lagging indicators alone.
- Standardize definitions before comparing across markets.
- Review targets quarterly to reflect growth stage and market maturity.

## Review Frequency
Scorecard reviewed weekly; target review performed quarterly.
