# S3 Wave 3 — Manual Checkout Flow Completion Report

## Executive Summary

Implemented the complete manual checkout flow for the Closed Alpha. The system supports the full workflow: Search → Open Listing → Request Booking → Host Accepts → Guest receives payment instructions → Guest uploads payment proof → Admin verifies payment → Booking becomes Confirmed. The payment module is cleanly separated from the booking engine, designed so that only the payment execution layer (e.g., Paymob) can be replaced in the future without touching the booking lifecycle.

## Implemented Workflow

1. **Guest requests booking** → `BookingStatus.REQUESTED`
2. **Host accepts** → `BookingStatus.ACCEPTED` + Payment request created (status: `pending`)
3. **Guest receives payment instructions** → Notification via email + WhatsApp
4. **Guest uploads payment proof** → Payment status: `proof_uploaded` → Notification to admin
5. **Admin verifies** → Payment status: `verified` → Booking status: `confirmed` → Notification to guest
6. **Admin rejects** → Payment status back to `pending` (with reason) → Notification to guest → Guest can re-upload

## Files Modified

### Backend
- `src/app/bookings/constants.py` — Added `CONFIRMED` to `BookingStatus` enum
- `src/app/bookings/services.py` — Added `CONFIRMED` to status transition map; integrated payment creation on host accept
- `src/app/notifications/constants.py` — Added `PAYMENT_REQUIRED`, `PAYMENT_PROOF_UPLOADED`, `PAYMENT_VERIFIED`, `PAYMENT_REJECTED` event types
- `src/app/notifications/consumers.py` — Added new payment event types to `_RELEVANT_EVENT_TYPES`
- `src/app/notifications/services.py` — Added channel mappings for new payment events
- `src/app/notifications/templates.py` — Added Arabic + English templates for all 4 new payment events
- `src/app/main.py` — Registered payments router

### Frontend
- `apps/web/lib/api-types.ts` — Added `confirmed` to `BookingStatus` type
- `apps/web/messages/en.json` — Added `payment` section with all new i18n keys
- `apps/web/messages/ar.json` — Added `payment` section with all new i18n keys (Arabic)

### Tests
- `tests/test_bookings.py` — Updated `test_update_booking_accept` to mock payment creation; fixed past date in `test_create_booking_conflict`

## Files Created

### Backend
- `src/app/payments/__init__.py`
- `src/app/payments/constants.py` — `PaymentStatus` (PENDING, PROOF_UPLOADED, VERIFIED, REJECTED, CANCELLED), `PaymentMethod` (MANUAL)
- `src/app/payments/models.py` — `Payment` SQLAlchemy model with schema `payment`
- `src/app/payments/schemas.py` — Pydantic schemas for presign, upload, verify, response, list item
- `src/app/payments/repository.py` — CRUD + queries (by booking, by guest, pending queue)
- `src/app/payments/services.py` — Business logic: create payment, presign proof, upload proof, verify, reject, list
- `src/app/payments/router.py` — 7 API endpoints

### Frontend
- `apps/web/lib/queries/payments.ts` — React Query hooks for all payment endpoints
- `apps/web/components/payments/ProofUpload.tsx` — Reusable proof upload component (drag & drop, presign, S3 PUT, submit)
- `apps/web/app/[locale]/checkout/[bookingId]/page.tsx` — Guest checkout page
- `apps/web/app/[locale]/admin/payments/page.tsx` — Admin payment verification queue

### Tests
- `tests/test_payments.py` — 19 tests covering all payment service functions

## Database Changes

- New table: `payment.payments` (schema: `payment`)
  - Columns: `id`, `booking_id` (FK → `booking.bookings.id`, unique), `guest_id`, `host_id`, `unit_id`, `status`, `method`, `amount_egp`, `nights`, `reference_number`, `proof_s3_key`, `proof_url`, `proof_uploaded_at`, `verified_at`, `verified_by`, `rejected_at`, `rejected_by`, `reject_reason`, `cancelled_at`, `instructions`, `created_at`, `updated_at`
  - Indexes: `idx_payments_booking_id`, `idx_payments_status`, `idx_payments_guest_id`
