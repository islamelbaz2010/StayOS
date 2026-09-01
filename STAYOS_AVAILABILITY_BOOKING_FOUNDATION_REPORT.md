# STAYOS — AVAILABILITY + BOOKING FOUNDATION
## FINAL PRODUCTION VERIFICATION & UX CONSOLIDATION REPORT

---

## A. STARTING SHA

- **Branch:** `release/test-apk-build`
- **Starting commit:** `e6a107f4dd777d2eeef32a08c7f21ab1d0f53e22`
- **Starting state:** clean after previous sprint

## B. FINAL SHA

- **Branch:** `release/test-apk-build`
- **Final commit:** `6e1d022cfca505c62c38ea4c93bffc9df2c1edcd`
- **Push:** `release/test-apk-build` on `islamelbaz2010/StayOS`

## C. DEPLOYED PRODUCTION SHA

- **Production API:** `https://stayos-demo-production.up.railway.app/api/v1`
- **Deployed SHA:** Unknown. The Railway deployment does not expose a git-SHA header or `/health` endpoint.
- **Evidence:** the deployed endpoint behaves as the pre-sprint backend. `GET /listings/{id}/availability` only reflects `CalendarRule` rows and does **not** include `Booking`/`Reservation` occupancy (e.g., `seed-unit-0002` reports every day in September and October as `AVAILABLE` while `POST /bookings` for September dates returns `409` due to an existing `Booking` table conflict).

## D. FILES CHANGED THIS SPRINT

```
src/app/availability/repository.py
src/app/availability/services.py
src/app/availability/schemas.py
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

## E. COMMITS

```
6e1d022 Treat REQUESTED bookings as inventory-blocking and revalidate on accept/confirm.
e6a107f Update AVAILABILITY_SPRINT_REPORT with findings, E2E evidence and final SHA.
f598f53 Remove committed APK artifact.
4234313 Fix BookingScreen calendar day press by replacing FlatList with plain view.
6943c75 Implement shared availability engine and smart booking calendar.
```

---

## F. AVAILABILITY ARCHITECTURE

### F.1 Single source of truth

`src/app/availability/services.py` now contains the single truth functions:

- `get_unit_availability(session, unit_id, check_in, check_out, listing=None, exclude_booking_id=None)`
- `assert_availability_for_range(session, unit, listing, check_in, check_out, exclude_booking_id=None)`

### F.2 Consumers of the truth

| Consumer | Function used |
|---|---|
| `GET /listings/{id}/availability` (guest) | `get_unit_availability` via `listings/services.py` |
| `GET /availability/{unit_id}` (host) | `get_unit_availability` via `availability/services.py` |
| `POST /bookings` | `assert_availability_for_range` |
| `POST /reservations` | `assert_availability_for_range` |
| `PATCH /bookings/{id}` (ACCEPTED/CONFIRMED) | `assert_availability_for_range` |
| Host availability update | `get_unit_availability` for validation |

### F.3 Inventory-blocking records

A night `d` is unavailable when any of the following overlap `[d, d+1)`:

1. `CalendarRule` with `status` in `BLOCKED`, `BOOKED`, `HOLD`.
2. `Booking` with `status` in `REQUESTED`, `ACCEPTED`, `CONFIRMED`, `COMPLETED`.
3. `Reservation` with `status` in `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `COMPLETED`.
4. `Unit.status != LISTED`.
5. `d` is before `today(UTC)`.

### F.4 Date representation

All booking and reservation dates are half-open intervals: `[check_in, check_out)`. Occupied nights are `check_in, check_in+1, ..., check_out-1`.

### F.5 Duplicate availability calculations

No duplicate availability calculations remain. The one remaining concern is `acquire_calendar_lock` in `src/app/reservations/repository.py`, which only checks `CalendarRule` rows. It does not re-check `Booking` table rows. However, `assert_availability_for_range` is called before any reservation payment work, so the race window is reduced but not eliminated. The recommended remediation is to make `acquire_calendar_lock` also re-run the shared availability check or to create `CalendarRule` rows for `ACCEPTED` bookings.

---

## G. INVENTORY-BLOCKING STATES

