# SUPPLY PIPELINE AUDIT

## Purpose

Verify that StayOS can realistically reach **50 Imported Listings → 10 Verified Hosts → First Booking → First Revenue** using the current software.

This audit traces every operational step from real-world property to confirmed booking. Each step is evaluated against the actual codebase.

---

## LIFECYCLE: STEP-BY-STEP

### Step 1 — Property Source

**Question:** Where do properties come from?

**Answer:** There is no software system for sourcing properties. No scraping tool, no lead capture form, no CRM integration, no inbound property API. The system assumes properties already exist as data ready for CSV.

**Implemented?** No.
**Operational?** No.
**Manual?** Yes — entirely.
**Who performs it?** Founder.
**Can it stay manual for Closed Alpha?** YES. The founder identifies properties through personal knowledge, online research, or owner referrals. This is standard for a marketplace in private beta.

---

### Step 2 — Collection Method

**Question:** How is raw property data collected?

**Answer:** No collection tool exists in the software. There is no web form, no mobile capture flow, no lead intake endpoint. The only input mechanism is the CSV/XLSX import pipeline, which assumes data is already collected and formatted.

**Implemented?** No.
**Operational?** No.
**Manual?** Yes.
**Who performs it?** Founder.
**Can it stay manual for Closed Alpha?** YES. The founder manually collects property details (title, description, location, price, photos, host contact) into a spreadsheet. 50 properties is a manageable manual effort.

---

### Step 3 — Data Cleaning

**Question:** Is there any data cleaning or normalization before CSV creation?

**Answer:** No software-level cleaning exists pre-import. The import parser (`parser.py`) performs header normalization (alias mapping) and type coercion at parse time, but there is no pre-processing step. Raw data must be cleaned manually before it reaches the CSV.

**Implemented?** Partially — parser normalizes headers and coerces types at import time.
**Operational?** Yes, at import time only.
**Manual?** Yes — pre-import cleaning is manual.
**Who performs it?** Founder.
**Can it stay manual for Closed Alpha?** YES. 50 rows can be cleaned by hand.

---

### Step 4 — Normalization

**Question:** Is property data normalized to a canonical format?

**Answer:** Yes. The parser (`parser.py`) maps column aliases to canonical names (`COLUMN_ALIASES`), coerces types (`_parse_int`, `_parse_float`, `_parse_list`), and produces `ImportRowData` objects with consistent fields. The validation layer (`validation.py`) enforces canonical values for `property_type` (6 types) and `status` (4 statuses).

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** No — automated at parse time.
**Who performs it?** System.

---

### Step 5 — CSV Creation

**Question:** Is there a template or tool for CSV creation?

**Answer:** Yes. A CSV template exists at `apps/web/public/import-template.csv` with 3 example rows (including Arabic content). It contains all accepted columns: title, description, city, governorate, latitude, longitude, property_type, price, address, district, bedrooms, beds, bathrooms, max_guests, amenities, image_urls, host_name, host_phone, host_email, status. The frontend import page links to this template for download.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** Yes — the founder fills the template.
**Who performs it?** Founder.
**Can it stay manual for Closed Alpha?** YES.

---

### Step 6 — Import (File Upload)

**Question:** Can an admin upload a CSV/XLSX file?

**Answer:** Yes. `POST /api/v1/import/preview` accepts a file upload (max 10MB), admin-only. The parser dispatches by extension (`.csv` → `parse_csv`, `.xlsx`/`.xls` → `parse_xlsx`). The frontend provides a drag-and-drop upload zone at `/admin/import` accepting `.csv`, `.xlsx`, `.xls`.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** The upload is manual; the parsing is automated.
**Who performs it?** Admin (uploads), System (parses).

---

### Step 7 — Preview

**Question:** Does the system show a preview with validation before committing?

**Answer:** Yes. `generate_preview()` in `services.py` parses all rows, runs `validate_row()` on each, runs `find_duplicates()` across the batch, and returns `ImportPreviewResponse` with per-row validity, duplicate flags, and error details. The frontend renders a table with color-coded badges (valid/duplicate/invalid) and inline error messages per field.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** No — automated.
**Who performs it?** System.

