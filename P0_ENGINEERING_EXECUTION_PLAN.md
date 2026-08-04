# P0 ENGINEERING EXECUTION PLAN — StayOS

**Author:** Chief Software Architect & Release Engineering Lead
**Date:** 2026-08-04
**Status:** FINAL — The next conversation after this document is implementation.

---

## 1. Current P0 Tasks

The `SUPPLY_EXECUTION_MASTER_PLAN.md` identified 5 P0 engineering tasks:

| # | Task | Description |
|---|------|-------------|
| P0-1 | CSV Template File | Create a downloadable CSV template for partners |
| P0-2 | Template Download Link | Add a "Download Template" link on the admin import page |
| P0-3 | Fix Import Confirm Data Flow | Description, coordinates, amenities, and photos are lost during import confirmation |
| P0-4 | Owner Outreach WhatsApp Template | Add an `owner.outreach` notification event |
| P0-5 | Default Import Status to PENDING_VERIFICATION | Imported listings should go through admin review |

---

## 2. Merge Opportunities

### P0-1 + P0-2 → MERGE into single task

**Rationale:** P0-1 (create CSV template file) and P0-2 (add download link) are a single unit of work. Creating a static file without a link to it is incomplete. Adding a link without a file is broken. They must be done together.

**Merged task:** P0-A — CSV Template + Download Link

---

## 3. Reuse Opportunities

### P0-3 — Reuse existing `ImportRowData` schema, do NOT create new types

The `ImportRowData` schema in `src/app/importer/schemas.py` already contains every field needed (description, latitude, longitude, amenities, image_urls, bedrooms, bathrooms, etc.). The `ImportPreviewRow` schema is a strict subset. The fix is to make `ImportPreviewRow` inherit from `ImportRowData` and add the preview-only fields. No new schema, no new endpoint, no new service.

### P0-4 — Reuse existing template system, do NOT create new module

The `_DEFAULT_TEMPLATES` dict in `src/app/notifications/templates.py` is the existing template registry. Adding a new event is a dict entry, not a new module. The `render_template()` function already handles all events, channels, and locales.

### P0-5 — Reuse existing `UnitStatus.PENDING_VERIFICATION`, do NOT create new status

The `UnitStatus` enum in `src/app/listings/constants.py` already defines `PENDING_VERIFICATION`. The `VALID_STATUSES` set in `validation.py` already includes it. The admin pending queue (`GET /listings/admin/pending`) already filters for it. The admin approve endpoint (`POST /listings/admin/{unit_id}/approve`) already transitions from `PENDING_VERIFICATION` to `LISTED`. No new status, no new endpoint, no new workflow.

---

## 4. Tasks Eliminated

| # | Task | Why Eliminated |
|---|------|----------------|
| ~~P0-2~~ | Template Download Link (standalone) | Merged into P0-A with P0-1 |

No other tasks can be eliminated. P0-3 is a critical bug fix. P0-4 is a 15-minute template addition. P0-5 is a 5-minute default change. All are minimal.

---

## 5. Tasks Simplified

### P0-3 — Root Cause Analysis

**The bug:** When the admin clicks "Import Valid Rows", the frontend sends `ImportRowData` with `description: ""`, `latitude: 0`, `longitude: 0`, and no amenities or image URLs — even though the CSV contained correct values.

**Root cause traced through the data flow:**

1. `parser.py` `parse_file()` → returns `list[ImportRowData]` with ALL fields populated correctly from the CSV.
2. `services.py` `generate_preview()` → receives `list[ImportRowData]` but converts each row to `ImportPreviewRow`, which is a **strict subset** containing only: `row_number, title, city, governorate, price, property_type, host_name, host_phone, host_email, is_valid, is_duplicate, errors`.
3. The `ImportPreviewResponse` returned to the frontend contains `list[ImportPreviewRow]` — **description, latitude, longitude, amenities, image_urls, bedrooms, bathrooms, beds, max_guests, address, district, country, currency, status are all discarded**.
4. Frontend `page.tsx` (lines 68–83) maps `ImportPreviewRow` → `ImportRowData` to send to `/import/confirm`. Since `ImportPreviewRow` lacks these fields, the frontend hardcodes: `description: ""`, `latitude: 0`, `longitude: 0`.
5. `services.py` `execute_import()` receives `ImportConfirmRequest` with `list[ImportRowData]` — but the data is now corrupted. The `_create_unit_and_listing()` function writes `0,0` coordinates and empty descriptions to the database.
6. `validation.py` `validate_row()` rejects `0,0` coordinates (line 49–56), so **every valid row from the preview becomes invalid at confirm time**. The import silently fails for all rows.

**This is not a frontend bug. It is a schema design flaw.** `ImportPreviewRow` discards data that the confirm endpoint needs.

**The fix (smallest possible):**