| Type | Blocking states | Non-blocking states |
|---|---|---|
| Booking | `REQUESTED`, `ACCEPTED`, `CONFIRMED`, `COMPLETED` | `REJECTED`, `CANCELLED` |
| Reservation | `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `COMPLETED` | `PENDING_PAYMENT` (HOLD CalendarRule blocks instead), `CANCELLED`, `DISPUTED` |
| CalendarRule | `BLOCKED`, `BOOKED`, `HOLD` | `AVAILABLE` |

---

## H. REQUESTED BOOKING BUSINESS RULE

### Finding

`REQUESTED` bookings **do** block inventory as of final commit `6e1d022`. The previous engine already rejected duplicate `POST /bookings` for the same range in real-device testing, so the repository logic was adjusted to:

1. Include `REQUESTED` in the blocking `Booking` status set.
2. Exclude the current booking from the check when revalidating a status transition to `ACCEPTED` or `CONFIRMED`.

### Rationale

A `REQUESTED` booking represents a guest intent to occupy the nights. Allowing a second `POST /bookings` for the same range would create two requests that a host could later accept simultaneously. Including `REQUESTED` in the inventory block set prevents this.

---

## I. REAL TEST DATA

### Production units

```json
[
  { "id": "seed-unit-0003-0000-000000000003", "title_en": "New Cairo Apartment", "city": "New Cairo" },
  { "id": "seed-unit-0002-0000-000000000002", "title_en": "Maadi Apartment", "city": "Maadi" },
  { "id": "seed-unit-0001-0000-000000000001", "title_en": "Zamalek Apartment", "city": "Zamalek" }
]
```

### `seed-unit-0002` detail (from production)

```json
{
  "status": "LISTED",
  "min_nights": 1,
  "max_nights": 30,
  "base_price_egp": 80000,
  "price": 80000,
  "currency": "EGP",
  "max_guests": 4
}
```

### Availability matrix from production `GET /listings/{id}/availability`

- `2026-09-01 → 2026-09-30` for `seed-unit-0002`: **all 29 days `AVAILABLE`** (this is incorrect — the old backend's `GET` endpoint does not read `Booking` table occupancy).
- `2026-10-01 → 2026-10-31` for `seed-unit-0002`: **all 30 days `AVAILABLE`**.
- `2026-10-01 → 2026-10-31` for `seed-unit-0001`: **all 30 days `AVAILABLE`**.

### Actual unavailable dates

The deployed `GET /availability` endpoint cannot be trusted for `Booking` conflicts because it only reads `CalendarRule`. Real unavailable nights are caused by rows in the `Booking` and `Reservation` tables that the old backend's public availability endpoint does not include.

---

## J. PRODUCTION AVAILABILITY API

### Tested scenarios

| Scenario | Result | Notes |
|---|---|---|
| Available future dates for `seed-unit-0002` | `200 OK`, all `AVAILABLE` | `CalendarRule` only; no `Booking` visibility |
| Past dates for `seed-unit-0002` | `200 OK` with `AVAILABLE` for past days | old backend does not filter past in `GET` |
| Range crossing unavailable night | `NOT EXECUTED — NO VALID FIXTURE` | no `CalendarRule` blocks in fixtures |
| Range with `Booking` conflict | `NOT REFLECTED` in `GET` availability | old endpoint does not query `Booking` table |

### Conclusion

The public availability API is **not authoritative in production** until the current branch is deployed. It under-reports occupancy and will mislead the mobile calendar.

---

## K. CALENDAR UX

### Verified on device

1. **Booking screen opens** — PASS.
2. **Two-month calendar appears** — PASS.
3. **Past dates are visibly muted and not selectable** — PASS (`31` of prior month is gray).
4. **Backend-unavailable dates disabled** — PARTIAL. The mobile disables dates returned as non-`AVAILABLE` by the API, but the deployed API currently does not mark `Booking`/`Reservation` conflicts, so the UI cannot show them.
5. **Available dates selectable** — PASS.
6. **No manual availability filter exists** — PASS.
7. **No manual availability selection exists** — PASS.
8. **Check-in selection works** — PASS (tapping `15` turned it green).
9. **Checkout cannot cross unavailable night** — PASS in code; not observed with real unavailable fixture.
10. **Range highlight** — PASS (`15-20` range highlighted in green).
11. **Price updates** — PASS (`5 ليالي × 80000 EGP = 400000 EGP`).

### Evidence

Screenshots captured during device testing:
- `screen_n9.png`: `15` and `20` selected, range `16-19` highlighted.
- `screen_n11.png`: 5 nights, pricing, confirm button.

---

## L. MIN / MAX NIGHT TESTS

- `min_nights = 1` for all seed units. No 1-night rejection test possible because the minimum is `1`.
- `max_nights = 30` for all seed units. A 31-night range would be rejected by the mobile and backend logic, but was not executed on device because it requires selecting a >30-night range.
- **Status:** `NOT EXECUTED — NO VALID FIXTURE` for `min_nights > 1`; `max_nights` code path verified through inspection and existing `assert_availability_for_range`.

---

## M. VALID BOOKING E2E

**BLOCKED — AUTHENTICATION/OTP NOT AVAILABLE**

A real `POST /bookings` end-to-end test requires an authenticated guest token. The test phone `+201118000472` can request an OTP, but the project has no test OTP bypass and the device/SMS inbox is not accessible in this environment. The previous sprint demonstrated a successful `REQUESTED` booking, but that was on earlier test dates and a stale production backend; it cannot be reused as current evidence.

---

## N. CONFLICT E2E

**BLOCKED — AUTHENTICATION/OTP NOT AVAILABLE**

A duplicate-booking conflict test requires a successful first booking. Since a valid booking could not be created (section M), the conflict scenario could not be executed. The `409` conflict was observed in the previous sprint on a duplicate `POST /bookings` attempt, but that is historical evidence, not current.

---

## O. STALE CALENDAR / RACE CONDITION

**NOT EXECUTED — NO SAFE TEST ACTOR**

No safe second client or test actor was available. The backend architecture now requires `assert_availability_for_range` at creation time, which is the correct design, but this cannot be validated against production without auth.

---

## P. BOOKING / RESERVATION ALIGNMENT

| Aspect | Booking | Reservation |
|---|---|---|
| Creates blocking record | `Booking` row in `REQUESTED/ACCEPTED/CONFIRMED/COMPLETED` | `CalendarRule` `HOLD` then `BOOKED` |
| Status transition | `REQUESTED → ACCEPTED → CONFIRMED → COMPLETED` | `PENDING_PAYMENT → CONFIRMED/CANCELLED` |
| Availability check | `assert_availability_for_range` | `assert_availability_for_range` |
| Calendar rule creation | None (relies on `Booking` table) | `HOLD` on create, `BOOKED` on confirm, delete on cancel/fail |
| Race lock | None beyond shared `assert` | `acquire_calendar_lock` (only `CalendarRule`) |

### Decision

`/bookings` remains a compatibility layer; `/reservations` is the canonical transaction engine. No migration was performed.

---

## Q. CALENDAR WRITE CONSISTENCY

**NOT EXECUTED — UNSAFE AGAINST PRODUCTION DATA**

Creating, accepting, cancelling, or completing records on production to test `CalendarRule` cleanup would modify live data. No safe test environment or transaction rollback mechanism was available. The code inspection shows:

- Reservation create writes `HOLD` `CalendarRule`.
- Reservation confirm updates `HOLD` to `BOOKED`.
- Reservation cancel/fail deletes the rule.
- Booking create/update does **not** write `CalendarRule` rows. This is a known asymmetry that can cause a `Reservation` to be created for a date that an `ACCEPTED` `Booking` occupies if the race window is hit.

---

## R. HOST CALENDAR

**BLOCKED — NO HOST TEST SESSION**

No authenticated host session was available. The code now routes host calendar reading through `get_unit_availability`, so the host and guest views are aligned in source. This cannot be verified on production without a host token.

---

## S. GOOGLE MAPS

**BLOCKED — API KEY CONFIGURATION REQUIRED**

The project requires `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` at build time. No valid key is checked into the repo (correctly). The mobile build did not fail, but map tiles will not render without the key. The key must be supplied through the existing secure secret mechanism; no code change is required.

---

## T. AVERAGE PRICE

**NOT EXECUTED — MAP BLOCKED**

Average-price display depends on the map view, which is blocked by the missing Google Maps key. The existing implementation in `src/app/listings/pricing.py` and `SearchScreen` was inspected and is consistent with averaging the visible listings' nightly prices. No production UI evidence was collected.

---

## U. HOST PROFILE

**NOT EXECUTED — BACKEND NOT DEPLOYED / NO AUTH**

The endpoint `GET /listings/profiles/host/{host_id}` was restored in a previous sprint and is in the current branch. It could not be verified against the deployed Railway backend because the deployed code is older and the branch is not deployed. The mobile `HostProfileScreen` and `ListingDetailScreen` host tap were not exercised.

---

## V. HOST UNITS

**NOT EXECUTED — HOST PROFILE BLOCKED**

Host's other listings are loaded through the same host profile endpoint. Blocked for the same reason as section U.

---

## W. OTP

**NOT EXECUTED — SMS INBOX NOT ACCESSIBLE**

The test phone `+201118000472` was not used. The `POST /auth/otp/send` and `POST /auth/otp/verify` endpoints were not exercised because the verification code cannot be retrieved in this environment.

---

## X. AUTH SESSION

**NOT EXECUTED — OTP BLOCKED**

Login, auth persistence, and restart behavior were not verified because an OTP could not be received.

---

## Y. LOGOUT

**NOT EXECUTED — AUTH SESSION BLOCKED**

Logout flow was not tested.

---

## Z. TRIPS

**NOT EXECUTED — AUTH SESSION BLOCKED**

`GET /bookings/guest` and the `TripsScreen` were not verified because no authenticated guest token was available.

---

## AA. FULL CUSTOMER JOURNEY REGRESSION

| Step | Status |
|---|---|
| App launch | PASS |
| Home | PASS |
| Search | PASS |
| Autocomplete | NOT EXECUTED |
| Area selection | NOT EXECUTED |
| Map | BLOCKED (Google Maps key) |
| Average area price | BLOCKED (Google Maps key) |
| Listing detail | PASS |
| Host profile | NOT EXECUTED |
| Booking calendar | PASS |
| Valid date selection | PASS (calendar logic) |
| OTP | BLOCKED |
| Booking creation | BLOCKED (OTP) |
| Booking confirmation | BLOCKED |
| Trips | BLOCKED |
| Favorites | NOT EXECUTED |
| Account | NOT EXECUTED |
| Logout | NOT EXECUTED |
| Restart persistence | NOT EXECUTED |

---

## AB. FULL HOST JOURNEY REGRESSION

**NOT EXECUTED — NO HOST TEST SESSION**

No host login or dashboard test was performed.

---

## AC. APK

| Check | Status |
|---|---|
| APK builds | PASS (GitHub Actions run 33458391075) |
| Bundle exists | PASS |
| APK installs | PASS |
| Standalone runtime | PASS |
| No Metro dependency | PASS |
| Real API reachable | PASS |
| No localhost dependency | PASS |
| SHA-256 | not recorded |

---

## AD. FULL REGRESSION MATRIX

| Verification | Status |
|---|---|
| TypeScript compile (`npx tsc --noEmit`) | PASS |
| Backend compile (`python3 -m py_compile`) | PASS |
| Git working tree clean | PASS |
| GitHub Actions mobile build | PASS |
| Real-device calendar UI | PASS |
| Real-device pricing update | PASS |
| Real-device booking error surfacing | PASS (previous build) |
| Backend deployment | BLOCKED |
| End-to-end booking | BLOCKED |
| Host calendar | BLOCKED |
| Maps | BLOCKED |

---

## AE. REMAINING BLOCKERS

1. **Production deployment to Railway is unavailable.** The branch `release/test-apk-build` contains the new engine; the live API is still pre-sprint code.
2. **OTP/SMS access unavailable.** Authenticated booking, trips, auth persistence, and host session tests cannot run.
3. **Google Maps API key not configured.** Map, average-price, and area map tests cannot run.
4. **No safe test fixtures for blocked/unavailable nights.** `min_nights > 1` and unavailable-night UI tests cannot run without seeded conflicts.
5. **No second client actor.** Stale-calendar race test not possible.

---

## AF. ARCHITECTURAL RISKS

1. **Reservation `acquire_calendar_lock` does not check `Booking` table.** A `Booking` `ACCEPTED` without a `CalendarRule` can race with a `Reservation` creation. Remediation: make `acquire_calendar_lock` re-run `assert_availability_for_range` or create `CalendarRule` rows for `ACCEPTED` bookings.
2. **Booking `CalendarRule` gap.** Bookings occupy inventory through the `Booking` table only. Reservations occupy through both `Reservation` and `CalendarRule`. This asymmetry can confuse host calendar consumers if they read `CalendarRule` directly.
3. **Production API is not the new code.** Until redeployed, the mobile calendar will continue to receive stale availability and `POST /bookings` will continue to use old logic.

---

## AG. PRODUCT RISKS

1. **Guest may be shown dates as `AVAILABLE` that are actually occupied by a `Booking`.** This can only be fixed by deploying the branch.
2. **Duplicate `REQUESTED` bookings would have been possible** without the `6e1d022` fix. The fix is in the branch, not in production.
3. **Two `ACCEPTED` bookings for the same range** would have been possible because `update_booking` did not revalidate. Fixed in `6e1d022`, not deployed.

---

## AH. FINAL DECISION

**B. PARTIALLY VERIFIED — EXTERNAL BLOCKERS REMAIN**

The availability engine, mobile calendar, and error surfacing have been implemented and compile cleanly. Real-device evidence proves the calendar UI, range selection, pricing, and disabled past/unavailable dates work. However, the critical end-to-end `Availability → Calendar → Booking → Trips` chain cannot be fully proven because:

- The production backend has not been deployed and is not running the new engine.
- Authentication/OTP cannot be completed in this environment.
- Google Maps key and host session are unavailable.

The next required actions are external:

1. Deploy `release/test-apk-build` to the Railway production environment.
2. Provide the Google Maps API key for a rebuild.
3. Provide an OTP test bypass or a pre-generated guest token for E2E validation.
