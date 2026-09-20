# FINAL AIRBNB BENCHMARK CLOSURE — StayOS

**Version**: 1.0.0
**Date**: 2026-10 (this pass)
**Branch**: `product-completion-review`
**Baseline**: code `3129415` + benchmark implementation pass on top
**Maintainer**: Lead Product Engineer (benchmark closure pass)
**Status**: AUTHORITATIVE — final requirement register for the Airbnb 1:1 behavioral benchmark

---

## 1. Authority and Method

- **External benchmark**: Airbnb's current documented product behavior — sole external source of product truth.
- **Implementation source**: StayOS's own architecture and contracts determine *how* equivalent behavior is implemented.
- **Excluded as product truth**: investor PDFs, old investor presentations, archived product specs (`archive/`, `docs/phase--1/`), old roadmaps, competitor products, generic best practices, and undocumented assumptions. Such files may only establish provenance.
- **Scope**: the "Stays" marketplace. Airbnb-only product lines (Experiences, Luxe, AirCover insurance programs, gift cards) are outside the agreed benchmark scope and are not counted.
- **Verification**: every "StayOS evidence" cell cites a file, route, or test observed on this branch during this pass. Nothing is marked implemented from memory.

## 2. Status Categories (only these are used)

| Code | Meaning |
|------|---------|
| A | IMPLEMENTED — BENCHMARK-SUPPORTED |
| B | PARTIALLY IMPLEMENTED — BENCHMARK-SUPPORTED |
| C | NOT IMPLEMENTED — BENCHMARK-SUPPORTED |
| D | IMPLEMENTED BUT BENCHMARK-AMBIGUOUS |
| E | IMPLEMENTED BUT NON-BENCHMARK |
| F | TECHNICAL-ONLY / NOT A PRODUCT REQUIREMENT |
| G | CONFLICTING IMPLEMENTATION |
| H | UNCLEAR — REQUIRES PRODUCT DECISION |

## 3. Requirement Register

### 3.1 Discovery / Search

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| DIS-01 | Destination text search | Airbnb destination search field | `q`, `city`, `governorate` filters; `SearchBar.tsx` | A | — | No | — | — | `ListingSearchFilters` |
| DIS-02 | Destination autocomplete | Airbnb autocomplete suggestions | `GET /locations/autocomplete`; SearchBar suggestions | A | — | No | — | — | locations router |
| DIS-03 | Popular location suggestions | Airbnb popular destinations | `GET /locations/popular`, `/locations/tree`; `PopularDestinations` | A | — | No | — | — | landing page renders it |
| DIS-04 | Date selection filters availability | Airbnb date picker filters inventory | `check_in`/`check_out` filters; `available_for_dates`; 90-day cap | A | — | No | — | — | `listings/services.py:593-627` |
| DIS-05 | Guest count filter | Airbnb "Who" guests stepper | `guests` filter; `max_guests` enforcement | A | — | No | — | — | filters + BookingPanel |
| DIS-06 | Guest-type split (adults/children/infants/pets) in search | Airbnb splits guests by type incl. pets | Search sends single `guests`; booking has adults/children/infants; `pets` filter exists | H | Search-level split missing | **YES — occupancy semantics for infants/children (do infants count toward capacity?) is a business rule** | Blocked by decision | — | SearchBar vs BookingPanel |
| DIS-07 | Pets filter | Airbnb pet filter | `pets` filter + `pets_allowed` on listing | A | — | No | — | — | filters |
| DIS-08 | Property type + category chips | Airbnb category bar + type filter | `property_type`, `category`, `CategoryChips` | A | — | No | — | — | landing + filters |
| DIS-09 | Bedrooms/beds/bathrooms filters | Airbnb rooms-and-beds filters | `bedrooms`, `beds`, `bathrooms` filters | A | — | No | — | — | filters |
| DIS-10 | Amenities filter | Airbnb amenities filter | `amenities` multi-filter | A | — | No | — | — | filters |
| DIS-11 | Price range filter | Airbnb min/max price | `min_price`/`max_price` | A | — | No | — | — | filters |
| DIS-12 | Free-cancellation filter | Airbnb "Free cancellation" toggle | `free_cancellation` filter | A | — | No | — | — | filters |
| DIS-13 | Instant Book filter | Airbnb Instant Book toggle | `instant_book` filter | A | — | No | — | — | filters |
| DIS-14 | Self check-in filter | Airbnb self check-in filter | `self_checkin` filter | A | — | No | — | — | filters |
| DIS-15 | Accessibility filter | Airbnb accessibility features filter | `accessibility` features filter | A | — | No | — | — | filters |
| DIS-16 | Host language filter | Airbnb host-language filter | `host_language` filter | A | — | No | — | — | filters |
| DIS-17 | Map + "search this area" bounds | Airbnb map updates results on move | map/list toggle; `sw_lat/sw_lng/ne_lat/ne_lng` on bounds change | A | — | No | — | — | `search/page.tsx` |
| DIS-18 | Sorting (relevance/price/rating) | Airbnb sort options | `sort`: `price_asc`, `price_desc`, `rating_desc`, default | A | — | No | — | — | filters |
| DIS-19 | Recently viewed | Airbnb recently-viewed strip | `RecentlyViewed` on landing | A | — | No | — | — | `page.tsx:20` |
| DIS-20 | Favorites (save listings) | Airbnb wishlists/save | Favorites API + `/favorites` page + heart toggle | A | Wishlist sharing/notes not benchmarked at this depth | No | — | — | favorites module |
| DIS-21 | Empty state | Airbnb no-results state | `search.noResults`/`noResultsHint` | A | — | No | — | — | `search/page.tsx:825` |
| DIS-22 | Error + retry | Airbnb error recovery | `isError` branch + retry | A | — | No | — | — | `search/page.tsx:809` |
| DIS-23 | URL/state persistence | Airbnb encodes search in URL | All filters driven by `searchParams` | A | — | No | — | — | search page |
| DIS-24 | Selected-date total price on cards | Airbnb shows all-in trip total when dates selected | `total_egp` (nightly + cleaning + service fee) + `nights` returned with date search | A | — | No | — | — | `listings/services.py:627-650` |

