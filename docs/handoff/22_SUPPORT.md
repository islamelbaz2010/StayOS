# 22 — Support System (implemented, production-verified)

## Model
Support rides the messaging subsystem — **no separate ticket system**:

- `Conversation.type = SUPPORT`, `subject`, `support_status` ∈
  `open | waiting_for_support | waiting_for_user | resolved`,
  `context_booking_id` (optional booking link — NOT the `booking_id` FK,
  which stays reserved for the unique reservation thread).
- Participants: user + ops staff (auto-join on first staff reply).
- Migration: `alembic/versions/053_support_conversations.py` (applied to prod).

## API
- `POST /messages/support` — user opens a thread (subject, body,
  optional `context_booking_id` validated against caller's booking role).
- `GET /messages/conversations?type=support` — user's history.
- `GET /messages/support/queue` — staff queue, `operations` permission.
- `POST /messages/support/{id}/status` — users may set open /
  waiting_for_support / resolved (reopen allowed); `waiting_for_user` is
  staff-only (verified 403 for users).
- Ops notifications on new/updated threads via outbox.

## Web surface
`/support` — user inbox + thread + new-request form + booking-context picker
(the contextual "Get booking help" link on booking detail preselects it).
`/admin/support` — staff queue with triage/reply; AdminLayout shows an
open-thread badge.

## Rules enforced server-side
- Queue and staff replies require `operations` permission (`_can_handle_support`).
- Booking context requires the caller to be guest-owner, host, or staff on
  that booking — verified in prod E2E.
