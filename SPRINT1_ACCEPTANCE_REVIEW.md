# SPRINT1_ACCEPTANCE_REVIEW.md

## Executive Summary

Sprint 1 delivered a functioning Guest Listings journey from landing page through search results to listing details. The backend exposes consistent `GET /api/v1/listings` and `GET /api/v1/listings/{unitId}` endpoints, the frontend consumes them with TanStack Query, and a seed script provides demo data. All S1-01 through S1-08 completion reports were reviewed, and the repository is clean.

The implementation is **largely consistent** with the existing architecture, respects Sprint 1 scope, and passes lint, type-check, build, and backend tests. Several non-blocking technical-debt items remain, primarily around hardcoded market assumptions, client-side image rendering, and limited pagination. No exact blockers prevent Sprint 2 from beginning.

## Overall Score: 86/100

## Engineering Score: 85/100

### Strengths

- **Backend tests and type safety:** `ruff`, `mypy`, and `pytest` all pass; 293 backend tests passed for S1-01.
- **Reusable frontend layers:** Shared `api` client, `useListings`/`useListing` hooks, `formatMoney`, `cn`, `ErrorState`, `EmptyState`, `Skeleton`, `ListingCard`, and `GuestLayout` reduce duplication.
- **Eager loading:** `Unit.photos` is `selectinload`-ed in search and detail to avoid N+1 queries.
- **i18n-first:** All visible strings are `next-intl` keys; `ar` is the default locale; `dir="rtl"` is set at root.

### Concerns

- **Hardcoded market data:** `country` and `currency` are defaulted to `"Egypt"` / `"EGP"` in `ListingResponse`/`ListingSearchResult`; the DB has no columns to override them per unit or host. This is acceptable for Sprint 1 but must be resolved for multi-market.
- **Hand-rolled TypeScript API contracts:** `ApiSearchResponse` and `ApiListingResponse` are manually defined in `apps/web/lib/queries/listings.ts`. This is a maintenance risk if backend schemas drift.
- **Client-only data fetching:** Search and detail pages are `"use client"`. No SSR prefetch, which affects initial paint and SEO.
- **Image rendering:** `ListingCard` and the detail page use `<img>` with a remote URL and a local placeholder instead of Next.js `Image`. This bypasses optimization and requires an ESLint override.
- **Currency formatting is not locale-aware:** `formatMoney` always uses `ar-EG`, so the English site may show Arabic formatting.

## Product Score: 88/100

### Strengths

- The guest journey is complete: `/` → `/ar` landing → search form → search results → listing detail.
- All Sprint 1 required display fields are present on the detail page: cover image, title, description, city, governorate, country, property type, price, currency, max guests, amenities, house rules.
- Placeholder behavior works when `cover_image` is `null`.
- Error and empty states are implemented with retry and localized messages.

### Concerns

- **Search pagination UI is missing:** `useListings` exposes `hasMore` and `total`, but there is no "Load more" or cursor-based pagination.
- **Limited demo data variety:** The seed creates 3 apartments only; no villas, chalets, or price-range diversity, so filter and search edge cases are not visibly demonstrated.
- **No form validation:** The landing search form does not validate that `checkout` is after `checkin` or that dates are not in the past.

## UX Score: 87/100

### Strengths

- Consistent loading, error, and empty states across pages (`ErrorState`, `EmptyState`, `ListingDetailSkeleton`, `ListingCardSkeleton`).
- Focus rings, semantic headings, `aria-label`, `alt` text, and keyboard navigation are present.
- RTL root layout and `tailwindcss-rtl` are in place.
- The detail page no longer has a nested `<main>` and only renders the amenities section when it has data.

### Concerns

- **Skeleton count mismatch:** Search results show 6 skeleton cards while the default `limit` is 12.
- **Search results grid uses fixed breakpoints:** 1/2/3 columns are standard but were not tested on larger or smaller viewports.
- **Error/empty spacing is slightly inconsistent:** `ErrorState` has `mt-8` while the loading skeleton has `mt-6`.

## Architecture Score: 84/100

### Strengths

- The frontend follows the established Next.js App Router, `next-intl`, and Tailwind architecture.
- API client and query hooks are centralized.
- Backend repository/service/router split is maintained.
- No backend schema changes were introduced; existing PostGIS/PostGres models are reused.

### Concerns

