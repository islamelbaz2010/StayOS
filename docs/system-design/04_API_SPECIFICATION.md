# 04 — API Specification

**Cross-references**: [03_MICROSERVICES.md](03_MICROSERVICES.md) · [08_RBAC.md](08_RBAC.md) · [ADR-014](../architecture/adr/ADR-014-api-style.md) · [ADR-006](../architecture/adr/ADR-006-authentication-strategy.md) · [PRODUCT_CANON.md](../../PRODUCT_CANON.md)

---

## 1. API Style

**REST + OpenAPI 3.0** (ADR-014). FastAPI auto-generates the OpenAPI spec from Python type annotations. No GraphQL, no RPC.

OpenAPI spec served at: `GET /api/v1/openapi.json`  
Interactive docs (dev only): `GET /api/v1/docs` (Swagger UI), `GET /api/v1/redoc`

---

## 2. Versioning

- URL path versioning: `/api/v1/...`
- Breaking changes → increment version: `/api/v2/...`
- Deprecated versions are supported for **6 months** after a new version ships, then removed.
- `X-API-Deprecation-Date` header on deprecated endpoints.

---

## 3. Authentication

All protected endpoints require:
```
Authorization: Bearer <firebase_id_token>
```

Firebase ID tokens are verified by FastAPI middleware using `firebase_admin.auth.verify_id_token()`. Token expiry: 1 hour. Refresh via Firebase client SDK (no server-side refresh endpoint needed).

**Public endpoints** (no auth required):
- `GET /api/v1/listings` (search)
- `GET /api/v1/listings/{unit_id}` (listing detail)
- `POST /api/v1/auth/otp/send`
- `POST /api/v1/auth/otp/verify`

**Auth header on all other endpoints**: required. Missing or invalid token → `401 Unauthorized`.

---

## 4. Pagination

All list endpoints use **cursor-based pagination** (not offset/limit — avoids page drift on inserts).

**Request**:
```
GET /api/v1/listings?cursor=<opaque_cursor>&limit=20
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6IjEyMyIsImNyZWF0ZWRfYXQiOiIyMDI2LTA3LTEzIn0=",
    "has_more": true,
    "total_count": 847
  }
}
```

- Default `limit`: 20. Maximum `limit`: 100.
- `next_cursor` is a base64-encoded JSON of the last item's sort key.
- `total_count` is approximate for search endpoints (PostGIS count is expensive).

---

## 5. Filtering

Search filters are passed as query parameters. Multiple values for the same filter are comma-separated.

| Parameter | Type | Endpoint | Example |
|-----------|------|---------|---------|
| `sw_lat,sw_lng,ne_lat,ne_lng` | float | `GET /listings` | Viewport bounding box |
| `check_in,check_out` | ISO 8601 date | `GET /listings` | `2026-08-01,2026-08-07` |
| `min_price,max_price` | int (EGP) | `GET /listings` | `500,3000` |
| `property_type` | enum | `GET /listings` | `APARTMENT,VILLA` |
| `cultural_tags` | enum[] | `GET /listings` | `FAMILY_ONLY,HALAL_CERTIFIED` |
| `amenities` | string[] | `GET /listings` | `POOL,WIFI,PARKING` |
| `guests` | int | `GET /listings` | `4` |
| `status` | enum | `GET /reservations` | `CONFIRMED,PENDING_PAYMENT` |
| `role` | enum | `GET /admin/users` | `HOST,GUEST` |

---

## 6. Error Format

All errors follow RFC 7807 Problem Details:

```json
{
  "type": "https://stayos.com/errors/calendar-conflict",
  "title": "Calendar Conflict",
  "status": 409,
  "detail": "The unit is not available for the requested dates.",
  "instance": "/api/v1/reservations",
  "trace_id": "01J3KF2XQR8VMSD4WX7Y9Z1HBN"
}
```

**Standard error codes**:

| HTTP Status | Type Slug | Meaning |
|------------|-----------|---------|
| 400 | `validation-error` | Request body failed Pydantic validation |
| 401 | `unauthorized` | Missing or invalid Firebase token |
| 403 | `forbidden` | Authenticated but insufficient role/permission |
| 404 | `not-found` | Resource does not exist |
| 409 | `calendar-conflict` | Date range already booked |
| 409 | `kyc-required` | Action requires verified KYC |
| 422 | `unprocessable-entity` | Semantically invalid input |
| 429 | `rate-limited` | Too many requests |
| 500 | `internal-error` | Unexpected server error (with trace_id for support) |
| 503 | `payment-gateway-error` | Paymob/Stripe unreachable |

---

## 7. Endpoint Catalogue

### 7.1 Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/otp/send` | Public | Send OTP to phone (Twilio) |
| `POST` | `/auth/otp/verify` | Public | Verify OTP, return Firebase custom token |
| `GET` | `/auth/me` | Bearer | Current user profile |
| `PATCH` | `/auth/me` | Bearer | Update profile (name, email, language preference) |
| `POST` | `/auth/kyc/upload-url` | Bearer (HOST/GUEST) | Get pre-signed S3 URL for document upload |
| `GET` | `/auth/kyc/status` | Bearer | KYC verification status |
| `DELETE` | `/auth/sessions` | Bearer | Logout (revoke current session) |

### 7.2 Listings (PMS + Search) — `/api/v1/listings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/listings` | Public | Search listings (PostGIS spatial + text filter) |
| `GET` | `/listings/{unit_id}` | Public | Listing detail page |
| `GET` | `/listings/{unit_id}/availability` | Public | Calendar availability for date range |
| `POST` | `/listings` | Bearer (HOST) | Create new unit listing |
| `PATCH` | `/listings/{unit_id}` | Bearer (HOST, owner) | Update listing details |
| `POST` | `/listings/{unit_id}/photos/upload-url` | Bearer (HOST, owner) | Pre-signed S3 URL for photo upload |
| `DELETE` | `/listings/{unit_id}/photos/{photo_id}` | Bearer (HOST, owner) | Delete a listing photo |
| `PUT` | `/listings/{unit_id}/calendar` | Bearer (HOST, owner) | Block or unblock calendar dates |
| `PUT` | `/listings/{unit_id}/pricing` | Bearer (HOST, owner) | Update pricing tiers |
| `PATCH` | `/listings/{unit_id}/status` | Bearer (OPS_MANAGER, ADMIN) | Change unit status (suspend, archive) |

### 7.3 Reservations — `/api/v1/reservations`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/reservations` | Bearer (GUEST) | Initiate booking (acquires calendar lock) |
| `GET` | `/reservations/{reservation_id}` | Bearer (GUEST owner or HOST) | Reservation detail |
| `GET` | `/reservations` | Bearer | List user's reservations (guest or host view) |
| `POST` | `/reservations/{reservation_id}/confirm` | Internal (webhook) | Payment confirmed webhook from Paymob/Stripe |
| `POST` | `/reservations/{reservation_id}/cancel` | Bearer (GUEST or HOST or ADMIN) | Cancel reservation |
| `POST` | `/reservations/{reservation_id}/check-in` | Bearer (HOST or FIELD_STAFF) | Record check-in |
| `POST` | `/reservations/{reservation_id}/check-out` | Bearer (HOST or FIELD_STAFF) | Record check-out |
| `POST` | `/reservations/{reservation_id}/promo` | Bearer (GUEST) | Apply promo code |

### 7.4 Operations (OpsManager) — `/api/v1/ops`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/ops/tickets` | Bearer (FIELD_STAFF, OPS_MANAGER) | List tickets (filtered by status, assignment) |
| `GET` | `/ops/tickets/{ticket_id}` | Bearer (FIELD_STAFF, OPS_MANAGER) | Ticket detail with checklist |
| `POST` | `/ops/tickets/{ticket_id}/accept` | Bearer (FIELD_STAFF) | Accept ticket assignment |
| `PATCH` | `/ops/tickets/{ticket_id}/tasks/{task_id}` | Bearer (FIELD_STAFF) | Mark task complete |
| `POST` | `/ops/tickets/{ticket_id}/photos` | Bearer (FIELD_STAFF) | Attach verification photo |
| `POST` | `/ops/tickets/{ticket_id}/close` | Bearer (FIELD_STAFF) | Close ticket (triggers unit status update) |
| `POST` | `/ops/tickets/{ticket_id}/escalate` | Bearer (OPS_MANAGER) | Escalate ticket |
| `POST` | `/ops/sync` | Bearer (FIELD_STAFF) | Batch upload offline SQLite changes |

