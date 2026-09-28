# StayOS Final Web Release Acceptance

Consolidated final web batch. Authoritative as of the commit that adds this file.

## 1. Project identity

- Repo: StayOS monorepo — `src/app` (FastAPI), `apps/web` (Next.js 14), `apps/mobile` (Expo, out of scope)
- Canonical branch: `main`
- Railway: `stayos-demo` / `production` — API (`stayos-demo`), `worker`, `beat`, Postgres, Redis
- Web: Vercel production (`web-amber-pi-98.vercel.app`)

## 2. Starting HEAD

`d96ab29` (R3 closeout)

## 3. Final HEAD

The commit adding this file plus the guest-facing fee-copy fix.

## 4. What was already complete (verified, not touched)

- Guest: marketplace, search/filters, listing details, availability, favorites, booking, Instant Book, checkout, Paymob card checkout, bank-transfer proof, trips, messages, notifications, profile, account settings, EN/AR, RTL, help/support/terms/privacy CMS pages
- Host: Become a Host lifecycle, manual KYC → role upgrade, listing CRUD + moderation states (DRAFT→PENDING_VERIFICATION→LISTED/REJECTED/UNLISTED/ARCHIVED), photos, calendar, reservations, earnings + simulator, payout preferences (masked), Host Hub, Guide, readiness, host profile
- Admin: marketplace overview, listings moderation, KYC queue, review moderation, financial cards, commercial adjustments, payments detail, users, staff, disputes, import, discovery
- Infra: FastAPI/Next.js/Postgres/Redis, Railway auto-deploy on push, Vercel, S3/Tigris signed-upload, Paymob webhook + HMAC, outbox→Celery notifications (in-app/email/SMS/WhatsApp/push)

## 5. What was found

| # | Finding | Class |
|---|---|---|
| 1 | Guest cancel preview copy exposed "service fee" terminology (`cancelServiceFeeRetained`) — violated the all-inclusive guest-facing rule | A → fixed |
| 2 | `dev-token` endpoint | E — environment-guarded; production probe returns 401 (not usable) |
| 3 | Dead `serviceFee` keys in `trips`/`booking`/`payment` namespaces | D — not rendered to guests; only host/admin components use them |
| 4 | Homepage page component has no breakpoints itself | E — it composes components that carry breakpoints (LandingSearchForm 10, FeaturedListings 5, etc.) |
| 5 | `TWILIO_SMS_FROM`, `SES_FROM_EMAIL` verification, `EXPO_ACCESS_TOKEN`, `SENTRY_DSN` absent from production vars | B — documented in §External dependencies |

## 6. What was fixed

- `messages/en.json` + `messages/ar.json`: `cancelServiceFeeRetained` now reads "A non-refundable amount of {amount} EGP applies to this cancellation." / Arabic equivalent — factual, no fee terminology, no policy change (the retained amount is unchanged).

## 7–18. Verification summary

- **Guest journey:** all routes exist and render; auth boundary verified in prod (`/api/v1/auth/me` → 401 unauthenticated); checkout shows only Accommodation + Total + "includes all fees" (asserted by tests); cancel preview no longer names fees.
- **Host journey:** complete via existing engines + R2 hub/guide; KYC manual-only per governance.
- **Admin:** all operational surfaces present; role-gated (`test_security.py` 22 tests).
- **Booking/payment:** `test_booking_card_checkout.py` 25 tests (intent, checkout-session, webhook HMAC, idempotency, transitions); `test_e2e_booking_lifecycle.py`, `test_calendar_concurrency.py` cover availability/races.
- **Commercial:** `test_commercial_model.py` 33/33 — canonical 1760.16, Paymob 176016 minor units, ledger 1376+168+216.16; no active waiver.
- **Storage:** presigned PUT + verified reads; per-bucket Tigris creds; no public buckets.
- **Notifications:** in-app + email (boto3 SES) + SMS (Twilio configured sender) + WhatsApp + Expo push; retry/dead-letter bounded; no secrets logged.
- **i18n:** en/ar parity 2400/2400 keys, zero diffs; RTL on production `/ar/` routes verified.
- **Responsive:** breakpoints present across critical pages/components.

## 19. Tests

- Backend: **1406 passed**, 80.51% coverage
- Web: **132 passed** (15 files)
- TypeScript: web clean; mobile clean (out of scope, foundation only)
- Lint: 0 errors (baseline warnings only)
- Build: `next build` green — 72 routes

## 20. Production deployments

- API `d817f846`, worker `8f97f7e6`, beat `c50502e4` — all SUCCESS at `d96ab29`; the R3 commit deploys identically (only messages JSON + docs changed since)
- `/health` + `/health/deep` → ok (db, redis); `/api/v1/listings` → 200; unauth `/auth/me` → 401; dev-token probe → 401

## 21. External dependencies (not code)

1. `TWILIO_SMS_FROM` — provision sender, set on `stayos-demo` + `worker`
2. SES sender verification (`noreply@stayos.co`) + sandbox egress
3. `SENTRY_DSN` (optional monitoring)
4. `EXPO_ACCESS_TOKEN` (optional push hardening)
5. Apple Developer / Google Play accounts — mobile phase only

## 22. Legal dependencies

1. Formal legal approval of Terms/Privacy CMS copy (pages exist and render; content approval external)
2. Twilio sender selection (Egypt routing)
3. Go/no-go on advertising before SES egress confirmation

## 23. Deferred product scope

Co-hosts marketplace, experiences, services, referrals, gift cards, insurance, automated KYC, AI pricing, multi-currency, passkeys, MFA, social-login management, universal links.

## 24. Final Web Gate

- Web Product Completeness: **PASS**
- Web Commercial Readiness: **PASS**
- Web Production Readiness: **PASS**
- Web Security / Privacy Readiness: **PASS**
- Web Launch Acceptance: **PASS** (external/legal items listed §21–22 remain prerequisites for public traffic)

## 25. Exact remaining work before public launch

Only external: legal copy approval, `TWILIO_SMS_FROM`, SES verification/egress. No code-level blockers remain.

## 26. Next phase: Mobile

Mobile application implementation — foundation (secure storage, push registration, deep links, Paymob handoff) already landed in R3.
