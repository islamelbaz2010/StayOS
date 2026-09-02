# ADR — Mobile Framework for StayOS V1

**ADR ID:** ADR-MOBILE-FRAMEWORK
**Date:** 2026-08-17
**Status:** DECIDED
**Decider:** Founder / Engineering Lead

---

## Context

StayOS previously deferred native mobile to V3/Phase 2 (`MVP_SCOPE_FREEZE.md`, `06_STOP_DOING_LIST.md`, `DECISION_LOG.md` DEC-018). Management subsequently determined that StayOS should not continue toward launch without a credible Mobile V1. A React Native / Expo scaffold was created in `apps/mobile/`.

A separate Flutter vs React Native decision was historically open (`ADR-016` in `STAYOS_IMPLEMENTATION_BASELINE.md`). This ADR resolves that open decision in favor of the implementation already in the repository.

## Decision

**Use React Native with Expo for the StayOS Mobile V1.**

The mobile application will be built with:
- **Framework:** React Native 0.74.5
- **Expo SDK:** ~51.0.28
- **Navigation:** React Navigation 6 (bottom tabs + native stack)
- **State/HTTP:** TanStack Query + Axios
- **Maps:** `react-native-maps`
- **Storage:** `@react-native-async-storage/async-storage`
- **i18n/RTL:** Custom context + `I18nManager`

## Rationale

| Factor | Assessment |
|--------|------------|
| Implementation state | A complete V1 scaffold (Home, Search, Listing, Booking, Favorites, Trips, Account, Login) already exists and TypeScript-compiles. |
| Bundle verification | `npx expo export` successfully produced iOS and Android bundles on 2026-08-17. |
| Time to Closed Alpha | Fastest path — no framework rewrite needed. |
| Team readiness | The existing web stack is React/Next.js; React Native is the closest mental model for the team. |
| Flutter alternative | Would require discarding the existing `apps/mobile/` scaffold and rewriting 8+ screens, navigation, API client, and i18n. Not justified. |
| Risk | Expo managed workflow limits native module access, but the V1 feature set (maps, auth, HTTP, storage) is fully supported. |

## Consequences

- **Positive:** Mobile V1 can proceed immediately from the existing scaffold.
- **Positive:** One codebase targets iOS and Android.
- **Negative:** EAS build / store submission will eventually require an EAS project ID and build pipeline.
- **Negative:** Some advanced native features (e.g., specific payment SDKs) may require EAS config plugins later.

## Non-Consequences

- This does **not** commit to app store submission in the Closed Alpha.
- This does **not** require Flutter work to be deleted; historical design docs remain in `docs/MOBILE_NATIVE_DESIGN_P*.md` as reference only.

## Evidence

- `apps/mobile/package.json`
- `apps/mobile/App.tsx`
- `apps/mobile/src/screens/*.tsx`
- `apps/mobile/src/lib/hooks.ts`
- `apps/mobile/src/lib/LocaleContext.tsx`
- `tsc --noEmit` passed on 2026-08-17
- `npx expo export` produced iOS and Android bundles on 2026-08-17

## Status

**ADOPTED for V1.** Flutter is rejected as the V1 mobile framework.
