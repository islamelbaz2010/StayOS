# FOUNDER WEB ACCEPTANCE REGISTER — StayOS

**Version**: 3.0.0
**Date**: 2026-09-20
**Branch**: `product-completion-review` @ `d37fa6d`
**Purpose**: Founder personally reviews the deployed web product before mobile behavior is frozen.
**Companion**: `StayOS_Technical_Release_Review_Master_2026-09-20_v2.xlsx` sheet `05_WEB_ACCEPTANCE` / `06_FOUNDER_OBSERVATIONS`

## How to review

**Deployed web (Vercel preview)**: `https://stayos-git-product-completion-review-islam-elbaz-s-projects.vercel.app` (302 → `/en`; switch to `/ar` for Arabic). **Vercel SSO protection is ON — sign in to Vercel as the project owner first.**
**API**: `https://stayos-demo-production.up.railway.app` (`/docs` for Swagger)
**Login**: Dev Login on `/en/auth/login` — Guest `seed-accept-gues-0000-000000000001`, Host `seed-host-0000-0000-000000000002` (Omar Hassan, KYC-verified), Admin `seed-admin-0000-0000-000000000001`, Staff fixture available. **New**: "Email" tab supports real email+password register/login; phone OTP via Akedly is live-verified. Google/Apple buttons are disabled until Firebase is configured (RB-19).
**Seed listings**: Zamalek `seed-unit-…0001` (request-to-book), Maadi `seed-unit-…0002` (instant book).
**Known cosmetic note**: presign uploads return 503 until AWS storage vars are set — photo/proof/KYC-document uploads cannot complete on the deployed env yet (release blocker RB-02, not a product defect).

## Founder retest — defect closure pass 2 (2026-09-20, `d37fa6d`)

The Founder personally retested the preview and overrode earlier engineering claims. Five items were FAIL; all five were reproduced, root-caused, fixed, regression-tested, deployed, and re-verified in a real browser session against the deployed API. **FOUNDER VISUAL RE-ACCEPTANCE still pending.**

| Item | Founder result | Root cause | Fix | Engineering verification |
|------|----------------|------------|-----|--------------------------|
| Booking calendar | FAIL | `AvailabilityCalendar.rangeBlocked()` silently reset the pending check-in when a selected range crossed unavailable days — the user's check-in vanished with no message (reproduced: check-in Sep 22 → 5 months forward → check-out Feb 11 → check-in was replaced by Feb 11) | Calendar now completes the range; `BookingPanel`'s existing blocked-date check shows "dates unavailable" and keeps submit disabled | Browser: check-in 2026-10-11 → 5 months fwd → check-out 2027-03-10 persisted; clear/reselect works; valid range Oct 25→28 submitted → "Booking requested / Status: Requested"; regression test covers the blocked-range case |
| Staff creation | FAIL | Three defects: (1) UI read `response.data.detail` but the API error envelope is `error.message` → real 409 reason was swallowed into "Could not create staff account"; (2) duplicate email hit `users_email_key` → opaque 500; (3) `email` was plain `str` → invalid values accepted | UI uses `getApiErrorMessage`; backend normalizes email + pre-checks uniqueness → 409; email pattern validated (422); modal converted to a real `<form>` with `type="email"` | Browser: `+201118000472` → "Phone number already belongs to an existing account"; local phone → E.164 hint; `not-an-email` blocked by browser validation; fresh staff created and listed. Live API: dup email → 409, invalid → 422 |
| Email/password | PASS | — | Unchanged | PASS — UNCHANGED |
| Header/Footer | FAIL | Staff with zero active permission grants received an `/admin` link that 403s (`_require_console_access`); anonymous visitors got a footer "Account" link to the login-walled `/profile`; ops roles were missing Search in the footer (contradicting header); `field_staff` got an empty workspace column | Admin link/footer links now gated on `staff_permissions` matching the backend rule; anon Account → Sign in; Search shown for all roles; empty workspace column suppressed | Browser: link inventory verified for anon/guest/host/admin/staff — no dead-end links; 14-case role-visibility regression test |
| Profile/Account | FAIL | `PATCH /host/profile` wrote `user.email` raw: duplicate email → 500 on `users_email_key`, invalid email stored verbatim; UI showed generic `saveError` instead of the API message | Email normalized + pattern-validated (422) + uniqueness pre-check (409, self excluded); UI surfaces `error.message` | Live API: dup → 409, invalid → 422, valid → normalized 200. Browser: conflict message rendered; host display-name save → `/profile` shows updated name (auth cache refresh confirmed) |
| Payment Details | PASS | — | Unchanged | PASS — UNCHANGED |
| Payment Images | PASS | — | Unchanged | PASS — UNCHANGED |

