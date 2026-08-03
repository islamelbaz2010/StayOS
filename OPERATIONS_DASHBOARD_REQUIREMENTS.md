# OPERATIONS DASHBOARD REQUIREMENTS — StayOS

**Prepared by:** Executive Marketplace Operations Board  
**Date:** 2026-08-03  
**Purpose:** Define the internal operations dashboard that the software must support for Closed Alpha.

---

## 1. Dashboard Principles

The operations dashboard is the command center for the marketplace. It is not guest-facing and not host-facing. It is for internal teams who verify, moderate, support, and operate the marketplace.

**Evidence from the repository:**
- `knowledge/operations/daily_operations_runbook.md` — operations clock, daily reviews
- `knowledge/operations/escalation_matrix.md` — escalation paths
- `knowledge/operations/incident_management.md` — incident classification and response
- `knowledge/trust/fraud_detection.md` — fraud registry and investigation

**Design constraints:**
- No UI design is required in this document.
- Focus on pages, permissions, actions, data, alerts, queues, and reports.
- Dashboard must support Arabic and English where required.

---

## 2. User Roles and Permissions

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Founder / CEO** | All pages, all actions, all data | Strategic decisions, escalations |
| **Operations Manager** | Operations, support, listings, host management | Daily operations, escalations |
| **Supply Manager** | Supply pipeline, listings, host onboarding | Sourcing and onboarding |
| **Host Success Manager** | Hosts, listings, reviews, messages | Host activation and retention |
| **Trust & Safety Lead** | KYC, listings, fraud, disputes, suspensions | Verification and safety |
| **KYC Reviewer** | KYC queue, host documents, claim reviews | Identity verification |
| **Support Lead** | Support tickets, refunds, communications | Support and escalations |
| **Support Agent** | Support tickets (assigned), limited refunds | First-line support |
| **Finance Lead** | Payouts, escrow, ledger, refunds | Treasury and reconciliation |
| **Field Staff** | Turnover tasks, photo upload, inspection reports | Field operations |
| **Read-Only Analyst** | Dashboards, reports, no actions | Reporting and analysis |

---

## 3. Required Pages

### 3.1 Overview / Command Center

**Purpose:** Single-screen view of marketplace health for the day.

**Required data:**
- Today's checkouts and check-ins
- Active listings count
- Pending KYC count
- Pending listing verification count
- Open support tickets by priority
- Active bookings
- Escrow balance
- Today's operational alerts

**Actions:**
- Drill down to any queue
- Mark incidents
- View on-call status

**Alerts:**
- Same-day turnover with < 4-hour window
- Any CRITICAL or HIGH support ticket open > 15 min
- KYC queue > 24h old
- Listing verification queue > 48h old

### 3.2 Supply Pipeline

**Purpose:** Track leads, sourcing progress, and conversion.

**Required data:**
- Leads by source and status
- Leads by channel (individual, property manager, broker, hotel)
- Conversion funnel (lead → qualified → onboarding → live)
- Weekly and monthly targets
- Supply manager activity

**Actions:**
- Add new lead
- Update lead status
- Assign lead owner
- Schedule call
- Mark deal won/lost
- Export pipeline

**Alerts:**
- Lead > 48h without owner
- Lead > 7 days in qualification
- Target shortfall with < 7 days left

### 3.3 Host Onboarding Queue

**Purpose:** Manage host progress from registration to listing live.

**Required data:**
- Hosts by onboarding stage
- Days since registration
- Missing documents
- KYC status
- Listing verification status
- Assigned onboarding specialist

**Actions:**
- View host profile
- Send WhatsApp/email reminder
- Mark onboarding stage
- Reassign specialist
- Escalate at-risk host

**Alerts:**
- Host registered > 7 days, no documents
- Host > 14 days, listing not live
- Host stuck at any stage > 72h

### 3.4 KYC Review Queue

**Purpose:** Review and approve/reject host and guest identity documents.

**Required data:**
- Pending KYC submissions
- Document images
- OCR extracted data
- Selfie and face-match score
- Submission timestamp
- Host/guest phone and name

