# Founder Dashboard

## Purpose
Provide the Founder and executive team with a concise weekly view of business health, marketplace momentum, financial performance, and top risks.

## Scope
Covers high-level metrics and signals that require founder attention or decision. Operational drill-down data lives in Operations_Dashboard.md.

## Owner
COO / Finance Lead

## Inputs
- Marketplace transaction data
- Payment provider settlements
- Support and dispute systems
- Host and guest analytics
- Escrow ledger
- Risk register updates

## Outputs
- Weekly executive summary
- Trend charts and exception alerts
- Decision recommendations
- Risk review slides

## Workflow
1. Data is refreshed automatically every 24 hours.
2. COO reviews the dashboard each Monday at 09:00 and prepares an executive narrative.
3. Founder reviews dashboard before the weekly executive meeting.
4. Items outside target ranges trigger action items owned by function leads.
5. Top risks are logged and reviewed against Risk_Register.md.

## Dashboard Sections

### 1. GMV (Gross Merchandise Value)
- Definition: Total booking value transacted on platform before fees and refunds.
- Formula: `sum(reservation.total_amount)` for confirmed or completed stays.
- Target: Launch baseline + 10% week-over-week for first 12 weeks.
- Visualization: Weekly trend, by market.

### 2. Revenue
- Definition: Platform take from service fees and host commission.
- Formula: `GMV * take rate - refunds - chargebacks - payment provider costs`.
- Target: Positive unit economics trend; gross margin > target by month 6.
- Visualization: Weekly revenue, by fee type.

### 3. Bookings
- Definition: Confirmed bookings (payment received or escrow funded).
- Formula: Count of `reservation.status = confirmed / completed`.
- Target: Grow weekly; benchmark against search conversion.
- Visualization: Weekly confirmed bookings and cancellation rate.

### 4. Occupancy
- Definition: Percentage of available nights booked.
- Formula: `booked nights / (booked nights + available nights)` over a trailing 30-day window.
- Target: > 30% by month 3, > 50% by month 6.
- Visualization: Occupancy by market and by property type.

### 5. Host Growth
- Definition: Net new verified and active hosts.
- Formula: Count of hosts with approved listing and at least one booking window.
- Target: Align with supply-liquidity plan for launch city.
- Visualization: Weekly new hosts, activation rate, churn.

### 6. Guest Growth
- Definition: Net new KYC-verified guests with at least one search or booking.
- Formula: Count of unique guests with verified status and engagement.
- Target: Match demand generation spend and conversion plan.
- Visualization: Weekly new guests, repeat rate, CAC.

### 7. Support SLA
- Definition: Percentage of tickets meeting first-response and resolution SLAs.
- Formula: `tickets within SLA / total tickets * 100`.
- Target: First response SLA > 90% within target time by priority.
- Visualization: SLA compliance by priority, backlog trend.

### 8. Refund Rate
- Definition: Refunded value as a percentage of GMV.
- Formula: `total refund amount / GMV * 100`.
- Target: < 5% in stable operations.
- Visualization: Weekly refund rate by reason.

### 9. Dispute Rate
- Definition: Opened disputes per 100 completed bookings.
- Formula: `disputes opened / completed bookings * 100`.
- Target: < 1%.
- Visualization: Dispute rate, resolution time, outcome split.

### 10. Escrow Balance
- Definition: Total funds held in escrow awaiting release or refund.
- Formula: `sum(escrow.balance)` reconciled daily.
- Target: Aligned with payout schedule; no unreconciled drift.
- Visualization: Escrow balance, pending release aging.

### 11. Conversion Funnel
- Stages: Search → Listing view → Booking initiated → Payment → Confirmed → Checked-in.
- Target: Identify largest drop-off and assign product/ops improvement owner.
- Visualization: Funnel conversion rates week-over-week.

### 12. Top Risks
- Auto-pull top 5 open risks from Risk_Register.md.
- Show probability, impact, owner, and last update.
- Trigger executive action if any risk escalates.

### 13. Weekly Health Score
- Composite score from GMV growth, occupancy, SLA, refund rate, dispute rate, host/guest growth, and escrow reconciliation.
- Target: > 80/100 = healthy; 60–80 = watch; < 60 = executive review required.
- Formula: weighted average of normalized KPI performance vs target.

## Exceptions
- One-time events (large partnerships, PR spikes) should be annotated on the dashboard.
- Founder may request ad-hoc views for fundraising, board, or investor updates.
- Missing or delayed data should be flagged rather than silently assumed.

## KPIs
- Weekly Health Score
- GMV and revenue growth rate
- Host and guest growth rates
- Conversion rate by funnel stage
- Refund and dispute rates
- Escrow reconciliation variance

## Dependencies
- Data warehouse / reporting pipeline
- Finance and escrow systems
- Support ticketing data
- Booking and search analytics
- Risk_Register.md

## Best Practices
- Keep the dashboard to one page of charts plus a narrative.
- Highlight exceptions, not averages.
- Use the same definitions week-to-week to avoid metric drift.
- Tie every metric to an owner and a target.

## Review Frequency
Weekly, every Monday.
