# 07 — FINAL IMPLEMENTATION CONTRACT

**Author:** Executive Program Director & Chief Product Officer  
**Date:** 2026-08-03  
**Status:** LOCKED — This is the final contract. Engineering may only implement items listed here. Anything outside this contract requires Executive approval. No feature creep. No architecture expansion. No speculative engineering.

---

## Contract Terms

1. Engineering builds ONLY the items listed in Section 2.
2. Each item has exact acceptance criteria. No interpretation. No "close enough."
3. If an item is not listed here, it does not exist.
4. If engineering believes an item is missing, they must request Executive approval before building.
5. If an item cannot be completed as specified, engineering must report the blocker within 24 hours.
6. No new dependencies, packages, or services may be added without Executive approval.
7. No database migrations beyond those specified here.
8. No API endpoints beyond those specified here.
9. No frontend pages beyond those specified here.
10. This contract supersedes all prior documents. If a prior document conflicts with this contract, this contract wins.

---

## Section 2 — Approved Implementation Items

### 2.1 S3-033: S3 Bucket Configuration

**What to build:**
- Verify `S3_LISTINGS_BUCKET` exists in AWS.
- Configure CORS policy on `S3_LISTINGS_BUCKET` to allow PUT requests from the web frontend origin.
- Verify IAM role has `s3:PutObject` and `s3:GetObject` permissions on the bucket.

**Acceptance criteria:**
- [ ] `curl` from browser origin can PUT a file to a presigned URL on `S3_LISTINGS_BUCKET`.
- [ ] CORS headers present in S3 response.
- [ ] No AWS console errors.

**Files to modify:**
- AWS S3 console / Terraform (CORS configuration only).
- No application code changes.

---

### 2.2 S3-031: Presigned S3 URLs for Listing Photos

**What to build:**
- Endpoint: `POST /api/v1/listings/{unit_id}/photos/presign`
- Request: `{ "filename": "photo.jpg", "content_type": "image/jpeg" }`
- Response: `{ "upload_url": "https://s3...", "photo_key": "listings/{unit_id}/photo_{uuid}.jpg" }`
- Reuse the presigned URL pattern from `src/app/kyc/services.py:generate_presigned_upload_url()`.
- Use `S3_LISTINGS_BUCKET` from config.

**Acceptance criteria:**
- [ ] Endpoint returns a valid presigned PUT URL.
- [ ] URL expires in 15 minutes.
- [ ] URL accepts the specified content type.
- [ ] Only the listing owner (host_id matches) or admin can request presigned URLs.

**Files to modify:**
- `src/app/listings/router.py` — add endpoint.
- `src/app/listings/services.py` — add presigned URL generation function.

---

### 2.3 S3-004: Listing Photo Upload

**What to build:**

Backend:
- `POST /api/v1/listings/{unit_id}/photos` — create photo record after upload.
  - Request: `{ "url": "s3://...", "caption": "...", "is_cover": false, "display_order": 1 }`
  - Response: `{ "id": "...", "url": "...", "is_cover": false, "display_order": 1 }`
  - Stores record in `pms.unit_photos`.
- `GET /api/v1/listings/{unit_id}/photos` — list all photos for a listing.
- `PATCH /api/v1/listings/{unit_id}/photos/{photo_id}/cover` — set a photo as cover.
- `DELETE /api/v1/listings/{unit_id}/photos/{photo_id}` — delete a photo (optional for alpha, but simple to include).

Frontend:
- Photo upload component on the listing creation/edit page.
- Multi-file select (accept `image/*`).
- For each file: call presign endpoint, PUT to S3, call photo record endpoint.
- Show upload progress bar.
- Show thumbnail preview after upload.
- Allow setting cover photo (radio button or "Set as cover" button).
- Display order via integer field (auto-increment on upload).

**Acceptance criteria:**
- [ ] Host can select 5+ photos from browser and upload them.
- [ ] Each photo appears as a thumbnail preview.
- [ ] Host can set one photo as cover.
- [ ] Photos appear on the listing detail page.
- [ ] Cover photo appears as the main image on search cards.
- [ ] Only the listing owner or admin can upload photos.
- [ ] Upload works in Arabic RTL layout.