## Founder retest — refinement pass 3 (2026-09-20)

Three remaining product/UX observations from the Founder's review. All reproduced, traced, minimally corrected, regression-tested, and browser-verified against the deployed API. **FOUNDER VISUAL RE-ACCEPTANCE still pending** — engineering verification is not Founder acceptance.

| Item | Founder result | Root cause | Fix | Engineering verification |
|------|----------------|------------|-----|--------------------------|
| Calendar per-day prices | FAIL — price labels rendered under every selectable date before any selection | `AvailabilityCalendar` rendered `day.price` unconditionally for every selectable day | Price labels now render only while a check-out is pending (`awaitingCheckout = checkIn && !checkOut`): hidden before selection, shown during range picking, hidden once the range completes — `BookingPanel` remains the pricing source of truth | Browser: day cells show only date numbers pre-selection; prices appear after check-in; hidden after check-out; booking summary shows `EGP 1,500 × 3 nights = 4,500 → Total 4,650`. Vitest: no price text pre-selection, selection + cross-month selection + totals intact |
| Staff password/sign-in lifecycle | FAIL — created staff had no visible path to a password or email sign-in | Not a missing capability: OTP login is role-agnostic, `/auth/password` sets a first password, `/auth/login` accepts staff email+password — but nothing in the admin UI communicated this, and admins could not see each member's sign-in state | `StaffResponse` gains `has_password` (boolean only — hash never exposed); staff list shows a "Password set"/"OTP only" badge per member; page + create modal show the lifecycle hint ("sign in via phone OTP → Account → Set password") | Backend regression: first-password set, email login, wrong-password rejection, role/permission retention, no plaintext exposure. Browser: full lifecycle on live API — staff created → OTP-equivalent session → Set password → "Password updated" → logout → email+password login → `role=staff`, `perms=[kyc]`, `has_password=true`; wrong password → 401 |
| Header/Footer role reconciliation | FAIL — residual label↔destination mismatches after pass-2 dead-link fixes | Host nav labeled `/host/earnings` as "Payments" (duplicating the guest Payments concept) and `/host` as "List your property" (a guest CTA, lands on the host dashboard); footer repeated both | Host links relabeled to match destinations: `nav.earnings` → "Earnings", `nav.hostDashboard` → "Host dashboard" (en+ar); footer host workspace uses the same labels | Browser link inventory for all 5 roles: anon (Search/Become a host/Support/Sign in), guest (Favorites/Trips/Become a host/Payments/Messages/Account/Support), host (Search/Earnings/Messages/Host dashboard/Account/Support/My listings), admin & staff (Search/Messages/Admin/Account/Support — staff holds 6 active grants so console links are authorized). 15-case role-visibility Vitest suite |
| Profile vs Host Profile | FAIL — reported inconsistency between the two pages | Verified: both read the canonical `auth.users` row; pass-2 fixes (email normalization, 409/422, auth-cache refresh) already removed the real divergence — remaining differences are the intended separation (host bio/languages/stats/earnings vs account status/password) | No code change needed — verified consistent; shared identity (name, phone, email, verification) matches on both pages | Browser: `/profile` and `/host/profile` for the same host show identical name/phone/email state; distinct page-specific sections intact |

## Founder retest — refinement pass 4 (2026-09-20)

