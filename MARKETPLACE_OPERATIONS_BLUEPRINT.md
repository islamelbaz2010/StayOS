# MARKETPLACE OPERATIONS BLUEPRINT — StayOS

**Prepared by:** Executive Marketplace Operations Board  
**Date:** 2026-08-03  
**Purpose:** Define the complete business operating model that the StayOS software must support during the Closed Alpha and Stage 1 marketplace launch.

---

## 1. Marketplace Lifecycle

StayOS follows the five-stage marketplace lifecycle defined in `knowledge/marketplace/marketplace_lifecycle.md`:

| Stage | Name | Listing Range | Booking Range | Focus |
|-------|------|---------------|---------------|-------|
| Stage 1 | Ignition | 0–50 | 0–100 | Supply acquisition, manual operations, trust manufacturing |
| Stage 2 | Liquidity | 50–500 | 100–1,000 | Search-to-booking conversion, geographic density |
| Stage 3 | Density | 500–5,000 | 1,000+ | Revenue optimization, GCC corridor |
| Stage 4 | Network | 5,000+ | 10,000+ | Organic growth, data advantages |
| Stage 5 | Dominance | Category leader | — | Brand default, AI personalization |

**Current state:** StayOS is at the beginning of Stage 1. The Closed Alpha is the bridge from zero to Stage 1 liquidity.

### Stage 1 Operating Principle

> The marketplace must move first. StayOS must subsidize supply, manufacture demand, and concentrate listings in one or two adjacent neighborhoods before any guest marketing.

This is supported by:
- `knowledge/marketplace/cold_start_playbook.md` — Five Cold Start Moves
- `knowledge/marketplace/marketplace_lifecycle.md` — Stage 1 rules
- `MARKETPLACE_SUPPLY_STRATEGY.md` — cold start and seed inventory plan
- `SPRINT3_RECOMMENDATIONS.md` — Sprint 3 re-scope to supply enablement

---

## 2. Departments

### 2.1 Supply & Host Acquisition

**Mission:** Own listing count, listing quality, and host relationships.

**Responsibilities:**
- Source institutional supply (property managers, serviced apartments, small hotels).
- Source individual hosts through outbound and inbound channels.
- Run bulk import and claim workflows.
- Qualify leads and set onboarding appointments.
- Negotiate supply agreements and commission terms.
- Hit weekly and monthly listing targets.

**Key roles:**
- Supply Director
- Supply Managers (institutional vs. individual)
- Field Sourcing Agents
- Partnerships Manager

**Owned metrics:**
- Verified listings
- Active listings
- Days to first booking
- Host retention
- Listing quality score

### 2.2 Host Success

**Mission:** Convert prospects to published hosts, prevent churn, and grow host performance.

**Responsibilities:**
- Guide hosts through onboarding.
- Provide pricing and calendar coaching.
- Intervene before churn (days 14, 21, 30).
- Run host NPS and referral programs.
- Manage institutional partner accounts.

**Key roles:**
- Customer Success Director
- Host Success Managers
- Onboarding Specialists

**Owned metrics:**
- Onboarding completion rate
- Days listing live
- Host NPS
- Host retention
- Referral rate

### 2.3 Operations

**Mission:** Execute the daily marketplace clock — turnovers, check-ins, support, inventory integrity.

**Responsibilities:**
- Monitor today's checkouts and check-ins.
- Dispatch cleaning and field staff.
- Resolve same-day operational issues.
- Triage support tickets within SLA.
- Verify property readiness before first booking.

**Key roles:**
- Head of Operations
- Operations Manager
- Operations Agents
- Field Staff / Cleaners

**Owned metrics:**
- Turnover completion rate
- Check-in success rate
- Support ticket SLA
- On-time check-in rate

### 2.4 Trust & Safety

**Mission:** Keep guests, hosts, and the platform safe from fraud, harm, and policy violations.

**Responsibilities:**
- Review KYC documents.
- Verify listings and photos.
- Investigate fraud, disputes, and incidents.
- Suspend, ban, or appeal account decisions.
- Maintain fraud registry and evidence packages.

**Key roles:**
- Trust & Safety Director
- KYC Reviewers
- Fraud Investigators
- Dispute Resolution Specialists

**Owned metrics:**
- KYC approval rate
- Listing verification pass rate
- Fraud detection rate
- Dispute resolution time
- Chargeback rate

### 2.5 Support

**Mission:** Resolve guest and host issues quickly and within SLA.

**Responsibilities:**
- Handle inbound WhatsApp, email, and phone support.
- Escalate operational and safety issues.
- Apply goodwill credits and refunds within authority limits.
- Maintain communication templates in Arabic and English.

