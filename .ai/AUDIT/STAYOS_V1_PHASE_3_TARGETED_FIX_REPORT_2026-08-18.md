# STAYOS V1 — PHASE 3 TARGETED FIX REPORT

**Date:** 2026-08-18  
**Branch:** `tooling/repository-intelligence`  
**Pre-fix HEAD:** `eb1ff2a1aee0edb1ab03090c331d05fdfef0c85f`  
**Final HEAD:** `ca82f31ac93cd8b4d02bf4e2a5e2c7c4d2e9b5a8`  
**Device:** OPPO CPH2481  
**Android version:** 15  
**ADB serial:** TKINR8IJ5D9DSKQK  
**Railway API:** `https://stayos-demo-production.up.railway.app/health` → 200 OK

---

## 1. EXECUTIVE RESULT

A targeted fix sprint was executed to resolve the P0 booking CTA, P1 image gallery, and P2 map toggle issues found in Phase 2.

- **Image fallback:** ✅ PASS — failed gallery URLs now show the branded StayOS placeholder instead of a blank white area.
- **Map fallback:** ✅ PASS — the map section displays the localized fallback `الخريطة غير مُعدة` correctly when no API key is configured.
- **Booking CTA:** ❌ REMAINS BROKEN — the `احجز الآن` button is now in the normal ScrollView content, physically separated from the similar-listings cards, and visible, but it still does not navigate to the Booking screen.
- **Map toggle:** ❌ REMAINS BROKEN — tapping `خريطة` in Search does not change the UI state.
- **CTA root cause:** likely an issue with the `Pressable` component or the `handleBook` callback not being invoked at runtime, not a layout overlap problem as first assumed.

**Final decision: B. TARGETED FIXES REMAIN — REPEAT DEVICE LOOP**

---

## 2. PRE-FIX STATE

Phase 2 left us with:

1. A non-tappable absolute `احجز الآن` CTA on Listing Detail.
2. A blank white image gallery area when remote image URLs failed.
3. A non-responsive `خريطة` / `قائمة` toggle on Search.

The CTA had already been given `zIndex: 100` with no effect.

---

## 3. ROOT CAUSE — BOOKING CTA

**Initial hypothesis:** The CTA was untappable because an absolutely positioned `bookingBar` was being obscured by a sibling `ScrollView` or overlapping `ListingCard` elements.

**Investigation:**
- The `bookingBar` `Pressable` was inside a `View` with `position: "absolute"`.
- Removing the absolute layout and placing the CTA inside `ScrollView` content did not resolve the issue.
- Isolating the CTA above the similar-listings `ListingCard`s (so no `ListingCard` `Pressable` could overlap) did not resolve the issue.
- `adb logcat` captured no React Native error, exception, or crash when the CTA was tapped.
- The `handleBook` callback calls `navigation.navigate("Booking", { ... })`.
- Other `Pressable` instances in the same app (e.g., `ListingCard`, bottom tab bar, back button) correctly respond to touch.

**Current best root cause:** The `bookButton` `Pressable` (and the `viewToggle` `Pressable`) is not receiving the `onPress` event in this specific component context. Possible remaining causes:
- `Pressable` with a single `Text` child may not be reliably tappable on this device / Expo SDK combination.
- The `handleBook` closure may not be bound at the point `onPress` is triggered.
- A subtle issue in the compiled bundle for `Pressable` inside `ScrollView` or `View` with `borderRadius`/`padding`.

---

## 4. BOOKING CTA FIX

**Attempted fixes:**

1. Added `zIndex: 100` to the absolute `bookingBar`.
2. Removed the absolute `bookingBar` and moved the CTA into `ScrollView` content.
3. Wrapped the CTA in its own `View` with a non-absolute layout.
4. Added `hitSlop={16}` to the `Pressable`.
5. Moved the `BookingSection` before the `similarProperties` `ListingCard`s to eliminate overlap.

**Files modified:**
- `apps/mobile/src/screens/ListingDetailScreen.tsx`

**Result after build:**
- CTA is visible and correctly positioned.
- Tapping the CTA does **not** navigate to the Booking screen.
- `adb logcat` shows no error, so the failure is silent.

---

## 5. ROOT CAUSE — IMAGES

**Initial hypothesis:** `Image` component rendered nothing because there was no fallback when the remote URL failed, leaving a white rectangle.

**Investigation:**
- `ListingCard` already had a placeholder fallback.
- `ListingDetailScreen` rendered `Image` components directly without per-image error state.
- `onError={() => {}}` was swallowing failures.

---

## 6. IMAGE FIX

**Fix:**
- Added a `GalleryImage` subcomponent inside `ListingDetailScreen.tsx`.
- Tracks `loading` and `failed` state for each image.
- On `onError`, displays a branded `StayOS` placeholder.
- Shows an `ActivityIndicator` while loading.
- The gallery fallback is also shown when no images are available at all.

**Files modified:**
- `apps/mobile/src/screens/ListingDetailScreen.tsx`

**Physical result:**
- Home listing cards show `StayOS` placeholder where `cover_image` fails.
- Listing Detail gallery shows `StayOS` placeholder where the seed image URL fails.
- Similar-listing `ListingCard`s display real working images when the URL is valid (e.g., Zamalek/Maadi).
- No blank white image rectangles observed.

---

## 7. ROOT CAUSE — MAP TOGGLE

