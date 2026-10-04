# 07 — Mobile Architecture

Expo / React Native app at `apps/mobile/` — `com.stayos.mobile`, scheme `stayos`.

## Structure
- `App.tsx` — root navigator + auth gate + role-aware home (guest vs host).
- `src/screens/` — 16 guest/shared screens; `src/screens/host/` — 12 host screens.
- `src/lib/api.ts` — axios client; JWT access token in `expo-secure-store`;
  refresh + 401 retry path; base URL from `app.config.js`/env.
- `src/lib/hooks.ts` — React Query hooks (~45 endpoints, mirrors web contracts).
- `src/lib/LocaleContext.tsx` — EN/AR locale in AsyncStorage + RTL layout.
- `src/lib/push.ts` — Expo push token → `POST /auth/device-token`.
- `src/lib/akedlyShield.ts` — Akedly OTP shield integration.
- `src/lib/i18n.ts`, `theme.ts`, `recentlyViewed.ts`, `types.ts`.

## Native / build
- `app.json` (Expo config), `app.config.js` (env-driven extras),
  `eas.json` — currently only a `preview` internal APK profile; no
  production EAS profile yet.
- Workflows: `build-mobile-android.yml` (EAS APK via EXPO_TOKEN),
  `build-android-local.yml` (non-EAS local Gradle build artifact).
- A preview APK already exists in-repo (`StayOS-preview.apk`).

## Parity gaps vs web (see `MOBILE_GAP_AUDIT_2026-10-04.md`)
No support conversations, no Help Center, no notifications inbox screen,
no governorate filters — all surfaced in the Phase 1 plan.
