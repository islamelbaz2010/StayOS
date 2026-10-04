# 12 — Listing Lifecycle

## States
`DRAFT → SUBMITTED → (staff moderation) → LISTED` plus suspended/rejected
variants. `Unit` = the property record (host-owned, governorate/city fields);
`UnitListing` = publishable listing view; `UnitPhoto` = media; `CalendarRule`
= availability/pricing overrides.

## Readiness
`compute_listing_readiness` covers real prerequisites only (fields, photos,
address, identity, availability, payout preference) — a draft reaches READY
without self-referential deadlock; `submit_for_review` requires READY.
Payout blockers link to `/host/profile` payout preferences.

## Moderation
Staff with `listings` permission (or admin) review via `/admin/pending`,
`/admin/listings`, `/admin/kyc`. Photos are moderated too
(`pending_photos` surface).

## Co-hosts
`/host/listings/{id}/co-hosts` — scoped co-host access; the booking-detail
capability model honors co-host scopes.

## Media
S3/Tigris bucket `S3_LISTINGS_BUCKET`; private `s3://` refs resolve to
signed GETs (`S3_PRESIGNED_GET_TTL_SECONDS`, `IMAGE_HOST_ALLOWLIST` guards
external URLs only). Public `cover_image` resolves through the same
canonical signed-media path.

## Discovery (supply)
`discovery_*` tables + `GOOGLE_PLACES_API_KEY` (separate credential from the
client maps key) feed the supply-discovery admin surface — not guest-visible.

## Bulk import
`importer` module + `/admin/import` for CSV onboarding of inventory.
