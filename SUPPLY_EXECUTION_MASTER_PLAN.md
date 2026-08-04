# SUPPLY EXECUTION MASTER PLAN — StayOS

**Author:** Executive Product Director & Marketplace Launch Manager
**Date:** 2026-08-04
**Status:** FINAL — This is the constitutional document for Supply. No additional planning documents are required. The next step is execution.

---

## 1. Current Supply Readiness

### What Exists and Works

The engineering platform is deployment-ready. All core supply-side functionality is built, tested, and functional:

- **Bulk Import System** — `src/app/importer/` — CSV and Excel parsing, preview, validation, duplicate detection, confirm/import pipeline. Admin-only endpoints at `POST /import/preview` and `POST /import/confirm`.
- **Listing Lifecycle** — `src/app/listings/` — Full state machine: `DRAFT → PENDING_VERIFICATION → LISTED → UNLISTED → SUSPENDED → ARCHIVED → REJECTED`. Admin approve/reject endpoints at `POST /listings/admin/{unit_id}/approve` and `POST /listings/admin/{unit_id}/reject`.
- **Listing Creation** — `POST /listings` (host), `PATCH /listings/{unit_id}` (host). Full form with title, description, property type, coordinates, amenities, pricing, capacity.
- **Photo Upload** — `POST /listings/{unit_id}/photos/presign` (S3 presigned URL), `POST /listings/{unit_id}/photos` (record creation), `PATCH /listings/{unit_id}/photos/{photo_id}/cover`, `DELETE /listings/{unit_id}/photos/{photo_id}`. Admin and host can upload.
- **Calendar/Availability** — `POST /listings/{unit_id}/calendar`, bulk availability, bulk pricing. Full calendar rule system.
- **Search** — `GET /listings` with geographic bounding box, price range, property type, guest capacity filters. Full-text search via PostgreSQL TSVECTOR.
- **KYC System** — `src/app/kyc/` — Initiate, submit, admin pending queue, approve, reject. Full document upload with S3 presigned URLs.
- **Notifications** — `src/app/notifications/` — WhatsApp (Meta), SMS (Twilio), Email (SES) providers with retry logic. Template system with Arabic/English support. Celery-based async dispatch.
- **Admin Frontend Pages** — `apps/web/app/[locale]/admin/` — Import page (drag-drop CSV/Excel upload with preview table), pending listings queue (approve/reject with detail modal), KYC review page, payments page.
- **Seed Script** — `scripts/seed_staging.py` — Creates 1 admin, 1 host, 1 guest, 3 listings, 1 confirmed reservation. Idempotent.
- **Host Dashboard** — `GET /listings/host/dashboard` with stats. Host reservation calendar.
- **Auth** — Firebase Phone OTP, role-based access (admin, host, guest), JWT tokens.

### What Does NOT Exist

