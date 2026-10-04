> **STATUS: SUPERSEDED / HISTORICAL**
>
> **AUTHORITATIVE REPLACEMENT:** `docs/handoff/STAYOS_SOURCE_CODE_DEVELOPER_HANDOFF_2026-10-04.md`
> (plus `docs/handoff/STAYOS_CURRENT_STATUS_2026-10-04.md` for current-state).
>
> Do not use this document for current architecture, production state,
> deployment, or release decisions. Retained for historical evidence only.

# StayOS — Status Reconciliation — 2026-09-28

**Purpose.** External handoff artifacts (technical workbook
`StayOS_Technical_Developer_Handoff_Workbook_2026-09-23_v3.xlsx`, legal
readiness pack, marketing launch briefs) are not maintained inside this
repository and contain stale current-state statements. This note is the
authoritative replacement for the stale engineering fields; refresh the
external artifacts from it. It is not a new product specification — it
describes the verified current product state only.

## 1. Baseline

| Field | Stale statement (workbook) | Verified current state |
|---|---|---|
| Latest commit | `9a7de62` + `f062d6c` (KYC hardening) | `12d5306` |
| Branch | `product-completion-review` | `main` + `product-completion-review` (both at `12d5306`) |
| Web baseline | `2793339` | `12d5306` (deployed) |
| Backend tests | — | 1,440 passing, coverage 80.41% |
| Web tests | — | 143 passing; TypeScript clean; production build green |
| Railway | — | API + worker + beat all SUCCESS on `12d5306` |

## 2. KYC / identity verification

| Field | Stale statement | Verified current state |
|---|---|---|
| Decision | "Manual KYC remains alpha decision" (FD-02) | FD-02 **superseded by FD-28** — automated provider verification is the primary direction; manual review remains the fallback/exception path |
| Architecture | Custom upload + manual review only | `IdentityVerificationProvider` abstraction → `SumsubProvider` adapter; provider-owned document capture, quality/authenticity checks, liveness, face match |
| Session | none | `POST /api/v1/kyc/verification/session` mints a server-side provider SDK token; returns `mode="manual"` when the provider is unconfigured |
| Result channel | manual admin only | `POST /api/v1/kyc/webhooks/sumsub` — HMAC `x-payload-digest` (SHA-256/512), fail-closed, Redis-idempotent, server-authoritative |
| States | `unverified` / `pending` / `verified` / `rejected` | + `retry_required` (recoverable, user retries — no admin case) + `manual_review` (provider escalation → admin queue) |
| Document contract | universal "national ID front + selfie" | Per-type contract: `passport → photo page + selfie`; `national_id` / `driving_license` / `residence_permit → front + back + selfie`. Automated mode: provider decides per country/document. |
| UX | Egypt-specific copy | Neutral global copy EN/AR; document-type selector; "Start identity verification" CTA (camera in context); "can't use the camera" manual escape hatch |
| Mode | manual-only | `KYC_VERIFICATION_MODE`: `manual` / `automated` / `automated_fallback`. **Production is `manual` — no `SUMSUB_*` vars configured.** |
| Admin | every submission reviewed | Queue = manual submissions + `manual_review` escalations only; friendly doc-type labels; images private via signed URLs |

**Automated KYC status: code-ready, NOT production-active.** Activation
requires the external items in §4. Do not represent automated KYC as live.

## 3. Storage (verified 2026-09-28)

| Field | Stale statement | Verified current state |
|---|---|---|
| KYC storage | "KYC AWS S3 is not configured" | **Configured and operational** — Tigris (S3-compatible), bucket `indexed-piggybank-xq6yf5j`, bucket-scoped credentials, private, presigned PUT/GET |
| Endpoint | AWS | `https://t3.storageapi.dev`, region `ams` |
| Listings media | — | `stayos-listing-media-9-mg23`, private, presigned |
| Payment proofs | — | `optimized-shoebox-wufbvp6`, private, bucket-scoped credentials |
| CORS | per-deploy whack-a-mole (stale origins) | Stable exact origins only (prod domain + branch aliases + localhost); `7df3890` verified live: preflight PUT 200, real PUT → HEAD → GET → delete on all three buckets. Tigris does not evaluate partial wildcards; `*` intentionally rejected. |
| Manual KYC upload | broken (CORS drift) | Operational — all four upload categories verified |

## 4. External activation blockers (NOT code blockers)

- Sumsub account (sandbox/production), verification level
- `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, `SUMSUB_LEVEL_NAME`, `SUMSUB_WEBHOOK_SECRET`
- Sumsub dashboard webhook registration → `/api/v1/kyc/webhooks/sumsub` (SHA-256)
- `KYC_VERIFICATION_MODE=automated_fallback` (set only when the above exist)
- Legal/privacy: biometric-data consent + privacy-policy update, provider DPA, retention policy, cross-border processing review — **counsel to confirm**

## 5. Marketing/brand — reconciliation rules

- Egypt remains the **launch geography**; users are not assumed Egyptian —
  copy must not imply Egyptian citizenship is required.
- **Do not publish** "automated KYC" / "instant identity verification" /
  "AI verification" / "Sumsub verified" until production activation is
  complete and legally approved. General trust/verification language
  already in use is consistent with the shipped product.
- All prior guardrails unchanged: no internal economics (6%+6%), no legal
  "escrow" claim, no unapproved compliance/financial/payout claims, no
  Airbnb assets/copy, product truth first.
- Brand system unchanged (near-black / light neutral / lime accent /
  editorial hospitality / AR+EN / RTL).

## 6. External artifacts to refresh

| Artifact | Action |
|---|---|
| `StayOS_Technical_Developer_Handoff_Workbook_2026-09-23_v3.xlsx` | Not repository-maintained — refresh §§1–4 fields above |
| Legal/Accounting/Regulatory readiness pack v3 | Addendum created: `docs/legal/ENGINEERING_KYC_STATUS_2026-09-28.md` |
| Marketing launch briefs (V2, Product-UI, CI/GTM) | No factual claims need changing now; enforce §5 until activation |
| `FOUNDER_DECISION_REGISTER.md` | Already current (FD-28) — no change needed |

## 7. Security posture (unchanged, verified)

Provider credentials server-side only; SDK access token server-minted;
webhook signature fail-closed; KYC media private with bucket-scoped
credentials; admin-only document access; no biometric/PII data in logs;
no secrets in source control.
