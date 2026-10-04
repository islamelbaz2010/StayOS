# Mobile Phase 1 Execution Plan — Production API Parity + Screen Gaps

## Objective
Bring the existing Expo app to full parity with the production API for the
surfaces shipped in the web closure — support, host filters, and build
readiness. Production parity, NOT a cosmetic redesign.

## Scope (in priority order)

### P1-A — In-app support (API already live)
- New `SupportInboxScreen` + reuse `MessageScreen` for threads.
- Create thread: `POST /messages/support` `{subject, body,
  context_booking_id?}` — booking picker over `/bookings/guest`.
- List: `GET /messages/conversations?type=support`.
- Status: `POST /messages/support/{id}/status` — user values only
  (open / waiting_for_support / resolved; never `waiting_for_user`).
- Keep WhatsApp link as fallback row.
- Surface `support_status` + `subject` in inbox rows (new conversation
  fields — update `lib/types.ts`).

### P1-B — Host reservation filters
- Switch host reservations list to `GET /host/bookings` with
  `status, unit_id, area, governorate, search` (cascade governorate→area
  →listing, mirroring web) — verify response shape vs `/host/reservations`
  and map fields.

### P1-C — Parity hardening
- Localized API error mapping (`detail` → t()) on support + payment.
- Disable submit while booking/payment mutations in flight.
- Verify reservation-thread fetch uses `/messages/bookings/{id}/conversation`.
- Types refresh for new Conversation fields.

### P2 — Build readiness
- Add `production` profile to `eas.json`; keep `preview` APK flow.
- iOS: defer provisioning until founder requests TestFlight.

## Out of scope
Admin/staff console (web-only), KYC automation UI (prod is manual),
financial logic changes, redesign.

## Sequence
1. types/hooks for support + host bookings params
2. SupportInboxScreen + thread reuse + booking-context picker
3. Host filters cascade
4. Error-map + in-flight hardening
5. eas production profile
6. Device smoke (Android first)

## Acceptance criteria
- Guest opens support thread with/without booking context; staff reply
  appears; status transitions obey user rules (server-enforced).
- Host filters produce identical result sets as web for same params.
- EN/AR + RTL verified on every new screen.
- Preview APK builds green via existing CI.
- No regression: existing guest/host suites pass on-device.

## Gates
API contracts above are frozen — do not request backend changes for
Phase 1; any apparent need is a design bug unless proven otherwise.
