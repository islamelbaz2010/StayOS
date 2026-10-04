# 29 — Environment Configuration

Authoritative variable inventory: **`ENVIRONMENT_VARIABLES_REFERENCE.md`**
(88 vars, generated from `src/app/config.py` + `NEXT_PUBLIC_*` usage).

## Layers
| Layer | File / source | Scope |
|---|---|---|
| Backend | `.env` (local) → Railway service vars (prod) | `src/app/config.py` (pydantic-settings) |
| Backend staging | `.env.staging` | same |
| Backend tests | `.env.test` | pytest + `conftest.py` |
| Web | `apps/web/.env.local` (dev) → Vercel env (prod) | `NEXT_PUBLIC_*` only reach the browser |
| Mobile | `apps/mobile/.env` / `EXPO_PUBLIC_API_URL` | Expo public env |

## Contract
- `Settings` class validates at boot — missing required vars fail fast
  with field names.
- `ENVIRONMENT` ∈ `development|staging|production|test` gates dev-only
  surfaces (`dev-token`, seed admin, swagger visibility nuances).
- Never commit real `.env*`; only `*.example` files are tracked.
- Secrets live in Railway/Vercel dashboards + local untracked files —
  documented as variable NAMES only, never values.

## Known placeholders needing real values before reliance
- `PAYMENT_BANK_ACCOUNT_NUMBER`, `PAYMENT_VODAFONE_CASH_NUMBER`
  (manual-transfer instructions) — unset on prod.
- `SEED_*` (dev only).

## Environment-state flag (pre-launch gate)
Production service runs `ENVIRONMENT=staging` — keeps `dev-token`
reachable and pairs with the sandbox `sk_test` Paymob key (a live key
would fail closed). Correct launch value is `production`; flip only
AFTER a live Paymob key is set (fail-closed ordering — `33_SECURITY.md`).