### 3.2 Listing Detail

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| LD-01 | Photo gallery | Airbnb gallery | `ListingPhoto` set + gallery component + cover photo | A | — | No | — | — | gallery module |
| LD-02 | Nightly price display | Airbnb nightly price | `price`/`currency` on detail | A | — | No | — | — | detail page |
| LD-03 | Fee breakdown + total | Airbnb price breakdown modal | Quote: accommodation, `cleaning_fee`, `service_fee`, total, nights | A | — | No | — | — | `useBookingQuote` + BookingPanel |
| LD-04 | Availability calendar on listing | Airbnb month calendar w/ blocked dates | **`AvailabilityCalendar`** — 2-month grid, per-day status + price, click-to-select range, blocked-day enforcement | A | — | No | **DONE this pass** | this pass | `AvailabilityCalendar.tsx` |
| LD-05 | Amenities display | Airbnb amenities grid | amenities list + icons | A | — | No | — | — | detail components |
| LD-06 | Rooms/beds/baths | Airbnb sleeping info | `bedrooms`, `beds`, `bathrooms`, `max_guests` | A | — | No | — | — | detail schema |
| LD-07 | Sleeping arrangements | Airbnb bed arrangement section | `sleeping_arrangements` | A | — | No | — | — | detail page |
| LD-08 | House rules | Airbnb house rules | `house_rules` | A | — | No | — | — | detail schema |
| LD-09 | Additional policies | Airbnb policies section | `policies` | A | — | No | — | — | detail schema |
| LD-10 | Check-in/check-out times | Airbnb check-in window display | `check_in_time`/`check_out_time` | A | — | No | — | — | detail schema |
| LD-11 | Cancellation policy display | Airbnb cancellation policy section | `cancellation_policy` shown pre-booking | A | — | No | — | — | detail page |
| LD-12 | Host profile summary | Airbnb host card | Host card w/ display name, bio, joined date | A | — | No | — | — | host profile endpoint |
| LD-13 | Host trust/verification | Airbnb verified host signals | KYC status, response rate, response time | A | — | No | — | — | host profile fields |
| LD-14 | Host languages | Airbnb "speaks" languages | `languages` on host profile | A | — | No | — | — | host profile fields |
| LD-15 | Guest trust signals | Airbnb guest-favorite/trust row | `TrustSignals` component | A | — | No | — | — | detail page |
| LD-16 | Reviews block w/ count + rating | Airbnb reviews header | `review_count`, `average_rating`, distribution | A | — | No | — | — | `ReviewsSection` |
| LD-17 | Review search | Airbnb "Search reviews" box | **`q` param on `GET /listings/{id}/reviews`** + debounced input | A | — | No | **DONE this pass** | this pass | `test_get_listing_reviews_passes_search_query` |
| LD-18 | Map + directions | Airbnb location map + directions | map + directions link | A | — | No | — | — | detail page |
| LD-19 | Share | Airbnb share sheet | share/copy link | A | — | No | — | — | detail page |
| LD-20 | Favorite on detail | Airbnb save heart | favorite toggle | A | — | No | — | — | favorites |
| LD-21 | Contact host | Airbnb "Contact host" | inquiry conversation CTA | A | — | No | — | — | `messages/inquiries` |
| LD-22 | Similar listings + host's other listings | Airbnb recommendations | similar listings + host listings sections | A | — | No | — | — | detail page |
| LD-23 | Accessibility info | Airbnb accessibility section | `accessibility_features` shown | A | — | No | — | — | detail schema |
| LD-24 | Self check-in info | Airbnb self check-in callout | `self_checkin` + methods shown | A | — | No | — | — | detail schema |
| LD-25 | Pets info | Airbnb pets indicator | `pets_allowed` shown | A | — | No | — | — | detail schema |
| LD-26 | Bilingual listing content | Airbnb translated listings | `title_ar`/`title_en` + bilingual description | A | — | No | — | — | listing schema |

