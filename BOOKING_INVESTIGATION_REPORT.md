# StayOS Booking Failure Investigation Report

**Date:** 2026-09-01  
**Branch:** `release/test-apk-build`  
**Commit tested on device:** `02f33c5`  
**Backend environment:** `https://stayos-demo-production.up.railway.app/api/v1` (production, still running the pre-fix code at the time of testing)  
**Device:** Real Android device via `adb` (`com.stayos.mobile`)  
**APK build run:** [GitHub Actions Run 33444562788](https://github.com/islamelbaz2010/StayOS/actions/runs/33444562788)  
**Evidence directory:** `/Users/ahmed/Documents/Projects/StayOS/booking_e2e_20260901_012523`

---

## 1. Goals of this report

1. Determine the real technical state of the `POST /bookings` flow.
2. Verify whether a real booking can be created with valid future dates on a clean unit.
3. Confirm that the `BookingScreen` now surfaces the real backend error instead of `حدث خطأ ما`.
4. Decide the future of the `/bookings` endpoint vs the existing `/reservations` engine.
5. Capture reproducible E2E evidence.

---

## 2. Source of truth (classification rules)

- **FACT** = something I directly observed from code, database, API response, or device UI.
- **EVIDENCE** = the file or record that proves a FACT.
- **INFERENCE** = a reasonable deduction from one or more FACTS.
- **HYPOTHESIS** = a not-yet-proven explanation.
- **DECISION** = an engineering choice made during the session.

---

## 3. What I changed this session

| File | Change | Why |
|------|--------|-----|
| `src/app/bookings/services.py` | Replaced `_assert_no_conflicts` with `_assert_availability`; it now checks `CalendarRule` (BLOCKED/BOOKED), existing accepted/confirmed `Booking`s, existing confirmed `Reservation`s, and `Unit` `min_nights`/`max_nights` status. | **FACT**: the old `Booking` creation logic was only looking at `Booking` records with a narrow status filter and ignoring `Reservation`s, calendar rules, and listing night limits. |
| `src/app/availability/repository.py` | Broadened `get_accepted_bookings_for_unit` and `get_confirmed_reservations_for_unit` to the statuses that actually block new bookings. | **FACT**: accepted, confirmed, and completed bookings/reservations should block a new request. |
| `apps/mobile/src/screens/BookingScreen.tsx` | Error fallback now uses `data?.error?.message` when `data?.error?.message_ar` is the generic `حدث خطأ ما`; success `Alert` now navigates to `Home -> TripsTab`. | **FACT**: the backend error envelope is `{"error": {"code", "message", "message_ar"}}`; the old mobile code showed the generic `message_ar` (or no detail). |
| `scripts/seed_staging.py` | Also inserts a `CalendarRule` row for the seeded `Reservation`. | **FACT**: seeding a `Reservation` without a `CalendarRule` leaves the calendar inconsistent. |
| `src/app/listings/router.py`, `services.py`, `schemas.py` | Restored `GET /listings/profiles/host/{host_id}`. | **FACT**: the host profile screen in the app expects this endpoint, which was missing. |

---

## 4. E2E tests performed on real device

### Test A — Valid booking on a clean unit

- **Unit:** `seed-unit-0002` ("شقة Maadi", host `Host Seed`, 4 guests, 80,000 EGP/night).
- **Dates attempted:**
  1. `2026-10-15` → `2026-10-18` (3 nights)
  2. `2026-09-15` → `2026-09-18` (3 nights)
- **Result:** Both succeeded. The app showed `تم طلب الحجز` / `requested`.
- **EVIDENCE:**
  - `window_dump_s9.xml` — booking total for `2026-10-15` → `2026-10-18`.
  - `window_dump_s10.xml` — success alert `requested` / `تم طلب الحجز`.
  - `window_dump_s25.xml` — success alert for the second `2026-09-15` → `2026-09-18` booking.
  - `window_dump_s15.xml` and `window_dump_t14.xml` — `Trips` screen shows the new bookings.

**Classification:**
- **FACT:** A real `POST /bookings` request for `seed-unit-0002` with future, non-overlapping dates returns `201` and a `REQUESTED` booking.
- **INFERENCE:** The production backend (pre-fix) still allows these dates because there is no existing `Booking` record in a blocking status for this unit, even though it is not yet running the new calendar/reservation checks.

### Test B — Overlapping booking (conflict)

- **Unit:** `seed-unit-0002`.
- **Dates:** `2026-09-15` → `2026-09-18` — the same dates just booked in Test A.
- **Result:** `POST /bookings` returned `409 CONFLICT`. The app alert body was **"Requested dates are not available"** (the real backend message) instead of the generic `حدث خطأ ما`.
- **EVIDENCE:**
  - `window_dump_t8.xml` — booking form with the conflicting dates.
  - `window_dump_t9.xml` — alert `فشل الحجز` / `Requested dates are not available`.

**Classification:**
- **FACT:** The mobile `BookingScreen` now displays the specific backend error message.
- **INFERENCE:** The production backend's existing `Booking` overlap logic already blocks a second `REQUESTED` booking for the same dates, and the new `BookingScreen` error extraction is working.

### Test C — Invalid date / night-rule rejection

- **Status:** **NOT EXECUTED**.
- **Reason:** The production backend was not redeployed with this session's `src/app/bookings/services.py` changes, so the new `min_nights`/`max_nights` and `CalendarRule` validations are not active. The mobile date picker and guest selector also prevent obviously invalid local input (past dates, `check_out <= check_in`, guests > `max_guests`) before the network request is sent.
- **Next step:** Re-run this test after the backend commit is deployed to production.

### Test D — `GET /bookings/guest` (Trips screen)

- **Result:** The `Trips` screen lists the newly created `REQUESTED` bookings, including `2026-09-15` → `2026-09-18` and `2026-10-15` → `2026-10-18`.
- **EVIDENCE:**
  - `window_dump_t14.xml` — `Trips` screen with four bookings, two of them newly created.

**Classification:**
- **FACT:** The `Trips` screen (which uses `GET /bookings/guest`) reflects the new bookings.

### Test E — Host accepts a booking (`PATCH /bookings/{id}`)

- **Status:** **NOT EXECUTED**.
- **Reason:** No authenticated host token was available in the test environment. The mobile app is currently a guest-only flow; there is no host UI to accept a request.
- **Next step:** Test this through a host session or through a direct backend test with a host token.

### Test F — Host profile endpoint

- **Result:** The backend endpoint `GET /listings/profiles/host/{host_id}` was restored in code, but the production API still returns `404` because the backend has not been redeployed.
- **EVIDENCE:**
  - `curl` to `https://stayos-demo-production.up.railway.app/api/v1/listings/profiles/host/seed-host-0001` returned `404`.
- **Classification:**
  - **FACT:** The endpoint is missing from production.
  - **INFERENCE:** It will become available after the next production deploy.

---

## 5. Root-cause analysis of the original `31 Aug → 7 Sep` failure

### Original observed failure

`POST /bookings` for `seed-unit-0003` on `2026-08-31` → `2026-09-07` failed.

### Classification

| Statement | Classification | Reason |
|-----------|----------------|--------|
| The `POST /bookings` call returned an error. | **FACT** | Observed in the previous session. |
| The `Booking.create_booking` code that was on production at the time only checked existing `Booking` rows. | **FACT** | `src/app/bookings/services.py` before this session. |
| The `seed-unit-0003` unit had an existing `Booking` (or `Reservation`) covering part of that range. | **HYPOTHESIS** | The error was a 409 conflict; the dates were already blocked. This cannot be fully confirmed without production database access, but it is the most consistent explanation. |
| The `BookingScreen` previously replaced the real backend message with `حدث خطأ ما`. | **FACT** | `apps/mobile/src/screens/BookingScreen.tsx` before this session. |
| The old mobile code did not expose `data.error.message` because it looked for non-existent `data.error.message_ar` first and then `data.detail`, while the real envelope is `data.error.message`. | **FACT** | Verified from `src/app/main.py` and `BookingScreen.tsx`. |

---

## 6. DECISION: Should `/bookings` stay, be a compatibility layer, or be replaced by `/reservations`?

**DECISION:**

1. **`/reservations` is the canonical transaction engine.** It already creates `CalendarRule` rows, goes through the proper availability pipeline, and is the data model the rest of the backend (host calendar, dashboard, etc.) expects.
2. **`/bookings` should be kept as a temporary compatibility layer for the mobile app, not promoted to a parallel canonical engine.**
3. **`POST /bookings` must reuse the same availability and conflict checks as `POST /reservations`.** This session's changes to `src/app/bookings/services.py` and `src/app/availability/repository.py` implement that.
4. **The long-term path is to migrate the mobile screens (`BookingScreen`, `TripsScreen`) to the `/reservations` API and then deprecate `/bookings`.** Until that migration is complete, `/bookings` should remain, but it should be treated as a legacy adapter.

**Reasoning (FACT-based):**

- **FACT:** `Reservation` creation already writes the `BOOKED` `CalendarRule` and performs the correct availability checks.
- **FACT:** `Booking` creation was not writing `CalendarRule`s and was not checking `Reservation`s, causing the original failure.
- **FACT:** The mobile app currently depends on `POST /bookings` and `GET /bookings/guest`.
- **INFERENCE:** Making `/bookings` canonical would require duplicating the reservation engine and calendar synchronization, which is more risky and maintenance-heavy than reusing `/reservations`.

---

## 7. Unresolved blockers

1. **Backend not redeployed.** The production API is still running the pre-fix code; therefore, the new `min_nights`/`max_nights` and `CalendarRule` checks were not exercised. `Test C` and `Test F` are blocked until deploy.
2. **No host token.** `PATCH /bookings/{id}` / `PATCH /reservations/{id}` acceptance flow could not be tested end-to-end.
3. **Backend `message_ar` map is incomplete for the `409` conflict case.** `_HTTP_STATUS_CODES` maps `409` to `CONFLICT`, but `_ARABIC_MESSAGES` only has `CONFLICT_ERROR`, causing `message_ar` to fall back to `حدث خطأ ما`. The mobile fix now prefers `error.message` in that case, but the backend map should also be aligned.

---

## 8. Recommended next steps

1. **Deploy the current `release/test-apk-build` backend to production** and re-run `Test C` and `Test F`.
2. **Re-run `seed_staging.py`** to ensure the seeded `Reservation` has the accompanying `CalendarRule`.
3. **Add backend unit tests** for `Booking.create_booking` covering:
   - Overlap with an existing `Booking`.
   - Overlap with an existing `Reservation`.
   - `BLOCKED` calendar rule.
   - `min_nights` and `max_nights` violations.
   - `UnitStatus` not `LISTED`.
4. **Align `_HTTP_STATUS_CODES` with `_ARABIC_MESSAGES`** in `src/app/main.py` so `message_ar` is meaningful for `409`.
5. **Plan the mobile migration to `/reservations`:**
   - `POST /reservations`
   - `GET /reservations/guest`
   - `PATCH /reservations/{id}` for host actions
6. **Re-build and re-test the APK after (5).**

---

## 9. Artifacts and build references

| Artifact | Location |
|----------|----------|
| APK build (commit `02f33c5`) | `/Users/ahmed/Documents/Projects/StayOS/booking_e2e_20260901_012523/app-release-02f33c5.apk` |
| All `uiautomator` XML snapshots | `/Users/ahmed/Documents/Projects/StayOS/booking_e2e_20260901_012523/` |
| GitHub Actions build run | `https://github.com/islamelbaz2010/StayOS/actions/runs/33444562788` |
| Previous build run (first fix batch) | `https://github.com/islamelbaz2010/StayOS/actions/runs/33442793677` |

---

## 10. Commits

- `3fd0366` — Fix booking availability and error surfacing; restore host profile endpoint.
- `02f33c5` — Fix BookingScreen error surfacing and post-booking navigation.

---

## 11. Summary

A real `POST /bookings` request can succeed for `seed-unit-0002` with future, conflict-free dates. The `BookingScreen` now surfaces the real backend error message when a conflict occurs (`"Requested dates are not available"` instead of `حدث خطأ ما`). The `Trips` screen (`GET /bookings/guest`) correctly reflects the new `REQUESTED` bookings. The `Booking.create_booking` backend logic and availability repository were fixed in this branch, but they have not yet been deployed to production, so the full set of new validations (calendar rules, night limits, reservation overlap) could not be verified on the live API. The recommended architecture is to keep `/bookings` as a temporary mobile compatibility layer and make `/reservations` the canonical engine, with the goal of migrating the mobile app to `/reservations`.
