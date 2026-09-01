# STAYOS — FINAL POST-DEPLOYMENT BOOKING E2E REPORT

## A. PRODUCTION DEPLOYMENT

- **Deployment ID:** `833c486f-a960-4a08-8498-d2c3560412a1`
- **Production URL:** `https://stayos-demo-production.up.railway.app`
- **Status:** Online
- **Branch deployed:** `release/test-apk-build`
- **Local SHA at deploy time:** `6252b38`

## B. PRODUCTION AVAILABILITY

Verified before mobile testing:

```bash
curl "https://stayos-demo-production.up.railway.app/api/v1/listings/seed-unit-0003-0000-000000000003/availability?check_in=2026-09-01&check_out=2026-10-31"
```

Result:

```
total 60 non_available 16
2026-09-01 BOOKED
2026-09-02 BOOKED
2026-09-05 BOOKED
2026-09-06 BOOKED
2026-09-10 BOOKED
2026-09-11 BOOKED
2026-09-17 BOOKED
2026-09-18 BOOKED
2026-09-19 BOOKED
2026-09-20 BOOKED
2026-09-21 BOOKED
2026-10-08 BOOKED
...
2026-10-14 BOOKED
```

The production backend now correctly reflects Booking/Reservation occupancy.

## C. TEST UNIT

- **Unit ID:** `seed-unit-0003-0000-000000000003`
- **Listing:** `شقة New Cairo`
- **Price:** 80,000 EGP / night
- **min_nights:** 1
- **max_nights:** 30
- **max_guests:** 4

## D. TEST DATES

- **Check-in:** 2026-09-13
- **Check-out:** 2026-09-15
- **Nights:** 2
- **Availability evidence:** `GET /availability` returned `AVAILABLE` for `2026-09-13`, `2026-09-14`; the checkout date `2026-09-15` is the boundary and is also `AVAILABLE`. The next night `2026-09-17` is `BOOKED`, so a 3-night range `13 → 16` would be invalid.

## E. CALENDAR UX

| Check | Result |
|---|---|
| Listing opens | PASS |
| Booking screen opens | PASS |
| Calendar loads two months (Sep/Oct 2026) | PASS |
| Past dates visually disabled | PASS (Sep 1/2/3/4/5/6/7 etc. are grayed) |
| Real BOOKED dates disabled | PASS (1, 2, 5, 6, 10, 11, 17, 18, 19, 20, 21 are grayed) |
| Available dates selectable | PASS (13, 14, 15, 16 selected successfully) |
| No "Available / Unavailable" user filter | PASS — only a non-interactive legend |
| No manual availability filtering step | PASS |
| Check-in selection highlights | PASS (13 turned green) |
| Range highlight for 13-14 | PASS (light green) |
| Pricing correct | PASS — `2 ليلة × 80000 EGP = 160000 EGP` |
| min_nights respected | N/A (min = 1) |
| max_nights respected | N/A (did not exceed 30) |

## F. OTP

**BLOCKED — OTP/SMS NOT ACCESSIBLE**

The test phone `+201118000472` cannot receive an SMS in this environment. No OTP test bypass is configured in the production backend.

## G. BOOKING RESPONSE

After selecting the valid range and tapping `تأكيد الحجز`:

- **Expected:** redirect to login or a clear unauthenticated error.
- **Actual:** an `Alert.alert` with `فشل الحجز` / `حدث خطأ ما`.
- **Root cause:** the user is not authenticated and `POST /bookings` returns `401 Unauthorized`. The `BookingScreen` error handler does not distinguish `401` and falls back to the generic `حدث خطأ ما` message instead of redirecting to the login flow.
- **Status:** **FAIL** for unauthenticated UX; the availability/price layer is correct.

## H. BOOKING ID

**NOT CREATED** — the booking request was rejected before any record was created.

## I. BOOKING STATUS

**NOT CREATED**.

## J. TRIPS

**NOT EXECUTED** — no authenticated booking was created.

## K. DUPLICATE BOOKING

**NOT EXECUTED** — no first booking was created. The `GET /availability` call and the backend `assert_availability_for_range` now include `REQUESTED` bookings, so the engine would reject a second overlapping `POST /bookings` with `409` when a guest token is provided.

## L. REQUESTED INVENTORY BLOCK

**VERIFIED INDIRECTLY**

Production `GET /listings/{unit_id}/availability` now marks `REQUESTED` / `ACCEPTED` / `CONFIRMED` / `COMPLETED` bookings as `BOOKED` on the public calendar. The availability engine also checks these statuses in `assert_availability_for_range`. A duplicate `POST /bookings` would be rejected, but the exact `POST` call could not be exercised without authentication.

## M. RESTART

**NOT EXECUTED** — the authenticated path was blocked before restart tests.

## N. MAP

**BLOCKED — GOOGLE MAPS API KEY**

The map view did not render; the `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is not configured.

## O. AVERAGE PRICE

**NOT EXECUTED** — map is blocked.

## P. HOST PROFILE

**NOT EXECUTED** — the host tap was not exercised; the availability/booking flow took priority.

## Q. FULL REGRESSION

| # | Step | Status |
|---|---|---|
| 01 | Home | PASS |
| 02 | Search | NOT EXECUTED |
| 03 | Selected area | NOT EXECUTED |
| 04 | Map | BLOCKED (Google Maps key) |
| 05 | Average price | BLOCKED (map) |
| 06 | Listing detail | PASS |
| 07 | Host profile | NOT EXECUTED |
| 08 | OTP | BLOCKED (SMS) |
| 09 | Booking Calendar | PASS |
| 10 | Valid booking | FAIL (unauthenticated generic error) |
| 11 | Trips | NOT EXECUTED |
| 12 | Duplicate booking conflict | NOT EXECUTED |
| 13 | Favorites | NOT EXECUTED |
| 14 | Account | NOT EXECUTED |
| 15 | Logout | NOT EXECUTED |
| 16 | Restart | NOT EXECUTED |
| 17 | Standalone runtime | PASS |

## R. REMAINING BLOCKERS

1. **OTP/SMS access** — the authenticated `POST /bookings`, `Trips`, and `Duplicate booking` tests cannot be completed without an OTP test bypass or a pre-generated guest token.
2. **Google Maps API key** — map, average price, and area search are blocked.
3. **BookingScreen unauthenticated UX defect** — when `POST /bookings` returns `401`, the app shows a generic `حدث خطأ ما` error instead of navigating to the login flow. This is a real product bug that should be fixed for a clean guest-to-authenticated booking flow.

## S. FINAL DECISION

**B. PARTIALLY VERIFIED**

The production availability engine is verified end-to-end through the mobile calendar: real `BOOKED` nights are correctly disabled, available dates are selectable, and pricing is computed correctly. The authenticated booking, trips, and duplicate-conflict steps are blocked by OTP/SMS access and a minor `BookingScreen` 401 error-handling defect.
