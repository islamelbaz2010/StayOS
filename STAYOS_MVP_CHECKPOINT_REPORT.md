# STAYOS — OFFICIAL MVP CHECKPOINT + PRODUCT CLOSURE AUDIT

## PHASE 1 — CURRENT REPOSITORY BASELINE

- **Branch:** `release/test-apk-build`
- **Starting baseline SHA:** `f3f679b`
- **Dirty state before change:** untracked `build-artifact/app-release.apk`
- **Final SHA after approved change:** `9a3cce7` (legend removed), plus `f3f679b` for build-artifact cleanup
- **Working tree note:** `build-artifact/` must remain `.gitignore`-excluded; it has been untracked since cleanup.
- **Source tree:** FastAPI/Python monolith under `src/app/`, React Native mobile under `apps/mobile/`.

Relevant latest commits on `release/test-apk-build`:

```
f7c06fe Update final SHA in release gate report.
d366f9a Remove build artifact from repository
f2733f6 Add Core Transaction Release Gate final E2E and regression report.
d4831fb Use marginBottom on Home ScrollView to avoid tab bar overlap.
3caa551 Apply bottom padding to Home ScrollView style instead of content container.
54eceaa Booking auth gate fix
```

## PHASE 2 — CALENDAR UX FIX

**Approved change executed:**

Removed the visible "Available / Unavailable" legend from `BookingScreen`.

- **File changed:** `apps/mobile/src/screens/BookingScreen.tsx`
- **Removed:** `View style={styles.legend}` block, its text labels `متاح` / `غير متاح`, and the unused `legend`, `legendItem`, `dot`, `legendText` style definitions.
- **Result:** The section title `اختر التواريخ` is now followed directly by the calendar.
- **Availability communication:** unchanged — dates that are `AVAILABLE` remain selectable, and `BOOKED`/past/unavailable dates remain disabled and visually dimmed.
- **Validation:** `npx tsc --noEmit` in `apps/mobile` passed.
- **APK built:** No.
- **Device tested:** No.

## PHASE 3 — VERIFIED FEATURE INVENTORY