Make `ImportPreviewRow` inherit from `ImportRowData` so all parsed fields are preserved through the preview → confirm round-trip. Add `is_valid`, `is_duplicate`, and `errors` as the only preview-specific fields.

This requires:
- `schemas.py`: Change `ImportPreviewRow` to inherit from `ImportRowData`, remove duplicated fields, keep only `is_valid`, `is_duplicate`, `errors`.
- `services.py`: `generate_preview()` already has the full `ImportRowData` — pass it through instead of cherry-picking fields.
- `import.ts`: Update `ImportPreviewRow` TypeScript interface to include all `ImportRowData` fields.
- `page.tsx`: Update the confirm mapping to pass through all fields from the preview response instead of hardcoding empty values.
- `page.test.tsx`: Update mock preview data to include all `ImportRowData` fields.

**What does NOT change:**
- No new endpoint.
- No new API.
- No new service.
- No new component.
- No new page.
- The preview endpoint signature stays the same.
- The confirm endpoint signature stays the same.
- The parser stays the same.
- The validation stays the same.
- The `_create_unit_and_listing()` function stays the same.

---

## 6. Final P0 Engineering Tasks

### P0-A: CSV Template + Download Link (Merged from P0-1 + P0-2)

**What:** Create a static CSV template file in `apps/web/public/` and add a download link on the existing admin import page.

**Existing files to modify:**
- `apps/web/public/import-template.csv` — **NEW FILE** (static, not generated)
- `apps/web/app/[locale]/admin/import/page.tsx` — add a link/button in the idle phase
- `apps/web/messages/en.json` — add `downloadTemplate` key under `adminImport`
- `apps/web/messages/ar.json` — add `downloadTemplate` key under `adminImport`

**Existing API to extend:** None.

**Existing component to reuse:** The existing `page.tsx` idle phase UI. Add a `<a>` link below the drag-drop area.

**CSV template content:** Headers from `parser.py` `COLUMN_ALIASES` with 2 example rows:
```csv
title,description,city,governorate,latitude,longitude,property_type,price,address,district,bedrooms,beds,bathrooms,max_guests,amenities,image_urls,host_name,host_phone,host_email,status
شقة فاخرة بالتجمع,شقة بثلاث غرف نوم ومطبخ مجهز بالكامل,New Cairo,Cairo,30.0250,31.4913,APARTMENT,2500,شارع التسعين,التجمع الخامس,3,3,2,6,wifi,parking,air_conditioning,https://example.com/photo1.jpg,أحمد محمد,+201001234567,ahmed@example.com,PENDING_VERIFICATION
Villa in Maadi,فيلا بحديقة وحمام سباحة,Maadi,Cairo,29.9602,31.2569,VILLA,5000,النصر,المعادي,4,5,3,8,wifi,pool,garden,https://example.com/villa1.jpg,Sara Ahmed,+201112223344,sara@example.com,PENDING_VERIFICATION
```

**Estimated effort:** 15 minutes.

**Acceptance criteria:**
- [ ] `apps/web/public/import-template.csv` exists with all columns from `COLUMN_ALIASES`.
- [ ] File contains 2 example rows with realistic data.
- [ ] Import page shows a "Download Template" link in the idle phase.
- [ ] Clicking the link downloads the CSV file.
- [ ] Both `en.json` and `ar.json` have the `downloadTemplate` translation key.

---

### P0-B: Fix Import Confirm Data Flow (Was P0-3)

**What:** Fix the schema design flaw that causes description, coordinates, amenities, and photos to be lost between preview and confirm.

**Existing files to modify:**
- `src/app/importer/schemas.py` — make `ImportPreviewRow` inherit from `ImportRowData`
- `src/app/importer/services.py` — update `generate_preview()` to pass full `ImportRowData` into `ImportPreviewRow`
- `apps/web/lib/queries/import.ts` — update `ImportPreviewRow` interface to include all `ImportRowData` fields
- `apps/web/app/[locale]/admin/import/page.tsx` — update confirm mapping to pass through all fields
- `apps/web/app/[locale]/admin/import/page.test.tsx` — update mock data to include all fields
- `tests/test_import.py` — update preview tests to verify full field preservation

**Existing API to extend:** None. `POST /import/preview` and `POST /import/confirm` stay the same.

**Existing component to reuse:** The existing import page. No new component.

**Schema change detail:**

`schemas.py` before:
```python
class ImportPreviewRow(BaseModel):
    row_number: int
    title: str
    city: str
    governorate: str
    price: int
    property_type: str
    host_name: str | None
    host_phone: str | None
    host_email: str | None
    is_valid: bool
    is_duplicate: bool = False
    errors: list[ImportRowError] = Field(default_factory=list)
```

`schemas.py` after:
```python
class ImportPreviewRow(ImportRowData):
    is_valid: bool
    is_duplicate: bool = False
    errors: list[ImportRowError] = Field(default_factory=list)
```