### 3.3 Trust / Identity

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| TRUST-01 | Guest identity verification | Airbnb ID verification | KYC initiate/upload/review flow | A | — | No | — | `8994f6d` | `test_kyc.py` |
| TRUST-02 | Host identity verification | Airbnb host verification | Host KYC required for listing | A | — | No | — | `8994f6d` | KYC tests |
| TRUST-03 | KYC status visibility | Airbnb "verified" badge | `kyc_status` surfaced on profiles + gating | A | — | No | — | — | profile fields |
| TRUST-04 | Guest trust info visible to host | Airbnb shows host guest reviews/profile | `GET /guests/{id}/reviews` + guest display name on booking | A | — | No | — | — | guest-review endpoint |
| TRUST-05 | Host trust info visible to guest | Airbnb host card | host profile w/ KYC, response metrics | A | — | No | — | — | host profile |
| TRUST-06 | Membership/join date | Airbnb "Joined in …" | `joined` on host profile | A | — | No | — | — | host profile |
| TRUST-07 | Review count as trust signal | Airbnb review counts | review counts on host/listing | A | — | No | — | — | aggregates |
| TRUST-08 | Verification badges | Airbnb verified badges | KYC-verified indicators | A | — | No | — | — | profile UI |
| TRUST-09 | Authorization boundaries | Airbnb role-scoped actions | RBAC + ownership checks | A | — | No | — | — | 53 authz tests |
| TRUST-10 | Pre-booking info access | Airbnb contact-before-book | inquiry contact w/o booking | A | — | No | — | — | `messages/inquiries` |
| TRUST-11 | Post-confirmation info release | Airbnb check-in details post-booking | check-in instructions gated by `pre_arrival_release_hours` | A | — | No | — | — | `/stay` gating |
| TRUST-12 | Automated identity verification | Airbnb automated ID checks | Textract/Rekognition paths coded; manual review fallback proven | H | ML region/provider undecided | **YES — KYC-ML architecture (founder)** | Blocked by decision | — | handoff §14 |
| TRUST-13 | Review moderation pipeline | Airbnb content moderation of reviews | `published` flag exists; no report/moderation workflow | H | Moderation policy undefined | **YES — moderation/report policy (founder)** | Blocked by decision | — | REV-14/15 |

### 3.4 Booking

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| BK-01 | Request-to-book | Airbnb request flow | `requested` status + create booking | A | — | No | — | — | booking tests |
| BK-02 | Instant Book | Airbnb instant book | `instant_book` flag + auto-accept path | A | — | No | — | — | booking services |
| BK-03 | Host accept | Airbnb accept | `accept` → `accepted` | A | — | No | — | — | booking tests |
| BK-04 | Host reject | Airbnb decline | `reject` → `rejected` | A | — | No | — | — | booking tests |
| BK-05 | 24h host-response expiration | Airbnb request expires after 24h | `expire_unanswered_bookings` task + `REQUEST_EXPIRATION_HOURS` + system-cancel + notify | A | — | No | — | — | `bookings/tasks.py:57+` |
| BK-06 | Inventory locking on accept | Airbnb blocks dates on confirmed request | availability blocks written on accept | A | — | No | — | — | booking services |
| BK-07 | Conflict protection | Airbnb prevents double-booking | overlap checks + calendar blocks + atomic accept | A | — | No | — | — | booking tests |
| BK-08 | Booking confirmation | Airbnb confirmation state | `confirmed` after payment verified | A | — | No | — | — | lifecycle |
| BK-09 | Payment timing (pay after accept) | Airbnb charge at confirm/accept | payment created post-accept w/ 24h deadline; `expire_unpaid_bookings` task | A | — | No | — | — | `bookings/tasks.py:23` |
| BK-10 | Cancellation w/ consequence | Airbnb cancel flow w/ policy | cancel preview + tiered refund engine | A | — | No | — | — | `services._cancellation_actor`+refund calc |
| BK-11 | Stay lifecycle check-in/check-out/complete | Airbnb trip lifecycle | `check_in`, `check_out`, `completed`, `no_show` | A | — | No | — | — | booking services |
| BK-12 | Booking date modification | Airbnb alteration requests | not implemented | H | Alteration-request flow absent | **YES — founder decides if/when alterations exist** | Blocked by decision | — | — |
| BK-13 | Guest no-show handling | Airbnb no-show resolution | `no_show` status + no-refund rule | A | — | No | — | — | decided rules |
| BK-14 | Booking message to host | Airbnb note to host w/ request | `message` on booking create | A | — | No | — | — | schemas |