---

### Step 8 — Confirmation

**Question:** Can the admin confirm and execute the import?

**Answer:** Yes. `POST /api/v1/import/confirm` accepts `ImportConfirmRequest` with a list of `ImportRowData`. The frontend sends only `is_valid` rows. `execute_import()` re-validates each row, finds or creates a host user, checks for existing DB duplicates (title + city + governorate), creates `Unit` + `UnitListing` + `UnitPhoto` records, and commits. Per-row results (created/skipped/failed) are returned.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** The confirm click is manual; the creation is automated.
**Who performs it?** Admin (confirms), System (creates records).

---

### Step 9 — Pending Verification

**Question:** What status do imported listings get?

**Answer:** The default status in `ImportRowData` is `PENDING_VERIFICATION`. The `_create_unit_and_listing()` function respects the row's `status` field if it matches a valid `UnitStatus` value, defaulting to `LISTED` if not. The CSV template uses `PENDING_VERIFICATION`. This means imported listings enter the admin review queue.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** No — automated.
**Who performs it?** System.

---

### Step 10 — Admin Review

**Question:** Can an admin review, approve, or reject pending listings?

**Answer:** Yes. Three endpoints exist:
- `GET /api/v1/listings/admin/pending` — lists all `PENDING_VERIFICATION` units (admin-only)
- `POST /api/v1/listings/admin/{unit_id}/approve` — sets status to `LISTED` (admin-only)
- `POST /api/v1/listings/admin/{unit_id}/reject` — sets status to `REJECTED` (admin-only)

The `approve_listing()` function validates the current status is `PENDING_VERIFICATION` before transitioning to `LISTED`.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** Yes — the admin manually reviews and clicks approve/reject.
**Who performs it?** Admin.
**Can it stay manual for Closed Alpha?** YES. 50 listings is a manageable manual review.

---

### Step 11 — Published Listing

**Question:** Does approval make the listing searchable and bookable?

**Answer:** Yes. `approve_listing()` sets status to `LISTED`. The search endpoint (`GET /api/v1/listings`) filters by `UnitStatus.LISTED`. The reservation creation (`create_reservation()`) validates `unit.status == UnitStatus.LISTED`. Once approved, a listing is live.

Additionally, a host can publish/unpublish their own listings via `POST /{unit_id}/publish` and `POST /{unit_id}/unpublish`, but publish requires `KycStatus.VERIFIED`.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** The approval click is manual; the visibility is automated.
**Who performs it?** Admin (approves), System (makes searchable).

---

### Step 12 — Owner Outreach

**Question:** Does the system notify property owners that their property was listed?

**Answer:** Partially implemented but NOT wired. A notification template for `owner.outreach` exists in `templates.py` with Arabic and English variants for WhatsApp and SMS. The constant `NotificationEvent.OWNER_OUTREACH` is defined in `constants.py`. However:

- `channels_for_event()` in `services.py` does NOT include `owner.outreach` — no channel mapping exists.
- No code anywhere writes an `owner.outreach` outbox event.
- No endpoint or service function triggers owner outreach.
- The notification consumers (`consumers.py`) do not listen for `owner.outreach` events.

The template is a dead artifact. Owner outreach must be done entirely outside the system.

**Implemented?** No — template only, no wiring.
**Operational?** No.
**Manual?** Yes — entirely.
**Who performs it?** Founder.
**Can it stay manual for Closed Alpha?** YES. The founder can call or WhatsApp owners directly. 50 properties means ~50 conversations.

---

### Step 13 — Owner Response

**Question:** Is there a system for owners to respond to outreach?

**Answer:** No. There is no inbound communication channel, no owner response form, no claim-listing flow, no owner portal. Owner responses happen outside the system (phone, WhatsApp, email).

**Implemented?** No.
**Operational?** No.
**Manual?** Yes — entirely.
**Who performs it?** Founder.
**Can it stay manual for Closed Alpha?** YES.

