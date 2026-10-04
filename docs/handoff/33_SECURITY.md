# 33 — Security

## Status: PRE-LAUNCH GATE — OPEN (verified 2026-10-04)

The production deployment currently runs a **demo/staging posture**, not a
hardened-production posture. Verified findings:

| # | Finding | Evidence | Severity |
|---|---|---|---|
| 1 | `ENVIRONMENT=staging` on the production service | `railway run` env check | Gate |
| 2 | `POST /api/v1/auth/dev-token` is reachable — it issues a JWT pair for any known `user_id` without OTP | `router.py:481` allows `development`/`staging`; live request returns 422 (endpoint alive), not 404 | **High** — must be off before public launch |
| 3 | `PAYMOB_SECRET_KEY` is a **test (`sk_test`) key** — card checkout runs in Paymob sandbox; no real money moves | key-marker check on service env | Gate — consistent with `staging`, but means "live payments" is NOT proven |
| 4 | `PAYMENT_BANK_*` / `PAYMENT_VODAFONE_CASH_NUMBER` unset | env check | Manual rail unusable until configured |
| 5 | HSTS not sent (production-only header) | `security/middleware.py:34` | Auto-fixed by item 1 |

## Launch remediation sequence (deterministic)
1. Provision a **live** Paymob secret key + matching integration IDs/HMAC.
2. Set real `PAYMENT_BANK_*` values if the manual-transfer rail is wanted.
3. Set `ENVIRONMENT=production` on the Railway api/worker/beat services.
4. Verify: `dev-token` → **404**; `/health` green; checkout intention
   succeeds (live key now passes the fail-closed check at
   `providers.py:290`); HSTS header present; unauthenticated endpoints → 401.
5. Only then may Security be classified GREEN.

Note the fail-closed design: `ENVIRONMENT=production` + test key =
`PaymentError("Paymob test credentials cannot be used in production")` —
the order above is mandatory; flipping ENVIRONMENT first breaks checkout.

## Boundaries (unchanged — all enforced server-side)
- **AuthZ:** role + permission + ownership checks in services/deps;
  frontend gating is UX only.
- **JWT:** RS256 (`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`), 15-min access,
  rotating 7-day refresh; `JWT_AUDIENCE`/`JWT_ISSUER` validated.
- **Rate limiting:** Redis token bucket on auth/OTP endpoints.
- **Audit:** `security/audit.py` → `security.audit_logs`.
- **PII:** `security/pii.py` redaction in logs.
- **Webhooks:** Paymob HMAC verify (fail-closed); Sumsub signature verify
  with sandbox fail-closed guard (`sandbox` tokens rejected unless
  `ENVIRONMENT` is development/test — correct today).
- **Uploads:** presigned PUT with content-type + size caps; private buckets;
  dedicated KYC creds.
- **Guest privacy:** internal fee economics never in guest payloads — tested.
- **CORS:** `CORS_ORIGINS` env. CSRF n/a (bearer tokens).

## Secrets management
Railway/Vercel dashboards; `.env*` untracked (only `*.example` tracked).
Secret scan on tracked tree + git history: clean (placeholders only).
`security.yml` runs a secrets-scan job in CI.
