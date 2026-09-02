# SPRINT 3 BACKEND PLAN — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Purpose:** Define all backend endpoints, services, schemas, and modules required for Sprint 3 P0 stories.

---

## 1. Current Backend Architecture

- **Framework:** FastAPI with async SQLAlchemy
- **Database:** PostgreSQL with PostGIS, multi-schema (auth, pms, reservation, finance, operations, notify, security, analytics, booking)
- **Auth:** JWT (RS256) with refresh token rotation, Firebase Admin, Twilio Verify for OTP
- **Pattern:** Router → Service → Repository → Model
- **Error handling:** Custom `StayOSError` hierarchy with `to_http_exception()` mapping
- **Event-driven:** Outbox pattern via `shared/outbox.py` for notifications

---

## 2. New Endpoints Required

### 2.1 Listing Photo Endpoints (S3-004, S3-031)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/listings/{unit_id}/photos/presign` | host/admin | Generate presigned S3 PUT URL for photo upload |
| `POST` | `/listings/{unit_id}/photos` | host/admin | Create photo record after upload to S3 |
| `PATCH` | `/listings/{unit_id}/photos/{photo_id}` | host/admin | Update photo (caption, is_cover, display_order) |
| `DELETE` | `/listings/{unit_id}/photos/{photo_id}` | host/admin | Delete photo record and S3 object |

**Request/Response schemas:**

```python
class PhotoPresignRequest(BaseModel):
    filename: str
    content_type: str  # "image/jpeg", "image/png", "image/webp"

class PhotoPresignResponse(BaseModel):
    upload_url: str
    photo_key: str  # S3 key: "listings/{unit_id}/{uuid}.{ext}"
    expires_in: int  # seconds

class PhotoCreateRequest(BaseModel):
    s3_key: str
    caption: str | None = None
    is_cover: bool = False
    display_order: int = 0

class PhotoResponse(BaseModel):
    id: str
    unit_id: str
    url: str  # public URL or CloudFront URL
    caption: str | None
    is_cover: bool
    display_order: int
    created_at: datetime
```

**Service functions (in `src/app/listings/services.py`):**

```python
async def generate_photo_presigned_url(
    session: AsyncSession, user: User, unit_id: str, request: PhotoPresignRequest
) -> PhotoPresignResponse:
    """Generate presigned S3 PUT URL for listing photo upload."""

async def create_photo(
    session: AsyncSession, user: User, unit_id: str, request: PhotoCreateRequest
) -> PhotoResponse:
    """Create photo record after upload to S3."""

async def update_photo(
    session: AsyncSession, user: User, unit_id: str, photo_id: str, ...
) -> PhotoResponse:
    """Update photo metadata (caption, cover, order)."""

async def delete_photo(
    session: AsyncSession, user: User, unit_id: str, photo_id: str
) -> None:
    """Delete photo record and S3 object."""
```

**Authorization:** Host must own the unit (`unit.host_id == user.id`) or be admin.

---

### 2.2 Submit for Review Endpoint (S3-007)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/listings/{unit_id}/submit-for-review` | host | Transition listing from DRAFT to PENDING_VERIFICATION |

**Service function:**

```python
async def submit_listing_for_review(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    """Transition listing from DRAFT to PENDING_VERIFICATION.
    
    Validation:
    - Listing must be in DRAFT status
    - Must have title, description, base_price_egp
    - Must have at least 1 photo
    - Host must own the unit
    
    Side effects:
    - Emit 'listing.submitted' event for notifications
    """
```

---

### 2.3 Notification Triggers (S3-008)

**Events to emit:**

| Event Type | Source | Trigger |
|-----------|--------|---------|
| `kyc.submitted` | `kyc/services.py:submit_document()` | When host submits KYC documents |
| `kyc.approved` | `kyc/services.py:process_kyc_document()` or admin endpoint | When KYC is approved |
| `kyc.rejected` | `kyc/services.py:process_kyc_document()` or admin endpoint | When KYC is rejected |
| `listing.submitted` | `listings/services.py:submit_listing_for_review()` | When host submits listing for review |
| `listing.approved` | admin listing approval endpoint | When admin approves listing |
| `listing.rejected` | admin listing rejection endpoint | When admin rejects listing |