---

### Step 14 — Host Registration (Optional)

**Question:** Can an owner register as a host in the system?

**Answer:** Yes, through two paths:

1. **Import path:** `_find_or_create_host()` in `importer/services.py` automatically creates a `User` with `role=HOST` and `kyc_status=VERIFIED` if no existing user matches by phone or email. This means imported properties get a host account automatically.

2. **Self-registration path:** A user authenticates via OTP or Firebase, then calls `PATCH /api/v1/auth/me/role` with `role=host`. This requires `KycStatus.VERIFIED` (enforced by `require_kyc_verified` dependency).

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** Import path is automated. Self-registration is manual by the owner.
**Who performs it?** System (import path), Owner (self-registration).

---

### Step 15 — Host Verification (KYC)

**Question:** Is there a KYC verification flow for hosts?

**Answer:** Yes. The KYC module provides:
- `POST /api/v1/kyc/initiate` — generates presigned S3 URLs for document uploads
- `POST /api/v1/kyc/documents/{document_id}/submit` — submits for processing
- `POST /api/v1/kyc/documents/{document_id}/process` — admin-triggered processing using AWS Textract (ID analysis) and Rekognition (face comparison)
- `POST /api/v1/kyc/documents/{document_id}/approve` and `/reject` — manual admin override

**Important note for imported hosts:** `_find_or_create_host()` creates hosts with `kyc_status=VERIFIED` automatically. This bypasses KYC entirely for imported properties. This is intentional for the supply pipeline — imported hosts are pre-trusted.

For self-registered hosts, KYC is required before they can publish listings (`publish_listing()` checks `user.kyc_status == KycStatus.VERIFIED`) and before they can upgrade their role (`require_kyc_verified` dependency on the role upgrade endpoint).

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** Automated for imported hosts. Manual admin review for self-registered hosts.
**Who performs it?** System (imported), Admin (self-registered).

---

### Step 16 — Listing Improvement

**Question:** Can a host update their listing after import?

**Answer:** Yes. `PATCH /api/v1/listings/{unit_id}` allows the host to update listing fields (title, description, price, amenities, etc.). Photo management is available via:
- `POST /{unit_id}/photos/presign` — get presigned S3 upload URL
- `POST /{unit_id}/photos` — create photo record
- `PATCH /{unit_id}/photos/{photo_id}/cover` — set cover photo
- `DELETE /{unit_id}/photos/{photo_id}` — delete photo

Calendar management is available via create/update/delete calendar rules and bulk availability/pricing updates.

**However:** The host must know their listing exists and must log in. For imported hosts who didn't self-register, they would need to authenticate via OTP using the phone number from the CSV. If the CSV had no phone number, the host has no way to access their account.

**Implemented?** Yes.
**Operational?** Yes — but requires host to be aware and authenticated.
**Manual?** The improvements are manual by the host.
**Who performs it?** Host.
**Can it stay manual for Closed Alpha?** YES. The founder can manually prompt hosts to improve their listings.

---

### Step 17 — Guest Search

**Question:** Can guests search for listings?

**Answer:** Yes. `GET /api/v1/listings` supports filtering by:
- Text query (title/description)
- Governorate, city
- Price range (min/max)
- Property type
- Guests, bedrooms, bathrooms
- Geo viewport (bounding box) or radius (lat/lng + radius_km)
- Date range (check_in/check_out) with availability check
- Cursor-based pagination

The search is public (rate-limited, no auth required). Results include title, description, price, location, amenities, cover image, and host KYC status.

**Implemented?** Yes.
**Operational?** Yes.
**Manual?** No — automated.
**Who performs it?** Guest.

---

### Step 18 — Booking (Reservation Creation)

**Question:** Can a guest book a listing?

