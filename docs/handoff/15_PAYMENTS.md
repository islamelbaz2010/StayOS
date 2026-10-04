# 15 — Payments

## Rails (actual)
| Rail | State |
|---|---|
| Paymob Accept (card, Intention flow) | **PROVISIONED** — `PAYMOB_SECRET_KEY`/`PUBLIC_KEY`/integration IDs set in prod; payment key → IFrame `PAYMOB_IFRAME_ID` |
| Manual bank transfer (proof upload) | Implemented; **bank details placeholder** — `PAYMENT_BANK_ACCOUNT_NUMBER` / `PAYMENT_VODAFONE_CASH_NUMBER` unset on prod. Must be set before the manual path is guest-usable |
| Paymob Payouts | **NOT PROVISIONED** — `PAYMOB_PAYOUT_*` unset; host payouts executed manually by ops |

## Paymob Accept flow
1. Server creates a `payments.payments` row + Paymob Intention.
2. Web `/payments` renders the hosted checkout (Iframe); mobile uses a
   hosted webview handoff.
3. Webhook (HMAC-validated, `PAYMOB_HMAC_SECRET`) and the guest's
   `/payments/{id}/confirmation-status` polling reconcile the transaction.
4. Success → booking `confirmed` → escrow + revenue/VAT ledger posting.
   Failure → `payment_failed` + retry guidance.

## Engineering guarantees
- **Idempotency** — webhook replays, double-clicks, and retries dedupe on
  provider reference; capture → booking confirmation is atomic.
- **HMAC verification** on notification payloads; unsigned/wrong-signed
  payloads rejected.
- **Transaction reference** persisted for reconciliation (Paymob txn id,
  intention id, merchant order ref).
- Amounts: kobo-style minor units? No — `PRICE_CURRENCY=EGP`, `MONEY_SCALE=0`,
  whole-EGP integer amounts throughout (schema + ledger).

## Failure handling
- Payment deadline `PAYMENT_DEADLINE_HOURS` (48h) via beat; expiry keeps the
  booking pending then releases the lock.
- Bank-transfer proofs go to staff queue for capture/rejection.

## Refunds
See `16_REFUNDS.md` — refund posting is separate from capture; refund
provider references are stored for reconciliation.
