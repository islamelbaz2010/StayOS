# P0 / P1 / P2 ENGINEERING DEPENDENCIES — 2026-08-26

**Workstream:** Legal + Commercial execution pass.  
**Scope:** Engineering work identified but not implemented in this pass. Items are classified by dependency on the first real-money transaction and alpha scale-up.

---

## P0 — Blocks First Real-Money Transaction

| # | Item | Blocker | Evidence | Action |
|---|------|---------|----------|--------|
| P0-1 | Replace fake collection account in `src/app/payments/services.py` | Founder must provide real bank/Vodafone Cash account | Lines 31–49 contain placeholder account | Engineering updates `_MANUAL_INSTRUCTIONS_AR` / `_MANUAL_INSTRUCTIONS_EN` with real details (no secrets committed) |
| P0-2 | Wire `refund_days=5` into `booking.cancelled` notification | Value decided; code not yet passing it | `src/app/reservations/services.py` `write_booking_event` does not include `refund_days` in `extra` | Engineering adds `"refund_days": 5` to the `booking.cancelled` outbox payload |
| P0-3 | Separate payment-proof S3 bucket from public listing-photo bucket | Payment proof can contain bank details; currently uses `S3_LISTINGS_BUCKET` (public-read) | `src/app/payments/services.py` `presign_proof_upload` uses `settings.S3_LISTINGS_BUCKET` | Engineering + Founder: create/configure private `S3_PAYMENT_PROOF_BUCKET` and update code |

---

## P1 — Needed Before Closed Alpha Scale-Up

| # | Item | Evidence | Action |
|---|------|----------|--------|
| P1-1 | Implement refund calculation from V1 cancellation tiers | No backend code computes refund percentages from tiers | Engineering builds refund-calculation function matching `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` |
| P1-2 | Add 24-hour payment-deadline expiry timer | No automatic timer exists | Engineering adds scheduled job or booking-status expiry check |
| P1-3 | Add no-show and duplicate-payment handling in active flow | `bookings`/`payments` services do not cover these | Engineering adds status transitions and admin hooks |
| P1-4 | Decide keep/kill/wire dormant `finance`/`reservations` Stripe path | Both `bookings` and `reservations` routers mounted; `STRIPE_SECRET_KEY` empty | Founder + Engineering: formal decision; if kept, wire; if killed, remove or disable |
| P1-5 | Add account-deletion and data-export endpoints | Privacy Policy § 10 notes no self-service deletion | Engineering adds `DELETE /me` and data-export endpoint |
| P1-6 | Implement data-retention enforcement | Privacy Policy § 6 notes no retention period defined | Engineering adds retention policies per Founder's decision |
| P1-7 | Add breach-notification procedure | PDPL requires 72-hour PDPC / 3-business-day individual notice | Engineering + Legal: document and implement breach response |
| P1-8 | Configure OTP provider in production | `POST /auth/otp/send` returns provider-not-configured | Founder provides Twilio/Akedly credentials; Engineering configures |
| P1-9 | Configure S3/AWS credentials for production | S3 photo-presign returns 500 in production | Founder provides AWS credentials; Engineering configures |

---

## P2 — Later / Post-Alpha

| # | Item | Rationale |
|---|------|-----------|
| P2-1 | Paymob/Stripe automated marketplace integration | Wait for Paymob response and legal clearance |
| P2-2 | Automated KYC OCR/biometric licensing | Manual KYC sufficient for alpha |
| P2-3 | Ownership-verification feature | Host Agreement representation + founder manual check sufficient for 1–10 listings |
| P2-4 | Full dispute-resolution / arbitration workflow | P2 legal |
| P2-5 | Cookie Policy | No cookie/tracking mechanism currently |
| P2-6 | Reviews system | Deferred to V1.1 |
| P2-7 | AI pricing / demand forecasting | Phase 3+ per DEC-008 |

---

**End of Engineering Dependencies.**
