# MAKAZOH Web Redesign — QA Report

**Branch:** `redesign/web-a2z` · **Source SHA:** `57f6da0` (origin/main) · **Final SHA:** see git log HEAD on branch
**Scope verification:** `git diff --name-only` on this branch touches `apps/web/**` + docs only — **0 native mobile files**.

## Environment

- Web dev server `localhost:3100` against the **live staging API** (`https://stayos-demo-production.up.railway.app/api/v1`) via a local CORS proxy on `:8000` (localhost origin is not in the API's CORS allowlist — proxy adds headers, forwards unchanged).
- Real Chromium (Playwright) at 1440×900 desktop and 390×844 mobile widths; authenticated sessions via dev-login for guest/host/staff/admin roles.
- Evidence: `.qa-screenshots/` (48 screenshots this pass; untracked).

## Automated results

| Gate | Result |
|---|---|
| `tsc --noEmit` | ✅ clean (0 errors) |
| `next build` | ✅ all 68 routes; warnings are pre-existing (`<img>` hints, one hook-deps hint, app-dir font-link false positive) |
| `vitest` | ✅ **25 files / 238 tests passed** |
| Mobile tsc/tests | not run — zero mobile diffs on this branch by design |

## Browser visual QA coverage (48 screenshots)

- **Public**: home EN/AR, search EN/AR (split+map, price markers), listing detail EN/AR, login, register, forgot, how-it-works, help, FAQ, become-a-host, about, 404.
- **Guest (auth)**: trips, favorites, payments, profile, settings, messages, notifications.
- **Host (auth)**: dashboard, bookings EN/AR, earnings EN/AR, listings, calendar, profile, guide.
- **Admin (auth)**: overview, users, bookings, payments, pending, earnings, reports, listings, support, KYC, disputes.
- **Staff (auth)**: dashboard EN/AR, support.
- **Responsive**: home/search at 390px EN + AR.

## Reference→implementation conformance spot-checks

- DM Sans now actually renders (font was previously declared but never loaded); Cairo for AR. ✅
- Canvas pure `#FFFFFF`; footer band `#F7F7F7`; legal hairline `#EBEBEB`; search-pill hairline `#DDDDDD`. ✅
- Listing photos `rounded-2xl` (20px) — dominant photo radius per spec. ✅
- Floating capsule lifts `0 16px/32px rgba(0,0,0,.12)` on focus; dropdowns `shadow-menu`. ✅
- Focus-visible double-ring white+ink on all `.btn*`, `.input`, `.chip`. ✅
- Lime `#84CC16` is the sole accent; no coral introduced. ✅
- Zero `shadow-*` on content surfaces (audited — remaining shadows are map/floating chrome only). ✅

## Functional regression notes

- Booking lifecycle, pricing, commission, refunds, funds-held math, payment state machine, auth/RBAC, i18n routing: **untouched** — verified by passing contract/component tests and unchanged API calls.
- AuthLayout branding bug fixed: showed "StayOS" → now MAKAZOH wordmark.

## Known limitations (not regressions)

1. External payment-provider charge flows not exercised end-to-end (sandbox keys not present locally); payment UX verified against real pending/collected records from staging.
2. CORS proxy was a QA fixture only — not shipped; production web origin is already allowed by the API.
3. jsdom "navigation not implemented" warnings and `<img>` lint hints pre-date this work.
4. Dynamic routes requiring seeded IDs (e.g. specific `/bookings/[id]`, `/messages/[id]`) covered via component tests + list views rather than live deep-links.

## Physical / device note

This phase is **web-only**. No APK, no RN changes, no device runs — per the phase gate, mobile redesign begins only after founder approval of this web preview.
