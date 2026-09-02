# STAYOS — EXECUTION READINESS + SUPPLY DECISION

**Date:** 2026-08-17
**Baseline:** `.ai/AUDIT/STAYOS_CURRENT_PROJECT_STATE_DELTA_2026-08-17.md`
**Author:** Senior TPM + Engineering Lead

---

## 1. CURRENT INFRASTRUCTURE

**INFRASTRUCTURE = VERIFIED ACTIVE**

Do **NOT** provision a new Railway project, database, or Redis. The existing environment is live.

| Component | URL | Status | Evidence |
|-----------|-----|--------|----------|
| API /health | `https://stayos-demo-production.up.railway.app/health` | ✅ 200, `{"status":"ok","database":"ok","redis":"ok"}` | `curl` 2026-08-17 |
| API /version | `https://stayos-demo-production.up.railway.app/version` | ✅ 200, `0.1.0 staging` | `curl` 2026-08-17 |
| API /listings | `https://stayos-demo-production.up.railway.app/api/v1/listings` | ✅ 200, returns 3 seed listings | `curl` 2026-08-17 |
| API /listings/{id} | `https://stayos-demo-production.up.railway.app/api/v1/listings/seed-unit-0001-0000-000000000001` | ✅ 200 | `curl` 2026-08-17 |
| Web frontend | `https://web-amber-pi-98.vercel.app` | ✅ 200, Arabic/RTL landing loads | `curl -L` 2026-08-17 |
| New backend endpoints (`/favorites`, `/locations/autocomplete`, `/{id}/similar`) | Same API | ❌ 404 | `curl` 2026-08-17 |
| OTP login | `POST /api/v1/auth/otp/send` | ⚠️ 500 (Internal server error) | `curl` 2026-08-17 |

**Key finding:** The live API is the committed `9fd5f63` deployment. The uncommitted working-tree changes (`favorites`, `location_aliases`/`autocomplete`, `similar` listings, commission service) are **not yet deployed**. The mobile app in `apps/mobile/` depends on these new endpoints.

---

## 2. MOBILE RUNTIME STATUS

| Check | Result | Evidence |
|-------|--------|----------|
| Expo version | 51.0.28 | `apps/mobile/package.json` |
| React Native version | 0.74.5 | `apps/mobile/package.json` |
| TypeScript compile | ✅ PASS | `npm run lint` (`tsc --noEmit`) passed |
| iOS bundle | ✅ PASS | `npx expo export` produced `_expo/static/js/ios/index-*.js` (1.45 MB) |
| Android bundle | ✅ PASS | `npx expo export` produced `_expo/static/js/android/index-*.js` (1.45 MB) |
| Connects to live API (read) | ⚠️ PARTIAL | `/listings` and `/listings/{id}` work; `/locations/autocomplete` and `/favorites` and `/{id}/similar` return 404 on live API |
| Authenticates | ❌ BLOCKED | Mobile sends `phone`; API expects `phone_number`. `POST /auth/otp/send` returns 500 even with correct field. |
| Retrieve listings | ✅ PASS (basic) | `useSearchListings` will work for `/listings` once `EXPO_PUBLIC_API_URL` is set. |
| Listing detail | ✅ PASS (basic) | `GET /listings/{id}` works. |
| Create booking | ⚠️ UNTESTED | `POST /bookings` requires auth; cannot reach due to OTP 500. |

**Mobile runtime verdict:** The app builds and bundles. It is **not yet runnable end-to-end against the live API** because (1) the new backend endpoints are not deployed, and (2) the OTP flow is failing. Both are fixable with a backend redeploy + credential check.

---

## 3. MOBILE P0 GATE

P0 = required before Closed Alpha
P1 = important after Alpha
P2 = later