**Files to modify:**
- `src/app/listings/router.py` — add 4 endpoints.
- `src/app/listings/services.py` — add photo CRUD functions.
- `apps/web/app/[locale]/host/listings/[unitId]/photos/page.tsx` — new page.
- `apps/web/components/listings/PhotoUpload.tsx` — new component.
- `apps/web/lib/queries/photos.ts` — new query hooks.

---

### 2.4 S3-003: Listing Creation Form (Frontend)

**What to build:**
- `apps/web/app/[locale]/host/listings/new/page.tsx` — new listing creation page.
- Form fields (Arabic RTL):
  - Title (text, required) — Arabic placeholder
  - Description (textarea, required) — Arabic placeholder
  - Property type (select: apartment, villa, studio, chalet)
  - City (text, required) — default "القاهرة"
  - District (text, required) — e.g., "التجمع الخامس"
  - Address (text, required)
  - Latitude (text, required) — manual input
  - Longitude (text, required) — manual input
  - Max guests (number, required)
  - Bedrooms (number, required)
  - Bathrooms (number, required)
  - Amenities (checkbox list: wifi, parking, ac, kitchen, washing_machine, tv, pool, gym, elevator)
  - Cultural tags (checkbox list: family_friendly, halal_certified, families_only, gender_separated)
  - Base price EGP (number, required)
  - Weekend multiplier (number, optional, default 1.2)
  - Minimum nights (number, default 2)
  - Cleaning fee EGP (number, optional)
- Submit button: "حفظ كمسودة" (Save as Draft) — creates listing in DRAFT status.
- After save: redirect to photo upload page.
- Use existing `POST /api/v1/listings` backend endpoint (already implemented).

**Acceptance criteria:**
- [ ] Host can fill the form in Arabic RTL.
- [ ] Form creates a listing in DRAFT status via API.
- [ ] Required fields are validated.
- [ ] Cultural tags are saved to the listing.
- [ ] After save, redirect to photo upload page for the new listing.
- [ ] Form works without JavaScript errors.
- [ ] No map picker. Lat/lng are text inputs.

**Files to modify:**
- `apps/web/app/[locale]/host/listings/new/page.tsx` — new page.
- `apps/web/components/listings/ListingForm.tsx` — new component.
- `apps/web/lib/queries/listings.ts` — add create mutation hook if not exists.

---

### 2.5 S3-007: Submit for Review

**What to build:**
- Backend: `POST /api/v1/listings/{unit_id}/submit-for-review`
  - Transitions listing from DRAFT → PENDING_VERIFICATION.
  - Returns 400 if listing is not in DRAFT status.
  - Only the listing owner or admin can submit.
- Frontend: "إرسال للمراجعة" (Submit for Review) button on the host listing page.
  - Visible only when listing is in DRAFT status.
  - On click: call endpoint, show success message, update status display.

**Acceptance criteria:**
- [ ] Listing transitions from DRAFT to PENDING_VERIFICATION.
- [ ] Button only visible when status is DRAFT.
- [ ] Success message in Arabic: "تم إرسال قائمتك للمراجعة. سيتم مراجعتها خلال 24 ساعة."
- [ ] Error if listing is not in DRAFT status.

**Files to modify:**
- `src/app/listings/router.py` — add endpoint.
- `src/app/listings/services.py` — add submit function.
- `apps/web/app/[locale]/host/listings/[unitId]/page.tsx` — add button.

---

### 2.6 S3-009: Admin KYC Review Queue

**What to build:**

Backend:
- `GET /api/v1/admin/kyc?status=pending&page=1&limit=20` — list pending KYC submissions.
  - Returns: `[{ "document_id": "...", "user_id": "...", "user_phone": "...", "user_name": "...", "front_side_url": "...", "back_side_url": "...", "selfie_url": "...", "submitted_at": "..." }]`
  - Admin/operations role required.
- `POST /api/v1/admin/kyc/{document_id}/approve` — approve KYC.
  - Sets `kyc_status = VERIFIED`.
  - Triggers SMS notification.
- `POST /api/v1/admin/kyc/{document_id}/reject` — reject KYC.
  - Request body: `{ "reason": "..." }`
  - Sets `kyc_status = REJECTED`.
  - Triggers SMS notification with reason.