**Key roles:**
- Support Lead
- Support Agents (Arabic + English)
- Escalation Specialists

**Owned metrics:**
- First response time
- Resolution time
- CSAT
- Escalation rate

### 2.6 Finance & Payouts

**Mission:** Hold funds safely, release escrow, and settle payouts.

**Responsibilities:**
- Reconcile payments, escrow, and ledger.
- Approve and execute host payouts.
- Process refunds and chargebacks.
- Withhold taxes where required.
- Resolve payout disputes.

**Key roles:**
- Finance Lead
- Payout Operations
- Reconciliation Analyst

**Owned metrics:**
- Payout accuracy
- Payout turnaround time
- Refund rate
- Chargeback rate
- Escrow balance

### 2.7 Product & Engineering (Operational Interface)

**Mission:** Build and maintain the software that the operations teams use.

**Responsibilities (from an operations perspective):**
- Implement operational workflows in the admin/operations dashboard.
- Enable KYC review, listing moderation, claim/import tools.
- Provide operational reports and alerts.
- Fix bugs that block operations.

**Key roles:**
- Product Director
- Engineering Lead
- QA

**Owned metrics:**
- Operational tool uptime
- Bug resolution time
- Feature delivery against backlog

---

## 3. Responsibilities by Stage

| Stage | Supply | Host Success | Operations | Trust & Safety | Support | Finance |
|-------|--------|--------------|------------|----------------|---------|---------|
| **Prospect** | Source, qualify | Schedule intro | – | Pre-screen | Answer inbound | – |
| **Onboarding** | Sign agreement | Guide listing | Schedule inspection | KYC + doc review | Document questions | Verify payout account |
| **Activation** | – | Pricing/calendar coaching | Verify guest-ready | Listing verification | Host questions | – |
| **First booking** | – | Congratulate, set expectations | Coordinate turnover | Fraud watch | Guest pre-arrival | Hold escrow |
| **Growth** | – | Performance coaching | Turnover, support | Review disputes | Issue resolution | Release escrow, payout |
| **Maturity** | – | Monthly reports | Self-serve ops | Routine monitoring | Retention | Automated payout |
| **Churn risk** | Re-engage | Retention call | – | Investigation | – | Settle balance |

---

## 4. Operational Ownership

### 4.1 Process Ownership Matrix

| Process | Owner | Backup | Weekly Review |
|---------|-------|--------|---------------|
| Supply sourcing | Supply Director | Host Success Director | Yes |
| Host onboarding | Host Success Director | Operations Manager | Yes |
| Listing verification | Trust & Safety Director | Head of Operations | Yes |
| Turnover / cleaning | Head of Operations | Operations Manager | Daily |
| Guest check-in support | Support Lead | Operations Manager | Daily |
| Dispute resolution | Trust & Safety Director | Support Lead | Weekly |
| Payouts | Finance Lead | Head of Operations | Weekly |
| Quality review | Trust & Safety Director | Host Success Director | Weekly |

### 4.2 Decision Authority

| Decision Level | Owner | Examples |
|----------------|-------|----------|
| Tactical (< EGP 300) | Support Agent | Goodwill credit, date change |
| Operational (< EGP 1,000) | Operations Manager | Repair authorization, emergency hotel |
| Financial (refunds, payouts) | Support Lead / Finance Lead | Full refund, payout hold |
| Trust & Safety | T&S Lead | Account suspension, fraud ban |
| Strategic | Founder/CEO | Market expansion, policy change |

---

## 5. Daily Operations

### 5.1 The Operations Clock

Based on `knowledge/operations/daily_operations_runbook.md`:

| Time | Activity | Owner |
|------|----------|-------|
| 06:00 | Morning operations review — today's checkouts, check-ins, same-day turnovers | Operations Manager |
| 07:00 | Cleaner confirmations due for today's turnovers | Operations Agent |
| 08:00 | Checkout monitoring begins | Operations Agent |
| 10:00–14:00 | Peak turnover window | Field Staff / Cleaners |
| 14:00–20:00 | Peak check-in window | Support + Operations |
| 18:00 | Afternoon operations review | Operations Manager |
| 20:00 | Evening handoff to on-call | Operations Manager |
| 23:59 | End of operations day | On-call |

### 5.2 Morning Operations Review Checklist

1. **Check today's calendar**
   - Who is checking out? At what time?
   - Who is checking in? At what time?
   - Any same-day turnovers with < 4 hours between checkout and check-in?

2. **Confirm cleaning team assignments**
   - Is a cleaner assigned and confirmed for each turnover?
   - If no confirmation by 07:00, call and escalate.

