# STAYOS — CURRENT PROJECT STATE DELTA

**Date:** 2026-08-17
**Baseline:** `PROJECT_PORTFOLIO_ASSESSMENT_2026-08-17.md` + `PORTFOLIO_ASSESSMENT_PREFLIGHT_2026-08-17.md`
**Author:** Independent Current State Delta

---

## 1. EXECUTIVE SUMMARY

**Delta Status:** MATERIAL CHANGE FOUND

The repository contains significant post-Portfolio-Assessment, **uncommitted** engineering work that materially changes execution readiness:

1. A **React Native / Expo mobile V1 scaffold** has been created (`apps/mobile/`) with a complete customer journey: Home, Search, Listing, Booking, Favorites, Trips, Account, Login.
2. **Backend capabilities** now include Favorites, Similar Listings, and Arabic-normalized Location Autocomplete, plus an improved commission/finance service.
3. A **Discovery Engine** for supply acquisition is committed (OSM/Overpass, Google Places, manual, JSON API), but it has produced **zero owner-authorized listings**.
4. **No live environment exists.** No real users, listings, bookings, or revenue.
5. **Airbnb/Booking integration is neither decided nor implemented.**

**Current Bottleneck:** The product cannot be validated because there is no live environment and no real, owner-authorized supply. Mobile and new backend features exist in the working tree but have never been deployed or tested against real data.

**Immediate Next Step:** Commit the uncommitted work, provision a live staging environment with real credentials, import the first 3–5 real owner-authorized listings, and run one end-to-end booking/payment loop (web + mobile smoke test).

**Final Management Decision:** **B. COMPLETE SPECIFIC BLOCKER FIRST** — the live environment and real supply must exist before any further product expansion is justified.

---

## 2. BASELINE ASSESSMENT

The pre-flight document (`PORTFOLIO_ASSESSMENT_PREFLIGHT_2026-08-17.md`) confirmed the following was true at the time of the Portfolio Assessment:

| Baseline Item | State |
|---------------|-------|
| Commit | `9fd5f63` (2026-08-10) |
| Real users | 0 |
| Real listings | 0 |
| Real bookings | 0 |
| Real revenue | EGP 0 |
| Mobile | Deferred V3, no code |
| Favorites | Not implemented |
| Similar listings | Not implemented |
| Location autocomplete | Not implemented |
| Live environment | None |
| Supply acquisition | Founder-led manual + agency CSV planned |
| Airbnb/Booking | Not mentioned / not decided |

The pre-flight verdict was **PASS / SAFE / KEEP EXISTING ASSESSMENT** for the committed state. This Delta addresses the **uncommitted working tree** and **new management intent** that were not yet fully analyzed.

---

## 3. MATERIAL CHANGES

| # | Change | Evidence | Impact |
|---|--------|----------|--------|
| 1 | **Mobile V1 scaffold created** | `apps/mobile/` (untracked) — 8 screens, API client, i18n, theme, RTL, navigation, hooks | High — introduces a new V1 deliverable that did not exist in the Portfolio Assessment |
| 2 | **Favorites module added** | `src/app/favorites/` + migration `022_add_favorites_and_locations.py` + `GET/POST /favorites` | Medium — new UX capability |
| 3 | **Location autocomplete added** | `GET /locations/autocomplete` in `src/app/favorites/router.py` + `location_aliases` table + 14 Cairo area seed sets | High — enables mobile search by Arabic/English variants |
| 4 | **Similar listings added** | `GET /listings/{unit_id}/similar` in `src/app/listings/router.py` + `get_similar_listings` in `src/app/listings/services.py` | Medium — recommendation engine in code |
| 5 | **Discovery engine committed** | `src/app/discovery/` (Overpass, Google Places, manual, JSON API adapters; candidate lifecycle; admin import) | High — changes supply acquisition strategy from purely manual to hybrid automated+manual |
| 6 | **Railway deployment config added** | `railway.toml` + `startup.sh` + `docker-compose.staging.yml` (uncommitted/modified) | Medium — reduces deployment friction, but not yet used |
| 7 | **Commission/finance improvements** | `src/app/finance/services.py` (~114 lines) + `tests/test_alpha_commission.py` (untracked) | Low — supports alpha pricing, no customer impact yet |
| 8 | **No new commercial evidence** | `epos/PROJECT_STATE.md` still reports 0 users/listings/bookings/revenue | Critical unchanged — product remains unvalidated |

