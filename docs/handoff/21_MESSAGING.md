# 21 — Messaging

## Data model
`messaging.conversations` — `type` enum:
- `reservation` — guest↔host thread, unique per `booking_id`
- `offer` — booking-offer context
- `unit_inquiry` — pre-booking host contact on a unit
- `support` — user↔StayOS ops (see `22_SUPPORT.md`)

`conversation_participants` (role: guest/host/support/staff, unread
count, last_read) + `messages` (sender, body, read_at).

## Behaviors
- `GET /messages/bookings/{booking_id}/conversation` — the canonical
  reservation thread; access = booking participants + authorized staff.
- `POST /messages/bookings/{id}/availability` — host availability reply.
- Unread: `unread_count` on participants; `GET /messages/unread` aggregates.
- Notifications: new messages enqueue outbox events → push/email per prefs.
- Staff visibility: ops/support staff join via participant role — never
  silent access without a participant row.

## Storage
Message attachments ride the private `S3_ATTACHMENTS_BUCKET` signed-URL
flow (shared with payment-proof media).

## Web surface
`/messages` — thread list + conversation; unread badge in header/account
menu aggregate.
