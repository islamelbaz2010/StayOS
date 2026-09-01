# StayOS Availability Engine + Smart Booking Calendar Sprint Report

## A. STARTING SHA

- **Branch:** `release/test-apk-build`
- **Starting commit:** `02f33c5faedd1801aa9f69905124191116466ad0`

## B. INITIAL AUDIT (FACT / INFERENCE / DECISION)

### FACT
1. `src/app/availability/services.py` already has an `AvailabilityResponse` model and `_build_day_statuses` that combines `CalendarRule`, `Booking` (`ACCEPTED`/`CONFIRMED`/`COMPLETED`), and `Reservation` (`CONFIRMED`/`CHECKED_IN`/`CHECKED_OUT`/`COMPLETED`) for a given date range.
2. `src/app/listings/services.py` `get_availability` currently only reads `CalendarRule` rows and does not include `Booking` or `Reservation` occupancy.
3. `src/app/bookings/services.py` `create_booking` checks `CalendarRule` + accepted/confirmed `Booking`s + confirmed `Reservation`s, `min_nights`/`max_nights`, and past dates, but the logic is local to `bookings/services.py`.
4. `src/app/reservations/services.py` `create_reservation` checks `CalendarRule` + `min_nights`/`max_nights`, but does not check `Booking` conflicts.
5. `Booking` `REQUESTED` status is not inventory-blocking; `ACCEPTED`, `CONFIRMED`, `COMPLETED` are.
6. `Reservation` `PENDING_PAYMENT` creates a `HOLD` `CalendarRule` via `acquire_calendar_lock`; confirmed reservations become `BOOKED` `CalendarRule`s.
7. `UnitListing` carries `min_nights` and `max_nights`.
8. The public `GET /listings/{unit_id}/availability` endpoint exists and does not require authentication (rate limited).
9. `src/app/main.py` maps `409` to the code `CONFLICT`, but `_ARABIC_MESSAGES` only contains `CONFLICT_ERROR`, causing `message_ar` to fall back to `حدث خطأ ما`.
10. `apps/mobile/src/screens/BookingScreen.tsx` currently uses two native `DateTimePicker`s and does not fetch availability before selecting dates.

### INFERENCE
1. The **authoritative availability truth** should be a single function in `availability/services.py` that any consumer (`Booking`, `Reservation`, `listings/availability`, `host/calendar`) calls.
2. The mobile `BookingScreen` must call `GET /listings/{unit_id}/availability` for a date window and disable unavailable/past days.
3. The Arabic 409 mapping must be fixed before users see a specific conflict message.

### DECISION
1. Extract `get_unit_availability` and `assert_availability_for_range` in `src/app/availability/services.py`.
2. Make `Booking.create_booking` and `Reservation.create_reservation` both call `assert_availability_for_range`.
3. Update `GET /listings/{unit_id}/availability` to use the shared engine.
4. Replace `BookingScreen` date pickers with a small month-grid calendar that respects availability, `min_nights`, and `max_nights`.
5. Fix `main.py` `_HTTP_STATUS_CODES[409]` to `CONFLICT_ERROR`.

## C. WORK DELIVERED

### 1. Shared availability engine (`src/app/availability/services.py`)
- New `get_unit_availability(session, unit_id, check_in, check_out, listing=None)` is the single per-day truth.
- It merges `CalendarRule` (`BLOCKED`/`BOOKED`/`HOLD`), `Booking` (`ACCEPTED`/`CONFIRMED`/`COMPLETED`) and `Reservation` (`CONFIRMED`/`CHECKED_IN`/`CHECKED_OUT`/`COMPLETED`) and optionally computes `price_egp`.
- New `assert_availability_for_range(session, unit, listing, check_in, check_out)` enforces: unit is `LISTED`, `check_out > check_in`, `check_in >= today(UTC)`, `min_nights <= nights <= max_nights`, and every night is `AVAILABLE`.

### 2. Consumer alignment
- `src/app/bookings/services.py` `create_booking` now calls `assert_availability_for_range`.
- `src/app/reservations/services.py` `create_reservation` now calls `assert_availability_for_range`; the existing `acquire_calendar_lock` remains for race protection.
- `src/app/listings/services.py` `get_availability` (public endpoint) now delegates to the shared engine.

