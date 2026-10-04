# Database Relationship Map

```mermaid
erDiagram
    auth_users ||--o{ pms_units : hosts
    auth_users ||--o{ booking_bookings : "books as guest"
    auth_users ||--o{ auth_refresh_tokens : sessions
    auth_users ||--o{ auth_device_tokens : devices
    auth_users ||--o{ auth_staff_permissions : "staff grants"
    pms_units ||--o{ pms_unit_photos : photos
    pms_units ||--|| pms_unit_listings : listing
    pms_units ||--o{ pms_calendar_rules : availability
    pms_units ||--o{ booking_bookings : booked
    booking_bookings ||--o| reservation_reservations : "stay record"
    booking_bookings ||--o{ payments_payments : paid
    reservation_reservations ||--|| finance_escrow_accounts : "funds held"
    finance_escrow_accounts ||--o{ finance_ledger_entries : postings
    finance_wallets ||--o{ finance_ledger_entries : postings
    finance_wallets ||--o{ finance_payout_requests : payouts
    booking_bookings ||--o| messaging_conversations : "reservation chat (UNIQUE)"
    booking_bookings ||--o{ messaging_conversations : "support ctx (context_booking_id)"
    messaging_conversations ||--o{ messaging_conversation_participants : members
    messaging_conversations ||--o{ messaging_messages : messages
    booking_bookings ||--o{ reviews_reviews : "guest+host"
    pms_units ||--o{ operations_operation_tasks : ops
    auth_users ||--o{ kyc_kyc_documents : identity
    booking_bookings ||--o{ disputes_disputes : disputes
    booking_bookings ||--o{ finance_commercial_adjustments : adjustments
```

## Notes
- `conversations.booking_id` UNIQUE = the reservation thread;
  `context_booking_id` (non-unique FK) = support thread booking context.
- `escrow_accounts` is the funds-held liability record; `ledger_entries` is
  the immutable double-entry trail (authoritative for all KPIs).
- `payments` rows track Paymob intentions/proofs; `reservations` is the stay
  record distinct from the `bookings` request record.
