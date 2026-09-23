# StayOS — Manual Acceptance Checklist

**Purpose:** the complete manual product-acceptance matrix for Founder/QA sign-off.
Each case lists actor, preconditions, steps, expected result, evidence, and status
(`PENDING` / `PASS` / `FAIL` / `BLOCKED-EXTERNAL`).

**Environment:** API `https://stayos-demo-production.up.railway.app` · Web Vercel
preview (SSO-gated) · TEST payment credentials · seed accounts via
`POST /auth/dev-token` (dev env only).

Repeat columns: mark each case **Web** now; **iOS**/**Android** when the mobile
builds exist (section 5).

---

## 1. Guest journey

| ID | Scenario | Steps | Expected | Status |
|----|----------|-------|----------|--------|
| MA-G-001 | Signup via OTP | Enter phone → OTP → verify | Account created, logged in | |
| MA-G-002 | Signup/login email+password | Register → login → logout → login | Session works both ways | |
| MA-G-003 | Search | Search governorate + dates | Relevant available listings | |
| MA-G-004 | Filters & sort | Apply price/amenity/guests filters; sort | Results constrained correctly | |
| MA-G-005 | Listing detail | Open listing | Photos, price, amenities, reviews, host | |
| MA-G-006 | Availability calendar | Open listing → calendar | Unavailable dates blocked; infants exempt from capacity (FD-03) | |
| MA-G-007 | Quote | Select dates + guests | All-inclusive total; no fee breakdown shown (FD-19) | |
| MA-G-008 | Booking request | Submit booking | Status `requested`; confirmation shown | |
| MA-G-009 | Payment | Hosted checkout (Paymob TEST card) | Payment captured; booking confirmed | |
| MA-G-010 | Trips list | Open Trips | Booking listed with status | |
| MA-G-011 | Cancellation preview | Open booking → cancel preview | Refund estimate per policy | |
| MA-G-012 | Cancel + refund | Cancel paid booking | Refund initiated; status updates | |
| MA-G-013 | Messaging host | Booking thread → send message | Delivered; unread badge for host | |
| MA-G-014 | Review | Post-stay → submit review | Published after stay; no duplicate | |
| MA-G-015 | Profile | Avatar → profile → edit name/phone | Saved; consistent with host profile if host | |
| MA-G-016 | Preferences / Local Fit | Set preferences → open listing | Fit score + explanation shown | |
| MA-G-017 | Favorites | Save → list → remove | Persists across sessions | |
| MA-G-018 | Arabic UI | Switch locale | All screens RTL/translated; EGP amounts | |

## 2. Host journey

| ID | Scenario | Steps | Expected | Status |
|----|----------|-------|----------|--------|
| MA-H-001 | Become host | Guest → Become a host → KYC initiate | KYC flow starts | |
| MA-H-002 | KYC submit | Upload docs | Pending state (manual review per FD-02) | BLOCKED-EXTERNAL for upload (S3); manual-review path testable |
| MA-H-003 | Listing create | New listing → details | Draft created | |
| MA-H-004 | Photos | Upload ≥1 photo, set cover, reorder | Stored + ordered | BLOCKED-EXTERNAL (S3) |
| MA-H-005 | Pricing & discounts | Base price + weekly/monthly/listing discount | Saved; quote reflects one applicable discount (FD-08/20) | |
| MA-H-006 | Availability rules | Block dates; bulk price/availability | Calendar enforced on guest side | |
| MA-H-007 | Readiness | Open readiness check | Missing items listed; publish gated (FD-22) | |
| MA-H-008 | Submit → moderation | Submit for review | Admin queue receives it | |
| MA-H-009 | Publish | After approval → publish | Live in search | |
| MA-H-010 | Booking request | Receive guest request → accept | Reservation confirmed | |
| MA-H-011 | Custom offer | Inquiry → create offer → guest accepts | Offer-priced booking (FD-07) | |
| MA-H-012 | Messaging | Reply to guest thread | Delivered | |
| MA-H-013 | Earnings | Open earnings | Gross/refunds/net; no guest-fee leak | |
| MA-H-014 | Earnings simulator | Simulate scenario | Canonical-engine result (FD-21) | |
| MA-H-015 | Check-in | Mark guest check-in | 24h payout clock starts | |
| MA-H-016 | Payout eligibility | After check-in+24h | Payout request enabled | |
| MA-H-017 | Payout request | Request payout | Created; wallet locked | BLOCKED-EXTERNAL for provider execution (Paymob Payouts) |
| MA-H-018 | Performance center | Open performance | Aggregates render (FD-23) | |
| MA-H-019 | Co-host | Add/remove co-host | Permissions honored | |

## 3. Admin / operations journey

| ID | Scenario | Steps | Expected | Status |
|----|----------|-------|----------|--------|
| MA-A-001 | Admin login | Staff credentials → `/admin` | Console access per permissions | |
| MA-A-002 | Users/staff | List staff; create staff; assign role group | 409 dup email; permissions enforced | |
| MA-A-003 | KYC review | Pending queue → approve/reject | User status updated | |
| MA-A-004 | Listing moderation | Pending queue → approve/reject | Host notified; listing state correct | |
| MA-A-005 | Booking oversight | Open reservation | Read-only operational detail | |
| MA-A-006 | Payment verify/reject | Manual proof queue | Verification applied | BLOCKED-EXTERNAL (S3 proof upload) |
| MA-A-007 | Refund | Issue refund on cancelled booking | Provider refund or `refund_pending` | |
| MA-A-008 | Finance | Wallet/ledger/escrow views | Balanced entries | |
| MA-A-009 | Payout process | Process eligible payout | Fail-closed without provider creds (expected) | |
| MA-A-010 | Review moderation | Report queue → hide review | Hidden from public | |
| MA-A-011 | Disputes | Open → update dispute | Status transitions | |
| MA-A-012 | Ops tasks/maintenance | Create → assign → complete | Timeline + notes | |
| MA-A-013 | Audit | Check audit trail | Actor/action/timestamp recorded | |
| MA-A-014 | CMS | See section 4 | | |

## 4. Marketing / CMS journey (staff with `content` permission)

| ID | Scenario | Steps | Expected | Status |
|----|----------|-------|----------|--------|
| MA-M-001 | Access | Marketing staff → `/admin/content` | List loads; staff w/o perm → 403 | |
| MA-M-002 | Create draft | New page + slug + locales | Draft created | |
| MA-M-003 | Blocks | Add hero/FAQ/CTA blocks, reorder | Saved in order | |
| MA-M-004 | SEO | Set title/description/robots per locale | Saved | |
| MA-M-005 | Preview | Preview draft | Draft rendered; not public | |
| MA-M-006 | Publish | Publish | Public `/p/<slug>` serves content | |
| MA-M-007 | Localization | Publish EN+AR | `?lang=ar` returns Arabic | |
| MA-M-008 | Draft isolation | Edit after publish | Public unchanged; preview shows draft | |
| MA-M-009 | Revisions | List → restore revision | Prior version restored; audit entry | |
| MA-M-010 | Unpublish | Unpublish | Public 404 | |
| MA-M-011 | Isolation | Marketing tries finance/booking endpoints | 403 | |

## 5. Platform repeat matrix

Cases to repeat per platform once mobile builds exist:

| Suite | Web | iOS | Android |
|---|---|---|---|
| Auth (G-001/002) | ☐ | ☐ | ☐ |
| Search→Booking→Payment (G-003..009) | ☐ | ☐ | ☐ |
| Trips/Cancel/Refund (G-010..012) | ☐ | ☐ | ☐ |
| Messaging (G-013, H-012) | ☐ | ☐ | ☐ |
| Reviews (G-014) | ☐ | ☐ | ☐ |
| Host listing+pricing (H-003..009) | ☐ | ☐ | ☐ |
| Earnings/payout status (H-013..017) | ☐ | ☐ | ☐ |
| Localization (G-018) | ☐ | ☐ | ☐ |

## 6. Error / recovery cases

| ID | Scenario | Expected |
|----|----------|----------|
| MA-E-001 | Failed payment (declined card) | Intent `failed`, reason shown, booking cancelled cleanly |
| MA-E-002 | Expired/abandoned checkout | No funds held; booking stays resolvable |
| MA-E-003 | Invalid/unavailable dates | Submit blocked with clear message |
| MA-E-004 | Race on last available night | One booking wins; other gets conflict error |
| MA-E-005 | Refund provider failure | `refund_pending`; ledger shows payable; no cash credit |
| MA-E-006 | Unauthorized access | 401 unauthenticated; 403 wrong role/owner |
| MA-E-007 | Expired session | Refresh rotates; dead refresh → login |
| MA-E-008 | Duplicate submit (double-tap) | Idempotent — single booking/payment |
| MA-E-009 | Network failure mid-payment | Webhook reconciles; no stuck `paid` claim without capture |
| MA-E-010 | Missing media (S3 down) | Graceful fail-closed 503, no crash |
| MA-E-011 | Webhook replay | Same txn → "already processed" |
| MA-E-012 | Poison outbox event | Other events in batch still processed |

## Evidence to capture per case

Screenshot/screen recording, reservation/booking/payment IDs, provider txn refs,
and any console/network errors. Record `Status` + evidence link per row.
