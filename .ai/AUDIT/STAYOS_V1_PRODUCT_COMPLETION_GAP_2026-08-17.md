# STAYOS V1 PRODUCT COMPLETION GAP MATRIX

**Date:** 2026-08-17  
**Scope:** StayOS mobile marketplace (Android standalone APK) + backend readiness + supply pipeline  
**Classification:** P0 = alpha release blocker; P1 = materially harms UX or journey; P2 = polish / optimization

---

## A. WORKING

| # | Capability | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | App launch + navigation | MainActivity resumes/focused; 5 bottom tabs visible and interactive on OPPO | P0 | Preserve; no action. |
| 2 | Home screen + live API | Home loads `/api/v1/listings`; real listing card visible with `New Cairo شقة 80000 EGP` | P0 | Preserve; no action. |
| 3 | Listing search (list view) | Search uses `useSearchListings` with q/city/governorate/guests/price filters; results render in `FlatList` | P0 | Preserve; add date/guest controls in A2. |
| 4 | Location autocomplete | `/api/v1/locations/autocomplete` returns suggestions; `Maadi` resolves correctly | P0 | Preserve; expand aliases in A2. |
| 5 | Listing detail screen | `ListingDetailScreen` loads detail, photos, amenities, description, map fallback, similar call | P0 | Preserve; wire map key and fix similar ID in C. |
| 6 | Favorites toggle/list | `useToggleFavorite` mutation + backend endpoints; migration `022` table exists | P0 | Preserve; end-to-end test on device in F. |
| 7 | Auth token lifecycle | Axios interceptors, Bearer token, refresh, `AsyncStorage` persistence | P0 | Preserve; depends on Twilio in D. |
| 8 | Backend API health | Railway deployment `d1baf703` healthy; `/health` returns `200` | P0 | Preserve; monitor. |
| 9 | Web admin import/review | `/admin/import` preview/confirm; admin pending queue with approve/reject endpoints | P0 | Preserve; use for supply. |
| 10 | Web host listing creation | `host/listings/new` and backend `POST /api/v1/listings` exist | P0 | Preserve; use as fallback for supply. |

---

## B. BROKEN

| # | Problem | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | App renders black screen on OPPO in dark mode | OPPO diagnostic and real-device test; `cmd uimode night no` was the only way to get UI | P1 | Fix `app.json` / splash / initial view to force or support dark mode in A1. |
| 2 | Booking date input uses `YYYY-MM-DD` text field | `BookingScreen.tsx` lines 72-84 show `TextInput` with placeholder, no picker | P1 | Add `@react-native-community/datetimepicker` in D. |

---

## C. PARTIALLY WORKING

| # | Problem | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Map is not usable | `MapView` guarded behind missing `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`; fallback shown | P1 | Add Google Maps API key to EAS in A1. |
| 2 | OTP login returns `422` "OTP provider is not configured" | Backend `auth/services.py` guards missing Twilio; Railway returns 422 | P1 | Configure Twilio OR implement admin/dev-token login for Closed Alpha in A1. |
| 3 | Booking creation not end-to-end tested | `BookingScreen` exists and calls `/bookings`; no real-device booking verified | P1 | Test availability/pricing/payment in D. |
| 4 | Similar listings returns 404 for seed IDs | `/listings/{id}/similar` expects `unit_id` while mobile passes `listing.id` | P2 | Align ID routing in C. |
| 5 | Guest Trips not verified with real data | `TripsScreen` uses `/bookings/guest`; no real bookings to test | P2 | Verify after first booking in F. |

---

## D. NOT IMPLEMENTED

| # | Capability | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Native date/guest filters in Search | `SearchScreen` accepts params but has no UI for dates or guests | P1 | Add date picker + guest stepper in A2. |
| 2 | Availability calendar UI | Mobile has no calendar; backend `/listings/{unit_id}/availability` not consumed | P1 | Implement calendar in D. |
| 3 | Payment collection flow | `BookingScreen` creates reservation but no Paymob/Stripe UI integration | P0 | Integrate payment intent/iframe in D. |
| 4 | Host-mode mobile screens | All host functionality is in web only | P2 | Defer per `MVP_FREEZE.md`. |
| 5 | Operations workforce app | Not in mobile; excluded from MVP | P2 | Defer per `MVP_FREEZE.md`. |
| 6 | Channel manager integrations | Airbnb/Booking sync excluded per `MVP_FREEZE.md` | P2 | Defer. |
| 7 | Dynamic pricing ML | Excluded per `MVP_FREEZE.md` | P2 | Defer. |

---

## E. BACKEND BLOCKERS

