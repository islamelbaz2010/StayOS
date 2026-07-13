# 07 — Sequence Diagrams

**Cross-references**: [06_EVENT_CATALOG.md](06_EVENT_CATALOG.md) · [03_MICROSERVICES.md](03_MICROSERVICES.md) · [ADR-003](../architecture/adr/ADR-003-payment-provider.md) · [ADR-013](../architecture/adr/ADR-013-event-driven-architecture.md)

---

## 1. Booking Flow (Guest → Confirmed Reservation)

```mermaid
sequenceDiagram
    actor Guest
    participant Frontend as Next.js Frontend
    participant API as FastAPI API
    participant Auth as AuthGate
    participant Res as Reservation Engine
    participant PMS as PMS Core
    participant Finance as FinancialEngine
    participant Paymob as Paymob / Stripe
    participant Notify as Notification
    participant DB as PostgreSQL
    participant Queue as Celery / Redis

    Guest->>Frontend: Search for unit, select dates
    Frontend->>API: GET /api/v1/listings/{unit_id}/availability
    API->>PMS: check_availability(unit_id, check_in, check_out)
    PMS->>DB: SELECT calendar_rules WHERE unit_id AND dates overlap
    DB-->>PMS: No conflict
    PMS-->>API: AVAILABLE
    API-->>Frontend: availability response

    Guest->>Frontend: Click "Book Now"
    Frontend->>API: POST /api/v1/reservations
    API->>Auth: verify_token(jwt)
    Auth-->>API: user verified, KYC_VERIFIED

    API->>Res: initiate_booking(unit_id, guest_id, check_in, check_out, payment_method)
    Res->>DB: BEGIN TRANSACTION
    Res->>DB: SELECT FROM calendar_rules WHERE unit_id AND dates FOR UPDATE NOWAIT
    Note over Res,DB: Row-level lock prevents concurrent booking of same dates
    DB-->>Res: Lock acquired
    Res->>DB: INSERT INTO calendar_rules (status=HOLD, reservation_id=...)
    Res->>DB: INSERT INTO reservations (status=PENDING_PAYMENT)
    Res->>DB: INSERT INTO outbox_events (event_type=booking.initiated)
    Res->>DB: COMMIT

    Res->>Paymob: create_payment_order(amount_egp, order_ref, callback_url)
    Paymob-->>Res: payment_token + redirect_url
    Res-->>API: {reservation_id, payment_url}
    API-->>Frontend: {reservation_id, payment_url}
    Frontend->>Guest: Redirect to Paymob payment page

    Guest->>Paymob: Complete payment (Fawry / card / wallet)
    Paymob->>API: POST /api/v1/finance/webhooks/paymob (CAPTURED)
    API->>Finance: process_payment_webhook(payload)
    Finance->>Finance: HMAC-verify signature
    Finance->>DB: BEGIN TRANSACTION
    Finance->>DB: UPDATE payment_intents SET status=CAPTURED
    Finance->>DB: UPDATE reservations SET status=CONFIRMED
    Finance->>DB: UPDATE calendar_rules SET status=BOOKED (release HOLD)
    Finance->>DB: INSERT INTO outbox_events (event_type=booking.payment_confirmed)
    Finance->>DB: COMMIT

    Queue->>DB: Poll outbox (booking.payment_confirmed)
    Queue->>Finance: task: create_escrow(reservation_id)
    Finance->>DB: INSERT INTO escrow_accounts (status=HELD, release_eligible_at=check_in+24h)
    Queue->>Notify: task: send_booking_confirmation(guest_id, host_id, reservation_id)
    Notify->>Guest: WhatsApp booking confirmation (ar)
    Notify->>Host: WhatsApp booking notification (ar)

    API-->>Frontend: SSE event: booking_confirmed
    Frontend->>Guest: Show "Booking Confirmed" screen
```

---

## 2. Check-In Flow

