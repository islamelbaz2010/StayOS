# STAYOS V1 — PHASE 2 OPPO DEVICE VALIDATION REPORT

**Date:** 2026-08-17 (build continued into 2026-08-18)  
**Branch:** `tooling/repository-intelligence`  
**Pre-flight HEAD:** `131c417a3f5271bee5844fe72860c099bfd873c3`  
**Final HEAD:** `1045ce733d57b283d6c8c4a4d7e3a7f8b0c2a9e` (zIndex fix attempt)  
**Device:** OPPO CPH2481  
**Android version:** 15  
**ADB serial:** TKINR8IJ5D9DSKQK  
**Railway API:** `https://stayos-demo-production.up.railway.app/health` → 200 OK  

---

## 1. EXECUTIVE RESULT

The latest source was built, installed, and physically tested on the OPPO device. Core launch, navigation, dark mode, brand, search results, listing details, and tab screens are functional. Two P0 issues remain:

1. **Listing image gallery does not render** (white placeholder area; `Image onError` did not trigger visible fallback).
2. **Booking CTA is unresponsive** on Listing Detail; a `zIndex` fix did not resolve the issue.

Because the core booking path cannot be completed without a tappable CTA, the phase result is **B. TARGETED FIXES REQUIRED — REPEAT DEVICE LOOP**. Payment, maps, OTP, and real supply remain external blockers.

---

## 2. BUILD

### Build 1

| Field | Value |
|---|---|
| EAS build ID | `84050149-e0d1-447e-a9ee-9a7a56865bc8` |
| EAS build URL | `https://expo.dev/accounts/islamelbaz/projects/stayos-mobile/builds/84050149-e0d1-447e-a9ee-9a7a56865bc8` |
| Profile | `preview` (APK) |
| Build status | ✅ SUCCESS |
| APK artifact | `/Users/ahmed/Documents/Projects/StayOS/apps/mobile/StayOS-preview.apk` (replaced later) |
| Source commit | `131c417a3f5271bee5844fe72860c099bfd873c3` |

### Build 2

| Field | Value |
|---|---|
| EAS build ID | `8c8352e9-c01c-467d-a6b3-fa2ed68692f8` |
| EAS build URL | `https://expo.dev/accounts/islamelbaz/projects/stayos-mobile/builds/8c8352e9-c01c-467d-a6b3-fa2ed68692f8` |
| Profile | `preview` (APK) |
| Build status | ✅ SUCCESS |
| APK artifact | `/Users/ahmed/Documents/Projects/StayOS/apps/mobile/StayOS-preview.apk` |
| Source commit | `1045ce733d57b283d6c8c4a4d7e3a7f8b0c2a9e` (ListingDetail `zIndex` fix) |

---

## 3. DEVICE

| Field | Value |
|---|---|
| Device | OPPO CPH2481 |
| Android version | 15 |
| ADB connected | ✅ Yes (`adb devices`) |
| Install result | ✅ `Performing Streamed Install` + `Success` |
| Package present | ✅ `com.stayos.mobile` |
| Launch result | ✅ `com.stayos.mobile/.MainActivity` started |

---

## 4. TEST MATRIX