**Actions:**
- Approve KYC
- Reject KYC with reason
- Request additional documents
- Escalate to Trust & Safety
- View KYC history

**Alerts:**
- KYC pending > 4h
- Manual review queue > 24h
- Rejected KYC without host follow-up

### 3.5 Listing Verification Queue

**Purpose:** Review and approve listings before they go live.

**Required data:**
- Pending listings
- Photos
- Property details
- Host KYC status
- Verification notes
- Quality score
- Inspection reports

**Actions:**
- Approve listing
- Reject listing with reason
- Request changes
- Schedule inspection
- Mark inspection pass/fail
- Set listing state

**Alerts:**
- Listing pending > 48h
- Listing with failed inspection not re-checked
- High-quality listings awaiting approval

### 3.6 Listing Import / Claim Queue

**Purpose:** Manage bulk imports and ownership claims.

**Required data:**
- Bulk import jobs (CSV upload, status, errors)
- Claim requests
- Seeded listings
- Ownership proof documents
- Duplicate detection results

**Actions:**
- Upload CSV
- Validate CSV
- Run import
- Review claim
- Approve/reject claim
- Transfer ownership
- Merge duplicates

**Alerts:**
- Import job failed
- Claim pending > 24h
- Duplicate detected

### 3.7 Support Ticket Queue

**Purpose:** Manage guest and host support requests.

**Required data:**
- Open tickets by priority
- Ticket SLA status
- Guest/host details
- Booking details
- Conversation history
- Assigned agent

**Actions:**
- Assign ticket
- Reply via WhatsApp/email
- Apply goodwill credit
- Initiate refund
- Escalate to Operations or T&S
- Close ticket

**Alerts:**
- CRITICAL ticket open > 15 min
- HIGH ticket open > 1h
- MEDIUM ticket open > 4h
- Ticket unassigned > 30 min

### 3.8 Operations / Turnover Board

**Purpose:** Manage daily checkouts, turnovers, and check-ins.

**Required data:**
- Today's bookings
- Check-out times
- Check-in times
- Assigned cleaners
- Turnover status
- Property readiness status
- Same-day turnover warnings

**Actions:**
- Assign cleaner
- Confirm checkout
- Start/complete turnover
- Mark property ready
- Contact guest/host
- Escalate late turnover

**Alerts:**
- Same-day turnover < 4h
- Cleaner not confirmed by 07:00
- Property not ready 1h before check-in

### 3.9 Finance / Payout Queue

**Purpose:** Manage escrow, payouts, refunds, and ledger.

**Required data:**
- Pending payouts
- Escrow balances
- Refund requests
- Chargebacks
- Transaction ledger
- Host payout history

**Actions:**
- Approve payout
- Hold payout
- Process refund
- Mark chargeback status
- View ledger entry
- Export reconciliation report

**Alerts:**
- Payout pending > 48h
- Refund request > 4h without action
- Chargeback received

### 3.10 Trust & Safety / Fraud Board

**Purpose:** Investigate fraud, disputes, suspensions, and appeals.

**Required data:**
- Fraud alerts and cases
- Dispute tickets
- Suspended accounts
- Ban appeals
- Incident reports
- Evidence packages

**Actions:**
- Open fraud investigation
- Suspend/ban account
- Appeal review
- Mark dispute resolved
- Add evidence
- Notify affected parties

**Alerts:**
- New fraud alert
- Dispute > 24h
- Suspended host with upcoming booking

### 3.11 Reviews and Ratings

**Purpose:** Monitor and moderate reviews.

**Required data:**
- Reviews pending moderation
- Average scores by listing
- Flagged reviews
- Review response history

**Actions:**
- Approve review
- Remove review
- Flag for investigation
- Respond as host
- Request host response

**Alerts:**
- Review flagged as suspicious
- 1–2 star review posted

### 3.12 Analytics / Reports

**Purpose:** Track marketplace health and operational performance.

**Required data:**
- North Star: Completed Quality Stays
- Active listing rate
- Search-to-booking conversion
- Days to first booking
- Host retention
- Guest repeat rate
- GMV per active listing
- Take rate
- Support ticket volume and SLA
- Payout turnaround