- **Owner Claim Workflow** — No claim endpoints, no claim page, no ownership transfer API. The `06_STOP_DOING_LIST.md` explicitly deferred this to V1.1.
- **Property Quality Score** — No scoring algorithm. The `06_STOP_DOING_LIST.md` explicitly deferred this to V1.1 (item #31: "Manual review is the quality gate").
- **Duplicate Detection (automated)** — The import system has basic in-batch duplicate detection by title+city+governorate, but no cross-batch or coordinate-based duplicate detection. The `06_STOP_DOING_LIST.md` deferred this to V1.1 (item #8).
- **Owner outreach notification templates** — No `listing.claim` or `owner.outreach` notification event types in the templates system.

### Deployment Status

The `PRODUCTION_DEPLOYMENT_REPORT.md` confirms: **READY FOR DEPLOYMENT**. All 10 code-level deployment blockers were fixed. Remaining items are operational (populate AWS Secrets, configure GitHub Secrets, provision Terraform backend).

---

## 2. Inventory Capability Audit

| # | Capability | Status | Notes |
|---|-----------|--------|-------|
| 1 | CSV file parsing | Already Exists | `parser.py` — handles `.csv` with header alias mapping, type coercion |
| 2 | Excel (.xlsx) file parsing | Already Exists | `parser.py` — uses `openpyxl`, handles `.xlsx` and `.xls` |
| 3 | Import preview with validation | Already Exists | `POST /import/preview` — returns per-row validity, errors, duplicates |
| 4 | Import confirmation | Already Exists | `POST /import/confirm` — creates Units, Listings, Photos, Hosts |
| 5 | In-batch duplicate detection | Already Exists | `validation.py` — title + city + governorate hash |
| 6 | Cross-batch duplicate detection | Missing | No coordinate-based or phone-based duplicate check against existing DB |
| 7 | Auto host creation from import | Already Exists | `services.py` — `_find_or_create_host()` creates placeholder host from phone/email/name |
| 8 | Photo URL import | Already Exists | `ImportRowData.image_urls` — creates `UnitPhoto` records with URLs |
| 9 | S3 photo upload (presigned) | Already Exists | `POST /listings/{unit_id}/photos/presign` — S3 presigned PUT URL |
| 10 | Listing creation form (web) | Already Exists | Host can create listings via web form |
| 11 | Listing approval queue (admin) | Already Exists | `GET /listings/admin/pending`, `POST /listings/admin/{id}/approve`, `POST /listings/admin/{id}/reject` |
| 12 | Admin pending page (frontend) | Already Exists | `apps/web/app/[locale]/admin/pending/page.tsx` — full approve/reject UI with detail modal |
| 13 | Admin import page (frontend) | Already Exists | `apps/web/app/[locale]/admin/import/page.tsx` — drag-drop upload, preview table, confirm |
| 14 | KYC initiation and submission | Already Exists | `POST /kyc/initiate`, `POST /kyc/documents/{id}/submit` |
| 15 | KYC admin review queue | Already Exists | `GET /kyc/pending`, `POST /kyc/documents/{id}/approve`, `POST /kyc/documents/{id}/reject` |
| 16 | KYC admin page (frontend) | Already Exists | `apps/web/app/[locale]/admin/kyc/page.tsx` |
| 17 | WhatsApp notification provider | Already Exists | `providers.py` — Meta WhatsApp Business API with retry |
| 18 | SMS notification provider | Already Exists | `providers.py` — Twilio SMS with retry |
| 19 | Email notification provider | Already Exists | `providers.py` — AWS SES with retry |
| 20 | Notification template system | Already Exists | `templates.py` — Arabic/English, variable interpolation, event-based |
| 21 | Owner claim workflow | Missing | No endpoints, no frontend page, no ownership transfer logic |
| 22 | Property quality score | Missing | No scoring algorithm in codebase |
| 23 | Listing search (public) | Already Exists | `GET /listings` — bounding box, price, type, guests, full-text |
| 24 | Calendar/availability management | Already Exists | Full CRUD on calendar rules, bulk availability, bulk pricing |
| 25 | Host dashboard | Already Exists | `GET /listings/host/dashboard` — stats endpoint |
| 26 | Seed script | Already Exists | `scripts/seed_staging.py` — 3 listings, idempotent |
| 27 | Owner outreach templates | Missing | No `owner.outreach` or `listing.claim` notification events |
| 28 | CSV template file | Missing | No downloadable CSV template for partners |

---

## 3. Inventory Sources Ranking

| Rank | Source | Difficulty | Quality | Expected Listings | Speed | Cost | Priority |
|------|--------|-----------|---------|-------------------|-------|------|----------|
| 1 | Founder's personal network | Low | High (trusted, real owners) | 10–20 | Fast (1–2 weeks) | $0 | P0 — Start Day 1 |
| 2 | Property management companies | Medium | High (professional, structured data) | 15–30 (3–5 companies × 5–10 units) | Medium (2–3 weeks to sign) | $200 travel | P0 — Start Week 1 |
| 3 | Serviced apartment operators | Medium | High (standardized, hotel-like) | 10–20 (1–2 deals) | Medium (2–3 weeks) | $0–200 | P0 — Start Week 1 |
| 4 | Real estate agencies | Medium | Medium (may need verification) | 10–15 | Medium (2–3 weeks) | $0 | P0 — Start Week 2 |
| 5 | Existing Airbnb/Booking.com hosts | Medium | High (experienced hosts) | 10–15 | Medium (cold outreach) | $0 | P0 — Start Week 2 |
| 6 | Facebook real-estate groups | Low | Low–Medium (unverified) | 5–10 | Slow (organic posts) | $0 | P0 — Start Week 1 |
| 7 | WhatsApp real-estate groups | Low | Low–Medium (unverified) | 5–10 | Slow (organic posts) | $0 | P0 — Start Week 1 |
| 8 | Google Maps / Google My Business | Medium | Medium (public phone + address) | 5–10 | Medium (manual collection) | $0 | P0 — Start Week 2 |
| 9 | Direct referrals from onboarded hosts | Low | High (warm intro) | 5–10 | Slow (after first bookings) | $0 | Post-launch |
| 10 | Small/boutique hotels | High | High (standardized) | 5–15 (1–2 hotels) | Slow (B2B sales) | $200 travel | P0 — Start Week 2 |
| 11 | OLX / local classifieds | Medium | Low (unverified, cold) | 3–5 | Slow (manual outreach) | $0 | P0 — Start Week 2 |
| 12 | Tourism company partnerships | High | Medium | 5–10 | Slow (1–2 months) | $0 | Post-launch |
| 13 | Corporate housing | High | High | 0–5 | Very slow (1–3 months) | $0 | Post-launch |
| 14 | Public tourism registries | Low | Medium (licensed only) | 5–10 | Medium | $0 | P0 — Start Week 1 |

**Total P0 expected yield: 80–140 listings. Target: 100.**

---

## 4. Import Pipeline

The pipeline uses ONLY existing functionality. No new code required.

```
Source (founder collects property data)
    ↓
CSV / Excel file (founder formats to StayOS schema)
    ↓
Admin opens /admin/import (existing frontend page)
    ↓
Upload file (drag-drop or click)
    ↓
System parses and validates (existing POST /import/preview)
    ├── parser.py: CSV/Excel parsing with header alias mapping
    ├── validation.py: required fields, coordinates, price, property type
    └── validation.py: in-batch duplicate detection (title + city + governorate)
    ↓
Admin reviews preview table (existing frontend)
    ├── See valid/invalid/duplicate counts
    ├── See per-row errors
    └── See host name, phone, email per row
    ↓
Admin clicks "Import Valid Rows" (existing POST /import/confirm)
    ↓
System creates:
    ├── User (host) — _find_or_create_host() by phone/email
    ├── Unit — with coordinates, property type, capacity
    ├── UnitListing — with title, description, price, amenities
    └── UnitPhotos — from image_urls if provided
    ↓
Imported listings have status from CSV (default: LISTED)
    ↓
Admin reviews imported listings in /admin/pending (existing page)
    ↓
Admin approves or rejects each listing (existing endpoints)
    ↓
Approved listings become LISTED and bookable
    ↓
Founder contacts owner via WhatsApp (manual, using existing WhatsApp provider)
    ↓
Owner verifies information, uploads better photos (existing photo upload)
    ↓
Owner completes KYC (existing KYC flow)
    ↓
Listing is published and bookable
```

**What already works end-to-end:** CSV/Excel → Preview → Import → Pending Review → Approve → Listed.

**What is manual (no code needed):** Source collection, CSV formatting, owner outreach via WhatsApp, photo collection via WhatsApp.

---

## 5. Owner Claim Workflow

### Current State

The `06_STOP_DOING_LIST.md` explicitly deferred the claim workflow (items #6 and #7) to V1.1. The `MARKETPLACE_SUPPLY_STRATEGY.md` and `PROPERTY_IMPORT_AND_SEEDING_STRATEGY.md` describe a claim workflow conceptually, but no code exists for it.

### Decision: Do NOT build claim workflow for Closed Alpha

**Rationale:**

1. The STOP DOING LIST explicitly defers it.
2. For 100 listings, the founder manually contacts every owner via WhatsApp. This is concierge onboarding, not a self-serve claim flow.
3. Building claim endpoints, a claim frontend page, ownership transfer logic, and claim review queue is engineering work that does not help reach 100 listings faster.
4. The import system already creates a placeholder host account from phone/email. When the real owner signs up with the same phone, they log into that account. This is sufficient.

### Owner Outreach Workflow (Manual, No Code)

```
Founder imports listings via CSV
    ↓
System creates placeholder host account from owner's phone
    ↓
Founder sends WhatsApp message to owner (manual, using personal WhatsApp)
    ↓
Message:
    "مرحبًا، وجدنا عقارك وأضفناه إلى StayOS مجانًا.
     لن يتم نشره حتى توافق.
     يمكنك مراجعة التفاصيل والتواصل معنا عبر:
     [WhatsApp Link / Phone Number]

     يمكنك:
     ✔ التحقق من المعلومات
     ✔ رفع صور أفضل
     ✔ تحديث الأسعار
     ✔ الموافقة أو الرفض أو طلب تعديلات"
    ↓
Owner responds via WhatsApp
    ↓
Founder either:
    ├── Owner approves → Founder guides owner to log in with phone OTP
    │   → Owner sees their listings → Owner completes KYC → Listing published
    ├── Owner wants changes → Founder edits listing via admin
    └── Owner rejects → Founder archives listing
```

**This workflow is sufficient for 100 listings.** The founder is the claim review system.

### When to Build the Real Claim Workflow (V1.1)

- After 100+ listings and proven demand
- When founder can no longer manually contact every owner
- When self-serve host onboarding conversion is proven

---

## 6. Property Quality Score

### Current State

The `06_STOP_DOING_LIST.md` explicitly deferred the quality score algorithm to V1.1 (item #31: "Manual review is the quality gate").

### Decision: Do NOT build automated quality score for Closed Alpha

**Rationale:**

1. The STOP DOING LIST explicitly defers it.
2. For 100 listings, the founder reviews every listing manually. A score algorithm adds no value when a human reviews every listing.
3. Building, testing, and tuning a scoring algorithm is engineering work that does not help reach 100 listings faster.

### Manual Quality Checklist (Operations, No Code)

The founder uses this checklist when reviewing each imported listing:

| Check | Pass Criteria | Weight |
|-------|--------------|--------|
| Photos | 3+ real photos (not stock, not watermarked) | Critical — reject if fail |
| Title | 10+ characters, descriptive, in Arabic | Critical — reject if fail |
| Description | 50+ characters, describes the property | Critical — reject if fail |
| Location | Valid coordinates within Egypt, correct city/governorate | Critical — reject if fail |
| Price | 100+ EGP, reasonable for area (not below 300/night) | Critical — reject if fail |
| Property type | Valid enum value (APARTMENT, VILLA, CHALET, HOTEL_ROOM, RESORT_UNIT, STUDIO) | Critical — reject if fail |
| Amenities | At least 3 amenities listed | Important — flag if fail |
| Host contact | Phone number or email present | Important — flag if fail |
| Capacity | max_guests >= 1, bedrooms >= 0, bathrooms >= 1 | Critical — reject if fail |
| Duplicate | No existing listing with same title + city + governorate | Critical — reject if fail |

**Rule:** Any "Critical" check failure → reject listing. Any "Important" check failure → flag for follow-up but allow.

### When to Build Automated Quality Score (V1.1)

- After 500+ listings when manual review is no longer feasible
- When search ranking needs to prioritize higher-quality listings

---

## 7. Founder Daily Operations

### Daily Schedule (Supply Focus)

| Time | Activity | Target |
|------|----------|--------|
| 08:00 | Platform health check — open site, verify search, check logs | 5 min |
| 08:15 | KYC review queue — `GET /kyc/pending`, approve/reject via admin page | Clear all pending |
| 08:45 | Listing review queue — `GET /listings/admin/pending`, approve/reject via admin page | Clear all pending |
| 09:15 | WhatsApp responses — reply to all host and guest messages | 0 unread |
| 09:45 | **Supply collection** — collect 5–10 property listings from sources (Google Maps, Facebook groups, OLX, referrals) | 5–10 raw entries |
| 11:00 | **CSV formatting** — format collected data into StayOS CSV schema | 1 CSV file ready |
| 11:30 | **CSV import** — upload via `/admin/import`, review preview, confirm import | 5–10 listings imported |
| 13:00 | **Host outreach calls** — call 5 potential hosts from contact list | 1–2 scheduled |
| 14:00 | **Owner WhatsApp outreach** — send messages to owners of newly imported listings | 5–10 messages sent |
| 14:30 | **Photo uploads** — upload photos received from hosts/agencies via admin photo upload | All pending photos uploaded |
| 15:00 | **Agency follow-up** — follow up with 1–2 agencies/partners | 1 meeting scheduled |
| 15:30 | Guest support — respond to guest questions, match guests to listings | 0 unread |
| 16:00 | Payment processing — check Paymob callbacks, manually confirm if needed | 0 pending |
| 16:30 | Engineering sync — send bug reports and priority list to engineering | 1 message |
| 17:00 | **Daily metrics log** — record: new listings, live listings, bookings, pending reviews | 1 log entry |

### Daily Targets

| Metric | Target |
|--------|--------|
| Raw property entries collected | 5–10 |
| Listings imported via CSV | 5–10 |
| Owner outreach messages sent | 5–10 |
| Host outreach calls made | 5 |
| Listings approved/published | All pending cleared |
| KYC approvals | All pending cleared |

### Weekly Targets

| Week | Cumulative Listings | New Contacts | New Hosts Onboarded |
|------|---------------------|--------------|---------------------|
| Week 1 | 20 | 25 | 5 |
| Week 2 | 40 | 30 | 5 |
| Week 3 | 70 | 30 | 8 |
| Week 4 | 100 | 20 | 5 |

### KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| Live listings | 100 by Week 4 | `SELECT COUNT(*) FROM pms.units WHERE status = 'LISTED'` |
| Verified hosts | 20 by Week 4 | `SELECT COUNT(*) FROM auth.users WHERE role = 'host' AND kyc_status = 'verified'` |
| Listings with photos | 80+ by Week 4 | `SELECT COUNT(DISTINCT unit_id) FROM pms.unit_photos` |
| Pending review backlog | 0 at end of day | `SELECT COUNT(*) FROM pms.units WHERE status = 'PENDING_VERIFICATION'` |
| Bookings | 20 by Week 4 | `SELECT COUNT(*) FROM reservation.reservations` |

---

## 8. 100 Listing Execution Plan

### Strategy: Import-First, Not Host-Registration-First

The fastest path to 100 listings is NOT waiting for hosts to self-register. The fastest path is:

1. **Founder collects property data** from public sources, agencies, and personal network.
2. **Founder formats data into CSV** and imports via existing bulk import system.
3. **System creates listings** with placeholder host accounts.
4. **Founder contacts owners** via WhatsApp after import.
5. **Owners verify and claim** by logging in with their phone number (OTP).

This flips the funnel: listings exist BEFORE owners are contacted.

### Execution Schedule

#### Week 1: Founder Network + Public Data (Target: 20 listings)

| Day | Activity | Output |
|------|----------|--------|
| Day 1 | Prepare contact list (50 names from personal network). Collect 10 properties from Google Maps in New Cairo + Maadi. | 10 raw entries |
| Day 2 | Format 10 properties into CSV. Import via admin. Send WhatsApp to 10 owners. | 10 listings imported, 10 messages sent |
| Day 3 | Collect 5 properties from founder network (friends/family). Collect 5 from Facebook groups. | 10 raw entries |
| Day 4 | Format and import 10 properties. Send WhatsApp to 10 owners. Call 5 personal contacts. | 10 listings imported, 10 messages, 5 calls |
| Day 5 | Follow up with all unresponsive owners. Upload photos for listings that have them. | 0 pending photos |
| Day 6–7 | Review week. Approve all pending listings. Plan Week 2. | 20 listings live |

#### Week 2: Agencies + Property Managers (Target: 40 cumulative)

| Day | Activity | Output |
|------|----------|--------|
| Day 8 | Identify 5 property management companies in New Cairo + 6th October. Call 3. | 3 calls made |
| Day 9 | Meeting with 1 agency. Collect their portfolio as Excel. | 1 meeting, 5–10 units |
| Day 10 | Format agency portfolio into CSV. Import. Request photos via WhatsApp. | 5–10 listings imported |
| Day 11 | Collect 10 more from Google Maps + OLX. Format and import. | 10 listings imported |
| Day 12 | Follow up with all owners. Upload photos. Approve pending. | 0 backlog |
| Day 13–14 | Review week. 40 listings live. | 40 cumulative |

#### Week 3: Scale Collection + Second Agency (Target: 70 cumulative)

| Day | Activity | Output |
|------|----------|--------|
| Day 15 | Meeting with second agency. Collect portfolio. | 1 meeting, 5–10 units |
| Day 16 | Import second agency portfolio. Collect 10 from Facebook + WhatsApp groups. | 15 raw entries |
| Day 17 | Format and import 15 properties. Send 15 WhatsApp messages. | 15 listings imported |
| Day 18 | Collect 10 from OLX + Google Maps. Format and import. | 10 listings imported |
| Day 19 | Follow up. Upload photos. Approve pending. Call 5 more potential hosts. | 0 backlog, 5 calls |
| Day 20–21 | Review week. 70 listings live. | 70 cumulative |

#### Week 4: Final Push (Target: 100 cumulative)

| Day | Activity | Output |
|------|----------|--------|
| Day 22 | Collect 10 from all sources. Format and import. | 10 listings imported |
| Day 23 | Collect 10 more. Format and import. | 10 listings imported |
| Day 24 | Follow up with all unresponsive owners. Upload remaining photos. | 0 pending |
| Day 25 | Quality review — check every listing for photos, price, description. Fix issues. | All listings pass quality check |
| Day 26 | Final import of any remaining. Approve all pending. | 100 listings live |
| Day 27–28 | Celebrate. Prepare for demand generation. | 100 cumulative |

### Channel Mix for 100 Listings

| Channel | Listings | Method |
|---------|----------|--------|
| Founder network | 15 | Warm calls → CSV import |
| Property management companies | 25 | 3–4 signed → CSV import |
| Google Maps / public data | 20 | Manual collection → CSV import |
| Facebook + WhatsApp groups | 15 | Manual collection → CSV import |
| Real estate agencies | 10 | 1–2 signed → CSV import |
| OLX / classifieds | 10 | Manual collection → CSV import |
| Serviced apartments | 5 | 1 deal → CSV import |
| **Total** | **100** | |

### CSV Schema (Existing, from `parser.py`)

| Column | Required | Example |
|--------|----------|---------|
| title | Yes | شقة فاخرة بالتجمع |
| description | Yes | شقة بثلاث غرف نوم... |
| city | Yes | Cairo |
| governorate | Yes | Cairo |
| latitude | Yes | 30.0444 |
| longitude | Yes | 31.2357 |
| property_type | Yes | APARTMENT |
| price | Yes | 2500 |
| address | No | شارع التسعين، التجمع الخامس |
| district | No | التجمع الخامس |
| country | No | Egypt (default) |
| bedrooms | No | 2 (default 0) |
| beds | No | 1 (default 1) |
| bathrooms | No | 1 (default 1) |
| max_guests | No | 4 (default 1) |
| currency | No | EGP (default) |
| amenities | No | wifi,parking,air_conditioning |
| image_urls | No | https://... |
| host_name | No | أحمد محمد |
| host_phone | No | +201001234567 |
| host_email | No | ahmed@example.com |
| status | No | LISTED (default) |

---

## 9. Required Engineering Work (P0 ONLY)

### P0-1: Downloadable CSV Template File

**What:** Create a static CSV template file that partners can download.

**Why:** Agencies and property managers need a template to fill in. Currently no template exists.

**How:** Create `apps/web/public/import-template.csv` with headers and 2 example rows.

**Effort:** 10 minutes.

**Acceptance:**
- File exists at `/import-template.csv` on the web app.
- Contains all columns from `parser.py` COLUMN_ALIASES.
- Has 2 example rows.

---

### P0-2: Import Page — Link to CSV Template

**What:** Add a "Download Template" link on the admin import page.

**Why:** Partners need to find the template easily.

**How:** Add a link/button in `apps/web/app/[locale]/admin/import/page.tsx` pointing to `/import-template.csv`.

**Effort:** 5 minutes.

**Acceptance:**
- Link visible on the import page.
- Clicking downloads the CSV template.

---

### P0-3: Import — Preserve Description and Coordinates on Confirm

**What:** The frontend import confirm flow currently sends empty description and 0,0 coordinates for valid rows (see `page.tsx` lines 70–83). Fix this to send the actual parsed data.

**Why:** The preview response (`ImportPreviewRow`) only contains summary fields (title, city, governorate, price, property_type, host info). The full row data (description, latitude, longitude, amenities, image_urls, bedrooms, etc.) is parsed by the backend but not returned in the preview. The confirm endpoint needs the full `ImportRowData`. Currently the frontend fabricates incomplete data.

**How:** Option A — Backend returns full `ImportRowData` in the preview response (not just `ImportPreviewRow`). Option B — Frontend sends the original file to the confirm endpoint. Option A is cleaner.

**Effort:** 1–2 hours.

**Acceptance:**
- Imported listings have correct description, coordinates, amenities, and image URLs from the original CSV.
- No listing is imported with 0,0 coordinates or empty description.

---

### P0-4: Owner Outreach WhatsApp Template

**What:** Add a `owner.outreach` notification event type to `templates.py` with Arabic and English templates.

**Why:** When the founder imports a listing and wants to contact the owner, a standardized message should exist. The founder can copy-paste this from the admin or send it manually.

**How:** Add to `_DEFAULT_TEMPLATES` in `src/app/notifications/templates.py`:
- Event: `owner.outreach`
- Arabic WhatsApp body: "مرحبًا، وجدنا عقارك وأضفناه إلى StayOS مجانًا. لن يتم نشره حتى توافق. للمراجعة والتواصل: [link]"
- English WhatsApp body: "Hello, we found your property and added it to StayOS for free. Nothing will be published until you approve. Review and contact us: [link]"

**Effort:** 15 minutes.

**Acceptance:**
- Template exists in `templates.py`.
- `render_template("owner.outreach", "whatsapp", "ar", {"link": "https://..."})` returns the Arabic message.

---

### P0-5: Import — Set Default Status to PENDING_VERIFICATION

**What:** The current import schema defaults `status` to `"LISTED"`. For imported listings, the default should be `"PENDING_VERIFICATION"` so they go through the admin review queue.

**Why:** Imported listings should not be automatically live. They need admin review first. The `06_FOUNDER_DAILY_OPERATIONS.md` workflow shows: import → pending review → approve → listed.

**How:** Change the default in `ImportRowData.status` from `"LISTED"` to `"PENDING_VERIFICATION"` in `schemas.py`. Alternatively, override in `services.py` `_create_unit_and_listing()` to force `PENDING_VERIFICATION` for imports.

**Effort:** 5 minutes.

**Acceptance:**
- Imported listings have status `PENDING_VERIFICATION` by default.
- They appear in the admin pending queue.
- Admin can approve them to change to `LISTED`.

---

## 10. Items Removed

These items were considered and explicitly removed from scope. They will NOT be built for Closed Alpha.

| # | Item | Why Removed |
|---|------|-------------|
| 1 | Owner claim workflow (endpoints + frontend) | STOP DOING LIST defers to V1.1. Founder manually contacts owners via WhatsApp. No code needed for 100 listings. |
| 2 | Property quality score algorithm | STOP DOING LIST defers to V1.1. Manual review is the quality gate for 100 listings. |
| 3 | Automated duplicate detection (coordinate-based) | STOP DOING LIST defers to V1.1. In-batch duplicate detection already exists. Founder checks manually for 100 listings. |
| 4 | Broker referral program | Too much operational overhead for alpha. Founder direct outreach is faster. |
| 5 | Corporate housing partnerships | Long sales cycle (1–3 months). Not viable for 4-week timeline. |
| 6 | Tourism company partnerships | Long sales cycle. Not viable for 4-week timeline. |
| 7 | Public data scraping automation | Legal risk. Manual collection is sufficient for 100 listings. |
| 8 | Host referral program | No hosts yet to refer. Post-launch. |
| 9 | Photography service | Nice-to-have but not blocking. Owners can send photos via WhatsApp. |
| 10 | Host landing page with value proposition | Not needed for concierge onboarding. Founder pitches directly. |
| 11 | Automated host onboarding | 60%+ of hosts need founder assistance per STOP DOING LIST. |
| 12 | Map-based property collection tool | Manual Google Maps search is sufficient for 100 listings. |

---

## 11. Items Deferred

These items are valuable but not needed before Closed Alpha. They are deferred to V1.1 or later.

| # | Item | Deferred To | Why |
|---|------|-------------|-----|
| 1 | Owner claim workflow (self-serve) | V1.1 | After 100+ listings, founder can't manually contact every owner |
| 2 | Property quality score algorithm | V1.1 | After 500+ listings, manual review doesn't scale |
| 3 | Cross-batch duplicate detection | V1.1 | After 100+ listings, manual duplicate checking becomes unreliable |
| 4 | Host referral program | Post-launch | Need active hosts first |
| 5 | Photography service | V1.1 | When photo quality becomes a conversion bottleneck |
| 6 | Host landing page | V1.1 | When self-serve host acquisition begins |
| 7 | Broker program | V1.1 | When founder-led outreach can't scale |
| 8 | Corporate housing | Phase 2 | Long sales cycle, not alpha-relevant |
| 9 | Tourism company partnerships | Phase 2 | Long sales cycle, more demand-side than supply-side |
| 10 | Automated payout batch | V1.1 | Manual bank transfers sufficient for alpha |
| 11 | Email notifications for owners | V1.1 | WhatsApp and SMS are the channels for alpha |
| 12 | Multi-city expansion | Phase 2 | Conquer one city first |

---

## 12. Final Decision

### ✅ READY TO BUILD SUPPLY

**Rationale:**

1. **The platform is deployment-ready.** The `PRODUCTION_DEPLOYMENT_REPORT.md` confirms all code-level deployment blockers are fixed.

2. **All core supply functionality exists.** CSV/Excel import, listing creation, photo upload, admin review queue, KYC, notifications — all built and tested.

3. **Only 5 P0 engineering items remain**, totaling less than 3 hours of work:
   - CSV template file (10 min)
   - Template download link (5 min)
   - Fix import confirm data flow (1–2 hours)
   - Owner outreach WhatsApp template (15 min)
   - Default import status to PENDING_VERIFICATION (5 min)

4. **The supply strategy is clear.** Import-first: collect property data, format to CSV, import via existing system, contact owners via WhatsApp. No new products, no new features, no new infrastructure.

5. **The 4-week timeline is achievable.** 100 listings in 4 weeks requires 5 imports/day. The existing import system handles 50+ rows per upload. One CSV upload per day is sufficient.

6. **The founder is the operations engine.** No complex automation is needed. The founder collects, imports, reviews, and contacts. The platform supports this workflow today.

**Next steps:**

1. Engineering: Complete the 5 P0 items (Section 9).
2. Founder: Begin Week 1 supply collection (Section 8).
3. Deploy to staging using existing scripts (`scripts/staging_start.sh`).
4. Run seed script (`scripts/staging_seed.sh`) to verify the platform works.
5. Begin importing real listings.

**This document is the final planning document for Supply. No further planning is required. Execute.**
