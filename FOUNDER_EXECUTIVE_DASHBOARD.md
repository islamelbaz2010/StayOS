# FOUNDER EXECUTIVE DASHBOARD — StayOS

**Prepared by:** Executive Product Director, COO, CTO, Operations Director  
**Date:** 2026-08-03  
**Purpose:** Define the metrics a founder needs every morning in under five minutes to operate the marketplace.

---

## 1. Dashboard Philosophy

A founder's morning dashboard must be ruthless. It shows only the numbers that determine whether the marketplace is alive or dying. It does not include vanity metrics. It can be a single page, a Slack report, or a spreadsheet at Stage 1. The goal is decision speed, not visual polish.

**Evidence from the repository:**
- `knowledge/marketplace/marketplace_health_kpis.md` — North Star and Tier 2 metrics
- `knowledge/marketplace/marketplace_lifecycle.md` — stage-appropriate metrics
- `LAUNCH_FINANCIAL_MODEL.md` — burn, runway, cash
- `CLOSED_ALPHA_EXECUTION_PLAN.md` — weekly targets

---

## 2. The 5-Minute View

The founder opens the dashboard every morning. It must answer, in order:

1. Are we running out of money?
2. Do we have enough listings?
3. Are guests booking?
4. Are we keeping hosts?
5. Did anything critical break overnight?

---

## 3. Required Metrics

### 3.1 North Star Metric

| Metric | Definition | Target | Why |
|--------|-----------|--------|-----|
| **Completed Quality Stays per Month** | Reservation nights completed with guest satisfaction ≥ 4.0 | ≥ 10 by end of Closed Alpha | Captures value for guests, hosts, and platform simultaneously. Cannot be gamed. |

### 3.2 Supply (Top Left)

| Metric | Definition | Target | Alert |
|--------|-----------|--------|-------|
| Verified listings | Listings that passed all three quality gates | ≥ 50 by Week 4 | < 30 = CRITICAL |
| Active listings | Listings with ≥ 1 available night in next 30 days | ≥ 80% of verified | < 70% = HIGH |
| Pending KYC | KYC submissions awaiting review | 0 > 24h old | > 10 = HIGH |
| Pending listing verification | Listings awaiting approval | 0 > 48h old | > 10 = HIGH |
| Days to first booking (median) | Days from listing live to first booking | ≤ 21 | > 30 = HIGH |

### 3.3 Demand (Top Center)

| Metric | Definition | Target | Alert |
|--------|-----------|--------|-------|
| Search-to-booking conversion | Bookings initiated / unique searches | ≥ 5% | < 3% = HIGH |
| New bookings (last 7 days) | Confirmed bookings | ≥ 5/week | 0 for 3 days = HIGH |
| Completed stays (last 7 days) | Stays completed with review | ≥ 2/week | 0 for 7 days = CRITICAL |
| Guest repeat rate | Second booking within 3 months | ≥ 20% | < 10% = MEDIUM |
| Founding guests activated | Warm contacts converted to booking | ≥ 5 | < 3 = MEDIUM |

### 3.4 Trust (Top Right)

| Metric | Definition | Target | Alert |
|--------|-----------|--------|-------|
| Average review score | Average of all completed-stay reviews | ≥ 4.0 | < 3.5 = CRITICAL |
| Verified reviews count | Reviews from completed stays | ≥ 3 by Week 4 | < 3 at Week 4 = HIGH |
| Open disputes | Active guest/host disputes | 0 > 72h old | > 2 = HIGH |
| Fraud cases open | Active fraud investigations | 0 > 7 days old | Any = HIGH |
| Critical incidents | P0/P1 incidents in last 24h | 0 | Any = CRITICAL |

### 3.5 Financial (Bottom Left)

| Metric | Definition | Target | Alert |
|--------|-----------|--------|-------|
| Cash on hand | Available cash in bank | ≥ 3 months burn | < 3 months = CRITICAL |
| Monthly burn | Total monthly expenses | ≤ EGP 420,000 | > EGP 500,000 = HIGH |
| Runway (months) | Cash / monthly burn | ≥ 6 | < 3 = CRITICAL |
| GMV (last 7 days) | Gross booking value | ≥ EGP 22,500/week | 0 for 7 days = HIGH |
| Take rate | Platform revenue / GMV | 13–17% | Outside range = MEDIUM |
| Pending payouts | Host payouts awaiting release | 0 > 48h old | > 10 = HIGH |

### 3.6 Operations (Bottom Center)

| Metric | Definition | Target | Alert |
|--------|-----------|--------|-------|
| Today's checkouts | Guests checking out today | — | Late checkout > 1h = HIGH |
| Today's check-ins | Guests checking in today | — | Property not ready 1h before = HIGH |
| Same-day turnovers | Checkout and check-in same day | < 4h window flagged | Any flagged = HIGH |
| Open support tickets | Support tickets not closed | 0 CRITICAL > 15m | Any CRITICAL = CRITICAL |
| Support SLA | % tickets within SLA | ≥ 95% | < 90% = HIGH |

