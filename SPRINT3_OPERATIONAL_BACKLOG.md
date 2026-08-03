# SPRINT 3 OPERATIONAL BACKLOG — StayOS

**Prepared by:** Executive Marketplace Operations Board  
**Date:** 2026-08-03  
**Purpose:** Define the operational stories the software must support after this stage, prioritized by business value.

---

## 1. Backlog Principles

This backlog contains only operational requirements. It does not include infrastructure, DevOps, CI/CD, or pure engineering tasks. Every item must directly enable the Closed Alpha and Stage 1 marketplace operations.

**Evidence from the repository:**
- `SPRINT3_RECOMMENDATIONS.md` — Sprint 3 re-scope to supply enablement
- `knowledge/customer_success/host_lifecycle.md` — host onboarding and success
- `knowledge/operations/daily_operations_runbook.md` — operations clock
- `knowledge/trust/identity_verification_guide.md` — KYC operations
- `knowledge/trust/fraud_detection.md` — fraud workflow

---

## 2. P0 — Must Have for Closed Alpha

| ID | Story | Business Value | Evidence |
|----|-------|----------------|----------|
| **OP-01** | As a Supply Manager, I can add a lead, assign an owner, and track status so that the supply pipeline is visible. | Without pipeline tracking, leads are lost and targets are missed. | `SUPPLY_ACQUISITION_PLAYBOOK.md` lead sources and routing. |
| **OP-02** | As a Supply Manager, I can view all leads by channel (individual, property manager, broker, hotel, agency) so that I can prioritize institutional partners. | Institutional supply is 10x faster than individual. | `knowledge/marketplace/cold_start_playbook.md` — Move 1. |
| **OP-03** | As an Onboarding Specialist, I can view a host's onboarding stage and missing documents so that I can follow up before churn. | Hosts churn after 14 days without progress. | `knowledge/customer_success/host_lifecycle.md` — Stage 2 intervention. |
| **OP-04** | As a KYC Reviewer, I can review ID documents, selfie match scores, and approve/reject with a reason so that verified hosts can list. | KYC is a hard blocker for publishing. | `knowledge/trust/identity_verification_guide.md`. |
| **OP-05** | As a Listing Verifier, I can view photos, property details, inspection reports, and set listing state (draft, pending, listed, suspended) so that only quality listings go live. | Quality gates prevent trust failures. | `knowledge/hospitality/property_quality_standards.md` — three-gate system. |
| **OP-06** | As an Operations Specialist, I can upload a CSV of properties and create draft listings so that property manager portfolios can be imported. | Bulk import is required for institutional supply. | `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` bulk CSV. |
| **OP-07** | As an Operations Specialist, I can create an unclaimed listing and invite an owner to claim it so that supply can be seeded before hosts self-register. | Claim workflow flips the supply funnel. | `MARKETPLACE_SUPPLY_STRATEGY.md` claim listing workflow. |
| **OP-08** | As a Trust & Safety Lead, I can review ownership claims and approve/reject them so that listings are not hijacked. | Prevents fraud and ownership disputes. | `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` claim review criteria. |
| **OP-09** | As a Host Success Manager, I can see a host's days-to-first-booking and trigger interventions (pricing review, discount voucher, featured placement) so that new hosts do not churn. | Churn after 21 days is 80%+. | `knowledge/customer_success/host_lifecycle.md` — Stage 3. |
| **OP-10** | As an Operations Manager, I can view today's checkouts, check-ins, and same-day turnovers so that no booking is missed. | Daily operations clock is the heartbeat of the marketplace. | `knowledge/operations/daily_operations_runbook.md`. |
| **OP-11** | As a Support Lead, I can triage support tickets by priority and assign them to agents so that SLAs are met. | Support SLA is a trust signal. | `knowledge/operations/escalation_matrix.md`. |
| **OP-12** | As a Finance Lead, I can view pending payouts, approve them, and hold them for investigation so that hosts are paid correctly and on time. | Payout timing is the #1 host retention driver. | `knowledge/finance/payout_operations.md`. |
| **OP-13** | As a Trust & Safety Lead, I can suspend a host or listing and document the reason so that bad actors are removed quickly. | Fraud and safety incidents must be contained. | `knowledge/trust/fraud_detection.md`. |

## 3. P1 — Should Have for Closed Alpha