| Feature | Alpha Status | Detail |
|---------|--------------|--------|
| Home | **IMPLEMENTED** | Featured listings, city chips, search navigation |
| Search | **PARTIAL** | Location text + autocomplete code exists; filters, sort, date/guest input UI missing |
| Intelligent location autocomplete | **MISSING** on live / **IMPLEMENTED** in code | Backend code exists; not deployed |
| Arabic/English matching | **IMPLEMENTED** | `i18n.ts` + `LocaleContext` |
| Filters (price, property type, cultural tags, amenities) | **MISSING** | No mobile UI; backend supports |
| Sort | **MISSING** | Not implemented in mobile |
| Date selection | **PARTIAL** | Text input only; no calendar picker; no availability check before booking |
| Guests | **PARTIAL** | Numeric inputs only; no structured guest selector |
| Map/list toggle | **IMPLEMENTED** | `react-native-maps` + toggle in `SearchScreen` |
| Listing details | **PARTIAL** | Gallery, host, amenities, map, description, similar; missing fee breakdown, cancellation display, policies |
| Photos | **IMPLEMENTED** | Gallery scroll, cover image fallback |
| Price | **PARTIAL** | Base price shown; no cleaning fee, service fee, total |
| Total price / fees | **MISSING** | Not calculated or displayed |
| Favorites | **IMPLEMENTED** in code / **MISSING** on live | Not required for Alpha; P1 |
| Similar listings | **IMPLEMENTED** in code / **MISSING** on live | P1 |
| Availability | **MISSING** | No calendar/availability API call before booking |
| Booking | **PARTIAL** | Creates booking request; no payment/payout step, no availability check |
| Payment state | **MISSING** | No payment proof upload; manual payment handled off-app via WhatsApp |
| Confirmation | **IMPLEMENTED** | Alert + navigate to Trips |
| Trips | **IMPLEMENTED** | Upcoming/past tabs |
| Login/OTP | **PARTIAL** | UI works; API field mismatch (`phone` vs `phone_number`); OTP endpoint 500 |
| Arabic/English | **IMPLEMENTED** | Full translation object in `i18n.ts` |
| RTL/LTR | **IMPLEMENTED** | `I18nManager.forceRTL` |
| Loading/empty/error states | **IMPLEMENTED** | `LoadingSpinner`, `EmptyView`, `ErrorView` |

**Mobile P0 for Closed Alpha:**
- Home, Search (basic), Listing, Booking request, Trips, Login.
- Filters, sort, fees, calendar, payment, favorites, similar, reviews are **P1/P2**.
- The **immediate mobile blockers** are: backend redeploy for new endpoints, OTP field fix / Twilio credentials.

---

## 4. REAL SUPPLY STATUS

| Category | Count | Evidence |
|----------|------:|----------|
| Demo/seed | 3 | `GET /api/v1/listings` returns `seed-unit-*` with Unsplash images |
| Discovered | Unknown | Discovery engine exists; no live run evidence |
| Qualified | 0 | No candidates confirmed by admin |
| Owner-authorized | **0** | No owner signatures, WhatsApp confirmations, or agency deals documented |
| Imported | **0** | No real units in DB beyond seed |
| Admin-approved | **0** | No real `LISTED` units |
| Bookable | 3 seed only | Seed listings are not real commercial supply |

**Supply verdict:** The marketplace is empty of real inventory. The discovery engine is a lead-generation tool, not a source of authorized listings. Real supply depends on founder/operations outreach.

---

## 5. AIRBNB / BOOKING STATUS

| Question | Answer |
|----------|--------|
| Official API integration | **NONE** |
| Partner agreement | **NONE** |
| Channel manager integration | **NONE** |
| Authorized data source | **NONE** |
| OTA credentials | **NONE** |
| Documented partnership | **NONE** |
| Scraping | **NOT APPROVED** and not implemented |

**Status:** UNDECIDED / NOT IMPLEMENTED.

**Finding:** The repository contains a generic `JsonApiAdapter` that could theoretically connect to a public JSON API, but no Airbnb- or Booking-specific adapter, credentials, or authorization exists. Scraping is not a viable or approved route.

---

## 6. SUPPLY ROUTE COMPARISON

| Route | Speed | Legality / Authorization | Data Quality | Scalability | Engineering Effort | Operational Effort | Ability to Reach 40+ |
|-------|-------|--------------------------|--------------|-------------|--------------------|--------------------|----------------------|
| A. Owner acquisition (founder network) | Very fast for first 3–5 | High — direct consent | High | Low | Low | Very high | Limited |
| B. Property-management companies (agencies) | Fast for first 10–20 | High — contract/CSV | High | High | Low (CSV exists) | High | Strong |
| C. Channel managers / PMS | Medium | High — requires partnership | High | Very high | Medium-high | Medium | Strong, but 4–8 week sales cycle |
| D. Authorized OTA integrations | Slow | Requires legal agreement | High | Very high | High | Medium | Strong, but 4–12 weeks |
| E. Public discovery → owner outreach | Medium | Medium — needs per-owner consent | Medium | Medium | Low (discovery exists) | High | Moderate |
| F. Existing discovery engine | Fast to candidates | Low to Medium — raw POI data, needs consent | Low-Medium | Medium | Low (already built) | High | Moderate |
| G. Hybrid (B + E + A) | Fastest | High | High | High | Low | High | Strong |

**Decision criteria for Closed Alpha:**
- Need **first 3–5 listings this week** for technical validation.
- Need **40+ listings in ~6 weeks** for launch credibility.
- Must be **legitimate** — owner/agency consent required.
- Must **minimize engineering effort** — time is the bottleneck, not code.

