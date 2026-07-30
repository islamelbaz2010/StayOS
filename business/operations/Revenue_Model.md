# Revenue Model

## Purpose
Document all revenue streams, fee structure, and fund flow for StayOS so finance, operations, and product teams can align pricing decisions.

## Scope
Covers all platform fees charged to hosts and guests, payment timing, refund allocation, and escrow release mechanics. Excludes external fundraising or investment revenue.

## Owner
Founder / Finance Lead / COO

## Inputs
- Business_Model.md
- Marketplace_Model.md
- Escrow_Model.md
- Local tax and payment regulations
- Payment provider fee schedules

## Outputs
- Commission schedule
- Guest service fee schedule
- Host payout rules
- Refund cost allocation
- Financial forecast assumptions

## Workflow
1. Guest completes booking and pays total amount = nightly subtotal + guest service fee + applicable taxes.
2. Platform deducts the host commission from the nightly subtotal before payout.
3. Payment provider fees are recorded as a cost of revenue and deducted from platform revenue.
4. Net host payout is held in escrow and released after the check-in window or the defined hold period.
5. Refunds follow the cancellation policy and reduce both host payout and platform fee proportionally.

## Exceptions
- Promo codes reduce guest total; platform absorbs the discount unless a host opt-in co-marketing campaign applies.
- Chargebacks and disputes may reverse recognized revenue and are tracked separately.
- Cross-border transactions may incur additional FX or provider fees passed through transparently.

## KPIs
- Take rate (%)
- Net revenue margin
- Revenue per booking
- Host payout on-time rate
- Refund cost as % of GBV

## Dependencies
- Payment providers (Paymob, Stripe)
- Escrow account and reconciliation process
- Accounting system integration
- Tax registration and invoicing capability

## Best Practices
- Show guests the full price, including fees, before checkout.
- Release host payouts automatically once the check-in window passes and no open disputes exist.
- Reconcile provider settlements daily and investigate unreconciled items within 48 hours.

## Review Frequency
Quarterly, or after any fee change experiment.