### 3.5 Inquiries / Pre-Booking Communication

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| INQ-01 | Guest inquiry before booking | Airbnb "Contact host" inquiry | `POST /messages/inquiries` | A | — | No | — | — | messages services |
| INQ-02 | Host discovery of inquiry | Airbnb inbox | inquiry conversation in inbox + notify | A | — | No | — | — | notifications |
| INQ-03 | Host reply | Airbnb reply in thread | same conversation replies | A | — | No | — | — | messages |
| INQ-04 | Inquiry persistence | Airbnb thread persists | conversation reuse by guest+unit | A | — | No | — | — | services reuse |
| INQ-05 | Inquiry→booking continuity | Airbnb same thread after booking | inquiry conversation preserved; reservation thread for booking events | A | — | No | — | — | conversation types |
| INQ-06 | Pre-approval | Airbnb host can pre-approve dates | not implemented | H | — | **YES — founder** | Blocked | — | — |
| INQ-07 | Special offer (custom price) | Airbnb host special offer | not implemented | H | — | **YES — founder; no invented pricing rules** | Blocked | — | — |
| INQ-08 | Inquiry authorization | Airbnb participant-only | guest-only initiate; can't contact own listing | A | — | No | — | — | messages services |

### 3.6 Messaging

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| MSG-01 | Pre-booking inquiry messaging | Airbnb inquiry thread | `inquiry` conversation type | A | — | No | — | — | services |
| MSG-02 | Booking messaging | Airbnb reservation thread | `reservation` conversation auto-created on booking | A | — | No | — | — | booking flow |
| MSG-03 | Host↔guest conversation | Airbnb messaging | participant-scoped messages | A | — | No | — | — | messages |
| MSG-04 | Participant authorization | Airbnb thread privacy | participant check on read/write | A | — | No | — | — | authz tests |
| MSG-05 | Unread state | Airbnb unread badges | read-state tracking | A | — | No | — | — | messages |
| MSG-06 | Conversation list + detail navigation | Airbnb inbox UI | `/messages` + `/messages/[id]` pages | A | — | No | — | — | web routes |
| MSG-07 | Persistence | Airbnb thread history | DB-persisted messages | A | — | No | — | — | models |
| MSG-08 | Notification deep-link to thread | Airbnb notification opens thread | notification recipient + link handling | A | — | No | — | — | notifications |
| MSG-09 | Support channel | Airbnb help inbox | `support` conversation type + `/support` | A | — | No | — | — | support route |

### 3.7 Payments (product behavior only)

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| PAY-01 | Payment initiation after accept | Airbnb pay at confirm | payment created on accept, 24h deadline | A | — | No | — | — | payment services |
| PAY-02 | Payment instructions | Airbnb payment method UI | bank + Vodafone Cash instructions (placeholders) | B | Instructions render but destination accounts are placeholders — **release blocker, not benchmark gap** | No (founder provides account data) | Blocked by data | — | checkout page |
| PAY-03 | Payment proof submission | Airbnb payment confirmation | proof upload (presigned, MIME-typed) | A | — | No | — | `3129415` | `test_payments.py` |
| PAY-04 | Payment verification | Airbnb payment confirmed state | staff verify/reject + status transitions | A | — | No | — | — | payment tests |
| PAY-05 | Payment status visibility | Airbnb payment status | status on booking/trip detail | A | — | No | — | — | trips/payments |
| PAY-06 | Receipt/payment record | Airbnb receipt | payment record w/ amounts on booking detail + `/payments` list | A | Formal PDF invoice = founder/legal | No | — | — | payments pages |
| PAY-07 | Payment amount = quote | Airbnb charge equals quote | payment created from quote breakdown | A | — | No | — | — | payment tests |
| PAY-08 | Fee breakdown | Airbnb fee line items | accommodation/cleaning/service fee breakdown | A | — | No | — | — | quote schema |
| PAY-09 | Refund amount visibility | Airbnb refund preview | cancel preview computes refund | A | — | No | — | — | refund calc |
| PAY-10 | Refund state tracking | Airbnb refund status | `refund_status` + 5-business-day rule | A | — | No | — | — | payments/finance |
| PAY-11 | Guest visibility | Airbnb guest payment view | guest payments list + booking detail | A | — | No | — | — | routes tested |
| PAY-12 | Host visibility | Airbnb transaction history | host payment activity list | A | — | No | — | — | `/payments/host` |
| PAY-13 | Admin visibility + reconciliation | Airbnb internal ops | admin payments + finance views | A | — | No | — | — | admin routes |
| PAY-14 | Error/recovery on proof | Airbnb retry payment | 3 rejections in 48h resubmit window + controlled 503 | A | — | No | — | `3129415` | decided rules |
| PAY-15 | Online card/wallet processing | Airbnb online payment | manual collection only; Paymob/Stripe code dormant | H | Processor undecided | **YES — Paymob vs Stripe (founder, unresolved)** | Blocked by decision | — | DEC-004 conflict |