- **No OpenAPI-generated TypeScript client:** Manual mapping between snake-case backend and camelCase frontend is acceptable for now but will not scale.
- **All data pages are client components:** A future architecture should introduce SSR or RSC with hydration for better performance.
- **Currency/country defaults live in the service layer** instead of the DB, which mixes business logic with temporary single-market assumptions.

## Security Score: 82/100

### Strengths

- No secrets are hardcoded in the frontend.
- `NEXT_PUBLIC_API_URL` is the only public environment variable and is appropriate for a public API base URL.
- JWT keys, Paymob, Twilio, and Firebase credentials remain server-side in `app.config`.

### Concerns

- **No Content Security Policy (CSP):** Loading remote images (`cover_image` from S3) without an image source policy increases XSS/data-exfiltration risk.
- **No rate limiting on public listing endpoints:** `GET /api/v1/listings` and `GET /api/v1/listings/{unitId}` are unauthenticated and currently unthrottled (the auth router has rate limits, but listings do not).
- **`<img>` with arbitrary `src`:** If `cover_image` is user-supplied, it should be validated/sanitized server-side and signed.

## Technical Debt

| Item | Classification | Notes |
|------|----------------|-------|
| Hardcoded `country` and `currency` defaults | Medium | Blocks multi-market/multi-currency support; requires DB columns and host settings. |
| No DB-level cover-photo selection | Low | `cover_image` falls back to first photo; a `cover_photo_id` or `is_cover` flag should be enforced. |
| Hand-rolled TS API types | Low | Manual mapping in `lib/queries/listings.ts` will drift; use OpenAPI generation. |
| Client-side data fetching only | Low | Affects SEO and initial paint; move to SSR/RSC where beneficial. |
| `<img>` instead of Next.js `Image` | Low-Medium | Performance and optimization loss; needs remotePatterns or image proxy. |
| `formatMoney` locale hardcoded to `ar-EG` | Low | English pages show Arabic-EG formatting. |
| No search pagination UI | Low | `hasMore`/`next_cursor` exist but not wired. |
| Limited demo seed variety | Low | More property types, prices, and amenities needed for robust demo. |

## Risks

1. **Market expansion risk:** Hardcoded Egypt/EGP assumptions in the backend response schemas will cause rework when launching in a new country.
2. **SEO/performance risk:** All listing pages fetch data client-side, which hurts first-contentful paint and search-engine indexing.
3. **Image optimization risk:** Using raw `<img>` for external images can increase bandwidth and cause layout shifts.
4. **API contract drift risk:** Manually maintained TypeScript interfaces can fall behind FastAPI schema changes.
5. **Security exposure risk:** Public listing endpoints without rate limiting and without a CSP are acceptable for an MVP but should be hardened before public launch.

## Deferred Items

- Booking, payment, availability calendar, reviews, ratings, maps, host profile, wishlist, and host onboarding remain intentionally out of Sprint 1 scope.
- Search pagination / infinite scroll.
- Next.js `Image` optimization with remotePatterns.
- SSR/RSC data prefetch.
- Multi-currency / multi-country support.
- CSP and rate limiting on listing endpoints.

## Recommendations

1. **Top priority for Sprint 2:** Introduce proper database-backed `country`, `currency`, and `cover_photo_id` fields so listing responses are no longer hardcoded.
2. Add a generated or shared API schema between backend and frontend to prevent contract drift.
3. Implement pagination or infinite scroll on the search results page using the existing `hasMore`/`next_cursor`.
4. Replace raw `<img>` with Next.js `Image` (or an image proxy) and configure `remotePatterns`.
5. Add a Playwright end-to-end test for the full guest journey from landing to listing details.
6. Add a CSP and rate limiting to public listing endpoints before any public exposure.

## Sprint 2 Go / No-Go Decision

### GO

Sprint 1 is accepted. The core guest journey is functional, the codebase is stable, and the team can move into Sprint 2. The technical-debt items are tracked and do not block development.

### Top 5 Priorities for Sprint 2

1. **Booking Request Flow:** Guest selects dates and guests on the listing detail page and submits a booking request.
2. **Host Calendar & Availability:** Host can manage availability and pricing rules; search filters respect unavailable dates.
3. **Authentication & Authorization:** Integrate OTP/Firebase auth and protect booking/host routes.
4. **Database-Backed Listing Settings:** Add `country`, `currency`, and `cover_photo_id` columns to remove hardcoded defaults.
5. **Search Pagination & Filters UI:** Wire `hasMore`/`next_cursor` and add price/guest/property-type filter controls to the search page.
