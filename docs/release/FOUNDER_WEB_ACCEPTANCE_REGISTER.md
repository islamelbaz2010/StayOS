# FOUNDER WEB ACCEPTANCE REGISTER — StayOS

**Version**: 2.0.0
**Date**: 2026-09-20
**Branch**: `product-completion-review` @ `d534c37`
**Purpose**: Founder personally reviews the deployed web product before mobile behavior is frozen.
**Companion**: `StayOS_Technical_Release_Review_Master_2026-09-20_v2.xlsx` sheet `05_WEB_ACCEPTANCE` / `06_FOUNDER_OBSERVATIONS`

## How to review

**Deployed web (Vercel preview)**: `https://stayos-git-product-completion-review-islam-elbaz-s-projects.vercel.app` (302 → `/en`; switch to `/ar` for Arabic). **Vercel SSO protection is ON — sign in to Vercel as the project owner first.**
**API**: `https://stayos-demo-production.up.railway.app` (`/docs` for Swagger)
**Login**: Dev Login on `/en/auth/login` — Guest `seed-accept-gues-0000-000000000001`, Host `seed-host-0000-0000-000000000002` (Omar Hassan, KYC-verified), Admin `seed-admin-0000-0000-000000000001`, Staff fixture available. **New**: "Email" tab supports real email+password register/login; phone OTP via Akedly is live-verified. Google/Apple buttons are disabled until Firebase is configured (RB-19).
**Seed listings**: Zamalek `seed-unit-…0001` (request-to-book), Maadi `seed-unit-…0002` (instant book).
**Known cosmetic note**: presign uploads return 503 until AWS storage vars are set — photo/proof/KYC-document uploads cannot complete on the deployed env yet (release blocker RB-02, not a product defect).

## Hardening results (2026-09-20 cycle)

ENGINEERING VERIFIED = reproduced → root-caused → fixed → regression-tested → verified on the live API and in a real browser session. **FOUNDER VISUAL ACCEPTANCE still pending** — engineering verification is not Founder acceptance.

| Item | Result | Verification |
|------|--------|--------------|
| Booking calendar | FIXED — month navigation beyond ~90 days now works; availability fetch uses a sliding window over the two visible months; selections persist across navigation | ENGINEERING VERIFIED (browser: 5 months forward, 39→59 enabled days, range persisted; live API accepts far-future windows) |
| Staff management | FIXED — `phone_number` now enforces E.164 (previously any 8–20 chars were stored, producing accounts that could never log in via OTP); modal shows real API errors; one pre-fix staff row normalized `01090677722 → +20109067722` | ENGINEERING VERIFIED (live: non-E.164 → 422, E.164 → 201; browser: list, modal, client-side validation) |
| Email + password auth | IMPLEMENTED — `POST /auth/register`, `POST /auth/login`, `POST /auth/password`; login/register pages have a Phone/Email toggle; Profile has a set/change-password section | ENGINEERING VERIFIED (live: register/login/wrong-pw/duplicate/change/delete all correct; UI register flow completed in browser) |
| Header/Footer navigation | FIXED — `field_staff` no longer receives `/admin` links that ProtectedRoute rejects; staff links filtered by granted permissions | ENGINEERING VERIFIED (browser: guest, host, admin states) |
| Profile vs Account consistency | FIXED — host-profile saves now refresh the auth-user cache (`/profile` and `/host/profile` stay consistent); single source of truth remains `auth.users` | ENGINEERING VERIFIED (browser: `/profile` renders password section + correct identity) |
| Admin Payment Details 500 | FIXED — `get_payment` eager-loads `unit→listing→cover_photo` + `unit→photos` (was `MissingGreenlet` on async lazy-load) | ENGINEERING VERIFIED (live: all 3 queue items → 200 with `unit_cover_image`) |
| Payment Queue images | FIXED earlier pass — canonical cover resolution (`cover_photo` → `is_cover` → first live photo); `unit_cover_image` populated on all queue rows | ENGINEERING VERIFIED (live payload inspection) |
| Notifications/state refresh | Retained — 30s polling on operational lists + pending-count badges in header/sidebar | ENGINEERING VERIFIED (code + earlier live check) |
| Listing approval | Verified — submit → queue (with `pending_photos` diff) → approve → persisted → host sees result; photo-only change-sets approve cleanly | ENGINEERING VERIFIED (live lifecycle + regression test `test_approve_photo_only_edit_publishes_photos`) |
| Google/Apple sign-in | CONFIGURATION BLOCKER — Firebase not configured; buttons render disabled; no broken UX | Code path exists; creds absent (verified live) |

