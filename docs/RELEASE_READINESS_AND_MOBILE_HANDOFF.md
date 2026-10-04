> **STATUS: SUPERSEDED / HISTORICAL**
>
> **AUTHORITATIVE REPLACEMENT:** `docs/handoff/STAYOS_SOURCE_CODE_DEVELOPER_HANDOFF_2026-10-04.md`
> (plus `docs/handoff/STAYOS_CURRENT_STATUS_2026-10-04.md` for current-state).
>
> Do not use this document for current architecture, production state,
> deployment, or release decisions. Retained for historical evidence only.

# StayOS — Release Readiness & Mobile Handoff

R3 consolidated gate. Authoritative state as of the commit that adds this file.

## 1. Project identity

- Repo: StayOS monorepo — `src/app` (FastAPI backend), `apps/web` (Next.js 14), `apps/mobile` (Expo SDK 51 / RN 0.74.5)
- Canonical branch: `main`
- Starting HEAD: `4348e20` (R2 closeout)
- Railway project: `stayos-demo`, environment `production` — services: `stayos-demo` (API), `worker`, `beat`, Postgres, Redis
- Web production: Vercel (`web-amber-pi-98.vercel.app`)

## 2. R3 changes implemented

### Backend (notification providers — real defects fixed)

| Change | File |
|---|---|
| `send_email` now sends via `boto3` SES v2 (previously unsigned raw HTTP → guaranteed production rejection) | `src/app/notifications/providers.py` |
| `send_sms` uses configured `TWILIO_SMS_FROM` (was placeholder `+0000000000`) | `src/app/notifications/providers.py`, `src/app/config.py` |
| New `send_push` provider → Expo Push API (unauthenticated sends supported; `EXPO_ACCESS_TOKEN` optional hardening) | `src/app/notifications/providers.py`, `src/app/config.py` |
| Push channel added to dispatcher + appended to every event's channel list; one notification row per active device token | `src/app/notifications/services.py`, `src/app/notifications/constants.py` |
| `get_active_device_tokens` repository helper | `src/app/auth/repository.py` |
| New settings: `TWILIO_SMS_FROM`, `SES_FROM_EMAIL` (default `noreply@stayos.co`), `EXPO_ACCESS_TOKEN` | `src/app/config.py` |
| Tests: SES mocked via boto3, SMS sender tests, push provider tests, channel-list updates, device-token stubs | `tests/test_notifications.py`, `tests/test_account_settings_r1.py` |

No new migration — `device_tokens` table exists since migration `012`; head remains `051_account_profile_r1`.

### Mobile (handoff gaps closed)

| Change | File |
|---|---|
| Tokens moved from AsyncStorage (plaintext) to `expo-secure-store` (Keychain/Keystore) | `src/lib/api.ts` |
| Paymob hosted-checkout handoff: "Pay by card" opens `payment.checkout_url`, or POSTs `/payments/{id}/checkout-session` first — mirrors web behavior | `src/screens/PaymentScreen.tsx`, `src/lib/hooks.ts` (`useCheckoutSession`), `src/lib/types.ts` (`checkout_url`) |
| Push registration: permission → Expo push token → `POST /auth/device-token`; runs once per authenticated user, best-effort | `src/lib/push.ts`, `App.tsx` |
| Deep-link config: `stayos://` scheme mapped to all stack routes | `App.tsx` (scheme already in `app.json`) |
| Plugins: `expo-notifications`, `expo-secure-store` | `app.json`, `package.json` |
| EN/AR strings for card-pay CTA | `src/lib/i18n.ts` |

## 3. Web launch gate — findings

| Finding | Class | Notes |
|---|---|---|
| Email provider unsigned HTTP call | A → **fixed** | Now boto3 SES v2 |
| SMS placeholder sender | A → **fixed** | Fails fast with clear error until `TWILIO_SMS_FROM` is set |
| `TWILIO_SMS_FROM` not set in prod | D | Founder must provision a Twilio number / Messaging Service SID; set on API + worker |
| SES sender identity verification | D | `SES_FROM_EMAIL` defaults to `noreply@stayos.co`; domain/address must be verified in AWS SES (and SES out of sandbox) |
| `SENTRY_DSN` absent | D | Monitoring optional at launch; recommended before ads |
| Paymob credentials | G | All Paymob vars present in production (API + worker) |
| Terms/Privacy/Help | G | Live, CMS-backed, EN+AR verified on production |
| Model B commercial engine | G | 33/33 tests; ledger invariant intact; no waiver logic |
| Legal copy final approval | E | CMS structure in place; formal legal review is external |

Web has no remaining code-level launch blockers.

## 4. Mobile API contract map

All existing, server-authoritative. No new endpoints added.

- **Auth:** `POST /auth/otp/send`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`, `/auth/dev-token` (dev only), `POST /auth/device-token`, `GET/PATCH /auth/me`, `PATCH /auth/me/role`
- **Discovery:** `GET /listings`, `/listings/{id}`, search/filter params, `GET /units/{id}/availability`
- **Booking:** `POST /bookings`, `GET /bookings`, `/bookings/{id}`, `/bookings/{id}/stay`; checkout pricing is server-computed
- **Payments:** `GET /payments/booking/{id}`, `POST /payments/{id}/checkout-session`, `POST /payments/{id}/proof`, `/proof/presign`; webhook is server-side only
- **User:** account settings, favorites, notifications, privacy — all existing
- **Comms:** conversations/messages send+read, notifications list + unread count
- **Host:** dashboard, listings CRUD + availability, reservations, earnings, payout prefs, KYC
- **Media:** presigned upload → PUT to S3 → register; shared endpoint-aware storage client, no public buckets

No mobile-blocking API gaps found.

## 5. External dependencies (not code)

1. `TWILIO_SMS_FROM` — provision sender, set on `stayos-demo` + `worker` services
2. SES sender verification (`SES_FROM_EMAIL` / `noreply@stayos.co`) + sandbox egress — AWS console
3. Apple Developer account + App Store Connect app record
4. Google Play Console account + app record; production keystore via EAS
5. `EXPO_ACCESS_TOKEN` (optional) — hardens Expo push
6. `SENTRY_DSN` (optional) — crash/error monitoring
7. `eas.json` production profile — add `production` build profile when submitting (one-line config, deferred to submission batch)
8. Universal links / App Links for `https://` deep links — optional; `stayos://` scheme works now

## 6. Legal / founder decisions

1. Formal legal approval of Terms/Privacy copy (CMS content is placeholder-pending approval)
2. Twilio sender number selection (Egypt SMS routing implications)
3. Whether launch advertises before SES sandbox egress is granted — transactional email volume will be low at launch but must be confirmed

## 7. Tests

- Backend: **1406 passed**, coverage **80.51%**
- Web: 132 passed (unchanged — no web diff this batch)
- TypeScript: web clean; mobile clean
- Lint (ruff, touched files): clean
- Web production build: green (R2-verified; unchanged since)
- Commercial: Model B 33/33, canonical 1760.16 invariant, no waiver

## 8. Deferred

Co-hosts marketplace, experiences, services, referrals, gift cards, insurance products, automated KYC, AI pricing, multi-currency, social login, passkeys, MFA, universal links, Sentry adoption, eas.json production profile.

## 9. Next execution batch

**R4 — Mobile MVP implementation batch**: build guest + host MVP screens on the now-secured foundation (secure storage, push registration, deep links, Paymob handoff) using the contract map in §4. Nothing in the web or backend needs reopening to start it.