| Item | Founder result | Root cause | Fix | Engineering verification |
|------|----------------|------------|-----|--------------------------|
| Calendar permanently visible | FAIL — the month grid was always rendered inside the Booking Panel | `AvailabilityCalendar` was mounted unconditionally between the date inputs and the guests section | Calendar is now a popover: closed by default, opens on check-in/check-out focus/click, stays open during range selection, auto-closes when a complete range is picked, closes on Escape/outside click, reopens from either field; new `selectingCheckOut` mode lets an existing range's end date be replaced without resetting check-in. Also fixed a latent remount bug: the `[unitId]` reset effect ran after the merge effect and wiped cached availability on every remount | Browser: closed on load → opens on check-in → stays open after check-in pick → auto-closes on complete range (09-20→09-24) → reopens from check-out → replaces end (→09-28) → totals correct (EGP 1,500×4=6,000→6,150) → Escape + outside click close. Vitest: 6 popover cases + prior availability/blocked-date coverage intact |
| Guest footer terminology | FAIL — footer column heading "List your property" over a "Become a host" link; header uses "Become a host" for the same `/kyc` destination | Footer workspace heading reused `nav.host` ("List your property") for anonymous/guest — host-side terminology on a guest CTA | Guest/anon workspace heading now uses `nav.becomeHost` — same canonical label as the header for `/kyc` (EN+AR unchanged) | Browser: guest + anon footers show "Become a host" heading/link; NavVisibility tests assert the canonical label and absence of "List your property" for guest/anon |
| Password UX consistency | VERIFIED — already correct: `/profile` renders "Set password" when `has_password=false`, "Change password" + current-password field when true; role-agnostic via `/auth/me` | — | One gap fixed: `profile.role.staff` translation was missing → staff viewing `/profile` hit a MISSING_MESSAGE error; added `staff` key EN+AR | Browser: staff with password → "Change password" + Staff badge; passwordless guest → "Set password". Vitest: 11 profile-state cases incl. role badges for all 5 roles |
| Profile vs Host Profile | VERIFIED — intended separation holds: canonical identity shared, host metrics host-only | — | No change needed | Prior verification stands |

## Hardening results (2026-09-20 cycle, superseded where noted)

ENGINEERING VERIFIED = reproduced → root-caused → fixed → regression-tested → verified on the live API and in a real browser session. **FOUNDER VISUAL ACCEPTANCE still pending** — engineering verification is not Founder acceptance.

| Item | Result | Verification |
|------|--------|--------------|
| Booking calendar | FIXED — month navigation beyond ~90 days now works; availability fetch uses a sliding window over the two visible months; selections persist across navigation. **Pass 2**: silent range-reset removed (see above) | ENGINEERING VERIFIED (browser: 5 months forward, 39→59 enabled days, range persisted; live API accepts far-future windows) |
| Staff management | FIXED — `phone_number` now enforces E.164 (previously any 8–20 chars were stored, producing accounts that could never log in via OTP); modal shows real API errors; one pre-fix staff row normalized `01090677722 → +20109067722`. **Pass 2**: error envelope + duplicate-email 409 + email format (see above) | ENGINEERING VERIFIED (live: non-E.164 → 422, E.164 → 201; browser: list, modal, client-side validation) |
| Email + password auth | IMPLEMENTED — `POST /auth/register`, `POST /auth/login`, `POST /auth/password`; login/register pages have a Phone/Email toggle; Profile has a set/change-password section | ENGINEERING VERIFIED (live: register/login/wrong-pw/duplicate/change/delete all correct; UI register flow completed in browser) |
| Header/Footer navigation | FIXED — `field_staff` no longer receives `/admin` links that ProtectedRoute rejects; staff links filtered by granted permissions. **Pass 2**: zero-permission staff gate + anon Account link + Search parity (see above) | ENGINEERING VERIFIED (browser: guest, host, admin states) |
| Profile vs Account consistency | FIXED — host-profile saves now refresh the auth-user cache (`/profile` and `/host/profile` stay consistent); single source of truth remains `auth.users`. **Pass 2**: email validation/conflict + real error display (see above) | ENGINEERING VERIFIED (browser: `/profile` renders password section + correct identity) |
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

## MASTER FOUNDER DECISION CLOSURE — 2026-09-21 (COMMERCIAL + PRODUCT PACKAGE)

Changes landing on guest/host/staff-facing surfaces in this package:

| Area | Change | Founder-visible on preview |
|------|--------|----------------------------|
| Guest pricing | Total-only all-inclusive price on search/listing/booking/checkout/trip — no fee lines, "Includes all fees" | YES — requires Founder acceptance |
| Mobile | Booking + payment screens now total-only ("Includes all fees") | APK/preview |
| Profile nav | `/profile` removed from primary nav; avatar/name → profile link (FD-27) | YES |
| Staff | Role-group templates on staff creation (`GET /admin/staff/role-groups`); granular overrides retained | YES — admin staff page |
| Reviews | Guests/hosts can report a review → admin moderation queue (hide/dismiss) | YES — admin |
| Host | Earnings simulator + performance center + expanded listing readiness + custom offers + discounts + payout preferences | YES — host pages |

Internal-only (no guest surface): canonical 12% engine (6%+6% internal
allocation), payment verification → escrow/funds-held wiring, role-aware
payment serialization, Local Fit endpoint + guest preferences.

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