## Classification codes

A. BENCHMARK-COMPLIANT · B. TECHNICAL DEFECT · C. RELEASE BLOCKER · D. FOUNDER DECISION · E. FOUNDER OBSERVATION · F. DIFFERENTIATION IDEA · G. LEGAL/COMMERCIAL QUESTION

---

## CONSUMER surfaces

| ID | Surface | Route | Current behavior (verified) | Benchmark status | Type | Status |
|----|---------|-------|-----------------------------|------------------|------|--------|
| WEB-CON-01 | Landing | `/en` | CategoryChips, PopularDestinations, TrustSignals, RecentlyViewed | Compliant | A | REVIEW |
| WEB-CON-02 | Search results | `/en/search` | URL-driven filters, list/map toggle, bounds search, sort (price/rating), date-filtered all-in `total_egp` cards | Compliant | A | REVIEW |
| WEB-CON-03 | Filters | `/en/search` | guests, price, rooms, type/category, amenities, free-cancellation, instant-book, self-checkin, accessibility, pets, host-language | Compliant (guest-type split = FD-03) | A / D | REVIEW |
| WEB-CON-04 | Map | `/en/search` | map mode + `sw/ne` bounds queries | Compliant; OPPO device toggle bug is mobile-only | A | REVIEW |
| WEB-CON-05 | Listing cards | `/en/search`, `/en` | nightly price; all-in trip total when dates selected | Compliant | A | REVIEW |
| WEB-CON-06 | Listing detail | `/en/listings/{id}` | gallery, fee breakdown, **availability calendar (new)**, amenities, sleeping arrangements, rules, policies, host card, reviews w/ **keyword search (new)**, subratings, map+directions, share, favorite, contact host, similar + host listings | Compliant | A | REVIEW |
| WEB-CON-07 | Booking panel | listing detail | dates + calendar select, guests split (adults/children/infants), quote + fees, instant-book badge, KYC gate | Compliant | A | REVIEW |
| WEB-CON-08 | Request-to-book | listing detail → booking | request → host accept/expire(24h) → pay → confirmed | Compliant | A | REVIEW |
| WEB-CON-09 | Instant Book | instant-book listing | auto-accept → pay | Compliant | A | REVIEW |
| WEB-CON-10 | Checkout/payment | `/en/checkout/{bookingId}` | manual instructions (bank + Vodafone Cash **placeholders**), proof upload (503 until AWS set), 24h deadline, 3 resubmissions/48h | Compliant — **placeholder accounts = release blocker RB-01** | C | REVIEW |
| WEB-CON-11 | Trips | `/en/bookings`, `/en/bookings/{id}` | upcoming/past/cancelled, statuses (booking+payment+refund), cancel w/ preview, check-in info gating, review eligibility | Compliant | A | REVIEW |
| WEB-CON-12 | Cancellation | trip detail | preview → tiered refund → status | Compliant | A | REVIEW |
| WEB-CON-13 | Messaging | `/en/messages`, `/en/messages/{id}` | inquiry + reservation + support threads, unread, notify | Compliant | A | REVIEW |
| WEB-CON-14 | Notifications | bell/in-app | outbox-driven notifications + deep links | Compliant | A | REVIEW |
| WEB-CON-15 | Favorites | `/en/favorites` | save/list | Compliant | A | REVIEW |
| WEB-CON-16 | KYC | `/en/kyc` | initiate → upload (503 until AWS) → pending → manual admin review | Compliant; automation = FD-02 | A / C / D | REVIEW |
| WEB-CON-17 | Arabic/English + RTL | `/{locale}/*` | 1445-key parity both directions, `dir` switching, ar-EG formats | Compliant | A | REVIEW |
| WEB-CON-18 | Responsive/loading/empty/error states | all | skeletons, empty states, retry buttons, inline errors | Compliant | A | REVIEW |

## HOST surfaces