3. **Review open support tickets**
   - Any CRITICAL or HIGH tickets unresolved overnight?
   - Any host/guest complaints requiring follow-up today?

4. **Check system health**
   - Platform health endpoint OK?
   - Payment processing operational?
   - Notifications delivered?

### 5.3 Turnover Standard

Every checkout must be followed by a completed, verified turnover before the next check-in. For same-day turnovers, the minimum window is 4 hours.

### 5.4 Support SLA

| Priority | Response Time | Resolution Target | Examples |
|----------|---------------|-------------------|----------|
| CRITICAL | 15 min | 2h | Locked out, no power/water, safety threat |
| HIGH | 1h | 4h | Cleanliness dispute, wrong amenity, access issue |
| MEDIUM | 4h | 24h | Complaint, pricing question, request |
| LOW | 24h | 72h | Feedback, non-urgent query |

---

## 6. KPIs

### 6.1 North Star Metric

**Completed Quality Stays per Month** — reservation nights completed with guest satisfaction ≥ 4.0.

### 6.2 Tier 2 Health Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Active listing rate | ≥ 80% | Supply / Host Success |
| Search-to-booking conversion | ≥ 5% (Stage 1) | Product / Marketing |
| Days to first booking | ≤ 21 days | Host Success |
| Guest repeat rate (3-month cohort) | ≥ 20% | Customer Success |
| Host retention (monthly) | ≥ 90% | Host Success |
| GMV per active listing | EGP 8,000–15,000/month | Finance |
| Platform take rate | 13–17% | Finance |

### 6.3 Operational Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| On-time turnover | ≥ 95% | Operations |
| Check-in success rate | ≥ 98% | Operations |
| Support first response time (median) | < 30 min | Support |
| KYC review turnaround | < 24h (Stage 1) | Trust & Safety |
| Listing verification turnaround | < 48h | Trust & Safety |
| Payout turnaround | 24–48h after check-in | Finance |

### 6.4 Closed Alpha Targets

| Metric | Target | Date |
|--------|--------|------|
| Verified listings | 50–100 | Week 4 |
| Active listings | ≥ 80% of verified | Week 4 |
| First 10 manual transactions | 10 | Week 4 |
| Completed stays with review | ≥ 5 | Week 4 |
| Host NPS | ≥ 50 | Week 4 |

---

## 7. Escalation Paths

### 7.1 Escalation Matrix

Based on `knowledge/operations/escalation_matrix.md`:

| Issue | First Responder | Escalate To | When |
|-------|----------------|-------------|------|
| Guest can't find address | Support Agent | – | Never |
| Access code not working | Support Agent | Operations Manager | > 15 min |
| Guest locked out, host unreachable | Support + Ops Manager | Founder | > 30 min or safety risk |
| AC/water/electricity failure | Support Agent | Operations Manager | > 30 min |
| Property not as described (major) | Support Agent | Trust & Safety | Immediately |
| Guest physical safety threat | Ops Manager + Founder | Emergency services | Immediately |
| Cleaner no-show | Operations Agent | Operations Manager | Immediately |
| Turnover late (< 1h to check-in) | Operations Manager | Founder | > 3 properties in crisis |
| Host unreachable at check-in | Support Agent | Operations Manager | > 15 min |
| Guest damage claim | Support Agent | Trust & Safety | All claims |
| Refund request > EGP 300 | Support Agent | Support Lead | Immediately |
| Fraud suspected | Trust & Safety | Founder | Major fraud or > EGP 5,000 |
| Platform API down | Engineering On-Call | Founder | P0 incident |
| Payment processing failure | Engineering On-Call | Founder | > 15 min or > 5 users |

### 7.2 Authority Limits

| Role | Max Goodwill Credit | Max Refund | Max Repair | Max Emergency Hotel |
|------|---------------------|------------|------------|---------------------|
| Support Agent | EGP 300 | – | – | – |
| Support Lead | – | Full booking value | – | – |
| Operations Manager | – | – | EGP 1,000 | EGP 800/night |
| Trust & Safety Lead | – | Full refund for safety/fraud | – | – |
| Founder | Unlimited | Unlimited | Unlimited | Unlimited |

---

## 8. Operating Model Assumptions

1. **Closed Alpha is manual-first.** Technology supports operations; operations do not wait for perfect automation.
2. **Supply is the scarce side.** All operational effort in Stage 1 is biased toward host enablement.
3. **Trust is manufactured, not assumed.** Verification, reviews, and rapid dispute resolution create trust.
4. **Geographic concentration is mandatory.** No expansion beyond the first 1–2 neighborhoods until 15+ bookable options exist there.
5. **Guest-ready checks are non-negotiable.** A listing goes live only after passing all three quality gates.
