# 33 — Security

## Boundaries
- **AuthZ server-side always** — role + permission + ownership checks in
  services/deps; frontend gating is UX only.
- **JWT:** RS256 (`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`), 15-min access,
  rotating 7-day refresh; `JWT_AUDIENCE`/`JWT_ISSUER` validated.
- **Rate limiting:** `security/rate_limit.py` (Redis token bucket) on
  auth/OTP/webhook-adjacent endpoints.
- **Audit:** `security/audit.py` → `security.audit_logs` for sensitive ops.
- **PII:** `security/pii.py` redaction in logs — never log documents,
  tokens, or payment payloads raw.
- **Webhooks:** Paymob HMAC verify; Sumsub signature verify (when active).
- **Uploads:** presigned PUT with content-type + size cap; no public
  buckets; KYC media on dedicated creds.
- **Guest privacy:** internal fee economics (6%/12%) never in guest
  payloads — tested.
- **CORS:** `CORS_ORIGINS` env — web origin only; CSRF n/a (bearer tokens).

## Secrets management
Railway/Vercel dashboards; `.env*` untracked (only `*.example` tracked).
Secret scan on tracked tree + git history: clean (placeholders only).
`security.yml` runs a secrets-scan job in CI.

## Hardening notes
- `dev-token` endpoint returns 404 in `ENVIRONMENT=production`; prod
  Railway service intentionally runs `staging` for ops verification —
  flag for tightening before public launch.
- Turnstile keys wired for abuse protection on auth surfaces.
