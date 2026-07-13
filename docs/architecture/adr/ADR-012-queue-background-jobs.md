# ADR-012: Queue and Background Jobs

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend — Python), ADR-005 (Database — Redis broker), ADR-011 (Notifications — async dispatch), ADR-013 (Event-driven)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — general infrastructure
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §8 BR-OPS-01, BR-FIN-01 (time-delayed operations)
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §4 escrow settlement, checkout-to-turnover loop
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 Redis confirmed
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §3 Business Rules

---

## Problem

Several system operations must happen asynchronously — they cannot block the primary request:

1. **Notification dispatch** (FC-03, FC-05): WhatsApp/email notifications must not block booking confirmation API response
2. **Escrow T+24h timer** (FC-06, BR-FIN-01): Guest payment held in escrow for exactly 24 hours post-check-in — requires a scheduled release
3. **Payout batch processing** (FC-06): Aggregate unlocked host balances and dispatch ACH/wire — runs on schedule, not on-demand
4. **OpsManager ticket auto-dispatch** (FC-05, BR-OPS-01): Checkout event generates turnover ticket — this spawn must be reliable even if the primary request succeeds and the worker fails
5. **Photo sync from mobile** (FC-05): Retry logic for S3 uploads from field staff offline queue
6. **KYC document processing** (FC-01): ID document OCR via AWS Textract/Rekognition — CPU-bound, cannot block the upload request

No queue architecture is defined in the repository.

---

## Options Evaluated

### Option A: Celery + Redis

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Redis is already in the stack (ADR-005). Celery workers run as additional ECS Fargate tasks. ~$50–100/month additional compute. |
| **Scalability** | Celery scales horizontally — add more worker processes. Redis can handle 100K+ queued tasks. Celery Beat for scheduled tasks. |
| **Operational Complexity** | Moderate. Celery requires configuration (queues, concurrency, retry policies). Flower dashboard for monitoring. |
| **Security** | Redis on VPC (ADR-005). Celery tasks run in same ECS VPC. Task payloads are not encrypted by default — do not put PII in task arguments; use IDs only. |
| **Performance** | Task pickup latency < 100ms. Celery Beat for cron-style scheduling (payout batches). |
| **Future Global Expansion** | Celery is region-agnostic. Redis Cluster for multi-region if needed in Phase 3. |

**Pros**: Python-native (aligned with ADR-002 FastAPI backend). Redis already in stack — no new infrastructure. Celery Beat for scheduled tasks (escrow timer, payout batch). Mature retry and error handling. Widely used at marketplace scale (Airbnb, Pinterest historically used Celery).
**Cons**: Celery configuration is verbose. Redis is an in-memory broker — task durability depends on Redis persistence (AOF enabled). Task deduplication requires explicit idempotency keys.

---

### Option B: AWS SQS + Lambda

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | SQS: $0.40/million requests. Lambda: $0.20/million invocations. Effectively free at Phase 1 volume. |
| **Scalability** | AWS-managed scale. Lambda auto-scales to thousands of concurrent executions. |
| **Operational Complexity** | Moderate. Serverless — no worker fleet to manage. But cold starts add latency. Dead letter queue configuration required. |
| **Security** | IAM role-based. SQS + Lambda within VPC. |
| **Performance** | Lambda cold start: 200–2000ms for Python (cold start problem). Task pickup latency is variable. |
| **Future Global Expansion** | AWS-native. Multi-region via separate SQS queues per region. |

**Pros**: No worker fleet management. Pay per use. AWS-managed reliability.
**Cons**: Lambda cold starts are unpredictable — 30-second notification threshold (PRODUCT_CANON.md §11) could be violated. Cannot use Celery Beat directly on Lambda (requires EventBridge for scheduling). Python FastAPI worker code needs to be restructured for Lambda function format.

---

### Option C: Dramatiq + Redis

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Same as Celery + Redis. |
| **Scalability** | Good. Dramatiq is a Celery alternative with simpler API. |
| **Operational Complexity** | Lower than Celery. Simpler middleware model. |
| **Security** | Same as Celery. |
| **Performance** | Comparable to Celery. |
| **Future Global Expansion** | Smaller community than Celery. |

