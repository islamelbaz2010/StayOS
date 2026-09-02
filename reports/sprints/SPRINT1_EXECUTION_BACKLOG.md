# SPRINT1_EXECUTION_BACKLOG.md

## 1. Sprint Goal

Deliver the first complete **Guest Journey** that can be demonstrated locally: a guest opens the application, lands on the Arabic-first home page, searches for a destination, browses searchable listings, and views a minimum listing details page.

No payments, bookings, host dashboard, or admin features are in this sprint.

---

## 2. Definition of Done

- `npm run build` in `apps/web` completes with zero errors.
- `python3 -m pytest tests/` continues to pass with ≥80% coverage.
- `alembic upgrade head` applies cleanly to a fresh local Postgres database.
- A guest can open `/`, enter a destination, see a list of listings, click one, and view its details.
- UI is RTL-first, mobile-to-desktop responsive, and shows loading and error states.

---

## 3. User Journey

1. Guest opens `http://localhost:3000` and is redirected to `/ar`.
2. Guest sees a simple hero/search form.
3. Guest enters a destination (or none) and submits.
4. Guest sees a loading state, then a grid of listing cards with title, location, price, and property type.
5. Guest clicks a card.
6. Guest navigates to the listing details page (`/ar/listings/<id>`).
7. Guest sees title, description, location, price, amenities, and house rules.

---

## 4. Ordered Engineering Tasks

### S1-01 — API client and query hooks

- **ID:** S1-01
- **Title:** Wire frontend to backend API
- **Objective:** Create a typed HTTP client and TanStack Query hooks the search and detail pages can use.
- **Files expected to change:**
  - `apps/web/lib/api.ts` (new)
  - `apps/web/lib/queries/listings.ts` (new)
  - `apps/web/.env.local` (new)
- **Dependencies:** None
- **Acceptance Criteria:**
  - `apps/web/lib/api.ts` exports an `axios` instance with base URL `http://localhost:8000` or `NEXT_PUBLIC_API_URL`.
  - `useListings` and `useListing` hooks return typed data, `isLoading`, and `error` states.
- **Estimated effort:** 3h

### S1-02 — i18n keys for search and listing

- **ID:** S1-02
- **Title:** Add Arabic/English messages for search and listing UI
- **Objective:** Provide localized labels for the guest journey so the interface is Arabic-first and can switch to English.
- **Files expected to change:**
  - `apps/web/messages/ar.json`
  - `apps/web/messages/en.json` (new if missing)
  - `apps/web/i18n.ts` (if `en` needs to be enabled)
- **Dependencies:** None
- **Acceptance Criteria:**
  - All new UI strings come from `messages/*.json`.
  - Keys exist for: `search.*`, `listing.*`, `common.loading`, `common.error`, `common.retry`, `nav.*`.
- **Estimated effort:** 2h

### S1-03 — Landing/hero search form

- **ID:** S1-03
- **Title:** Build the landing page with a search form
- **Objective:** Replace the current hard-coded search page with a guest-facing hero and search form that submit to the search results page.
- **Files expected to change:**
  - `apps/web/app/[locale]/page.tsx`
  - `apps/web/app/[locale]/search/page.tsx`
  - `apps/web/components/search/SearchForm.tsx` (new)
- **Dependencies:** S1-02
- **Acceptance Criteria:**
  - `/ar` renders a hero with title, subtitle, and a search form.
  - Submitting the form navigates to `/ar/search?q=<text>`.
  - Basic filters (check-in, check-out, guests) are optional but scaffolded as query params.
- **Estimated effort:** 4h

### S1-04 — Listing card component

- **ID:** S1-04
- **Title:** Build listing card component
- **Objective:** Create a reusable card that represents a search result.
- **Files expected to change:**
  - `apps/web/components/listings/ListingCard.tsx` (new)
  - `apps/web/components/listings/ListingCardSkeleton.tsx` (new)
- **Dependencies:** S1-02
- **Acceptance Criteria:**
  - Card displays title (Arabic), city/governorate, property type, base price EGP, and max guests.
  - Card is clickable and links to `/[locale]/listings/<id>`.
  - Card skeleton matches the card layout for loading states.
  - Uses `formatMoney` from `apps/web/lib/utils.ts`.
- **Estimated effort:** 4h

### S1-05 — Search results page with real data

