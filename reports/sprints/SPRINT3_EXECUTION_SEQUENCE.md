# SPRINT 3 EXECUTION SEQUENCE — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Purpose:** Define the ordered execution sequence for Sprint 3 P0 stories, grouped into phases with clear entry/exit criteria.

---

## Phase A — Infrastructure Unblock (Days 1–3)

**Goal:** Ensure S3 buckets, CORS, and presigned URL endpoints work for both KYC and listing photos.

| Step | Story | Task | Owner | Deliverable |
|------|-------|------|-------|-------------|
| A1 | S3-033 | Verify `S3_LISTINGS_BUCKET` and `S3_KYC_BUCKET` exist in AWS | Eng | Bucket verification report |
| A2 | S3-033 | Configure CORS on `S3_LISTINGS_BUCKET` for PUT from web origin | Eng | CORS config applied |
| A3 | S3-033 | Verify IAM role has `s3:PutObject` on both buckets | Eng | IAM policy verified |
| A4 | S3-031 | Create `generate_listing_presigned_url()` in listings services (reuse KYC pattern) | Eng | Presigned URL function |
| A5 | S3-031 | Add `POST /listings/{unit_id}/photos/presign` endpoint | Eng | API endpoint |
| A6 | S3-031 | Add `POST /listings/{unit_id}/photos` endpoint to create photo record after upload | Eng | API endpoint |
| A7 | S3-031 | Add `PATCH /listings/{unit_id}/photos/{photo_id}` for cover photo selection | Eng | API endpoint |

**Entry criteria:** AWS account access, `config.py` settings verified.  
**Exit criteria:** Presigned PUT URL generated for a listing photo; upload succeeds; photo record created in DB; cover photo set.

---

## Phase B — Supply Pipe Backend (Days 3–7)

**Goal:** Complete all backend endpoints for listing creation, photo upload, and submit-for-review.

| Step | Story | Task | Owner | Deliverable |
|------|-------|------|-------|-------------|
| B1 | S3-007 | Add `POST /listings/{id}/submit-for-review` endpoint (`DRAFT → PENDING_VERIFICATION`) | Eng | API endpoint |
| B2 | S3-007 | Add validation: listing must have title, description, price, and ≥1 photo before submission | Eng | Validation logic |
| B3 | S3-008 | Add `write_event()` calls in `kyc/services.py` for `kyc.approved`, `kyc.rejected` | Eng | Event emission |
| B4 | S3-008 | Add `write_event()` calls in `listings/services.py` for `listing.submitted`, `listing.approved`, `listing.rejected` | Eng | Event emission |
| B5 | S3-008 | Add KYC and listing event channels to `channels_for_event()` in notifications service | Eng | Channel mapping |
| B6 | S3-008 | Create notification templates for KYC and listing events (Arabic + English) | Eng | Templates |
| B7 | S3-004 | Add `DELETE /listings/{unit_id}/photos/{photo_id}` endpoint (optional — V1.1 but useful) | Eng | API endpoint |

**Entry criteria:** Phase A complete.  
**Exit criteria:** Host can create listing, upload photos, set cover photo, submit for review, and receive WhatsApp/SMS notification on status change.

---

## Phase C — Supply Pipe Frontend (Days 5–10, parallel with B)

**Goal:** Build the host-facing frontend pages for listing creation, photo upload, and dashboard.

| Step | Story | Task | Owner | Deliverable |
|------|-------|------|-------|-------------|
| C1 | S3-003 | Create `host/listings/new/page.tsx` — listing creation form (Arabic RTL) | Eng | Frontend page |
| C2 | S3-003 | Form fields: title, description, property_type, governorate, city, district, address, coordinates (map picker), max_guests, bedrooms, bathrooms, amenities, cultural_tags | Eng | Form component |
| C3 | S3-003 | Form fields: base_price_egp, weekend_multiplier, cleaning_fee_egp, min_nights, max_nights | Eng | Pricing section |
| C4 | S3-004 | Photo upload component: fetch presigned URL, upload to S3, create photo record | Eng | Photo uploader |
| C5 | S3-004 | Photo gallery: drag-to-reorder, set cover photo, delete photo | Eng | Gallery component |
| C6 | S3-007 | Submit-for-review button on listing detail page | Eng | Button + API call |
| C7 | S3-003 | Create `host/listings/[id]/edit/page.tsx` — listing edit form | Eng | Frontend page |
| C8 | S3-003 | Create `host/listings/page.tsx` — host listings list page | Eng | Frontend page |