**Initial hypothesis:** The `viewToggle` `Pressable` was too small or its touch area was being blocked by the search `TextInput` or other elements.

**Investigation:**
- The `viewToggle` `Pressable` has `style` and `onPress` set.
- Adding `hitSlop={16}` and `minWidth: 80` did not fix the tap.
- Tapping the green `خريطة` button did not switch to map view or display the `noMapKey` fallback.
- The map fallback already renders correctly when the `MapView` is reached.

---

## 8. MAP FIX

**Attempted fixes:**
- Added `hitSlop={16}`.
- Added `minWidth: 80`.
- Confirmed `t("noMapKey")` is localized.

**Physical result:**
- Map fallback string `الخريطة غير مُعدة` renders correctly inside Listing Detail.
- Search `viewToggle` still does not switch the view.

---

## 9. TESTS

### Source checks

| Check | Result |
|---|---|
| `npm run lint` (`tsc --noEmit`) | ✅ PASS |

### Physical OPPO checks

| # | Test | Result | Notes |
|---|---|---|---|
| 01 | App launches | ✅ PASS | Home renders. |
| 02 | Brand | ✅ PASS | `StayOS` visible, no Arabic transliteration. |
| 03 | Image placeholder | ✅ PASS | Branded placeholder on failed images. |
| 04 | Valid images render | ✅ PASS | Zamalek/Maadi similar-listing images load. |
| 05 | Map fallback | ✅ PASS | `الخريطة غير مُعدة` shown when no key. |
| 06 | Booking CTA visible | ✅ PASS | `احجز الآن` is in the content area. |
| 07 | Booking CTA tap | ❌ FAIL | No navigation to Booking. |
| 08 | Map/list toggle | ❌ FAIL | `خريطة` button does not change view. |

---

## 10. PHYSICAL OPPO RESULTS

**Builds tested:**

| # | Build ID | Status | Notes |
|---|---|---|---|
| 1 | `9d4c1255-1cea-4275-98db-e91ac4547839` | ✅ Built | CTA moved into content. |
| 2 | `8c8352e9-c01c-467d-a6b3-fa2ed68692f8` | ✅ Built | zIndex attempt. |
| 3 | `84050149-e0d1-447e-a9ee-9a7a56865bc8` | ✅ Built | Original Phase 2 follow-up. |

**Installs:** All successful.  
**OPPO package:** `com.stayos.mobile` present.  
**Observed states:**
- Home, Search, Listing Detail, tabs, Trips, Account all render.
- No crash in 20+ minutes of testing.
- ADB daemon restarted once due to a stalled `screencap`; device reconnected.

---

## 11. EAS BUILD

**Final build:**
- **Build ID:** `9d4c1255-1cea-4275-98db-e91ac4547839`
- **URL:** `https://expo.dev/accounts/islamelbaz/projects/stayos-mobile/builds/9d4c1255-1cea-4275-98db-e91ac4547839`
- **Profile:** `preview`
- **Output:** APK
- **Artifact:** `/Users/ahmed/Documents/Projects/StayOS/apps/mobile/StayOS-preview.apk`
- **TypeScript:** `npm run lint` passed.

---

## 12. FILES MODIFIED

- `apps/mobile/src/screens/ListingDetailScreen.tsx`
- `apps/mobile/src/screens/SearchScreen.tsx`

---

## 13. COMMITS

| Hash | Message |
|---|---|
| `f14fd05b24e25b9d75d3d0e1a0e0e2d5b6c9a8f7` | `fix(mobile): make booking CTA and map toggle tappable; add image fallback` |
| `ca82f31ac93cd8b4d02bf4e2a5e2c7c4d2e9b5a8` | `fix(mobile): move booking CTA before similar listings` |

---

## 14. REMAINING BLOCKERS

| # | Blocker | Severity | Category |
|---|---|---|---|
| 1 | Booking CTA `احجز الآن` does not navigate | **P0** | Engineering |
| 2 | Search `خريطة`/`قائمة` toggle does not change view | **P2** | Engineering |
| 3 | Google Maps API key not configured | **P2** | Configuration |
| 4 | Twilio not configured | **P1** | Configuration |
| 5 | Paymob/Stripe not configured | **P1** | Configuration |
| 6 | No real owner-authorized listings | **P1** | Operations |

---

## 15. BOOKING FLOW STATUS

The booking flow cannot be validated until the CTA reliably navigates to the Booking screen. The following steps are blocked at `CTA tap`:

- Date picker selection
- Guest stepper interaction
- Night calculation
- Price display
- Booking submission
- Payment
- Confirmation
- Trips reflection

---

## 16. FINAL DECISION

**B. TARGETED FIXES REMAIN — REPEAT DEVICE LOOP**

The image fallback and map fallback are now physically verified. However, the booking CTA and the map toggle did not become tappable despite multiple layout and `Pressable` adjustments. The next loop should focus specifically on:

1. Replacing the `bookButton` and `viewToggle` `Pressable` components with `TouchableOpacity` to test whether `Pressable` is the culprit.
2. Adding a temporary `Alert.alert` diagnostic inside `handleBook` to confirm the callback is actually invoked.
3. Building a minimal reproduction screen with a single `Pressable` to validate `Pressable` behavior in this Expo SDK/device combination.

Do not proceed to payment, OTP, or final release gating until the booking CTA is physically working on the OPPO.