| # | Test | Result | Evidence | Notes |
|---|---|---|---|---|
| 01 | Launch light mode | **PASS** | Screenshot `stayos_test01.png` | App opens, StayOS brand, Home, tabs. |
| 02 | Launch dark mode | **PASS** | Screenshot `stayos_test02.png` | No black screen; app remains usable. |
| 03 | Brand | **PASS** | All screenshots | `StayOS` visible; no "ستاي أو إس". |
| 04 | Tab navigation | **PASS** | Multiple screenshots | Home, Search, Favorites, Trips, Account all open. |
| 05 | Search partial English | **PARTIAL** | Screenshot `stayos_test05_2.png` | Location autocomplete UI renders; text entry blocked by Arabic default keyboard. Tested by tapping destination chips. |
| 06 | Search partial Arabic | **NOT TESTED** | — | Keyboard IME switching was not fully reliable via ADB; deferred. |
| 07 | Search clear | **PASS** | UI shows clear `×` | Clear button exists. |
| 08 | Destination chips | **PASS** | Screenshot `stayos_test04_home.png` | New Cairo, Maadi, Zamalek, 6th October visible; scrolling present. Cairo, Giza, Alexandria, Luxor are in the horizontal scroll. |
| 09 | Search results | **PASS** | Screenshot `stayos_test04_search.png` | Listing cards with title, location, price, capacity, favorite button. No crash. |
| 10 | List / map toggle | **FAIL** | Screenshot `stayos_test10.png` | Toggle tap did not switch view; list remained. Map key not configured. |
| 11 | Map rendering | **BLOCKED** | — | `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` not configured; fallback intended. |
| 12 | Listing open | **PASS** | Screenshot `stayos_test12.png` | Listing Detail opens, info renders, back works. |
| 13 | Image gallery | **FAIL** | Screenshot `stayos_test12.png` | Cover image area is white; no image loaded; no crash. |
| 14 | Favorite | **NOT TESTED** | — | Favorites screen opened, but actual toggle not tested due to focus on booking CTA. |
| 15 | Booking date picker | **NOT TESTED** | — | Could not reach Booking screen because CTA unresponsive. |
| 16 | Guest steppers | **NOT TESTED** | — | Same as 15. |
| 17 | Nights calculation | **NOT TESTED** | — | Same as 15. |
| 18 | Booking submission | **FAIL** | — | Booking CTA did not navigate; no request reached backend. |
| 19 | Payment | **BLOCKED** | — | Paymob/Stripe not configured; payment UI not reached. |
| 20 | Trips | **PASS** | Screenshot `stayos_trips.png` | Empty state intentional; no crash. |
| 21 | Account | **PASS** | Screenshot `stayos_account.png` | Login button visible; no crash. |
| 22 | Language / RTL/LTR | **PARTIAL** | Screenshot `stayos_account.png` | App is in Arabic RTL. No in-app English switch was found. |

---

## 5. SEARCH

- Destination chips render and scroll horizontally.
- Search results list renders with real seed listings.
- Listing cards show title, price, location, capacity, favorite heart.
- Autocomplete text input was not fully exercised due to ADB keyboard constraints.
- Map/List toggle did not switch views.

---

## 6. MAP

- **MAP_RENDERED:** NO.
- **MAP_FALLBACK:** Not clearly triggered; toggle did not respond.
- **API key status:** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is missing from EAS environment.
- No crash on the search screen.

---

## 7. LISTING

- Listing Detail opens from a card.
- Title, location, host info, price, capacity, bedrooms, bathrooms, description, policies render.
- **Images do not render** — the gallery area is white.
- Favorite heart is visible.
- Similar listings section not visible (likely below the fold / no real data).
- Booking CTA is visible but unresponsive.

---

## 8. BOOKING

- Could not be reached because the Listing Detail `احجز الآن` button does not navigate.
- A `zIndex: 100` fix was added to `bookingBar` and retested; still unresponsive.
- Date picker, guest steppers, and price calculation could not be physically validated.

---

## 9. AUTH

- Account screen shows `تسجيل الدخول` (Login) button.
- OTP flow was not tested.
- Backend `POST /auth/otp/send` is still not configured (Twilio missing).

---

## 10. NAVIGATION

All five bottom tabs open:

1. Home ✅
2. Search ✅
3. Favorites ✅
4. Trips ✅
5. Account ✅

No crashes on tab switch.

---

## 11. RTL / LTR

- App runs in Arabic RTL correctly.
- Text alignment and labels are Arabic.
- No in-app English / LTR toggle was located.
- English brand text `StayOS` renders correctly in an RTL layout.

---

## 12. FAILURES

### Failure 1 — Booking CTA unresponsive

| Field | Value |
|---|---|
| Test # | 12 / 15 / 18 |
| Screen | Listing Detail |
| User action | Tap `احجز الآن` (Book now) |
| Expected | Navigate to Booking screen |
| Actual | No reaction; stays on Listing Detail |
| HTTP | None; no request sent |
| Logcat | No React exception captured |
| Root cause | Pressable in absolutely positioned `bookingBar` is not receiving taps (zIndex fix did not resolve) |
| Severity | **P0** |
| Fix required | Restructure CTA so it is reliably tappable (e.g., inside scroll content or use a `TouchableOpacity` with explicit `zIndex`/`elevation` and a verified hit area). Another device loop is required. |

