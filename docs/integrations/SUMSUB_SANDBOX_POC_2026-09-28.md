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

## 3. POC execution status — 2026-09-29 update

**LIVE SANDBOX RUN: PASS** (server-side chain) / **PARTIAL** (in-browser
capture is a human step — see below).

Sandbox credentials were supplied via `.env` (never committed). All five
legs were executed against the real Sumsub Sandbox API and a live local
StayOS API (`ENVIRONMENT=development` + `SUMSUB_ALLOW_SANDBOX=true`,
scratch DB, `cloudflared` tunnel):

| Step | Result |
|---|---|
| `POST /resources/accessTokens/sdk` | PASS — real token minted (`_act-s…`, 600s TTL); signing + `userId`=externalUserId + `levelName=id-and-liveness` all accepted |
| `POST /resources/applicants` (externalUserId) | PASS — applicant `6abae755…` created (201), `externalUserId` round-trips |
| `POST …/status/testCompleted` GREEN | PASS — `{ok:1}`; sandbox decision simulated |
| WebSDK launch (headless Chromium, real `@sumsub/websdk@2.9`) | PASS — iframe booted with the minted token, zero console errors; driven through provider screens (privacy notice → consent → step list "Provide identity document → liveness check" → Start); capture itself requires a real camera/human |
| `applicantCreated` webhook → local API | PASS — externalUserId resolution + real `applicantId` backfill (ordering fix proven live) |
| `applicantReviewed` GREEN webhook | PASS — doc→`verified`, `verified_at` set, `user.kyc_status`→`verified` |
| `applicantReviewed` RED RETRY → GREEN | PASS — `retry_required` → `verified` |
| `applicantReviewed` RED FINAL → GREEN re-review | PASS — `rejected` → `verified` (documented re-review semantics) |
| Duplicate deliveries | PASS — `already processed` (Redis idempotency) |
| Unsigned / tampered-body webhooks | PASS — 401 (fail closed) |
| `GET /resources/applicants/{id}/status` + `/one` | BLOCKED — 404; the sandbox token lacks the **View applicants** permission. Only affects `get_applicant_legal_name` (best-effort, fails to `None`) and `get_status` (currently uncalled). Core webhook-authoritative flow unaffected. |
| In-browser document capture + liveness | EXTERNAL — requires a human with a camera (headless drive reached the capture entry incl. provider Sumsub-ID email gate; fake camera feeds cannot complete liveness) |
| Sumsub→StayOS live webhook delivery | EXTERNAL — receiver registration is Dashboard-only (no `POST /resources/webhooks` API); see §4 |

**Production-safety guard added this batch:** `sbx:` tokens are active
only when `SUMSUB_ALLOW_SANDBOX=true` **and** `ENVIRONMENT` is
`development`/`test`; `prd:` tokens require `ENVIRONMENT=production`.
The guard applies to both session/config paths (`is_configured`) and
webhook signature verification (sandbox-signed webhooks fail closed in
deployed environments). This matters because the Founder placed sandbox
credentials on Railway production — they are now inert there regardless
of `KYC_VERIFICATION_MODE`/`SUMSUB_LEVEL_NAME`/`SUMSUB_WEBHOOK_SECRET`.

## 4. Sumsub Dashboard actions (Sandbox only — still required)

1. **Webhook manager** (Dev space → Webhooks): create one receiver —
   Target: `https://<api-host>/api/v1/kyc/webhooks/sumsub`, receiver
   HTTP address, signature algorithm **SHA256**, resend enabled,
   applicant types: Individuals, webhook types:
   `applicantCreated`, `applicantPending`, `applicantReviewed`,
   `applicantOnHold`, `applicantAwaitingUser`, `applicantAwaitingService`,
   `applicantActionPending`, `applicantActionReviewed` — all mapped to
   StayOS outcomes in `parse_webhook`. Copy the generated **Secret key**
   into `SUMSUB_WEBHOOK_SECRET` (local `.env`) — Production toggle stays
   OFF. For a live-delivery re-test keep the temporary tunnel running
   (or register a stable staging URL).
2. **App token permissions** (optional, recommended): add **View
   applicants** to `stayos-sandbox-websdk-poc` — enables
   `get_applicant_legal_name` enrichment on GREEN and any future
   `get_status` polling. Without it those calls return 404 (handled —
   legal name simply stays unset). Do not add any other permissions.
3. Do **not** switch to Production mode, verify the company, or start a
   trial.

## 5. Recommended sandbox isolation

- **Local path (used for this run):** `.env` sandbox values +
  `KYC_VERIFICATION_MODE=automated_fallback` +
  `SUMSUB_ALLOW_SANDBOX=true` (dev/test only); `cloudflared` tunnel for
  the webhook receiver; dedicated test users only.
- **Deployed environments:** sandbox tokens are inert by construction
  (see §3 guard) — a `sbx:` token on Railway production can neither mint
  sessions nor authenticate webhooks.
- **Production activation (future, intentional):** requires a `prd:`
  token pair + `ENVIRONMENT=production` + `KYC_VERIFICATION_MODE` +
  production webhook secret — plus the legal/privacy prerequisites.

## 6. Production safety (verified after this batch)

Railway production currently carries `SUMSUB_APP_TOKEN`/`SUMSUB_SECRET_KEY`
(sbx:-scoped) but no `SUMSUB_LEVEL_NAME`/`KYC_VERIFICATION_MODE`/
`SUMSUB_WEBHOOK_SECRET`, and `ENVIRONMENT=staging` there. With the
guard deployed: `is_configured()`=False → `automated_available`=False →
manual mode everywhere; sandbox-signed webhooks rejected 401.
Recommendation (hygiene, not a vulnerability): remove the sbx variables
from Railway production once POC work concludes — they can only ever be
inert there.

## 7. Remaining external steps

1. Founder: create the Dashboard webhook receiver (§4.1) — enables live
   Sumsub→StayOS delivery (the only leg not yet observed end-to-end;
   every property it exercises — signature, idempotency, resolution,
   state mapping — is verified with real signed payloads).
2. Founder (optional): add **View applicants** to the token (§4.2).
3. Optional UX pass: a human runs the in-browser capture/liveness once
   — the SDK owns document quality, authenticity, liveness and
   face-match; StayOS code contains no custom capture logic.