---

## 7. RECOMMENDED SUPPLY ROUTE

**PRIMARY ROUTE: Hybrid — Founder-led agency/property-manager acquisition + discovery engine as lead-gen.**

1. **Immediate (this week):** Founder calls personal network and 2–3 property-management companies in New Cairo to sign 3–5 listings. Use existing CSV import or admin "import candidate" flow.
2. **Week 2–4:** Use discovery engine (Overpass/OSM, Google Places with key, manual Facebook/Travel groups) to identify candidate properties. Founder/operations person contacts owners via WhatsApp/phone, gets consent, imports via admin.
3. **Week 4–6:** Convert first agency contacts into recurring supply relationships; ask for referrals.

**BACKUP ROUTE: Founder network CSV import.**
If agency outreach stalls in Week 1, import 5–10 listings manually from founder contacts to keep the validation loop moving.

**WHY:**
- Agencies deliver multiple listings per relationship (best 40+ path).
- Founder network delivers the first 3–5 fastest.
- Discovery engine reduces cold-search time but does not replace consent.
- Engineering is already done; the work is operational, not technical.

---

## 8. CLOSED ALPHA DEFINITION

Minimum conditions for CLOSED ALPHA:

### PRODUCT
- Web: guest can search, view listing, create booking request, see price.
- Mobile: guest can log in, search, view listing, create booking request, see trips.
- Host: can create listing, submit KYC.
- Admin: can review KYC, approve listings, view bookings.

### INFRASTRUCTURE
- API live with `/health` 200.
- Web frontend live.
- Database/Redis healthy.
- Twilio or manual OTP fallback working.
- Paymob or manual payment fallback documented and tested.

### SUPPLY
- 40+ real, owner-authorized, KYC-verified, admin-approved listings in New Cairo.
- At least 3 listings live in first 72 hours of redeploy for smoke testing.

### BOOKING
- Guest can create a booking request.
- Host can accept.
- Guest can upload payment proof (web + mobile acceptable).

### PAYMENT
- Manual payment confirmation SOP in place.
- At least 5 host payouts processed.

### OPERATIONS
- Founder/operations hire can KYC, approve, support via WhatsApp.
- Operations playbook updated.

### MOBILE
- Mobile bundles for iOS and Android.
- Mobile can authenticate, search, view listing, create booking against live API.
- **NO app store submission required for Closed Alpha.**

---

## 9. PARALLEL EXECUTION PLAN

**TRACK A — Infrastructure (Owner: DevOps/Engineering)**
- Commit the 35-file uncommitted diff.
- Redeploy `stayos-demo-production.up.railway.app`.
- Verify `/locations/autocomplete`, `/favorites`, `/{id}/similar` return 200.
- Verify Twilio/Firebase/Paymob/S3 credentials or document manual fallbacks.
- Can run in parallel with supply outreach.

**TRACK B — Supply (Owner: Founder/Operations)**
- Day 1–2: Call 10 personal contacts; aim for 3–5 confirmed listings.
- Day 3–5: Meet 2–3 New Cairo agencies; aim for 1–2 agency CSV imports.
- Week 2+: Use discovery engine to identify candidates; outreach and import.
- Depends on: live admin panel (Track A).

**TRACK C — Mobile (Owner: Mobile Lead)**
- Fix `phone` → `phone_number` field in `LoginScreen`.
- Verify `EXPO_PUBLIC_API_URL` points to live API.
- After Track A deploy, run `expo export` and smoke test against live endpoints.
- Can build in parallel; testing blocked until Track A completes.

**TRACK D — Booking/Payment (Owner: Engineering + Operations)**
- Document manual payment/payout SOP.
- Test one booking → payment proof → payout with first real listing.
- Depends on: Track A (live backend) + Track B (real listing).

**TRACK E — QA (Owner: QA/Founder)**
- Run one E2E transaction on web.
- Run one E2E transaction on mobile after Track C.
- Depends on: Tracks A, B, C, D.

---

## 10. CURRENT BLOCKERS

**In priority order:**

1. **Backend not redeployed with uncommitted work.** The live API is missing `favorites`, `locations/autocomplete`, and `similar` endpoints. This blocks the mobile app from using its own features.
2. **Zero real owner-authorized listings.** The marketplace is empty of commercial supply.
3. **Mobile OTP/authentication failing.** `POST /auth/otp/send` returns 500; mobile sends `phone` instead of `phone_number`.
4. **No payment/payout loop on mobile.** Mobile booking creates a request but does not handle payment proof or payout.
5. **No operations hire/SOP for manual processes.** Founder is still the only operator.