| ID | Story | Business Value | Evidence |
|----|-------|----------------|----------|
| **OP-14** | As a Supply Manager, I can view conversion funnel metrics (lead → qualified → onboarding → live) so that I can fix bottlenecks. | Conversion tracking improves supply acquisition efficiency. | `SUPPLY_ACQUISITION_PLAYBOOK.md` conversion benchmarks. |
| **OP-15** | As an Onboarding Specialist, I can schedule and record property inspections so that verification is tracked. | Physical verification is a quality gate. | `HOST_ONBOARDING_OPERATIONS.md` property verification. |
| **OP-16** | As a Listing Verifier, I can run duplicate detection by phone, coordinates, and photo hash so that the catalog is clean. | Duplicates harm search and trust. | `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` duplicate detection. |
| **OP-17** | As a Host Success Manager, I can send WhatsApp reminders and log calls with hosts so that follow-up is recorded. | Personal contact is the best churn prevention. | `knowledge/customer_success/host_lifecycle.md`. |
| **OP-18** | As a Support Agent, I can issue a goodwill credit up to EGP 300 so that small issues are resolved quickly. | Speed of resolution builds trust. | `knowledge/operations/escalation_matrix.md` authority limits. |
| **OP-19** | As an Operations Manager, I can assign cleaners and confirm turnover completion so that properties are guest-ready. | Turnover failures ruin check-ins. | `knowledge/operations/daily_operations_runbook.md`. |
| **OP-20** | As a Finance Lead, I can process refunds and chargebacks and attach evidence so that financial disputes are auditable. | Refund handling is a legal and trust requirement. | `knowledge/finance/refund_and_chargeback.md`. |
| **OP-21** | As a Trust & Safety Lead, I can view a fraud registry and add evidence so that fraud patterns are tracked. | Fraud patterns evolve; the registry must grow. | `knowledge/trust/fraud_detection.md`. |
| **OP-22** | As a Support Lead, I can escalate a ticket to Operations or Trust & Safety with one action so that SLAs are preserved. | Escalation speed is a safety requirement. | `knowledge/operations/escalation_matrix.md`. |
| **OP-23** | As an Analyst, I can view the North Star and Tier 2 KPIs on a dashboard so that operational decisions are data-driven. | Metrics prevent vanity decision-making. | `knowledge/marketplace/marketplace_health_kpis.md`. |

## 4. P2 — Could Have for Closed Alpha

| ID | Story | Business Value | Evidence |
|----|-------|----------------|----------|
| **OP-24** | As a Host, I can complete KYC and listing creation myself so that self-serve onboarding begins. | Reduces ops burden as volume grows. | `HOST_ONBOARDING_OPERATIONS.md` onboarding funnel. |
| **OP-25** | As an Operations Specialist, I can bulk update pricing or availability for a portfolio so that property managers can manage many units. | Required for institutional scale. | `SUPPLY_ACQUISITION_PLAYBOOK.md` property managers. |
| **OP-26** | As a Trust & Safety Lead, I can view reverse-image search results for listing photos so that photo fraud is caught. | Photo fraud is a leading trust failure. | `TRUST_AND_SAFETY_OPERATIONS.md` photo review. |
| **OP-27** | As a Support Lead, I can view guest and host communication history in one place so that disputes are resolved quickly. | Context reduces resolution time. | `knowledge/support/support_workflows.md`. |
| **OP-28** | As a Host Success Manager, I can run a host NPS survey and track referrals so that the referral program works. | Referrals lower supply CAC. | `knowledge/customer_success/host_lifecycle.md` — Stage 6. |
| **OP-29** | As a Finance Lead, I can generate a daily reconciliation report (payments, escrow, payouts) so that treasury is auditable. | Financial accuracy is non-negotiable. | `knowledge/finance/escrow_model.md`. |
| **OP-30** | As an Operations Manager, I can receive automated alerts for same-day turnovers, unconfirmed cleaners, and pending KYC so that nothing is missed. | Alerts prevent operational failures. | `OPERATIONS_DASHBOARD_REQUIREMENTS.md` alerts. |

## 5. P3 — Post-Alpha / Stage 2

| ID | Story | Business Value | Evidence |
|----|-------|----------------|----------|
| **OP-31** | As a Supply Manager, I can manage a broker program with commissions per completed booking. | Broker channel can scale supply. | `SUPPLY_ACQUISITION_PLAYBOOK.md` brokers. |
| **OP-32** | As a Host, I can see my performance dashboard (occupancy, revenue, reviews). | Host retention and maturity. | `knowledge/customer_success/host_lifecycle.md` — Stage 5. |
| **OP-33** | As a Guest, I can leave a verified review after checkout. | Reviews are the primary trust artifact. | `knowledge/marketplace/cold_start_playbook.md` — Move 4. |
| **OP-34** | As a Trust & Safety Lead, I can run automated fraud risk scoring on new listings and bookings. | Scales fraud detection as volume grows. | `knowledge/trust/fraud_detection.md`. |
| **OP-35** | As a Finance Lead, I can configure commission tiers by host type and geography. | Supports negotiated institutional rates. | `knowledge/finance/payout_operations.md`. |

## 6. Backlog Prioritization Summary

| Priority | Count | Focus |
|----------|-------|-------|
| P0 | 13 | Supply acquisition, KYC, listing verification, operations clock, support, payouts, suspensions |
| P1 | 10 | Conversion metrics, inspection tracking, duplicate detection, fraud registry, KPIs |
| P2 | 7 | Self-serve onboarding, bulk updates, photo fraud, communication history, referrals |
| P3 | 5 | Broker program, host dashboard, reviews, fraud scoring, commission tiers |

