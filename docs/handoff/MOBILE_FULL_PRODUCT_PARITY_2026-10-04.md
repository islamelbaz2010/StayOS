# Mobile Full Product Parity — 2026-10-04

## Baseline & scope

- Baseline commit: `cfa222a1156e31c9465800899d53e3fe31bda7f9` (accepted Web/source state)
- Working tree: mobile parity implementation on top of baseline — committed through `ce050f0` on `main`; founder device acceptance completed on the GitHub Actions Gradle artifact
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

## Verification status — ACCEPTED on physical device

- `npx tsc --noEmit`: CLEAN
- `npx jest`: 12/12 PASS (auth pub/sub, useHasTokens propagation, QA gating, booking contract)
- Secret scan: CLEAN
- Backend pytest / web suite: not re-run (no backend/web changes in this batch)
- Final QA APK (`7f177cce`) installed on `TKINR8IJ5D9DSKQK` and verified:
  - QA role panel present; **Guest** login → guest Home immediately;
    **Host** → host dashboard w/ real reservations; **Staff** → permission-gated
    OpsHome (6 grants, admin-only sections hidden); **Admin** → full OpsHome incl.
    Maintenance & readiness + Operations overview
  - **Logout** → immediate logged-out Account tab (no restart)
  - **Booking**: listing → dates → Confirm → Payment screen → Paymob hosted
    checkout (`accept.paymob.com`, EGP 96,672) → "Thanks for your payment" →
    backend confirms booking `e76ddcbc` `confirmed`/`check_in_ready`, payment
    `STY-E9F10C92` `verified` via Paymob
  - Email/password register + login verified via API (token pair returned)

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

**4. GitHub APK artifact** — `build-mobile-android.yml` rewritten (see batch 3 for the final Gradle-primary form).

## Acceptance-defect fixes (batch 3 — GitHub Gradle APK pipeline)

**1. Gradle pipeline is now the PRIMARY QA/acceptance APK path** — `.github/workflows/build-mobile-android.yml` builds the APK natively in CI: Node 20 + Java 17 + Android SDK → `npm ci` → `expo prebuild --platform android --no-install` → `gradle assembleRelease` → verify APK + bundled JS → `actions/upload-artifact@v4`. No `EXPO_TOKEN` required for the Gradle path. `workflow_dispatch` with a `profile` input (default `qa`); `qa` injects `EXPO_PUBLIC_QA_MODE=1` + the staging API URL at bundle time. Artifact: `StayOS-Android-QA-<short-sha>.apk` (30-day retention); `GITHUB_STEP_SUMMARY` records commit/branch/build type/package/version/API env/run number. `build-android-local.yml` remains as the local standalone reference (same approach, run on demand). EAS remains a secondary cloud/distribution path (`eas.json` `qa` profile unchanged) — not required for founder acceptance.

**2. Logout "dead tap" root-caused** — three compounding issues, all fixed:
- `handleLogout` on `AccountScreen`/`HostProfileScreen` awaited SecureStore + server logout before clearing local state; now fully non-blocking (in-memory flag flips synchronously inside `clearTokens()`, cache clears + navigate happen immediately, storage/server cleanup is fire-and-forget).
- Stale-render: cached `useMe`/`useHostOwnProfile` data could keep rendering logged-in UI after tokens cleared (frozen background screen + disabled-query cache). `AccountScreen` and `HostProfileScreen` now gate on `useHasTokens()` directly — the logged-out branch renders the instant `_hasTokens` flips, independent of query state.
- Bottom-edge touch dead zone above the tab bar on gesture-nav devices: both scroll views got `contentContainerStyle.paddingBottom = insets.bottom + spacing.xl` so the logout button never sits flush against the nav area.

**3. Final device verification (artifact `StayOS-Android-QA-ce050f0.apk`, GitHub run `37194815084`)**:
- Guest QA login → immediate Account tab (Acceptance Guest, verified badge) — twice.
- Guest logout → immediate logged-out branch (Login / Create account) — twice, consecutive cycles.
- Host QA login → real host dashboard ("Staying/Departing: Acceptance Guest", reservations, earnings 178,416 EGP) → Host profile logout → immediate swap to guest Home + logged-out Account tab.
- Session persistence: force-stop → relaunch → correctly stays logged out; earlier cycles confirmed logged-in persistence across restarts.
- Prior Gradle artifact (`04efd82`, run `37192044283`) verified: all four QA roles on-device, Arabic RTL end-to-end, booking → Payment → Paymob hosted checkout → "Payment verified" (booking `e76ddcbc` `confirmed`, payment `STY-E9F10C92` `verified` server-side). Only logout code changed since — booking/payment paths untouched.

## Build & device (batch 2)

- EAS build `794389cb-ae6e-4c58-a41a-78140aceddee` (profile `qa`) — verified on-device: QA login buttons, guest login → immediate routing, booking → Payment screen → Paymob hosted checkout → payment `verified` (ref `STY-E9F10C92`, booking `e76ddcbc` `confirmed`/`check_in_ready`).
- EAS build `7f177cce-7e55-4507-ad0b-47c1cf857656` (profile `qa`) — adds logout ordering fix + axios timeout.
- QA backend verified reachable; dev-token live for all four fixtures; booking + Paymob checkout-session verified via API and on-device.

## Build & device (batch 3 — Gradle artifacts)

- GitHub Actions `build-mobile-android.yml` runs: `37190128971` (dispatch), `37192044283` (`04efd82`), `37193579416` (`9de6c64`), `37193939795` (`cfdff0e`), `37194815084` (`ce050f0`) — all green, each producing `StayOS-Android-QA-<short-sha>.apk` via `actions/upload-artifact@v4`, downloadable from the run's Artifacts section.
- Final acceptance artifact: `StayOS-Android-QA-ce050f0.apk` (commit `ce050f0`, ~66 MB, `com.stayos.mobile`) — installed on physical device `TKINR8IJ5D9DSKQK` (CPH2481), all critical flows pass.
- Gradle release builds sign with the debug keystore — signature differs from EAS builds; `install -r` requires uninstall first when switching between EAS/Gradle artifacts.

## Known limitations

- EAS archive 261 MB (no `.easignore` yet) — upload time only, not a defect.
- `AdminBookingsScreen` financial context needs `payments` grant (bookings list needs `operations`) — a staff member may need both grants to see full detail; backend enforces.
- iOS unbuilt (Android-first per phase); Google Play profile exists but untested.
- Push notification token registration wired via `push.ts`; end-to-end push delivery unverified on device.
- GitHub Gradle artifact flow fully exercised in CI — no `EXPO_TOKEN` needed; `EXPO_TOKEN` only matters if the optional EAS path is invoked.
- The touch dead-zone above the gesture nav bar observed on the test device is worked around via safe-area padding on the two logout-bearing scroll views; other screens place actions higher in the content flow.
- Jest emits harmless `act()` warnings from React Query; a worker-force-exit notice appears but the suite exits 0.
