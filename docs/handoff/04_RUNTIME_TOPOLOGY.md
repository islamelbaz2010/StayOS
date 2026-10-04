# 04 — Runtime Topology

## Production
| Service | Platform | Source | Notes |
|---|---|---|---|
| Web (Next.js) | Vercel | GitHub `main` | `web-amber-pi-98.vercel.app` — canonical acceptance URL |
| API `stayos-demo` | Railway (Docker `infra/docker/api`) | GitHub `product-completion-review` | uvicorn ×4, `:8000` |
| `worker` | Railway | same repo/commit | celery worker — outbox, notifications, emails |
| `beat` | Railway | same repo/commit | celery beat — expirations, scheduled tasks |
| `Postgres` | Railway | managed | private networking only (no public domain) |
| `Redis` | Railway | managed | private |

Deploy flow: push to `main` (web redeploys on Vercel) **and** fast-forward
`product-completion-review` → all three Railway services rebuild together
from the same commit. DB migrations are **manual**:
`railway connect Postgres --ssh --tunnel-only` then run
`alembic upgrade head` with a `postgresql+asyncpg://…@127.0.0.1:<port>`
`DATABASE_URL`.

**Note — archived workflows:** `.github/workflows/deploy-prod.yml` and
`deploy-staging.yml` target a retired AWS ECS path; **archived
2026-10-04** (push triggers disabled, manual dispatch only) — they were
failing red on every push while real deploys ran Railway+Vercel.
They are not the real deploy path; treat their red status as expected
until cleaned up (do not rely on them).

## Local dev
- API: `.venv/bin/uvicorn app.main:app` (PYTHONPATH=src), `localhost:8000`
- Web: `apps/web` → `npm run dev`, `localhost:3000`
- DB: local Postgres `stayos` (see `.env`), Redis local
- Worker/beat optional locally (`celery -A app.celery_app worker|beat`)
- e2e tests use a separate `stayos_e2e` DB — migrate it too
- `ENVIRONMENT=staging` on the production Railway service intentionally
  keeps `/auth/dev-token` enabled for ops verification.

## Domains
- `stayos-demo-production.up.railway.app` — API (`/health`, `/api/v1`, `/docs`)
- `web-amber-pi-98.vercel.app` — web. Do not use preview URLs for acceptance.