| ID | Surface | Route | Current behavior | Benchmark status | Type | Status |
|----|---------|-------|------------------|------------------|------|--------|
| WEB-HST-01 | Dashboard/Today | `/en/host` | actionable events ("Needs check-in" etc.) | Compliant | A | REVIEW |
| WEB-HST-02 | Listings | `/en/host/listings` | list, draft→publish, edit | Compliant | A | REVIEW |
| WEB-HST-03 | Create listing | `/en/host/listings/new` | full create form (all ListingCreate fields) | Compliant | A | REVIEW |
| WEB-HST-04 | Edit listing | `/en/host/listings/{id}/edit` | edit + moderation outcome visible | Compliant | A | REVIEW |
| WEB-HST-05 | Photos | `/en/host/listings/{id}/photos` | presigned upload + reorder + cover (503 until AWS) | Compliant; blocked by RB-02 | A / C | REVIEW |
| WEB-HST-06 | Availability | `/en/host/listings/{id}/availability`, `/en/host/availability/{id}` | calendar rules, blocks | Compliant | A | REVIEW |
| WEB-HST-07 | Calendar | `/en/host/calendar` | host calendar view | Compliant | A | REVIEW |
| WEB-HST-08 | Booking requests | `/en/host/bookings` | accept/reject, 24h expiry, detail | Compliant | A | REVIEW |
| WEB-HST-09 | Earnings | `/en/host/earnings` | earnings + payment activity | Compliant; payout method config deferred | A | REVIEW |
| WEB-HST-10 | Co-hosts | `/en/host/listings/{id}/co-hosts` | co-host management | Compliant | A | REVIEW |
| WEB-HST-11 | Host profile | `/en/host/profile`, `/en/hosts/{id}` | editable profile + public host page | Compliant | A | REVIEW |
| WEB-HST-12 | Host KYC | `/en/host/kyc` | KYC submission/status | Compliant; blocked by RB-02 for upload | A / C | REVIEW |
| WEB-HST-13 | Host reviews guest | booking detail | host review form | Compliant | A | REVIEW |

## ADMIN / OPERATIONS surfaces

| ID | Surface | Route | Current behavior | Benchmark status | Type | Status |
|----|---------|-------|------------------|------------------|------|--------|
| WEB-ADM-01 | Admin home | `/en/admin` | ops overview | Non-benchmark ops | A | REVIEW |
| WEB-ADM-02 | KYC queue | `/en/admin/kyc` | manual review approve/reject | Compliant | A | REVIEW |
| WEB-ADM-03 | Listing moderation | `/en/admin/pending` | moderation queue | Compliant | A | REVIEW |
| WEB-ADM-04 | Payments | `/en/admin/payments`, `/en/admin/payments/{id}` | proof review verify/reject | Compliant | A | REVIEW |
| WEB-ADM-05 | Bookings | `/en/admin/bookings` | read-only booking ops view; admin cannot accept/reject | Compliant | A | REVIEW |
| WEB-ADM-06 | Disputes | `/en/admin/disputes` | dispute handling + reporter support replies | Compliant | A | REVIEW |
| WEB-ADM-07 | Staff | `/en/admin/staff` | staff roles/permissions | Compliant | A | REVIEW |
| WEB-ADM-08 | Discovery | `/en/admin/discovery` | discovery admin | Non-benchmark ops | E (non-benchmark) | REVIEW |
| WEB-ADM-09 | Import | `/en/admin/import` | listing import | Non-benchmark ops | E | REVIEW |

---

## FOUNDER OBSERVATION REGISTER (blank — fill during review)

| ID | Surface | Route | Current Behavior | Benchmark Status | Observation | Type | Decision Required? | Potential Impact | Status |
|----|---------|-------|------------------|------------------|-------------|------|--------------------|------------------|--------|
| WEB-OBS-001 | | | | | | | | | OPEN |
| WEB-OBS-002 | | | | | | | | | OPEN |
| WEB-OBS-003 | | | | | | | | | OPEN |
| WEB-OBS-004 | | | | | | | | | OPEN |
| WEB-OBS-005 | | | | | | | | | OPEN |
| WEB-OBS-006 | | | | | | | | | OPEN |
| WEB-OBS-007 | | | | | | | | | OPEN |
| WEB-OBS-008 | | | | | | | | | OPEN |
| WEB-OBS-009 | | | | | | | | | OPEN |
| WEB-OBS-010 | | | | | | | | | OPEN |

*(Duplicate rows as needed. Engineering does not implement observations automatically — each is triaged into defect / decision / differentiation first.)*