**Pros**: Simpler than Celery. Better default retry semantics.
**Cons**: Smaller ecosystem. No built-in Beat scheduler — requires APScheduler separately. Less documentation and community support than Celery for marketplace patterns.

---

## Decision

**Celery 5.x + Redis (message broker) + Celery Beat (scheduler)**

Redis persistence: AOF (append-only file) enabled — tasks survive Redis restart.

---

## Task Queue Architecture

### Queue Priority Levels

| Queue | Tasks | Priority | Retry Policy |
|-------|-------|----------|-------------|
| `critical` | Payment webhooks, booking confirmation | Highest | 5 retries, exponential backoff, DLQ |
| `high` | WhatsApp notifications, ticket dispatch | High | 3 retries, 30s–5m backoff |
| `default` | Email notifications, KYC processing | Normal | 3 retries, 1m–10m backoff |
| `low` | Payout batch, photo sync retry | Low | 10 retries, 5m–1h backoff |

### Scheduled Tasks (Celery Beat)

| Task | Schedule | Business Rule |
|------|----------|--------------|
| Escrow release check | Every 5 minutes | BR-FIN-01: release T+24h after check-in |
| Payout batch | Daily 02:00 UAE time | BR-FIN-02: aggregate unlocked balances |
| OTP cleanup | Every 10 minutes | Delete expired OTP records from Redis |
| Mobile sync retry | Every 15 minutes | Retry failed S3 uploads from field staff |

### Idempotency Rule

Every Celery task must be idempotent — safe to execute multiple times with the same effect. Implementation:
- Task ID stored in Redis with 24-hour TTL
- On task execution: check if task ID already processed → skip if yes
- Critical for payment webhook processing: duplicate webhook delivery must not create duplicate ledger entries

### PII in Tasks

Tasks must NOT include PII in arguments. Pass database record IDs only.
```python
# CORRECT
send_booking_confirmation.delay(booking_id=uuid)

# WRONG — PII in task argument, logged in plaintext
send_booking_confirmation.delay(guest_email="...", guest_name="...")
```

---

## Decision Rationale

1. **Python alignment**: Celery is the Python ecosystem standard. ADR-002 chose FastAPI (Python). Celery integrates directly — shared code, shared models, no inter-language bridge.

2. **Redis already in stack**: Celery uses Redis as both message broker and result backend. No additional infrastructure beyond ADR-005 Redis.

3. **Celery Beat for scheduled tasks**: BR-FIN-01 (T+24h escrow release) requires a reliable scheduler. Celery Beat runs as a separate process — scheduling does not compete with task execution.

4. **Lambda rejected on cold start risk**: The 30-second notification threshold (PRODUCT_CANON.md §11) could be violated by Lambda cold starts. Celery workers are always-warm in ECS Fargate.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| AWS SQS + Lambda | Cold start latency risk; requires EventBridge for scheduling; adds operational complexity without benefit at Phase 1 scale |
| Dramatiq | Smaller ecosystem; no built-in scheduler; less documentation for marketplace patterns |
| RQ (Redis Queue) | Too minimal; no Beat scheduler; poor at complex retry policies |

---

## Migration Cost

**Phase 3 (if volume requires)**: Migrate Celery broker from Redis to RabbitMQ or Kafka if Redis queue depth becomes a bottleneck. Celery supports multiple brokers — migration is configuration, not code change.

---

## Dependencies

- ADR-002 (Backend) — Celery workers share Python codebase with FastAPI
- ADR-005 (Database) — Redis as broker; PostgreSQL for task result storage (optional)
- ADR-011 (Notifications) — All WhatsApp/email dispatched via Celery tasks
- ADR-013 (Event-driven) — Celery tasks are triggered by domain events

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-03 Reservation | Payment webhooks processed in `critical` queue |
| FC-05 OpsManager | Checkout hook → ticket dispatch via `high` queue |
| FC-06 Treasury | Escrow release via Celery Beat scheduled task |
| Notifications (all) | WhatsApp/email dispatched asynchronously via `high` queue |
| BR-OPS-01 | Turnover ticket spawn is a Celery task — reliable even under high load |
| BR-FIN-01 | Escrow T+24h timer is Celery Beat task — not an application timer |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