### 3.8 Cancellation / Refunds

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| CX-01 | Policy visible before booking | Airbnb policy on listing | `cancellation_policy` on detail | A | — | No | — | — | detail page |
| CX-02 | Cancel action | Airbnb cancel flow | guest/host cancel w/ actor check | A | — | No | — | — | booking services |
| CX-03 | Policy consequence (tiered) | Airbnb tiered refunds | tiered refund engine on approved rules | A | — | No | — | — | refund calc |
| CX-04 | Refund amount preview | Airbnb shows refund before confirm | cancellation preview endpoint | A | — | No | — | — | preview API |
| CX-05 | Refund status | Airbnb refund pending state | `refund_status` lifecycle | A | — | No | — | — | payments |
| CX-06 | Refund processing state | Airbnb processing ETA | 5-business-day rule recorded | A | — | No | — | — | decided rules |
| CX-07 | Guest cancel experience | Airbnb guest cancel UI | cancel from trip detail w/ preview | A | — | No | — | — | trips |
| CX-08 | Host cancel experience | Airbnb host cancel | host cancel w/ penalty rules (100% guest refund) | A | — | No | — | — | decided rules |
| CX-09 | Admin reconciliation | Airbnb ops | admin refund/finance views | A | — | No | — | — | admin routes |
| CX-10 | Cancel error/recovery | Airbnb cancel failure handling | guarded transitions + notifications | A | — | No | — | — | services |

### 3.9 Trips / Stay Lifecycle

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| TRIP-01 | Upcoming/past/cancelled/all | Airbnb trips tabs | trips list filters by state | A | — | No | — | — | `/bookings` pages |
| TRIP-02 | Trip detail | Airbnb trip page | booking detail page | A | — | No | — | — | `/bookings/[id]` |
| TRIP-03 | Booking status on trip | Airbnb status chip | status surfaced | A | — | No | — | — | detail |
| TRIP-04 | Payment status on trip | Airbnb payment state | payment status on detail | A | — | No | — | — | detail |
| TRIP-05 | Refund status on trip | Airbnb refund state | refund status on detail | A | — | No | — | — | detail |
| TRIP-06 | Messaging from trip | Airbnb message host | conversation link | A | — | No | — | — | detail |
| TRIP-07 | Directions | Airbnb directions link | directions on listing/stay info | A | — | No | — | — | detail |
| TRIP-08 | Check-in info release | Airbnb check-in instructions | gated `pre_arrival_release_hours` | A | — | No | — | — | `/stay` gating |
| TRIP-09 | Check-in | Airbnb arrival | `check_in` action | A | — | No | — | — | lifecycle |
| TRIP-10 | Check-out | Airbnb departure | `check_out` action | A | — | No | — | — | lifecycle |
| TRIP-11 | Completion | Airbnb trip complete | `completed` transition | A | — | No | — | — | lifecycle |
| TRIP-12 | Review eligibility surfaced | Airbnb "leave a review" prompt | review window + eligibility on booking + `REVIEW_REMINDER` automation | A | — | No | — | — | services |
| TRIP-13 | Cancel from trip | Airbnb cancel in trip | cancel action w/ preview | A | — | No | — | — | detail |