- `BookingStatus` enum extended with `CONFIRMED` value

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/payments/booking/{booking_id}` | Get payment by booking ID | Guest/Host/Admin |
| GET | `/api/v1/payments/{payment_id}` | Get payment by ID | Guest/Host/Admin |
| GET | `/api/v1/payments` | List guest's payments | Guest |
| POST | `/api/v1/payments/{payment_id}/proof/presign` | Get presigned S3 URL for proof upload | Guest/Admin |
| POST | `/api/v1/payments/{payment_id}/proof` | Submit proof URL | Guest |
| POST | `/api/v1/payments/{payment_id}/verify` | Verify payment (→ booking confirmed) | Admin |
| POST | `/api/v1/payments/{payment_id}/reject` | Reject payment with reason | Admin |
| GET | `/api/v1/payments/admin/queue` | List pending/proof_uploaded payments | Admin |

## Pages

- **`/[locale]/checkout/[bookingId]`** — Guest checkout page with booking summary, payment instructions, reference number, proof upload, status display, and retry upload
- **`/[locale]/admin/payments`** — Admin payment verification queue with proof viewing, approve, and reject (with reason)

## Components

- **`ProofUpload`** — Reusable component for drag-and-drop or click-to-select file upload. Handles presign → S3 PUT → submit URL flow. Supports JPG, PNG, WebP, and PDF. Reuses existing S3 presigned URL pattern from listings module.

## Tests

- `tests/test_payments.py`: 19 tests
  - `test_create_payment_for_booking_success` — Amount calculation (base × nights + cleaning fee)
  - `test_create_payment_idempotent` — No duplicate payment for same booking
  - `test_get_payment_authorized_guest` — Guest can view own payment
  - `test_get_payment_unauthorized` — Non-associated user cannot view
  - `test_presign_proof_guest_success` — Presigned URL generation
  - `test_presign_proof_wrong_status` — Cannot presign when verified
  - `test_presign_proof_invalid_content_type` — Rejects non-image/PDF
  - `test_upload_proof_success` — Proof upload updates status
  - `test_upload_proof_wrong_user` — Only guest can upload
  - `test_verify_payment_success` — Verify → booking confirmed
  - `test_verify_payment_non_admin` — Only admin can verify
  - `test_verify_payment_wrong_status` — Cannot verify pending payment
  - `test_reject_payment_success` — Reject → back to pending with reason
  - `test_reject_payment_non_admin` — Only admin can reject
  - `test_list_pending_payments_admin_only` — Admin-only queue
  - `test_list_guest_payments_guest_only` — Guest-only list
  - `test_get_payment_by_booking_not_found` — 404 handling
  - `test_payment_status_values` — Enum value checks
  - `test_payment_method_values` — Enum value checks

## Verification Results

| Check | Result |
|-------|--------|
| Backend lint (ruff) | ✅ Passed (0 errors) |
| Backend tests (pytest) | ✅ 370 passed, 6 pre-existing failures (unrelated listing fixture issues) |
| Frontend typecheck (tsc) | ✅ Passed (0 errors) |
| Frontend lint (eslint) | ✅ Passed (0 errors, 2 warnings for `<img>` usage) |
| Frontend build (next build) | ✅ Passed (16 routes built) |

## Remaining MVP Gap

- Database migration script for `payment.payments` table (model defined, migration not generated)
- Paymob integration (future — payment execution layer is isolated for this)
- Host notification when proof is uploaded (currently only email channel)

## Git Status

All changes staged and committed.

## Commit Hash

`49a96bc`

## Technical Debt

- Payment instructions are hardcoded (bank account, Vodafone Cash number) — should be configurable via settings
- Proof URL construction uses `NEXT_PUBLIC_IMAGE_HOSTS` env var — may need a dedicated payment proof CDN
- Pre-existing test failures in `test_host_services.py` and `test_listings_services.py` (missing fields in test fixtures) are unrelated to this wave
