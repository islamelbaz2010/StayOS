# Operations Dashboard

## Purpose
Provide operations teams and leadership with actionable daily, weekly, monthly, incident, support, and finance views to run the marketplace safely and efficiently.

## Scope
Covers operational dashboards used by the Operations Director, function leads, and analysts. Executive-level summaries feed into Founder_Dashboard.md.

## Owner
Operations Director / COO

## Inputs
- Booking, listing, host, and guest data
- Support ticket system
- Escrow and payment provider data
- Incident and risk logs
- Reconciliation records

## Outputs
- Daily, weekly, monthly, incident, support, and finance dashboard views
- Exception reports and action logs
- Operational review meeting inputs

## Workflow
1. Data sources are refreshed automatically on schedule.
2. Dashboard owners review dashboards at their defined cadence.
3. Exceptions are logged and assigned to an owner.
4. Escalations follow Escalation_Matrix.md.
5. Trends feed into the Founder_Dashboard.md weekly review.

## Dashboards

### 1. Daily Dashboard
**Owner**: Operations Director
**Refresh**: Daily at 07:00 local time

| Metric | Definition | Target | Action Threshold |
|---|---|---|---|
| New bookings | Confirmed bookings in last 24h | Baseline + growth | Drop > 20% vs prior 7-day avg |
| Cancellations | Cancelled bookings in last 24h | < 5% of bookings | > 5% trigger review |
| New host applications | Hosts who started onboarding | Plan target | < 50% of weekly goal |
| New listings submitted | Listings entered review queue | Plan target | Backlog > 48h |
| Payouts released | Escrow releases completed | 100% on schedule | Any failure |
| Unreconciled payments | Settlements not matched | 0 | > 1 item |
| Open critical incidents | P1/P2 count | 0 | Any open > 1h |
| Support backlog | Open tickets by priority | < 10% outside SLA | > 20% outside SLA |

### 2. Weekly Dashboard
**Owner**: COO / Operations Director
**Refresh**: Weekly, Monday 09:00

| Metric | Definition | Target | Action Threshold |
|---|---|---|---|
| GMV | Weekly confirmed booking value | vs plan | < 80% of plan |
| Take rate | Net platform revenue / GMV | Plan rate | Deviation > 1pp |
| Host activation rate | Verified hosts with published listing | > 70% | < 60% |
| Guest conversion rate | Bookings / search sessions | Baseline + | < baseline - 20% |
| Listing quality score avg | Average host/listing quality score | > 75 | < 70 |
| Refund rate | Refund value / GMV | < 5% | > 7% |
| Dispute rate | Opened disputes / completed bookings | < 1% | > 2% |
| NPS | Guest and host NPS | > 50 | < 40 |

### 3. Monthly Dashboard
**Owner**: COO
**Refresh**: First business day of the month

| Metric | Definition | Target | Action Threshold |
|---|---|---|---|
| Net revenue | Platform revenue after refunds and provider costs | Plan | < 90% of plan |
| Gross margin | Net revenue / platform revenue | Plan | < target |
| CAC | Sales + marketing cost / new customer | Plan | > 120% of plan |
| Host churn | Hosts inactive or removed / active hosts | < 5% | > 10% |
| Guest repeat rate | Bookings from previous guests / total | > 20% | < 15% |
| Escrow reconciliation variance | Unexplained escrow ledger difference | 0 | Any non-zero |
| Operational expense ratio | Operations cost / net revenue | Plan | > 120% of plan |

### 4. Incident Dashboard
**Owner**: Operations Director / Trust & Safety Lead
**Refresh**: Real-time

| Metric | Definition | Target | Action Threshold |
|---|---|---|---|
| Open P1 incidents | Critical open incidents | 0 | > 0 |
| Open P2 incidents | High open incidents | 0 | > 0 after 2h |
| MTTA | Mean time to acknowledge | < 15 min P1 | > SLA |
| MTTR | Mean time to resolve | Plan per severity | > SLA |
| Incidents by category | Fraud, safety, payment, platform, other | Trending | Spike > 2x weekly avg |
| Post-incident review completion | Reviews closed within 48h | 100% | < 100% |

### 5. Support Dashboard
**Owner**: Guest Support Lead
**Refresh**: Real-time / daily

| Metric | Definition | Target | Action Threshold |
|---|---|---|---|
| Open tickets by priority | P1/P2/P3/P4 counts | Balanced | P1/P2 > 0 after 1h |
| First response time (FRT) | Time to first response | Per priority SLA | > SLA 10% of tickets |
| Resolution time | Time to close | Per priority SLA | > SLA 10% of tickets |
| CSAT | Customer satisfaction score | > 4.0 / 5 | < 3.5 |
| Ticket volume by category | Refund, cancellation, host, technical, other | Trending | Category > 30% of volume |
| Agent backlog | Tickets per agent | Plan | > 120% of capacity |

### 6. Finance Dashboard
**Owner**: Finance Lead
**Refresh**: Daily, with weekly and monthly rollups

| Metric | Definition | Target | Action Threshold |
|---|---|---|---|
| Escrow balance | Total funds held | Reconciled | Any unreconciled amount |
| Pending payouts | Payouts queued for release | 0 backlog by release date | Any past-due |
| Payout failure rate | Failed payouts / total initiated | < 0.5% | > 2% |
| Refund processing time | Hours from approval to completion | < 48h | > 72h |
| Chargeback rate | Chargebacks / total transactions | < 0.5% | > 1% |
| Net revenue | Revenue after refunds and provider costs | Plan | < 90% of plan |
| Provider settlement variance | Difference vs expected settlement | 0 | > 1% of GMV |

## Exceptions
- Dashboards may be unavailable during data pipeline issues; operations continues via fallback reports.
- Custom dashboards may be created for fundraising, board, or investor updates.
- Metrics definitions must be updated only via a controlled change process to ensure consistency.

## KPIs
- Dashboard uptime / data freshness
- Action threshold trigger response rate
- Mean time from exception to assignment
- Review meeting completion rate

## Dependencies
- Founder_Dashboard.md
- Data warehouse / BI tool
- Support ticketing system
- Payment provider and escrow data
- Incident management system
- Risk_Register.md

## Best Practices
- Each dashboard must have an owner, a review cadence, and a defined action threshold.
- Focus on exceptions and trends, not raw numbers.
- Every metric should lead to a decision or action.
- Avoid dashboard overload; consolidate where possible.

## Review Frequency
Dashboard content reviewed monthly; thresholds reviewed quarterly.