| # | Feature | Status | Evidence | Customer/Host | MVP Relevance |
|---|---------|--------|----------|---------------|---------------|
| 1 | Authentication | B | `src/app/auth/router.py` (OTP/Firebase); `apps/mobile/src/screens/LoginScreen.tsx` | Both | P0 |
| 2 | Registration | B | Phone OTP creates user; KYC endpoints exist | Both | P0 |
| 3 | Login | B | `LoginScreen.tsx`; `auth/services.py:284-398` | Both | P0 |
| 4 | OTP | B | `src/app/auth/router.py:22-58`; `LoginScreen.tsx:28-49` | Both | P0 |
| 5 | Email verification | G | No email/verification flow | Both | P1 |
| 6 | Password authentication | G | Not implemented | Both | P2 |
| 7 | Session management | B | JWT/refresh in `auth/services.py:142-238`; `api.ts:49-80` | Both | P0 |
| 8 | Logout | B | `AuthContext.logout` in `AuthContext.tsx`; manually verified in prior run | Both | P0 |
| 9 | Guest role | B | `UserRole.GUEST`; `require_guest` dependency | Customer | P0 |
| 10 | Host role | C | Role exists; host onboarding/journey not wired | Host | P0 |
| 11 | KYC | C | KYC endpoints/schemas; no UI | Both | P0 |
| 12 | Listing creation | C | `POST /listings`; no mobile form | Host | P0 |
| 13 | Listing editing | C | `PATCH /listings/{id}`; no UI | Host | P1 |
| 14 | Listing publishing | C | `publish_listing` endpoint; no UI | Host | P0 |
| 15 | Photos | C (upload) / D (display) | Upload endpoint exists; mobile displays cover | Host | P0 |
| 16 | Amenities | B | Schemas + `ListingDetailScreen` display | Host | P1 |
| 17 | House rules | C | Schema only | Host | P2 |
| 18 | Pricing | B | Schema; bulk pricing endpoint; `BookingScreen` pricing | Host | P0 |
| 19 | Availability | B | `availability/services.py` SSoT; `BookingScreen` honors it | Host | P0 |
| 20 | Calendar | B | `BookingScreen` calendar; selection and disabling works | Customer | P0 |
| 21 | Search | B | `SearchScreen`; backend list search | Customer | P0 |
| 22 | Autocomplete | G | No autocomplete service | Customer | P2 |
| 23 | Filters | B | Basic location filters; no full filter sheet | Customer | P1 |
| 24 | Sorting | G | Not implemented | Customer | P2 |
| 25 | Map | B/E | Map screen exists; blocked by missing `GOOGLE_MAPS_API_KEY` | Customer | P1 |
| 26 | Price markers | B/E | Code exists; blocked by map key | Customer | P2 |
| 27 | Average area price | B/E | Code exists; blocked by map key | Customer | P2 |
| 28 | Favorites | B | Backend + `FavoritesScreen`; minor UI issue | Customer | P2 |
| 29 | Listing Detail | B | `ListingDetailScreen` works; no map | Customer | P0 |
| 30 | Host Profile | B | `HostProfileScreen`, hook, backend endpoint exist | Customer | P1 |
| 31 | Host Units | C | Backend endpoint; no mobile host UI | Customer | P1 |
| 32 | Booking | B | `BookingScreen` → `POST /bookings` → `REQUESTED`; transaction verified | Customer | P0 |
| 33 | Reservation | C | Backend exists; mobile does not use it | Customer | P0 |
| 34 | Payment | C/E | Backend `payments/finance`; no mobile payment step | Customer | P0 |
| 35 | Escrow | C | `finance/router.py` ledger; not visible | Both | P1 |
| 36 | Cancellation | C | Services exist; no UI | Customer | P2 |
| 37 | Refund | C | Services compute refund; not exposed | Customer | P2 |
| 38 | Trips | B | `TripsScreen` lists guest bookings | Customer | P0 |
| 39 | Trip Detail | G | No detailed trip screen | Customer | P1 |
| 40 | Check-in | G | Not implemented | Customer | P2 |
| 41 | Check-out | G | Not implemented | Customer | P2 |
| 42 | Messaging | G | No messaging router or screens | Both | P1 |
| 43 | Notifications | B/C | Backend engine; mobile not integrated | Both | P1 |
| 44 | Reviews | G | No reviews module | Both | P1 |
| 45 | Host reviews of guests | G | No reviews module | Host | P1 |
| 46 | Reporting | G | Not implemented | Admin | P3 |
| 47 | Support | G | Not implemented | Both | P3 |
| 48 | Host bookings | C | Host endpoints; no UI | Host | P0 |
| 49 | Guest management | G | Not implemented | Host | P2 |
| 50 | Host payout | C | `finance/router.py` payout API; no UI | Host | P0 |
| 51 | Host analytics | G | Not implemented | Host | P2 |
| 52 | Admin | C | KYC/listing/payment admin endpoints; no UI | Admin | P0 |
| 53 | Web/mobile parity | F | Web not functional for transaction; mobile ahead | Both | P2 |
| 54 | Arabic UX | B | RTL forcing, real `ar` keys; placeholders remain | Customer | P0 |
| 55 | Cultural filters | G | No tags/filters | Customer | P1 |
| 56 | Local payment support | C/E | Paymob backend skeleton; no mobile checkout | Customer | P0 |

**Status key:**
- **A** = VERIFIED COMPLETE
- **B** = IMPLEMENTED BUT PARTIALLY VERIFIED
- **C** = BACKEND ONLY
- **D** = FRONTEND ONLY
- **E** = EXTERNAL DEPENDENCY
- **F** = REAL DEFECT
- **G** = NOT IMPLEMENTED
- **H** = DEFERRED

## PHASE 4 — BUGS VS MISSING FEATURES

### REAL DEFECTS (supposed to work, but broken)