---

## 11. WHAT MUST NOT BE DONE

- Do **NOT** provision a new Railway/Redis/Postgres; the existing environment is healthy.
- Do **NOT** implement Airbnb/Booking scraping or unauthorized OTA data copying.
- Do **NOT** add new product features (AI, loyalty, referral, social, analytics) before Closed Alpha.
- Do **NOT** rewrite the mobile app in Flutter; the React Native/Expo scaffold is the V1 path.
- Do **NOT** recreate the previous audits or assessment chain.
- Do **NOT** run app store submission or EAS production builds yet.
- Do **NOT** treat the 3 seed listings as real commercial supply.

---

## 12. IMMEDIATE NEXT ACTION

**Objective:** Commit the uncommitted working-tree changes and redeploy the backend to the live Railway environment.

**Why this is the highest priority:**
- The mobile app, favorites, autocomplete, and similar-listings features already exist in code but are not live.
- Every other execution track (mobile smoke test, supply import, booking/payout) requires the live API to match the code.
- The existing environment is already healthy — no need to rebuild infrastructure.

**Exact deliverable:**
1. Commit the 35-file uncommitted diff to `tooling/repository-intelligence` (or a new `release/closed-alpha` branch).
2. Trigger a new Railway deploy for `stayos-demo-production.up.railway.app`.
3. Run `alembic upgrade head` on the live database.
4. Verify `GET /api/v1/locations/autocomplete?q=new` returns suggestions.
5. Verify `POST /api/v1/favorites/{unit_id}` requires auth (returns 401/403) and `GET /api/v1/favorites` works for an authenticated user.
6. Verify `GET /api/v1/listings/{unit_id}/similar` returns results.

**Acceptance criteria:**
- `/health` still 200.
- The 3 new endpoints respond 200 or 401/403 (not 404).
- Mobile `tsc` and `expo export` still pass after the commit.

**What should NOT be done in this step:**
- Do not add new features.
- Do not change the mobile framework.
- Do not import real listings before the deploy is verified.

**What can be combined into the same run:**
- The Twilio/Paymob credential check can happen immediately after redeploy.
- The first 3–5 founder-led listing imports can begin in parallel once the admin panel is live.

---

## 13. MANAGEMENT DECISION

**B. COMPLETE SPECIFIC BLOCKERS**

StayOS is **not yet ready for Closed Alpha** because four blockers remain:

1. **Redeploy the live backend** with the uncommitted `favorites`, `locations/autocomplete`, and `similar` endpoints.
2. **Obtain the first 3–5 real owner-authorized listings** this week, then scale to 40+.
3. **Fix mobile OTP/authentication** (field mismatch + Twilio 500 or manual fallback).
4. **Run one real end-to-end transaction** (search → book → payment → payout) on web and mobile.

Once these are resolved, the project can shift to **A. READY FOR CLOSED ALPHA**.

**No strategy change is required.** The current path (React Native/Expo, hybrid supply acquisition, manual payment fallback) is the fastest executable route.

---

## EVIDENCE SOURCES

- `https://stayos-demo-production.up.railway.app/health` (200, verified 2026-08-17)
- `https://stayos-demo-production.up.railway.app/version` (200, verified 2026-08-17)
- `https://stayos-demo-production.up.railway.app/api/v1/listings` (200, 3 seed units, verified 2026-08-17)
- `https://stayos-demo-production.up.railway.app/api/v1/listings/seed-unit-0001-0000-000000000001` (200, verified 2026-08-17)
- `https://stayos-demo-production.up.railway.app/api/v1/locations/autocomplete?q=new` (404, verified 2026-08-17)
- `https://stayos-demo-production.up.railway.app/api/v1/listings/seed-unit-0001-0000-000000000001/similar` (404, verified 2026-08-17)
- `POST https://stayos-demo-production.up.railway.app/api/v1/auth/otp/send` (500, verified 2026-08-17)
- `https://web-amber-pi-98.vercel.app` (200, verified 2026-08-17)
- `apps/mobile/package.json`
- `apps/mobile/App.tsx`
- `apps/mobile/src/lib/api.ts`
- `apps/mobile/src/screens/LoginScreen.tsx`
- `apps/mobile/src/lib/hooks.ts`
- `npm run lint` (`tsc --noEmit`) pass, 2026-08-17
- `npx expo export` bundle success, 2026-08-17
- `src/app/favorites/router.py`
- `src/app/listings/router.py`
- `src/app/main.py`
- `src/app/discovery/router.py`
- `src/app/discovery/adapters/*.py`
- `ADR-MOBILE-FRAMEWORK.md`
