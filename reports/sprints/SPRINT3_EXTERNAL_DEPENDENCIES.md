# SPRINT 3 EXTERNAL DEPENDENCIES — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Source:** `SPRINT3_FINAL_BACKLOG.md` §12.1, `MVP_SCOPE_FREEZE.md` §3

---

## 1. External Dependency Register

| # | Dependency | Owner | Status | Risk | Blocks | Mitigation |
|---|-----------|-------|--------|------|--------|------------|
| D1 | Paymob integration (API key, iframe IDs) | Founder | Unresolved | HIGH | S3-018 (P1) | Manual payment confirmation fallback for alpha |
| D2 | Stripe scope confirmation | Founder | Unresolved | MEDIUM | S3-018 (P1) | Paymob-only for alpha; Stripe deferred |
| D3 | WhatsApp Business API approval | Operations | Unresolved | HIGH | S3-008 (P0) | SMS via Twilio as fallback |
| D4 | AWS S3 buckets for listings + KYC | Engineering | Partial | HIGH | S3-004, S3-002 (P0) | Buckets must be created and CORS configured |
| D5 | Operations team hiring | Founder/COO | Not started | HIGH | Closed Alpha | Founder covers ops until hire |
| D6 | Twilio Verify Service SID | Engineering | Configured | LOW | S3-001 (P0) | Already in `config.py` |
| D7 | Firebase project + service account | Engineering | Configured | LOW | S3-001 (P0) | Already in `config.py` |
| D8 | PostgreSQL + PostGIS | Engineering | Configured | LOW | All | Already deployed |
| D9 | Redis instance | Engineering | Configured | LOW | Auth, caching | Already deployed |

---

## 2. P0-Blocking Dependencies

Only D3 and D4 block P0 stories. All others block P1 or are already resolved.

### D3 — WhatsApp Business API Approval

**Blocks:** S3-008 (Host WhatsApp notifications)

**Current state:**
- `src/app/notifications/providers.py` has `send_whatsapp()` function ready.
- `src/app/notifications/services.py` has `channels_for_event()` with WhatsApp channel mapping.
- WhatsApp Business API account is not approved.

**Mitigation:**
1. Use SMS via Twilio as fallback channel for all notification events.
2. Update `channels_for_event()` to include SMS for KYC and listing events.
3. When WhatsApp is approved, add it back to the channel mapping.
4. No code changes needed — the notification system is channel-agnostic.

**Action items:**
- [ ] Operations: Submit WhatsApp Business API application
- [ ] Engineering: Verify SMS fallback works for all event types
- [ ] Operations: Test SMS delivery to Egyptian phone numbers

### D4 — AWS S3 Buckets

**Blocks:** S3-004 (listing photo upload), S3-031 (presigned URLs for listings), S3-033 (bucket config)

**Current state:**
- `src/app/config.py` has `S3_LISTINGS_BUCKET` and `S3_KYC_BUCKET` environment variables.
- KYC presigned URLs work (using `S3_KYC_BUCKET`).
- `S3_LISTINGS_BUCKET` is configured but never used in code — bucket may not exist.
- No CORS configuration verified on either bucket.

**Required actions:**
- [ ] Engineering: Verify `stayos-listings-prod` (or equivalent) bucket exists in AWS
- [ ] Engineering: Verify `stayos-kyc-prod` bucket exists
- [ ] Engineering: Apply CORS policy to listings bucket:
  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": ["https://stayos.com", "https://*.stayos.com", "http://localhost:3000"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"]
    }
  ]
  ```
- [ ] Engineering: Verify IAM role has `s3:PutObject`, `s3:GetObject` on both buckets
- [ ] Engineering: Test presigned PUT URL from browser

---

## 3. P1-Blocking Dependencies

### D1 — Paymob Integration

**Blocks:** S3-018 (Payment checkout)

**Current state:**
- `src/app/finance/providers.py` has `create_paymob_payment()` function.
- `src/app/reservations/services.py` calls Paymob to create payment intents.
- `PAYMOB_API_KEY`, `PAYMOB_IFRAME_ID`, `PAYMOB_INTEGRATION_ID` in `config.py`.
- Actual Paymob account may not be activated.

**Mitigation:** Manual payment confirmation via admin endpoint (`POST /reservations/{id}/confirm`) exists as fallback.

### D2 — Stripe Scope Confirmation

**Blocks:** S3-018 (international payments)

**Current state:**
- `src/app/finance/providers.py` has `create_stripe_payment_intent()`.
- `STRIPE_SECRET_KEY` in `config.py`.
- Stripe account scope for Egypt not confirmed.

**Mitigation:** Paymob-only for alpha. Stripe deferred to V1.1.

---

## 4. Dependency Resolution Timeline

| Dependency | Required By | Target Resolution Date | Owner |
|-----------|-------------|----------------------|-------|
| D4 — S3 buckets | Day 3 (Phase A) | 2026-08-06 | Engineering |
| D3 — WhatsApp API | Day 7 (Phase B) | 2026-08-10 | Operations |
| D1 — Paymob | Day 20 (Phase F) | 2026-08-24 | Founder |
| D5 — Ops hire | Day 25 (Phase F) | 2026-08-29 | Founder/COO |

---

## 5. Risk Escalation

If any P0-blocking dependency is not resolved by the target date:

1. **D4 (S3 buckets) not resolved by Day 3:** Escalate to CTO. Listing photo upload is blocked. Consider alternative storage (local filesystem + CDN) as temporary measure.
2. **D3 (WhatsApp) not resolved by Day 7:** Fall back to SMS-only notifications. No further delay.
3. **D1 (Paymob) not resolved by Day 20:** Use manual payment confirmation for alpha. No further delay.
4. **D5 (Ops hire) not resolved by Day 25:** Founder covers operations. Closed Alpha may proceed with reduced capacity.
