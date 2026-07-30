# Feature Reasoning — StayOS

**Domain**: Product
**Audience**: Product Team, Engineering, Founders, New Team Members
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Quarterly
**Tags**: product, features, decisions, architecture, FC-01–FC-07, rationale, marketplace, MENA

---

## Purpose

This article explains WHY StayOS built what it built — not what was built (the code does that) but the reasoning behind each major feature set, the problems they solve, and the tradeoffs that were accepted. This knowledge prevents future teams from rebuilding things that were deliberately removed or adding things that were deliberately deferred.

---

## Background

StayOS implemented FC-01 through FC-07 — a complete platform — before the first manual transaction was validated. This creates a governance tension: the code is ahead of the customer validation. Understanding WHY each feature exists and WHAT STAGE it serves is critical to making correct product decisions going forward.

The principle that governs all feature decisions: **build what the marketplace requires to function safely, defer what serves optimized operation.** A marketplace that works with 10 listings and 10 bookings needs different features than one with 500 listings and 5,000 bookings.

---

## FC-01: Authentication and KYC

**Problem being solved**: Egypt's informal accommodation market has zero identity verification. Guests are anonymous. Hosts have no idea who is entering their property. This creates a trust environment where both sides are taking significant risk on every transaction.

**Why this had to be built first**: Every other feature depends on knowing who the user is. Payments require identity. Dispute resolution requires identity. Security deposits require identity. You cannot build a trust-based marketplace without first solving identity.

**What it does**: JWT-based authentication, two-factor verification, national ID + selfie comparison using AWS Textract (OCR) and AWS Rekognition (face comparison). Confidence threshold at 90% for automatic approval.

**Why AWS Textract + Rekognition, not a third-party KYC service**: Cost and flexibility. Third-party KYC services (Jumio, Onfido) charge USD 1.50–5.00 per verification. At Egypt price points and Egyptian average salaries, this per-verification cost is prohibitively expensive for a bootstrap marketplace. AWS Textract + Rekognition costs approximately USD 0.01–0.05 per verification at scale. The tradeoff: more engineering work at setup, but dramatically lower marginal cost.

**Why we require KYC for all users, not just hosts**: Two reasons. (1) Guest identity protects hosts — a host who has never rented before is taking a significant risk on an unknown person. (2) Guest identity is needed for chargeback defense. A guest whose identity is verified cannot credibly claim "I never made this booking."

**Known limitations**: The 90% confidence threshold will reject some legitimate users with poor photo quality (estimated 10–15% of users need to retry). This is acceptable: a retry is a small friction, and a false approval is a trust failure.

**Deliberately deferred**: SSO (Google/Apple login), biometric authentication, ongoing identity refresh for long-tenured users. These are Stage 2+ features.

---

## FC-02: Spatial Search

**Problem being solved**: A user searching for accommodation in Cairo shouldn't have to search by "Cairo, Egypt" and get results from Alexandria. Accommodation discovery is geographic in nature, and PostGIS (spatial database extension) makes geographic filtering fast and accurate.

**Why PostGIS**: The Python GIS library ecosystem (shapely, geoalchemy2) integrates cleanly with SQLAlchemy and PostgreSQL. PostGIS is the industry standard for geospatial data in relational databases. It handles point-in-polygon queries (is this listing within my search radius?), distance calculations, and bounding box searches natively in the database — which is far faster than doing this calculation in application code.

**What it does**: Listings have a PostGIS `geography` point. Search queries filter by distance from the search center point. Results are ordered by relevance (combination of distance, price, and availability).

**Why we chose geographic concentration as the business strategy**: A search that returns 5 results across 20 square kilometers is a failed search — the user can't evaluate options in their head. A search that returns 15 results within a 2 km radius feels like a real marketplace. This guided the business decision (DEC-005): concentrate supply in a small geographic area before expanding.

**Deliberately deferred**: Map view browsing (requires mobile-native map integration), neighborhood boundary search, "near X landmark" search. These are UX features that require supply density to be valuable.

---

## FC-03: Booking Engine

**Problem being solved**: The calendar integrity problem. An accommodation marketplace that allows double-bookings (two guests booked for the same property on the same date) is broken. The fundamental constraint: a physical property can only be occupied by one booking at a time.