Frontend:
- `apps/web/app/[locale]/admin/kyc/page.tsx` — KYC review queue page.
  - Table of pending submissions: name, phone, submitted date, view button.
  - Click row → detail view: show ID front, ID back, selfie side by side.
  - Approve button (green) and Reject button (red) with reason input.
  - After action: remove from queue, show next item.

**Acceptance criteria:**
- [ ] Admin can see all pending KYC submissions.
- [ ] Admin can view ID documents and selfie.
- [ ] Admin can approve → host status becomes VERIFIED.
- [ ] Admin can reject with reason → host status becomes REJECTED.
- [ ] SMS notification sent on approve/reject.
- [ ] Page works in Arabic RTL.
- [ ] Only admin/operations role can access.

**Files to modify:**
- `src/app/kyc/router.py` — add queue + approve/reject endpoints.
- `src/app/kyc/services.py` — add manual review functions.
- `apps/web/app/[locale]/admin/kyc/page.tsx` — new page.
- `apps/web/app/[locale]/admin/kyc/[documentId]/page.tsx` — detail page.
- `apps/web/lib/queries/admin.ts` — new query hooks.

---

### 2.7 S3-010: Admin Listing Verification Queue

**What to build:**

Backend:
- `GET /api/v1/admin/listings?status=PENDING_VERIFICATION&page=1&limit=20` — list pending listings.
  - Returns: `[{ "unit_id": "...", "title": "...", "host_name": "...", "host_phone": "...", "city": "...", "district": "...", "base_price_egp": ..., "photo_count": ..., "submitted_at": "..." }]`
  - Admin/operations role required.
- `POST /api/v1/admin/listings/{unit_id}/approve` — approve listing.
  - Transitions PENDING_VERIFICATION → LISTED.
  - Triggers SMS notification.
- `POST /api/v1/admin/listings/{unit_id}/reject` — reject listing.
  - Request body: `{ "reason": "..." }`
  - Transitions PENDING_VERIFICATION → UNLISTED.
  - Triggers SMS notification.

Frontend:
- `apps/web/app/[locale]/admin/listings/page.tsx` — listing verification queue page.
  - Table of pending listings: title, host, location, price, photo count, submitted date.
  - Click row → detail view: show listing details + photos.
  - Approve button (green) and Reject button (red) with reason input.

**Acceptance criteria:**
- [ ] Admin can see all pending listings.
- [ ] Admin can view listing details and photos.
- [ ] Admin can approve → listing goes live (LISTED).
- [ ] Admin can reject with reason → listing becomes UNLISTED.
- [ ] SMS notification sent on approve/reject.
- [ ] Page works in Arabic RTL.
- [ ] Only admin/operations role can access.

**Files to modify:**
- `src/app/listings/router.py` — add admin queue + approve/reject endpoints.
- `src/app/listings/services.py` — add admin review functions.
- `apps/web/app/[locale]/admin/listings/page.tsx` — new page.
- `apps/web/app/[locale]/admin/listings/[unitId]/page.tsx` — detail page.
- `apps/web/lib/queries/admin.ts` — add listing queue hooks.

---

### 2.8 S3-011: CSV Import (Simplified)

**What to build:**

Backend:
- `POST /api/v1/admin/listings/import` — accepts CSV file upload.
  - Parse CSV rows.
  - For each row: create Unit + UnitListing in DRAFT status.
  - Required fields: `title_ar`, `city`, `governorate`, `district`, `lat`, `lng`, `property_type`, `max_guests`, `bedrooms`, `bathrooms`, `base_price_egp`.
  - Optional fields: `title_en`, `description_ar`, `amenities` (comma-separated), `cultural_tags` (comma-separated), `cleaning_fee_egp`, `min_nights`, `weekend_multiplier`.
  - `host_id` set to NULL (admin-owned) or to a specified host phone (lookup or create user).
  - Return: `{ "total": 20, "success": 18, "failed": 2, "errors": [{ "row": 3, "error": "Missing title_ar" }, ...] }`
  - No photo URL download. Photos are uploaded manually after import.
  - Admin/operations role required.

Frontend:
- `apps/web/app/[locale]/admin/import/page.tsx` — CSV upload page.
  - File select + upload button.
  - Results display: success count, failure count, error details per row.
  - Download CSV template button.

