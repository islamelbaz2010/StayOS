# Marketplace Operations Playbook

## Purpose
Define standard operating procedures for monitoring, reviewing, and protecting the StayOS marketplace so listings, payments, and users remain safe, high quality, and liquid.

## Scope
Applies to listing review, pricing, fraud detection, manual verification, incident handling, emergency escalation, booking monitoring, payment monitoring, escrow release, and chargeback handling.

## Owner
Marketplace Operations Manager / Operations Director

## Inputs
- Marketplace_Model.md
- Trust_Model.md
- Escrow_Model.md
- Listing data, pricing, and booking events
- Payment provider settlements
- Fraud and incident reports
- Support tickets and disputes

## Outputs
- Reviewed and approved listings
- Fraud detection alerts and investigations
- Incident resolution records
- Escrow release and chargeback decisions
- Marketplace health reports

## Workflow

### 1. Listing Review SOP
1. New listing enters review queue upon submission.
2. Automated checks: address geocoding, photo metadata, duplicate detection, price outlier flag.
3. Manual review: photo authenticity, description accuracy, amenity completeness, cultural tag validity.
4. Approve, request changes, or reject with reason.
5. Record reviewer, timestamp, and decision.

### 2. Pricing Review SOP
1. Automated outlier detection flags listings significantly above/below comparable units.
2. Review localized comps and seasonality.
3. If suspected fraud or error, contact host for evidence or explanation.
4. Approve price, request adjustment, or suspend listing.

### 3. Fraud Detection SOP
1. Monitor signals: multiple accounts, suspicious payment patterns, rapid booking/cancellation cycles, fake reviews, mismatched identity documents.
2. Score risk with automated rules and manual indicators.
3. Investigate high-risk accounts and transactions.
4. Block, suspend, or escalate per Escalation_Matrix.md.
5. Document findings and update detection rules.

### 4. Manual Verification SOP
1. KYC/ID documents that fail automatic checks enter manual review queue.
2. Trained reviewer checks document validity, photo match, and risk indicators.
3. Approve, request additional documents, or reject and notify user.
4. Escalate unclear cases to Trust & Safety Lead.

### 5. Incident Handling SOP
1. Detect incident via alert, user report, or monitoring.
2. Classify severity (P1–P4) and assign owner.
3. Contain impact (pause payouts, freeze escrow, suspend listings if needed).
4. Investigate, document evidence, and decide resolution.
5. Communicate to affected users and stakeholders.
6. Conduct post-incident review within 48 hours for P1/P2.

### 6. Emergency Escalation SOP
1. Identify potential or actual critical event: safety threat, data breach, mass payment failure, regulatory action.
2. Notify P1 responders immediately (Operations Director, COO, Founder, Trust & Safety, Finance).
3. Activate emergency response channel and decision log.
4. Execute containment and communication plan.
5. Engage legal, PR, or authorities as needed.
6. Post-event review and policy update.

### 7. Booking Monitoring SOP
1. Review booking patterns daily for anomalies (unusual concentration, last-minute bulk bookings, same-day cancellations).
2. Cross-check high-value or short-lead bookings against host and guest risk scores.
3. Flag suspicious bookings for manual review.
4. Contact guest or host if verification is needed.
5. Document outcomes and update risk models.

### 8. Payment Monitoring SOP
1. Reconcile provider settlements daily against expected booking totals.
2. Monitor failed, refunded, and disputed transactions.
3. Investigate unreconciled items within 24 hours.
4. Alert Finance Lead for chargebacks or settlement delays.

### 9. Escrow Release SOP
1. Confirm check-in or release trigger has occurred and no open disputes exist.
2. Compute host payout minus commission and any adjustments.
3. Initiate payout to verified host account.
4. Record transaction ID and update ledger.
5. Reconcile with provider settlement.

### 10. Chargeback Handling SOP
1. Receive chargeback notification from payment provider.
2. Freeze related payout if not yet released.
3. Gather evidence (booking, messages, check-in records, cancellation policy, refund history).
4. Decide accept, contest, or negotiate based on evidence and amount.
5. If accepted, process recovery from host or platform reserve.
6. If contested, submit evidence before provider deadline.
7. Document outcome and update chargeback log.

## Exceptions
- Automated rules may be overridden by Trust & Safety Lead with documented reason.
- Marketplace Operations Manager may place a temporary hold on suspicious activity pending investigation.
- Chargeback decisions > USD 500 or involving safety/fraud require COO or Finance Lead approval.

## KPIs
- Listing review turnaround time and approval rate
- False-positive rate of fraud detection
- Incident MTTR by severity
- Escrow release accuracy and on-time rate
- Chargeback rate and recovery rate
- Marketplace liquidity index
- Payment reconciliation accuracy

## Dependencies
- Marketplace_Model.md
- Trust_Model.md
- Escrow_Model.md
- Approval_Matrix.md
- Escalation_Matrix.md
- Listing review, fraud detection, and payment tools
- Payment provider access

## Best Practices
- Automate detection but always keep a human review step for adverse actions.
- Never release escrow while a dispute or chargeback is open.
- Maintain a clear, auditable trail for every marketplace decision.
- Share fraud learnings with product and engineering to improve detection.

## Review Frequency
Weekly operational review; monthly playbook review.
