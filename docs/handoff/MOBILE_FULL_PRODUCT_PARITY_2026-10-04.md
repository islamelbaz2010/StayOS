# Mobile Full Product Parity — 2026-10-04

## Baseline & scope

- Baseline commit: `cfa222a1156e31c9465800899d53e3fe31bda7f9` (accepted Web/source state)
- Working tree: mobile parity implementation on top of baseline (uncommitted at time of writing; final commit + single handoff refresh happens after founder device acceptance)
- Scope: Android-first full-product parity — Guest, Host, Staff, Admin — against the real FastAPI backend. No mock APIs, no duplicated business truth, backend remains authoritative for all business rules and authorization.

## Screens

- Before: 28 screens (guest-heavy)
- After: ~47 screens
  - Root: Account, Booking, Disputes (new), Favorites, ForgotPassword (new), HelpArticle (new), HelpCenter (new), Home, HostProfile, Inbox, Kyc (rewritten: doc-type + required-sides driven), ListingDetail, Login (rewritten: email+password primary, OTP secondary), Message (+ offer cards), Notifications (new), Payment, Payments, Register (new), Search, Support (in-app, replaces WhatsApp-only), TripDetail (+ dispute entry)
  - host/: Today, Listings, ListingDetail, ListingEditor, Photos, Calendar, Availability, CoHosts, CreateListing, Earnings, Bookings (new — status/unit/search/geo filters), ReservationDetail, Payments (new), Profile
  - settings/ (new): Profile (avatar via presign `s3_key`), PersonalData (account + payout `bank|iban|wallet|paymob`), Security (password set/change, sessions, logout-all), Privacy (privacy toggles, notification prefs, export, delete account)
  - ops/ (new): OpsHome (permission-gated hub), OpsKyc (manual queue + read-only `inflight`), OpsPayments (verify/reject/refund), OpsSupport (queue + status), OpsDisputes, OpsReviewReports, OpsListings (moderation), OpsTasks (maintenance + readiness — real endpoints, no fake task list), AdminUsers, AdminBookings (+ financial context), AdminListings, AdminDiscovery (candidates + import), AdminReports (catalog + results), AdminStaff, AdminAdjustments, AdminFinance (escrow/payouts/ledger)
  - lib/help/: ported static help catalog (guest + host articles)

## Role matrix

| Role | Root surface | Verified capabilities |
|---|---|---|
| Guest | GuestTabs | Home, search, listing, favorites, booking, Paymob hosted checkout, trips/cancel, messages, notifications, profile/settings/KYC/support/help/disputes/offers |
| Host | HostTabs | Today, listings + editor + photos + calendar, reservations, bookings w/ real filters, earnings, payments, host profile, offers in conversations |
| Staff | OpsTabs | OpsHome sections filtered by `staff_permissions`; backend enforces every endpoint |
| Admin | OpsTabs | All staff sections + admin-only: users, staff mgmt, overview, maintenance/readiness |
| field_staff | OpsTabs | Task actions via maintenance → related task |

## API parity — corrections applied this session

