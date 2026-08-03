# SPRINT 3 IMPLEMENTATION CONTRACT — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Purpose:** Define the binding contract between backend and frontend teams. Each endpoint specifies exact request/response shapes, status codes, and error conditions. Both teams implement against this contract.

---

## 1. Conventions

- **Base URL:** `/api/v1`
- **Auth:** `Authorization: Bearer <JWT>` header
- **Content-Type:** `application/json` (except CSV import: `multipart/form-data`)
- **Error format:** `{"detail": "message", "error_code": "CODE"}` 
- **Pagination:** Cursor-based for lists, `?limit=20&offset=0` for queues
- **Date format:** ISO 8601 (`2026-08-04T12:00:00Z`)
- **IDs:** UUID v4 strings

---

## 2. Listing Photo Endpoints

### POST `/listings/{unit_id}/photos/presign`

**Auth:** host (must own unit) or admin

**Request:**
```json
{
  "filename": "villa-front.jpg",
  "content_type": "image/jpeg"
}
```

**Response 200:**
```json
{
  "upload_url": "https://stayos-listings.s3.eu-west-1.amazonaws.com/listings/{unit_id}/{uuid}.jpg?X-Amz-...",
  "photo_key": "listings/{unit_id}/{uuid}.jpg",
  "expires_in": 300
}
```

**Errors:**
- 401 — Not authenticated
- 403 — Not authorized to manage this unit
- 404 — Unit not found

---

### POST `/listings/{unit_id}/photos`

**Auth:** host (must own unit) or admin

**Request:**
```json
{
  "s3_key": "listings/{unit_id}/{uuid}.jpg",
  "caption": "Front view of the villa",
  "is_cover": true,
  "display_order": 0
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "unit_id": "uuid",
  "url": "https://stayos-listings.s3.eu-west-1.amazonaws.com/listings/{unit_id}/{uuid}.jpg",
  "caption": "Front view of the villa",
  "is_cover": true,
  "display_order": 0,
  "created_at": "2026-08-04T12:00:00Z"
}
```

**Errors:**
- 400 — Invalid S3 key (must start with `listings/{unit_id}/`)
- 403 — Not authorized
- 404 — Unit not found

---

### PATCH `/listings/{unit_id}/photos/{photo_id}`

**Auth:** host (must own unit) or admin

**Request:**
```json
{
  "caption": "Updated caption",
  "is_cover": true,
  "display_order": 1
}
```

**Response 200:** Same as POST response.

**Note:** Setting `is_cover: true` automatically sets all other photos' `is_cover` to `false`.

---

### DELETE `/listings/{unit_id}/photos/{photo_id}`

**Auth:** host (must own unit) or admin

**Response 204:** No content.

**Side effects:** Deletes S3 object, removes photo record. If deleted photo was cover, first remaining photo becomes cover.

---

## 3. Submit for Review

### POST `/listings/{unit_id}/submit-for-review`

**Auth:** host (must own unit)

**Request:** Empty body.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "PENDING_VERIFICATION",
  "title": "Villa in New Cairo",
  "updated_at": "2026-08-04T12:00:00Z"
}
```

**Errors:**
- 400 — Listing is not in DRAFT status
- 400 — Listing must have at least 1 photo
- 400 — Listing must have title, description, and base_price_egp
- 403 — Not authorized
- 404 — Listing not found

---

## 4. Admin KYC Queue

### GET `/admin/kyc?status=PENDING&limit=20&offset=0`

**Auth:** admin

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_name": "Ahmed Mohamed",
      "user_phone": "+201234567890",
      "document_type": "national_id",
      "status": "PENDING",
      "submitted_at": "2026-08-04T10:00:00Z",
      "front_side_url": "https://stayos-kyc.s3.../front.jpg",
      "back_side_url": "https://stayos-kyc.s3.../back.jpg",
      "selfie_url": "https://stayos-kyc.s3.../selfie.jpg"
    }
  ],
  "total_count": 15,
  "has_more": false
}
```

---

### POST `/admin/kyc/{document_id}/approve`

**Auth:** admin

**Request:** Empty body.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "VERIFIED",
  "user_id": "uuid",
  "updated_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Updates `auth.users.kyc_status` to `VERIFIED`. Emits `kyc.approved` event.

---

### POST `/admin/kyc/{document_id}/reject`

**Auth:** admin

**Request:**
```json
{
  "reason": "ID document is blurry. Please resubmit with a clear photo."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "user_id": "uuid",
  "reject_reason": "ID document is blurry. Please resubmit with a clear photo.",
  "updated_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Updates `auth.users.kyc_status` to `REJECTED`. Emits `kyc.rejected` event.

---

## 5. Admin Listing Verification

### GET `/admin/listings?status=PENDING_VERIFICATION&limit=20&offset=0`

**Auth:** admin

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Villa in New Cairo",
      "host_name": "Ahmed Mohamed",
      "host_phone": "+201234567890",
      "status": "PENDING_VERIFICATION",
      "governorate": "Cairo",
      "city": "New Cairo",
      "photo_count": 5,
      "submitted_at": "2026-08-04T10:00:00Z",
      "created_at": "2026-08-03T14:00:00Z"
    }
  ],
  "total_count": 8,
  "has_more": false
}
```

