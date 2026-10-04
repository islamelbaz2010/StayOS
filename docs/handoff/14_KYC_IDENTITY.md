# 14 — KYC / Identity Verification

## Reality check (evidence-based)
| Aspect | State |
|---|---|
| Product architecture | IMPLEMENTED — provider abstraction, Sumsub adapter, WebSDK initiation, signed webhooks, document types, selfie/liveness fields |
| Production activation | **NOT ACTIVATED** — `KYC_VERIFICATION_MODE` unset on the production service → defaults to `manual`; `SUMSUB_*` credentials unset |
| Current production flow | **Manual upload + admin review** (`manual_approve_kyc` in `kyc/services.py`, `/admin/kyc` queue) |

Do NOT claim automated KYC is live. The distinction is
*implemented architecture vs production activation*.

## Modes (`KYC_VERIFICATION_MODE`)
- `manual` (default, current prod) — document upload → staff review.
- `automated` — provider-driven (requires Sumsub provisioning).
- `automated_fallback` — provider when available, manual otherwise.

## Provider architecture (implemented)
- `SUMSUB_*` settings: base URL, app token, secret (request signing),
  level name, webhook secret, `SUMSUB_ALLOW_SANDBOX` guard.
- Migration `052_kyc_provider_fields` links a verification document to an
  external provider (applicant mapping, session/access token, provider refs).
- Webhook signature verification implemented; `SUMSUB_ALLOW_SANDBOX` must
  remain false in real production.

## Documents
- `kyc.kyc_documents` — type, status, storage refs.
- Storage: private `S3_KYC_BUCKET` with dedicated `S3_KYC_ACCESS_KEY_ID/SECRET`
  (falls back to `AWS_*`), signed-URL access only — KYC media is never public.
- Retention: legal/privacy dependent — open item for counsel; do not
  auto-delete without a founder/legal decision.

## Gating
Host onboarding requires verified identity (readiness checks). Guest-side
verification follows product policy — capability checks are server-side.
