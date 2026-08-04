# P0 IMPLEMENTATION REPORT — StayOS

**Date:** 2026-08-04
**Commit:** `bf19e693ffdb3f59ad8df6d80efe3621a92e7fff`
**Status:** All 4 P0 tasks implemented and verified.

---

## P0-A: CSV Template + Download Link

### Files Modified

| File | Change |
|------|--------|
| `apps/web/public/import-template.csv` | **NEW FILE** — Static CSV template with all columns from `COLUMN_ALIASES` and 2 example rows |
| `apps/web/app/[locale]/admin/import/page.tsx` | Added `<a>` download link in the idle phase, below the formats hint |
| `apps/web/messages/en.json` | Added `downloadTemplate` key under `adminImport` |
| `apps/web/messages/ar.json` | Added `downloadTemplate` key under `adminImport` |
| `apps/web/app/[locale]/admin/import/page.test.tsx` | Added `downloadTemplate` to test messages |

### Why They Changed

Partners need a CSV template to know the expected column names and data formats. The template is a static file served from `public/` — no dynamic generation, no new API, no new component. The download link reuses the existing idle phase UI on the admin import page.

### Verification

- ESLint: passed (0 errors)
- TypeScript: passed (0 errors)
- Build: passed
- Frontend tests: 3/3 passed

### Deviation from Plan

None. Implemented exactly as planned.

---

## P0-B: Fix Import Confirm Data Flow

### Files Modified

| File | Change |
|------|--------|
| `src/app/importer/schemas.py` | `ImportPreviewRow` now inherits from `ImportRowData` instead of redefining a subset of fields. Only `is_valid`, `is_duplicate`, and `errors` remain as preview-specific fields. |
| `src/app/importer/services.py` | `generate_preview()` now passes `**row.model_dump()` into `ImportPreviewRow` instead of cherry-picking 9 fields. All parsed fields survive the preview → confirm round-trip. |
| `apps/web/lib/queries/import.ts` | `ImportPreviewRow` interface now extends `ImportRowData` instead of redefining a subset. |
| `apps/web/app/[locale]/admin/import/page.tsx` | `handleConfirm()` now maps all `ImportRowData` fields from the preview response instead of hardcoding `description: ""`, `latitude: 0`, `longitude: 0`. |
| `apps/web/app/[locale]/admin/import/page.test.tsx` | Mock preview data updated to include all `ImportRowData` fields. |
| `tests/test_import.py` | Added assertions verifying `description`, `latitude`, and `longitude` are preserved through preview generation. Updated `_make_valid_row()` default status to `PENDING_VERIFICATION`. |

### Why They Changed

**Root cause confirmed by tracing the code path:**

1. `parser.py` `parse_file()` → returns `list[ImportRowData]` with ALL fields populated correctly.
2. `services.py` `generate_preview()` → converts each `ImportRowData` to `ImportPreviewRow`, which was a **strict subset** containing only: `row_number, title, city, governorate, price, property_type, host_name, host_phone, host_email, is_valid, is_duplicate, errors`. Fields `description`, `latitude`, `longitude`, `amenities`, `image_urls`, `bedrooms`, `bedrooms`, `beds`, `bathrooms`, `max_guests`, `address`, `district`, `country`, `currency`, `status` were **discarded**.
3. Frontend `page.tsx` `handleConfirm()` → mapped `ImportPreviewRow` to `ImportRowData` with `description: ""`, `latitude: 0`, `longitude: 0` because those fields didn't exist on the preview row.
4. `services.py` `execute_import()` → received `ImportConfirmRequest` with corrupted data. `validation.py` `validate_row()` rejected `0,0` coordinates (line 49-56), causing every valid row to fail at confirm time.

**The fix:** Make `ImportPreviewRow` inherit from `ImportRowData` so all fields are preserved. One schema change, one service change, one frontend type change, one frontend mapping change. No new endpoint, no new API, no new component.

### Verification

- Ruff: passed
- Mypy: passed (0 issues)
- Pytest: 401/401 passed (including 25 import tests with new field preservation assertions)
- ESLint: passed (0 errors)
- TypeScript: passed (0 errors)
- Build: passed
- Frontend tests: 10/10 passed

### Deviation from Plan

None. The root cause matched the planning document exactly. The fix was implemented as specified — `ImportPreviewRow(ImportRowData)` with `**row.model_dump()` in `generate_preview()`.

---

## P0-C: Owner Outreach Template

### Files Modified

| File | Change |
|------|--------|
| `src/app/notifications/constants.py` | Added `OWNER_OUTREACH = "owner.outreach"` to `NotificationEvent` |
| `src/app/notifications/templates.py` | Added `"owner.outreach"` entry to `_DEFAULT_TEMPLATES` with Arabic and English WhatsApp and SMS templates |

### Why They Changed

The founder needs a reusable WhatsApp/SMS template for owner outreach during supply acquisition. The existing `_DEFAULT_TEMPLATES` registry and `render_template()` function already handle any event. This is a dict entry + constant, not a new module, provider, or system.

### Verification

- Ruff: passed
- Mypy: passed
- Pytest: 401/401 passed (existing notification tests still pass)

### Deviation from Plan

None. Implemented exactly as planned.

---

## P0-D: Imported Listing Default Status

### Files Modified

| File | Change |
|------|--------|
| `src/app/importer/schemas.py` | `ImportRowData.status` default changed from `"LISTED"` to `"PENDING_VERIFICATION"` |
| `src/app/importer/parser.py` | `_row_to_import_data()` default status changed from `"LISTED"` to `"PENDING_VERIFICATION"` |
| `tests/test_import.py` | `_make_valid_row()` default status changed from `"LISTED"` to `"PENDING_VERIFICATION"` |

### Why They Changed

Imported listings must enter the admin review queue before going live. The `PENDING_VERIFICATION` status already exists in `UnitStatus`, is already in `VALID_STATUSES`, and is already handled by `get_pending_listings()` and `approve_listing()` in the listings service. The admin pending page already displays and approves these listings. Only the default value needed changing.

### Verification

- Ruff: passed
- Mypy: passed
- Pytest: 401/401 passed
- The CSV template (P0-A) uses `PENDING_VERIFICATION` as the example status value.

### Deviation from Plan

None. Implemented exactly as planned.

---

## Full Verification Summary

### Backend

| Check | Result |
|-------|--------|
| `ruff check src/ tests/` | passed (0 errors) |
| `mypy src/` | passed (0 issues) |
| `pytest tests/ --no-cov` | 401 passed, 0 failed |

### Frontend

| Check | Result |
|-------|--------|
| `eslint .` | passed (0 errors, 9 pre-existing warnings) |
| `tsc --noEmit` | passed (0 errors) |
| `next build` | passed (compiled successfully) |
| `vitest run` | 10 passed, 0 failed |

---

## Repository Status

- **Commit hash:** `bf19e693ffdb3f59ad8df6d80efe3621a92e7fff`
- **Files changed:** 14 files, 1072 insertions, 38 deletions
- **New files:** 3 (`import-template.csv`, `P0_ENGINEERING_EXECUTION_PLAN.md`, `SUPPLY_EXECUTION_MASTER_PLAN.md`)
- **Modified files:** 11
- **Working tree:** Clean (all changes committed)
