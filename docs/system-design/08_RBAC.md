# 08 — Role-Based Access Control (RBAC)

**Cross-references**: [04_API_SPECIFICATION.md](04_API_SPECIFICATION.md) · [ADR-006](../architecture/adr/ADR-006-authentication-strategy.md) · [10_SECURITY_MODEL.md](10_SECURITY_MODEL.md) · [PRODUCT_CANON.md](../../PRODUCT_CANON.md)

---

## 1. Roles

| Role | Description | Who Has It |
|------|-------------|-----------|
| `GUEST` | Traveler who searches and books | Default for all new signups |
| `HOST` | Property owner or manager who lists units | Upgraded after KYC verification |
| `FIELD_STAFF` | On-site turnover and operations worker | Created by OPS_MANAGER |
| `OPS_MANAGER` | Oversees field staff, tickets, and disputes | Created by ADMIN |
| `ADMIN` | Full platform access, kill-switches | Internal only — not self-service |

**Role assignment rules**:
- `GUEST` → `HOST`: requires `kyc_records.status = VERIFIED`
- `HOST` → `FIELD_STAFF`: impossible — these are separate user accounts
- Any role → `OPS_MANAGER`: requires `ADMIN` to explicitly set
- Any role → `ADMIN`: requires founder action — no API endpoint; database-only

A user can hold multiple roles in future (e.g., a host who also acts as field staff for their own property). Phase 1 enforces single role per user.

---

## 2. Permissions Matrix

Legend: ✅ = Full access · 📖 = Own resources only · 🚫 = Denied

### 2.1 User Management

| Action | GUEST | HOST | FIELD_STAFF | OPS_MANAGER | ADMIN |
|--------|-------|------|-------------|-------------|-------|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| View other user profiles | 🚫 | 🚫 | 🚫 | 📖 limited | ✅ |
| Upload KYC document | ✅ | ✅ | 🚫 | 🚫 | ✅ |
| Approve KYC | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Reject KYC | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Suspend user | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Ban user | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Create FIELD_STAFF account | 🚫 | 🚫 | 🚫 | ✅ | ✅ |
| Create OPS_MANAGER account | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |

### 2.2 Listing Management

| Action | GUEST | HOST | FIELD_STAFF | OPS_MANAGER | ADMIN |
|--------|-------|------|-------------|-------------|-------|
| Search listings (public) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View listing detail (public) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create unit listing | 🚫 | ✅ | 🚫 | 🚫 | ✅ |
| Edit own unit | 🚫 | 📖 | 🚫 | 🚫 | ✅ |
| Upload listing photos | 🚫 | 📖 | 🚫 | 🚫 | ✅ |
| Manage own calendar | 🚫 | 📖 | 🚫 | 🚫 | ✅ |
| Set own pricing | 🚫 | 📖 | 🚫 | 🚫 | ✅ |
| Suspend any listing | 🚫 | 🚫 | 🚫 | ✅ | ✅ |
| Emergency delist (kill-switch) | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Archive own listing | 🚫 | 📖 | 🚫 | 🚫 | ✅ |

### 2.3 Reservation Management

| Action | GUEST | HOST | FIELD_STAFF | OPS_MANAGER | ADMIN |
|--------|-------|------|-------------|-------------|-------|
| Initiate booking | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| View own reservation | 📖 | 📖 (their unit) | 🚫 | ✅ | ✅ |
| Cancel own reservation | 📖 | 📖 (their unit) | 🚫 | 🚫 | ✅ |
| Cancel any reservation | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Record check-in | 🚫 | 📖 (their unit) | ✅ | ✅ | ✅ |
| Record check-out | 🚫 | 📖 (their unit) | ✅ | ✅ | ✅ |
| Apply promo code | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| Override booking | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |

### 2.4 Operations

| Action | GUEST | HOST | FIELD_STAFF | OPS_MANAGER | ADMIN |
|--------|-------|------|-------------|-------------|-------|
| View assigned tickets | 🚫 | 🚫 | 📖 | ✅ | ✅ |
| Accept ticket assignment | 🚫 | 🚫 | ✅ | 🚫 | ✅ |
| Complete checklist task | 🚫 | 🚫 | ✅ | 🚫 | ✅ |
| Attach verification photo | 🚫 | 🚫 | ✅ | ✅ | ✅ |
| Close ticket | 🚫 | 🚫 | 📖 (assigned) | 🚫 | ✅ |
| Escalate ticket | 🚫 | 🚫 | 🚫 | ✅ | ✅ |
| Create ticket manually | 🚫 | 🚫 | 🚫 | ✅ | ✅ |
| Void ticket | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |

### 2.5 Finance

| Action | GUEST | HOST | FIELD_STAFF | OPS_MANAGER | ADMIN |
|--------|-------|------|-------------|-------------|-------|
| View own transaction history | ✅ | ✅ | 🚫 | 🚫 | ✅ |
| View host balance | 🚫 | 📖 | 🚫 | 🚫 | ✅ |
| View host payout history | 🚫 | 📖 | 🚫 | 🚫 | ✅ |
| View platform revenue | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Trigger manual payout | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Issue refund | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |

### 2.6 Admin / Incident Console

| Action | GUEST | HOST | FIELD_STAFF | OPS_MANAGER | ADMIN |
|--------|-------|------|-------------|-------------|-------|
| View dispute queue | 🚫 | 🚫 | 🚫 | ✅ | ✅ |
| Resolve dispute | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| View audit log | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| Platform kill-switch | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |

---

## 3. Authorization Model

### 3.1 Enforcement Layers

Authorization is enforced at **two layers** — both are required:

1. **FastAPI dependency (`verify_role`)**: Checks the JWT claim `role` against the required role for the endpoint. Applied as a FastAPI `Depends()` decorator on each route.

2. **Service-layer ownership check**: For own-resource access (📖), the service layer validates that the authenticated user's `user_id` matches the resource's owner field (e.g., `unit.host_id == current_user.id`).

Never rely solely on the JWT role claim for ownership — the resource must be explicitly checked in the service layer.

### 3.2 JWT Claims

Firebase ID tokens are augmented with custom claims when a user's role is set:

```json
{
  "uid": "firebase_uid_abc123",
  "user_id": "uuid-stayos-user-id",
  "role": "HOST",
  "kyc_status": "VERIFIED",
  "iat": 1721000000,
  "exp": 1721003600
}
```

Custom claims are set via `firebase_admin.auth.set_custom_user_claims()` when role or KYC status changes.

### 3.3 Role Check Pattern

```python
from fastapi import Depends, HTTPException
from app.auth.dependencies import get_current_user, require_role

@router.post("/listings")
async def create_listing(
    body: CreateListingRequest,
    current_user: User = Depends(require_role("HOST"))
):
    ...

@router.patch("/listings/{unit_id}")
async def update_listing(
    unit_id: UUID,
    body: UpdateListingRequest,
    current_user: User = Depends(require_role("HOST"))
):
    unit = await pms_service.get_unit(unit_id)
    if unit.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this listing")
    ...
```

### 3.4 Admin Action Audit

All admin actions (ban, KYC approve/reject, refund, kill-switch) are recorded in `auth.audit_log`:

```sql
CREATE TABLE auth.audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL REFERENCES auth.users(id),
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   UUID,
    metadata    JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Audit log is append-only. No delete, no update. Retained for 7 years (regulatory requirement).

---

## 4. Resource Ownership Rules

| Resource | Owner Field | Who Can Access |
|---------|------------|---------------|
| `Unit` | `host_id` | Host owns it; OPS_MANAGER can view; ADMIN can edit |
| `Reservation` | `guest_id` (guest view), unit's `host_id` (host view) | Both parties can see their side |
| `TurnoverTicket` | `unit.host_id` (indirectly) | FIELD_STAFF assigned; OPS_MANAGER all; ADMIN all |
| `EscrowAccount` | `reservation.unit.host_id` | HOST can view own; ADMIN can view all |
| `LedgerEntry` | `account_id` | Account owner (HOST) can view own; ADMIN all |
| `KYCRecord` | `user_id` | User can view own status; ADMIN can view full record |

---

## 5. Multi-Tenant Isolation

Phase 1 uses a **shared database, application-layer isolation** model. Each query in the service layer filters by `host_id` or `guest_id` derived from the JWT — no cross-tenant data leakage is possible unless the ownership check is bypassed.

Phase 2+ consideration: Row-Level Security (RLS) in PostgreSQL as an additional isolation layer for host accounts accessing only their own data.
