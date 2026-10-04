# 16 — Refunds

## Policy inputs (env)
`CANCELLATION_FULL_REFUND_DAYS=7`, `CANCELLATION_PARTIAL_REFUND_DAYS=3`,
`CANCELLATION_PARTIAL_REFUND_PCT=0.5` — refundability derives from the
check-in distance at cancellation time. Policy display is surfaced to
guests pre-booking (cancellation policy panel on listing/checkout).

## Execution
- **Who cancels:** guest (owner) or admin only — host self-service cancel
  was removed by founder decision; host-side cancellation routes via ops.
- **Accounting:** refund amount posts reversal entries against the booking
  escrow — host share reduced, refunded VAT/revenue reversed, credit lands
  in `cash` or `guest_refund_payable` (see `17_FINANCIAL_LEDGER.md`).
- **Provider refund:** Paymob refund API call uses the stored transaction
  reference; full and partial refunds supported; provider refund id kept
  for reconciliation.
- **Idempotency:** refund posting is guarded by the same dedupe keys —
  retrying a webhook/job cannot double-post.

## Safety
- Refund never exceeds captured amount; escrow balance check precedes
  reversal entries.
- Failed provider refund leaves the ledger pending and alerts ops via
  outbox — money is not silently moved.