---

## 4. MOBILE DELTA

### 4.1 Decision Status

| Aspect | Finding |
|--------|---------|
| **Previous official decision** | Mobile native deferred to V3/Phase 2 (`MVP_SCOPE_FREEZE.md`, `06_STOP_DOING_LIST.md`, `DECISION_LOG.md` DEC-018) |
| **Management intent** | Founder/PM now wants a credible Mobile V1 before continued launch. No formal ADR has been committed. |
| **Implementation evidence** | `apps/mobile/` is an untracked Expo/React Native scaffold. No ADR. No `ios/` or `android/` native project directories. No EAS build. No committed CI. |
| **Conclusion** | Mobile is now a **tacit re-prioritization**, not a formally recorded decision. The code is in the working tree only. |

### 4.2 What Exists

| Item | Status | Evidence |
|------|--------|----------|
| React Native / Expo project | Exists | `apps/mobile/package.json` — Expo 51, React Native 0.74.5 |
| Navigation | Exists | `App.tsx` — bottom tabs + native stack |
| API client | Exists | `apps/mobile/src/lib/api.ts` — axios, token refresh, AsyncStorage |
| i18n / RTL | Exists | `apps/mobile/src/lib/i18n.ts`, `LocaleContext.tsx` — EN/AR, `I18nManager.forceRTL` |
| Theme | Exists | `apps/mobile/src/lib/theme.ts` (assumed from imports) |
| Screens | 8 screens | `HomeScreen`, `SearchScreen`, `ListingDetailScreen`, `FavoritesScreen`, `TripsScreen`, `AccountScreen`, `LoginScreen`, `BookingScreen` |
| API hooks | Exists | `apps/mobile/src/lib/hooks.ts` — search, listing, photos, similar, autocomplete, favorites, bookings, login |
| Map | Exists | `react-native-maps` used in `SearchScreen` and `ListingDetailScreen` |
| iOS bundle identifier | Configured | `app.json` — `com.stayos.mobile` |
| Android package | Configured | `app.json` — `com.stayos.mobile` |

### 4.3 What Is Missing / Not Verified

| Item | Status | Evidence |
|------|--------|----------|
| Committed to git | **NO** | `apps/mobile/` is `??` untracked |
| Native iOS project | **NO** | No `ios/` directory |
| Native Android project | **NO** | No `android/` directory |
| EAS build config | **NO** | `app.json` `extra.eas.projectId` is empty |
| TypeScript build | Unknown in repo | `package.json` has `"lint": "tsc --noEmit"` but no result file |
| Bundle verification | **NO** | No `.ipa` or `.aab` artifacts, no build logs |
| Integration with main repo | **NO** | Not in root `package.json` workspaces / not in CI |
| Test against real API | **NO** | API URL defaults to `localhost:8000` |

### 4.4 Readiness Verdict

**Demo/Scaffold — not Alpha-ready.**

The code is functionally complete for a first-pass mobile experience, but it is uncommitted, unbuilt, and untested against a real API. It cannot be shipped without a live backend and a build pipeline.

---

## 5. BACKEND / PRODUCT DELTA

### 5.1 Favorites

