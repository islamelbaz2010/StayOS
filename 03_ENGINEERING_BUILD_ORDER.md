# 03 — ENGINEERING BUILD ORDER

**Author:** Executive Program Director & Chief Product Officer  
**Date:** 2026-08-03  
**Status:** LOCKED — Exact implementation order. One task after another. No ambiguity.

---

## Phase 0 — Infrastructure Unblocking (Days 1-2)

**Goal:** Make S3 work for listing photos. Everything else is blocked until this works.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 1 | Verify S3 buckets exist. Configure CORS on `S3_LISTINGS_BUCKET` for browser uploads. Verify IAM roles. | S3-033 | 1 | Nothing | No — blocks everything |
| 2 | Create presigned URL endpoint for listing photos: `POST /listings/{unit_id}/photos/presign` | S3-031 | 1 | S3-033 | No — blocks S3-004 |

**Testing Checkpoint 1:**
- [ ] Presigned URL generated from API
- [ ] Browser can PUT a file to the presigned URL
- [ ] File appears in S3 bucket
- [ ] CORS headers present in response

**Acceptance:** Engineer demonstrates uploading a photo from the browser to S3 using a presigned URL. If this fails, stop all other work and fix it.

**Rollback:** Revert CORS config. Use direct S3 upload from backend as temporary fallback.

---

## Phase 1 — Photo Upload + Listing Form (Days 3-7)

**Goal:** A host can create a listing and upload photos. This is the #1 hard blocker.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 3 | Backend: Photo record creation endpoint `POST /listings/{unit_id}/photos` (stores URL, caption, is_cover, display_order) | S3-004 | 2 | S3-031 | No |
| 4 | Backend: Photo listing endpoint `GET /listings/{unit_id}/photos` (returns all photos for a listing) | S3-004 | 1 | Task 3 | No |
| 5 | Backend: Cover photo selection `PATCH /listings/{unit_id}/photos/{photo_id}/cover` | S3-004 | 1 | Task 3 | No |
| 6 | Frontend: Listing creation form (Arabic RTL) — title, description, property type, location (lat/lng text input), max guests, bedrooms, bathrooms, amenities (checkbox list), cultural tags (checkbox list), base price, min nights | S3-003 | 3 | Nothing | **YES — parallel with tasks 3-5** |
| 7 | Frontend: Photo upload component — multi-file select, presigned URL fetch, upload progress, photo preview, set cover photo | S3-004 | 1 | Tasks 3-5, S3-031 | No |

**Testing Checkpoint 2:**
- [ ] Host creates a listing from the web form (Arabic RTL)
- [ ] Host uploads 5 photos from the browser
- [ ] Photos appear in listing detail page
- [ ] Cover photo is set correctly
- [ ] Listing is in DRAFT status

**Acceptance:** Founder creates a real listing with 5 real photos from the web UI without any engineering assistance. If the founder cannot do this, the feature is not done.

**Rollback:** If photo upload fails in production, founder can create listings via API and upload photos via AWS CLI as fallback.

---

## Phase 2 — Verification Flow + Admin Queues (Days 8-12)

**Goal:** Founder can review and approve listings and KYC. The verification loop is closed.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 8 | Backend: Submit-for-review endpoint `POST /listings/{unit_id}/submit-for-review` (DRAFT → PENDING_VERIFICATION) | S3-007 | 0.5 | S3-003 | No |
| 9 | Backend: Admin listing queue `GET /admin/listings?status=PENDING_VERIFICATION` | S3-010 | 1 | S3-007 | No |
| 10 | Backend: Admin approve listing `POST /admin/listings/{id}/approve` (PENDING_VERIFICATION → LISTED) | S3-010 | 1 | Task 9 | No |
| 11 | Backend: Admin reject listing `POST /admin/listings/{id}/reject` with reason (PENDING_VERIFICATION → UNLISTED) | S3-010 | 1 | Task 9 | No |
| 12 | Backend: Admin KYC queue `GET /admin/kyc?status=pending` | S3-009 | 1 | Nothing | **YES — parallel with tasks 8-11** |
| 13 | Backend: Manual KYC approve `POST /admin/kyc/{document_id}/approve` | S3-009 | 0.5 | Task 12 | No |
| 14 | Backend: Manual KYC reject `POST /admin/kyc/{document_id}/reject` with reason | S3-009 | 0.5 | Task 12 | No |
| 15 | Frontend: Admin listing verification queue page (list pending, approve/reject buttons, reason input) | S3-010 | 1 | Tasks 9-11 | No |
| 16 | Frontend: Admin KYC review queue page (list pending, view documents, approve/reject buttons, reason input) | S3-009 | 1 | Tasks 12-14 | **YES — parallel with task 15** |
| 17 | Frontend: Submit-for-review button on host listing form | S3-007 | 0.5 | Task 8 | No |

