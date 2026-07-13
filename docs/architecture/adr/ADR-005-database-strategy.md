# ADR-005: Database Strategy

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend — SQLAlchemy), ADR-008 (Realtime — session state), ADR-010 (Search — PostGIS), ADR-012 (Queue — Redis)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "Database: PostgreSQL"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §8 Business Rules (BR-INV-01 atomic locking)
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §5 Critical Concurrency, §6 Offline Architecture
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 Confirmed Choices
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §7 Database Rules

---

## Problem

PostgreSQL is confirmed as the primary database in `MASTER_CONTEXT.md` and `TECH_STACK.md`. However, the full database strategy is undocumented:
- Which extensions are required (PostGIS for spatial queries)?
- How is the offline mobile client database managed (FC-05 OpsManager)?
- What is the caching strategy (Redis scope)?
- What are the connection pooling requirements for concurrent booking writes?
- What is the migration strategy?

These gaps must be resolved before any schema design begins.

---

## Database Components

### Component 1: PostgreSQL (Primary — All Services)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Moderate. AWS RDS for PostgreSQL in Middle East region. ~$200–800/month at Phase 1 scale. |
| **Scalability** | Excellent for Phase 1–2. Read replicas for scaling read traffic. Phase 3+ may require sharding or Citus extension. |
| **Operational Complexity** | Moderate. Managed via AWS RDS (no manual server management). Schema migrations via Alembic (SQLAlchemy). |
| **Security** | Row-level security (RLS) for multi-tenant data isolation. SSL-enforced connections. Encrypted at rest (AWS RDS default). |
| **Performance** | ACID compliance for booking writes (BR-INV-01). Row-level locking for calendar concurrency. Read replicas for search and analytics queries. |
| **Future Global Expansion** | AWS RDS available in all target expansion regions (Saudi Arabia me-central-1, UAE). Data residency via region selection. |

**Decision**: PostgreSQL 16+ on AWS RDS Multi-AZ.

Required extensions:
- **PostGIS** — geo-spatial queries for FC-02 Spatial Search (confirmed in TECH_STACK.md)
- **uuid-ossp** — UUID primary keys for all tables
- **pg_trgm** — trigram full-text search for property name/description (Phase 1; Elasticsearch deferred per ADR-010)

---

### Component 2: Redis (Cache + Session + Queue Broker)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low. AWS ElastiCache for Redis. ~$50–200/month at Phase 1 scale. |
| **Scalability** | Horizontal via Redis Cluster for Phase 3. |
| **Operational Complexity** | Low with AWS ElastiCache. |
| **Security** | In-memory only; no sensitive data persisted to disk. AUTH password + VPC isolation. |
| **Performance** | Sub-millisecond reads. Optimal for OTP TTL (5-min expiry enforced atomically via Redis EXPIRE). |
| **Future Global Expansion** | AWS ElastiCache available in all expansion regions. |

**Decision**: Redis 7+ on AWS ElastiCache.

Redis usage scope (strictly bounded):
- **OTP tokens**: 6-digit keys, 5-minute TTL, single-use (confirmed in TECH_STACK.md, ENGINEERING_BACKLOG.md)
- **Session tokens**: JWT blacklist for logout/revocation
- **Celery message broker**: Background job queue (ADR-012)
- **API rate limiting**: Per-IP rate limiting counters

Redis must NOT store:
- Reservation data
- Booking history
- Financial records
- PII (personally identifiable information)

---

### Component 3: SQLite / Room (Mobile Offline — FC-05 Only)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Zero. Device-local storage. |
| **Scalability** | Per-device. Not horizontally scalable — that is correct for local-first. |
| **Operational Complexity** | Low. Schema managed in mobile app codebase. |
| **Security** | Device-encrypted storage. No network exposure. |
| **Performance** | Sub-millisecond local reads. No network round-trip for offline operations. |
| **Future Global Expansion** | No impact. Device-local. |

**Decision**: SQLite (Android / Web) or Room (Android native) for FC-05 OpsManager field app.

Scope (strictly bounded):
- Ticket states (UNASSIGNED, IN_PROGRESS, VERIFICATION_PENDING, CLOSED)
- Checklist step completion state
- Text field entries
- Image file paths (images stored in device sandbox, not SQLite BLOB)

Sync strategy: On connectivity recovery, background service uploads delta to PostgreSQL via FastAPI sync endpoint. S3 for image upload (ADR-009).

---

### Component 4: No Additional Databases

No MongoDB, no DynamoDB, no Cassandra, no ClickHouse in Phase 1 or Phase 2.

**Rationale**:
- `ENGINEERING_RULES.md` §7: "Do not introduce a second relational database without an ADR."
- PostgreSQL with read replicas is sufficient for Phase 1–2 scale.
- Analytics/reporting: Export to CSV for Phase 1; consider ClickHouse or BigQuery at Phase 3 when booking volume requires real-time analytics dashboards.

---

## Migration Strategy

**Schema migrations**: Alembic (SQLAlchemy's migration tool). One migration file per schema change. Migrations are:
- Committed to git
- Reviewed in PR
- Run as part of deployment pipeline
- Never auto-applied in production without Founder sign-off (per ENGINEERING_RULES.md §7)

**Rollback strategy**: Every Alembic migration must include a `downgrade()` function. Forward-only migrations (no downgrade) are prohibited in production.

---

## Connection Pooling

**FastAPI + SQLAlchemy async**: Use `asyncpg` driver with SQLAlchemy async session. Connection pool size: 10–20 connections per service instance at Phase 1.

**Critical for FC-03**: Calendar booking writes must use `SELECT FOR UPDATE SKIP LOCKED` in PostgreSQL. This is the row-level isolation locking required by BR-INV-01. Connection pool must support long-held locks without starvation.

---

## Data Retention and Privacy

Per CBE regulations and anticipated Egyptian data protection framework:
- Guest PII (name, phone, national ID) retained for minimum 5 years (financial record requirement)
- KYC documents: Encrypted at rest in PostgreSQL; access-logged; soft-deleted (not hard-deleted)
- OTP tokens: Never persisted to PostgreSQL; Redis-only with 5-minute TTL

---

## Dependencies

- ADR-002 (Backend) — SQLAlchemy 2.0 + asyncpg as the ORM/driver
- ADR-010 (Search) — PostGIS extension on PostgreSQL for spatial queries
- ADR-012 (Queue) — Redis as Celery message broker
- ADR-007 (Deployment) — AWS RDS and ElastiCache provisioned in Middle East region

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-01 AuthGate | PostgreSQL: users, sessions, KYC records. Redis: OTP tokens. |
| FC-02 Spatial Search | PostGIS: unit coordinates, geo-boundary queries |
| FC-03 Reservation | PostgreSQL: ACID booking writes with row-level locking |
| FC-04 PMS Core | PostgreSQL: unit data objects, calendar, pricing |
| FC-05 OpsManager | PostgreSQL: tickets (cloud). SQLite: tickets (device offline). |
| FC-06 Treasury | PostgreSQL: double-entry ledger, escrow records, payout batches |
| Phase 3 AI | PostgreSQL: event logs for training data (schema must include from Sprint 1) |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