| Defect | Fix |
|---|---|
| `GET /operations/tasks` (nonexistent) | Rewrote OpsTasksScreen on real `/operations/maintenance`, `/operations/readiness`, `/operations/tasks/{id}` + actions |
| KYC pending `inflight` ignored | Type + read-only provider-managed section in OpsKyc |
| `national_id` front+selfie only | KycScreen rewritten: doc-type selector + `required_sides`-driven capture (front/back/selfie) |
| Avatar presign `avatar_key`/`{avatar_key,url}` | Real contract `s3_key` / `{s3_key}` |
| `payout_method: bank_transfer` | `bank` (backend enum: bank, iban, wallet, paymob) |
| `InAppNotificationList` `data/total` | `items`/`unread_count` |
| Discovery contact fields + import payload | `contact_type/value`, `{host_name,host_phone,host_email,overrides}` (price via `overrides.price`) |
| PaginatedResponse `data` | `items` (admin users) |
| Adjustment enums | host_credit/host_debit/guest_credit/guest_debit + category set; decide body `{approve}` |
| `/admin/adjustments` shown admin-only | Actually `payments` permission — section + hooks corrected |
| `/admin/bookings/{id}/financial-context` | `/admin/bookings/{id}/financial` |
| Discovery status POST | `PATCH /discovery/candidates/{id}/status` |
| `/admin/listings` admin-only | `listings` permission — section corrected |
| `/host/bookings` shown admin-only | `operations` permission — section corrected |
| `/operations/*` shown for "operations" staff | Role-gated (admin) — section now admin-only |
| `/finance/ledger` without account | `ledger_account` required — selector added |
| Privacy export discarded response | Inline display of returned export payload |
| Dev login in release APK | Gated `EXPO_PUBLIC_ENABLE_DEV_LOGIN` **and** `__DEV__` — verified absent in release |

## Auth

- Email+password login (primary), OTP (secondary tab), register (`/auth/register` → TokenPair auto-login), forgot/reset password, password set/change, sessions list, logout-all, refresh-token rotation on 401, Secure Store persistence.
- Dev login: dev builds only.

## Payments / KYC / Messaging

- Paymob: `/payments/quote` → `/payments/booking/{id}` → `/payments/{id}/checkout-session` → hosted Paymob checkout → status polling. Sandbox contract unchanged.
- KYC: manual upload mode (production mode); provider-aware `verification_mode`/`required_sides`/`automated_available` fields modeled; no provider secrets in bundle.
- Messaging/support: canonical conversation API (`/messages/*`), support threads via `/messages/support`, offer cards + accept/decline in conversation, admin-initiated conversations.

## i18n/RTL

- en + ar blocks extended for all new screens; `I18nManager.forceRTL` applied on locale change; Arabic verified rendering correctly on device (RTL tab order, translated labels).

## Security

- Secret scan clean: only `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_SUPPORT_WHATSAPP_NUMBER`, dev-login gate vars.
- No Paymob secret, Sumsub secret, DB URL, S3/Tigris creds, JWT keys, admin creds in bundle.
- All authorization server-side; mobile only selects/filters surfaces.

## Build & device

- EAS preview build `1eaf8560-7d3e-4746-8839-78e51b7c47ad` (Android APK, SDK 51, package `com.stayos.mobile`)
- APK: https://expo.dev/artifacts/eas/VH6MV7L9jHgq-y6w20b7JUN3j2W_Vkw7F2UrRwxuILY.apk
- API URL baked: `https://stayos-demo-production.up.railway.app/api/v1`
- Device acceptance (automated smoke): install ✓, launch ✓, guest home with live Railway data ✓, listing images ✓, Arabic RTL ✓, login screen (email/password default, OTP tab, forgot-password, no dev-login leak) ✓
- Device: CPH2481 / TKINR8IJ5D9DSKQK
- Pending: founder interactive acceptance (registration, booking+Paymob, host/staff/admin flows, push)

## Test accounts (staging fixtures, no passwords shipped)

- Guest `acceptance-guest@stayos.test`, Host "Omar Hassan", Staff, Admin — seeded via `scripts/seed_acceptance*.py`. Role testing uses real accounts; dev-token only in dev builds (and only on non-production backends).

## Verification status

- `npx tsc --noEmit`: CLEAN
- `npx jest`: 12/12 PASS (auth pub/sub, useHasTokens propagation, QA gating, booking contract)
- Secret scan: CLEAN
- Backend pytest / web suite: not re-run (no backend/web changes in this batch)
- APK installs and runs against live backend

## Acceptance-defect fixes (batch 2)

