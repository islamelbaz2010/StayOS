# 38 — Mobile Readiness

> Full audit: `MOBILE_GAP_AUDIT_2026-10-04.md`,
> `MOBILE_API_PARITY_2026-10-04.md`, plan: `MOBILE_PHASE_1_EXECUTION_PLAN.md`.

## Verdict: READY TO START — substantive app, no structural blocker

`apps/mobile` is a real Expo/React Native application, not a scaffold:

- **Stack:** Expo SDK, React Native, TypeScript, React Query, Axios client
  (`src/lib/api.ts`), `expo-router`-style screen tree.
- **Auth:** JWT in `expo-secure-store`; refresh/logout flows wired;
  `device-token` push registration.
- **Screens:** 28 — guest (search, listing, booking, payment, trips,
  messages, notifications, profile, settings) + host (dashboard,
  listings, calendar, bookings, earnings, profile).
- **Payments:** Paymob hosted checkout via webview handoff.
- **i18n:** EN/AR + RTL (`I18nManager`), AsyncStorage locale persistence.
- **Config:** `app.json` (scheme `stayos`, id `com.stayos.mobile`),
  `eas.json` profiles (dev/preview APK), Android CI workflows + preview
  APK artifact.
- **Deep links:** scheme configured; notification taps route.

## Gaps (non-blocking — Phase 1 scope)
- Support-chat + Help-Center screens for the new endpoints
  (`/messages/support*`, help catalog).
- Governorate→area→listing filter params parity on host bookings.
- Production EAS profile + iOS build not yet provisioned.
- Some newer API fields may need hook/type updates (parity matrix lists).

## Gate
No genuine blocker → **PHASE 4 — MOBILE = READY TO START**.