**Acceptance criteria:**
- [ ] Admin can upload a CSV file.
- [ ] Valid rows create listings in DRAFT status.
- [ ] Invalid rows show error messages with row number.
- [ ] 20+ listings can be imported in one upload.
- [ ] Page works in Arabic RTL.
- [ ] Only admin/operations role can access.

**Files to modify:**
- `src/app/listings/router.py` — add import endpoint.
- `src/app/listings/services.py` — add CSV parser + bulk create function.
- `apps/web/app/[locale]/admin/import/page.tsx` — new page.
- `apps/web/lib/queries/admin.ts` — add import mutation.

---

### 2.9 S3-008: SMS Notifications

**What to build:**

Backend:
- Add event emission in `src/app/kyc/services.py`:
  - On KYC approve: emit `kyc.approved` event with user_id, phone, locale.
  - On KYC reject: emit `kyc.rejected` event with user_id, phone, locale, reason.
- Add event emission in `src/app/listings/services.py`:
  - On listing submit: emit `listing.submitted` event.
  - On listing approve: emit `listing.approved` event.
  - On listing reject: emit `listing.rejected` event with reason.
- Add channel mapping in `src/app/notifications/services.py:channels_for_event()`:
  - `kyc.approved` → SMS
  - `kyc.rejected` → SMS
  - `listing.submitted` → SMS (to admin)
  - `listing.approved` → SMS (to host)
  - `listing.rejected` → SMS (to host)
- Add Arabic SMS templates in `src/app/notifications/templates.py`:
  - `kyc.approved`: "تم توثيق هويتك بنجاح. يمكنك الآن نشر عقاراتك على StayOS."
  - `kyc.rejected`: "لم يتم قبول وثائقك. السبب: {reason}. يرجى إعادة رفع وثائق صحيحة."
  - `listing.approved`: "تم نشر عقارك بنجاح! تقدر تشوفه على: {listing_url}"
  - `listing.rejected`: "لم يتم قبول عقارك. السبب: {reason}. يرجى تعديله وإعادة إرساله."
  - `listing.submitted` (to admin): "قائمة جديدة بانتظار المراجعة: {title}"

**Acceptance criteria:**
- [ ] When admin approves KYC, host receives Arabic SMS within 5 minutes.
- [ ] When admin rejects KYC, host receives Arabic SMS with reason within 5 minutes.
- [ ] When admin approves listing, host receives Arabic SMS with listing URL within 5 minutes.
- [ ] When admin rejects listing, host receives Arabic SMS with reason within 5 minutes.
- [ ] SMS uses Twilio (existing integration).
- [ ] No WhatsApp. SMS only.

**Files to modify:**
- `src/app/kyc/services.py` — add event emission.
- `src/app/listings/services.py` — add event emission.
- `src/app/notifications/services.py` — add channel mapping.
- `src/app/notifications/templates.py` — add Arabic SMS templates.

---

### 2.10 S3-018: Payment Checkout

**What to build:**

Backend:
- `POST /api/v1/bookings/{booking_id}/payment-intent` — create Paymob payment intent.
  - Returns: `{ "payment_url": "https://...", "iframe_id": "...", "manual_fallback": false }`
  - If Paymob is not configured: return `{ "manual_fallback": true, "instructions": "Transfer to bank account..." }`
- `POST /api/v1/admin/bookings/{booking_id}/confirm-payment` — manual payment confirmation.
  - Admin confirms payment received externally.
  - Sets booking payment_status = PAID.
  - Triggers booking confirmation.
- Update Paymob webhook handler (existing) to handle payment success/failure.
  - On success: set booking payment_status = PAID, send SMS to host and guest.
  - On failure: set booking payment_status = FAILED, send SMS to guest.

Frontend:
- `apps/web/app/[locale]/bookings/[bookingId]/checkout/page.tsx` — checkout page.
  - Display: nightly rate × nights + cleaning fee + service fee = total (in EGP).
  - If Paymob: show Paymob iframe.
  - If manual: show bank transfer instructions and "Founder will confirm your payment within 1 hour."
  - "Pay Now" button (Paymob) or "I've Transferred" button (manual).
  - On success: show booking confirmation with check-in instructions.

