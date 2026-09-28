# Sumsub Basic KYC — Sandbox POC Record — 2026-09-28

**Scope.** Technical proof-of-concept only: can the existing StayOS KYC
implementation run Sumsub's standard User Verification (Basic KYC) flow
in Sandbox end-to-end? **No subscription, no production activation, no
DPA, no commercial/legal commitment.**

**Baseline before this batch:** `4e9015c` (docs) / `12d5306` (KYC code).
Contract fixes below landed in the same commit as this document.

**Docs consulted (official):** docs.sumsub.com — Test in Sandbox,
Generate access token (`/resources/accessTokens/sdk`), Authentication
(request signing), App tokens, WebSDK, Webhooks. Fetched 2026-09-28.

## 1. StayOS ↔ Sumsub mapping (verified against docs)

| StayOS | Sumsub | Implementation | Sandbox requirement |
|---|---|---|---|
| `user.id` | `externalUserId` (=`userId` on `/accessTokens/sdk`) | adapter `create_session` | deterministic — stable user id ✓ |
| `kyc_documents.provider_applicant_id` | `applicantId` | backfilled from first webhook | `applicantCreated`/`Pending` event |
| `KYC_VERIFICATION_MODE` | Dashboard Sandbox/Production mode | `manual`/`automated`/`automated_fallback` | sandbox app token (`sbx:`) is mode-scoped ✓ |
| `POST /kyc/verification/session` | `POST /resources/accessTokens/sdk` | server-minted, HMAC-signed request | app token + secret + level name |
| `POST /kyc/webhooks/sumsub` | webhook receiver | `x-payload-digest` HMAC, Redis idempotent | webhook receiver + secret in Dashboard |
| `KycStatus` | `reviewStatus`/`reviewAnswer`/`reviewRejectType` | `parse_webhook` mapping | level's webhook set |
| `@sumsub/websdk` (`KycProviderFlow`) | WebSDK 2.0 | `snsWebSdk.init(token, refresh)` | browser camera + mic permission |

## 2. Defects found during doc contract review (fixed in this batch)

The live-sandbox run would have hit these — found and fixed preemptively
against the official contract:

1. **Session endpoint + param semantics** — adapter called legacy
   `POST /resources/accessTokens` with query params and sent the Sumsub
   `applicantId` as `userId`. Per current docs: JSON body to
   `/resources/accessTokens/sdk`; `userId` = *externalUserId* (our
   user.id). Resume is automatic by externalUserId — applicantId is
   never sent. **Was broken:** a retry would mint a token bound to a
   bogus externalUserId and fork the applicant chain.
2. **Webhook resolution dead end** — the old code stored the token
   response's `userId` (our own id) in `provider_applicant_id`, so
   `get_kyc_document_by_applicant(realApplicantId)` could never match →
   every webhook returned "not found", state never updated. **Fixed:**
   `ProviderEvent.external_user_id` + fallback resolution by user id +
   applicantId backfill (runs before idempotency no-op).
3. `applicantCreated`/`applicantAwaitingService` added to the
   in-progress group so the first webhook binds the applicant.
4. Request signing now covers the JSON body (`ts+METHOD+path+body`,
   `Content-Type: application/json`).

## 3. POC execution status

**SANDBOX BLOCKED — SUMSUB ACCOUNT ACTION REQUIRED (Blocker class B/E).**

No Sumsub account credentials exist anywhere in the project (env files,
Railway production, secrets — all verified empty). The Dashboard account
can only be created by the Founder. Until then no SDK token can be
minted and no live sandbox applicant can be created.

**Not** a code blocker — the chain is fully implemented and unit-verified:
session mint → SDK launch → webhook signature → idempotency → state
mapping → `/kyc/status` → UI.

## 4. Exact Founder checklist (Sandbox only — no subscription)

1. Register / sign in at `dashboard.sumsub.com` (email verification;
   do **not** start a paid plan, enter card details, or accept
   production terms — if signup *forces* a card/trial activation, stop
   and report back before proceeding).
2. Toggle the mode switch (top-right) to **Sandbox**.
3. **Settings → Developers → App tokens**: generate app token + secret
   key (sandbox pair — shown once).
4. **Verification levels**: confirm or create a Basic KYC level
   (e.g. `basic-kyc-level`) — document capture + selfie/liveness only;
   no AML/address/KYB steps.
5. **Settings → Developers → Webhooks**: add a receiver pointing at the
   sandbox test host (see §5) for `/api/v1/kyc/webhooks/sumsub`, signing
   algorithm SHA-256; copy the webhook secret.
6. Hand Devin **only** these via the secrets mechanism (never chat/git):
   `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, `SUMSUB_LEVEL_NAME`,
   `SUMSUB_WEBHOOK_SECRET`.
7. Do **not** set these in the Railway `production` environment and do
   not set `KYC_VERIFICATION_MODE` there.

## 5. Recommended sandbox isolation

- **Primary path — local:** run the API locally with `.env` sandbox
  values + `KYC_VERIFICATION_MODE=automated_fallback`; expose the webhook
  via a tunnel (ngrok/cloudflared) registered as the Sumsub receiver;
  run the Web UI locally against it; use one dedicated StayOS test
  account and Sumsub's official test documents/data only.
- **Optional later — Railway `staging` environment:** if a shared
  acceptance run is wanted, create a separate Railway environment rather
  than touching `production`. Sandbox tokens cannot perform production
  checks (mode-scoped by Sumsub), but keep them out of the production
  service anyway — their presence flips `automated_available` and would
  surface the provider flow to real users.

## 6. Production safety (verified after this batch)

`KYC_VERIFICATION_MODE`/`SUMSUB_*` — all unset in Railway production;
`automated_available=false` → `/kyc` renders the manual fallback; session
endpoint returns `mode="manual"`; unsigned webhooks rejected (401);
ENVIRONMENT=test blocks any outbound provider call in the test suite.
No marketing or legal claims changed; no production applicant can exist.

## 7. What remains after Founder provides sandbox credentials

Run `→ POST /kyc/verification/session` → WebSDK capture → Sumsub sandbox
decision → signed webhook → `/kyc/status` → UI. Record results in this
file's §3 (flip blocker to PASS/PARTIAL with evidence).
