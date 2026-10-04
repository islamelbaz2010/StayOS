# 20 — Host Payouts

## Status: MANUAL OPS FLOW — automated rail NOT PROVISIONED

| Component | State |
|---|---|
| `PayoutRequest` model + `finance.payout_requests` | Implemented |
| `/host/payouts` API + `/finance` surfaces | Implemented — request, track |
| Paymob Payout provider (`finance/providers.py::paymob_payout`) | Implemented **but unprovisioned** — `PAYMOB_PAYOUT_*` unset in prod |
| Ops execution | Manual bank transfer / wallet by ops against the payout queue |

## What exists
- Host sets payout preference (bank transfer or mobile wallet) on
  `/host/profile` — a listing-readiness blocker until configured.
- Funds become payable check-in + 24h (release task, `finance/tasks.py`).
- Payout requests are tracked with status transitions; audit-logged.

## What is NOT there
- No live automated disbursement rail. `paymob_payout` requires
  `PAYMOB_PAYOUT_CLIENT_ID/SECRET/USERNAME/PASSWORD` — an external
  Paymob provisioning blocker, not a code gap.
- Do not present payouts as automated anywhere (docs, UI, marketing).

## Safety
- Payout posting debits `host_funds_payable` — balance-checked before
  entry; a failed rail never fabricates a successful payout.
