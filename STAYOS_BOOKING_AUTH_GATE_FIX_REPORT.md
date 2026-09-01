# STAYOS — BOOKING AUTH GATE FIX + FINAL E2E

## A. Starting SHA

- **Branch:** `release/test-apk-build`
- **Starting commit:** `ea8617456208c57922929c610dd476f50f242275`

## B. Final SHA

- **Branch:** `release/test-apk-build`
- **Final commit:** `e4eba90`
- **Commit message:** `Gate BookingScreen on auth and preserve booking state across Login`

## C. Root Cause

The `BookingScreen` `handleConfirm` callback was calling `createBooking` regardless of authentication state. When an unauthenticated guest tapped `تأكيد الحجز`, the app sent a `POST /bookings` request with an invalid/missing bearer token. The backend returned `401 Unauthorized`, and the `BookingScreen` error handler displayed a generic `فشل الحجز` / `حدث خطأ ما` dialog instead of prompting the guest to log in.

## D. Exact Fix

1. `apps/mobile/src/screens/BookingScreen.tsx`
   - Imported `useAuth` and `useEffect`.
   - Read optional `checkIn`, `checkOut`, `adults`, `children`, `infants` from `route.params` to restore a pending booking state when returning from `Login`.
   - Initialized local state from these params and used `useEffect` to reapply them if the route updates.
   - Added an explicit auth gate in `handleConfirm`: if `!isAuthenticated`, navigate to `Login` with `nextScreen: "Booking"` and `nextParams` containing the full booking context (unit, selected dates, guest counts).
   - Only when the user is authenticated does the screen call `createBooking`.

2. `apps/mobile/App.tsx`
   - Extended `RootStackParamList.Booking` to include optional state fields: `checkIn?`, `checkOut?`, `adults?`, `children?`, `infants?`.
   - The existing `Login` route already supported `nextScreen` and `nextParams`, so no changes were needed there.

## E. Files Changed

```
apps/mobile/src/screens/BookingScreen.tsx
apps/mobile/App.tsx
```

## F. Production Availability Verification

Retested before the fix:

```bash
curl "https://stayos-demo-production.up.railway.app/api/v1/listings/seed-unit-0003-0000-000000000003/availability?check_in=2026-09-01&check_out=2026-09-30"
```

Confirmed `BOOKED` nights:

```
2026-09-01, 02, 05, 06, 10, 11, 17, 18, 19, 20, 21
```

## G. Calendar Verification

On the rebuilt release APK, the New Cairo booking calendar correctly:

- Disables past dates.
- Disables the `BOOKED` nights listed above.
- Allows available nights such as `13`, `14`, `15`, `16` to be selected.
- Highlights the selected range (`13 → 15`) with `14` in the middle.
- Computes pricing: `2 ليلة × 80000 EGP = 160000 EGP`.

## H. Auth Gate

Tested on the physical device after the fix:

1. Fresh install the new release APK.
2. Open `New Cairo` listing.
3. Tap `احجز الآن`.
4. App navigated to the `Login` screen instead of attempting `POST /bookings`.

This confirms the unauthenticated booking path is now gated through authentication.

## I. OTP

**BLOCKED — OTP/SMS NOT ACCESSIBLE**

The Login screen displays the phone input field and `أرسل الرمز` button. The test phone `+201118000472` was not used because the SMS verification code cannot be retrieved in this environment. Therefore the full `POST /bookings` E2E could not be completed.

## J. Booking Response

**NOT EXECUTED** — authentication step did not complete.

## K. Booking ID

**NOT CREATED** — no authenticated booking request reached the backend.

## L. Booking Status

**NOT VERIFIED**.

## M. Trips

**NOT EXECUTED** — no booking created.

## N. Duplicate Booking

**NOT EXECUTED** — no first booking created.

## O. REQUESTED Inventory Blocking

The backend engine now treats `REQUESTED` bookings as inventory-blocking (commit `6e1d022` and production deployment `833c486f`). This was previously verified through `GET /availability` in the final post-deployment report. A live duplicate `POST /bookings` test requires OTP.

## P. Restart

**NOT EXECUTED** — the authenticated path was not reached.

## Q. Logout

**NOT EXECUTED** — no authenticated session established.

## R. Full Regression Matrix

| # | Step | Status |
|---|---|---|
| 01 | Home loads | PASS |
| 02 | Search | NOT EXECUTED |
| 03 | Area selection | NOT EXECUTED |
| 04 | Calendar availability | PASS |
| 05 | Available date selection | PASS |
| 06 | Unavailable dates disabled | PASS |
| 07 | Date range 13-15 | PASS |
| 08 | Pricing | PASS |
| 09 | Guest booking auth gate | PASS |
| 10 | OTP | BLOCKED |
| 11 | Return to Booking after login | NOT EXECUTED |
| 12 | Booking creation | NOT EXECUTED |
| 13 | Booking ID | NOT EXECUTED |
| 14 | Booking status | NOT EXECUTED |
| 15 | Trips | NOT EXECUTED |
| 16 | Duplicate booking | NOT EXECUTED |
| 17 | REQUESTED inventory blocking | VERIFIED BY BACKEND (not live POST) |
| 18 | Account | NOT EXECUTED |
| 19 | Logout | NOT EXECUTED |
| 20 | Restart | NOT EXECUTED |
| 21 | Standalone runtime | PASS |

## S. Remaining Blockers

1. **OTP/SMS access** — the only remaining blocker for a full `Booking → Trips → Duplicate` E2E.
2. **Google Maps API key** — unrelated to this task; map/average price still blocked.

## T. Final Decision

**B. PARTIALLY VERIFIED**

The `BookingScreen` auth-gate defect is fixed. The app now correctly:

- Prevents unauthorized `POST /bookings` calls.
- Navigates unauthenticated users to `Login`.
- Preserves the booking unit and the selected dates/guests for post-login restoration.

The fix was built into a new standalone release APK and installed on the physical device. The auth gate was demonstrated end-to-end. The final `POST /bookings` success, `Trips`, and duplicate-conflict verification are blocked only by the inability to receive the SMS OTP.
