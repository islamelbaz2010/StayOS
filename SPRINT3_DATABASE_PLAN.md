# SPRINT 3 DATABASE PLAN — StayOS

**Prepared by:** Lead Software Architect  
**Date:** 2026-08-04  
**Purpose:** Define all new migrations, schema changes, and table definitions required for Sprint 3 P0 stories.

---

## 1. Current Schema Overview

The database uses PostgreSQL with PostGIS and has the following schemas:

| Schema | Purpose | Created By |
|--------|---------|------------|
| `auth` | Users, accounts, KYC documents, device tokens, refresh tokens | Migrations 001–003, 012 |
| `pms` | Units, unit_listings, calendar_rules, unit_photos | Migrations 004, 006, 011, 017 |
| `reservation` | Reservations, payment_intents, promo_codes, promo_applications | Migration 005, 015 |
| `finance` | Wallets, escrow_accounts, financial_transactions, ledger_entries, payout_requests | Migration 008, 015 |
| `operations` | Field_staff, operation_tasks, task_events, maintenance_requests, property_readiness, recurring_maintenance | Migration 007, 014 |
| `notify` | Notifications, notification_templates | Migration 010 |
| `security` | Audit_logs | Migration 010 |
| `analytics` | Listing_views, user_searches, booking_funnel_events | Migration 013 |
| `booking` | Bookings | Migration 016 |

**Current migration head:** `017_add_listing_configuration`

---

## 2. New Migrations Required

### Migration 018 — `pms.listing_claims`

**Story:** S3-013 (Claim review and ownership transfer)

```sql
CREATE TABLE pms.listing_claims (
    id              VARCHAR(36) PRIMARY KEY,
    unit_id         VARCHAR(36) NOT NULL REFERENCES pms.units(id),
    claimant_id     VARCHAR(36) NOT NULL REFERENCES auth.users(id),
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    claim_token     VARCHAR(255) NOT NULL UNIQUE,
    documents       JSONB,
    notes           TEXT,
    reviewed_by     VARCHAR(36) REFERENCES auth.users(id),
    reviewed_at     TIMESTAMPTZ,
    reject_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_claims_unit_id ON pms.listing_claims(unit_id);
CREATE INDEX idx_listing_claims_claimant_id ON pms.listing_claims(claimant_id);
CREATE INDEX idx_listing_claims_status ON pms.listing_claims(status);
CREATE INDEX idx_listing_claims_claim_token ON pms.listing_claims(claim_token);
```

**Notes:**
- `status` values: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`.
- `claim_token` is a secure random token used in the claim link.
- `documents` stores KYC/ownership proof document references (S3 keys).
- On approval, `pms.units.host_id` is updated to `claimant_id`.

---

### Migration 019 — `pms.duplicate_flags`

**Story:** S3-014 (Duplicate listing detection)

```sql
CREATE TABLE pms.duplicate_flags (
    id              VARCHAR(36) PRIMARY KEY,
    unit_id_1       VARCHAR(36) NOT NULL REFERENCES pms.units(id),
    unit_id_2       VARCHAR(36) NOT NULL REFERENCES pms.units(id),
    similarity_score NUMERIC(5,4) NOT NULL,
    match_reasons   JSONB NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'FLAGGED',
    resolved_by     VARCHAR(36) REFERENCES auth.users(id),
    resolved_at     TIMESTAMPTZ,
    resolution      VARCHAR(50),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_duplicate_different_units CHECK (unit_id_1 != unit_id_2)
);

CREATE INDEX idx_duplicate_flags_unit_id_1 ON pms.duplicate_flags(unit_id_1);
CREATE INDEX idx_duplicate_flags_unit_id_2 ON pms.duplicate_flags(unit_id_2);
CREATE INDEX idx_duplicate_flags_status ON pms.duplicate_flags(status);
```

**Notes:**
- `similarity_score` is 0.0 to 1.0.
- `match_reasons` is a JSONB array: `["geo_proximity", "title_similarity", "address_match"]`.
- `status` values: `FLAGGED`, `MERGED`, `DISMISSED`.
- `resolution` values: `MERGE_INTO_1`, `MERGE_INTO_2`, `NOT_DUPLICATE`.

---

### Migration 020 — `support.tickets`

**Story:** S3-015 (Support ticket queue)

```sql
CREATE SCHEMA IF NOT EXISTS support;