| Layer | Status | Evidence |
|-------|--------|----------|
| Migration | Exists | `alembic/versions/022_add_favorites_and_locations.py` creates `pms.user_favorites` |
| Model | Exists | `src/app/favorites/models.py` (UserFavorite, LocationAlias) |
| Router | Exists | `src/app/favorites/router.py` — `POST /favorites/{unit_id}`, `GET /favorites` |
| Service | Exists | `src/app/favorites/services.py` — `toggle_favorite`, `get_user_favorites`, `is_favorited` |
| Integration | Exists | `src/app/main.py` line 188 `app.include_router(favorites_router.router)` |
| Tests | Unknown | No test files found in `src/app/favorites/` |

### 5.2 Recommendations (Similar Listings)

| Layer | Status | Evidence |
|-------|--------|----------|
| Endpoint | Exists | `GET /listings/{unit_id}/similar` (`src/app/listings/router.py` line 392) |
| Service | Exists | `get_similar_listings` in `src/app/listings/services.py` — same city, 0.5x–2.0x price band, same property type, fallback to same city |
| Mobile hook | Exists | `useSimilarListings` in `apps/mobile/src/lib/hooks.ts` |
| Tests | Unknown | Not in `tests/test_listings.py`? Not explicitly searched |

### 5.3 Location Autocomplete

| Layer | Status | Evidence |
|-------|--------|----------|
| Migration/Seed | Exists | `alembic/versions/022...` seeds 14 Cairo areas + English/Arabic variants (e.g., "New Cairo", "التجمع", "fifth settlement") |
| Endpoint | Exists | `GET /locations/autocomplete` (`src/app/favorites/router.py` line 39) |
| Arabic normalization | Exists | `_normalize_arabic` removes diacritics, unifies alef/ya/ta marbuta (`src/app/favorites/services.py` lines 100–110) |
| Mobile hook | Exists | `useLocationAutocomplete` in `apps/mobile/src/lib/hooks.ts` |
| Coverage | 14 Cairo areas | Seed includes Cairo, Giza, Alexandria; not exhaustive nationwide |

### 5.4 Search Backend

`ListingSearchFilters` (`src/app/listings/schemas.py` line 237) supports:

- `q` text search
- `city` / `governorate`
- `sw_lat/lng`, `ne_lat/lng` viewport
- `lat/lng` + `radius_km`
- `check_in` / `check_out`
- `min_price` / `max_price`
- `property_type` / `cultural_tags` / `amenities`
- `guests` / `cursor` pagination

The repository implements these filters (`src/app/listings/repository.py` lines 180–184 for city/governorate). This is a **backend capability**, not a customer-validated feature.

### 5.5 Commission / Finance

- `src/app/finance/services.py` includes commission calculation (uncommitted, per `epos/PROJECT_STATE.md`).
- `tests/test_alpha_commission.py` is untracked.
- Impact: low until first real transaction.

---

## 6. SUPPLY ACQUISITION DELTA

### 6.1 What Is Implemented

`src/app/discovery/` is a committed supply-discovery pipeline:

| Component | Evidence |
|-----------|----------|
| Adapters | `overpass.py` (OSM/Overpass), `google_places.py` (Google Places), `manual.py`, `json_api.py` |
| Models | `DiscoveryCandidate`, `DiscoveryConfig`, `DiscoveryRun` |
| Admin endpoints | `GET /discovery/candidates`, `POST /discovery/runs`, `POST /candidates/{id}/import` |
| Import | `import_candidate` creates a `PENDING_VERIFICATION` unit from candidate |
| Duplicate detection | `dedup.py` |
| Scoring | `scoring.py` — qualification, contact, source confidence |
| Celery scheduling | `tasks.py` |

### 6.2 Current Real Supply

| Category | Count | Evidence |
|----------|------:|----------|
| Demo/seeded listings | Unknown, likely 0 if no `seed_staging.py` has run | No live DB |
| Discovered candidates | Unknown | No live DB |
| Qualified candidates | 0 in production | No live DB |
| Owner-authorized | 0 | No evidence of signed hosts or agencies |
| Imported and listed | 0 | No live DB / `epos/PROJECT_STATE.md` says 0 real listings |
| Bookable | 0 | No live environment |

