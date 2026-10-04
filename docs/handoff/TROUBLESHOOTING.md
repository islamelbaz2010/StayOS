# Troubleshooting Guide (consolidated, evidence-based)

 Only verified,
> actually-encountered issues — no hypothetical cases.

## Backend / tests
| Symptom | Cause | Fix |
|---|---|---|
| E2E test fails on fresh machine | `stayos_e2e` DB not migrated (separate `E2E_DATABASE_URL`) | `alembic upgrade head` with that URL |
| `MagicMock` Pydantic validation failures after model change | fixture missing new fields | update the factory (e.g. `_make_conversation`) |
| 404 on `/messages/support` | missing `/api/v1` prefix | all routes live under `/api/v1` |
| Alembic can't reach prod DB | `*.railway.internal` unresolvable locally | `railway connect Postgres --ssh --tunnel-only` then `alembic` on `127.0.0.1:5433` |

## Web
| Symptom | Cause | Fix |
|---|---|---|
| Language button invisible when active | dead `primary-700` Tailwind token (palette is `brand-*`) | `bg-brand-900` — fixed; regression test exists |
| Random Vercel preview URL differs | canonical domain is `web-amber-pi-98.vercel.app` | always verify on canonical |
| `isPending` undefined from `useAuth` | context exposes `isLoading` | use `isLoading` |

## Payments
| Symptom | Cause | Fix |
|---|---|---|
| Webhook not confirming | wrong `PAYMOB_HMAC_SECRET` or unsigned payload | verify HMAC; check webhook log |
| Manual transfer shows placeholder | `PAYMENT_BANK_*`/`VODAFONE_CASH` unset | set real details before enabling path |

## Mobile
| Symptom | Cause | Fix |
|---|---|---|
| API calls fail in dev | `EXPO_PUBLIC_API_URL` points at unreachable host | use LAN IP or tunnel; confirm `/health` |
| Push not arriving | `EXPO_ACCESS_TOKEN`/`EXPO_PROJECT_ID` or device-token registration | verify `/auth/device-token` call + Expo receipt |

## Infra
| Symptom | Cause | Fix |
|---|---|---|
| `dev-token` returns tokens in "production" | `ENVIRONMENT=staging` on prod service (pre-launch gate) | live Paymob key → `ENVIRONMENT=production` (fail-closed order — `33_SECURITY.md`) |
| Checkout raises "test credentials cannot be used in production" | `ENVIRONMENT=production` flipped while `PAYMOB_SECRET_KEY` is `sk_test` | provision live key OR set ENVIRONMENT back to staging until live key exists |
| `deploy-prod` CI red on pushes | was stale AWS ECS workflow | RESOLVED: push triggers disabled 2026-10-04; real deploys are Railway/Vercel |
| Worker/beat not processing | service crash or Redis URL | Railway service logs + `REDIS_URL` |
