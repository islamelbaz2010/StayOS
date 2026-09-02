# STAYOS V1 EXECUTION PLAN

**Date:** 2026-08-17  
**Goal:** Reach a credible Closed Alpha marketplace with a working discovery → listing → booking flow and 3–5 real owner-authorized listings.  
**Principle:** Fast, maintainable, real-device validated. No framework migrations. No scope creep.

---

## Phase A — Core Product Stabilization

**Objective:** Remove the most immediate blockers so every future test can run on the OPPO.

| # | Task | Why | Files Likely Touched | Verification |
|---|---|---|---|---|
| 1 | Fix dark mode black screen | Without this, dark-mode users see nothing and all testing is unreliable | `apps/mobile/app.json` | Screenshot on OPPO in dark mode shows UI |
| 2 | Add Google Maps API key | Map is a core marketplace feature; fallback is acceptable but key must be configured | EAS environment, `app.json` | Map renders markers on device |
| 3 | Resolve OTP | Login is required for favorites/booking/trips; Twilio missing | Railway env, or `LoginScreen.tsx` + admin dev-token fallback | Login succeeds on device |
| 4 | Configure payment provider | Without Paymob/Stripe, booking cannot complete | Railway env (`PAYMOB_*` or `STRIPE_*`) | Payment intent succeeds in test |

**Stop condition:** App is stable in both light and dark mode and the P0 environment dependencies are either configured or replaced with an acceptable Closed Alpha bypass (e.g., admin dev-token for auth, manual payment proof for booking).

---

## Phase B — Search + Discovery + Location

**Objective:** Make search the primary path to inventory.

| # | Task | Why | Verification |
|---|---|---|---|
| 1 | Add date + guest selectors to Search | Search currently accepts params but has no UI | Device: select dates/guests, search returns filtered results |
| 2 | Expand location aliases | Current aliases only Cairo/Giza; target destinations are New Cairo, 6th October, Maadi, Zamalek, Nasr City, Alexandria, Luxor | Device: `Maadi`, `المعادي`, `Maad` resolve suggestions |
| 3 | Implement proper empty/loading/error states | Dead-end suggestions are confusing | Device: empty location shows clear state |
| 4 | Pull-to-refresh | Standard marketplace behavior | Device: pull down refreshes listings |

---

## Phase C — Listing + Map Experience

**Objective:** Make the listing detail credible and the map usable.

| # | Task | Why | Verification |
|---|---|---|---|
| 1 | Image gallery / load retry | Real photography is essential | Device: listing images load, retry on fail |
| 2 | Fix similar-listings 404 | Endpoint expects `unit_id` while mobile passes `listing.id` | Device: similar listings load on detail |
| 3 | Map/list toggle in Search | Map is part of search, not isolated | Device: toggle map and tap marker |
| 4 | Lightweight design tokens | Typography, spacing, radii, buttons, cards, iconography, colors | Device: all screens feel coherent |
| 5 | Brand copy review | Replace literal "ستاي أو إس" with natural Arabic around `StayOS` | Device: headers/splash use consistent brand |
| 6 | Legal / TOS / privacy | Required for trust and app store | Device: Account screen has legal links |

---

## Phase D — Booking Transaction

**Objective:** Close the discovery → booking loop as far as the current backend and payment configuration allows.

| # | Task | Why | Verification |
|---|---|---|---|
| 1 | Add native date picker | Manual `YYYY-MM-DD` is unacceptable | Device: pick check-in/check-out |
| 2 | Guest selector | Respect listing capacity | Device: select adults/children |
| 3 | Consume availability API | Backend has `/listings/{unit_id}/availability`; mobile doesn't use it | Device: unavailable dates blocked |
| 4 | Price breakdown | Show nightly × nights + fees/discounts/taxes | Device: price matches backend |
| 5 | Payment UI | Integrate Paymob iframe or Stripe sheet | Device: payment intent created and booking confirmed |
| 6 | Booking confirmation + Trips | After payment, show confirmation and reflect in Trips | Device: booking appears in Trips |

---

## Phase E — Supply Acquisition

**Objective:** Replace the 3 seed listings with the first 3–5 real owner-authorized listings.

| # | Task | Why | Verification |
|---|---|---|---|
| 1 | Founder executes the `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` P0 sources | Founder network, agencies, legitimate Airbnb/Booking lead generation | 3–5 properties with owner authorization |
| 2 | Collect property data using `apps/web/public/import-template.csv` | CSV import is the implemented pipeline | Each property has title, city, governorate, price, photos, host phone |
| 3 | Import via `/admin/import` preview/confirm | Already implemented; admin review | Properties appear in `PENDING_VERIFICATION` |
| 4 | Admin review + publish | Ensure every listing has photos, real pricing, availability | `GET /api/v1/listings` returns 3–5 real listings |
| 5 | Notify owners outside system | Copy WhatsApp scripts from playbook | Owner acknowledges listing is live |

---

## Phase F — Real-Device Validation

**Objective:** Run the mandatory OPPO smoke test after P0 changes.

| # | Test | Evidence Required |
|---|---|---|
| 1 | Launch + Home | Screenshot |
| 2 | Search + autocomplete | Screen recording / screenshots |
| 3 | Results + map | Screenshot |
| 4 | Listing detail + images | Screenshot |
| 5 | Favorite + Favorites screen | Screenshot |
| 6 | Dates + guests + price | Screenshot |
| 7 | Booking + payment + confirmation | Reservation ID or Trips screen |
| 8 | Account + Trips | Screenshot |
| 9 | Arabic/English switch | Screenshot |
| 10 | 60-second stability | App remains open and responsive |

---

## Sequencing Logic

1. **Phase A first** because nothing else can be validated on the physical device if the app is invisible in dark mode or auth/payment environments are missing.
2. **Phase A and E are parallelizable** — supply acquisition is a founder-led operational workstream that does not block engineering.
3. **Phase B and C come next** because users must be able to find and view listings.
4. **Phase D follows** because the listing must convert into a booking.
5. **Phase F runs after every P0 change** before any release claim.

---

## Single Highest-Leverage Next Action

**Fix the dark mode black screen in `apps/mobile/app.json` (force light UI mode or add dark splash colors).**

**Why this is highest-leverage:**
- It is a one-line change with no external dependencies.
- Without it, every other screen — including the ones we have already verified in light mode — is at risk of being invisible to any user with dark mode enabled, which is the default on most Android devices.
- It unblocks all subsequent real-device smoke tests.
- It is the fastest way to make the current working product actually usable for more than one test case.

**After this:** Configure Twilio and Paymob/Stripe in Railway, then return to search/booking improvements and supply acquisition.
