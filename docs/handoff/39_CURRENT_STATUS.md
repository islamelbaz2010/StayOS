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

## Open items (documented)
- **PRE-LAUNCH SECURITY GATE (OPEN):** `ENVIRONMENT=staging` on prod →
  `dev-token` reachable; `PAYMOB_SECRET_KEY` is `sk_test` (sandbox
  payments). Remediation in `33_SECURITY.md` — live key must precede the
  ENVIRONMENT flip (fail-closed ordering).
- `deploy-prod/staging.yml` — **RESOLVED 2026-10-04:** push triggers
  disabled, workflows archived to manual dispatch (were stale AWS ECS,
  failing red on every push; real deploy = Railway/Vercel).
- `KYC` manual mode in prod (Sumsub architecture unprovisioned).
- Paymob Payouts unprovisioned; manual ops payout flow.
- `PAYMENT_BANK_*` placeholders unset.