- **ID:** S1-05
- **Title:** Fetch and display search results
- **Objective:** Use `useListings` to call `GET /api/v1/listings` and render results in a responsive grid.
- **Files expected to change:**
  - `apps/web/app/[locale]/search/page.tsx`
  - `apps/web/components/listings/ListingGrid.tsx` (new)
  - `apps/web/components/search/SearchFilters.tsx` (new)
- **Dependencies:** S1-01, S1-03, S1-04
- **Acceptance Criteria:**
  - `GET /api/v1/listings?q=<text>` is called with `q`, `limit=20`, and optional `min_price`, `max_price`, `guests`, `property_type`.
  - Page shows loading skeleton, error message with retry button, empty state, and results grid.
  - Grid is 1 column on mobile, 2 on tablet, 3 on desktop.
- **Estimated effort:** 5h

### S1-06 — Listing detail page

- **ID:** S1-06
- **Title:** Build minimum listing details page
- **Objective:** Display a single listing returned by `GET /api/v1/listings/{unit_id}`.
- **Files expected to change:**
  - `apps/web/app/[locale]/listings/[unitId]/page.tsx` (new)
  - `apps/web/app/[locale]/listings/[unitId]/loading.tsx` (new)
  - `apps/web/app/[locale]/listings/[unitId]/error.tsx` (new)
  - `apps/web/components/listings/ListingDetail.tsx` (new)
- **Dependencies:** S1-01, S1-02, S1-04
- **Acceptance Criteria:**
  - Page fetches `GET /api/v1/listings/{unitId}`.
  - Displays title, description, location, price, amenities, cultural tags, and house rules.
  - Includes a loading skeleton and an error boundary/inline error state.
  - No booking or payment UI is shown.
- **Estimated effort:** 5h

### S1-07 — Loading, error, and responsive layout

- **ID:** S1-07
- **Title:** Wrap pages in guest layout and unify loading/error states
- **Objective:** Make every guest-facing page use `GuestLayout`, `Header`, `Footer`, and consistent skeleton/error components.
- **Files expected to change:**
  - `apps/web/app/[locale]/search/loading.tsx` (new)
  - `apps/web/app/[locale]/search/error.tsx` (new)
  - `apps/web/app/[locale]/layout.tsx`
  - `apps/web/app/[locale]/search/page.tsx`
  - `apps/web/app/[locale]/listings/[unitId]/page.tsx`
  - `apps/web/components/ui/Skeleton.tsx` (if needed)
- **Dependencies:** S1-03, S1-05, S1-06
- **Acceptance Criteria:**
  - All guest pages show `Header` and `Footer`.
  - Loading and error boundaries are in place for `search` and `listings/[unitId]`.
  - Layout is responsive from 320px to 1440px.
- **Estimated effort:** 3h

### S1-08 — Local demo seed data

- **ID:** S1-08
- **Title:** Seed the local database with demo listings
- **Objective:** Ensure the local demo has at least three published listings to search and view.
- **Files expected to change:**
  - `scripts/seed_staging.py` (if existing script needs adjustment for local use)
  - `src/app/listings/constants.py` or `src/app/auth/constants.py` (if needed for KYC/host status)
- **Dependencies:** S1-05
- **Acceptance Criteria:**
  - Running `python scripts/seed_staging.py` (or an equivalent local command) creates at least 3 `LISTED` units in the local database.
  - `GET /api/v1/listings` returns those units.
- **Estimated effort:** 2h

---

## 5. Acceptance Criteria

- A guest can open `http://localhost:3000/ar`, submit a search, and see listing cards.
- Clicking a card navigates to the details page.
- Backend `/api/v1/listings` returns data for published listings.
- `npm run build` and `npm run lint` both pass.
- `python3 -m pytest tests/` passes with ≥80% coverage.
- `git status` remains clean after each committed task.

---

## 6. Execution Order

1. S1-01 — API client and query hooks
2. S1-02 — i18n keys for search and listing
3. S1-03 — Landing/hero search form
4. S1-04 — Listing card component
5. S1-05 — Search results page with real data
6. S1-06 — Listing detail page
7. S1-07 — Loading, error, and responsive layout
8. S1-08 — Local demo seed data

---

## 7. Estimated Sprint Duration

**8 tasks × 28 hours = ~28 engineering hours**

Recommended: **1.5 to 2 weeks** with 1 backend and 1 frontend engineer, assuming sequential dependency order and 1 to 2 hours per day of overlap.
