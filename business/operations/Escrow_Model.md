# Escrow Model

## Purpose
Define how guest funds are held, managed, and released to hosts while protecting guests, hosts, and the platform from payment failures, disputes, and chargebacks.

## Scope
Covers escrow account structure, release timing, refund allocation, failed release handling, reconciliation, and reporting. Excludes payment provider API implementation.

## Owner
Finance Lead / Operations Director

## Inputs
- Booking confirmation events
- Payment confirmation events
- Check-in/check-out events
- Cancellation and refund requests
- Dispute outcomes
- Provider settlement reports

## Outputs
- Escrow balance report
- Host payout schedule
- Refund transaction records
- Reconciliation exceptions log
- Escrow release audit trail

## Workflow
1. Guest Payment
   - Guest pays total amount at booking.
   - Funds are credited to the platform escrow account minus guest service fee and applicable taxes.
2. Hold Period
   - Funds remain in escrow until the guest completes check-in or the defined release trigger is met (e.g., T+24h after check-in).
3. Escrow Release
   - On the release trigger, the platform computes the host payout (subtotal minus host commission).
   - Payout is initiated to the host's registered bank or wallet account.
   - A unique platform transaction ID is generated and reconciled against the provider statement.
4. Refunds and Cancellations
   - If a booking is cancelled per the cancellation policy, the refundable portion is returned to the guest and the corresponding escrow balance is reduced.
   - If already released to the host, the refund may be recovered from future host payouts or through a chargeback process.
5. Disputes
   - When a dispute is opened, the associated escrow amount is frozen until the dispute is resolved.
   - Dispute outcomes determine final allocation between guest and host.
6. Reconciliation
   - Escrow ledger is reconciled with payment provider settlements daily.
   - Unreconciled items are flagged for Finance within 24 hours.

## Exceptions
- High-risk bookings may have an extended hold period approved by Operations Director.
- Chargebacks may reverse released payouts; recovery is handled through Finance.
- Failed host payout accounts trigger a manual remediation workflow.

## KPIs
- Escrow balance accuracy (% reconciled)
- Payout on-time rate (% released within SLA)
- Refund processing time
- Dispute escrow freeze rate
- Chargeback rate
- Escrow reconciliation exception count

## Dependencies
- Payment provider (Paymob, Stripe)
- Booking and finance events
- Host bank/wallet account records
- Dispute resolution workflow
- Accounting ledger

## Best Practices
- Never commingle platform operating cash with guest/host escrow funds.
- Release escrow only after the guest has actually checked in or the no-show window has passed.
- Maintain an immutable ledger of every escrow movement with traceable booking and event references.
- Reconcile daily and resolve exceptions within 48 hours.

## Review Frequency
Weekly, with full audit monthly.
