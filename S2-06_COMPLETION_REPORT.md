# S2-06_COMPLETION_REPORT.md

## 1. Changes made

- Removed hardcoded `country`, `currency`, and default cover image selection from listing presentation.
- Added database-backed listing configuration fields to `UnitListing`:
  - `country` (`String(100)`, default `Egypt`)
  - `currency` (`String(3)`, default `EGP`)
  - `cover_photo_id` (`String(36)`, nullable FK to `pms.unit_photos.id`)
  - `cover_photo` relationship to `UnitPhoto`
- Updated listing request/response schemas to support and return `country`, `currency`, and `cover_photo_id`.
- Added a new `app.listings.configuration` module with:
  - `resolve_cover_image_url()` — selects the configured cover photo, then the `is_cover` photo, then the first available photo.
  - `validate_listing_configuration()` — validates ISO currency, non-empty country, and that the selected cover photo belongs to the listing's unit.
- Wired configuration validation into `create_listing` and `update_listing` service flows.
- Updated `ListingResponse` and `ListingSearchResult` to return database-driven `country` and `currency` instead of hardcoded defaults.
- Created Alembic migration `017_add_listing_configuration` to add the columns and backfill existing rows.
- Updated the listing detail page and `ListingCard` to consume the new API values and fall back to `Egypt` / `EGP` / placeholder image if a value is missing.

## 2. Files modified

### New files

- `src/app/listings/configuration.py`
- `alembic/versions/017_add_listing_configuration.py`
- `S2-06_COMPLETION_REPORT.md`

### Modified files

- `src/app/listings/models.py`
- `src/app/listings/schemas.py`
- `src/app/listings/repository.py`
- `src/app/listings/services.py`
- `apps/web/app/[locale]/listings/[unitId]/page.tsx`
- `apps/web/components/listings/ListingCard.tsx`
- `tests/test_listings_services.py`
- `tests/test_listings_repository.py`
- `tests/test_reservations_services.py`

## 3. Data model changes

`UnitListing` now stores:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `country` | `String(100)` | No | `Egypt` | Listing market/country |
| `currency` | `String(3)` | No | `EGP` | ISO currency code for prices |
| `cover_photo_id` | `String(36)` | Yes | `NULL` | FK to `pms.unit_photos.id` |

A SQLAlchemy relationship `cover_photo` was also added to allow eager loading of the selected cover photo.

## 4. Migration summary

`alembic/versions/017_add_listing_configuration.py`:
- Adds `country` and `currency` columns to `pms.unit_listings` with `server_default` values.
- Adds `cover_photo_id` column as a nullable foreign key.
- Backfills existing `unit_listings` rows with `country = 'Egypt'` and `currency = 'EGP'`.
- Creates an index on `cover_photo_id`.
- Downgrade removes the columns and index.

## 5. Verification results

| Check | Command | Result |
|-------|---------|--------|
| Backend lint | `python3 -m ruff check src/app` | ✅ Passed |
| Backend mypy | `python3 -m mypy src/app` | ✅ Passed |
| Backend tests | `python3 -m pytest --no-cov -q` | ✅ 326 passed |
| Frontend lint | `npm run lint` | ✅ Passed |
| Frontend type check | `npm run type-check` | ✅ Passed |
| Frontend build | `npm run build` | ✅ Passed |
| Frontend tests | `npm --prefix apps/web run test` | ✅ Passed |

## 6. Remaining issues

- Existing listing tests required `country` and `currency` to be added to fixture `UnitListing` instances because SQLAlchemy column `default` values are not applied to in-memory objects the way database `server_default` values are. In production, the database and migration ensure these fields are never `NULL`.
- `ListingUpdate` allows `country` and `currency` to be omitted; explicit `null` values are not guarded by the schema itself but are caught by the database `nullable=False` constraint during persistence.
- Multi-currency pricing logic is still stored in `base_price_egp`; the `currency` column is for presentation and future pricing engine expansion.

## 7. Ready for S2-07?

### YES

Listing presentation is now database-driven with configuration validation, a migration, and frontend consumption. The next sprint can build on this foundation with full multi-market pricing, currency conversion, or payment integration.