### 7.5 Finance — `/api/v1/finance`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/finance/host/balance` | Bearer (HOST) | Current host balance and pending escrow |
| `GET` | `/finance/host/payouts` | Bearer (HOST) | Payout history |
| `GET` | `/finance/host/ledger` | Bearer (HOST) | Ledger entries for host account |
| `GET` | `/finance/admin/revenue` | Bearer (ADMIN) | Platform revenue report |
| `POST` | `/finance/admin/payout-run` | Bearer (ADMIN) | Trigger manual payout batch |
| `POST` | `/finance/webhooks/paymob` | Internal (HMAC) | Paymob payment webhook |
| `POST` | `/finance/webhooks/stripe` | Internal (Stripe-Signature) | Stripe payment webhook |

### 7.6 Admin / Incident Console — `/api/v1/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/users` | Bearer (ADMIN) | User list with filters |
| `PATCH` | `/admin/users/{user_id}` | Bearer (ADMIN) | Update user status (ban, suspend) |
| `GET` | `/admin/disputes` | Bearer (ADMIN, OPS_MANAGER) | Open disputes |
| `POST` | `/admin/disputes/{dispute_id}/resolve` | Bearer (ADMIN) | Resolve dispute with outcome |
| `POST` | `/admin/kill-switch/listing/{unit_id}` | Bearer (ADMIN) | Emergency delist a unit |

### 7.7 SSE (Server-Sent Events) — `/api/v1/stream`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/stream/calendar/{unit_id}` | Bearer (HOST) | Real-time calendar availability events |
| `GET` | `/stream/tickets` | Bearer (FIELD_STAFF) | Real-time ticket assignment push |
| `GET` | `/stream/booking/{reservation_id}` | Bearer (GUEST) | Booking status events (confirmation, etc.) |

---

## 8. OpenAPI Structure

```yaml
openapi: "3.0.3"
info:
  title: StayOS API
  version: "1.0.0"
  description: "AI-powered accommodation marketplace for MENA"
  contact:
    email: api@stayos.com

servers:
  - url: https://api.stayos.com/api/v1
    description: Production
  - url: https://api-staging.stayos.com/api/v1
    description: Staging

components:
  securitySchemes:
    FirebaseJWT:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Firebase ID token

  schemas:
    Error:
      type: object
      required: [type, title, status, detail, trace_id]
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        trace_id: { type: string }

    Pagination:
      type: object
      properties:
        next_cursor: { type: string, nullable: true }
        has_more: { type: boolean }
        total_count: { type: integer }

security:
  - FirebaseJWT: []
```

Full OpenAPI JSON is generated at runtime from FastAPI annotations. Do not maintain a separate hand-written spec.

---

## 9. Rate Limiting

Applied via Redis sliding window counter. Limits per authenticated user (by `user_id`) or per IP (for public endpoints).

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| `POST /auth/otp/send` | 3 requests | 15 minutes per phone |
| `POST /reservations` (checkout) | 10 requests | 1 minute |
| Search `GET /listings` | 100 requests | 1 minute |
| All other authenticated | 200 requests | 1 minute |
| All other public | 30 requests | 1 minute |

Rate limit response: `429 Too Many Requests` with `Retry-After` header.

---

## 10. Webhook Security

All inbound webhooks (Paymob, Stripe) are verified before processing:

- **Paymob**: HMAC-SHA512 signature on payload; secret stored in AWS Secrets Manager
- **Stripe**: `Stripe-Signature` header verification using `stripe.WebhookSignature.verify_header()`
- Webhooks are idempotent: duplicate delivery with same `event_id` is a no-op
- Unverified payloads → `400 Bad Request` (logged, not silently dropped)
