# SPRINT 3 GAP ANALYSIS — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Purpose:** Map each P0 story to existing code, identify gaps, and provide code evidence for implementation status.

---

## 1. Status Legend

| Status | Meaning |
|--------|---------|
| **DONE** | Fully implemented, tested, and production-ready. |
| **PARTIAL** | Backend or infrastructure exists but is incomplete (missing endpoint, frontend, or wiring). |
| **NOT IMPLEMENTED** | No code exists for this story. |

---

## 2. Epic 1 — Supply Enablement (P0)

### S3-001 — Host phone OTP signup + role selection — **DONE**

**Evidence:**
- `src/app/auth/router.py:1-135` — OTP send (`POST /auth/otp/send`), OTP verify (`POST /auth/otp/verify`), Firebase auth (`POST /auth/firebase`), token refresh, logout, user info.
- `src/app/auth/services.py:197-231` — `send_otp()` uses Twilio Verify; `verify_otp()` checks code; rate limiting via Redis.
- `src/app/auth/services.py:234-246` — `get_or_create_user_by_phone()` creates users with `role=GUEST` by default.
- `src/app/auth/models.py` — User model has `role` field with `GUEST`, `HOST`, `ADMIN`, `OPERATIONS`, `FIELD_STAFF` roles.
- `apps/web/app/[locale]/auth/login/page.tsx:1-164` — Frontend login page with phone → OTP flow, Firebase phone auth, Arabic RTL support.
- `apps/web/lib/auth/useAuth.ts` — Auth context with `sendOtp`, `confirmOtp`, token management.

**Gap:** None. Users can sign up with phone OTP. Role upgrade to HOST is done via admin or KYC flow.

---

### S3-002 — Host KYC upload (ID + selfie) — **DONE**

**Evidence:**
- `src/app/kyc/router.py:1-71` — `POST /kyc/initiate` creates a KYC document record; `POST /kyc/documents/{document_id}/submit` accepts document submission.
- `src/app/kyc/services.py:1-222` — `initiate_kyc()` creates record; `generate_presigned_upload_url()` produces S3 PUT URLs for `front_side`, `back_side`, `selfie`; `submit_document()` stores S3 keys; `process_kyc_document()` runs AWS Textract for ID extraction and Rekognition for face comparison.
- `src/app/config.py` — `S3_KYC_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` configured.
- Migration `003_create_kyc_tables.py` creates `auth.kyc_documents` table.

**Gap:** None for upload. Textract/Rekognition automation is V1.1 per scope freeze, but the code exists and can be used for manual review enhancement.

---

### S3-003 — Listing creation form — **PARTIAL** (backend only)

**Evidence (backend):**
- `src/app/listings/router.py:1-238` — `POST /listings` endpoint creates unit + listing; `PUT /listings/{listing_id}` updates; `GET /listings/{listing_id}` retrieves.
- `src/app/listings/services.py:1-524` — `create_listing()` validates input, creates `Unit` + `UnitListing`, supports amenities, max_guests, property_type, coordinates (PostGIS POINT), cultural tags.
- `src/app/listings/models.py:1-187` — `Unit` model with `host_id`, `governorate`, `city`, `district`, `address_line`, `coordinates` (Geometry POINT), `max_guests`, `bedrooms`, `bathrooms`. `UnitListing` model with `title`, `description`, `base_price_egp`, `amenities`, `cultural_tags`, `house_rules`, `check_in_instructions`, `policies`.

**Evidence (frontend):**
- `apps/web/app/[locale]/host/page.tsx:1-29` — Host page shows "coming soon" placeholder. No listing creation form exists.
- No `host/listings/new/page.tsx` or similar route found.

**Gap:**
- **Frontend listing creation form** (Arabic RTL) with fields for title, description, location, amenities, max guests, property type, photos, pricing.
- **Frontend host dashboard** with listing management (S3-019 is P1 but the form is P0).

---

### S3-004 — Listing photo upload — **NOT IMPLEMENTED**