**Why this is technically hard**: Concurrency. Two guests clicking "book" simultaneously on the same property with overlapping dates. Without proper database locking, both can succeed and you have a double-booking. This is not a hypothetical edge case — at any meaningful scale, simultaneous bookings will happen.

**What it does**: Atomic reservation creation with optimistic locking. Calendar integrity enforced at the database level (BR-INV-01: no overlapping confirmed reservations). Availability checks and reservation creation are a single atomic transaction — the gap between "is it available?" and "book it" is eliminated.

**Why inventory locking is at the database level, not the application level**: Application-level locking (checking availability in Python code, then creating a booking) leaves a race condition window. Database-level locking (SELECT FOR UPDATE on the property's calendar rows) eliminates the race condition entirely.

**What BR-INV-01 and BR-INV-02 enforce**: BR-INV-01 prevents overlapping confirmed bookings. BR-INV-02 requires a minimum gap between check-out and check-in on the same property (the turnover window). If check-out is at 11am and check-in is at 3pm, the 4-hour window is protected — a booking that would violate this gap is rejected.

**Deliberately deferred**: Instant booking vs. request-to-book options per host (hosts currently cannot choose; all bookings are instant). Price variation by day of week or season (hosts set a flat nightly rate; dynamic pricing is Stage 2). Hold with timer ("hold for 15 minutes while you pay") is not implemented.

---

## FC-04: Host Operations

**Problem being solved**: A host who joins StayOS needs tools to manage their listing — update availability, set pricing, block dates, view earnings. Without a host-facing management interface, every calendar change requires contacting StayOS support.

**What it does**: Host dashboard APIs: listing management (create, update photos, update description, update pricing), calendar management (block dates, set minimum stay, set advance notice required), earnings summary.

**Why API-first, not UI-first**: The engineering team built the API layer (FastAPI endpoints). The host-facing UI is built on top of these APIs. Building APIs first means the UI can be iterated on independently from the data layer. It also enables a future mobile app without re-engineering the backend.

**Deliberate choice**: Host operations are designed for individual hosts (single property management). Institutional property manager workflows (multi-property management, team access, consolidated reporting) are deferred to Stage 2. The business rationale: Stage 1 supply strategy (DEC-005) starts with hotels and institutional supply, but these partners are onboarded manually with StayOS managing their listings directly. The self-service multi-property management tools come later.

---

## FC-05: Operations and Turnover

**Problem being solved**: The turnover problem. Between checkout and check-in, a property must be cleaned, inspected, and verified as ready. Without a managed workflow for this, the process is untrackable — operations knows cleaning was assigned but doesn't know if it was completed, or if the property was inspected and approved.

**What it does**: Automated turnover ticket creation at checkout, cleaning subtask and inspection subtask assignment, photo upload requirement at each step (BR-OPS-03), property status tracking (DIRTY → CLEANING → INSPECTING → READY).

**Why photos are required at each step (BR-OPS-03)**: This requirement has two purposes simultaneously. (1) It creates a verifiable quality record — if a guest complains about cleanliness, the pre-cleaning as-found photos and post-cleaning inspection photos provide evidence. (2) It disciplines the cleaning and inspection process — cleaners who know their work is photo-documented maintain higher standards than those who know only their word will be taken.

**Why inspection is a separate subtask from cleaning**: The person who cleans the property cannot objectively inspect the result of their own work. The inspection must be done by a second person (or the cleaner must wait and do it with fresh eyes). Separate subtasks enforce this separation.

**Deliberately deferred**: Smart lock integration (cleaner access via temporary code), automated assignment of cleaning teams based on schedule optimization, AR/camera-based inspection checklists. These are Stage 3 features.

---

## FC-06: Finance and Escrow

**Problem being solved**: Money flows in three directions on a marketplace: guest → platform → host (minus commission). Managing this without a proper financial ledger creates errors, disputes, and regulatory compliance problems. The escrow mechanism requires the platform to hold guest money in trust and release it only after verified check-in (BR-FIN-01).

**What it does**: Double-entry ledger for every financial transaction. Escrow state machine (PENDING → LOCKED → RELEASED / REFUNDED). Automated 24-hour hold after check-in. Payout calculation and routing. Cancellation refund policy enforcement.

**Why double-entry ledger**: Every financial transaction creates two entries (debit and credit). This makes it impossible to "lose" money — the ledger always balances. It also satisfies Egyptian accounting regulations and makes tax compliance tractable.

**Why 24-hour hold specifically**: It's the minimum window that allows a guest to discover and report a material discrepancy between the listing and reality (BR-FIN-01 rationale). Less than 24 hours: a guest might not have explored the full property. More than 24 hours: host cash flow is significantly impacted.

**Payment processor decision (DEC-004)**: Paymob is the primary processor. Stripe is referenced in the engineering code as a secondary processor. This conflict (two processors implemented, one primary) needs resolution before go-live. See the Decision Log.

**Deliberately deferred**: Split payments (multiple guests contributing to one booking), multi-currency support, consolidated payout for multi-property hosts, automated tax reporting. Stage 2+ features.

---

## FC-07: Platform Hardening

**Problem being solved**: A marketplace that connects strangers in physical spaces must be hardened against abuse. Rate limiting, security headers, input validation, and structured error handling are not features — they are the baseline for a production-grade platform.

**What it does**: Rate limiting on all authentication endpoints (prevents brute force attacks), structured logging and error handling, SQL injection prevention (enforced by SQLAlchemy ORM), XSS prevention (enforced at the API layer), CORS configuration for the Next.js frontend.

**Why this was a dedicated sprint, not just "good practices throughout"**: Security features are easy to defer individually when they compete with business features. Making platform hardening a dedicated sprint with specific deliverables ensures it actually gets done rather than being "we'll get to it."

**83 tests written in FC-07 alone**: The high test count reflects that hardening requires testing negative cases (what happens when someone sends malformed input? What happens when someone attempts SQL injection?) in addition to positive cases.

---

## What Was Deliberately NOT Built

Understanding what was removed or deferred is as important as understanding what was built:

**Not built (by design)**:
- **Review system with dispute prevention**: Reviews are critical for marketplace trust, but building a review system that can be gamed (hosts retaliating, guests extorting) requires careful design. Deferred to Stage 2 with proper design.
- **Instant messaging between guests and hosts**: WhatsApp is the primary communication channel (DEC-009). Building an in-platform messaging system duplicates WhatsApp with lower quality. Deferred unless messaging data collection becomes critical.
- **Dynamic pricing engine**: Hosts set flat rates in Stage 1. Dynamic pricing (based on demand, events, seasonality) is a Stage 2 feature that requires booking history data to train the model.
- **Mobile apps (iOS/Android)**: The web app (Next.js) works on mobile browsers. Native apps require significant additional engineering and App Store complexity. Deferred to Stage 1 validation.
- **Airbnb-style host onboarding flow**: The current host onboarding is manual (a team member walks the host through). Automated self-service onboarding is deferred until the manual process is well-understood and can be productized.

---

## Real-World Scenarios

### Scenario A: Someone Asks "Why Don't We Have X Feature?"

Someone asks: "Why don't we have split payments so 4 friends can each pay their share?"

**How to answer using this document**: Split payments are deliberately deferred (see FC-06 deliberate deferrals). The reason: implementing split payments adds significant complexity to the escrow model (what happens if 2 of 4 guests pay and the others don't? When is the booking confirmed?). The complexity is not worth building until there's evidence that group bookings with split payment are a significant demand pattern.

Before building any deferred feature, ask: "Is there evidence this feature is required for marketplace function at our current scale?" If yes, build it. If it's a nice-to-have: defer.

### Scenario B: An Engineer Wants to Refactor the Escrow Model

New engineer says: "The escrow state machine is complicated — I think I can simplify it."

**How to respond**: The escrow model's complexity is intentional — it handles multiple state transitions (LOCKED, RELEASED, REFUNDED, DISPUTED, HELD) that correspond to real business events. Simplifying the state machine means collapsing states, which means losing the ability to track where a booking is in its financial lifecycle. Understand the business rules (BR-FIN-01, BR-FIN-02, BR-FIN-03) before refactoring any financial system.

---

## Related Documents

- `.ai/CURRENT/DECISION_LOG.md` — DEC-001 through DEC-010 (all major product decisions)
- `docs/02_product/BUSINESS_RULES.md` — Business rules that drive feature constraints
- `knowledge/product/product_decision_framework.md`
- `knowledge/product/failure_modes_guide.md`