**Testing Checkpoint 3:**
- [ ] Host submits listing for review
- [ ] Admin sees listing in pending queue
- [ ] Admin approves listing → status becomes LISTED
- [ ] Admin rejects listing with reason → status becomes UNLISTED
- [ ] Admin sees pending KYC submissions
- [ ] Admin approves KYC → host status becomes VERIFIED
- [ ] Admin rejects KYC with reason → host status becomes REJECTED

**Acceptance:** Founder reviews and approves 3 test listings and 3 test KYC submissions from the admin UI without any engineering assistance.

**Rollback:** If admin UI fails, founder can use API endpoints directly via curl/Postman as fallback.

---

## Phase 3 — SMS Notifications (Days 10-11, parallel with Phase 2)

**Goal:** Hosts receive SMS when KYC or listing status changes. SMS, not WhatsApp.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 18 | Backend: Add event emission for `kyc.approved`, `kyc.rejected`, `listing.submitted`, `listing.approved`, `listing.rejected` in KYC and listing services | S3-008 | 1 | Tasks 10-14 | **YES — parallel with Phase 2 frontend** |
| 19 | Backend: Add channel mapping for KYC and listing events in `channels_for_event()` — SMS channel only | S3-008 | 0.5 | Task 18 | No |
| 20 | Backend: Add Arabic SMS templates for each event | S3-008 | 0.5 | Task 19 | No |

**Testing Checkpoint 4:**
- [ ] Admin approves KYC → host receives Arabic SMS
- [ ] Admin approves listing → host receives Arabic SMS
- [ ] Admin rejects KYC → host receives Arabic SMS with reason summary
- [ ] Admin rejects listing → host receives Arabic SMS with reason summary

**Acceptance:** Founder approves a test KYC and receives an SMS on the test phone.

**Rollback:** If SMS fails, founder sends WhatsApp messages manually. This is sustainable for 15 hosts.

---

## Phase 4 — CSV Import (Days 12-14)

**Goal:** Founder can bulk-import agency portfolios. Simplified: no photo URL download.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 21 | Backend: CSV import endpoint `POST /admin/listings/import` — accepts CSV file, parses rows, creates units + listings in DRAFT status | S3-011 | 2 | S3-003 | No |
| 22 | Backend: CSV validation — required fields check, coordinate validation, price range check. Return per-row success/failure report. | S3-011 | 1 | Task 21 | No |
| 23 | Frontend: CSV upload page — file select, upload, results display (success/failure per row) | S3-011 | 1 | Tasks 21-22 | No |

**Testing Checkpoint 5:**
- [ ] Founder uploads CSV with 10 test rows
- [ ] 10 listings created in DRAFT status
- [ ] Invalid rows show error messages
- [ ] Founder can then upload photos for each listing individually

**Acceptance:** Founder imports a real 10-row CSV from an agency and all listings appear in the admin queue.

**Rollback:** If CSV import fails, founder creates listings one by one via the listing form. Slower but functional.

---

## Phase 5 — Payment Checkout (Days 13-17)

