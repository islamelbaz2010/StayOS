# MAKAZOH Web Redesign — Route & Journey Coverage Matrix

**Branch:** `redesign/web-a2z`
**Source commit:** `57f6da0` (origin/main at branch time)
**Design reference:** `Handoff/MAKAZOH_AIRBNB_DESIGN_REFERENCE_PACK_2026-10-19/DESIGN airbnb.md` + pack README + Refero PDF
**Scope:** `apps/web` only. `apps/mobile` is untouched on this branch (0 files changed — verified `git diff --name-only HEAD -- apps/mobile/`).

Legend: ✅ redesigned & browser-verified · 🔁 covered by shared components/tokens (restyle propagates) · ⚠️ noted limitation

## A. Public / Guest

| Route | Role | Redesign | Verification |
|---|---|---|---|
| `/` home | public | ✅ floating search capsule, icon category strip, destination tiles, featured rail, quiet value-props, footer band | browser EN/AR + mobile-width |
| `/search` | public | ✅ capsule search bar, pill filter chips, sort select, List/Split/Map segmented control, flat photo-first cards, price markers | browser EN/AR |
| `/listings/[unitId]` | public | ✅ 20px-radius photo mosaic (Gallery), 26px title, eyebrow, badges, sticky BookingPanel with layered shadow, reviews/location/similar sections flat cards | browser EN/AR |
| `/auth/login` | public | ✅ MAKAZOH wordmark (fixed StayOS bug), flat hairline card, lime pill CTAs, segmented phone/email | browser |
| `/auth/register` | public | 🔁 AuthLayout + .input/.btn-primary | browser |
| `/auth/forgot-password` | public | 🔁 AuthLayout | browser |
| `/favorites` | guest | ✅ flat empty states, ListingCard reuse | browser (auth'd) |
| `/bookings` | guest | ✅ lime-underline tabs, hairline rows, pill CTAs | browser (auth'd) |
| `/bookings/[bookingId]` | guest | 🔁 shared card/badge/summary components | component tests 8/8 |
| `/checkout/[bookingId]` | guest | 🔁 card/badge/primitives; BookingPanel pill CTA | component tests 7/7 |
| `/payments` | guest | ✅ flat hairline payment rows/tabs | browser (auth'd) |
| `/profile` | guest | 🔁 shared primitives | component tests 14/14 |
| `/account-settings` (+6 subroutes) | guest | 🔁 shared primitives, hairline cards | browser + 16 tests |
| `/messages`, `/messages/[id]` | guest | ✅ flat hairline thread list/panels | browser (auth'd) |
| `/notifications` | guest | 🔁 shared primitives | browser (auth'd) |
| `/support` | guest | 🔁 flat hairline conversation shell | browser (staff ctx) |
| `/help`, `/help/article/[slug]` | public | ✅ flat cards, hover fills | browser |
| `/faq`, `/about`, `/how-it-works`, `/for-guests`, `/for-hosts`, `/host-standards`, `/p/[slug]` | public | 🔁 CMS/BlockRenderer + tokens | browser (faq/about/how-it-works) |
| `/become-a-host` | public | 🔁 shared primitives | browser + 9 tests |
| `/hosts/[hostId]` | public | 🔁 shared components | typecheck/build |
| `/kyc` | auth'd | 🔁 KycUpload/ProviderFlow components | 14+7 tests |
| 404 / error | public | ✅ renders minimal centered state | browser |

## B. Booking & payment journey (invariants untouched)

| Step | Treatment | Verification |
|---|---|---|
| Date/guest selection | capsule fields + AvailabilityCalendar (ink endpoints, #F7F7F7 range band, struck-out unavailable) | 10 calendar tests |
| Price breakdown | BookingFinancialSummary — unchanged math, hairline rows | BookingPanel 19 tests |
| Reservation submit | pill lime CTA, disabled/loading states | tests + browser |
| Payment methods, transfer proof, status | flat cards, badges, ProofUpload — unchanged API/flow | payments tests 8/8, checkout 7/7 |
| Cancellation/refund UX | CancelBookingButton modal, hairline cards | build + tests |
| Booking history/detail | HostBookingList/Guest bookings flat hairline rows | browser (auth'd) |

No pricing, commission, deposit, refund, availability, or state-transition logic was modified.

## C. Host

| Route | Verification |
|---|---|
| `/host` dashboard | browser EN — stat tiles flat, lime accents |
| `/host/bookings` | browser EN/AR — filter selects + status chips, hairline rows |
| `/host/earnings` | browser EN/AR — all canonical figures (host_earnings/funds_held/payout_ready/paid_out/refunded) preserved |
| `/host/calendar`, `/host/availability/[unitId]` | browser + 5 tests |
| `/host/listings`, `/new`, `/[id]/edit`, `/photos`, `/availability`, `/co-hosts` | browser (listings) + ListingForm/PhotoUpload components flat sections; 7 tests |
| `/host/profile`, `/host/guide`, `/host/guide/[topic]` | browser + 10 tests |
| `/host/kyc` | 🔁 KycUpload |

## D. Admin

| Route | Verification |
|---|---|
| `/admin` dashboard | browser EN — eyebrow sections, flat stat cards, pill governorate chips |
| `/admin/users`, `/admin/staff`, `/admin/kyc` | browser (users/kyc) + build |
| `/admin/bookings`, `/admin/bookings` detail drawer | browser — timeline hairline, badges |
| `/admin/payments`, `/admin/payments/[id]` | browser — queue tabs |
| `/admin/pending`, `/admin/discovery`, `/admin/import` | browser (pending) + import tests 3/3 |
| `/admin/earnings`, `/admin/reports`, `/admin/reports/[key]`, `/admin/reports/management` | browser + 20 tests |
| `/admin/listings`, `/admin/content`, `/admin/content/[id]` | browser (listings) + build |
| `/admin/support`, `/admin/disputes` | browser |

## E. Staff

Staff uses the Admin console subset + `/support`. Verified via staff dev-login: `/en/admin` + `/en/support` EN, `/ar/admin` AR. Permission boundaries unchanged (ProtectedRoute/RoleAwareLayout untouched).

## F. Cross-cutting

Header (80px, underline active tabs, circular utilities, pill user menu, mobile drawer), Footer (#F7F7F7 band, link columns, legal hairline), modals/drawers (layered shadows), skeletons (hairline cards), empty states (flat hairline containers), error/404 (centered minimal), toasts (unchanged, inherit tokens). Skeleton/ListRow/EmptyState components verified via build + tests.

## Exclusions / limitations

- External payment providers, maps tiles, and email flows run against the live staging API through a local CORS proxy during QA; provider sandbox behavior (e.g., real card charge) not exercised — no payment code changed.
- `next/image` `<img>` lint warnings and jsdom navigation warnings are pre-existing and unrelated.
