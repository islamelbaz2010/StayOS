# 30 — CI/CD

Detailed per-workflow map: **`CI_CD_WORKFLOW_MAP.md`**.

## Reality (verified 2026-10-04)
| Path | Status |
|---|---|
| `ci.yml` — backend tests + web tests + typecheck on PR/push | Active, the gate to use |
| `build-mobile-android.yml` / `build-android-local.yml` | Active mobile build paths |
| `security.yml`, `release.yml`, `docs.yml` | Active supporting workflows |
| `deploy-prod.yml` / `deploy-staging.yml` | **ARCHIVED 2026-10-04** — stale AWS ECS path; push triggers disabled → `workflow_dispatch` only. Production deploys via **Railway (API/worker/beat) + Vercel (web)** |

## Actual deploy pipeline
- **API/worker/beat:** push to `product-completion-review` → Railway
  auto-deploy (services: api `stayos-demo`, `worker`, `beat`).
- **Web:** `main` → Vercel → canonical `web-amber-pi-98.vercel.app`.
- Migrations run manually via `railway connect Postgres --tunnel-only` +
  `alembic upgrade head` (see `31_DEPLOYMENT.md`).

## Secrets required (CI)
GitHub Actions secrets for AWS paths are effectively dead; the active
workflows need Docker registry + mobile build secrets (`eas`/`apk`
toolchain). See the workflow map for per-file detail.