**Evidence (infrastructure):**
- Migration `011_create_unit_photos.py` creates `pms.unit_photos` table with `unit_id`, `url`, `caption`, `is_cover`, `display_order`, `created_at`.
- `src/app/listings/models.py` — `UnitPhoto` model defined with all fields and relationship to `Unit`.
- `src/app/config.py` — `S3_LISTINGS_BUCKET` configured.

**Evidence (missing):**
- No photo upload endpoint in `src/app/listings/router.py` — no `POST /listings/{id}/photos` or presigned URL endpoint.
- No presigned URL generation for listing photos (only KYC presigned URLs in `src/app/kyc/services.py`).
- No photo management service in `src/app/listings/services.py`.
- `src/app/listings/configuration.py:40-57` — `resolve_cover_image_url()` reads `unit.photos` but no endpoint populates them.

**Gap:**
- **Presigned S3 URL endpoint** for listing photos (`POST /listings/{unit_id}/photos/presign`).
- **Photo record creation endpoint** (`POST /listings/{unit_id}/photos`).
- **Photo deletion endpoint** (V1.1 per scope freeze, but needed for cover photo management).
- **Cover photo selection** — `cover_photo_id` column exists (migration 017) but no endpoint to set it.

---

### S3-005 — Base pricing, weekend multiplier, minimum stay — **DONE**

**Evidence:**
- `src/app/listings/models.py` — `UnitListing` has `base_price_egp`, `weekend_multiplier` (Numeric), `peak_multiplier` (Numeric), `min_nights`, `max_nights`, `cleaning_fee_egp`.
- `src/app/listings/router.py` — `POST /listings` and `PUT /listings/{listing_id}` accept pricing fields.
- `src/app/listings/services.py` — `create_listing()` and `update_listing()` persist pricing fields.
- `src/app/listings/pricing.py` — `compute_subtotal()` calculates nightly pricing using base price, weekend multiplier, and calendar rules.
- `src/app/listings/router.py` — `PATCH /listings/{unit_id}/bulk-availability-pricing` supports bulk price updates.

**Gap:** None.

---

### S3-006 — Calendar availability and date blocking — **DONE**

**Evidence:**
- `src/app/listings/models.py` — `CalendarRule` model with `unit_id`, `date_from`, `date_to`, `status` (available/blocked/booked/hold), `price_override_egp`, `block_type`.
- `src/app/listings/router.py` — `PUT /listings/{unit_id}/calendar/rules` creates rules; `PATCH /listings/{unit_id}/calendar/rules/{rule_id}` updates; `DELETE /listings/{unit_id}/calendar/rules/{rule_id}` deletes; `GET /listings/{unit_id}/availability` retrieves availability.
- `src/app/availability/router.py:1-43` — Dedicated availability router with `GET /availability/{unit_id}` and `PATCH /availability/{unit_id}`.
- `src/app/listings/services.py` — `set_calendar_rule()`, `update_calendar_rule()`, `delete_calendar_rule()`, `get_availability()`, `bulk_update_availability_pricing()`.
- Migration `009_add_calendar_exclusion.py` — GiST exclusion constraint prevents overlapping non-available calendar rules.
- `apps/web/lib/queries/availability.ts` — Frontend query hook for availability.
- `apps/web/components/availability/` — Frontend availability components.

**Gap:** None.

---

### S3-007 — Listing submit for review — **PARTIAL**

**Evidence (state machine):**
- `src/app/listings/constants.py` — `UnitStatus` enum: `DRAFT`, `PENDING_VERIFICATION`, `UNLISTED`, `LISTED`, `SUSPENDED`, `ARCHIVED`.
- `src/app/listings/services.py` — `publish_listing()` transitions `UNLISTED → LISTED`; `unpublish_listing()` transitions `LISTED → UNLISTED`; `archive_listing()` transitions to `ARCHIVED`.
- `src/app/listings/services.py` — `create_listing()` creates listings in `DRAFT` status.

**Evidence (missing):**
- No `POST /listings/{id}/submit-for-review` endpoint that transitions `DRAFT → PENDING_VERIFICATION`.
- No notification trigger on state change.
- The `publish_listing` endpoint goes directly to `LISTED`, bypassing the `PENDING_VERIFICATION` state.