| # | Blocker | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Twilio missing for OTP | `POST /auth/otp/send` returns `422` "OTP provider is not configured" | P0 | Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` to Railway, OR bypass with dev-token auth for alpha. |
| 2 | Google Maps API key missing | `app.json` has no `googleMaps.apiKey`; mobile checks `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | P1 | Add Google Maps API key to EAS preview environment. |
| 3 | Payment provider not configured | Reservation flow requires `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID` | P0 | Configure Paymob credentials in Railway OR Stripe if card is acceptable. |
| 4 | Similar-listings ID mismatch | Endpoint expects `unit_id`; mobile passes listing `id` | P2 | Update mobile or backend route. |

---

## F. MOBILE BLOCKERS

| # | Blocker | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Dark mode causes black splash/first view | OPPO device only renders when switched to light mode | P1 | Force light `userInterfaceStyle` or add dark splash colors in A1. |
| 2 | No native date picker | `BookingScreen` uses `TextInput` for `check_in`/`check_out` | P1 | Add `@react-native-community/datetimepicker` in D. |
| 3 | No error boundary / crash reporting | `App.tsx` has no global `ErrorBoundary` | P2 | Add lightweight Sentry or error boundary after A1. |
| 4 | No pull-to-refresh | Home/Search use `ScrollView` without `RefreshControl` | P2 | Add `RefreshControl` in C. |
| 5 | Booking form validation is weak | Only checks non-empty; no check-out > check-in or future-date validation | P1 | Add date logic in D. |

---

## G. UX/UI PROBLEMS

| # | Problem | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Brand literally shown as "ستاي أو إس" | OPPO screenshot and `i18n.ts` translation | P1 | Keep brand `StayOS`; use natural Arabic copy, not transliteration, in A1. |
| 2 | Inconsistent design system | No unified typography, spacing, radii, iconography; UI feels patched | P1 | Formalize lightweight design tokens in C. |
| 3 | Image loading has no retry | `ListingCard` only has a placeholder on error | P2 | Add retry on image failure. |
| 4 | Arabic RTL layout needs review | `I18nManager.forceRTL` is called; need to verify margins/padding on all screens | P1 | RTL audit in F. |
| 5 | Search header / map controls poorly positioned | Prompt notes badly positioned controls | P1 | Redesign search header in A2/C. |

---

## H. SUPPLY PROBLEMS

| # | Problem | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Only 3 seed/demo listings | `/api/v1/listings` returns 3 listings; not real owner-authorized supply | P0 | Acquire 3–5 real properties via CSV import in E. |
| 2 | Zero confirmed owner-authorized listings | No `authorization_status` workflow exists; seed data is demo | P0 | Founder outreach + CSV import with `host_phone` in E. |
| 3 | Owner outreach is not wired in software | Notification template exists but no channel mapping/consumer | P2 | Keep manual for Closed Alpha; copy scripts from `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md`. |
| 4 | Imported hosts need phone number to access account | `_find_or_create_host` creates verified host but login requires phone/OTP | P1 | Ensure every CSV row has `host_phone`. |

---

## I. DATA PROBLEMS

| # | Problem | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Location autocomplete only Cairo/Giza | Migration `022` seeds only Cairo/Giza aliases | P1 | Expand aliases for target destinations in A2. |
| 2 | Seed listings all look identical | Same `base_price_egp=80000`, same coordinates, same cover | P1 | Replace with real or richer seed data in A2. |
| 3 | No demo users for testing | No seed guest/host/admin users in migrations | P2 | Add seed users or use OTP bypass for alpha. |
| 4 | Listing photos may be placeholder/cover only | `ListingDetail` falls back to `cover_image` | P1 | Import real photo URLs via CSV. |

---

## J. RELEASE BLOCKERS

| # | Blocker | Evidence | Severity | Recommended Action |
|---|---|---|---|---|
| 1 | Payment integration missing | Reservation requires Paymob/Stripe config; mobile has no payment UI | P0 | Complete payment flow in D. |
| 2 | OTP not operational in live env | `POST /auth/otp/send` returns 422 | P0 | Configure Twilio or add admin bypass token in A1. |
| 3 | Booking flow not end-to-end tested | No real booking created on device | P0 | Run full booking test in F. |
| 4 | Less than 3 real listings | Only 3 seed listings; founder has no authorized inventory | P0 | Acquire 3–5 real properties in E. |
| 5 | Dark mode black screen | App invisible to dark-mode users | P1 | Fix in A1. |
| 6 | No legal / TOS / privacy in mobile | Required for app store and trust | P1 | Add static legal screens in Account in C. |

---

## K. NICE-TO-HAVE — DO NOT WORK ON NOW

| # | Item | Reason |
|---|---|---|
| 1 | AI concierge / recommendations | Not needed for core booking journey. |
| 2 | Chat / multi-channel messaging | Excluded per `MVP_FREEZE.md`; use founder WhatsApp. |
| 3 | Advanced reviews / ratings | Post-stay; not needed for first booking. |
| 4 | Host analytics dashboard | Web host dashboard is sufficient. |
| 5 | Multi-country expansion | Egypt only for Closed Alpha. |
| 6 | Advanced animations | Can degrade UX if rushed; focus on stability. |
| 7 | Dynamic pricing | Explicitly excluded from MVP. |