`services.py` `generate_preview()` before:
```python
preview_rows.append(
    ImportPreviewRow(
        row_number=row.row_number,
        title=row.title,
        city=row.city,
        governorate=row.governorate,
        price=row.price,
        property_type=row.property_type,
        host_name=row.host_name,
        host_phone=row.host_phone,
        host_email=row.host_email,
        is_valid=is_valid,
        is_duplicate=is_duplicate,
        errors=errors,
    )
)
```

`services.py` `generate_preview()` after:
```python
preview_rows.append(
    ImportPreviewRow(
        **row.model_dump(),
        is_valid=is_valid,
        is_duplicate=is_duplicate,
        errors=errors,
    )
)
```

`page.tsx` confirm mapping before:
```typescript
const validRows: ImportRowData[] = preview.rows
  .filter((r) => r.is_valid)
  .map((r) => ({
    row_number: r.row_number,
    title: r.title,
    description: "",
    city: r.city,
    governorate: r.governorate,
    latitude: 0,
    longitude: 0,
    property_type: r.property_type,
    price: r.price,
    host_name: r.host_name,
    host_phone: r.host_phone,
    host_email: r.host_email,
  }));
```

`page.tsx` confirm mapping after:
```typescript
const validRows: ImportRowData[] = preview.rows
  .filter((r) => r.is_valid)
  .map((r) => ({
    row_number: r.row_number,
    title: r.title,
    description: r.description,
    address: r.address,
    district: r.district,
    city: r.city,
    governorate: r.governorate,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    property_type: r.property_type,
    bedrooms: r.bedrooms,
    beds: r.beds,
    bathrooms: r.bathrooms,
    max_guests: r.max_guests,
    price: r.price,
    currency: r.currency,
    amenities: r.amenities,
    image_urls: r.image_urls,
    host_name: r.host_name,
    host_phone: r.host_phone,
    host_email: r.host_email,
    status: r.status,
  }));
```

**Estimated effort:** 1 hour.

**Acceptance criteria:**
- [ ] `ImportPreviewRow` inherits from `ImportRowData` in `schemas.py`.
- [ ] `generate_preview()` passes all `ImportRowData` fields into `ImportPreviewRow`.
- [ ] Frontend `ImportPreviewRow` interface includes all `ImportRowData` fields.
- [ ] Frontend confirm mapping passes through all fields from preview response.
- [ ] Imported listings have correct description, coordinates, amenities, and image URLs.
- [ ] No listing is imported with `0,0` coordinates or empty description.
- [ ] Existing tests pass. New test verifies field preservation through preview → confirm.
- [ ] `page.test.tsx` mock data updated to include all fields.

---

### P0-C: Owner Outreach WhatsApp Template (Was P0-4)

**What:** Add an `owner.outreach` event to the existing notification template registry.

**Existing files to modify:**
- `src/app/notifications/templates.py` — add `owner.outreach` entry to `_DEFAULT_TEMPLATES`
- `src/app/notifications/constants.py` — add `OWNER_OUTREACH = "owner.outreach"` to `NotificationEvent`

**Existing API to extend:** None. The `render_template()` function already handles any event in `_DEFAULT_TEMPLATES`.

**Existing component to reuse:** The entire notification system. No new provider, no new dispatcher, no new queue.

**Template content:**
```python
"owner.outreach": {
    "ar": {
        "whatsapp": {
            "body": "مرحبًا، وجدنا عقارك وأضفناه إلى StayOS مجانًا. لن يتم نشره حتى توافق. للمراجعة والتواصل: {{link}}",
        },
        "sms": {
            "body": "تمت إضافة عقارك إلى StayOS. للمراجعة: {{link}}",
        },
    },
    "en": {
        "whatsapp": {
            "body": "Hello, we found your property and added it to StayOS for free. Nothing will be published until you approve. Review and contact us: {{link}}",
        },
        "sms": {
            "body": "Your property was added to StayOS. Review: {{link}}",
        },
    },
},
```

**Estimated effort:** 10 minutes.

**Acceptance criteria:**
- [ ] `owner.outreach` exists in `_DEFAULT_TEMPLATES` with Arabic and English templates.
- [ ] `OWNER_OUTREACH` constant exists in `NotificationEvent`.
- [ ] `render_template("owner.outreach", "whatsapp", "ar", {"link": "https://stayos.com"})` returns the Arabic WhatsApp message.
- [ ] `render_template("owner.outreach", "whatsapp", "en", {"link": "https://stayos.com"})` returns the English WhatsApp message.

---

### P0-D: Default Import Status to PENDING_VERIFICATION (Was P0-5)

**What:** Change the default `status` field in `ImportRowData` from `"LISTED"` to `"PENDING_VERIFICATION"` so imported listings go through the admin review queue.