**Goal:** Guest can pay for a booking. Paymob iframe if possible, manual confirmation as fallback.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 24 | Backend: Payment intent creation endpoint `POST /bookings/{id}/payment-intent` — creates Paymob payment intent | S3-018 | 2 | Nothing | **YES — parallel with Phase 4** |
| 25 | Backend: Paymob iframe redirect endpoint — returns Paymob iframe URL for frontend | S3-018 | 1 | Task 24 | No |
| 26 | Backend: Manual payment confirmation endpoint `POST /admin/bookings/{id}/confirm-payment` — founder confirms payment received externally | S3-018 | 1 | Nothing | **YES — parallel with task 24** |
| 27 | Backend: Payment webhook handler update — ensure Paymob webhook updates booking status | S3-018 | 1 | Task 24 | No |
| 28 | Frontend: Payment checkout page — display total price (nightly rate × nights + cleaning fee + service fee), Paymob iframe, or "Pay via bank transfer — founder will confirm" message | S3-018 | 2 | Tasks 24-27 | No |

**Testing Checkpoint 6:**
- [ ] Guest initiates booking
- [ ] Checkout page displays total price in EGP
- [ ] If Paymob works: guest pays via iframe, booking confirmed automatically
- [ ] If Paymob fails: guest pays via bank transfer, founder confirms via admin endpoint, booking confirmed
- [ ] Booking status transitions: PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT

**Acceptance:** Founder completes a test booking end-to-end: create listing → approve → guest books → guest pays → founder confirms → booking complete.

**Rollback:** If Paymob iframe doesn't work, use manual confirmation only. Founder checks bank statement, confirms via admin endpoint. This is the alpha fallback.

**CRITICAL:** If Paymob commercial account is not confirmed by Day 13, skip tasks 24-25 and 27. Build only manual confirmation (task 26) and checkout page with "Pay via bank transfer" (task 28). Do not wait for Paymob.

---

## Phase 6 — Vision Features (Days 15-17, parallel with Phase 5 testing)

**Goal:** The guest experience proves StayOS is NOT Airbnb.

| Order | Task | ID | SP | Depends On | Parallel? |
|-------|------|----|----|------------|-----------|
| 29 | Write real Arabic copy for ALL guest-facing pages: landing, search, listing detail, booking, checkout, auth. Replace all placeholder i18n keys with native Arabic text. | V-01 | 2 | Nothing | **YES — parallel with Phase 5** |
| 30 | Frontend: Verified Host badge on listing detail page — green badge with "مضيف موثّق" (Verified Host) shown when host kyc_status = VERIFIED | V-02 | 0.5 | Nothing | **YES** |
| 31 | Frontend: Cultural tag filter chips on search page — row of toggle chips: "عائلي" (Family-friendly), "حلال" (Halal-certified), "للعائلات فقط" (Families only). Filter sends cultural_tags param to search API. | V-03 | 1 | Nothing | **YES** |
| 32 | Frontend: Escrow trust message on booking/checkout page — "دفعتك محفوظة بأمان حتى تسجيل الوصول" (Your payment is held securely until check-in) | V-04 | 0.5 | Nothing | **YES** |
| 33 | Frontend: Cancellation policy text on checkout page — "إلغاء مجاني حتى 48 ساعة قبل الوصول. بعدها، استرد 50% من المبلغ." (Free cancellation up to 48h before check-in. After that, 50% refund.) | V-05 | 0.5 | Nothing | **YES** |

**Testing Checkpoint 7 (The Vision Test):**
- [ ] Open StayOS in Arabic — all text is real Arabic, not placeholders
- [ ] Search page shows cultural tag filter chips
- [ ] Listing detail shows "Verified Host" badge for verified hosts
- [ ] Checkout page shows escrow trust message
- [ ] Checkout page shows cancellation policy
- [ ] A guest who has never seen StayOS before can identify at least 3 differences from Airbnb within 1 minute

**Acceptance:** Show the platform to 3 people who have never seen it. Ask: "How is this different from Airbnb?" If they cannot identify at least 2 differences, the vision features are insufficient.

**Rollback:** None. These are text and UI components. They must work.

---