### 3.10 Reviews / Reputation

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| REV-01 | Guest→listing review | Airbnb guest review | `POST /bookings/{id}/reviews` | A | — | No | — | — | `test_reviews.py` |
| REV-02 | Host→guest review | Airbnb host reviews guest | `POST /bookings/{id}/host-reviews` | A | — | No | — | — | tests |
| REV-03 | Review eligibility | Airbnb completed stays only | completed/self-checkout gate | A | — | No | — | — | tests |
| REV-04 | 14-day review window | Airbnb 14-day window | `PUBLICATION_WINDOW_DAYS` + expiry tests | A | — | No | — | — | expiry tests |
| REV-05 | Simultaneous publication | Airbnb blind double-review | counterpart-publish-or-deadline logic | A | — | No | — | — | `is_review_published` |
| REV-06 | Review visibility | Airbnb public reviews | published filter in list | A | — | No | — | — | repository |
| REV-07 | Review history | Airbnb profile reviews | guest + listing review lists | A | — | No | — | — | endpoints |
| REV-08 | Host public response | Airbnb host reply | `POST /reviews/{id}/host-response` | A | — | No | — | — | tests |
| REV-09 | Subratings | Airbnb 6 category ratings | 6 subrating keys + averages + distribution | A | — | No | — | — | schema + UI |
| REV-10 | Rating distribution | Airbnb histogram | `rating_distribution` | A | — | No | — | — | repository |
| REV-11 | Pagination | Airbnb paginated reviews | limit/offset + "show more" | A | — | No | — | — | ReviewsSection |
| REV-12 | Ordering | Airbnb relevance/recent | newest-first + `q` search | A | — | No | **search DONE this pass** | this pass | repository order |
| REV-13 | Review authorization | Airbnb role-scoped | guest/host role checks | A | — | No | — | — | tests |
| REV-14 | Report review | Airbnb "report review" | not implemented | H | — | **YES — moderation/report policy (founder)** | Blocked | — | — |
| REV-15 | Review moderation | Airbnb content review | not implemented | H | — | **YES — founder** | Blocked | — | — |
| REV-16 | Review search | Airbnb keyword search | `q` param + debounced input | A | — | No | **DONE this pass** | this pass | new tests |
| REV-17 | Review reminder | Airbnb review prompt | `REVIEW_REMINDER` automation | A | — | No | — | — | automation type |
| REV-18 | Reputation aggregates | Airbnb profile reputation | avg rating + count on host/listing | A | — | No | — | — | aggregates |

### 3.11 Host Experience

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| HOST-01 | Listing creation | Airbnb create listing | full `ListingCreate` (draft→publish) | A | — | No | — | — | schemas |
| HOST-02 | Listing editing | Airbnb edit listing | edit page + update schema | A | — | No | — | — | `/host/listings/[id]/edit` |
| HOST-03 | Photo management | Airbnb photo manager | presigned upload + reorder + cover + captions | A | — | No | — | `3129415` | photo tests |
| HOST-04 | Amenities editing | Airbnb amenities editor | amenities field | A | — | No | — | — | form |
| HOST-05 | Pricing controls | Airbnb nightly+cleaning+multipliers | base, cleaning, weekend/peak multipliers | A | — | No | — | — | schema |
| HOST-06 | Weekly/monthly discounts | Airbnb length-of-stay discounts | not implemented | H | — | **YES — pricing decision (founder)** | Blocked | — | — |
| HOST-07 | Availability/calendar management | Airbnb host calendar | host calendar + availability pages + calendar rules | A | — | No | — | — | hostCalendar |
| HOST-08 | Booking settings / Instant Book | Airbnb booking settings | `instant_book` toggle + min/max nights | A | — | No | — | — | schema |
| HOST-09 | Reservation inbox | Airbnb reservations list | host bookings + reservations inbox | A | — | No | — | — | hostBookings |
| HOST-10 | Pending-action visibility | Airbnb "needs attention" | `hostToday` actionable items ("Needs check-in" etc.) | A | — | No | — | — | hostToday keys |
| HOST-11 | Booking detail | Airbnb reservation detail | host booking detail | A | — | No | — | — | routes |
| HOST-12 | Guest identity/trust on reservation | Airbnb shows guest profile | guest display + guest review history | A | — | No | — | — | endpoints |
| HOST-13 | Messaging | Airbnb host inbox | conversation participant | A | — | No | — | — | messages |
| HOST-14 | Host cancellation | Airbnb host cancel | cancel w/ consequence rules | A | — | No | — | — | services |
| HOST-15 | Payment/refund visibility | Airbnb transaction history | host payment activity + earnings | A | — | No | — | — | `/payments/host` |
| HOST-16 | Earnings dashboard | Airbnb earnings | `hostEarnings` page + finance data | A | Payout method config = non-product blocker | No | — | — | earnings page |
| HOST-17 | Public host profile | Airbnb host page | `/hosts/[hostId]` public page | A | — | No | — | — | route |
| HOST-18 | Host reviews guest | Airbnb rate guest | host-review flow | A | — | No | — | — | tests |
| HOST-19 | Operations dashboard | Airbnb host hub | `hostToday` dashboard + operations events | A | — | No | — | — | operations |
| HOST-20 | Co-hosts | Airbnb co-host feature | co-host models + routes + permissions | A | — | No | — | — | cohost_models |
| HOST-21 | Smart pricing | Airbnb smart pricing | not implemented | H | — | **YES — pricing strategy (founder)** | Blocked | — | — |
| HOST-22 | Listing import | Airbnb listing tools | importer module (bulk ops) | E | Beyond benchmark — internal tooling | No | — | — | importer module |

