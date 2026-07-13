# 09 — External Services

**Cross-references**: [01_SYSTEM_OVERVIEW.md](01_SYSTEM_OVERVIEW.md) · [ADR-003](../architecture/adr/ADR-003-payment-provider.md) · [ADR-006](../architecture/adr/ADR-006-authentication-strategy.md) · [ADR-009](../architecture/adr/ADR-009-storage-strategy.md) · [ADR-011](../architecture/adr/ADR-011-notification-architecture.md) · [10_SECURITY_MODEL.md](10_SECURITY_MODEL.md)

---

## 1. Overview

All external service credentials are stored in **AWS Secrets Manager** (ADR-007). No API keys in environment files, code, or Docker images. Services are accessed via an internal `ExternalServiceClient` abstraction — this enables mock injection in tests and circuit-breaker wrapping in production.

---

## 2. Payment

### 2.1 Paymob (Primary — Egyptian Payment Rails)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Egyptian payment processing: Fawry, Meeza, Vodafone Cash, InstaPay, bank transfer, card |
| **Phase** | Phase 1 (P0 requirement — DEC-004) |
| **API** | REST (Paymob Accept APIs) |
| **Auth** | API key (stored in Secrets Manager: `stayos/paymob/api_key`) |
| **Webhook** | HMAC-SHA512 on payload; secret in Secrets Manager: `stayos/paymob/hmac_secret` |
| **Docs** | Paymob Accept API v2 |

**Key operations**:
- `POST /api/auth/tokens` — authenticate and get session token
- `POST /api/ecommerce/orders` — create order (returns `order_id`)
- `POST /api/ecommerce/orders/payment_keys` — get payment token for iframe / Fawry ref
- `POST /api/acceptance/void_refund` — void or refund a transaction
- `POST /api/acceptance/bulk_disbursement` — batch payout to host bank accounts

**Failure mode**: Paymob is unavailable → booking fails at payment step → `503 payment-gateway-error` returned to user → Celery retry does not apply (user must retry checkout)

**Fallback**: None — Paymob is P0. If prolonged outage, ADMIN can post a WhatsApp notice and enable "manual bank transfer" mode (Phase 0 fallback).

---

### 2.2 Stripe (Secondary — International Cards)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Card payments for GCC travelers (Visa/Mastercard) who prefer Stripe over Paymob |
| **Phase** | Phase 1 |
| **API** | Stripe Python SDK |
| **Auth** | Secret key (Secrets Manager: `stayos/stripe/secret_key`) |
| **Webhook** | `stripe.WebhookSignature.verify_header()` with endpoint secret |

**Key operations**:
- `stripe.PaymentIntent.create()` — create payment intent
- `stripe.PaymentIntent.confirm()` — confirm payment
- `stripe.Refund.create()` — issue refund

**Payment routing rule** (ADR-003): If `payment_method IN (FAWRY, MEEZA, VODAFONE_CASH, INSTAPAY)` → route to Paymob. If `payment_method = CARD` and guest.country IN (SA, UAE, QA, KW) → route to Stripe. If `payment_method = CARD` and guest.country = EG → route to Paymob (Paymob card).

---

## 3. Maps

### 3.1 Google Maps API

| Attribute | Value |
|-----------|-------|
| **Purpose** | Map rendering, Arabic geocoding, unit pin clustering |
| **Phase** | Phase 1 |
| **SDK** | `@vis.gl/react-google-maps` (Next.js) |
| **Auth** | API key (Secrets Manager: `stayos/google_maps/api_key`) |
| **Cost estimate** | ~$70/month at Phase 1 (10K map loads/month × $7/1K) |

**Key features used**:
- Maps JavaScript API with `language=ar&region=EG` for Arabic geocoding
- Marker Clustering (`@googlemaps/markerclusterer`) for dense pin areas
- Geocoding API for converting addresses to coordinates during unit creation
- Places API (Autocomplete) for host address input

**Restriction**: API key restricted to `https://stayos.com` and `https://app.stayos.com` referrers. Separate key for server-side geocoding (restricted to server IP).

---

## 4. SMS

### 4.1 Twilio Verify

| Attribute | Value |
|-----------|-------|
| **Purpose** | OTP delivery for phone verification (FC-01) |
| **Phase** | Phase 1 |
| **API** | Twilio Verify API v2 |
| **Auth** | Account SID + Auth Token (Secrets Manager: `stayos/twilio/account_sid`, `stayos/twilio/auth_token`) |
| **Cost** | ~$0.05/OTP. At Phase 1 (1K signups/month): ~$50/month |

**Key operations**:
- `POST /v2/Services/{service_sid}/Verifications` — send OTP
- `POST /v2/Services/{service_sid}/VerificationCheck` — verify OTP

**Rate limiting applied before calling Twilio**: 3 OTP requests per phone per 15 minutes (Redis counter) to prevent SMS flooding and cost abuse.

**Twilio Service SID**: separate service per environment (dev / staging / prod). OTP TTL: 5 minutes (Twilio + Redis both enforce).

---

## 5. WhatsApp

### 5.1 WhatsApp Business API (Meta Cloud API)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Primary guest/host communication channel (DEC-009) |
| **Phase** | Phase 1 |
| **API** | Meta WhatsApp Business Cloud API v18+ |
| **Auth** | System user access token (Secrets Manager: `stayos/meta/whatsapp_token`) |
| **Cost** | ~$0.005–$0.025/conversation (varies by type and country) |