**Channel mapping updates (in `notifications/services.py:channels_for_event()`):**

```python
"kyc.submitted": [NotificationChannel.SMS],  # notify host
"kyc.approved": [NotificationChannel.WHATSAPP, NotificationChannel.SMS],
"kyc.rejected": [NotificationChannel.WHATSAPP, NotificationChannel.SMS],
"listing.submitted": [NotificationChannel.SMS],
"listing.approved": [NotificationChannel.WHATSAPP, NotificationChannel.SMS],
"listing.rejected": [NotificationChannel.WHATSAPP, NotificationChannel.SMS],
```

**Templates needed (in `notifications/templates.py`):**
- `kyc.submitted` — "Your KYC documents have been received and are under review."
- `kyc.approved` — "Congratulations! Your identity has been verified."
- `kyc.rejected` — "Your KYC submission was rejected: {reason}. Please resubmit."
- `listing.submitted` — "Your listing '{title}' has been submitted for review."
- `listing.approved` — "Your listing '{title}' is now live!"
- `listing.rejected` — "Your listing '{title}' was rejected: {reason}."

---

### 2.4 Admin KYC Queue Endpoints (S3-009)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/kyc` | admin | List pending KYC submissions with pagination |
| `POST` | `/admin/kyc/{document_id}/approve` | admin | Manually approve KYC |
| `POST` | `/admin/kyc/{document_id}/reject` | admin | Manually reject KYC with reason |

**Schemas:**

```python
class KycQueueItem(BaseModel):
    id: str
    user_id: str
    user_name: str | None
    user_phone: str | None
    document_type: str
    status: str
    submitted_at: datetime | None
    front_side_url: str | None
    back_side_url: str | None
    selfie_url: str | None

class KycQueueResponse(BaseModel):
    data: list[KycQueueItem]
    total_count: int
    has_more: bool

class KycRejectRequest(BaseModel):
    reason: str
```

**Service functions (in `src/app/kyc/services.py`):**

```python
async def list_pending_kyc(
    session: AsyncSession, status: str | None, limit: int, offset: int
) -> KycQueueResponse:
    """List KYC submissions for admin review queue."""

async def admin_approve_kyc(
    session: AsyncSession, document_id: str, admin_user: User
) -> KycDocument:
    """Manually approve KYC. Updates user.kyc_status to VERIFIED.
    Emits 'kyc.approved' event."""

async def admin_reject_kyc(
    session: AsyncSession, document_id: str, reason: str, admin_user: User
) -> KycDocument:
    """Manually reject KYC. Updates user.kyc_status to REJECTED.
    Emits 'kyc.rejected' event."""
```

---

### 2.5 Admin Listing Verification Endpoints (S3-010)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/listings` | admin | List all listings with status filter |
| `POST` | `/admin/listings/{unit_id}/approve` | admin | Approve listing (PENDING_VERIFICATION → LISTED) |
| `POST` | `/admin/listings/{unit_id}/reject` | admin | Reject listing with reason (PENDING_VERIFICATION → UNLISTED) |

**Schemas:**

```python
class AdminListingQueueItem(BaseModel):
    id: str
    title: str
    host_name: str | None
    host_phone: str | None
    status: str
    governorate: str
    city: str
    photo_count: int
    submitted_at: datetime | None
    created_at: datetime

class AdminListingQueueResponse(BaseModel):
    data: list[AdminListingQueueItem]
    total_count: int
    has_more: bool

class ListingRejectRequest(BaseModel):
    reason: str
```

**Service functions (in `src/app/listings/services.py`):**

```python
async def list_pending_listings(
    session: AsyncSession, status: str | None, limit: int, offset: int
) -> AdminListingQueueResponse:
    """List listings for admin verification queue."""

async def admin_approve_listing(
    session: AsyncSession, unit_id: str, admin_user: User
) -> ListingResponse:
    """Approve listing: PENDING_VERIFICATION → LISTED.
    Creates verification log. Emits 'listing.approved' event."""

async def admin_reject_listing(
    session: AsyncSession, unit_id: str, reason: str, admin_user: User
) -> ListingResponse:
    """Reject listing: PENDING_VERIFICATION → UNLISTED.
    Creates verification log. Emits 'listing.rejected' event."""
```