### 3.12 Admin / Operations

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| ADM-01 | KYC review queue | Airbnb verification ops | admin KYC review (manual fallback proven) | A | — | No | — | `8994f6d` | KYC tests |
| ADM-02 | Listing moderation | Airbnb listing review | moderation queue + pending page | A | — | No | — | — | moderation.py |
| ADM-03 | Payment verification | Airbnb payments ops | staff verify/reject proofs | A | — | No | — | — | payment tests |
| ADM-04 | Refund administration | Airbnb refund ops | refund status + finance views | A | — | No | — | — | finance |
| ADM-05 | Disputes | Airbnb resolution center | disputes module + admin UI | A | — | No | — | — | disputes |
| ADM-06 | Staff permissions | Airbnb internal roles | staff role + scoped permissions | A | — | No | — | — | adminStaff |
| ADM-07 | Operations metrics | internal tooling | operations module + metrics | F | Technical-only | No | — | — | operations |
| ADM-08 | Discovery moderation | internal tooling | `adminDiscovery` surfaces | E | Non-benchmark ops | No | — | — | admin routes |
| ADM-09 | Admin/host boundary | Airbnb ops cannot act as host | admin cannot accept/reject bookings (tested) | A | — | No | — | — | authz tests |
| ADM-10 | Authorization on admin routes | internal security | role-gated admin endpoints | A | — | No | — | — | 53 authz tests |
| ADM-11 | Auditability | internal security | security audit + outbox events | F | Technical-only | No | — | — | security/audit |

### 3.13 Localization

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| LOC-01 | Arabic | Airbnb Arabic locale | `ar.json` 1445 keys | A | — | No | — | — | parity check |
| LOC-02 | English | Airbnb English | `en.json` 1445 keys | A | — | No | — | — | parity check |
| LOC-03 | RTL layout | Airbnb RTL for Arabic | `dir=rtl` on `ar` locale | A | — | No | — | — | locale layout |
| LOC-04 | LTR layout | Airbnb LTR | `dir=ltr` on `en` | A | — | No | — | — | layout |
| LOC-05 | Language switching | Airbnb locale picker | locale routes + switching | A | — | No | — | — | `[locale]` routing |
| LOC-06 | URL locale state | Airbnb locale in URL | `/en`, `/ar` path segments | A | — | No | — | — | middleware |
| LOC-07 | Translated strings | Airbnb full translation | 1445/1445 parity, zero missing | A | — | No | — | — | key-parity check |
| LOC-08 | Missing-translation handling | n/a | zero missing keys both directions | A | — | No | — | — | verified |
| LOC-09 | Date/number/currency formatting | Airbnb localized formats | `ar-EG`/`en-EG` formatting + EGP | A | — | No | — | — | `formatMoney` |
| LOC-10 | Multi-currency display | Airbnb currency switcher | EGP-only | H | — | **YES — single-market decision (founder)** | Blocked | — | — |

### 3.14 Error / Recovery

| ID | Benchmark behavior | Airbnb evidence | StayOS evidence | Status | Gap | Decision? | Implementable now? | Commits | Tests/evidence |
|----|--------------------|-----------------|-----------------|--------|-----|-----------|--------------------|---------|----------------|
| ERR-01 | API error surfacing | Airbnb error states | `to_http_exception` + `getApiErrorMessage` + inline errors | A | — | No | — | — | exceptions |
| ERR-02 | Unavailable inventory | Airbnb blocked-date UX | `datesUnavailable` + calendar enforcement + conflict 409 | A | — | No | — | this pass | calendar + validation |
| ERR-03 | Payment failure recovery | Airbnb retry payment | rejection → resubmit (3/48h) + deadline expiry | A | — | No | — | — | decided rules |
| ERR-04 | Upload failure | Airbnb upload errors | controlled 503 (unconfigured storage) + MIME 422 | A | — | No | — | `3129415` | regression tests |
| ERR-05 | KYC failure | Airbnb verification retry | pending → manual review fallback | A | — | No | — | `8994f6d` | KYC tests |
| ERR-06 | Booking conflict | Airbnb conflict handling | atomic accept + overlap guard | A | — | No | — | — | booking tests |
| ERR-07 | Expired request | Airbnb request expired state | `request_expired` system-cancel + notify | A | — | No | — | — | tasks |
| ERR-08 | Retry affordances | Airbnb retry buttons | retry on search/reviews/detail error states | A | — | No | — | — | components |
| ERR-09 | Recovery from partial state | Airbnb resilient flow | status-machine guards + outbox | A | — | No | — | — | services |
| ERR-10 | State persistence | Airbnb URL-driven state | searchParams + route state | A | — | No | — | — | pages |
| ERR-11 | Navigation recovery | Airbnb back/refresh safe | route-based state, no client-only critical state | A | — | No | — | — | App Router |

