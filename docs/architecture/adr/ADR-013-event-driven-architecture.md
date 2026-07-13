# ADR-013: Event-Driven Architecture

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend — FastAPI), ADR-005 (Database — PostgreSQL LISTEN/NOTIFY), ADR-008 (Realtime — SSE), ADR-012 (Queue — Celery)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — general marketplace coordination
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §8 BR-OPS-01 (checkout triggers ticket), §4 core data flows
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §4 checkout-to-turnover loop, §5 concurrency
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 confirmed stack
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §3 business rules

---

## Problem

StayOS has several critical cross-service event chains that must be reliable:

1. **Checkout → Turnover ticket** (BR-OPS-01): When a guest checks out, a turnover ticket MUST be created in OpsManager. If this fails, the unit remains in an incorrect state and a host may re-book a dirty unit.
2. **Booking confirmed → Escrow started** (BR-FIN-01): Payment confirmation must trigger the T+24h escrow timer. If this event is lost, the escrow timer never starts.
3. **Turnover ticket closed → Unit ready** (BR-INV-02): When a cleaning ticket is closed, the unit's PMS status must update to `READY_FOR_OCCUPANCY`. If this fails, the unit is stuck as unavailable.
4. **Payment confirmed → Calendar locked**: Once payment is authorized, the calendar date must be atomically locked before the booking is confirmed.

No event-driven architecture is defined. The risk: these transitions are currently implied as direct API calls — which creates synchronous coupling and single points of failure.

---

## Event Taxonomy

| Event Name | Producer | Consumers |
|-----------|---------|-----------|
| `booking.payment_confirmed` | FC-03 Reservation | FC-06 Treasury (escrow start), FC-03 (calendar lock), Notification service |
| `guest.checkout` | FC-03 Reservation | FC-05 OpsManager (create ticket), Notification service |
| `ticket.closed` | FC-05 OpsManager | FC-04 PMS (unit status → READY) |
| `kyc.verified` | FC-01 AuthGate | FC-03 (unblock checkout), Notification service |
| `payout.dispatched` | FC-06 Treasury | Notification service (host payout notification) |
| `unit.calendar_blocked` | FC-04 PMS | FC-02 Search (availability update), SSE stream |

---

## Options Evaluated

### Option A: Direct Service Calls (Synchronous)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Zero. |
| **Scalability** | Poor. Each producer must wait for all consumers to complete. Checkout is blocked until OpsManager ticket is created. |
| **Operational Complexity** | Low initially. High when consumers fail — rollback logic becomes complex. |
| **Security** | Simpler — internal calls only. |
| **Performance** | Checkout completion time = sum of all consumer processing times. |
| **Future Global Expansion** | Does not scale to multi-service multi-region. |

**Pros**: Simple to implement. No infrastructure.
**Cons**: Synchronous coupling defeats the purpose of service boundaries. If OpsManager is slow, booking confirmation is slow. If OpsManager is down, booking fails. This is the worst architecture for a marketplace. Violates the service boundary design in ARCHITECTURE.md.

---

### Option B: PostgreSQL LISTEN/NOTIFY (In-Process Events)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Zero. Already in PostgreSQL. |
| **Scalability** | Sufficient for Phase 1. Works within a single PostgreSQL instance. |
| **Operational Complexity** | Low. FastAPI asyncpg listens on named channels. |
| **Security** | Database-internal. No external broker. |
| **Performance** | Sub-millisecond event delivery within the same PostgreSQL connection. |
| **Future Global Expansion** | Does not scale across database replicas or regions. |

**Pros**: Zero additional infrastructure. PostgreSQL already handles atomicity — event is emitted inside the same transaction as the state change.
**Cons**: Subscribers must be always-connected to PostgreSQL. Does not survive service restarts (events emitted while subscriber is down are lost). Not suitable for the escrow timer or payout batch (Celery Beat handles those — ADR-012).

---

### Option C: Celery Tasks as Event Handlers (via Redis)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Already in stack (ADR-012). |
| **Scalability** | Celery workers scale independently. Redis queue buffers events if consumers are busy. |
| **Operational Complexity** | Moderate. Events are Celery task chains. Retry and DLQ configured per task. |
| **Security** | Redis on VPC. Task payloads contain IDs only (no PII). |
| **Performance** | Event delivery < 500ms (Celery pickup latency). Sufficient for all StayOS cross-service events. |
| **Future Global Expansion** | Celery + Redis scales. Phase 3 upgrade to Kafka is possible without changing task interface. |

**Pros**: Celery already in stack. Events are durable (Redis AOF). Retry on failure — critical for BR-OPS-01 (turnover ticket must be created). Tasks are idempotent (ADR-012 idempotency rule). One queue infrastructure serves both background jobs and event routing.

