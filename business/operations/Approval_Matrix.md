# Approval Matrix

## Purpose
Define decision authority and approval thresholds for operational, financial, policy, and trust decisions before launch and during early operations.

## Scope
Applies to all operational decisions affecting hosts, guests, payments, policy, and trust. Product, engineering, and fundraising decisions are excluded unless they intersect with operations.

## Owner
COO / Operations Director

## Inputs
- Organization_Structure.md
- Roles_and_Responsibilities.md
- Risk_Register.md
- Budget and policy documents

## Outputs
- Decision authority table
- Approval request workflow
- Exception log template
- Audit trail of major decisions

## Workflow
1. Identify the type of decision and its operational, financial, or reputational impact.
2. Check this matrix for the minimum approver.
3. Document the request, rationale, alternatives, and decision in the decision log.
4. Communicate the decision to affected owners and systems.

## Decision Authority Matrix

| Decision Category | Examples | Decision Maker | Approver | Notes |
|---|---|---|---|---|
| Host onboarding | Approve a host with flagged KYC | Trust & Safety Lead | Operations Director | For borderline cases |
| Listing approval | Approve listing with minor issues | Marketplace Operations Manager | Operations Director | If quality score < 70 |
| Listing rejection | Reject or delist a property | Marketplace Operations Manager | Operations Director | Must state reason |
| Refund (standard) | Refund per published cancellation policy | Guest Support Lead | Customer Success Director | Auto-approved if within policy |
| Refund (exception) | Refund outside published policy | Customer Success Director | COO | > USD 500 or > 50% of booking |
| Host payout hold | Delay or block host payout | Finance Lead | COO | Requires documented risk |
| Escrow release timing | Change release trigger window | Operations Director | COO + Finance Lead | Affects working capital |
| Commission/fee change | Modify host/guest fees | Founder | Founder | Commercial strategy decision |
| Market launch | Open a new city/country | COO | Founder | Requires operational readiness |
| Fraud/account suspension | Suspend host or guest account | Trust & Safety Lead | Operations Director | Immediate for safety |
| Chargeback response | Accept or contest chargeback | Finance Lead | COO | Based on evidence package |
| Policy change | Update cancellation/refund rules | COO | Founder | Impacts legal and CS |
| Marketing spend | Campaign budget > USD 1,000 | Marketing Lead | Founder | Per budget |
| Contractor/vendor | Engage third-party ops support | Operations Director | COO | Requires budget line |

## Exceptions
- Emergency safety issues may be approved verbally by the highest available leader and documented within 4 hours.
- Pre-approved thresholds in the monthly operating budget do not require re-approval.
- Founder may override any decision with written rationale recorded in the decision log.

## KPIs
- Average approval turnaround time
- Exceptions to the matrix per month
- Decision log completeness
- Audit findings

## Dependencies
- Organization_Structure.md
- Roles_and_Responsibilities.md
- Escalation_Matrix.md
- Decision log tool or template

## Best Practices
- Keep approval paths short; no more than two layers for operational decisions.
- Document every exception and the approver name.
- Escalate when the decision crosses into legal, financial, or reputational risk.

## Review Frequency
Monthly for the first 90 days; quarterly after.