| # | Defect | Severity | Evidence | User Impact | MVP Impact |
|---|--------|----------|----------|-------------|------------|
| 1 | **Booking and Reservation are separate occupancy tables with no FK or cross-aggregate serializable guard.** | P0 | `src/app/bookings/models.py`, `src/app/reservations/models.py`; `availability/services.py` merges after insert. | Double-booking race possible between two paths. | High |
| 2 | **Mobile booking flow stops at `REQUESTED`; no payment, host accept, or reservation confirmation.** | P0 | `BookingScreen.tsx` calls `POST /bookings`; no `/reservations` or `/payments` follow-up. | Guest cannot complete a paid stay; host cannot confirm. | High |
| 3 | **Turnstile/PoW OTP path not supported by the mobile client.** | P1 | `LoginScreen.tsx` does not pass `turnstile_token`; `auth/services.py` server-side fallback may fail. | Login may be unavailable if Akedly enforces Turnstile. | Medium |
| 4 | **Home tab bar still partially overlapped by `ListingCard` `Pressable`.** | P2 | `HomeScreen.tsx` `marginBottom: 120`; prior report notes it is not fully resolved. | Account/Trips/Favorites tabs hard to tap. | Low-Medium |
| 5 | **Google Maps not rendering without `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.** | P2 | `SearchScreen.tsx`, `ListingDetailScreen.tsx`; map and average-price blocked. | Search map and area average price unavailable. | Medium |

### MISSING CAPABILITIES (not built or incomplete by design)

| # | Capability | Customer Value | Host Value | Trust Value | Dependencies | MVP Relevance |
|---|------------|---------------|------------|-------------|--------------|---------------|
| 1 | Mobile payment checkout | Transaction completion | Revenue | High | Payment provider, reservations | P0 |
| 2 | Host onboarding & listing creation | Enables supply | Core | Medium | KYC, photo upload, admin review | P0 |
| 3 | Host accept/reject + calendar/pricing dashboard | None | Operations | Medium | Booking status update, UI | P0 |
| 4 | Reviews & ratings | Trust, social proof | Trust | High | Post-stay data model, UI | P1 |
| 5 | Egyptian wallet payments (Fawry, Vodafone Cash, Meeza, InstaPay) | Inclusion | Revenue | High | Paymob or provider | P0-P1 |
| 6 | Push/SMS notifications | Response, retention | Operations | Medium | FCM/Twilio, device tokens | P1 |
| 7 | Real Arabic copy & cultural filters | Differentiator | None | Medium | i18n, tags, search filters | P0 |
| 8 | Admin KYC/listing verification + CSV supply import | Verified supply | Trust | High | Admin UI or API workflow | P0 |
| 9 | Messaging between guest and host | Trust, logistics | Logistics | High | Messaging router, UI | P1 |
| 10 | Web platform parity | Reach | Reach | Low | Front-end build | P3 |

## PHASE 5 — BOOKING / RESERVATION ARCHITECTURE AUDIT

### Current State

- **Availability source of truth:** `src/app/availability/services.py` `get_unit_availability()` merges `CalendarRule`, `Booking`, and `Reservation` into a per-day `AVAILABLE`/`BOOKED` view.
- **Booking (`/bookings`):** Request/manual-payment aggregate. Mobile `BookingScreen` creates a `REQUESTED` record.
- **Reservation (`/reservations`):** Online-payment aggregate. Has payment intents, escrow, refund logic.
- **Linkage:** No foreign key between `Booking` and `Reservation`. Both store overlapping `unit_id` + `check_in`/`check_out` ranges.
- **Divergence risk:** Yes. Concurrent `POST /bookings` and `POST /reservations` can both pass `assert_availability_for_range` before either inserts, producing a double booking. The availability merge is post-hoc.

### Recommendation (Phase 5 Decision)

**C. Temporary Booking → Reservation linkage**

Immediate action: keep `Reservation` as the canonical stay aggregate; add a nullable `booking_id` FK on `Reservation`; route the mobile "Confirm Booking" action to create a `Reservation` with a manual or online `PaymentIntent`; migrate `Booking` `REQUESTED`/`ACCEPTED` states into `Reservation` statuses. Deprecate `Booking` as a separate occupancy table in the next 2–3 sprints.

## PHASE 6 — AUTHENTICATION DECISION

### Current State

- Mobile primary path: Akedly phone OTP + server-side PoW fallback.
- Firebase phone auth exists as an alternative backend endpoint but is not used by the current `LoginScreen`.
- Akedly may require Cloudflare Turnstile, which the RN client does not pass, forcing backend PoW and risking `TurnstileRequiredError`.
- `/auth/dev-token` exists for development/staging, 404 in production.

### Evaluation

| Option | Egyptian UX | Host UX | Security | Web Usability | Risk |
|---|---|---|---|---|---|
| A. Phone OTP only (Akedly) | Medium | Medium | Medium | Poor | High (delivery/Turnstile) |
| B. Firebase Phone Auth primary, Akedly fallback | High | High | High | Good (Firebase web) | Low |
| C. Email/password | Low | Low | Medium | Good | High (Egyptian friction) |
| D. Phone + email verification + optional password | High | High | High | Good | Medium |
| E. Other | — | — | — | — | — |

### Recommendation (Phase 6 Decision)

**D. Phone + email verification + optional password**

- **Registration:** phone OTP is mandatory; after OTP, capture email and set an optional password.
- **Login:** phone OTP or email+password.
- **Phone verification:** Firebase Phone Auth primary for Egypt (reliable, no Turnstile); keep Akedly as fallback where Play Services unavailable.
- **Email verification:** required before becoming a host or for refund communications.
- **Password:** optional, recommended for web and account recovery.
- **OTP:** 6-digit SMS; rate-limited.
- **Recovery:** phone re-verification or email reset if password set.
- **New-device behavior:** refresh-token based; require phone re-verification when refresh is absent/invalid on sensitive actions (host actions, payout).
- **Host requirements:** verified phone + email + KYC before listing/payout.
- **Guest requirements:** verified phone only to book; email optional for receipts.

## PHASE 7 — CUSTOMER JOURNEY

| Stage | Current State | Actual Implementation | Missing Capability | Dependency | Risk | Priority |
|-------|---------------|----------------------|--------------------|------------|------|----------|
| DISCOVER | B | Home with featured listings, city chips | Arabic/cultural discovery | i18n, tags | Low | P1 |
| SEARCH | B | `SearchScreen` list + map toggle | Map, filters, sort | Google Maps key | Medium | P1 |
| FILTER | B | City chips | Price/guest/amenity filters | UI | Low | P1 |
| COMPARE | G | None | Compare/saved list | Favorites, UI | Low | P3 |
| LISTING | B | `ListingDetailScreen` photos, amenities, price | Map, reviews, host trust UI | Map, reviews | Medium | P1 |
| TRUST | B | Host badge in detail | Verification badges, reviews | KYC, reviews | High | P0 |
| CONTACT HOST | G | No messaging | Guest-host messaging | Messaging | High | P1 |
| AUTHENTICATE | B | Phone OTP | Email/password fallback | Auth decision | Medium | P1 |
| BOOK | B | `BookingScreen` → `REQUESTED` | Payment, instant/confirm flow | Payment, reservations | High | P0 |
| PAY | G | No mobile payment step | Paymob/Stripe checkout | Payment provider | High | P0 |
| CONFIRM | G | `REQUESTED` only | Reservation confirmation | Host accept/payment | High | P0 |
| TRIP | B | `TripsScreen` list | Trip detail, pre-arrival info | UI | Low | P1 |
| PRE-ARRIVAL | G | None | Check-in instructions, host contact | Messaging | Medium | P2 |
| CHECK-IN | G | None | Self check-in/verification | Host dashboard | Medium | P2 |
| STAY | G | None | Support, issue reporting | Support | Medium | P2 |
| CHECK-OUT | G | None | Review prompt | Reviews | Low | P2 |
| REVIEW | G | None | Guest/host reviews | Reviews | Medium | P1 |
| SUPPORT | G | None | In-app support | — | Medium | P3 |
| RETENTION | G | None | Loyalty, saved searches | Future | Low | P3 |

### Minimum Coherent Customer Journey for MVP

A verified guest discovers listings on Home, searches by city, opens a listing with photos and a verified-host badge, authenticates by phone, selects dates and guests, submits a **paid** booking request, receives a confirmed reservation, views it in Trips, and can message the host for check-in details. Reviews are collected post-stay.

## PHASE 8 — HOST JOURNEY

| Stage | Current State | Actual Implementation | Missing Capability | Dependency | Priority |
|-------|---------------|----------------------|--------------------|------------|----------|
| BECOME HOST | C | KYC/auth endpoints | Host onboarding UI | KYC flow | P0 |
| VERIFY | C | KYC endpoints | Photo/document upload, review | S3, admin | P0 |
| CREATE LISTING | C | `POST /listings` | Mobile listing form | UI, photo upload | P0 |
| PUBLISH | C | `publish_listing` endpoint | Listing status UI | Host dashboard | P0 |
| PRICE | C | Bulk pricing backend | Per-night pricing UI | Host dashboard | P0 |
| AVAILABILITY | B/C | Backend calendar endpoints | Host calendar UI | UI, availability API | P0 |
| RECEIVE BOOKING | C | Host list endpoints | Notification, accept UI | Push, host dashboard | P0 |
| ACCEPT/DECLINE | C | Status transition services | Host action UI | Host dashboard | P0 |
| COMMUNICATE | G | No messaging | Host-guest chat | Messaging | P1 |
| PREPARE GUEST | G | None | Check-in instructions | Messaging, UI | P2 |
| CHECK-IN | G | None | Verify guest arrival | Operations | P2 |
| STAY | G | None | Support/issue handling | Support | P2 |
| CHECK-OUT | G | None | Review prompt, deposit release | Reviews, escrow | P2 |
| REVIEW | G | None | Review guest | Reviews | P1 |
| PAYOUT | C | `finance/router.py` payout API | Payout method, balance UI | Payment provider, KYC | P0 |
| ANALYTICS | G | None | Earnings/bookings dashboard | — | P2 |
| SUPPORT | G | None | Host support channel | — | P3 |

### Minimum Host MVP

A verified host signs up, completes KYC, creates a listing with title, price, photos, amenities, and availability, publishes it, receives booking requests with push/SMS, accepts or declines them, and can withdraw earnings to a local bank/wallet after a successful stay.

## PHASE 9 — COMPETITIVE GAP REVIEW

| Competitor | MUST MATCH | SHOULD MATCH | STAYOS DIFFERENTIATOR | NOT NEEDED |
|------------|-----------|--------------|----------------------|------------|
| **Airbnb** | Search, listing, map, reviews, booking, host verification | Instant book, saved lists, host dashboard | Arabic-first RTL, Paymob/Fawry/Vodafone cash, verified host badge, family/halal tags, escrow trust | Global inventory, Experiences, loyalty |
| **Booking.com** | Search, property pages, map, reviews, cancellation | Multi-property filters, rewards | Arabic-first UX, lower host fees, verified local supply, family filters | Hotel OTA volume, opaque pricing |
| **Vrbo** | Whole-home focus, calendar, host tools | Family/group filters, owner dashboard | Arabic villa/family targeting, KYC-verified hosts, local payment | International scale |
| **Agoda** | Search, map, hotel+home, Asian payment familiars | Pay-later, local language | Arabic-first, Egyptian wallets, verified supply | Hotel-centric inventory |

### Features That Actually Matter for StayOS MVP

1. **Guest:** search, listing detail, verified-host trust, phone auth, date/guest selection, **paid** booking, Trips.
2. **Host:** onboarding, listing creation, pricing/availability, accept/decline, payout.
3. **Trust:** KYC, reviews (P1), local payment, Arabic UX.

## PHASE 10 — MVP DEFINITION

### MUST HAVE BEFORE MVP

- Phone OTP authentication (guest & host) with session persistence and logout.
- Guest search and listing discovery.
- Listing detail with photos, amenities, pricing, and verified-host badge.
- Availability-aware booking calendar.
- `POST /bookings` and `POST /reservations` unified so the guest can submit a paid booking.
- Payment checkout (Paymob/Stripe or manual proof of transfer).
- Host accept/decline with booking status transition.
- Guest Trips list showing confirmed bookings.
- Host onboarding, KYC, listing creation, and payout method.
- Admin review/approval for KYC and listings.
- Arabic-first RTL UX with real copy.

### SHOULD HAVE AFTER MVP

- Reviews and ratings.
- Egyptian wallet payments (Fawry, Vodafone Cash, Meeza/InstaPay).
- Push/SMS notifications.
- Guest-host messaging.
- Host calendar and pricing dashboard.

### DO NOT BUILD YET

- Web platform.
- AI pricing/recommendations.
- Loyalty program.
- Global expansion/multi-region.
- Experiences/activities.
- Advanced admin analytics.

### One-Sentence MVP

StayOS MVP is a mobile-first Arabic closed-alpha marketplace where a phone-verified guest can search, view a verified listing, pay for a stay, and manage trips, while a phone/KYC-verified host can create listings, accept bookings, and receive payouts.

## PHASE 11 — PRIORITIZED EXECUTION ROADMAP

| Priority | Item | Reason | Dependencies | Backend | Web | Mobile | Complexity | Definition of Done |
|----------|------|--------|--------------|---------|-----|--------|------------|--------------------|
| **P0** | Unify Booking/Reservation and wire payment checkout | Without payment/confirmation the transaction does not close | Payment provider, reservation service | Yes | No | Yes | High | Guest can pay → host sees confirmed reservation → guest sees it in Trips |
| **P0** | Build host onboarding, KYC, and listing creation | Without supply there is nothing to book | Photo upload, KYC, admin | Yes | No | Yes | High | Host can create a verified listing and set price/availability |
| **P0** | Host accept/decline + payout method | Completes the host-side loop | Booking/Reservation, finance | Yes | No | Yes | High | Host receives push, accepts, and can add payout method |
| **P0** | Real Arabic copy + verified-host badge + cultural filters | Core differentiator and trust | i18n, KYC, listing tags | Partial | No | Yes | Medium | App is Arabic-first with visible trust signals |
| **P0** | Admin KYC/listing review workflow | Trust and safety before public launch | Admin access, KYC data | Yes | Optional | No | Medium | Founder/ops can approve hosts and listings |
| **P1** | Reviews & ratings | Trust after first stays | Post-stay data model | Yes | No | Yes | Medium | Guest and host can review post-stay |
| **P1** | Push/SMS notifications | Response time, retention | FCM/Expo, Twilio | Yes | No | Yes | Medium | Booking events trigger real notifications |
| **P1** | Guest-host messaging | Logistics and trust | Messaging router | Yes | No | Yes | Medium | In-app chat for a booking |
| **P2** | Map view + average area price | Discovery quality | Google Maps key | Yes | No | Yes | Low-Medium | Map renders price markers and average pill |
| **P3** | Web platform | Reach | Front-end build | Partial | Yes | No | High | Web parity for listing and booking |

## PHASE 12 — VALIDATION POLICY

### What Is Already Sufficiently Proven

- Guest discovery → listing → booking → `REQUESTED` status → Trips visibility.
- Availability engine correctly disables BOOKED dates and blocks overlapping inventory.
- Authentication gating (unauthenticated booking redirects to Login).
- Standalone release APK builds and installs against production.
- TypeScript compilation for mobile changes.

### When to Build/Install an APK

Build a new APK ONLY when:

1. A mobile source file is modified (`apps/mobile/**`).
2. `apps/mobile/app.config.js` or build configuration changes.
3. `.github/workflows/build-android-local.yml` changes.
4. A release candidate is being prepared.
5. A previously failing runtime issue specifically requires re-validation.

DO NOT build or install an APK for:

- Documentation or report changes.
- Pure backend changes (unless mobile runtime integration is affected).
- Repeating already-proven tests on the same mobile binary.
- Local static checks (TypeScript, lint) that do not need runtime.

### Tests Requiring External Credentials

- Google Maps (requires `GOOGLE_MAPS_API_KEY` GitHub secret).
- Live payment checkout (requires Paymob/Stripe credentials and webhooks).
- SMS delivery (requires live Twilio/Akedly).

### Tests Reserved for Release Candidate

- Full cold-start session persistence after logout.
- Host onboarding end-to-end.
- Payment and reservation confirmation end-to-end.
- Push/SMS notification delivery.

## PHASE 13 — OFFICIAL PROJECT CHECKPOINT

### Current State

| Area | Status | Notes |
|------|--------|-------|
| **CORE TRANSACTION** | Yellow | Booking request works; payment/confirmation missing |
| **AUTH** | Yellow | OTP/Firebase available; Turnstile/PoW friction remains |
| **AVAILABILITY** | Green | `availability.services` is the merged SSoT |
| **SEARCH** | Yellow | List search works; map blocked by missing key |
| **LISTING** | Yellow | Detail works; creation/payment missing on mobile |
| **HOST** | Red | No host UI for onboarding, listing, calendar, or accept |
| **PAYMENT** | Red | Backend exists; not integrated in mobile checkout |
| **TRIPS** | Yellow | Guest trips list works; host side absent |
| **TRUST** | Red | KYC backend strong but badges/reviews/escrow not visible |
| **MESSAGING** | Red | Not implemented |
| **REVIEWS** | Red | Not implemented |
| **MAP** | Red | Unconfigured API key |
| **NOTIFICATIONS** | Yellow | Backend engine exists; no device delivery |
| **WEB** | Red | Not functional for core transaction |
| **MOBILE** | Yellow | Core screens built; payment and host flows missing |

### What Is Done

- Phone OTP auth backend and mobile Login screen.
- Guest Home, Search, Listing Detail, Booking, Trips screens.
- Availability engine with `Booking`/`Reservation`/`CalendarRule` merge.
- Booking auth gate and state preservation.
- Standalone APK build pipeline against production.
- Calendar UX legend removed.

### What Is Blocked

- **Google Maps** — missing `GOOGLE_MAPS_API_KEY` GitHub secret → map and average price.
- **Payments** — missing payment-provider contract/credentials → paid checkout.
- **Host UI** — not a credential; just missing implementation.

### What Is Broken

- `Booking` and `Reservation` can double-book under concurrent requests.
- Mobile booking does not complete to a confirmed, paid reservation.
- Home tab bar still partially overlapped by `ListingCard`.

### What Is Missing

- Host onboarding and listing creation mobile UI.
- Payment checkout in mobile.
- Host accept/decline and payout.
- Reviews, messaging, push notifications, Egyptian wallets.

### What We Should Stop Touching

- Booking date logic and availability engine — it works.
- Booking auth gate — it works.
- Core transaction request flow — manually verified.
- OTP flow — functional.
- Existing guest-first behavior — stable.

### Next 5 Actions

1. **P0** — Unify `Booking`/`Reservation` and add a nullable `booking_id` on `Reservation` to collapse occupancy into one table.
2. **P0** — Wire mobile `BookingScreen` to `POST /reservations` with a Paymob/Stripe payment checkout.
3. **P0** — Build host onboarding, KYC, and listing creation mobile screens.
4. **P0** — Provide admin KYC/listing review workflow.
5. **P1** — Add real Arabic copy, verified-host badge, and cultural-tag search filters.

### MVP Definition

StayOS MVP is a mobile-first Arabic closed-alpha marketplace where a phone-verified guest can search, view a verified listing, pay for a stay, and manage trips, while a phone/KYC-verified host can create listings, accept bookings, and receive payouts.

### Final Decision

**B. MVP NEAR COMPLETE — SPECIFIC GAPS REMAIN**

The core guest transaction from discovery through a `REQUESTED` booking is proven. However, the payment/confirmation close, host-side supply creation, and trust/review loop are not yet present. These are specific, well-defined gaps rather than architectural blockers. The correct next step is P0 execution on payment/reservation unification and host onboarding, not another full E2E build cycle.