---

### POST `/admin/listings/{unit_id}/approve`

**Auth:** admin

**Request:** Empty body.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "LISTED",
  "title": "Villa in New Cairo",
  "updated_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Transitions `PENDING_VERIFICATION → LISTED`. Creates verification log. Emits `listing.approved` event.

---

### POST `/admin/listings/{unit_id}/reject`

**Auth:** admin

**Request:**
```json
{
  "reason": "Photos do not match the address. Please upload current photos."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "UNLISTED",
  "title": "Villa in New Cairo",
  "updated_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Transitions `PENDING_VERIFICATION → UNLISTED`. Creates verification log. Emits `listing.rejected` event.

---

## 6. CSV Import

### POST `/admin/listings/import`

**Auth:** admin

**Request:** `multipart/form-data` with field `file` containing CSV file.

**Response 200:**
```json
{
  "total_rows": 25,
  "success_count": 23,
  "failure_count": 2,
  "errors": [
    {
      "row_number": 5,
      "error": "Invalid property_type: 'CASTLE' is not a valid enum value",
      "data": {"title": "Castle Villa", "property_type": "CASTLE", ...}
    },
    {
      "row_number": 12,
      "error": "Missing required field: base_price_egp",
      "data": {"title": "Apartment", ...}
    }
  ]
}
```

**CSV columns (in order):**
```
title,description,property_type,governorate,city,district,address_line,latitude,longitude,max_guests,bedrooms,bathrooms,base_price_egp,weekend_multiplier,cleaning_fee_egp,min_nights,max_nights,amenities,cultural_tags,photo_urls
```

- `amenities` — pipe-separated (`wifi|pool|ac`)
- `cultural_tags` — pipe-separated (`FAMILY_ONLY|HALAL_CERTIFIED`)
- `photo_urls` — pipe-separated URLs (downloaded and stored in S3)
- `latitude`, `longitude` — decimal degrees

---

## 7. Unclaimed Listing

### POST `/admin/listings/unclaimed`

**Auth:** admin

**Request:**
```json
{
  "title": "Apartment in Zamalek",
  "description": "2BR apartment with Nile view",
  "property_type": "APARTMENT",
  "governorate": "Cairo",
  "city": "Cairo",
  "district": "Zamalek",
  "address_line": "26 July St, Building 10",
  "latitude": 30.0578,
  "longitude": 31.2206,
  "max_guests": 4,
  "bedrooms": 2,
  "bathrooms": 2,
  "base_price_egp": 800
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "status": "DRAFT",
  "claim_status": "UNCLAIMED",
  "claim_token": "secure-random-token",
  "title": "Apartment in Zamalek",
  "created_at": "2026-08-04T12:00:00Z"
}
```

---

### GET `/admin/listings/{unit_id}/claim-link`

**Auth:** admin

**Response 200:**
```json
{
  "claim_url": "https://stayos.com/ar/claim/secure-random-token",
  "claim_token": "secure-random-token",
  "expires_at": null
}
```

---

## 8. Claim Workflow

### GET `/listings/claim/{token}`

**Auth:** Public (no auth required to view)

**Response 200:**
```json
{
  "unit_id": "uuid",
  "title": "Apartment in Zamalek",
  "description": "2BR apartment with Nile view",
  "governorate": "Cairo",
  "city": "Cairo",
  "district": "Zamalek",
  "photo_urls": ["https://stayos-listings.s3.../photo1.jpg"],
  "claim_status": "UNCLAIMED"
}
```

**Errors:**
- 404 — Invalid or expired claim token
- 400 — Listing already claimed

---

### POST `/listings/{unit_id}/claim`

**Auth:** authenticated user (any role, must have KYC verified)

**Request:**
```json
{
  "claim_token": "secure-random-token",
  "documents": ["kyc/ownership/deed.pdf"],
  "notes": "I am the owner of this property. Attached is the title deed."
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "unit_id": "uuid",
  "claimant_id": "uuid",
  "status": "PENDING",
  "submitted_at": "2026-08-04T12:00:00Z"
}
```

**Errors:**
- 400 — KYC verification required
- 400 — Invalid claim token
- 400 — Listing is not unclaimed
- 409 — Claim already pending for this listing

---

### GET `/admin/claims?status=PENDING&limit=20&offset=0`

**Auth:** admin

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "unit_id": "uuid",
      "unit_title": "Apartment in Zamalek",
      "claimant_id": "uuid",
      "claimant_name": "Mohamed Ali",
      "claimant_phone": "+201234567890",
      "claimant_kyc_status": "VERIFIED",
      "status": "PENDING",
      "submitted_at": "2026-08-04T10:00:00Z",
      "documents": ["kyc/ownership/deed.pdf"]
    }
  ],
  "total_count": 3,
  "has_more": false
}
```