**Acceptance criteria:**
- [ ] Guest can see total price breakdown before paying.
- [ ] If Paymob works: guest pays via iframe, booking auto-confirmed.
- [ ] If Paymob fails: guest sees bank transfer instructions, founder confirms manually.
- [ ] Booking status transitions correctly: PENDING → CONFIRMED.
- [ ] SMS sent to guest and host on confirmation.
- [ ] Page works in Arabic RTL.
- [ ] Price displayed in EGP.

**Files to modify:**
- `src/app/reservations/router.py` or `src/app/finance/router.py` — add payment intent + confirm endpoints.
- `src/app/finance/services.py` — add payment intent creation.
- `apps/web/app/[locale]/bookings/[bookingId]/checkout/page.tsx` — new page.
- `apps/web/lib/queries/bookings.ts` — add payment hooks.

---

### 2.11 V-01: Real Arabic Copy

**What to build:**
- Replace ALL placeholder i18n keys in guest-facing pages with real Arabic text.
- Pages to update:
  - Landing page (`apps/web/app/[locale]/page.tsx`)
  - Search page (`apps/web/app/[locale]/search/page.tsx`)
  - Listing detail page (`apps/web/app/[locale]/listings/[unitId]/page.tsx`)
  - Auth/login page (`apps/web/app/[locale]/auth/login/page.tsx`)
  - Checkout page (new — from S3-018)
  - Host listing creation page (new — from S3-003)
  - Admin pages (new — from S3-009, S3-010, S3-011)
- Arabic text must be native, not machine-translated. Hire a native Arabic speaker for 2-3 days if needed.
- Update `apps/web/messages/ar.json` with all new keys.

**Acceptance criteria:**
- [ ] All guest-facing text is real Arabic, not placeholder keys.
- [ ] Text is natural and native, not translated.
- [ ] RTL layout is correct.
- [ ] No English text visible on Arabic pages (except brand names, currency codes).

**Files to modify:**
- `apps/web/messages/ar.json` — add all keys.
- Any page with placeholder text.

---

### 2.12 V-02: Verified Host Badge

**What to build:**
- On listing detail page, show a green badge next to host name when `host.kyc_status == VERIFIED`.
- Badge text: "مضيف موثّق" (Verified Host).
- Badge icon: simple green checkmark (use Lucide `BadgeCheck` or similar).
- If host is not verified, show nothing (no "unverified" badge).

**Acceptance criteria:**
- [ ] Badge visible only for verified hosts.
- [ ] Badge is green with checkmark icon.
- [ ] Badge text is "مضيف موثّق".
- [ ] Badge does not appear for unverified hosts.

**Files to modify:**
- `apps/web/app/[locale]/listings/[unitId]/page.tsx` — add badge component.
- `apps/web/components/listings/VerifiedBadge.tsx` — new component (if needed).

---

### 2.13 V-03: Cultural Tag Filter Chips

**What to build:**
- On search page, add a row of toggle filter chips below the search bar.
- Chips: "عائلي" (Family-friendly), "حلال" (Halal-certified), "للعائلات فقط" (Families only).
- Clicking a chip toggles the filter. Multiple chips can be active.
- Active chips send `cultural_tags` parameter to search API: `GET /api/v1/listings?cultural_tags=family_friendly,halal_certified`
- Backend already supports `cultural_tags` filter (confirmed in gap analysis — `src/app/listings/services.py` supports cultural tags in search).

**Acceptance criteria:**
- [ ] Filter chips visible on search page.
- [ ] Clicking a chip filters search results.
- [ ] Multiple chips can be active simultaneously.
- [ ] Chip labels are in Arabic.
- [ ] Results update when chips are toggled.

**Files to modify:**
- `apps/web/app/[locale]/search/page.tsx` — add filter chips.
- `apps/web/components/search/CulturalTagFilter.tsx` — new component.

---

### 2.14 V-04: Escrow Trust Message