**Gap:**
- **Submit-for-review endpoint** that transitions `DRAFT → PENDING_VERIFICATION`.
- **Admin approval endpoint** that transitions `PENDING_VERIFICATION → LISTED` (this is S3-010).
- **Notification trigger** on state change (S3-008).

---

### S3-008 — Host WhatsApp notifications — **PARTIAL**

**Evidence (infrastructure):**
- `src/app/notifications/services.py:1-156` — `create_notifications_for_event()` resolves recipients, selects channels, renders templates, creates notification records. `dispatch_notification()` sends via provider. `process_pending_notifications()` processes the queue.
- `src/app/notifications/constants.py` — `NotificationChannel` enum: `WHATSAPP`, `EMAIL`, `SMS`. `NotificationStatus` enum: `PENDING`, `SENDING`, `SENT`, `FAILED`, `DEAD_LETTER`.
- `src/app/notifications/providers.py` — WhatsApp, email, SMS provider functions.
- `src/app/notifications/templates.py` — Template rendering with locale support.
- Migration `010_add_notifications_and_security.py` — `notify.notifications` and `notify.notification_templates` tables.
- `src/app/shared/outbox.py` — Outbox pattern for event-driven notifications.

**Evidence (missing):**
- No notification triggers in `src/app/kyc/services.py` when KYC status changes.
- No notification triggers in `src/app/listings/services.py` when listing status changes.
- No event emission for `kyc.approved`, `kyc.rejected`, `listing.submitted`, `listing.approved`, `listing.rejected`.
- `channels_for_event()` in `src/app/notifications/services.py:47-58` maps reservation/booking events but not KYC or listing events.

**Gap:**
- **Event emission** in KYC and listing services on status changes.
- **Channel mapping** for KYC and listing events in `channels_for_event()`.
- **Templates** for KYC and listing notification events.

---

## 3. Epic 2 — Admin Operations Dashboard (P0)

### S3-009 — Admin KYC review queue — **PARTIAL**

**Evidence (existing):**
- `src/app/kyc/router.py:57-71` — `POST /kyc/documents/{document_id}/process` endpoint with `require_role("admin")` dependency. Calls `process_kyc_document()` which runs Textract + Rekognition.
- `src/app/kyc/services.py:140-222` — `process_kyc_document()` analyzes ID document, compares faces, updates `kyc_status` to `VERIFIED` or `REJECTED`.

**Evidence (missing):**
- No `GET /kyc/queue` endpoint to list pending KYC submissions.
- No `POST /kyc/documents/{id}/approve` or `POST /kyc/documents/{id}/reject` endpoint for manual review with reason.
- The existing `process` endpoint is automated (Textract/Rekognition), not manual review.
- No pagination or filtering for the queue.

**Gap:**
- **KYC queue endpoint** (`GET /admin/kyc?status=pending&page=1`).
- **Manual approve endpoint** (`POST /admin/kyc/{document_id}/approve`).
- **Manual reject endpoint** (`POST /admin/kyc/{document_id}/reject` with reason).
- **Frontend admin KYC queue page**.

---

### S3-010 — Admin listing verification queue — **NOT IMPLEMENTED**

**Evidence (missing):**
- No admin endpoint to list pending listings.
- No admin endpoint to approve/reject listings.
- `src/app/listings/router.py` — `publish_listing` is host-initiated, not admin verification.
- No `GET /admin/listings?status=PENDING_VERIFICATION` endpoint.
- No `POST /admin/listings/{id}/approve` or `POST /admin/listings/{id}/reject` endpoint.

**Gap:**
- **Listing verification queue endpoint** (`GET /admin/listings?status=PENDING_VERIFICATION`).
- **Approve endpoint** (`POST /admin/listings/{id}/approve` → sets `LISTED`).
- **Reject endpoint** (`POST /admin/listings/{id}/reject` with reason → sets `UNLISTED`).
- **Frontend admin listing verification page**.

