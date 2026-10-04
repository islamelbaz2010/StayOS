# Mobile API Parity — 2026-10-04

Source: `apps/mobile/src/lib/hooks.ts` + `api.ts` vs `apps/web/lib/openapi.json`
(257 operations). Base URL `EXPO_PUBLIC_API_URL` → `{api}/api/v1` ✓.

## Endpoint coverage — ALL 25 mobile calls resolve on the API
`/auth/me` `/auth/me/role` `/auth/otp/send` `/auth/otp/verify`
`/auth/dev-token` `/auth/logout` `/bookings` `/bookings/guest`
`/favorites` `/favorites/{unit_id}` `/host/calendar` `/host/earnings`
`/host/profile` `/host/reservations` `/host/today` `/kyc/initiate`
`/kyc/status` `/listings` `/listings/host/listings`
`/locations/autocomplete` `/locations/popular` `/messages/conversations`
`/messages/conversations/unread` `/messages/templates` `/payments`
`/payments/quote`

## New/updated backend surface NOT yet consumed by mobile
| API surface | Contract | Mobile state | Priority |
|---|---|---|---|
| `POST /api/v1/messages/support` | `{subject, body, context_booking_id?}` → Conversation | not called | P1 |
| `GET /api/v1/messages/conversations?type=support` | list | filter not passed | P1 |
| `POST /api/v1/messages/support/{id}/status` | user: open/waiting_for_support/resolved | not called | P1 |
| `GET /api/v1/messages/bookings/{id}/conversation` | reservation thread | verify mobile thread fetch uses it | P1 |
| `GET /api/v1/host/bookings` | `status, unit_id, search, area, governorate` + page | mobile uses `/host/reservations` (status+page only) | P1 |
| Conversation payload | `type`, `subject`, `support_status`, `context_booking_id` fields added | mobile types predate them — display-safe but not surfaced | P1 |

## Auth contract
Bearer JWT + `/auth/refresh` rotation — interceptor implemented; SecureStore
persistence; `logout` clears tokens. Parity OK. `dev-token` used in dev
builds only — keep out of release builds (flag in app config, not a code
blocker).

## Error handling
Axios interceptor handles 401→refresh→retry once; non-401 propagates.
Recommendation for Phase 1: map API error bodies (`detail`) to localized
messages on support/payment surfaces (currently generic).

## Idempotency/retry
Reads safe via React Query. Writes: booking creation + payment initiation
are server-idempotent on provider refs — mobile should still disable
submit buttons during flight (verify in BookingScreen — flagged for
Phase 1 check).

## Localization
API returns localized template bodies by user locale; mobile `i18n.ts`
sends device locale. RTL via `I18nManager`. Parity OK.

## Permissions
No mobile admin/staff console — out of scope by design; staff ops remain
web. Support endpoints are user-role compatible.