**Existing files to modify:**
- `src/app/importer/schemas.py` — change `status: str = "LISTED"` to `status: str = "PENDING_VERIFICATION"` on `ImportRowData`
- `src/app/importer/parser.py` — change default in `_row_to_import_data()` from `"LISTED"` to `"PENDING_VERIFICATION"`
- `tests/test_import.py` — update `_make_valid_row()` default status and any tests that assert `LISTED`

**Existing API to extend:** None.

**Existing component to reuse:** The existing admin pending queue at `GET /listings/admin/pending` and `POST /listings/admin/{unit_id}/approve`. These already handle `PENDING_VERIFICATION` status.

**Existing workflow that is NOT changed:**
- `UnitStatus.PENDING_VERIFICATION` already exists in `constants.py`.
- `VALID_STATUSES` in `validation.py` already includes `PENDING_VERIFICATION`.
- `get_pending_listings()` in `services.py` already filters for `PENDING_VERIFICATION`.
- `approve_listing()` in `services.py` already transitions `PENDING_VERIFICATION → LISTED`.
- Admin pending page (`/admin/pending`) already displays and allows approval of `PENDING_VERIFICATION` listings.

**Estimated effort:** 10 minutes.

**Acceptance criteria:**
- [ ] `ImportRowData.status` defaults to `"PENDING_VERIFICATION"`.
- [ ] Parser defaults `status` to `"PENDING_VERIFICATION"` when column is absent.
- [ ] Imported listings appear in the admin pending queue.
- [ ] Admin can approve imported listings to change status to `LISTED`.
- [ ] Existing tests updated and passing.
- [ ] CSV template (P0-A) uses `PENDING_VERIFICATION` as the example status value.

---

## 7. Architecture Verification

The following capabilities are confirmed as already supported by the existing architecture:

| Capability | Status | Evidence |
|-----------|--------|----------|
| Founder-driven onboarding | Already works | Founder collects data → formats CSV → imports via admin |
| Manual WhatsApp outreach | Already works | Founder uses personal WhatsApp. `owner.outreach` template (P0-C) provides the message. |
| CSV import | Already works | `POST /import/preview` + `POST /import/confirm` with parser, validation, duplicate detection |
| Bulk import | Already works | Same endpoint. No row limit. 10MB file limit. |
| Photo upload | Already works | `POST /listings/{unit_id}/photos/presign` + `POST /listings/{unit_id}/photos` |
| Photo import via URL | Already works | `ImportRowData.image_urls` → `UnitPhoto` records created in `_create_unit_and_listing()` |
| Listing approval | Already works | `GET /listings/admin/pending` + `POST /listings/admin/{id}/approve` + `POST /listings/admin/{id}/reject` |
| Host KYC | Already works | `POST /kyc/initiate` → `POST /kyc/documents/{id}/submit` → `GET /kyc/pending` → `POST /kyc/documents/{id}/approve` |
| Listing publication | Already works | `POST /listings/{unit_id}/publish` or admin approve transitions to `LISTED` |
| Notifications (WhatsApp/SMS/Email) | Already works | `providers.py` with Meta WhatsApp, Twilio SMS, AWS SES. `templates.py` with event-based templates. |
| Admin import page (frontend) | Already works | `apps/web/app/[locale]/admin/import/page.tsx` — drag-drop, preview, confirm |
| Admin pending page (frontend) | Already works | `apps/web/app/[locale]/admin/pending/page.tsx` — approve/reject with detail modal |
| Admin KYC page (frontend) | Already works | `apps/web/app/[locale]/admin/kyc/page.tsx` |
| Seed script | Already works | `scripts/seed_staging.py` — 3 listings, 1 reservation, idempotent |

**Conclusion:** The architecture fully supports the supply execution workflow. The 4 P0 tasks are bug fixes and configuration, not new features.

---

## 8. Task Summary

| # | Task | Files Modified | Effort | Type |
|---|------|----------------|--------|------|
| P0-A | CSV Template + Download Link | 4 files (1 new, 3 modified) | 15 min | Static file + UI link |
| P0-B | Fix Import Confirm Data Flow | 6 files modified | 1 hour | Bug fix (schema inheritance) |
| P0-C | Owner Outreach Template | 2 files modified | 10 min | Dict entry + constant |
| P0-D | Default Status PENDING_VERIFICATION | 3 files modified | 10 min | Default value change |
| **Total** | | **15 files** | **~1.5 hours** | |

---

## FINAL DECISION

### A) READY TO IMPLEMENT P0

All 5 original tasks have been reviewed, challenged, and reduced to 4 tasks. One task was eliminated by merge. No task can be eliminated further. All tasks are bug fixes or configuration changes — no new features, no new modules, no new APIs, no new pages. The existing architecture fully supports the supply execution workflow.

**The next conversation is implementation.**
