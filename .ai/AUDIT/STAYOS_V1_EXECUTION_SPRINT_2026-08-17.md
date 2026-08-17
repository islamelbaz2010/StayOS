# STAYOS V1 EXECUTION SPRINT REPORT

**Date:** 2026-08-17  
**Branch:** `tooling/repository-intelligence` → `main` (commit pending)  
**Commit base:** `ebaacac8bdaec6fa3e4798d13d50c04137e6fc1e`

---

## 1. EXECUTIVE RESULT

A focused P0/P1 pass was executed on the mobile app. The changes are TypeScript-clean and address the highest-impact blockers from the V1 gap matrix:

- Dark mode no longer controls the app (`userInterfaceStyle: "light"`).
- Brand is now `StayOS` everywhere, not "ستاي أو إس".
- Search/autocomplete UX was fixed (proper debounce, clear button, active filter, empty state).
- Home popular destinations were expanded to the target Cairo/Giza/Alexandria/Luxor list.
- Booking date input was replaced with `@react-native-community/datetimepicker`.
- Booking guest input was replaced with stepper controls and capacity validation.
- Listing detail images now use device width and include an `onError` sink.

**The app has not yet been rebuilt or retested on the physical OPPO.**

---

## 2. BEFORE STATE

Verified working before this sprint:
- Standalone Android APK launches on OPPO.
- Backend Railway deployment is healthy.
- Five bottom tabs navigate.
- Home, Search, Listing Detail, Booking, Favorites, Trips, Account screens exist.
- Live listing API loads real seed data.
- Location autocomplete endpoint responds.

Known blockers before this sprint:
- App invisible in Android dark mode.
- Literal Arabic transliteration "ستاي أو إس" used as brand.
- Search had broken debounce and weak autocomplete UX.
- Booking used manual `YYYY-MM-DD` text input.
- Booking guest input was raw text.
- Popular destinations were limited and did not match target areas.
- Listing detail gallery image was hard-coded to 400 px.

---

## 3. IMPLEMENTED

| # | Change | Evidence |
|---|---|---|
| 1 | `app.json` `userInterfaceStyle: "light"` | Prevents dark mode from overriding the scaffold colors. |
| 2 | `i18n.ts` Arabic `appName` = `StayOS` | Removes "ستاي أو إس" from the brand. Also fixed typo in `featuredListings` (إقامات). |
| 3 | `HomeScreen.tsx` expanded `POPULAR_CITIES` | Added New Cairo, 6th October, Maadi, Zamalek, Nasr City, Cairo, Giza, Alexandria, Luxor. |
| 4 | `SearchScreen.tsx` rewrite | Proper `useEffect` debounce, clear button, active-city pill, empty-suggestion state, map/list toggle retained. |
| 5 | `BookingScreen.tsx` date picker | Added `@react-native-community/datetimepicker` and replaced `TextInput` date fields. |
| 6 | `BookingScreen.tsx` guest steppers | Adults / children / infants steppers with `maxGuests` enforcement. |
| 7 | `BookingScreen.tsx` price breakdown | Shows `nightly × nights = subtotal` and total. |
| 8 | `App.tsx` + `ListingDetailScreen.tsx` | `Booking` route now accepts `maxGuests`; detail passes listing capacity. |
| 9 | `ListingDetailScreen.tsx` image width | Gallery images use `Dimensions.get("window").width` and `onError` sink. |
| 10 | `package.json` + `package-lock.json` | Added `@react-native-community/datetimepicker@8.2.0` (Expo 51 compatible). |

---

## 4. FILES MODIFIED

- `apps/mobile/app.json`
- `apps/mobile/package.json`
- `apps/mobile/package-lock.json`
- `apps/mobile/src/lib/i18n.ts`
- `apps/mobile/src/screens/HomeScreen.tsx`
- `apps/mobile/src/screens/SearchScreen.tsx`
- `apps/mobile/src/screens/BookingScreen.tsx`
- `apps/mobile/src/screens/ListingDetailScreen.tsx`
- `apps/mobile/App.tsx`

Newly staged for the first time (previously untracked):
- `apps/mobile/App.tsx`
- `apps/mobile/src/screens/*.tsx`
- `apps/mobile/src/lib/*.ts` / `*.tsx`
- `apps/mobile/src/components/*.tsx`
- `apps/mobile/assets/icon.png`
- `apps/mobile/app.json`, `eas.json`, `babel.config.js`, `index.ts`, `tsconfig.json`

---

## 5. BACKEND

No backend code was modified in this sprint.

Backend dependencies that remain:
- `POST /api/v1/bookings` is consumed by the mobile app.
- `POST /api/v1/auth/otp/send` still requires Twilio credentials to return real OTPs.
- Payment provider credentials (Paymob / Stripe) must be in Railway for the booking flow to complete.

---

## 6. MOBILE

Screens/components changed:
- `HomeScreen` — destination chips and brand text.
- `SearchScreen` — search input, autocomplete, map/list toggle.
- `BookingScreen` — date picker, guest steppers, capacity guard.
- `ListingDetailScreen` — image gallery width and booking route params.
- `App.tsx` — type definition for `Booking` route.

---

## 7. SEARCH