---

### 2.6 CSV Import Endpoint (S3-011)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/listings/import` | admin | Upload CSV file and create listings in bulk |

**CSV schema:**

```csv
title,description,property_type,governorate,city,district,address_line,latitude,longitude,max_guests,bedrooms,bathrooms,base_price_egp,weekend_multiplier,cleaning_fee_egp,min_nights,max_nights,amenities,cultural_tags,photo_urls
"Villa in New Cairo","Spacious 3BR villa with garden","VILLA","Cairo","New Cairo","5th Settlement","Street 123, Compound X",30.0286,31.4718,8,3,3,1500,1.2,200,2,30,"wifi|pool|garden|ac","FAMILY_ONLY","https://example.com/photo1.jpg|https://example.com/photo2.jpg"
```

**Schemas:**

```python
class CsvImportResponse(BaseModel):
    total_rows: int
    success_count: int
    failure_count: int
    errors: list[CsvImportError]

class CsvImportError(BaseModel):
    row_number: int
    error: str
    data: dict  # the row that failed
```

**Service function (in `src/app/listings/services.py`):**

```python
async def bulk_import_listings(
    session: AsyncSession, csv_content: str, admin_user: User
) -> CsvImportResponse:
    """Parse CSV and create units + listings + photos.
    
    For each row:
    1. Parse fields and validate
    2. Create Unit with coordinates (PostGIS POINT)
    3. Create UnitListing with pricing
    4. Download photos from URLs and upload to S3
    5. Create UnitPhoto records
    6. Set listing status to DRAFT (or PENDING_VERIFICATION if --submit flag)
    
    Returns per-row success/failure report.
    """
```

---

### 2.7 Unclaimed Listing Endpoints (S3-012)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/listings/unclaimed` | admin | Create listing with no host |
| `GET` | `/admin/listings/{unit_id}/claim-link` | admin | Get claim link for unclaimed listing |

**Schemas:**

```python
class UnclaimedListingCreate(BaseModel):
    # Same as ListingCreate but without host_id
    title: str
    description: str
    property_type: str
    governorate: str
    city: str
    district: str | None
    address_line: str | None
    latitude: float
    longitude: float
    max_guests: int
    bedrooms: int
    bathrooms: int
    base_price_egp: int
    # ... other optional fields

class ClaimLinkResponse(BaseModel):
    claim_url: str  # https://stayos.com/ar/claim/{token}
    claim_token: str
    expires_at: datetime | None
```

**Service functions:**

```python
async def create_unclaimed_listing(
    session: AsyncSession, request: UnclaimedListingCreate, admin_user: User
) -> ListingResponse:
    """Create listing with host_id = NULL, claim_status = 'UNCLAIMED'.
    Generate secure claim token."""

async def get_claim_link(
    session: AsyncSession, unit_id: str
) -> ClaimLinkResponse:
    """Retrieve or regenerate claim link for unclaimed listing."""
```

---

### 2.8 Claim Workflow Endpoints (S3-013)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/listings/claim/{token}` | public | Get listing info for claim page |
| `POST` | `/listings/{unit_id}/claim` | guest/host | Submit claim (requires KYC) |
| `GET` | `/admin/claims` | admin | List pending claims |
| `POST` | `/admin/claims/{claim_id}/approve` | admin | Approve claim, transfer ownership |
| `POST` | `/admin/claims/{claim_id}/reject` | admin | Reject claim with reason |

**Schemas:**

```python
class ClaimSubmissionRequest(BaseModel):
    documents: list[str]  # S3 keys for ownership documents
    notes: str | None

class ClaimQueueItem(BaseModel):
    id: str
    unit_id: str
    unit_title: str
    claimant_id: str
    claimant_name: str | None
    claimant_phone: str | None
    claimant_kyc_status: str
    status: str
    submitted_at: datetime
    documents: list[str] | None

class ClaimRejectRequest(BaseModel):
    reason: str
```