### 6.3 Supply Verdict

**The discovery pipeline is code. It is not supply.** No owner has authorized a listing. The marketplace is still empty. The project now has tools to find candidates, but the legal and operational step — owner consent, KYC, listing creation, approval — remains entirely manual and unstarted.

---

## 7. AIRBNB / BOOKING STATUS

| Question | Answer |
|----------|--------|
| Is Airbnb/Booking formally approved as a data source? | **NO** — no decision in `DECISION_LOG.md` or `MVP_SCOPE_FREEZE.md` |
| Is there a compliant integration? | **NO** — no Airbnb/Booking-specific adapter, no API key, no partnership doc |
| Is scraping Airbnb/Booking implemented? | **NO** — no scraper in `src/app/discovery/` or `scripts/` |
| What discovery sources are implemented? | OpenStreetMap/Overpass, Google Places (needs key), generic JSON API, manual entry |
| Could a JSON API adapter connect to an OTA? | Theoretically yes, if the OTA exposes a public JSON API and is authorized. No such source is configured. |
| Current objective | Obtain real supply legally and operationally. Scraping Airbnb/Booking without authorization is **not a viable default** and is **not approved**. |

**Status: UNDECIDED — additional Founder decision required before any OTA integration is built.**

---

## 8. INFRASTRUCTURE / ENVIRONMENT DELTA

| Component | Current State | Evidence |
|-----------|---------------|----------|
| AWS Terraform | Defined, not provisioned | `epos/PROJECT_STATE.md` |
| Railway config | Added but not activated | `railway.toml`, `startup.sh` (untracked) |
| Staging Docker Compose | Defined | `docker-compose.staging.yml` |
| Live API URL | **NONE** | No real environment |
| Real credentials | **NONE** | Twilio, Firebase, Paymob, WhatsApp, S3 not configured |
| Database | None live | Migrations exist, no live Postgres |
| Redis | None live | Config exists, no live Redis |
| Web frontend | Buildable locally, no live URL | `apps/web/` 21 routes |
| Mobile app | Buildable with Expo Go, no store build | `apps/mobile/` |

**The deployment blocker has not moved.** All new code is theoretical until the environment is live.

---

## 9. COMMERCIAL EVIDENCE DELTA

| Evidence Type | Count | Status |
|---------------|------:|--------|
| Real users | 0 | Unchanged |
| Real hosts | 0 | Unchanged |
| Real guests | 0 | Unchanged |
| Real listings | 0 | Unchanged |
| Real bookings | 0 | Unchanged |
| Real revenue | EGP 0 | Unchanged |
| Customer interviews | 0 confirmed | `epos/PROJECT_STATE.md` |
| LOIs/contracts | 0 | None documented |
| Pilot activity | 0 | No live environment |

**NO MATERIAL COMMERCIAL CHANGE.** All progress is engineering, not market.

---

## 10. DECISION DELTA

| Decision Area | Previous Assessment | Current Evidence | Current State | Material? |
|---------------|--------------------|-------------------|---------------|-----------|
| Mobile | Deferred V3 | New RN/Expo scaffold in working tree; no ADR | **Tacit re-prioritization, uncommitted** | YES |
| Supply acquisition | Founder manual + CSV | Discovery engine committed; admin import; still 0 authorized listings | **Tooling ready, execution not started** | YES |
| Airbnb/Booking | Not decided | No implementation, no decision, no partnership | **UNDECIDED** | NO |
| Search | Existing capability | Backend filters complete; mobile search basic; autocomplete added | **Backend complete, mobile partial** | YES |
| Favorites | Missing | Implemented in backend and mobile | **Done in code, untested** | YES |
| Recommendations | Missing | Similar-listings endpoint and mobile hook | **Done in code, untested** | YES |
| Live environment | Blocked | Railway config added, still not deployed | **Still blocked** | NO (still blocked) |
| Real inventory | 0 | 0 | **0** | NO (unchanged) |
| Real bookings | 0 | 0 | **0** | NO (unchanged) |
| Commercial validation | None | None | **None** | NO (unchanged) |