**Answer:** Yes. `POST /api/v1/reservations` creates a reservation. The flow:
1. Guest must have `role=GUEST` and `kyc_status=VERIFIED`
2. Unit must be `LISTED`
3. Validates stay length (min/max nights from listing)
4. Validates guest capacity
5. Checks calendar availability (no BLOCKED/BOOKED/HOLD rules)
6. Computes pricing (subtotal, guest fee, platform fee, host amount)
7. Creates reservation with `PENDING_PAYMENT` status
8. Creates payment intent via Paymob or Stripe
9. Acquires calendar lock
10. Writes outbox events (`payment.created`, `booking.initiated`)
11. Returns reservation with Paymob iframe URL or Stripe client secret

Payment confirmation happens via:
- Paymob/Stripe webhooks (`POST /api/v1/finance/webhooks/paymob`, `/stripe`)
- Manual admin confirmation (`POST /api/v1/reservations/{id}/confirm`)

Once payment is captured, reservation moves to `CONFIRMED`, calendar lock becomes a booking, and escrow is created. Notifications are dispatched (email/SMS/WhatsApp).

**Implemented?** Yes.
**Operational?** Yes — requires payment provider configuration (Paymob API key, iframe ID).
**Manual?** No — automated, except optional admin override for payment confirmation.
**Who performs it?** Guest (initiates), System (processes), Admin (can override).

---

## OPERATIONAL BOTTLENECKS

### Bottleneck 1 — Owner Outreach Is Not Wired

**Impact:** The `owner.outreach` notification template exists but is completely disconnected. No event is written, no channel mapping exists, no consumer processes it. The founder must contact every property owner manually outside the system.

**Severity for 50 listings:** LOW. 50 manual outreach messages (WhatsApp/SMS) is feasible. The template content is ready to copy-paste.

**Can it stay manual?** YES for Closed Alpha.

---

### Bottleneck 2 — Imported Hosts Have No Way to Access Their Account If No Phone/Email

**Impact:** `_find_or_create_host()` creates host accounts with `KycStatus.VERIFIED` and `role=HOST`. If the CSV includes `host_phone`, the owner can authenticate via OTP. If the CSV includes `host_email`, they could potentially authenticate via Firebase. If neither is provided, the host account exists but is inaccessible. The host cannot improve their listing, manage availability, or respond to bookings.

**Severity for 50 listings:** MEDIUM. The CSV template includes `host_phone` and `host_email` columns. As long as the founder collects at least a phone number for each property, this is not a problem. If phone numbers are missing, those listings are effectively unmanaged.

**Can it stay manual?** YES — ensure every CSV row has at least `host_phone`.

---

### Bottleneck 3 — No Listing Quality Gate Before Approval

**Impact:** `approve_listing()` only checks that the unit is in `PENDING_VERIFICATION` status. It does not validate listing completeness (photos, description quality, amenities). An admin could approve a listing with no photos, a one-line description, and no amenities. The `submit_for_review()` function does check for title, description, and minimum price (100 EGP), but imported listings bypass `submit_for_review()` entirely — they go straight to `PENDING_VERIFICATION` via the import service.

**Severity for 50 listings:** LOW. The admin manually reviews each listing and can reject incomplete ones. The import preview already shows validation errors. The founder can enforce quality standards during CSV creation.

**Can it stay manual?** YES — admin judgment is sufficient for 50 listings.

---

### Bottleneck 4 — Payment Provider Configuration Required for First Booking