**What to build:**
- On checkout page (from S3-018), display a trust message above the pay button.
- Message: "دفعتك محفوظة بأمان في حساب ضمان حتى تسجيل وصولك. يتم تحويلها للمضيف بعد ذلك." (Your payment is held securely in escrow until your check-in. It's transferred to the host after that.)
- Style: light blue background, lock icon, Arabic text.

**Acceptance criteria:**
- [ ] Message visible on checkout page above pay button.
- [ ] Message is in Arabic.
- [ ] Lock icon present.
- [ ] Message does not appear on non-checkout pages.

**Files to modify:**
- `apps/web/app/[locale]/bookings/[bookingId]/checkout/page.tsx` — add message component.

---

### 2.15 V-05: Cancellation Policy Text

**What to build:**
- On checkout page, display cancellation policy below the price breakdown.
- Text: "إلغاء مجاني حتى 48 ساعة قبل موعد الوصول. بعد ذلك، استرد 50% من المبلغ. لا استرداد بعد الوصول." (Free cancellation up to 48 hours before check-in. After that, 50% refund. No refund after check-in.)
- Style: gray text, small font, Arabic.

**Acceptance criteria:**
- [ ] Policy text visible on checkout page.
- [ ] Text is in Arabic.
- [ ] Text is below price breakdown, above pay button.

**Files to modify:**
- `apps/web/app/[locale]/bookings/[bookingId]/checkout/page.tsx` — add policy text.

---

## Section 3 — Day-0 Inventory Strategy

### Source 1: Founder Network

| Field | Value |
|-------|-------|
| Expected listings | 6-8 |
| Conversion assumption | 30-40% of 20 contacts |
| Required engineering | None (listing form + photo upload from Sprint 3) |
| Required operations | Founder calls, visits properties, takes photos, creates listings |
| Priority | P0 — first source |
| Launch phase | Week 3 (platform ready) |

### Source 2: Property Management Companies

| Field | Value |
|-------|-------|
| Expected listings | 15-25 |
| Conversion assumption | 30-50% of 10 contacted companies sign. Each brings 5-10 units. |
| Required engineering | CSV import (S3-011) |
| Required operations | Founder meetings, CSV collection, photo upload by ops |
| Priority | P0 — second source |
| Launch phase | Week 3-4 |

### Source 3: Real Estate Agencies

| Field | Value |
|-------|-------|
| Expected listings | 5-10 |
| Conversion assumption | 30-40% of 5 contacted agencies sign. Each brings 3-5 units. |
| Required engineering | CSV import (S3-011) |
| Required operations | Founder meetings, CSV collection |
| Priority | P1 — third source |
| Launch phase | Week 4-5 |

### Source 4: Developers with Rental Inventory

| Field | Value |
|-------|-------|
| Expected listings | 5-10 |
| Conversion assumption | 30% of 3 contacted developers sign. Each brings 5-10 units. |
| Required engineering | CSV import (S3-011) |
| Required operations | Founder meetings, compound visits |
| Priority | P1 — fourth source |
| Launch phase | Week 4-5 |

### Source 5: Manual Seeding by Operations

| Field | Value |
|-------|-------|
| Expected listings | 5-10 |
| Conversion assumption | Ops hire finds 5-10 listings from Facebook/OLX, contacts owners, creates listings |
| Required engineering | Listing form + photo upload |
| Required operations | Ops hire: research, outreach, listing creation |
| Priority | P1 — supplementary |
| Launch phase | Week 4-6 |

### Source 6: CSV Imports

| Field | Value |
|-------|-------|
| Expected listings | 25-45 (combined from Sources 2, 3, 4) |
| Conversion assumption | Depends on B2B conversion |
| Required engineering | S3-011 CSV import endpoint + frontend |
| Required operations | Founder/ops validates CSV, uploads photos post-import |
| Priority | P0 — enabler |
| Launch phase | Week 3-6 |

### Source 7: Claimable Listings — POST-MVP

| Field | Value |
|-------|-------|
| Expected listings | 0 in alpha |
| Required engineering | S3-012, S3-013 (NOT IN SPRINT 3 SCOPE) |
| Priority | POST-MVP |
| Launch phase | V1.1 (after 100+ listings) |

### Source 8: Self-Service Host Onboarding — POST-MVP

| Field | Value |
|-------|-------|
| Expected listings | 0 in alpha (60%+ of hosts need founder assistance) |
| Required engineering | S3-003 listing form is the foundation |
| Priority | POST-MVP |
| Launch phase | V1.1 (after product-market fit) |

### Day-0 Inventory Plan

| Milestone | Target | Sources | Timeline |
|-----------|--------|---------|----------|
| First 10 listings | 10 | Founder network (6-8) + first agency CSV (2-4) | Week 4 |
| First 25 listings | 25 | Founder network (8) + 2 agencies CSV (12) + 1 developer (5) | Week 5 |
| First 50 listings | 50 | Founder network (8) + 3 agencies (20) + 1 developer (10) + manual seeding (12) | Week 6-7 |
| First 100 listings | 100 | Above (50) + 2 more agencies (20) + referrals (10) + self-service (20) | Month 3 |

**Total engineering required for Day-0: S3-003 (listing form), S3-004 (photo upload), S3-011 (CSV import). All are in Sprint 3 mandatory scope.**

**Total operations required: Founder + 1 ops hire. No additional team needed for 50 listings.**

---

## Section 4 — EXECUTIVE GO / NO-GO DECISION

### Decision: GO WITH CONDITIONS

Sprint 3 implementation is authorized to begin immediately, subject to the following conditions:

### Conditions

1. **Vision features (V-01 through V-05) are mandatory.** These 4.5 SP of features are not optional. Without them, the MVP does not prove the StayOS vision. Engineering must deliver them as part of Sprint 3.

2. **Alpha duration is 6 weeks, not 4.** The supply and demand forecasts are optimistic. 6 weeks provides buffer.

3. **All supply concentrated in New Cairo.** No 6th October, no Zamalek, no Maadi until New Cairo has 50 listings.

4. **Operations hire by Week 2 of alpha.** Budget EGP 15,000-20,000/month. Founder delegates KYC review, listing review, and support.

5. **No paid acquisition until 50+ listings and 10+ organic bookings.** Paid traffic to a thin marketplace is waste.

6. **Legal documents published before processing payments.** Terms of service, privacy policy, cancellation policy — template documents reviewed by a lawyer.

7. **Weekly committee report every Sunday.** 1-page status with the 10 KPIs from `05_ALPHA_SUCCESS_SCORECARD.md`.

8. **If Paymob is not confirmed by Day 13 of engineering, build manual confirmation only.** Do not wait. Manual confirmation with 1-hour SLA is the alpha fallback.

9. **If supply falls below 20 listings by Week 4, founder drops all other work and does manual seeding.** No exceptions.

10. **This contract is the only source of truth.** No feature, endpoint, page, or component outside this contract may be built without Executive approval from the Program Director.

### Why GO

- The engineering foundation is strong (326 tests, modular architecture, working auth, search, booking, calendar, pricing).
- The supply strategy is viable (founder network + agencies + CSV import).
- The demand strategy is viable (warm contacts for alpha).
- The scope is correctly reduced (29.5 SP, 18 days, 3.5 weeks).
- The vision features (4.5 SP) prove the differentiators.
- The founder playbook is complete and realistic.
- The risk register identifies 1 critical risk (P-01) with a clear mitigation (4.5 SP of vision features).
- The financial model shows 15-22 months of runway.
- The stop-doing list prevents future drift.

### What Would Make This NO-GO

- If engineering refuses to build the vision features (V-01 through V-05)
- If the founder cannot commit to 6 weeks of full-time alpha operations
- If S3 buckets cannot be configured (blocks all photo upload)
- If no legal entity can be formed before processing payments

None of these are currently blocking. All are addressable.

### Authorization

| Role | Approval | Date |
|------|----------|------|
| Executive Program Director | APPROVED | 2026-08-03 |
| Chief Product Officer | APPROVED | 2026-08-03 |
| CEO | APPROVED | 2026-08-03 |
| Founder | APPROVED | 2026-08-03 |
| PMO Director | APPROVED | 2026-08-03 |
| CTO | APPROVED | 2026-08-03 |
| Marketplace Director | APPROVED | 2026-08-03 |

**Sprint 3 implementation is authorized to begin on 2026-08-04.**

---

## Final Statement

> This contract is the last document. There are no more reviews, no more committees, no more strategy sessions. Engineering builds what's in this contract. The founder executes the playbook. The committee monitors the scorecard.
>
> If the team builds everything in this contract, at the end of Sprint 3 a guest will open StayOS and see: Arabic text that feels native, cultural filters that no other platform offers, verified host badges that signal trust, escrow protection that makes payment feel safe, and a checkout that accepts Egyptian pounds.
>
> That is not Airbnb. That is StayOS.
>
> Build it.