---

## 7. Dependencies

- **OP-01 to OP-08** require the admin dashboard to be built.
- **OP-04 and OP-08** require KYC and claim backend endpoints.
- **OP-06** requires bulk CSV import endpoint.
- **OP-10** requires booking and turnover data in the dashboard.
- **OP-12** requires payout backend and finance ledger.
- **OP-13** requires account suspension backend.
- **OP-23** requires analytics data and reporting backend.

---

## 8. Acceptance Criteria

A Sprint 3 operational story is complete when:

1. The workflow is supported by the operations dashboard.
2. The required roles can perform the action.
3. Data is persisted and auditable.
4. Alerts or SLAs are configured where applicable.
5. A trained operations user can execute the workflow without engineering help.

---

## 9. Executive Decision

### 9.1 Is StayOS operationally ready for Closed Alpha?

**NO — not yet.**

StayOS has strong planning and a mature technical foundation, but the operational capabilities to run a Closed Alpha are not in place. The following are missing:

- **No admin dashboard:** KYC review, listing verification, claim/import, support, and payout queues cannot be managed at scale without an internal dashboard.
- **No host onboarding UI:** Hosts cannot self-register, upload documents, create listings, or manage calendars.
- **No listing photo upload:** The `UnitPhoto` model exists, but the migration and endpoint are not verified as live.
- **No admin claim/import tools:** Supply cannot be seeded manually or in bulk.
- **No manual payment fallback:** Paymob/Stripe commercial IDs are unresolved; manual escrow (InstaPay/bank transfer) is not documented as operational.
- **No operations team hired:** The plan requires 12–14 people for the 4-week Closed Alpha. No team is currently in place.

**Conclusion:** StayOS is operationally ready to *design* the Closed Alpha, but not to *execute* it. Sprint 3 must build the operational tooling and begin team formation before the alpha can launch.

### 9.2 What business capabilities are still missing?

| Capability | Status | Evidence |
|------------|--------|----------|
| Admin operations dashboard | Missing | `OPERATIONS_DASHBOARD_REQUIREMENTS.md` defines requirements; no UI exists. |
| Host onboarding wizard | Missing | Host dashboard is a placeholder per `PROJECT_EXECUTIVE_REVIEW.md`. |
| Listing photo upload | Partial / unverified | `UnitPhoto` model exists; migration/endpoint status unclear. |
| Bulk listing import | Missing | Not in frontend or admin. |
| Claim listing workflow | Missing | No admin claim queue. |
| Manual booking/escrow fallback | Missing | Not documented as operational. |
| Operations team | Missing | No hiring or role assignments in repository. |
| Field staff / photographers | Missing | No team or roster. |
| WhatsApp Business templates | Partial | Templates exist in planning but not approved by Meta. |
| Paymob integration/iframe IDs | Missing | Commercial dependencies unresolved. |

### 9.3 Which Sprint 3 stories become mandatory?

The operational backlog above is the mandatory set for Sprint 3. The **P0 stories (OP-01 through OP-13)** are non-negotiable. In particular:

1. **OP-04 (KYC review)** and **OP-05 (listing verification)** — trust and quality gates.
2. **OP-06 (bulk CSV import)** and **OP-07/OP-08 (claim workflow)** — seeding supply.
3. **OP-09 (host success intervention)** — first booking and churn prevention.
4. **OP-10 (operations clock)** — daily marketplace execution.
5. **OP-12 (payout approval)** — host trust and retention.
6. **OP-13 (suspension)** — fraud and safety containment.

### 9.4 Which future ideas should remain postponed?

The following are **not** required for Closed Alpha and must remain postponed:

- Native iOS/Android mobile app.
- AI pricing, matching, or personalization.
- Channel manager sync (Airbnb, Booking.com, VRBO).
- Field operations automation and turnover tickets at scale.
- B2B SaaS subscription billing.
- Advanced analytics, BI dashboards, and data science.
- Real-time messaging (SSE/WebSocket) between guest and host.
- Automated KYC OCR/biometric at scale — manual review is sufficient.
- Multi-city expansion beyond the first target area.
- GCC marketing and Mada/Apple Pay payment methods.

### 9.5 Is the marketplace capable of launching with real inventory?

**Not yet, but it can be within 4–6 weeks if the following close:**

1. **Operational tooling built:** admin dashboard, KYC review, listing verification, import/claim, host onboarding UI.
2. **Photo upload and listing creation working:** backend and frontend.
3. **Payment fallback ready:** Paymob/Stripe or manual escrow process.
4. **Operations team hired and trained:** 12–14 people for the Closed Alpha.
5. **First institutional partners signed:** 3 partners with 5–20 listings each.
6. **Founder commits to running first 10 transactions manually:** WhatsApp, manual escrow, founder on-call.

**If these conditions are met, StayOS can launch a Closed Alpha with 50 real listings and 10 real transactions in 4 weeks. If any of the first four (tooling, photo upload, payment, team) remain unresolved, the alpha must be delayed.**