**Service functions (in new `src/app/listings/claim_services.py` or `services.py`):**

```python
async def get_claim_info(session: AsyncSession, token: str) -> dict:
    """Get listing info for public claim page."""

async def submit_claim(
    session: AsyncSession, unit_id: str, user: User, request: ClaimSubmissionRequest
) -> ListingClaim:
    """Submit claim. Requires:
    - User is authenticated
    - User has KYC verified
    - Unit has claim_status = 'UNCLAIMED'
    - Claim token is valid
    Creates ListingClaim record with status = 'PENDING'.
    Updates unit.claim_status = 'CLAIM_PENDING'."""

async def list_pending_claims(
    session: AsyncSession, limit: int, offset: int
) -> list[ClaimQueueItem]:
    """List pending claims for admin review."""

async def approve_claim(
    session: AsyncSession, claim_id: str, admin_user: User
) -> ListingClaim:
    """Approve claim:
    1. Update unit.host_id = claimant_id
    2. Update unit.claim_status = 'CLAIMED'
    3. Update claim.status = 'APPROVED'
    4. Emit 'listing.claimed' event
    5. Notify claimant."""

async def reject_claim(
    session: AsyncSession, claim_id: str, reason: str, admin_user: User
) -> ListingClaim:
    """Reject claim:
    1. Update claim.status = 'REJECTED'
    2. Update unit.claim_status = 'UNCLAIMED' (back to available)
    3. Notify claimant with reason."""
```

---

### 2.9 Duplicate Detection Endpoints (S3-014)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/listings/duplicates/scan` | admin | Trigger duplicate scan |
| `GET` | `/admin/duplicates` | admin | List duplicate flags |
| `POST` | `/admin/duplicates/{flag_id}/merge` | admin | Merge duplicate into primary |
| `POST` | `/admin/duplicates/{flag_id}/dismiss` | admin | Dismiss duplicate flag |

**Schemas:**

```python
class MergeRequest(BaseModel):
    primary_unit_id: str  # which unit to keep

class DuplicateFlagResponse(BaseModel):
    id: str
    unit_id_1: str
    unit_id_2: str
    unit_1_title: str
    unit_2_title: str
    unit_1_location: str
    unit_2_location: str
    similarity_score: float
    match_reasons: list[str]
    status: str
```

**Service functions (in new `src/app/listings/duplicate_services.py`):**

```python
async def scan_duplicates(session: AsyncSession) -> int:
    """Scan all listings for duplicates.
    
    Algorithm:
    1. For each pair of listings within 100m geo proximity:
       a. Calculate title similarity (fuzzy match, e.g., difflib.SequenceMatcher)
       b. Check address similarity
       c. If similarity_score > 0.7, create DuplicateFlag
    2. Skip pairs that already have a flag.
    3. Return count of new flags.
    """

async def list_duplicate_flags(
    session: AsyncSession, status: str | None, limit: int, offset: int
) -> list[DuplicateFlagResponse]:
    """List duplicate flags for admin review."""

async def merge_duplicates(
    session: AsyncSession, flag_id: str, primary_unit_id: str, admin_user: User
) -> None:
    """Merge duplicate into primary:
    1. Transfer bookings/reservations to primary unit
    2. Transfer photos to primary unit
    3. Archive non-primary unit
    4. Update flag status = 'MERGED'
    """

async def dismiss_duplicate(
    session: AsyncSession, flag_id: str, admin_user: User
) -> None:
    """Dismiss duplicate flag: status = 'DISMISSED'."""
```

---

### 2.10 Support Ticket Endpoints (S3-015)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/tickets` | admin | List tickets with filters |
| `POST` | `/admin/tickets` | admin/authenticated | Create ticket |
| `PATCH` | `/admin/tickets/{ticket_id}` | admin | Update ticket (assign, escalate, close) |

**Schemas:**