### 3.7 Pipeline (Bottom Right)

| Metric | Definition | Target | Alert |
|--------|-----------|--------|-------|
| Supply pipeline | Qualified leads in progress | ≥ 20 | < 10 = MEDIUM |
| Demand pipeline | Potential guests in progress | ≥ 30 | < 10 = MEDIUM |
| Broker/agency partners | Active partners | ≥ 3 | < 3 = MEDIUM |
| Corporate leads | Corporate travel leads | ≥ 5 | < 2 = LOW |

---

## 4. Daily Morning Routine

### 4.1 1-Minute Health Check

The founder scans the 5-minute view for red alerts. If any CRITICAL alert is present, the rest of the routine stops and the alert is handled.

### 4.2 3-Minute Trend Review

The founder compares the last 7 days to the prior 7 days for:

- Verified listings
- Active listings
- New bookings
- Completed stays
- GMV
- Cash

Any negative trend triggers a 15-minute diagnostic.

### 4.3 1-Minute Action List

The dashboard generates a daily action list:

- Top 3 supply actions (calls to make, leads to follow up).
- Top 3 demand actions (guests to contact, campaigns to run).
- Top 3 operational actions (tickets to close, verifications to approve).
- Top 1 financial action (payout to release, refund to approve).

---

## 5. Weekly Deep Dive

Once per week (Monday morning, 30 minutes), the founder reviews:

1. **KPI trend chart** (last 4 weeks) for North Star and Tier 2 metrics.
2. **Cohort analysis** — new hosts vs. returning hosts, new guests vs. repeat guests.
3. **Financial burn vs. revenue** — runway and cash position.
4. **Operational incident log** — all P0/P1 and unresolved disputes.
5. **Pipeline review** — top 10 supply and demand leads.

---

## 6. Alert Rules

| Alert Level | Response Time | Examples |
|-------------|---------------|----------|
| CRITICAL | Immediate | Cash < 3 months, P0 incident, < 30 listings, < 3.5 review score |
| HIGH | Same day | > 10 pending KYC, active listing rate < 70%, 0 bookings 3 days, burn > EGP 500k |
| MEDIUM | 24–48h | < 10 supply leads, guest repeat < 10%, take rate outside range |
| LOW | Weekly review | < 5 corporate leads, SEO traffic low |

---

## 7. Dashboard Format

### 7.1 Stage 1 Format

At Stage 1, the dashboard can be a Google Sheet or Notion page updated manually once per day. It must include:

- 5-minute view table.
- Daily action list.
- 7-day trend chart.
- Alert log.

### 7.2 Stage 2 Format

When the team exceeds 5 people, the dashboard should be a single internal page in the operations dashboard with:

- Real-time numbers where possible.
- 7-day and 30-day trends.
- Automated alerts via WhatsApp or email.

### 7.3 Mobile-First

The founder will often check the dashboard on mobile. The 5-minute view must render cleanly on a phone screen.

---

## 8. Metrics to Exclude

The following metrics are excluded from the founder dashboard because they are either vanity, too early, or misleading at Stage 1:

| Excluded Metric | Reason |
|-----------------|--------|
| Total registered users | Cumulative, can only go up |
| Total page views | Not a leading indicator |
| Social media followers | Vanity until demand converts |
| App downloads | No app in Stage 1 |
| NPS | Statistically meaningless below n=50 |
| Profit | Stage 1 is not profitable by design |
| RevPAR | Not enough data |

---

## 9. Implementation

The founder dashboard is built as part of the **Operations Dashboard** described in `OPERATIONS_DASHBOARD_REQUIREMENTS.md`. It is a read-only view with drill-down links to the underlying queues.

---

## 10. Example Morning Snapshot

```
Supply
- Verified listings: 52 (+5 this week)
- Active listings: 44/52 (85%)
- Pending KYC: 3 (oldest 18h)
- Days to first booking (median): 16

Demand
- Search-to-booking: 6.2%
- New bookings (7d): 7
- Completed stays (7d): 4
- Repeat rate: 22%

Trust
- Average review: 4.4
- Verified reviews: 8
- Open disputes: 1 (72h old)
- Fraud cases: 0

Financial
- Cash: EGP 6,200,000
- Monthly burn: EGP 420,000
- Runway: 14.8 months
- GMV (7d): EGP 31,500
- Take rate: 14.2%

Operations
- Today's checkouts: 3
- Today's check-ins: 2
- Same-day turnovers: 1 (4.5h window — OK)
- Open support tickets: 4 (0 CRITICAL)

Pipeline
- Supply leads: 24
- Demand leads: 31
- Broker/agency partners: 4
- Corporate leads: 3

Alerts: 1 MEDIUM — one dispute approaching 72h. Action: call guest today.
```