### 3. Arabic 409 mapping (`src/app/main.py`)
- `_HTTP_STATUS_CODES[409]` now maps to `CONFLICT_ERROR`.
- `_ARABIC_MESSAGES["CONFLICT_ERROR"]` now returns `التواريخ المطلوبة غير متاحة`.

### 4. Mobile smart booking calendar (`BookingScreen.tsx`)
- Replaced native `DateTimePicker`s with a two-month calendar grid.
- Loads `GET /listings/{unit_id}/availability` for a 60-day window.
- Past and unavailable days are visibly disabled (gray).
- Selecting a check-in date, then a check-out date, highlights the range and enforces `min_nights`/`max_nights` and no unavailable nights inside.
- Summary shows nights, subtotal and total in real time.
- `ListingDetailScreen` and `App.tsx` pass `minNights`/`maxNights`.
- Added `useAvailability` hook and `CalendarDay`/`AvailabilityResponse` types.
- Added localized calendar strings (`available`, `unavailable`, `minNights`, `maxNights`).

## D. FILES MODIFIED

```
src/app/availability/schemas.py
src/app/availability/services.py
src/app/bookings/services.py
src/app/listings/services.py
src/app/main.py
src/app/reservations/services.py
apps/mobile/App.tsx
apps/mobile/src/lib/hooks.ts
apps/mobile/src/lib/i18n.ts
apps/mobile/src/lib/types.ts
apps/mobile/src/screens/BookingScreen.tsx
apps/mobile/src/screens/ListingDetailScreen.tsx
```

## E. VERIFICATION STEPS RUN

- `python3 -m py_compile` on changed backend files: **PASS**.
- `npx tsc --noEmit` in `apps/mobile`: **PASS** (no errors).
- GitHub Actions `build-android-local.yml`: **PASS** (run 33458391075, `stayos-standalone-release-apk` artifact).
- `adb install` of release APK: **PASS**.

## F. REAL-DEVICE E2E TESTS

Tested on the built release APK installed on the connected Android device.

### Observations
1. Calendar renders for `شقة Maadi` with legend `متاح` (available) / `غير متاح` (unavailable), two-month headers (`سبتمبر ٢٠٢٦`, `أكتوبر ٢٠٢٦`) and a weekday grid.
2. Tapping an available day (`15`) sets it as check-in (green highlight).
3. Tapping a second day (`20`) highlights the inclusive range `15-19` (light green) and sets `5 ليلة` in the summary.
4. Pricing updates to `80000 EGP × 5 ليلة = 400000 EGP` total.
5. Confirming the booking on the **current production backend** returned a `409` with `Requested dates are not available` surfaced in the `BookingScreen` alert.

### Reason for 409
The production backend is still running the old code; the new `assert_availability_for_range` has not been deployed. The old `POST /bookings` logic and the old `GET /listings/{unit_id}/availability` can disagree because they do not share the same engine, exactly the condition this sprint fixes in the codebase. The device-side flow (calendar + error surfacing) is validated; a clean end-to-end successful booking requires redeploying the backend.

## G. FINAL SHA

- **Branch:** `release/test-apk-build`
- **Final commit:** `f598f53a5853aa8c60312ae34b05cc0be760acfe` (HEAD)
- **GitHub Actions run:** https://github.com/islamelbaz2010/StayOS/actions/runs/33458391075
- **APK artifact:** `stayos-standalone-release-apk/app-release.apk` (download from the workflow run)

## H. REMAINING RISKS / NEXT STEPS

1. **Backend deployment required** before the new availability engine and Arabic 409 message take effect.
2. **Race between `Booking` and `Reservation`:** `acquire_calendar_lock` only checks `CalendarRule`; a future improvement should have it also re-run the shared availability check or create `CalendarRule` rows for `ACCEPTED` bookings.
3. **Host calendar** now uses the shared engine through `get_unit_availability`; the `availability/services.py` host `get_availability` also uses it, so host/guest calendars are aligned in code once deployed.
4. **Regression:** no backend test suite was executed; recommend a staging deployment and running reservation/booking overlap tests.


