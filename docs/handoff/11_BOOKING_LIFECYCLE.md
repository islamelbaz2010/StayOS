# 11 — Booking & Reservation Lifecycle

## Request → confirmed
1. Guest `POST /bookings` (request-to-book) or instant book — booking row in
   `booking.bookings`, calendar lock acquired via Redis (`CALENDAR_LOCK_TIMEOUT_MS`).
2. Host accept/reject (host can no longer cancel or check-in — removed by
   founder decision; guest/admin only).
3. Payment: Paymob Intention (card) or manual bank-transfer proof upload.
4. `confirmed` on capture → escrow account created + revenue/VAT recognition
   posted to ledger; reservation record in `reservation.reservations`.
5. Requests expire via `REQUEST_EXPIRATION_HOURS`; payments via
   `PAYMENT_DEADLINE_HOURS` (beat tasks).

## Stay
- Check-in / check-out actions are owner-gated (`/bookings/{id}/stay`,
  capability-based: owner, or admin).
- Completion → host-funds release window = check-in + 24h.
- No-show status supported.

## Cancellation
- Actors: guest (owner) or admin — enforced server-side with named actor
  in events/notifications (listing title in the notification body, EN/AR).
- Refund policy env: `CANCELLATION_FULL_REFUND_DAYS` (7),
  `CANCELLATION_PARTIAL_REFUND_DAYS` (3), `CANCELLATION_PARTIAL_REFUND_PCT` (0.5).
- Cancellation on a recognised escrow posts reversal entries
  (host share + refunded VAT/revenue), credit → cash or guest_refund_payable.

## Booking detail capability
One page adapts by relationship: owner → checkout/review/support actions;
host/co-host/staff viewer → payment card + guest trust context.
`get_stay_info` populates `permission_scope` + guest trust fields.

## Booking offers
`booking.booking_offers` — offers can create booking+payment on accept;
expired offers can't be accepted.

## Support linkage
`GET /messages/bookings/{id}/conversation` — the one reservation thread
(unique `booking_id`). Support threads reference the booking via
`context_booking_id` (see `22_SUPPORT.md`).