**1. Auth state propagation** — root causes:
- `hasTokens()` was a module-level flag evaluated once at render; login set it but a disabled `useMe` (`enabled: hasTokens()`) never re-evaluated or refetched, and logout left stale cached data. No subscription existed, so nothing re-rendered until restart.
- `handleLogout` **awaited** `api.post("/auth/logout")` before clearing tokens, and axios had no timeout — a hung request blocked the `finally` forever, so logout taps appeared dead. Reordered: clear local tokens + query cache + navigate immediately, fire the server logout in the background; added a 30s axios timeout.

Fix: token-change pub/sub in `api.ts` (`subscribeTokenChanges`), `useHasTokens()` via `useSyncExternalStore`, subscribed once at `AppContent` (re-render cascades to every `enabled: hasTokens()` site); SecureStore hydration on mount; `queryClient.clear()` on any authed→false transition (logout + 401-refresh-failure).
Regression tests: `src/lib/__tests__/authState.test.tsx`, `api.test.ts`.

**2. Booking failure** — root causes found:
- Backend error envelope is `{error: {code, message, message_ar}}` but mobile read `data.detail` → every backend failure rendered as generic "Booking failed". Fixed via `apiErrorMessage()` (envelope + `message_ar` for ar locale, detail fallback).
- `create_booking` requires `kyc_status=verified` — unverified guests got an unexplained failure. Mobile now mirrors web gates: unauthenticated → login CTA, unverified → KYC CTA, own listing → blocked, before attempting.
- Post-create flow fixed to match web: `instant_book` → `navigation.replace("Payment", {bookingId})`; request-to-book → "request sent" → Trips (was a blanket "Booking Requested" alert with no payment path).
- API-level verification on the acceptance backend: quote → `POST /bookings` (status `accepted`) → payment record (`pending`) → `checkout-session` returns a real Paymob sandbox URL. Chain is sound; the mobile defect was state/gating/messaging.

**3. QA role logins** — new `qa` EAS profile (`EXPO_PUBLIC_QA_MODE=1`). Login screen shows "QA test accounts" (Guest/Host/Staff/Admin) only when `__DEV__ || EXPO_PUBLIC_QA_MODE` — absent in preview/production builds. Uses real `/auth/dev-token` (404s on production backends). Seeded fixture IDs verified live (all four mint tokens; guest is KYC-verified so it can book).

**4. GitHub APK artifact** — `build-mobile-android.yml` rewritten: `workflow_dispatch` profile input (default `qa`), artifact named `StayOS-Android-<short-sha>-<eas-build-id>.apk`, 30-day retention, build summary with commit/version/SDK/package/EAS ID. Requires `EXPO_TOKEN` repo secret (documented in the workflow). Note: artifacts only appear once changes are **pushed to `main`** — the mobile work was uncommitted during the first acceptance run.

## Build & device (batch 2)

- EAS build `794389cb-ae6e-4c58-a41a-78140aceddee` (profile `qa`) — verified on-device: QA login buttons, guest login → immediate routing, booking → Payment screen → Paymob hosted checkout → payment `verified` (ref `STY-E9F10C92`, booking `e76ddcbc` `confirmed`/`check_in_ready`).
- EAS build `7f177cce-7e55-4507-ad0b-47c1cf857656` (profile `qa`) — adds logout ordering fix + axios timeout.
- QA backend verified reachable; dev-token live for all four fixtures; booking + Paymob checkout-session verified via API and on-device.

## Known limitations / blockers

- EAS archive 261 MB (no `.easignore` yet) — upload time only, not a defect.
- Device `TKINR8IJ5D9DSKQK` dropped USB authorization mid-session — install of the QA APK requires the founder to replug/re-authorize the device.
- `AdminBookingsScreen` financial context needs `payments` grant (bookings list needs `operations`) — a staff member may need both grants to see full detail; backend enforces.
- iOS unbuilt (Android-first per phase); Google Play profile exists but untested.
- Push notification token registration wired via `push.ts`; end-to-end push delivery unverified on device.
- GitHub artifact flow requires `EXPO_TOKEN` secret + a push to `main`.
- Source handoff package NOT refreshed yet — refresh once, at final commit, per policy.
