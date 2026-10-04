# 31 — Deployment & Operations Runbook

## Targets
| Component | Platform | Service / URL | Deploy trigger |
|---|---|---|---|
| Web | Vercel | `https://web-amber-pi-98.vercel.app` (canonical acceptance URL) | push → `main` |
| API | Railway `stayos-demo` | `https://stayos-demo-production.up.railway.app` | push → `product-completion-review` |
| Worker / Beat | Railway | same project, separate services | same |
| Postgres | Railway plugin | managed | — |
| Redis | Upstash | managed | — |

## Deploy procedure (code change)
1. Merge/verify on `main` (CI green: backend + web tests + typecheck).
2. `git push origin main:product-completion-review` (or fast-forward the
   review branch) → Railway auto-deploys api+worker+beat.
3. Web: merge to `main` → Vercel production deploy.
4. Smoke: `/health` (db+redis), a guest route, an authed route.

## Migrations (production)
```bash
railway connect Postgres --ssh --tunnel-only   # opens 127.0.0.1:5433
DATABASE_URL=postgresql+asyncpg://postgres:<pw>@127.0.0.1:5433/railway \
  alembic upgrade head
# close tunnel
```
Always `alembic heads` first; never run against the internal hostname
(`*.railway.internal` is unreachable locally — DNS failure, use the tunnel).

## Rollback
- Railway: redeploy the previous deployment (service → Deployments →
  Redeploy) or revert the commit on `product-completion-review`.
- Vercel: promote previous production deployment.
- DB: forward-fix preferred; `alembic downgrade` only with a backup.

## Environments
Single production environment today (`production` env on Railway).
Local dev per `NEW_DEVELOPER_QUICKSTART.md`.