**Template messages required for**:
- `BOOKING_CONFIRMATION_GUEST` — booking confirmed (ar + en variants)
- `BOOKING_CONFIRMATION_HOST` — new booking notification (ar)
- `CHECKIN_REMINDER` — 24h before check-in (ar)
- `CHECKOUT_CONFIRMATION` — checkout receipt (ar)
- `TICKET_ASSIGNMENT` — field staff assignment (ar)
- `KYC_VERIFIED` — host KYC approved (ar)
- `PAYOUT_DISPATCHED` — host payout sent (ar)
- `REFUND_PROCESSED` — guest refund confirmation (ar)

**Template pre-approval**: All templates submitted to Meta Business Manager before Phase 1 launch (24–72h review window — do not wait until launch week).

**Business Phone Number**: One registered number per environment. `+20-XXX-XXXXXXX` for Egypt sender ID.

**Message routing**: All WhatsApp sends go through Celery workers (async). Direct API call from request handlers is forbidden.

---

## 6. Email

### 6.1 AWS SES (Simple Email Service)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Transactional email (booking receipts, KYC decisions, dispute notifications) |
| **Phase** | Phase 1 |
| **SDK** | `boto3` SES client |
| **Region** | `me-central-1` (same region as primary infra) |
| **From address** | `noreply@stayos.com` (domain verified in SES) |
| **Cost** | $0.10/1K emails. Negligible at Phase 1. |

**Domain verification**: SPF, DKIM, and DMARC records set on `stayos.com` domain before Phase 1 launch.

**Templates stored in**: AWS SES Template API (Arabic + English variants per event type).

**Email is secondary to WhatsApp**. WhatsApp is attempted first. Email is sent if:
- User has no WhatsApp-registered phone
- Message type is a formal receipt (PDF attachment needed)
- User has opted out of WhatsApp notifications

---

## 7. Storage

### 7.1 AWS S3

| Bucket | Purpose | Access | Encryption |
|--------|---------|--------|-----------|
| `stayos-listings-{env}` | Property photos | Public read via CloudFront | SSE-S3 |
| `stayos-kyc-{env}` | KYC identity documents | Private (pre-signed URL only) | SSE-KMS (CMK) |
| `stayos-ops-{env}` | Field staff turnover photos | Private (authenticated) | SSE-S3 |

Full bucket configuration: [ADR-009](../architecture/adr/ADR-009-storage-strategy.md).

**CloudFront distribution** in front of `stayos-listings-{env}` for global CDN delivery. Origin Access Control — bucket not directly public.

**Image pipeline**: Lambda function triggered on S3 upload to `stayos-listings-{env}`. Resizes to three variants: `thumb_300px`, `preview_800px`, `full_1920px`. Original deleted after processing.

---

## 8. AI (Phase 3+ — Not Phase 1)

Per DEC-008, no AI/ML services are used in Phase 1. The following are planned for Phase 3:

| Service | Purpose | Phase |
|---------|---------|-------|
| **Claude API (Anthropic)** | Pricing recommendation assistant, dispute analysis | Phase 3 |
| **AWS Bedrock** | Fallback LLM access; data residency in MENA | Phase 3 |
| **OpenAI Embeddings** | Property description semantic search | Phase 3 |
| **AWS SageMaker** | Custom demand forecasting model | Phase 4 |

When Phase 3 begins, an ADR will formalize the AI provider selection. Current model IDs (as of 2026): `claude-sonnet-4-6`, `claude-opus-4-8` for reasoning tasks.

**Data required before any AI feature**: 50K+ transactions (Phase 2 milestone). Do not build AI features without this dataset.

---

## 9. Analytics

### 9.1 Phase 1 — Basic Analytics

| Tool | Purpose | Phase |
|------|---------|-------|
| **AWS CloudWatch** | Infrastructure metrics, Lambda duration, API latency | Phase 1 |
| **AWS CloudWatch Logs** | Structured JSON logs from all FastAPI services | Phase 1 |
| **Sentry** | Frontend (Next.js) and backend (FastAPI) error tracking | Phase 1 |
| **Posthog** (self-hosted or cloud) | Product analytics: funnel analysis, search-to-booking conversion | Phase 1 |

### 9.2 Phase 2+ — Growth Analytics

| Tool | Purpose |
|------|---------|
| **Metabase** | Business intelligence dashboards for host performance, occupancy, revenue |
| **Segment** (or direct PostHog) | Event stream for user behavior analysis |

**PII in analytics**: No user PII (name, phone, email) in analytics events. Use anonymized `user_id` (UUID). Booking amounts are tracked; guest identity is not.

---

## 10. Authentication

### 10.1 Firebase Authentication

| Attribute | Value |
|-----------|-------|
| **Purpose** | Social OAuth (Google, Apple SSO), custom token issuance from OTP flow |
| **Phase** | Phase 1 |
| **SDK** | `firebase-admin` Python SDK (backend), Firebase JS SDK v9 (frontend) |
| **Auth** | Service account JSON (Secrets Manager: `stayos/firebase/service_account`) |

See [ADR-006](../architecture/adr/ADR-006-authentication-strategy.md) for full decision rationale.

---

## 11. KYC / Identity Verification

### 11.1 AWS Textract

| Attribute | Value |
|-----------|-------|
| **Purpose** | OCR extraction from national ID / passport scans |
| **Phase** | Phase 1 |
| **API** | `boto3` Textract client, `analyze_document` API |
| **Cost** | $0.0015/page for form analysis. Negligible at Phase 1 volume. |

### 11.2 AWS Rekognition

| Attribute | Value |
|-----------|-------|
| **Purpose** | Face similarity comparison (document photo vs selfie) |
| **Phase** | Phase 1 |
| **API** | `boto3` Rekognition client, `compare_faces` API |
| **Threshold** | Similarity ≥ 90% required for auto-approval. 80–89%: manual review. < 80%: auto-reject. |
| **Cost** | $0.001/image comparison. Negligible at Phase 1. |
