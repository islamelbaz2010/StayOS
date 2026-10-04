# 09 — API Contracts

Full machine-generated catalog: `API_ROUTE_CATALOG.md` (257 ops).
Source of truth: `apps/web/lib/openapi.json` (regenerate via
`scripts/export_openapi.py`); typed TS contracts in `lib/api-types.ts`.

## Conventions
- Prefix `/api/v1`. Bearer JWT (`RS256`, 15-min TTL) via `Authorization` header;
  refresh via `/auth/refresh` (rotating refresh tokens, `/auth/logout-all`).
- Errors → `app.shared.exceptions`: 404 `NotFoundError`, 422/400
  `ValidationError`, 403 `AuthorizationError`, consistent JSON error body.
- Pagination: `items/total/page/page_size/total_pages` (`offset`/`limit` params).
- IDs are opaque strings/UUIDs — never expose raw DB internals beyond public IDs.
- Webhooks authenticate via HMAC signature (Paymob notification URL), not JWT.

## Contracts that matter most
- **Booking quote** (`/bookings/quote` family in payments): all-inclusive
  guest price computed server-side; breakdown exposes only guest-facing
  lines — internal splits never leave the backend.
- **Support**: `POST /messages/support`, `GET /messages/support/queue`
  (ops permission), `POST /messages/support/{id}/status`. Booking context via
  `context_booking_id` — validated against caller's guest/host relationship.
- **Host bookings**: `/host/bookings` paginated with `status`, `unit_id`,
  `area`, `governorate`, `search` params — the filter cascade derives
  options client-side from `/host/listings` data.
- **Idempotent finance**: capture/recognition/release/refund dedupe on
  provider reference + ledger keys — safe to retry webhooks and jobs.

## Client usage
- Web: `apps/web/lib/api-types.ts` (generated) + `lib/queries/*` hooks.
- Mobile: `apps/mobile/src/lib/hooks.ts` — keep in sync when contracts change.