**Entry criteria:** Phase A endpoints available; Phase B endpoints in progress.  
**Exit criteria:** Host can create a listing with photos, set pricing, submit for review — all from the web UI.

---

## Phase D — Admin Operations Backend (Days 8–18)

**Goal:** Build all admin endpoints for KYC review, listing verification, CSV import, claim workflow, duplicates, and support tickets.

| Step | Story | Task | Owner | Deliverable |
|------|-------|------|-------|-------------|
| D1 | S3-009 | `GET /admin/kyc` — list pending KYC submissions with pagination | Eng | API endpoint |
| D2 | S3-009 | `POST /admin/kyc/{document_id}/approve` — manual approve with reason | Eng | API endpoint |
| D3 | S3-009 | `POST /admin/kyc/{document_id}/reject` — manual reject with reason | Eng | API endpoint |
| D4 | S3-010 | `GET /admin/listings?status=PENDING_VERIFICATION` — listing verification queue | Eng | API endpoint |
| D5 | S3-010 | `POST /admin/listings/{id}/approve` — approve listing (`PENDING_VERIFICATION → LISTED`) | Eng | API endpoint |
| D6 | S3-010 | `POST /admin/listings/{id}/reject` — reject listing with reason (`PENDING_VERIFICATION → UNLISTED`) | Eng | API endpoint |
| D7 | S3-011 | Define CSV schema (columns: title, description, property_type, governorate, city, district, address, lat, lng, max_guests, bedrooms, bathrooms, base_price, weekend_mult, min_nights, amenities, photo_urls) | Eng | CSV schema doc |
| D8 | S3-011 | `POST /admin/listings/import` — CSV upload and parse endpoint | Eng | API endpoint |
| D9 | S3-011 | CSV parser service: create units + listings + download photos from URLs | Eng | Service |
| D10 | S3-011 | Error reporting: per-row success/failure, summary response | Eng | Error report |
| D11 | S3-012 | `POST /admin/listings/unclaimed` — create listing with `host_id = NULL` | Eng | API endpoint |
| D12 | S3-012 | Generate secure claim token and claim link | Eng | Token generation |
| D13 | S3-012 | `GET /admin/listings/{id}/claim-link` — retrieve claim link | Eng | API endpoint |
| D14 | S3-013 | Migration: `pms.listing_claims` table | Eng | Migration |
| D15 | S3-013 | `POST /listings/{id}/claim` — public claim submission (requires auth + KYC) | Eng | API endpoint |
| D16 | S3-013 | `GET /admin/claims` — claim review queue | Eng | API endpoint |
| D17 | S3-013 | `POST /admin/claims/{id}/approve` — transfer ownership | Eng | API endpoint |
| D18 | S3-013 | `POST /admin/claims/{id}/reject` — reject with reason | Eng | API endpoint |
| D19 | S3-014 | Migration: `pms.duplicate_flags` table | Eng | Migration |
| D20 | S3-014 | Duplicate detection service: geo proximity (< 100m) + title similarity (fuzzy match) | Eng | Service |
| D21 | S3-014 | `POST /admin/listings/duplicates/scan` — trigger scan | Eng | API endpoint |
| D22 | S3-014 | `GET /admin/duplicates` — duplicate review queue | Eng | API endpoint |
| D23 | S3-014 | `POST /admin/duplicates/{id}/merge` — merge duplicates | Eng | API endpoint |
| D24 | S3-014 | `POST /admin/duplicates/{id}/dismiss` — dismiss flag | Eng | API endpoint |
| D25 | S3-015 | Migration: `support.tickets` table | Eng | Migration |
| D26 | S3-015 | `GET /admin/tickets` — ticket queue with filters (priority, status, assignee) | Eng | API endpoint |
| D27 | S3-015 | `POST /admin/tickets` — create ticket | Eng | API endpoint |
| D28 | S3-015 | `PATCH /admin/tickets/{id}` — update ticket (assign, escalate, close) | Eng | API endpoint |