What was fixed:
- `useEffect` debounce (replaced the broken `useCallback` + `setTimeout` cleanup).
- Suggestions only appear for active, non-empty, non-selected query.
- Clear `×` button resets query and selected city.
- Active filter displays the selected canonical city.
- Empty suggestion list shows `noResults`.
- Map fallback is preserved when `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is missing.

What was not fixed:
- Date/guest filters in Search UI (P1) are still not exposed.
- Arabic spelling variants beyond backend coverage are not yet expanded.

---

## 8. MAP

What was fixed:
- Map still switches between List/Map.
- Marker tap navigates to `ListingDetail` with the correct unit ID.

What remains:
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is still missing from EAS environment.
- Without the key, the map shows the `noMapKey` fallback.
- Real map rendering cannot be verified until the key is added and a new APK is built.

---

## 9. BOOKING

Dates:
- Native `DateTimePicker` for check-in and check-out.
- `minimumDate` enforced as today.
- Check-out minimum is `check_in + 1 day`.
- Night count is recalculated automatically.

Guests:
- Stepper controls for adults, children, infants.
- `maxGuests` passed from listing detail.
- Validation prevents `totalGuests > maxGuests` and `adults < 1`.

Price:
- Displays nightly rate, number of nights, and subtotal.
- Fees/discounts/taxes are not shown because they are not in the mobile data model.

Payment:
- No payment UI was added.
- The backend `/reservations` flow exists, but mobile does not call it.
- Paymob / Stripe credentials are still required in Railway.

---

## 10. AUTH

OTP:
- Mobile `LoginScreen` code was not modified.
- Backend `POST /auth/otp/send` still returns `422` "OTP provider is not configured" when Twilio is missing.
- No real-device login test was performed.

---

## 11. UX/UI

What improved:
- App launches in controlled light mode.
- Brand reads `StayOS` in both Arabic and English.
- Search header is cleaner (input, clear, view toggle in one row).
- Booking has proper date and guest controls.
- Listing detail image no longer has a hard-coded 400 px width.

What remains:
- Visual polish pass (spacing, typography, card hierarchy, bottom nav) was not done in this sprint.
- Account / Trips header alignment not addressed.
- RTL/LTR audit not completed.

---

## 12. TESTS

- `apps/mobile npm run lint` (`tsc --noEmit`) — **PASS**.
- No unit tests exist for the mobile app.
- No real-device test was performed in this sprint.

---

## 13. OPPO TEST

A new APK was **not** built in this sprint, so the OPPO was **not** re-tested.

The next device test must cover:
- Light / dark mode launch.
- Home / Search.
- Partial location input (`Ma`, `Maad`, `المعا`).
- Suggestion selection.
- Results / map toggle.
- Listing detail.
- Date and guest selection.
- Price calculation.
- Favorite toggle.
- 60-second stability.

---

## 14. SUPPLY

No supply was acquired or modified in this sprint.

- Seed listings: 3 (New Cairo, Maadi, Zamalek).
- Real owner-authorized listings: 0.
- The CSV import / admin review pipeline remains available and unmodified.

---

## 15. BLOCKERS

| # | Blocker | Category | Status |
|---|---|---|---|
| 1 | New APK must be built and installed to validate mobile changes. | Engineering / Build | Required before any release claim. |
| 2 | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` not configured. | Configuration | Required for real map. |
| 3 | Twilio not configured in Railway. | Configuration | Required for OTP login. |
| 4 | Paymob / Stripe not configured in Railway. | Configuration | Required for real payment. |
| 5 | Mobile payment UI not integrated. | Engineering | Required for end-to-end booking. |
| 6 | No real owner-authorized listings. | Operations / Founder | Required for Closed Alpha. |

---

## 16. REMAINING WORK

P0 (before device test):
1. Build new Android APK (EAS preview).
2. Install on OPPO and run the full smoke test.
3. Fix any device-specific regressions.

P0 (after device test passes):
4. Configure Twilio in Railway and verify OTP on device.
5. Configure Paymob/Stripe and build payment UI in `BookingScreen`.
6. Complete at least one end-to-end booking on device.

P1:
7. Add date/guest filters to Search UI.
8. Visual polish pass (headers, cards, spacing, bottom nav, RTL).
9. Expand location aliases for target destinations.

Supply:
10. Founder acquires 3–5 owner-authorized listings via CSV import pipeline.

---

## 17. RELEASE GATE

| Criterion | Status |
|---|---|
| 3 real owner-authorized listings | FAIL |
| Search works with real listings | NOT TESTED |
| Listing detail works | NOT TESTED |
| Date selection works | NOT TESTED |
| Booking works | NOT TESTED |
| Payment resolved | BLOCKED (missing credentials + UI) |
| Confirmation works | NOT TESTED |
| Trips reflects booking | NOT TESTED |
| OPPO smoke test passes | NOT TESTED |

---

## 18. FINAL DECISION

**B. READY FOR FINAL DEVICE VALIDATION**

The P0 mobile code changes are complete and TypeScript-clean. The next mandatory step is to build a new APK, install it on the OPPO, and run the full smoke test. Payment, OTP, maps, and supply remain blocked by external configuration or founder operations, but the product scaffolding for discovery → listing → date → guest selection is now in place.