**Impact:** The reservation flow calls Paymob or Stripe at creation time. If `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, or `PAYMOB_IFRAME_ID` are not configured, payment intent creation will fail and no reservation can be created. Stripe is optional (only used if `STRIPE_SECRET_KEY` is set and the guest chooses card).

**Severity for first booking:** CRITICAL. Without a configured payment provider, no booking can complete. This is not a code issue — it is a configuration/operational prerequisite.

**Can it stay manual?** This is a one-time setup, not an ongoing manual step. Configure Paymob credentials in `.env` before attempting the first booking.

---

### Bottleneck 5 — Guest KYC Required Before Booking

**Impact:** `create_reservation()` requires `user.kyc_status == KycStatus.VERIFIED`. A new guest who authenticates via OTP starts with `KycStatus.UNVERIFIED`. They must complete KYC (upload ID, selfie, pass Textract/Rekognition or get manual admin approval) before they can book. This adds friction to the first booking.

**Severity for first booking:** MEDIUM. The first guest must go through KYC. For Closed Alpha, the admin can manually approve KYC documents via `POST /api/v1/kyc/documents/{id}/approve` to speed things up.

**Can it stay manual?** YES — admin manual KYC approval is supported and sufficient.

---

## FEASIBILITY ASSESSMENT

### 50 Imported Listings

**Verdict: FEASIBLE with current software.**

- CSV template exists and is downloadable.
- Import pipeline (upload → parse → validate → preview → confirm → create) is fully implemented and functional.
- Duplicate detection prevents re-importing the same property.
- Host accounts are auto-created with `KycStatus.VERIFIED`.
- Listings enter `PENDING_VERIFICATION` for admin review.
- The founder manually collects property data and fills the CSV. 50 rows is a manageable effort.

### 10 Verified Hosts

**Verdict: FEASIBLE with current software.**

- Imported hosts are automatically `VERIFIED` (KYC bypassed).
- Self-registered hosts can complete KYC via the KYC module (Textract/Rekognition or manual admin approval).
- Hosts can update listings, manage photos, and set calendar availability.
- The founder must ensure each CSV row has at least `host_phone` so the host can access their account.

### First Booking

**Verdict: FEASIBLE with current software, conditional on payment provider configuration.**

- Guest search is public and functional.
- Reservation creation is fully implemented (availability check, pricing, payment intent, calendar lock).
- Payment confirmation works via webhooks or manual admin override.
- Escrow is created on confirmation.
- Notifications are dispatched (email/SMS/WhatsApp).
- **Condition:** Paymob must be configured (`PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`). Without this, no booking can complete.
- **Condition:** The first guest must complete KYC. Admin can manually approve to reduce friction.

### First Revenue

**Verdict: FEASIBLE with current software.**

- On payment capture, escrow is created and ledger entries are posted.
- Host payout can be requested via `POST /api/v1/finance/payouts` and processed via `process_payout()`.
- Platform fee and host commission are calculated automatically in `_calculate_amounts()`.
- The finance module tracks wallets, ledger entries, and payouts.
- **Condition:** Payout processing requires bank account details on the host. The payout request endpoint captures bank details. For Closed Alpha, the founder can process payouts manually via the admin endpoints.

---

## SUMMARY

| Step | Implemented | Operational | Manual | Actor | OK for Alpha? |
|---|---|---|---|---|---|
| 1. Property Source | No | No | Yes | Founder | YES |
| 2. Collection Method | No | No | Yes | Founder | YES |
| 3. Data Cleaning | Partial | At import | Yes | Founder | YES |
| 4. Normalization | Yes | Yes | No | System | — |
| 5. CSV Creation | Yes (template) | Yes | Yes | Founder | YES |
| 6. Import | Yes | Yes | Upload only | Admin | — |
| 7. Preview | Yes | Yes | No | System | — |
| 8. Confirmation | Yes | Yes | Click | Admin | — |
| 9. Pending Verification | Yes | Yes | No | System | — |
| 10. Admin Review | Yes | Yes | Yes | Admin | YES |
| 11. Published Listing | Yes | Yes | Approve click | Admin | — |
| 12. Owner Outreach | No (template only) | No | Yes | Founder | YES |
| 13. Owner Response | No | No | Yes | Founder | YES |
| 14. Host Registration | Yes | Yes | Optional | System/Owner | — |
| 15. Host Verification | Yes | Yes | Optional | System/Admin | — |
| 16. Listing Improvement | Yes | Yes | Yes | Host | YES |
| 17. Guest Search | Yes | Yes | No | Guest | — |
| 18. Booking | Yes | Yes | No | Guest/System | — |

**The current software can realistically reach 50 imported listings, 10 verified hosts, first booking, and first revenue.** The manual steps (property sourcing, data collection, owner outreach) are feasible at Closed Alpha scale. The only hard prerequisite is configuring a payment provider (Paymob) before attempting the first booking.