```mermaid
sequenceDiagram
    actor Host
    participant Frontend as Host Dashboard
    participant API as FastAPI API
    participant Res as Reservation Engine
    participant Finance as FinancialEngine
    participant Notify as Notification
    participant DB as PostgreSQL
    participant Queue as Celery

    Host->>Frontend: Click "Check-In Guest" on reservation
    Frontend->>API: POST /api/v1/reservations/{id}/check-in
    API->>Res: record_check_in(reservation_id, host_id)
    Res->>DB: UPDATE reservations SET status=CHECKED_IN, checked_in_at=NOW()
    Res->>DB: INSERT INTO outbox_events (event_type=booking.checked_in)
    Res->>DB: COMMIT

    Queue->>DB: Poll outbox (booking.checked_in)
    Queue->>Finance: task: start_escrow_timer(reservation_id)
    Finance->>DB: UPDATE escrow_accounts SET release_eligible_at=NOW()+INTERVAL '24 hours'
    Note over Finance,DB: Celery Beat will poll for eligible releases

    Queue->>Notify: task: send_checkin_confirmation(guest_id)
    Notify->>Guest: WhatsApp "Welcome!" message with check-in instructions (ar)

    Res-->>API: 200 OK {checked_in_at: "..."}
    API-->>Frontend: check-in recorded
    Frontend->>Host: Update UI to show "Guest Checked In"
```

---

## 3. Check-Out Flow

```mermaid
sequenceDiagram
    actor Host
    participant Frontend as Host Dashboard
    participant API as FastAPI API
    participant Res as Reservation Engine
    participant Ops as OpsManager
    participant Finance as FinancialEngine
    participant Notify as Notification
    participant DB as PostgreSQL
    participant Queue as Celery

    Host->>Frontend: Click "Check-Out Guest"
    Frontend->>API: POST /api/v1/reservations/{id}/check-out
    API->>Res: record_check_out(reservation_id, host_id)
    Res->>DB: UPDATE reservations SET status=CHECKED_OUT, checked_out_at=NOW()
    Res->>DB: INSERT INTO outbox_events (event_type=booking.checked_out, next_check_in=...)
    Res->>DB: COMMIT

    Queue->>DB: Poll outbox (booking.checked_out) — HIGH PRIORITY
    Queue->>Ops: task: create_turnover_ticket(unit_id, reservation_id, next_check_in)
    Note over Ops: Must execute within 5 minutes (BR-OPS-01)
    Ops->>DB: INSERT INTO turnover_tickets (status=OPEN, due_by=next_check_in-1h)
    Ops->>DB: INSERT INTO outbox_events (event_type=ops.ticket_created)
    Ops->>Ops: TurnoverDispatcher.find_nearest_staff(unit.coordinates)
    Ops->>DB: INSERT INTO staff_assignments (ticket_id, staff_id, assigned_at=NOW())
    Ops->>DB: INSERT INTO outbox_events (event_type=ops.ticket_assigned)

    Queue->>Notify: task: send_ticket_assignment(staff_id, ticket_id)
    Notify->>FieldStaff: WhatsApp "New cleaning assignment" with unit address (ar)

    Queue->>Notify: task: send_checkout_confirmation(guest_id)
    Notify->>Guest: WhatsApp checkout receipt + review request (ar)

    API-->>Frontend: 200 OK
    Frontend->>Host: Update UI "Guest Checked Out"
```

---

## 4. Payment Flow (Paymob — Egyptian Rails)

```mermaid
sequenceDiagram
    actor Guest
    participant Frontend as Next.js
    participant API as FastAPI
    participant Res as Reservation Engine
    participant Paymob as Paymob API
    participant DB as PostgreSQL

    Guest->>Frontend: Select "Fawry" as payment method
    Frontend->>API: POST /api/v1/reservations (payment_method=FAWRY)
    API->>Res: initiate_booking(...)

    Res->>Paymob: POST /api/auth/tokens (get Paymob auth token)
    Paymob-->>Res: auth_token

    Res->>Paymob: POST /api/ecommerce/orders (create order, amount_cents=420000)
    Paymob-->>Res: {order_id: "12345"}

    Res->>Paymob: POST /api/ecommerce/orders/payment_keys
    Note over Res,Paymob: payment_method=FAWRY, order_id=12345, billing_data
    Paymob-->>Res: {payment_token: "abc123"}

    Res->>DB: INSERT payment_intents (provider=PAYMOB, provider_ref="12345", status=PENDING)
    Res-->>API: {reservation_id, payment_url: "https://accept.paymob.com/api/acceptance/iframes/...?payment_token=abc123"}
    API-->>Frontend: payment_url
    Frontend->>Guest: Show Fawry reference number "Ref: 123456789"

    Guest->>FawryKiosk: Pay with Fawry reference
    FawryKiosk->>Paymob: Payment confirmed
    Paymob->>API: POST /api/v1/finance/webhooks/paymob {type: "TRANSACTION", success: true, order: {id: "12345"}}
    API->>Finance: process_paymob_webhook(payload)
    Finance->>Finance: HMAC-SHA512 verify(payload, secret)
    Finance->>DB: UPDATE payment_intents SET status=CAPTURED WHERE provider_ref="12345"
    Finance->>DB: UPDATE reservations SET status=CONFIRMED
    Note over Finance,DB: Idempotency check: SET "paymob_12345_processed" in Redis NX
```

