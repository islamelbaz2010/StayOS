# 39 — Current Status

> Machine-style matrix also in `STAYOS_CURRENT_STATUS_2026-10-04.md`.

## Phases
- **WEB: CLOSED** — founder acceptance on `web-amber-pi-98.vercel.app`;
  last fix commit `53625cb`, support batch `e08928a`.
- **PHASE 3 — Engineering handoff: this batch.**
- **PHASE 4 — MOBILE: ready to start** (audit complete, no blocker).

## Verified live (2026-10-04)
| Check | Result |
|---|---|
| Backend tests | 1644 passed, ~80.5% cov |
| Web tests | 222 passed |
| tsc / Next build | clean / clean |
| Prod `/health` | db ok, redis ok |
| API authz boundary | unauthed → 401; staff-only → 403 |
| EN/AR/RTL | `dir="rtl"` on ar pages |

## Open items (documented, non-blocking)
- `deploy-prod/staging.yml` stale AWS workflows (fail red on push).
- `KYC` manual mode in prod (Sumsub architecture unprovisioned).
- Paymob Payouts unprovisioned; manual ops payout flow.
- `PAYMENT_BANK_*` placeholders unset.
- `ENVIRONMENT=staging` on prod service (dev-token surface; flag to
  tighten pre-launch).
