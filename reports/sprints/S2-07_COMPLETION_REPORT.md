# S2-07_COMPLETION_REPORT.md

## 1. Changes made

### Backend

- Added explicit `VersionResponse` and `RootResponse` Pydantic schemas to `app/shared/schemas.py`.
- Updated `app/main.py` so the public `GET /version` and `GET /` endpoints use `response_model`, ensuring they are fully described by the OpenAPI schema.
- Verified all `/api/v1` routers continue to expose typed request and response models through FastAPI's automatic OpenAPI generation.

### Contract generation

- Added `scripts/export_openapi.py` to export the FastAPI OpenAPI schema (without starting the server) to `apps/web/lib/openapi.json`.
- Added `apps/web/package.json` script `generate:api` that runs the exporter and then `openapi-typescript` to generate `apps/web/lib/api-types.ts`.
- Generated `apps/web/lib/api-types.ts` as the single typed source of truth for frontend API contracts.

### Frontend consumption

- Replaced manually maintained request/response interfaces in:
  - `apps/web/lib/queries/listings.ts` (ListingResponse, ListingSearchResult, ListingSearchResponse)
  - `apps/web/lib/queries/bookings.ts` (BookingCreate, BookingResponse, BookingUpdate)
  - `apps/web/lib/queries/availability.ts` (AvailabilityDay, AvailabilityResponse, AvailabilityRule, AvailabilityUpdateRequest)
- Kept the existing query hooks and function signatures compatible; only the type definitions now derive from `api-types.ts`.
- Updated `HostAvailabilityCalendar.tsx` to handle optional `block_type` values that come from the generated schema.

## 2. Files modified

### New files

- `scripts/export_openapi.py`
- `apps/web/lib/api-types.ts`
- `S2-07_COMPLETION_REPORT.md`

### Modified files

- `src/app/shared/schemas.py`
- `src/app/main.py`
- `apps/web/package.json`
- `.gitignore`
- `apps/web/lib/queries/listings.ts`
- `apps/web/lib/queries/bookings.ts`
- `apps/web/lib/queries/availability.ts`
- `apps/web/components/availability/HostAvailabilityCalendar.tsx`

## 3. Contract generation approach

The canonical API contract is the FastAPI OpenAPI schema. The generation flow is:

1. `python3 scripts/export_openapi.py` sets minimal test environment variables, imports `app.main.app`, and writes `app.openapi()` to `apps/web/lib/openapi.json`.
2. `npx openapi-typescript apps/web/lib/openapi.json -o apps/web/lib/api-types.ts` consumes the JSON and emits TypeScript types.
3. Frontend query modules import `components` from `@/lib/api-types` and alias the schemas they need, preserving the existing public hook interfaces.

The generated `openapi.json` is not committed (it is listed in `.gitignore`) because it can be regenerated at any time. The typed contract `api-types.ts` is committed so the Next.js build and type checks can run without regenerating it.

## 4. Verification results

| Check | Command | Result |
|-------|---------|--------|
| Backend lint | `python3 -m ruff check src/app` | ✅ Passed |
| Backend mypy | `python3 -m mypy src/app` | ✅ Passed |
| Backend tests | `python3 -m pytest --no-cov -q` | ✅ 326 passed |
| Frontend lint | `npm run lint` | ✅ Passed |
| Frontend type check | `npm run type-check` | ✅ Passed |
| Frontend build | `npm run build` | ✅ Passed |
| Frontend tests | `npm --prefix apps/web run test` | ✅ Passed (no test files) |

## 5. Remaining issues

- Some generated schema names are prefixed with the Python module path (e.g., `app__availability__schemas__AvailabilityResponse`) because the same Pydantic schema name exists in multiple modules. Frontend modules reference the prefixed names directly; this is cosmetic and type-safe.
- `openapi-typescript` treats all optional Pydantic fields as `T | undefined`, so a few mappings needed `?? null` fallbacks. These are localized and do not affect runtime behavior.
- The contract is currently a one-way generation (backend to frontend). A future enhancement could validate the frontend types against the OpenAPI spec in CI.

## 6. Ready for S2-08?

### YES

The API contract is now stable, typed, and generated from the FastAPI OpenAPI schema. The frontend query hooks consume a single source of truth, and the backend endpoints have explicit response models for all public paths. S2-08 can extend this foundation with new business features while reusing the same contract flow.