---

### S3-011 — Bulk CSV import — **NOT IMPLEMENTED**

**Evidence (missing):**
- No CSV parsing endpoint or service anywhere in the codebase.
- No `POST /admin/listings/import` endpoint.
- No CSV schema definition.
- No batch unit creation logic.

**Gap:**
- **CSV import endpoint** (`POST /admin/listings/import`).
- **CSV parser service** that creates units, listings, and photos from CSV rows.
- **Error reporting** per row with success/failure summary.
- **CSV template** definition.
- **Frontend CSV upload page**.

---

### S3-012 — Admin unclaimed listing creation — **NOT IMPLEMENTED**

**Evidence (missing):**
- No endpoint to create listings without a host (all listing creation requires `host_id` from the authenticated user).
- No claim link generation.
- No `host_id = NULL` support in listing creation flow.
- `src/app/listings/services.py:create_listing()` — requires `user.id` as `host_id`.

**Gap:**
- **Admin listing creation endpoint** that creates a unit with `host_id = NULL` or a placeholder.
- **Claim token generation** (secure, expiring link).
- **Claim link endpoint** (`GET /admin/listings/{id}/claim-link`).
- **Frontend admin unclaimed listing form**.

---

### S3-013 — Claim review and ownership transfer — **NOT IMPLEMENTED**

**Evidence (missing):**
- No claim model or table.
- No claim submission endpoint.
- No ownership transfer endpoint.
- No claim review queue.

**Gap:**
- **Claim model** (`pms.listing_claims` table with `unit_id`, `claimant_id`, `status`, `documents`, `claim_token`).
- **Claim submission endpoint** (`POST /listings/{id}/claim`).
- **Claim review queue** (`GET /admin/claims`).
- **Approve claim endpoint** (`POST /admin/claims/{id}/approve` → transfers `host_id`).
- **Reject claim endpoint** (`POST /admin/claims/{id}/reject` with reason).
- **Migration** for claims table.

---

### S3-014 — Duplicate listing detection — **NOT IMPLEMENTED**

**Evidence (missing):**
- No duplicate detection service.
- No duplicate flag model or table.
- No duplicate review queue.

**Gap:**
- **Duplicate detection service** (geo proximity + title similarity).
- **Duplicate flag model** (`pms.duplicate_flags` table with `unit_id_1`, `unit_id_2`, `similarity_score`, `status`).
- **Duplicate detection endpoint** (`POST /admin/listings/duplicates/scan`).
- **Duplicate review queue** (`GET /admin/duplicates`).
- **Merge/reject endpoint** (`POST /admin/duplicates/{id}/merge` or `/reject`).
- **Migration** for duplicate flags table.

---

### S3-015 — Support ticket queue — **NOT IMPLEMENTED**

**Evidence (missing):**
- No support ticket model or table.
- No support ticket endpoints.
- `src/app/operations/models.py` — has `MaintenanceRequest` but that is for property maintenance, not customer support.
- `src/app/operations/router.py` — has task/maintenance endpoints but no support ticket endpoints.

**Gap:**
- **Support ticket model** (`support.tickets` table with `subject`, `description`, `priority`, `status`, `assignee_id`, `reporter_id`, `related_unit_id`, `related_reservation_id`).
- **Ticket CRUD endpoints** (`GET /admin/tickets`, `POST /admin/tickets`, `PATCH /admin/tickets/{id}`).
- **Assignment and escalation endpoints**.
- **Migration** for support tickets table.
- **Frontend admin support ticket queue page**.

---

## 4. Epic 6 — Infrastructure and Platform (P0)

### S3-030 — `pms.unit_photos` migration — **DONE**

**Evidence:**
- Migration `011_create_unit_photos.py` creates `pms.unit_photos` table with `id`, `unit_id`, `url`, `caption`, `is_cover`, `display_order`, `created_at`.
- `src/app/listings/models.py` — `UnitPhoto` SQLAlchemy model with all fields and `unit` relationship.

**Gap:** None.

---

