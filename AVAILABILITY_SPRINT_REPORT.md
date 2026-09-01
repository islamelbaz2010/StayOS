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