---

## 11. CURRENT PRODUCT STATE

```
STAYOS CURRENT STATE

PRODUCT              YELLOW  — new Mobile V1 intent and backend features, but no formal decision/real validation
ENGINEERING          YELLOW  — code is strong and largely complete, but uncommitted work is not integrated
MOBILE               YELLOW  — functional scaffold, not built, not committed, not tested against real API
SUPPLY               RED     — discovery pipeline exists, zero real owner-authorized listings
COMMERCIAL           RED     — zero users, listings, bookings, revenue
INFRASTRUCTURE       RED     — no live environment, no real credentials
VALIDATION           RED     — no Phase 0 gate evidence (10 transactions + 80 interviews)
LAUNCH READINESS     RED     — cannot launch without supply and environment
```

**The single biggest blocker is the live environment + real supply, not the mobile app or backend code.**

---

## 12. MOBILE V1 GATE

| Category | Item | Status | Notes |
|----------|------|--------|-------|
| **Discovery** | Home | PASS | Featured listings, city chips, search navigation |
| | Search | PARTIAL | Location search, autocomplete, map/list toggle; missing filters, sort, date/guest input in UI |
| | Intelligent location search | PASS | Backend autocomplete + Arabic normalization |
| | Arabic/English location matching | PASS | `i18n.ts` + `LocaleContext` |
| | Autocomplete while typing | PASS | `useLocationAutocomplete` with debounce |
| | Filters | FAIL | No UI for price, dates, guests, property type, cultural tags |
| | Sorting | FAIL | Not implemented in mobile |
| | Map | PASS | `react-native-maps` with markers |
| | List/map toggle | PASS | Implemented in `SearchScreen` |
| **Listing** | Gallery | PASS | Horizontal image scroll, placeholder fallback |
| | Price | PARTIAL | Displays base price; no fee breakdown, no cleaning fee, no total |
| | Fees | FAIL | Not shown in mobile |
| | Details | PASS | Bedrooms, bathrooms, guests, description |
| | Amenities | PASS | Rendered as chips |
| | Host information | PASS | `host_display_name`, KYC verified badge |
| | Cancellation policy | FAIL | Field in `ListingDetail` type, not displayed |
| | Map/location | PASS | Static map with marker |
| | Similar listings | PASS | `useSimilarListings` + `ListingCard` |
| **Personalization** | Favorites | PASS | Toggle, list, heart icon |
| | Similar properties | PASS | Listing detail section |
| | Same-area recommendations | PARTIAL | Similar-listings by city/price; not explicitly "same area" |
| | Price-range recommendations | PASS | Similar-listings uses price band |
| **Booking** | Dates | FAIL | Text input `YYYY-MM-DD`, no calendar picker, no availability check |
| | Guests | PARTIAL | Numeric inputs for adults/children/infants |
| | Price calculation | PARTIAL | Nights × price; no fees/taxes |
| | Booking | PASS | Creates booking via `useCreateBooking` |
| | Booking state | PARTIAL | Posts to `/bookings`; no payment step |
| | Confirmation | PASS | Alert + navigate to Trips |
| **Account** | Login | PASS | OTP flow via `/auth/otp/send` and `/auth/otp/verify` |
| | Profile | PARTIAL | `useMe` displays name/phone/KYC status; no edit |
| | Trips | PASS | Upcoming/past tabs, booking list |
| | Favorites | PASS | `FavoritesScreen` |
| | Language | PASS | EN/AR toggle |
| | Logout | PASS | `clearTokens` + navigate Home |
| **UX** | Loading states | PASS | `LoadingSpinner` |
| | Empty states | PASS | `EmptyView` |
| | Errors | PARTIAL | `ErrorView` with retry; generic alerts on API failure |
| | RTL | PASS | `I18nManager.forceRTL` |
| | LTR | PASS | `I18nManager` toggles |
| | Touch targets | PASS | Standard pressables, `hitSlop` on heart |
| | Navigation | PASS | Tab + stack navigator |
| | API failure handling | PARTIAL | `catch` blocks alert user, no structured offline/retry UX |

