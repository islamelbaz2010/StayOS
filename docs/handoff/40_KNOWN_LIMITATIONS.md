# 40 — Known Limitations & External Blockers

## External blockers (not code gaps)
| Item | State |
|---|---|
| Paymob Payouts provisioning | credentials unissued — host payouts manual |
| Sumsub production activation | creds + legal/privacy approval pending — manual KYC runs |
| Egyptian e-invoice/e-receipt | no integration exists; regulatory timing — accountant/legal item |
| Entity/bank details for manual transfers | `PAYMENT_BANK_*` placeholders unset |

## Engineering limitations (known, accepted)
- Stale `deploy-*.yml` AWS workflows fail on push (deploy is Railway/Vercel).
- Prod API `ENVIRONMENT=staging` → dev-token endpoint reachable; tighten
  before public launch.
- No orphan-object GC for S3.
- No external paging/alerting beyond Sentry+Railway.
- Single production environment; no staging env on Railway.
- Help Center content is bundled in web source (not CMS-editable).
- Mobile lacks in-app support/help and production EAS profile (Phase 1).

## Explicitly deferred
- iOS store release, mobile admin console, automated payout rail,
  automated KYC activation.