**Cons**: Not a purpose-built event bus. No event schema registry. No replay capability (if Redis is lost, unprocessed events are gone). Ordering is not guaranteed across workers.

---

### Option D: AWS EventBridge (Managed Event Bus)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | $1/million events. At Phase 1 volume: negligible. |
| **Scalability** | AWS-managed. |
| **Operational Complexity** | Moderate-High. Event schemas in JSON Schema. IAM rules for routing. |
| **Security** | AWS IAM. Events are logged to CloudWatch. |
| **Performance** | Delivery < 1 second. |
| **Future Global Expansion** | Multi-region EventBridge available. |

**Pros**: Managed service. Event replay. Schema registry.
**Cons**: Over-engineered for Phase 1. Celery + Redis already meets requirements. EventBridge is the right choice if StayOS has multiple independent services communicating — Phase 1 is a modular monolith.

---

## Decision

**Celery task chains as the internal event bus** for Phase 1.

**Pattern**:
1. Domain state change occurs in PostgreSQL (within a transaction)
2. After successful commit, a Celery task is dispatched (`task.apply_async`)
3. Celery task represents the event and triggers all downstream consumers

**Phase 3 upgrade path**: When StayOS splits into physical microservices, replace Celery event tasks with AWS EventBridge or Kafka. The consumer logic (the code inside each task) is unchanged — only the dispatch mechanism changes.

---

## Event Implementation Pattern

```python
# In FastAPI route handler:
async with db_session() as session:
    # State change
    booking.status = "CONFIRMED"
    await session.commit()  # ACID commit first

# AFTER successful commit — dispatch event
create_turnover_ticket.apply_async(
    args=[str(booking.id)],
    queue="high",
    countdown=0
)
start_escrow_timer.apply_async(
    args=[str(booking.id)],
    queue="critical",
    countdown=0
)
send_booking_confirmation.apply_async(
    args=[str(booking.id)],
    queue="high",
    countdown=0
)
```

**Why dispatch AFTER commit**: If event is dispatched before commit and the commit fails, the Celery task executes against non-existent data. Dispatch after commit — if commit succeeds, event is guaranteed.

**Why multiple tasks per event**: Each consumer is independent. If notification fails, the escrow timer is not affected. Independent retry policies per task.

---

## Critical Event Guarantees

| Event | Guarantee | Implementation |
|-------|-----------|---------------|
| `guest.checkout` → turnover ticket | At-least-once | Celery retry; idempotency key prevents duplicate tickets |
| `booking.payment_confirmed` → escrow timer | Exactly-once | Idempotency check on booking ID; timer is Celery Beat check, not one-shot |
| `ticket.closed` → unit READY | At-least-once | Celery retry; PMS update is idempotent (setting status to same value is a no-op) |

---

## Decision Rationale

1. **Avoids synchronous coupling**: Checkout API returns to guest immediately. OpsManager ticket creation happens in background. If OpsManager is slow, booking confirmation is not delayed.
2. **Celery is already in stack (ADR-012)**: No new infrastructure. No new operational burden.
3. **EventBridge is premature**: Phase 1 is a modular monolith. A purpose-built event bus makes sense when services are physically separated — which is Phase 3.
4. **LISTEN/NOTIFY is insufficient**: Events emitted while a subscriber restarts are lost. Celery + Redis (AOF) retains events through restarts.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| Direct synchronous calls | Creates tight coupling; checkout speed depends on all downstream services; service failures cascade |
| PostgreSQL LISTEN/NOTIFY | Events lost on subscriber restart; not suitable for critical business events (BR-OPS-01, BR-FIN-01) |
| AWS EventBridge | Over-engineered for Phase 1 modular monolith; evaluate at Phase 3 service separation |
| Kafka/RabbitMQ | Significant operational overhead; not justified until message volume exceeds 100K/day |

---

## Migration Cost

**Phase 3 → EventBridge/Kafka**: Consumer task code is unchanged. Only the `.apply_async()` dispatch is replaced with an EventBridge `put_events()` call. Migration cost: low — changes are isolated to dispatch layer.

---

## Dependencies

- ADR-002 (Backend) — Celery tasks are Python functions in the FastAPI codebase
- ADR-005 (Database) — Events dispatched after PostgreSQL commit
- ADR-012 (Queue) — Celery + Redis is the queue infrastructure
- ADR-008 (Realtime) — Redis pub/sub notifies SSE streams of state changes

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| BR-OPS-01 | Guaranteed via Celery retry — turnover ticket always created |
| BR-FIN-01 | Escrow timer started via Celery task after payment confirmation |
| BR-INV-02 | Unit status update triggered by ticket.closed event |
| Checkout API latency | Not affected — events dispatched after response returned |
| Phase 1 team | Single Python codebase; no separate event service to manage |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
