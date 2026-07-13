# ADR-011: Notification Architecture

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-012 (Queue — async dispatch), ADR-002 (Backend — notification service)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "Communications: WhatsApp Business API (primary), email, SMS"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §3 DEC-009 (WhatsApp primary), §11 experience thresholds
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §4 booking flow (notifications in each flow)
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 WhatsApp Business API confirmed, Twilio confirmed
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §3 Business Rules

---

## Problem

Multiple system events require user notification:
- Booking confirmation (guest + host)
- OpsManager ticket assignment (field staff)
- KYC verification result (guest/host)
- Payout processing (host)
- Dispute created/resolved (guest + host)
- Check-in reminder (guest, 24 hours before)

`DECISION_LOG.md` DEC-009 establishes WhatsApp Business API as the primary communication channel. Twilio is confirmed for OTP. Email is mentioned in MASTER_CONTEXT.md. No notification routing strategy is defined.

The experience threshold for initial chat response is ≤ 30 seconds (PRODUCT_CANON.md §11). Notification delivery must be fast and reliable.

---

## Notification Channels

### Channel 1: WhatsApp Business API (Primary — DEC-009)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Meta charges per conversation: ~$0.005–0.025/conversation depending on type and region. At Phase 1 volume (5K bookings/month × ~4 messages/booking): ~$100–500/month. |
| **Scalability** | WhatsApp Business API scales to millions of messages. |
| **Operational Complexity** | Moderate. Requires Meta Business verification. Template messages must be pre-approved by Meta. |
| **Security** | End-to-end encrypted. WhatsApp handles delivery. |
| **Performance** | Delivery typically < 5 seconds. Push notification on mobile. |
| **Future Global Expansion** | WhatsApp penetration: Egypt 95%+, Saudi Arabia 80%+, UAE 85%+. Covers full GCC expansion target. |

**Pros**: WhatsApp is the primary communication app for Egyptian and GCC users. DEC-009 explicitly selects it. Guests and hosts already use WhatsApp — zero friction for receiving booking updates. Rich message format (images, buttons, quick replies) enables interactive confirmations.

**Cons**: Template messages require Meta pre-approval (24–72 hour review cycle for new templates). Cannot send arbitrary text to users who haven't initiated a conversation (policy restriction). Requires Meta Business Manager setup.

**Usage in StayOS**:
- Booking confirmation: WhatsApp message to guest and host with booking reference
- Check-in reminder: 24-hour reminder to guest
- Ticket assignment: Field staff notified via WhatsApp
- Payout processed: Host notified with amount
- All transactional notifications where WhatsApp is the first-choice channel

---

### Channel 2: Email (Secondary — booking receipts and formal records)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | AWS SES: $0.10 per 1,000 emails. At Phase 1 volume: < $5/month. |
| **Scalability** | SES scales to millions of emails. |
| **Operational Complexity** | Low. AWS SES SMTP or API. SPF/DKIM/DMARC must be configured. |
| **Security** | TLS in transit. SPF/DKIM prevent spoofing. |
| **Performance** | Delivery < 30 seconds typically. |
| **Future Global Expansion** | Email works globally. |

**Usage in StayOS**:
- Booking receipt PDF (formal record)
- KYC verification result (formal identity notification)
- Invoice/payout statement (financial record)
- Account creation confirmation

Provider: **AWS SES** (aligned with ADR-007 AWS deployment).

---

### Channel 3: SMS via Twilio (OTP only — NOT transactional notifications)

**Decision**: Twilio SMS is restricted to OTP delivery only (as confirmed in TECH_STACK.md and ENGINEERING_BACKLOG.md).

**Rationale**: WhatsApp replaces SMS for transactional notifications. Using SMS for notifications alongside WhatsApp creates duplicate channels and cost. OTP via SMS is required for phone number verification regardless of WhatsApp availability.

SMS is NOT used for: booking confirmations, ticket assignments, payout notifications, or any marketing messages.

---

### Channel 4: In-App Notifications (Push via Firebase Cloud Messaging)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Free. Firebase Cloud Messaging has no per-message cost. |
| **Scalability** | Google-scale. |
| **Operational Complexity** | Low. Firebase SDK handles token management. |
| **Security** | APNS/GCM delivery via Google. |
| **Performance** | < 5 seconds typically. |
| **Future Global Expansion** | Works globally. |

**Usage**: Field staff mobile app push notifications for ticket assignments (in-app when open, push when backgrounded). Guest web app browser notifications for booking status updates.

---

## Notification Routing Logic

```
System event triggered
        │
        ▼
NotificationService determines recipients + channels
        │
        ├── WhatsApp available for user? YES → Send WhatsApp (primary)
        │                                NO  → Fall back to email
        │
        ├── Event is formal record (receipt, invoice)? → Always send email
        │
        ├── Event is OTP? → Send Twilio SMS only
        │
        └── Event is in-app (field staff/guest app open)? → FCM push
```

---

## Decision

**WhatsApp Business API (primary) + AWS SES email (secondary) + Twilio (OTP only) + Firebase Cloud Messaging (in-app push)**

All notification dispatch is **asynchronous** — dispatched via Celery tasks (ADR-012), never blocking the primary request path.

---

## Decision Rationale

1. **DEC-009 is clear**: WhatsApp is the primary channel. This ADR implements that decision.

2. **Email for formal records**: WhatsApp is not appropriate for invoice PDFs or KYC formal responses — email is the channel for document-bearing notifications.

3. **Async dispatch is mandatory**: Booking confirmation must not wait for WhatsApp API response. Celery task dispatches the notification; the booking API returns immediately after database write. If WhatsApp delivery fails, the Celery task retries — the booking is not affected.

4. **No dedicated push notification service**: Firebase Cloud Messaging covers the field staff mobile app. A dedicated push platform (OneSignal, Braze) is Phase 2+ when marketing push campaigns are needed.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| SMS for transactional (not OTP) | Cost; WhatsApp has higher engagement in Egypt/GCC; redundant channel |
| SendGrid for email | More expensive than AWS SES; no feature advantage at Phase 1 volume; adds vendor outside AWS ecosystem |
| OneSignal / Braze | Marketing/CRM platforms, not needed Phase 1; Firebase Cloud Messaging is free and sufficient for operational push |

---

## Migration Cost

**Phase 2 (marketing campaigns)**: Add a marketing email service (SendGrid, Mailchimp) alongside SES. SES remains for transactional. No disruption to existing notification flows.

**Phase 2 (rich WhatsApp chat)**: WhatsApp Business API already in use. Add conversational flows via WhatsApp template upgrade — same provider.

---

## Dependencies

- ADR-012 (Queue) — Celery workers dispatch all notifications asynchronously
- ADR-006 (Auth) — Twilio OTP is part of authentication flow
- ADR-007 (Deployment) — AWS SES in `me-central-1`

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-01 AuthGate | Twilio OTP on registration |
| FC-03 Reservation | WhatsApp confirmation to guest and host |
| FC-05 OpsManager | WhatsApp + FCM push to field staff |
| FC-06 Treasury | Email payout statement to host |
| Experience threshold | WhatsApp initial response ≤ 30 seconds |
| Monthly cost | ~$100–600/month (WhatsApp conversations) + < $10 (SES) |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
