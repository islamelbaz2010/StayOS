# 08_MOBILE_MAP

## Purpose

This document maps the mobile portion of the StayOS repository, including any code, design documentation, and platform integration artifacts.

## Mobile Codebase Status

- **No mobile application code is present in the repository.**
- No `pubspec.yaml`, `android/`, `ios/`, `lib/`, `mobile/`, or `flutter/` directory exists.
- No Kotlin, Swift, Dart, or React Native source files were found.

## Mobile Design Artifacts

The repository contains mobile product and UX design documents under `docs/`:

| Document | Location |
|----------|----------|
| `MOBILE_NATIVE_DESIGN_P1.md` | `docs/MOBILE_NATIVE_DESIGN_P1.md` |
| `MOBILE_NATIVE_DESIGN_P2.md` | `docs/MOBILE_NATIVE_DESIGN_P2.md` |
| `MOBILE_NATIVE_DESIGN_P3.md` | `docs/MOBILE_NATIVE_DESIGN_P3.md` |
| `MOBILE_NATIVE_DESIGN_P4.md` | `docs/MOBILE_NATIVE_DESIGN_P4.md` |
| `MOBILE_NATIVE_DESIGN_P5.md` | `docs/MOBILE_NATIVE_DESIGN_P5.md` |
| `VISUAL_DESIGN_SYSTEM_P1..P4.md` | `docs/VISUAL_DESIGN_SYSTEM_*.md` |
| `PRODUCT_EXPERIENCE_DESIGN.md` | `docs/PRODUCT_EXPERIENCE_DESIGN.md` |

These documents describe planned mobile behavior but are not accompanied by a mobile implementation.

## Web Presence

- The only client-side application is the Next.js web application in `apps/web/`.
- It targets desktop and mobile browsers.
- It does not implement a native or Flutter mobile shell.

## Expected Mobile Concerns (from Design Documents)

The design documents cover the following mobile topics, but there is no code backing them:

- Native app navigation patterns
- Authentication and onboarding flows
- Arabic-first and RTL layout
- Push notifications
- Deep links
- Offline behavior
- Platform permissions
- Host and guest mobile experiences

## External Mobile Dependencies (Planned / Backend-Ready)

The backend includes providers that would typically feed a mobile client, but they are currently consumed by the web or backend only:

| Capability | Backend Location |
|------------|------------------|
| Firebase Auth | `app.auth.services` / `app.auth.dependencies` |
| Push / SMS / WhatsApp | `app.notifications.providers` |
| File uploads (photos, KYC) | `app.kyc.services` / `app.listings.services` (presigned S3 URLs) |
| Payment deep links / webhooks | `app.finance.providers` / `app.finance.router` |

## Mobile Infrastructure (Planned)

- No mobile CI/CD pipeline is defined in `.github/workflows/`.
- No mobile build scripts, Fastlane, or app store configuration exists.
- No mobile analytics, crash reporting, or beta distribution configuration is present.

## Summary

- Mobile is represented by design documents and backend capabilities, but there is no executable mobile application.
- The current client surface is the Next.js web application.