---

## 5. Refund Flow

```mermaid
sequenceDiagram
    actor Guest
    participant API as FastAPI
    participant Res as Reservation Engine
    participant Finance as FinancialEngine
    participant Paymob as Paymob API
    participant DB as PostgreSQL
    participant Queue as Celery
    participant Notify as Notification

    Guest->>API: POST /api/v1/reservations/{id}/cancel {reason: "CHANGE_OF_PLANS"}
    API->>Res: cancel_reservation(reservation_id, guest_id, reason)
    Res->>Res: calculate_refund(check_in, cancelled_at, cancellation_policy)
    Note over Res: Refund = 100% if cancelled > 48h before check-in
    Res->>DB: BEGIN TRANSACTION
    Res->>DB: UPDATE reservations SET status=CANCELLED, refund_amount_egp=3500
    Res->>DB: UPDATE calendar_rules SET status=AVAILABLE (release dates)
    Res->>DB: INSERT INTO outbox_events (event_type=booking.cancelled, refund_amount=3500)
    Res->>DB: COMMIT

    Queue->>Finance: task: process_refund(reservation_id, amount_egp=3500)
    Finance->>DB: SELECT payment_intents WHERE reservation_id (get provider_ref)
    Finance->>Paymob: POST /api/acceptance/void_refund {transaction_id: "...", amount_cents: 350000}
    Paymob-->>Finance: {success: true, transaction_id: "refund_123"}
    Finance->>DB: INSERT ledger_entries (DEBIT platform, CREDIT guest, ref=REFUND)
    Finance->>DB: INSERT outbox_events (event_type=finance.refund_processed)

    Queue->>Notify: task: send_refund_confirmation(guest_id, amount=3500)
    Notify->>Guest: WhatsApp "Refund of 3,500 EGP processed — expect within 5 business days" (ar)
```

---

## 6. Escrow Release Flow

```mermaid
sequenceDiagram
    participant Beat as Celery Beat
    participant Worker as Celery Worker
    participant Finance as FinancialEngine
    participant Paymob as Paymob Disburse
    participant DB as PostgreSQL
    participant Queue as Celery Queue
    participant Notify as Notification

    Note over Beat: Runs every 15 minutes
    Beat->>Worker: task: release_eligible_escrows()
    Worker->>DB: SELECT FROM escrow_accounts WHERE status=HELD AND release_eligible_at <= NOW() LIMIT 100 FOR UPDATE SKIP LOCKED
    DB-->>Worker: [{escrow_id: "abc", reservation_id: "xyz", host_id: "...", amount_egp: 3780}]

    loop For each eligible escrow
        Worker->>Finance: release_escrow(escrow_id)
        Finance->>DB: BEGIN TRANSACTION
        Finance->>DB: UPDATE escrow_accounts SET status=RELEASED, released_at=NOW()
        Finance->>DB: INSERT ledger_entries (CREDIT host_account, amount=3780)
        Finance->>DB: INSERT outbox_events (event_type=finance.escrow_released)
        Finance->>DB: COMMIT
    end

    Note over Beat: Payout batch runs daily at 09:00 Cairo time
    Beat->>Worker: task: run_payout_batch()
    Worker->>DB: SELECT host_id, SUM(amount) FROM ledger_entries WHERE entry_type=CREDIT AND NOT paid GROUP BY host_id
    Worker->>Paymob: POST /api/acceptance/bulk_disbursement [{host_bank, amount, ref}]
    Paymob-->>Worker: [{status: success, transaction_id: "..."}]
    Worker->>DB: INSERT payout_instructions (status=DISPATCHED)
    Worker->>Queue: enqueue notify: payout_dispatched for each host
    Queue->>Notify: send_payout_receipt(host_id, amount)
    Notify->>Host: WhatsApp "Payout of X EGP sent to your account" (ar)
```

---

## 7. Host Approval (KYC + Listing Verification)

