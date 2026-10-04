# 40 — Known Limitations & External Blockers

## External blockers (not code gaps)
| Item | State |
|---|---|
| Paymob Payouts provisioning | credentials unissued — host payouts manual |
| Sumsub production activation | creds + legal/privacy approval pending — manual KYC runs |
| Egyptian e-invoice/e-receipt | no integration exists; regulatory timing — accountant/legal item |
| Entity/bank details for manual transfers | `PAYMENT_BANK_*` placeholders unset |

## Pre-launch gate (OPEN — see `33_SECURITY.md`)
- Prod `ENVIRONMENT=staging` → `dev-token` reachable; `PAYMOB_SECRET_KEY`
  is `sk_test` → card checkout is sandbox. Launch sequence: live Paymob
  key → `PAYMENT_BANK_*` (if needed) → `ENVIRONMENT=production` → verify.

## Engineering limitations (known, accepted)
- ~~Stale `deploy-*.yml` AWS workflows~~ — **RESOLVED 2026-10-04:** push
  triggers disabled, archived to manual dispatch.
- No orphan-object GC for S3.
- No external paging/alerting beyond Sentry+Railway.
- Single production environment; no staging env on Railway.
- Help Center content is bundled in web source (not CMS-editable).
- Mobile lacks in-app support/help and production EAS profile (Phase 1).

## Explicitly deferred
- iOS store release, mobile admin console, automated payout rail,
  automated KYC activation.