---

## 4. Final Gap Classification

### LIST 1 — BENCHMARK-COMPLETE
All rows marked **A** above (187 of 204 requirements): discovery/search depth, listing-detail depth, trust/identity surface, full booking lifecycle (incl. 24h host-response expiry and inventory locking), inquiry→booking continuity, messaging, manual-payment product behavior, tiered cancellation/refunds, trips lifecycle, review system (incl. simultaneous publication, subratings, host responses, review search), host experience (incl. co-hosts, earnings, ops dashboard), admin boundaries, full AR/EN localization, and error/recovery coverage.

### LIST 2 — REAL IMPLEMENTABLE BENCHMARK GAPS
Found **2**, both **implemented in this pass**:

| Gap | Benchmark basis | Implementation |
|-----|-----------------|----------------|
| Availability calendar on listing detail | Airbnb shows a month calendar with blocked dates on the listing page | `AvailabilityCalendar.tsx`: 2-month grid from `GET /listings/{id}/availability` (existing contract, ≤90d), per-night price, click-to-select range, blocked-range enforcement, clear-dates — wired into `BookingPanel` |
| Review search | Airbnb "Search reviews" box on listing pages | `q` query param on `GET /listings/{id}/reviews` (escaped `ILIKE`), debounced search input + no-results state in `ReviewsSection` |

Incidental fix in this pass (technical, not a benchmark item): `tests/test_payments.py` imported `TestClient` nowhere — collection failure; added the import.

### LIST 3 — FOUNDER PRODUCT DECISIONS
| ID | Decision | Why it cannot be implemented unilaterally |
|----|----------|--------------------------------------------|
| DIS-06 | Guest-type split in search (adults/children/infants/pets) | Requires occupancy semantics: do infants/children count toward `max_guests`? Business rule. |
| TRUST-12 | KYC automated-verification architecture (Textract/Rekognition region, or manual-only at launch) | AWS architecture + legal (PDPL) implications. |
| TRUST-13 / REV-14 / REV-15 | Review report + moderation workflow | Moderation policy is a product/legal decision; report reasons, appeal flow, removal rules undefined. |
| BK-12 | Booking date modification (alteration requests) | Requires rules: repricing, host approval, deadline interaction. |
| INQ-06 | Host pre-approval | Defines pre-booking commitment semantics. |
| INQ-07 | Special offers (custom pricing) | Requires pricing-override rules — inventing them is prohibited. |
| HOST-06 | Weekly/monthly length-of-stay discounts | Pricing policy. |
| HOST-21 | Smart pricing / dynamic pricing | Strategy + data dependencies. |
| LOC-10 | Multi-currency display | Single-market (EGP) launch is a market decision. |
| PAY-15 | Online processor (Paymob vs Stripe; recorded conflict DEC-004 vs FLOWS.md) | Unresolved documented conflict; explicitly not to be resolved by engineering. |

### LIST 4 — NON-PRODUCT / RELEASE BLOCKERS
(Not benchmark gaps; tracked in `docs/RELEASE_TECHNICAL_HANDOFF.md` §14)

- Real collection account + Vodafone Cash destination (placeholder values in config).
- AWS/S3 buckets + IAM + Railway env vars (KYC, listings, payment-proof — `S3_PAYMENT_PROOF_BUCKET` undefined on Railway).
- KYC-ML infrastructure decision follow-through.
- Payment processor legal/infrastructure setup.
- Egyptian legal entity + CBE/PDPL counsel review.
- Akedly OTP live verification; `ENVIRONMENT=production` gate.
- Malformed `GoogleـMapsـAPI` variable name on worker/beat; Google key rotation unconfirmed.
- Production domain + CORS; backups; Sentry.
- Mobile: OPPO booking-CTA + map/list-toggle P0s; ADR-016 framework decision; store credentials.

## 5. Gate Result

- **Implementable benchmark gaps remaining**: **0**
- **AIRBNB BENCHMARK PRODUCT COMPLETION GATE**: **PASSED — subject to the LIST 3 founder decisions** (which are product choices, not missing benchmark behavior).
- Differentiation work unlocks per `STAYOS_DIFFERENTIATION_GATE.md` once this register holds no unresolved implementable gaps — condition met for code; LIST 3 items stay open until the founder rules.

## 6. Verification (this pass)

- Backend: **1160 tests passed, 80.60% coverage** (incl. new review-search tests).
- Frontend: typecheck clean; lint clean (pre-existing warnings only); Vitest **12/12**; production build succeeded.
- API: `generate:api` run — OpenAPI regenerated, `q` param present in `api-types.ts`.
- Mobile: `tsc --noEmit` passing (prior verification this branch); no mobile changes this pass.
- Git: branch `product-completion-review`; `main` untouched.