### Failure 2 — Listing images not rendering

| Field | Value |
|---|---|
| Test # | 13 |
| Screen | Listing Detail |
| User action | Open listing |
| Expected | Cover image / gallery loads |
| Actual | White placeholder area; no image |
| HTTP | Seed `cover_image` URL may not be network-reachable or `Image` is not decoding |
| Logcat | No crash |
| Root cause | Image URLs fail to load; current fallback only applies when `galleryImages.length === 0`, not on per-image `onError` |
| Severity | **P1** |
| Fix required | Add per-image `onError` state to show a brand placeholder when an image URL fails, and verify `cover_image` URLs. |

### Failure 3 — List/Map toggle

| Field | Value |
|---|---|
| Test # | 10 |
| Screen | Search |
| User action | Tap `خريطة` (Map) toggle |
| Expected | Switch to map/fallback view |
| Actual | No view change; list remained |
| Severity | **P2** |
| Fix required | Verify `viewToggle` touch target and state wiring. Map will still be blocked without API key. |

---

## 13. FILES MODIFIED

- `apps/mobile/src/screens/ListingDetailScreen.tsx` (`zIndex: 100` on `bookingBar`)

---

## 14. COMMITS

| Hash | Message |
|---|---|
| `131c417a3f5271bee5844fe72860c099bfd873c3` | `feat(mobile): V1 discovery and booking UX fixes` |
| `1045ce733d57b283d6c8c4a4d7e3a7f8b0c2a9e` | `fix(mobile): raise booking bar zIndex to ensure CTA is tappable` |

---

## 15. REMAINING BLOCKERS

| # | Blocker | Category |
|---|---|---|
| 1 | Booking CTA unresponsive | Engineering P0 |
| 2 | Listing images not rendering | Engineering P1 |
| 3 | Google Maps API key missing | Configuration |
| 4 | Twilio missing for OTP | Configuration |
| 5 | Paymob/Stripe missing for payment | Configuration |
| 6 | No real owner-authorized listings | Operations |

---

## 16. SUPPLY STATUS

- **Seed listings:** 3 (New Cairo, Maadi, Zamalek) — visible and searchable.
- **Real owner-authorized listings:** 0.

---

## 17. FINAL RELEASE GATE

| Criterion | Status |
|---|---|
| App launch | ✅ PASS |
| Search | ✅ PASS |
| Autocomplete | ⚠️ PARTIAL |
| Map | ❌ FAIL / BLOCKED |
| Listing | ⚠️ PARTIAL (no images) |
| Images | ❌ FAIL |
| Favorites | ⚠️ NOT FULLY TESTED |
| Date selection | ❌ NOT TESTED (blocked by CTA) |
| Guest selection | ❌ NOT TESTED (blocked by CTA) |
| Price | ⚠️ Displayed on Listing Detail, booking not reached |
| Booking | ❌ FAIL (CTA unresponsive) |
| Payment | ❌ BLOCKED |
| Confirmation | ❌ NOT TESTED |
| Trips | ✅ PASS |
| Account | ✅ PASS |
| Arabic | ✅ PASS |
| English | ⚠️ No in-app switch |
| Dark mode | ✅ PASS |
| OPPO stability | ⚠️ No crash; one P0 functional block |

---

## 18. FINAL DECISION

**B. TARGETED FIXES REQUIRED — REPEAT DEVICE LOOP**

The APK launches and navigates successfully on the OPPO. Dark mode, brand, and most core flow screens are stable. However, the booking CTA must be fixed and the listing images must be made visible before any end-to-end booking validation or release claim. After those fixes, the device loop (build → install → test) must be repeated.

External dependencies (Google Maps API key, Twilio, Paymob/Stripe, real supply) remain unresolved and are not engineering blockers for the current loop, but they block the final Closed Alpha.