```mermaid
sequenceDiagram
    actor Host
    participant Frontend as Host Dashboard
    participant API as FastAPI
    participant Auth as AuthGate
    participant AWS as AWS Textract / Rekognition
    participant DB as PostgreSQL
    participant Queue as Celery
    participant Notify as Notification
    actor Admin

    Host->>API: POST /api/v1/auth/kyc/upload-url
    API->>Auth: generate_presigned_s3_url(user_id, document_type)
    Auth->>AWS_S3: generate presigned PUT URL (stayos-kyc bucket, 15 min TTL)
    AWS_S3-->>Auth: presigned_url
    Auth-->>API: {upload_url, expires_in: 900}
    API-->>Frontend: presigned_url
    Frontend->>AWS_S3: PUT document (passport scan)

    AWS_S3->>API: S3 event notification (object created)
    API->>Queue: enqueue task: process_kyc_document(user_id, s3_key)
    Queue->>AWS: Textract: analyze_document(s3_key)
    AWS-->>Queue: {name, id_number, expiry_date, nationality}
    Queue->>AWS: Rekognition: compare_faces(document_photo, selfie_s3_key)
    AWS-->>Queue: {similarity: 0.97, confidence: 0.99}
    Queue->>DB: UPDATE kyc_records SET ocr_result={...}, biometric_score=0.97, status=PENDING_REVIEW
    Queue->>Queue: enqueue notify: kyc_pending_review(admin_id)

    Admin->>Frontend: View KYC review queue in Incident Console
    Admin->>API: PATCH /api/v1/admin/users/{user_id}/kyc {action: APPROVE}
    API->>Auth: approve_kyc(user_id, reviewer_id)
    Auth->>DB: BEGIN TRANSACTION
    Auth->>DB: UPDATE kyc_records SET status=VERIFIED, reviewer_id=..., reviewed_at=NOW()
    Auth->>DB: UPDATE users SET status=ACTIVE (if was PENDING_KYC)
    Auth->>DB: INSERT outbox_events (event_type=user.kyc_verified)
    Auth->>DB: COMMIT

    Queue->>Notify: send_kyc_verified(host_id)
    Notify->>Host: WhatsApp "Your identity is verified! Start adding your property." (ar)

    Host->>API: POST /api/v1/listings {unit details, coordinates, amenities}
    API->>PMS: create_unit(host_id, ...)
    PMS->>DB: INSERT units (status=PENDING_VERIFICATION)
    PMS-->>API: {unit_id}
    Note over PMS: Admin or field staff physically verifies property before LISTED status
```

---

## 8. Operations — Turnover Completion

```mermaid
sequenceDiagram
    actor Staff as Field Staff
    participant App as Mobile App (offline-capable)
    participant API as FastAPI API
    participant Ops as OpsManager
    participant PMS as PMS Core
    participant DB as PostgreSQL
    participant S3 as AWS S3
    participant Queue as Celery

    Note over App: Staff may be offline (SQLite local store)
    Staff->>App: Open ticket, start checklist
    Staff->>App: Mark task "Bedroom cleaned" ✓
    App->>App: Store locally in SQLite

    Staff->>App: Capture photo of cleaned bedroom
    App->>App: Store photo in device sandbox (offline)

    Note over App: Connectivity restored
    App->>API: POST /api/v1/ops/sync [{task_completions, photos}]
    API->>S3: Upload photos to stayos-ops-photos bucket (pre-signed)
    API->>Ops: batch_sync(staff_id, completions, photo_s3_keys)
    Ops->>DB: UPDATE ticket_tasks SET completed=true, completed_at=...
    Ops->>DB: INSERT task_photos (s3_key, task_id, uploader_id)

    Staff->>API: POST /api/v1/ops/tickets/{id}/close
    API->>Ops: close_ticket(ticket_id, staff_id)
    Ops->>Ops: validate: all critical tasks checked + photos attached
    Ops->>DB: BEGIN TRANSACTION
    Ops->>DB: UPDATE turnover_tickets SET status=CLOSED, closed_at=NOW()
    Ops->>DB: INSERT outbox_events (event_type=ops.turnover_complete, unit_id=...)
    Ops->>DB: COMMIT

    Queue->>PMS: task: mark_unit_ready(unit_id)
    PMS->>DB: UPDATE units SET status=READY_FOR_OCCUPANCY (or restore to LISTED)
    PMS->>DB: INSERT outbox_events (event_type=unit.calendar_blocked for next AVAILABLE period)
    Queue->>SSE: Push calendar update to active search sessions
```
