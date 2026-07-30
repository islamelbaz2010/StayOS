# S2-02_COMPLETION_REPORT.md

## 1. Changes made

Implemented the backend-only booking domain foundation for StayOS.

- Added a new `app.bookings` module with entity, status enum, repository, schemas, service, and router.
- Created the `Booking` SQLAlchemy model under the `booking` schema.
- Added an Alembic migration (`016_create_bookings_table`) to create the `booking` schema and `bookings` table.
- Wired the booking router into `app.main` at `/api/v1/bookings`.
- Registered the `bookings` model in `alembic/env.py` for migration generation.
- Implemented validation rules for date ranges, unit availability, guest capacity, status transitions, and authorization.
- Wrote unit and integration tests for the repository, service, and router.

## 2. Files modified

### New files

- `src/app/bookings/constants.py`
- `src/app/bookings/models.py`
- `src/app/bookings/repository.py`
- `src/app/bookings/schemas.py`
- `src/app/bookings/services.py`
- `src/app/bookings/router.py`
- `src/app/bookings/__init__.py`
- `alembic/versions/016_create_bookings_table.py`
- `tests/test_bookings.py`
- `tests/test_bookings_repository.py`
- `S2-02_COMPLETION_REPORT.md`

### Modified files

- `src/app/main.py` (included `bookings_router`)
- `alembic/env.py` (imported `bookings.models`)

## 3. Booking architecture

- **Entity**: `Booking` is the aggregate root. It stores `unit_id`, `guest_id`, status, date range, guest counts, and lifecycle timestamps (`requested_at`, `accepted_at`, `rejected_at`, `cancelled_at`).
- **Status enum**: `requested` → `accepted` / `rejected` / `cancelled`; `accepted` → `cancelled`; `rejected` and `cancelled` are terminal.
- **Repository**: Handles CRUD and overlap detection over the `bookings` table.
- **Service**: Encapsulates validation, authorization, status transitions, and response mapping.
- **API**: Three endpoints under `/api/v1/bookings`:
  - `POST /bookings` — guest requests a booking.
  - `GET /bookings/{id}` — guest, host, or admin retrieves a booking.
  - `PATCH /bookings/{id}` — host/admin accepts or rejects; guest/host/admin cancels.
- The router delegates to the service and maps `StayOSError` exceptions to the standard HTTP exception layer.

## 4. Validation rules

- **Dates**: `check_out` must be strictly after `check_in`; `check_in` cannot be in the past.
- **Unit availability**: the unit must exist and its `UnitStatus` must be `LISTED`.
- **Guest validation**: at least one adult; children and infants non-negative; total guests (`adults + children + infants`) must not exceed `unit.max_guests`.
- **Conflict detection**: a new or updated booking cannot overlap with any existing booking in `requested`, `accepted`, or terminal `cancelled`/`rejected` excluded states for the same unit.
- **Status transitions**: only the defined lifecycle transitions are allowed.
- **Authorization**:
  - Only guests can create bookings.
  - Only the host of the unit or an admin can accept/reject.
  - The guest, host, or admin can cancel.
  - A user can view a booking if they are the guest, the unit's host, or an admin.

## 5. Tests

New test files:

- `tests/test_bookings.py` — service-level and router-level tests covering:
  - successful booking creation,
  - guest-only creation restriction,
  - past-date rejection,
  - non-listed unit rejection,
  - guest capacity validation,
  - date-overlap conflict detection,
  - get/update authorization,
  - status transitions,
  - unauthenticated API rejection.
- `tests/test_bookings_repository.py` — repository tests covering create, get, `get_or_raise`, overlap listing, and update.

Full backend suite results (after changes):

| Check | Command | Result |
|-------|---------|--------|
| Backend linter | `python3 -m ruff check src/app tests` | ✅ Passed |
| Backend type check | `python3 -m mypy src/app` | ✅ Passed |
| Backend auth tests | `python3 -m pytest tests/test_auth.py --no-cov -q` | ✅ 12 passed |
| Booking tests | `python3 -m pytest tests/test_bookings.py tests/test_bookings_repository.py --no-cov -q` | ✅ 25 passed |
| Full backend suite | `python3 -m pytest --no-cov -q` | ✅ 318 passed |

## 6. Remaining issues

- **Overlap with paid reservations**: conflict detection currently checks only the `bookings` table. Once S2-03 links accepted bookings to reservations, overlap must also consider `reservation.reservations` (and the calendar rules table) to avoid double-booking paid stays.
- **Booking-to-reservation bridge**: accepted bookings do not yet create a reservation or payment flow; that is the responsibility of a later sprint.
- **Host notifications**: no notification events are emitted when a booking is requested, accepted, rejected, or cancelled.
- **Cancellation policy**: no refund rules or deadline checks are enforced yet.
- **Alembic migration not applied**: the `016_create_bookings_table` migration is committed but should be run against target environments with `alembic upgrade head`.

## 7. Ready for S2-03?

### YES

The booking domain foundation is implemented, validated, and tested. The `requested` → `accepted` → `rejected`/`cancelled` lifecycle is in place. S2-03 can build on this by integrating accepted bookings into the reservation/payment flow and adding calendar notifications.
