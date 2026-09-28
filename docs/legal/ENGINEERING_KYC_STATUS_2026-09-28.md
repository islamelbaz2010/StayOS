# Engineering KYC Status Addendum — 2026-09-28

> **This is an engineering status update. It is not legal advice and does
> not replace counsel/accountant review.** It updates only the
> engineering-evidence portions of the Legal, Accounting & Regulatory
> Readiness pack (v3, 2026-09-23). Every legal question in that pack
> remains open for counsel.

## Engineering facts (verified at commit `12d5306`)

- Automated identity-verification architecture is implemented:
  `IdentityVerificationProvider` abstraction with a `SumsubProvider`
  adapter, embedded Web SDK flow, server-minted session tokens, and an
  HMAC-signed, idempotent, server-authoritative webhook
  (`POST /api/v1/kyc/webhooks/sumsub`).
- Internal states: `unverified`, `pending`, `retry_required`,
  `manual_review`, `verified`, `rejected`. Provider outcomes map
  server-side only; the browser is never the source of truth.
- The manual upload + admin review path is preserved as fallback and as
  the exception path for provider escalations.
- KYC media storage is private Tigris S3 (`indexed-piggybank-xq6yf5j`)
  with bucket-scoped credentials and presigned access — no public
  exposure, no media duplication for provider-mode verifications.
- **Production automated KYC is disabled** (`KYC_VERIFICATION_MODE`
  unset → `manual`; no `SUMSUB_*` credentials configured). Engineering
  does not assert that automated verification is live.

## COUNSEL TO CONFIRM (unchanged)

- Biometric-data processing consent language + privacy-policy update
  (face images / liveness are biometric data under PDPL analysis).
- Provider (Sumsub) DPA, sub-processor and data-residency review.
- Retention/deletion policy for identity data, including provider-side
  retention and media lifecycle for manual uploads.
- Cross-border transfer analysis (provider processing location vs.
  Egyptian users' data under PDPL).
- Whether Egypt market-entry obligations (e.g., hospitality/tourism
  identity verification norms) impose additional duties on top of the
  technical flow.
- Licensing and any regulator-facing KYC/KYB obligations for the
  marketplace operator.

## Accountant to confirm (unchanged)

- No change — KYC work does not alter pricing, VAT, commission, payout
  timing, or ledger semantics.

## Activation gate

Engineering will not set `KYC_VERIFICATION_MODE=automated*` or configure
`SUMSUB_*` credentials until the provider account exists **and** the
consent/privacy/DPA/retention items above are resolved.
