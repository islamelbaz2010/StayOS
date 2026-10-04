# CI/CD Workflow Map — verified 2026-10-04

| Workflow | Trigger | Jobs | Purpose | Destination | Secrets | Status |
|---|---|---|---|---|---|---|
| `ci.yml` | PR → develop/main | backend, frontend | Backend pytest suite; web tests + typecheck | — | none (test env from `.env.test`) | **ACTIVE — the real merge gate** |
| `build-mobile-android.yml` | push (paths-limited) + manual | build-android | EAS/Gradle Android APK build | EAS artifact | `EXPO_TOKEN`, `GOOGLE_MAPS_API_KEY` | ACTIVE |
| `build-android-local.yml` | manual (`workflow_dispatch`) | build-android | Non-EAS local Gradle APK build | GH artifact | `GOOGLE_MAPS_API_KEY` | ACTIVE (manual) |
| `docs.yml` | push/PR → main/develop | build-docs | Docs build/validation | — | none | ACTIVE |
| `security.yml` | push/PR + weekly schedule | python-security, secrets-scan, dependency-review | Bandit/safety, secret scan, dep audit | — | `GITHUB_TOKEN` | ACTIVE |
| `release.yml` | tag push | release-documentation | Release packaging/docs | GH release | `GITHUB_TOKEN` | ACTIVE (tag-driven) |
| **`deploy-prod.yml`** | push → main | deploy | **AWS ECS deploy (OIDC role, subnet/SG config)** | AWS ECS | `AWS_ROLE_ARN_PROD`, `PROD_SUBNET_IDS`, `PROD_SG_ID` | **STALE — fails every push; production does NOT deploy this way** |
| **`deploy-staging.yml`** | push → develop | deploy | **AWS ECS staging deploy** | AWS ECS | `AWS_ROLE_ARN_STAGING`, `STAGING_*` | **STALE — same AWS path** |

## Actual production deployment (not GitHub Actions)
- **API / worker / beat:** Railway project `stayos-demo` —
  auto-deploy on push to `product-completion-review`.
- **Web:** Vercel on `main` → canonical `https://web-amber-pi-98.vercel.app`.
- **Migrations:** manual `alembic upgrade head` over `railway connect`
  tunnel (procedure in `31_DEPLOYMENT.md` / `TROUBLESHOOTING.md`).

## Discrepancy — flag for owner decision
`deploy-*.yml` target AWS ECS infra that is no longer the deploy target;
`deploy-prod` is red on every `main` push. Recommendation (not done in
this batch): delete or repoint these workflows so the checks page stops
crying wolf — a founder/owner call.