### S3-031 — Pre-signed S3 upload URLs — **PARTIAL** (KYC only)

**Evidence (KYC):**
- `src/app/kyc/services.py:40-70` — `generate_presigned_upload_url()` creates S3 presigned PUT URLs for KYC documents using `boto3.client("s3").generate_presigned_url()`.
- `src/app/kyc/router.py:25-40` — `POST /kyc/initiate` returns presigned URLs for `front_side`, `back_side`, `selfie`.

**Evidence (listings — missing):**
- No presigned URL endpoint for listing photos.
- No `generate_presigned_upload_url()` function in listings services.
- `S3_LISTINGS_BUCKET` is configured in `src/app/config.py` but never used in code.

**Gap:**
- **Presigned URL endpoint** for listing photos (`POST /listings/{unit_id}/photos/presign`).
- **Presigned URL service** in listings module (reuse pattern from KYC).

---

### S3-032 — Listing state machine — **DONE**

**Evidence:**
- `src/app/listings/constants.py` — `UnitStatus` enum with `DRAFT`, `PENDING_VERIFICATION`, `UNLISTED`, `LISTED`, `SUSPENDED`, `ARCHIVED`.
- `src/app/listings/services.py` — `publish_listing()`, `unpublish_listing()`, `archive_listing()` enforce state transitions.
- `src/app/listings/services.py:create_listing()` — creates listings in `DRAFT` status.

**Gap:** None for the state machine itself. The `DRAFT → PENDING_VERIFICATION` transition endpoint is missing (S3-007).

---

### S3-033 — S3 bucket config — **PARTIAL**

**Evidence (config):**
- `src/app/config.py` — `S3_LISTINGS_BUCKET`, `S3_KYC_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` all defined.
- `src/app/kyc/services.py` — Uses `S3_KYC_BUCKET` for presigned URLs.

**Evidence (missing):**
- No verification that S3 buckets actually exist and are accessible.
- No CORS configuration on the listings bucket for browser-based uploads.
- No IAM policy verification.
- No infrastructure-as-code for bucket creation.

**Gap:**
- **Verify S3 buckets exist** and are accessible from the application.
- **Configure CORS** on `S3_LISTINGS_BUCKET` for presigned PUT uploads from the web frontend.
- **Document IAM roles** needed for the application.
- **Infrastructure setup script** or documentation.

---

## 5. Summary Matrix

| ID | Story | Status | Remaining Effort |
|----|-------|--------|-----------------|
| S3-001 | Host OTP signup | DONE | 0 SP |
| S3-002 | KYC upload | DONE | 0 SP |
| S3-003 | Listing creation form | PARTIAL | 3 SP (frontend) |
| S3-004 | Listing photo upload | NOT IMPLEMENTED | 5 SP |
| S3-005 | Base pricing | DONE | 0 SP |
| S3-006 | Calendar availability | DONE | 0 SP |
| S3-007 | Submit for review | PARTIAL | 1 SP (endpoint) |
| S3-008 | WhatsApp notifications | PARTIAL | 2 SP (triggers) |
| S3-009 | Admin KYC queue | PARTIAL | 2 SP (queue + manual review) |
| S3-010 | Listing verification queue | NOT IMPLEMENTED | 3 SP |
| S3-011 | CSV import | NOT IMPLEMENTED | 5 SP |
| S3-012 | Unclaimed listing | NOT IMPLEMENTED | 5 SP |
| S3-013 | Claim review/transfer | NOT IMPLEMENTED | 5 SP |
| S3-014 | Duplicate detection | NOT IMPLEMENTED | 3 SP |
| S3-015 | Support ticket queue | NOT IMPLEMENTED | 3 SP |
| S3-030 | unit_photos migration | DONE | 0 SP |
| S3-031 | Presigned S3 URLs | PARTIAL | 1 SP (listings) |
| S3-032 | State machine | DONE | 0 SP |
| S3-033 | S3 bucket config | PARTIAL | 1 SP (CORS + verify) |

**Total remaining: ~39 SP** (adjusted from 46 SP after accounting for partial implementations)
