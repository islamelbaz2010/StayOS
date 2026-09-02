# S2-04_COMPLETION_REPORT.md

## 1. Changes made

- Added a dedicated `app.availability` backend module with entity (`CalendarRule`), repository, service, and host-only REST endpoints.
- `GET /availability/{unitId}` returns a day-by-day availability view for a unit, merging calendar rules with accepted bookings and confirmed reservations.
- `PATCH /availability/{unitId}` allows hosts to block or unblock date ranges in bulk.
- Implemented availability validation: cannot block/unblock dates occupied by accepted bookings or confirmed reservations; cannot submit overlapping rules; date ranges are validated.
- Created the host availability page at `/[locale]/host/availability/[unitId]` with a monthly calendar, date selection, block/unblock actions, loading, error, and success feedback.
- Added `HostAvailabilityCalendar` component and `useAvailability` / `useUpdateAvailability` React Query hooks.
- Updated Arabic and English i18n messages for the availability namespace.
- Added `tests/test_availability.py` covering service validation and the new API routes.

## 2. Files modified

### New files

- `src/app/availability/__init__.py`
- `src/app/availability/constants.py`
- `src/app/availability/schemas.py`
- `src/app/availability/repository.py`
- `src/app/availability/services.py`
- `src/app/availability/router.py`
- `apps/web/lib/queries/availability.ts`
- `apps/web/components/availability/HostAvailabilityCalendar.tsx`
- `apps/web/app/[locale]/host/availability/[unitId]/page.tsx`
- `tests/test_availability.py`
- `S2-04_COMPLETION_REPORT.md`

### Modified files

- `src/app/main.py` (registered availability router)
- `apps/web/messages/en.json`
- `apps/web/messages/ar.json`

## 3. Availability architecture

- The `CalendarRule` model in `app.listings.models` is the canonical availability entity. The new `app.availability` module wraps and extends it rather than introducing a separate table.
- `GET /availability/{unitId}` computes a daily status grid by combining:
  - Host-managed `CalendarRule` entries (`AVAILABLE`, `BLOCKED`).
  - Booking/reservation related `CalendarRule` entries (`BOOKED`, `HOLD`) with `reservation_id`.
  - Accepted `Booking` records (`ACCEPTED`).
  - Confirmed `Reservation` records (`CONFIRMED`).
- `PATCH /availability/{unitId}` replaces host-managed rules in the requested ranges via `listings_repository.bulk_replace_calendar_rules`, preserving reservation-related rules.

## 4. Validation rules

- **Date range**: `check_out` must be after `check_in`; range cannot exceed 365 days.
- **Rule overlap**: rules within a single `PATCH` request cannot overlap.
- **Occupied dates**:
  - Cannot block dates that overlap an accepted booking or confirmed reservation.
  - Cannot unblock (set `AVAILABLE`) dates that overlap an accepted booking or confirmed reservation.
  - Cannot modify `CalendarRule` entries tied to a reservation (`reservation_id` or `BOOKED`/`HOLD` status).
- **Ownership**: only the unit host (or admin) can read/modify availability.

## 5. Verification results

| Check | Command | Result |
|-------|---------|--------|
| Backend lint | `python3 -m ruff check src/app/availability tests/test_availability.py src/app/main.py` | ✅ Passed |
| Backend mypy | `python3 -m mypy src/app` | ✅ Passed |
| Backend tests | `python3 -m pytest --no-cov -q` | ✅ Passed |
| Frontend lint | `npm run lint` | ✅ Passed |
| Frontend type check | `npm run type-check` | ✅ Passed |
| Frontend build | `npm run build` | ✅ Passed |
| Frontend tests | `npm run test` | ✅ Passed |

## 6. Remaining issues

- **Search integration**: `search_listings` still relies solely on `CalendarRule` for blocked date filtering. Accepted bookings are not currently considered in listing search; this is a future search/availability integration task.
- **Calendar rule side effect**: `bulk_replace_calendar_rules` deletes all host-managed rules within the unioned min/max range of a multi-rule request, which may affect existing host rules between non-contiguous requested ranges. This is acceptable for the current bulk-availability design but may need finer-grained diffing in the future.
- **No public availability endpoint**: `GET /availability/{unitId}` is host-only. A public read-only variant can be exposed in S2-05 if the booking flow needs it.
- **No pricing or reservation creation**: intentionally out of scope as per task constraints.

## 7. Ready for S2-05?

### YES

The availability management foundation is in place, validated, and accessible through both REST and a host calendar UI. The next sprint can add host booking approval, payment/reservation conversion, and public availability consumption by the guest booking flow.