**Actions:**
- Filter by date, geography, segment
- Export report
- Schedule automated report

---

## 4. Alerts

### 4.1 Real-Time Alerts

| Alert | Trigger | Recipient | Action Required |
|-------|---------|-----------|-----------------|
| CRITICAL ticket created | Priority = CRITICAL | Support Lead, Operations Manager | Respond within 15 min |
| Same-day turnover short window | Checkout/check-in < 4h | Operations Manager | Reassign/reposition cleaner |
| Cleaner not confirmed | 07:00, no confirmation | Operations Agent | Call cleaner, dispatch backup |
| Property not ready | 1h before check-in | Operations Manager | Dispatch field staff or relocate |
| KYC queue aging | Pending > 4h | KYC Reviewer | Review immediately |
| Listing verification aging | Pending > 48h | Trust & Safety Lead | Review or reassign |
| Fraud signal detected | Risk score threshold | Trust & Safety Lead | Open investigation |
| Chargeback received | Any chargeback | Finance + T&S | Prepare evidence |
| Payout pending | > 48h since check-in + 24h | Finance Lead | Approve or hold |
| Host high churn risk | No booking in 21 days | Host Success Manager | Intervene |

### 4.2 Daily Reports

| Report | Time | Recipient | Content |
|--------|------|-----------|---------|
| Morning Operations Brief | 06:00 | Operations Manager | Today's checkouts/check-ins, open tickets, pending KYC, listing queue |
| Supply Pipeline Report | 09:00 | Supply Director | Leads, conversion, target shortfall |
| Support SLA Report | 18:00 | Support Lead | Ticket volume, SLA breaches, open escalations |
| Finance Reconciliation | 20:00 | Finance Lead | Payouts, refunds, escrow, chargebacks |
| Marketplace Health | 22:00 | Founder + Leadership | North Star and Tier 2 KPIs |

---

## 5. Queues and SLA

| Queue | Owner | Target SLA | Escalation |
|-------|-------|------------|------------|
| KYC review | KYC Reviewer | < 4h manual, immediate auto | Trust & Safety |
| Listing verification | Trust & Safety | < 48h | Operations Manager |
| Listing claim | Operations Specialist | < 24h | Supply Director |
| Support tickets | Support Agent | 15m–24h by priority | Support Lead / Operations |
| Turnover tasks | Operations Agent | < 4h | Operations Manager |
| Payouts | Finance | 24–48h after check-in | Finance Lead |
| Refunds | Support Lead | < 4h high, 24h medium | Finance / T&S |
| Fraud investigation | Trust & Safety | < 24h initial, 72h resolve | Founder |
| Disputes | Trust & Safety | < 24h initial contact, 72h resolution | Founder |

---

## 6. Required Data Sources

The dashboard must pull from:

- `auth.users`, `auth.accounts`, `auth.kyc_documents`
- `pms.units`, `pms.unit_listings`, `pms.calendar_rules`, `pms.unit_photos`
- `reservation.reservations`, `reservation.payment_intents`, `reservation.promo_codes`
- `finance.wallets`, `finance.escrow`, `finance.ledger`, `finance.payouts`
- `operations.turnover_tickets`, `operations.field_tasks`
- Support ticket system (external or internal table)
- Notification delivery logs
- Fraud and incident registry

---

## 7. Reporting Requirements

### 7.1 Daily Operations Report

- Checkouts today
- Check-ins today
- Same-day turnovers
- Turnover status
- Open support tickets by priority
- KYC pending count
- Listing verification pending count
- Active listings
- New listings today
- New bookings today
- Payouts today

### 7.2 Weekly Marketplace Health Report

- Active listing rate
- Search-to-booking conversion
- Days to first booking (median)
- Host retention
- Guest repeat rate
- GMV per active listing
- Take rate
- Support ticket SLA
- Dispute rate
- Review score average

### 7.3 Monthly Executive Report

- North Star: Completed Quality Stays
- Verified listings by channel
- Bookings by segment
- Revenue and take rate
- Host NPS
- Guest NPS
- Churn and retention
- Operational cost per booking
- Key risks and escalations