**Entry criteria:** Phase B complete.  
**Exit criteria:** All admin endpoints functional with role-based access control.

---

## Phase E — Admin Operations Frontend (Days 12–20, parallel with D)

**Goal:** Build admin dashboard pages for all operations workflows.

| Step | Story | Task | Owner | Deliverable |
|------|-------|------|-------|-------------|
| E1 | S3-009 | `admin/kyc/page.tsx` — KYC review queue page | Eng | Frontend page |
| E2 | S3-010 | `admin/listings/page.tsx` — listing verification queue page | Eng | Frontend page |
| E3 | S3-011 | `admin/import/page.tsx` — CSV upload page with drag-drop | Eng | Frontend page |
| E4 | S3-012 | `admin/listings/unclaimed/page.tsx` — unclaimed listing creation form | Eng | Frontend page |
| E5 | S3-013 | `admin/claims/page.tsx` — claim review queue page | Eng | Frontend page |
| E6 | S3-014 | `admin/duplicates/page.tsx` — duplicate review queue page | Eng | Frontend page |
| E7 | S3-015 | `admin/tickets/page.tsx` — support ticket queue page | Eng | Frontend page |
| E8 | All | `admin/layout.tsx` — admin layout with sidebar navigation | Eng | Layout component |
| E9 | All | `admin/page.tsx` — admin dashboard home with quick links | Eng | Frontend page |

**Entry criteria:** Phase D endpoints in progress.  
**Exit criteria:** Admin can review KYC, verify listings, import CSV, create unclaimed listings, review claims, dismiss duplicates, and manage support tickets — all from the web UI.

---

## Phase F — Integration and Seeding (Days 18–25)

**Goal:** End-to-end integration testing and seed 50 listings.

| Step | Task | Owner | Deliverable |
|------|------|-------|-------------|
| F1 | End-to-end test: host signup → KYC → listing creation → photos → submit → admin approval | Eng | Test report |
| F2 | End-to-end test: admin CSV import → 20 listings created | Eng | Test report |
| F3 | End-to-end test: admin unclaimed listing → claim link → host claim → admin approval | Eng | Test report |
| F4 | End-to-end test: duplicate scan → review → merge | Eng | Test report |
| F5 | Seed 50 listings via CSV import | Ops | 50 listings on staging |
| F6 | Verify search returns results with photos | Eng | Search verification |
| F7 | Verify notifications fire on all state changes | Eng | Notification log |
| F8 | Admin dashboard smoke test with ops team | Ops | Sign-off |

**Entry criteria:** Phases D and E complete.  
**Exit criteria:** 50 listings on staging; all P0 workflows functional; ops team can use the dashboard.

---

## Timeline Summary

| Phase | Duration | Days | Parallel? |
|-------|----------|------|-----------|
| A — Infrastructure Unblock | 3 days | 1–3 | No |
| B — Supply Pipe Backend | 4 days | 3–7 | Partial (overlaps A) |
| C — Supply Pipe Frontend | 5 days | 5–10 | Yes (parallel with B) |
| D — Admin Operations Backend | 10 days | 8–18 | Yes (after B) |
| E — Admin Operations Frontend | 8 days | 12–20 | Yes (parallel with D) |
| F — Integration and Seeding | 7 days | 18–25 | After D + E |

**Total estimated duration: 25 working days (5 weeks).**