```python
class TicketCreateRequest(BaseModel):
    subject: str
    description: str
    priority: str = "NORMAL"
    related_unit_id: str | None = None
    related_reservation_id: str | None = None

class TicketUpdateRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    assignee_id: str | None = None
    escalation_notes: str | None = None
    resolution_notes: str | None = None

class TicketResponse(BaseModel):
    id: str
    subject: str
    description: str
    priority: str
    status: str
    reporter_id: str | None
    assignee_id: str | None
    related_unit_id: str | None
    related_reservation_id: str | None
    escalated_at: datetime | None
    resolved_at: datetime | None
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime
```

**New module:** `src/app/support/` with `router.py`, `services.py`, `models.py`, `schemas.py`, `repository.py`, `constants.py`.

---

## 3. New Backend Modules

| Module | Path | Purpose |
|--------|------|---------|
| Support | `src/app/support/` | Support ticket CRUD and queue management |

Existing modules that need updates:

| Module | Updates |
|--------|---------|
| `src/app/listings/router.py` | Add photo endpoints, submit-for-review, admin endpoints |
| `src/app/listings/services.py` | Add photo, submit, admin, CSV import, unclaimed, claim, duplicate functions |
| `src/app/listings/schemas.py` | Add photo, admin, CSV, claim, duplicate schemas |
| `src/app/listings/models.py` | Add ListingClaim, DuplicateFlag, ListingVerificationLog models; update Unit with claim fields |
| `src/app/kyc/router.py` | Add admin queue endpoints |
| `src/app/kyc/services.py` | Add admin review functions, notification triggers |
| `src/app/notifications/services.py` | Update `channels_for_event()` with KYC and listing events |
| `src/app/notifications/templates.py` | Add KYC and listing templates |
| `src/app/main.py` | Register support router |

---

## 4. Router Registration

Update `src/app/main.py` to include the support router:

```python
from app.support.router import router as support_router

app.include_router(support_router, prefix="/api/v1")
```

Admin endpoints should be grouped under a new admin router or added to existing routers with `require_role("admin")` dependencies.

**Option A:** Separate admin router (`src/app/admin/router.py`) that aggregates all admin endpoints.

**Option B:** Add admin endpoints to existing module routers with role guards.

**Recommendation:** Option B — keeps domain logic together, uses existing module structure.

---

## 5. S3 Integration for Listing Photos

**Service (in `src/app/listings/services.py` or `src/app/shared/s3.py`):**

```python
import boto3
from app.config import settings

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

def generate_listing_presigned_url(unit_id: str, filename: str, content_type: str) -> tuple[str, str]:
    """Generate presigned PUT URL for listing photo.
    Returns (upload_url, s3_key)."""
    s3_key = f"listings/{unit_id}/{uuid4()}.{filename.rsplit('.', 1)[-1]}"
    client = get_s3_client()
    url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_LISTINGS_BUCKET,
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=300,  # 5 minutes
    )
    return url, s3_key

def delete_s3_object(s3_key: str) -> None:
    """Delete object from S3 listings bucket."""
    client = get_s3_client()
    client.delete_object(
        Bucket=settings.S3_LISTINGS_BUCKET,
        Key=s3_key,
    )

def get_public_url(s3_key: str) -> str:
    """Return public URL for S3 object."""
    return f"https://{settings.S3_LISTINGS_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
```

---

## 6. Testing Requirements

| Area | Test Coverage |
|------|---------------|
| Photo endpoints | Upload, list, update cover, delete; authorization checks |
| Submit for review | State transition validation; missing photo rejection |
| Admin KYC queue | List, approve, reject; reason logging |
| Admin listing queue | List, approve, reject; verification log |
| CSV import | Valid CSV, invalid rows, photo URL download, error reporting |
| Unclaimed listing | Create without host, claim token generation |
| Claim workflow | Submit, approve (ownership transfer), reject |
| Duplicate detection | Scan, merge, dismiss; false positive handling |
| Support tickets | CRUD, assignment, escalation, closure |
| Notification triggers | Event emission on all state changes |

All tests should use the existing async test pattern with `pytest` and `pytest-asyncio`.