## Phase 7 — Integration Testing + Staging Deploy (Days 17-18)

**Goal:** Everything works together. Founder can operate without engineering.

| Order | Task | SP | Depends On |
|-------|------|----|------------|
| 34 | End-to-end test: Host signup → KYC → listing creation → photo upload → submit → admin review → approve → listing live → guest search → guest books → guest pays → founder confirms → booking complete → founder processes payout | 0 | All phases |
| 35 | Deploy to staging. Verify all features work in staging environment. | 0 | Task 34 |
| 36 | Founder walkthrough: founder uses every feature without engineering help. Time-boxed to 2 hours. | 0 | Task 35 |

**Final Acceptance Criteria (The Second Primary Question):**

The founder must be able to do ALL of the following without engineering assistance:

- [ ] Recruit a property owner (manual, no code)
- [ ] Create a listing from the web form
- [ ] Upload photos to the listing
- [ ] Submit listing for review
- [ ] Review and approve KYC from admin queue
- [ ] Review and approve listing from admin queue
- [ ] Import 10 listings via CSV
- [ ] Receive a booking from a guest
- [ ] Confirm payment (manual or Paymob)
- [ ] Process a payout to a host
- [ ] Send SMS notification to host (automatic)
- [ ] View listings in search results
- [ ] See verified badge on approved listings
- [ ] See cultural tag filters on search page
- [ ] See escrow message and cancellation policy on checkout

If ANY of these fails, Sprint 3 is not done. Fix it before alpha.

---

## Dependency Graph (Visual)

```
Phase 0: S3-033 → S3-031
              ↓
Phase 1: S3-004 (backend) → S3-004 (frontend) ← S3-003 (frontend, parallel)
              ↓
Phase 2: S3-007 → S3-010 (backend) → S3-010 (frontend)
           S3-009 (backend, parallel) → S3-009 (frontend)
              ↓
Phase 3: S3-008 (parallel with Phase 2 frontend)
              ↓
Phase 4: S3-011 (after S3-003)
              ↓
Phase 5: S3-018 (parallel with Phase 4)
              ↓
Phase 6: V-01, V-02, V-03, V-04, V-05 (all parallel, after Phase 5)
              ↓
Phase 7: Integration testing + staging deploy
```

---

## Timeline Summary

| Phase | Days | Duration | SP |
|-------|------|----------|----|
| 0: Infrastructure | 1-2 | 2 days | 2 |
| 1: Photos + Listing Form | 3-7 | 5 days | 8 |
| 2: Verification + Admin | 8-12 | 5 days | 7 |
| 3: SMS Notifications | 10-11 | 2 days (parallel) | 2 |
| 4: CSV Import | 12-14 | 3 days | 3 |
| 5: Payment Checkout | 13-17 | 5 days (parallel) | 5 |
| 6: Vision Features | 15-17 | 3 days (parallel) | 4.5 |
| 7: Integration + Deploy | 17-18 | 2 days | 0 |
| **Total** | **18 days** | **~3.5 weeks** | **29.5** |

**Parallel work note:** Phases 3, 5, and 6 overlap with Phases 2 and 4. A 2-person engineering team (1 backend, 1 frontend) can work in parallel: backend does Phase 0-2-3-4-5, frontend does Phase 1-2-6.

---

## Rollback Conditions

| If... | Then... |
|-------|--------|
| S3 CORS cannot be configured | Backend uploads photos directly to S3. Frontend sends file to backend API. |
| Paymob iframe doesn't work | Manual confirmation only. Founder checks bank statement. |
| SMS delivery fails in Egypt | Founder sends WhatsApp messages manually. |
| CSV import parser fails on edge cases | Founder creates listings one by one via form. |
| Arabic copy not ready by Day 15 | Use machine translation as placeholder. Hire Arabic copywriter to fix before alpha. |
| Admin UI has bugs | Founder uses API endpoints directly via Postman. |

**No rollback condition exists for vision features (V-01 through V-05). These must work. Without them, the MVP does not prove the vision.**
