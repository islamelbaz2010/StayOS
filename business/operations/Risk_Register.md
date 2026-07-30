# Risk Register

## Purpose
Identify, assess, and track business, operational, marketplace, financial, reputation, support, and scaling risks so they can be managed before and after launch.

## Scope
Covers all non-technical risks relevant to the first market launch and early operations. Technical and infrastructure risks are out of scope unless they directly affect operations.

## Owner
Operations Director / COO

## Inputs
- Business_Model.md
- Marketplace_Model.md
- Trust_Model.md
- Escrow_Model.md
- KPIs.md
- Incident and support data
- Founder risk appetite

## Outputs
- Risk Register (this document)
- Risk mitigation action plans
- Executive risk reports
- Inputs to Founder_Dashboard Top Risks section

## Workflow
1. Identify risks by category.
2. Assess probability (Low/Medium/High) and impact (Low/Medium/High).
3. Define mitigation, owner, and target state.
4. Review monthly and after every incident.
5. Escalate to Founder/COO when probability or impact rises to High.

## Risk Definitions

### Business Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Insufficient host supply at launch | High | High | Pre-seed verified listings; concierge onboarding; launch partnerships with property managers | Host Success Lead |
| Weak guest demand or low conversion | Medium | High | Hyper-local marketing; promo codes; influencer and partnership traffic; conversion funnel optimization | COO |
| Regulatory restrictions in MENA markets | Medium | High | Legal review per market; phased launch; local entity and tax compliance | Founder / COO |
| Payment provider instability or withdrawal | Medium | High | Multi-provider setup (Paymob + Stripe); manual fallback process; local bank settlement option | Finance Lead |
| Competitive response from incumbent platforms | Medium | Medium | Differentiate on trust, localized UX, AI features, and MENA-specific hospitality | Founder |

### Operational Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Host onboarding backlog or delays | Medium | High | SOPs, contractor support, self-service verification, onboarding calls | Host Success Lead |
| Manual verification capacity exceeded | Medium | Medium | Train contractors, automate KYC tiering, manual review queue prioritization | Trust & Safety Lead |
| Payout failures or delays | Low | High | Verify payout accounts at onboarding; reconcile daily; escalation path to Finance | Finance Lead |
| Staff/contractor errors in cancellations/refunds | Medium | Medium | Clear SOPs, approval thresholds, audit logs, training | Customer Success Director |
| SOP drift as team grows | Medium | Medium | Monthly playbook reviews, decision log, training program | Operations Director |

### Marketplace Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Fake or misleading listings | Medium | High | Listing review, photo metadata checks, address verification, guest reporting, random audits | Marketplace Ops Manager |
| Fraudulent guest bookings or chargebacks | Medium | High | KYC, payment risk rules, booking monitoring, chargeback SOP, hold periods | Trust & Safety Lead |
| Double-bookings due to calendar errors | Low | High | Atomic calendar locking, availability monitoring, host calendar sync | Marketplace Ops Manager |
| Price manipulation or dumping | Low | Medium | Pricing outlier detection, manual review, host education | Marketplace Ops Manager |
| Low review integrity (fake reviews) | Medium | Medium | Verified-stay only reviews, anomaly detection, manual investigation | Trust & Safety Lead |

### Financial Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Refund/cancellation costs exceeding forecast | Medium | High | Strict cancellation policy, fraud rules, escrow hold, reserve fund | Finance Lead |
| Chargebacks eroding revenue | Medium | High | Clear refund process, evidence packages, dispute response SLA | Finance Lead |
| Escrow reconciliation errors | Low | High | Daily reconciliation, immutable ledger, exception alerts | Reconciliation Analyst |
| Cash flow strain from payout timing | Medium | Medium | Manage release timing, maintain operating reserve, clear settlement schedule | Finance Lead |
| Provider fees higher than modeled | Low | Medium | Model worst-case fees, renegotiate at scale, transparent guest fees | Finance Lead |

### Reputation Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Guest safety incident at a property | Low | High | Host verification, guest safety reporting, emergency escalation, insurance review | Operations Director |
| Viral negative experience on social media | Medium | High | Fast response SLA, empowered support, proactive recovery, escalation to COO | Customer Success Director |
| Host publicly disputes payout or policy | Medium | Medium | Transparent payout schedule, clear host communication, appeal process | Host Success Lead |
| Data or privacy complaint | Low | High | GDPR/compliant data handling, consent logs, security review, incident response | Trust & Safety Lead |

### Support Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Support volume exceeds capacity | Medium | High | Staffing model, help center, chatbot, escalation rules, contractor surge | Guest Support Lead |
| Inconsistent policy application | Medium | Medium | Decision log, SOPs, regular calibration, quality assurance | Customer Success Director |
| Language/cultural mismatch in MENA | Medium | Medium | Hire Arabic-speaking agents, localized macros, cultural training | Guest Support Lead |
| Escalation misses SLA | Medium | High | Real-time dashboards, escalation alerts, backup on-call coverage | Operations Director |

### Scaling Risks

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Operational processes break at volume | Medium | High | Design scalable SOPs, automate early, monitor bottlenecks, hire ahead of demand | COO |
| Geographic expansion without local ops | Medium | High | Launch playbook, local partnerships, phased market entry | COO |
| Quality degrades as supply grows | Medium | High | Quality score, random audits, host performance management, guest feedback loops | Host Success Lead |
| Talent and hiring delays | Medium | Medium | Clear role profiles, contractor bench, competitive compensation, phased hiring | COO |
| Vendor/partner dependency | Medium | Medium | Multi-vendor strategy, fallback providers, contract SLAs | Operations Director |

## Exceptions
- New risks may be added at any time by function leads.
- Risk probability/impact updates require Operations Director review.
- Risks that become active incidents move to the incident management workflow and are tracked separately until resolved.

## KPIs
- Number of open high-severity risks
- Risk mitigation completion rate
- Days since last Risk Register review
- Incidents traced to an unmitigated risk

## Dependencies
- Founder_Dashboard.md
- Operations_Dashboard.md
- Incident management process
- Support and payment data
- Legal and compliance input

## Best Practices
- Review the register monthly; escalate high risks weekly.
- Link each high risk to a mitigation action with an owner and deadline.
- Keep the register simple enough to be read in a single weekly meeting.
- Learn from incidents and update the register proactively.

## Review Frequency
Monthly, or immediately after a P1/P2 incident.