---

### POST `/admin/claims/{claim_id}/approve`

**Auth:** admin

**Request:** Empty body.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "unit_id": "uuid",
  "claimant_id": "uuid",
  "reviewed_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Transfers `unit.host_id` to claimant. Sets `unit.claim_status = 'CLAIMED'`. Emits `listing.claimed` event.

---

### POST `/admin/claims/{claim_id}/reject`

**Auth:** admin

**Request:**
```json
{
  "reason": "Ownership document does not match the property address."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "reject_reason": "Ownership document does not match the property address.",
  "reviewed_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Sets `unit.claim_status = 'UNCLAIMED'` (available for new claims). Notifies claimant.

---

## 9. Duplicate Detection

### POST `/admin/listings/duplicates/scan`

**Auth:** admin

**Request:** Empty body.

**Response 200:**
```json
{
  "new_flags": 5,
  "total_flags": 12
}
```

---

### GET `/admin/duplicates?status=FLAGGED&limit=20&offset=0`

**Auth:** admin

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "unit_id_1": "uuid",
      "unit_id_2": "uuid",
      "unit_1_title": "Villa in New Cairo",
      "unit_2_title": "Villa in 5th Settlement",
      "unit_1_location": "Cairo, New Cairo, 5th Settlement",
      "unit_2_location": "Cairo, New Cairo, 5th Settlement",
      "similarity_score": 0.85,
      "match_reasons": ["geo_proximity", "title_similarity"],
      "status": "FLAGGED"
    }
  ],
  "total_count": 12,
  "has_more": false
}
```

---

### POST `/admin/duplicates/{flag_id}/merge`

**Auth:** admin

**Request:**
```json
{
  "primary_unit_id": "uuid-of-unit-to-keep"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "MERGED",
  "resolution": "MERGE_INTO_1",
  "resolved_at": "2026-08-04T12:00:00Z"
}
```

**Side effects:** Transfers photos and bookings from non-primary to primary unit. Archives non-primary unit.

---

### POST `/admin/duplicates/{flag_id}/dismiss`

**Auth:** admin

**Request:** Empty body.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "DISMISSED",
  "resolved_at": "2026-08-04T12:00:00Z"
}
```

---

## 10. Support Tickets

### GET `/admin/tickets?status=OPEN&priority=HIGH&limit=20&offset=0`

**Auth:** admin

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "subject": "Cannot upload photos",
      "description": "I get an error when trying to upload photos to my listing.",
      "priority": "HIGH",
      "status": "OPEN",
      "reporter_id": "uuid",
      "assignee_id": null,
      "related_unit_id": "uuid",
      "related_reservation_id": null,
      "escalated_at": null,
      "resolved_at": null,
      "resolution_notes": null,
      "created_at": "2026-08-04T10:00:00Z",
      "updated_at": "2026-08-04T10:00:00Z"
    }
  ],
  "total_count": 5,
  "has_more": false
}
```

---

### POST `/admin/tickets`

**Auth:** admin or authenticated user

**Request:**
```json
{
  "subject": "Cannot upload photos",
  "description": "I get an error when trying to upload photos to my listing.",
  "priority": "HIGH",
  "related_unit_id": "uuid"
}
```

**Response 201:** Same shape as GET item.

---

### PATCH `/admin/tickets/{ticket_id}`

**Auth:** admin

**Request (partial update):**
```json
{
  "status": "IN_PROGRESS",
  "assignee_id": "uuid-of-admin-user"
}
```

Or for escalation:
```json
{
  "status": "ESCALATED",
  "priority": "URGENT"
}
```

Or for closure:
```json
{
  "status": "CLOSED",
  "resolution_notes": "Fixed by reconfiguring S3 CORS. User confirmed photos upload works."
}
```

**Response 200:** Same shape as GET item with updated fields.

---

## 11. Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_REQUIRED` | 401 | Authentication token missing or invalid |
| `FORBIDDEN` | 403 | User not authorized for this action |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource state conflict (e.g., already claimed) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 12. Implementation Notes

1. **All admin endpoints** use `Depends(auth_dependencies.require_role("admin"))` for authorization.
2. **All host endpoints** verify unit ownership: `unit.host_id == user.id`.
3. **Presigned URLs** expire in 300 seconds (5 minutes).
4. **CSV import** processes rows in a single transaction; failures are collected but don't roll back successful rows.
5. **Claim tokens** are 32-byte URL-safe random strings generated with `secrets.token_urlsafe(32)`.
6. **Duplicate scan** is O(n²) but acceptable for < 1000 listings. Use PostGIS `ST_DWithin` for geo filtering.
7. **Support tickets** can be created by any authenticated user but only managed by admins.
8. **Notification events** are emitted via `write_event()` in the outbox pattern, ensuring at-least-once delivery.