**Mobile V1 Gate Verdict:** 16 PASS, 7 PARTIAL, 7 FAIL. The scaffold is credible, but the FAIL items (filters, sort, fees, date picker, cancellation policy, payment) are significant for a customer launch. It is **not production-ready**.

---

## 13. LAUNCH READINESS

### Engineering Readiness
- **Backend:** YELLOW — new features untracked/uncommitted, no live environment.
- **Web:** YELLOW — 21 routes build, no live deployment.
- **Mobile:** YELLOW — scaffold exists, not built/committed.

### UX Readiness
- **Web:** YELLOW — ready for alpha with known gaps.
- **Mobile:** YELLOW — first-pass UX, missing filters/fees/payment.

### Supply Readiness
- **RED** — zero real listings.

### Operational Readiness
- **RED** — no live environment, no real credentials, no operations hire.

### Commercial Readiness
- **RED** — zero validation.

### Launch Readiness
- **RED** — cannot launch.

---

## 14. CRITICAL PATH

```
CURRENT
  ↓
BLOCKER 1 — Commit uncommitted changes + choose deployment path (Railway vs AWS)
  ↓
BLOCKER 2 — Provision live staging environment with real credentials
  ↓
BLOCKER 3 — Run migrations, seed admin, import first 3–5 owner-authorized listings
  ↓
BLOCKER 4 — Run one end-to-end web booking → payment → payout
  ↓
BLOCKER 5 — Smoke-test mobile app against live API, fix critical FAIL items
  ↓
CLOSED ALPHA
  ↓
REAL USERS
  ↓
REAL BOOKINGS
```

**Every path to value goes through the live environment and real supply.** Mobile improvements before this are premature.

---

## 15. WHAT REMAINS

1. **Commit uncommitted work** (35+ file diff).
2. **Provision live staging** (Railway or AWS) with real credentials.
3. **Run database migrations** up to `022_add_favorites_and_locations.py`.
4. **Obtain first real owner-authorized listings** (agency/owner outreach + KYC + approval).
5. **Run one real booking loop** (web then mobile) with manual payment.
6. **Fix Mobile V1 FAIL items** only after live API is proven.
7. **Founder decision on Airbnb/Booking** if that path is to be pursued.
8. **Write ADR for mobile framework** (the code chose React Native/Expo; the decision record still shows Flutter as the recommendation).

---

## 16. WHAT IS ALREADY DONE

1. **Web backend and frontend** for Closed Alpha (code-complete at `9fd5f63`).
2. **Discovery engine** for candidate sourcing.
3. **Favorites, similar listings, location autocomplete** in code.
4. **Mobile V1 scaffold** (uncommitted) with full customer journey.
5. **Railway and Docker Compose deployment configs** (uncommitted).
6. **Manual payment flow** backend.
7. **KYC, listing, booking, admin workflows** in code.

---

## 17. WHAT MUST NOT BE REPEATED

1. Do not rerun Chat Context Extraction.
2. Do not rerun Decision Reconciliation.
3. Do not rerun Product Version Audit.
4. Do not rerun Management Situation Analysis.
5. Do not rerun Portfolio Assessment.
6. Do not create another pre-flight document.
7. Do not add new product features until the live environment and first real transaction exist.
8. Do not build an app store submission pipeline yet.
9. Do not implement Airbnb/Booking scraping without explicit, documented Founder authorization and legal review.

---

## 18. IMMEDIATE NEXT EXECUTION STEP

