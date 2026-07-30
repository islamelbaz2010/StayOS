# Escalation Matrix

## Purpose
Define clear, fast escalation paths for operational issues, incidents, disputes, and emergencies so the right person is notified at the right time.

## Scope
Applies to all operational, trust, safety, financial, and guest/host incidents during pre-launch and early operations. Engineering and infrastructure incidents are covered only where they impact operations.

## Owner
Operations Director / COO

## Inputs
- Organization_Structure.md
- Roles_and_Responsibilities.md
- Approval_Matrix.md
- Incident reports and support ticket data
- Risk_Register.md

## Outputs
- Escalation paths by incident type and severity
- Notification channel rules
- On-call rotation guidance
- Post-incident review template

## Workflow
1. Incident detected by staff, system alert, host/guest report, or monitoring.
2. Classify severity using the matrix below.
3. Notify the owner at the appropriate tier within the SLA.
4. If unresolved within the tier time window, escalate to the next level.
5. Document resolution and review within one business day for severe incidents.

## Severity Levels

| Level | Description | Examples | Response Time | Initial Owner |
|---|---|---|---|---|
| P1 Critical | Safety, legal, financial, or reputational emergency | Active fraud, physical threat, data breach, mass payment failure, regulatory notice | < 15 minutes | Operations Director / COO |
| P2 High | Significant guest/host impact or policy exception | Multiple failed payouts, high-value dispute, repeat fraud pattern, listing scam | < 1 hour | Trust & Safety Lead or Finance Lead |
| P3 Medium | Operational issue requiring prompt action | Single refund exception, listing quality complaint, KYC edge case, SLA miss | < 4 hours | Guest Support Lead or Host Success Lead |
| P4 Low | Routine improvement or information request | Policy question, minor listing edit, report request, training need | < 1 business day | Relevant function owner |

## Escalation Paths

### Guest Safety or Fraud
1. Guest Support Lead identifies threat.
2. P1: immediately notify Trust & Safety Lead and Operations Director.
3. If unresolved in 30 minutes, escalate to COO and Founder.
4. Engage legal and/or authorities if required.

### Payment / Payout Failure
1. Payments & Reconciliation Analyst flags failure.
2. P2: notify Finance Lead and Operations Director.
3. If unresolved in 2 hours, escalate to COO.
4. P1 if multiple hosts/guests affected.

### Host Suspension / Quality Issue
1. Marketplace Operations Manager or Host Success Lead identifies issue.
2. P3/P2: Trust & Safety Lead for policy violations; Operations Director for terminations.
3. Document and communicate host appeal process.

### Dispute Between Guest and Host
1. Guest Support Lead captures evidence and attempted resolution.
2. If unresolved within policy window or value > threshold, escalate to Trust & Safety Lead.
3. Final decision approved per Approval_Matrix.md.

### Data / Privacy Incident
1. First responder alerts Trust & Safety Lead and COO.
2. P1: COO engages legal, security, and compliance.
3. Notify affected users per applicable law.

## Exceptions
- If the primary owner is unavailable, the backup owner (defined in Roles_and_Responsibilities.md) assumes authority.
- Founder may be contacted directly for P1 events.
- Local law enforcement or regulators supersede internal escalation where required.

## KPIs
- P1/P2 mean time to acknowledge (MTTA)
- P1/P2 mean time to resolve (MTTR)
- Escalation without reason count
- Post-incident review completion rate

## Dependencies
- Organization_Structure.md
- Roles_and_Responsibilities.md
- Approval_Matrix.md
- Contact directory and on-call schedule
- Monitoring and alerting tools

## Best Practices
- Escalate early when safety, legal, or large financial exposure is possible.
- Use a single incident channel to avoid duplicate response.
- Document every escalation decision and outcome.
- Hold a blameless post-incident review within 48 hours for P1/P2 events.

## Review Frequency
Monthly during launch quarter; quarterly after.