CREATE TABLE support.tickets (
    id              VARCHAR(36) PRIMARY KEY,
    subject         VARCHAR(500) NOT NULL,
    description     TEXT NOT NULL,
    priority        VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status          VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    reporter_id     VARCHAR(36) REFERENCES auth.users(id),
    assignee_id     VARCHAR(36) REFERENCES auth.users(id),
    related_unit_id VARCHAR(36) REFERENCES pms.units(id),
    related_reservation_id VARCHAR(36) REFERENCES reservation.reservations(id),
    related_booking_id VARCHAR(36) REFERENCES booking.bookings(id),
    escalated_at    TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status ON support.tickets(status);
CREATE INDEX idx_tickets_priority ON support.tickets(priority);
CREATE INDEX idx_tickets_assignee_id ON support.tickets(assignee_id);
CREATE INDEX idx_tickets_reporter_id ON support.tickets(reporter_id);
CREATE INDEX idx_tickets_related_unit_id ON support.tickets(related_unit_id);
```

**Notes:**
- `priority` values: `LOW`, `NORMAL`, `HIGH`, `URGENT`.
- `status` values: `OPEN`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`.
- `metadata` for flexible additional fields (source channel, tags, etc.).

---

### Migration 021 — `pms.listing_verification_logs`

**Story:** S3-010 (Admin listing verification)

```sql
CREATE TABLE pms.listing_verification_logs (
    id              VARCHAR(36) PRIMARY KEY,
    unit_id         VARCHAR(36) NOT NULL REFERENCES pms.units(id),
    reviewer_id     VARCHAR(36) NOT NULL REFERENCES auth.users(id),
    action          VARCHAR(50) NOT NULL,
    reason          TEXT,
    previous_status VARCHAR(50) NOT NULL,
    new_status      VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_logs_unit_id ON pms.listing_verification_logs(unit_id);
CREATE INDEX idx_verification_logs_reviewer_id ON pms.listing_verification_logs(reviewer_id);
```

**Notes:**
- `action` values: `APPROVED`, `REJECTED`, `SUSPENDED`.
- Provides audit trail for listing verification decisions.

---

### Migration 022 — Add `host_id` nullable to `pms.units` (if needed)

**Story:** S3-012 (Admin unclaimed listing creation)

**Current state:** `pms.units.host_id` is already nullable (migration 004 creates it as nullable). No migration needed.

**Verification:**
- Check migration `004_create_pms_tables.py` — `host_id` column should be `nullable=True`.
- If not nullable, add migration: `ALTER TABLE pms.units ALTER COLUMN host_id DROP NOT NULL;`

---

### Migration 023 — Add `claim_token` and `claim_status` to `pms.units`

**Story:** S3-012 (Admin unclaimed listing creation)

```sql
ALTER TABLE pms.units ADD COLUMN claim_token VARCHAR(255);
ALTER TABLE pms.units ADD COLUMN claim_status VARCHAR(50) DEFAULT 'UNCLAIMED';

CREATE INDEX idx_units_claim_token ON pms.units(claim_token);
CREATE INDEX idx_units_claim_status ON pms.units(claim_status);
```

**Notes:**
- `claim_status` values: `UNCLAIMED`, `CLAIM_PENDING`, `CLAIMED`, `NONE` (for host-created listings).
- `claim_token` is set when admin creates an unclaimed listing; cleared when claimed.
- This allows the claim workflow to be tracked on the unit itself without a separate table lookup.

---

## 3. Migration Sequence

```
017_add_listing_configuration (current head)
  └─→ 018_listing_claims
        └─→ 019_duplicate_flags
              └─→ 020_support_tickets
                    └─→ 021_listing_verification_logs
                          └─→ 022_add_claim_fields_to_units
```

All migrations are additive (no destructive changes to existing tables).

---

## 4. Model Definitions

### `src/app/listings/models.py` — Add `ListingClaim`

```python
class ListingClaim(Base):
    __tablename__ = "listing_claims"
    __table_args__ = {"schema": "pms"}

    id = Column(String(36), primary_key=True)
    unit_id = Column(String(36), ForeignKey("pms.units.id"), nullable=False)
    claimant_id = Column(String(36), ForeignKey("auth.users.id"), nullable=False)
    status = Column(String(50), nullable=False, server_default="PENDING")
    claim_token = Column(String(255), nullable=False, unique=True)
    documents = Column(JSONB, nullable=True)
    notes = Column(Text, nullable=True)
    reviewed_by = Column(String(36), ForeignKey("auth.users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reject_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

### `src/app/listings/models.py` — Add `DuplicateFlag`

```python
class DuplicateFlag(Base):
    __tablename__ = "duplicate_flags"
    __table_args__ = {"schema": "pms"}

    id = Column(String(36), primary_key=True)
    unit_id_1 = Column(String(36), ForeignKey("pms.units.id"), nullable=False)
    unit_id_2 = Column(String(36), ForeignKey("pms.units.id"), nullable=False)
    similarity_score = Column(Numeric(5, 4), nullable=False)
    match_reasons = Column(JSONB, nullable=False)
    status = Column(String(50), nullable=False, server_default="FLAGGED")
    resolved_by = Column(String(36), ForeignKey("auth.users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

### `src/app/listings/models.py` — Add `ListingVerificationLog`

```python
class ListingVerificationLog(Base):
    __tablename__ = "listing_verification_logs"
    __table_args__ = {"schema": "pms"}

    id = Column(String(36), primary_key=True)
    unit_id = Column(String(36), ForeignKey("pms.units.id"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("auth.users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
```

### `src/app/support/models.py` — New file

```python
class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = {"schema": "support"}

    id = Column(String(36), primary_key=True)
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False, server_default="NORMAL")
    status = Column(String(50), nullable=False, server_default="OPEN")
    reporter_id = Column(String(36), ForeignKey("auth.users.id"), nullable=True)
    assignee_id = Column(String(36), ForeignKey("auth.users.id"), nullable=True)
    related_unit_id = Column(String(36), ForeignKey("pms.units.id"), nullable=True)
    related_reservation_id = Column(String(36), ForeignKey("reservation.reservations.id"), nullable=True)
    related_booking_id = Column(String(36), ForeignKey("booking.bookings.id"), nullable=True)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

### `src/app/listings/models.py` — Update `Unit`

Add fields:
```python
    claim_token = Column(String(255), nullable=True)
    claim_status = Column(String(50), nullable=True, server_default="NONE")
```

---

## 5. Index Strategy

All new tables include indexes on:
- Foreign key columns (for join performance)
- Status columns (for queue filtering)
- Token columns (for lookup by claim link)

No additional indexes needed on existing tables for P0 stories.

---

## 6. Rollback Plan

Each migration includes a `downgrade()` function that drops the table/column. Migrations are applied in order and can be rolled back in reverse order.

```bash
# Apply all migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade 017_add_listing_configuration
```