### Objective
**Provision a live staging environment and commit the uncommitted work, then import the first 3–5 owner-authorized listings and run one end-to-end booking loop (web + mobile smoke test).**

### Why This Is the Highest Priority
- Mobile V1 cannot be validated without a live API.
- The discovery engine cannot produce bookable listings without owner authorization.
- All new backend and mobile code is inert until deployed.
- The $150K runway only matters once the project can prove real transactions.

### Exact Deliverable
1. A live API URL (`https://...`) with `/health`, `/version`, and `/docs` responding.
2. Real Twilio/Firebase/Paymob/S3 credentials configured (or manual payment fallback documented).
3. Migrations up to `022` applied on live Postgres.
4. 3–5 real, owner-authorized New Cairo listings in `LISTED` status.
5. One booking request created through the web and visible in mobile Trips.
6. One manual payment/payout confirmation.

### Acceptance Criteria
- [ ] `/health` returns `ok` from a non-localhost URL.
- [ ] Mobile `LoginScreen` can request and verify OTP against the live API.
- [ ] `SearchScreen` returns real listings from the live API.
- [ ] `BookingScreen` can create a booking for a real listing.
- [ ] `TripsScreen` displays the created booking.
- [ ] Admin `pending` page shows the listing and can approve/activate it.

### What Should NOT Be Done
- Do not add more mobile screens or features.
- Do not design app store assets or submission.
- Do not automate scraping of Airbnb/Booking or any source without authorization.
- Do not hire an operations person before the environment is live.
- Do not write new strategy documents.

### What Can Be Combined into the Same Next Run
- Commit + deploy + migrations can happen in the first 1–2 days.
- Founder-led agency/owner outreach can run in parallel (2–5 days).
- Mobile smoke test against the live API can happen immediately after deploy (1 day).

---

## 19. FINAL MANAGEMENT DECISION

**B. COMPLETE SPECIFIC BLOCKER FIRST**

The product is sufficiently defined, but it cannot move forward because two blockers prevent any real validation:

1. **No live environment.**
2. **No real, owner-authorized supply.**

All other work — including the impressive Mobile V1 scaffold and the discovery engine — is inert until these are resolved. Once the live environment and the first real transactions exist, the project can shift to **A. CONTINUE EXECUTION** with the Mobile V1 hardening and supply scaling.

---

## EVIDENCE SOURCES

- `PORTFOLIO_ASSESSMENT_PREFLIGHT_2026-08-17.md`
- `PROJECT_PORTFOLIO_ASSESSMENT_2026-08-17.md`
- `epos/PROJECT_STATE.md`
- `epos/NEXT_SPRINT.md`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/App.tsx`
- `apps/mobile/src/lib/api.ts`
- `apps/mobile/src/lib/hooks.ts`
- `apps/mobile/src/lib/i18n.ts`
- `apps/mobile/src/lib/LocaleContext.tsx`
- `apps/mobile/src/screens/*.tsx`
- `apps/mobile/src/components/*.tsx`
- `apps/mobile/src/lib/types.ts`
- `src/app/main.py`
- `src/app/favorites/router.py`
- `src/app/favorites/services.py`
- `src/app/favorites/models.py`
- `src/app/listings/router.py`
- `src/app/listings/services.py`
- `src/app/listings/repository.py`
- `src/app/listings/schemas.py`
- `alembic/versions/022_add_favorites_and_locations.py`
- `src/app/discovery/router.py`
- `src/app/discovery/services.py`
- `src/app/discovery/adapters/overpass.py`
- `src/app/discovery/adapters/google_places.py`
- `src/app/discovery/adapters/manual.py`
- `src/app/discovery/adapters/json_api.py`
- `railway.toml`
- `startup.sh`
- `docker-compose.staging.yml`
- `DECISION_LOG.md`
- `docs/02_product/MVP_FREEZE.md`
- `06_STOP_DOING_LIST.md`
