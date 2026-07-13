# ADR-002: Backend Runtime

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-001 (Frontend), ADR-005 (Database), ADR-012 (Queue & Background Jobs), ADR-014 (API Style)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "Node.js or Python (Django/FastAPI)"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §5 MVP Scope, §8 Business Rules
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §2 Canonical Service Boundaries
- [`TECH_STACK.md`](../../TECH_STACK.md) — §2 Proposed (no ADR)
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §4 Code Style, §7 Database Rules

---

## Problem

`MASTER_CONTEXT.md` names "Node.js or Python (Django/FastAPI)" as the backend choice. No ADR was written. This ambiguity blocks:
- API contract design (Express/Fastify patterns vs FastAPI patterns)
- Database ORM selection (Prisma/Drizzle vs SQLAlchemy)
- Background job framework (BullMQ vs Celery)
- Team hiring
- Phase 3 AI/ML integration planning (Python ecosystem vs Node.js ecosystem)

The backend language choice has cascading dependencies across services, queue architecture, and long-term AI integration. It must be resolved before any service scaffold is created.

---

## Options Evaluated

### Option A: Node.js with Express or Fastify

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low. Single runtime for frontend (Next.js) and backend. Shared types possible via TypeScript. |
| **Scalability** | Excellent for I/O-bound workloads. Event loop handles concurrent connections efficiently. |
| **Operational Complexity** | Low. Same ecosystem as Next.js. Shared Docker base images possible. |
| **Security** | Well-understood. NPM supply chain risk requires active dependency management. |
| **Performance** | Excellent I/O throughput. Not ideal for CPU-bound tasks (OCR processing, image analysis). |
| **Future Global Expansion** | No regional concern. But Node.js has limited native ML/AI library ecosystem. |

**Pros**: Same language as Next.js frontend (TypeScript). Strong async I/O for booking and payment webhooks. Large hiring pool.
**Cons**: Weak AI/ML ecosystem. Phase 3 would require either Python microservices anyway, or calling external ML APIs — adding complexity. OCR for KYC (FC-01) is CPU-bound; Node.js handles this poorly natively. Django/FastAPI named in MASTER_CONTEXT alongside Node.js — Python already considered.

---

### Option B: Python with Django (REST Framework)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Moderate. Django ORM adds abstraction overhead. Django's "batteries included" reduces initial development cost. |
| **Scalability** | Good via gunicorn + multiple workers. Synchronous by default — requires async views for high-concurrency paths. |
| **Operational Complexity** | Moderate. Django migration system is mature. Celery integration is first-class. |
| **Security** | Excellent. Django's security defaults (CSRF, SQL injection prevention via ORM, XSS escaping) are industry-standard. |
| **Performance** | Good for CRUD workloads. Synchronous default is a constraint for high-concurrency booking paths. |
| **Future Global Expansion** | Python is the Phase 3 AI/ML language. No ecosystem switching required. |

**Pros**: Django ORM with PostgreSQL is battle-tested at marketplace scale (Instagram, Pinterest started on Django). Strong admin panel useful for backoffice. Security defaults excellent.
**Cons**: Synchronous by default. Django's async support is partial — not all ORM operations are async. Heavier than FastAPI for a JSON API.

---

### Option C: Python with FastAPI

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low initial cost. Auto-generated OpenAPI docs reduce API documentation effort. Pydantic validation eliminates manual input validation layer. |
| **Scalability** | Excellent. Async-native with ASGI (uvicorn). Handles high concurrency for booking paths without threading complexity. |
| **Operational Complexity** | Low to Moderate. Simpler than Django (no ORM bundled — uses SQLAlchemy or SQLModel separately). Requires explicit structure. |
| **Security** | Pydantic validation prevents malformed input at the boundary. OAuth2/JWT support built into security module. Requires explicit CSRF handling unlike Django. |
| **Performance** | Benchmark-leading for Python web frameworks. Async I/O matches Node.js for I/O-bound concurrency. |
| **Future Global Expansion** | Python for Phase 3 ML. FastAPI integrates natively with Python ML libraries (scikit-learn, PyTorch, Anthropic SDK). |

**Pros**: Async-native — handles concurrent booking requests without blocking. Auto-generated OpenAPI docs. Pydantic models serve as both input validation and data serialization. Python ecosystem for Phase 3 AI. `mypy` and `ruff` already in CI (from `ENGINEERING_RULES.md`). Type safety comparable to TypeScript.
**Cons**: No built-in ORM (requires SQLAlchemy separately). Less opinionated than Django — requires architectural discipline. Smaller default security surface than Django (no automatic CSRF middleware).

---

## Decision

**Python 3.11+ with FastAPI (ASGI / uvicorn)**

ORM: **SQLAlchemy 2.0** (async-capable, PostGIS-compatible via GeoAlchemy2)
Validation: **Pydantic v2** (built into FastAPI)

---

## Decision Rationale

1. **Phase 3 AI integration**: `DECISION_LOG.md` DEC-008 specifies ML features at Phase 2 (50K+ transactions) and full AI at Phase 3+. Python is the language of every major ML framework (PyTorch, scikit-learn, Anthropic Claude SDK, OpenAI SDK, Hugging Face). Choosing Python now means zero ecosystem switching cost when AI features are built.

2. **Async-native for booking concurrency**: FC-03 Reservation Engine requires ACID-compliant concurrent booking writes (BR-INV-01). An async ASGI backend (FastAPI + uvicorn) handles concurrent requests without thread pool exhaustion — critical during peak Eid and summer booking periods.

3. **CI tooling alignment**: `ENGINEERING_RULES.md` §4 specifies ruff, mypy, bandit, and pytest — all Python tools already active in CI. Backend code uses the same toolchain with zero additional configuration.

4. **Auto-generated OpenAPI**: FastAPI generates OpenAPI 3.0 documentation automatically from type annotations. This enables contract-first API development without a separate documentation step — critical for coordinating with frontend (Next.js) and any future mobile clients.

5. **MASTER_CONTEXT.md resolves in FastAPI's favor**: The document explicitly names "Python (Django/FastAPI)." FastAPI is the more modern, async-native choice. Django is appropriate for monoliths with heavy ORM usage; FastAPI is appropriate for API-first service boundaries.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| Node.js / Express | Phase 3 AI/ML would require Python microservices anyway, creating a two-language stack. Node.js CPU-bound performance is poor for KYC OCR. Not aligned with existing Python CI toolchain. |
| Node.js / Fastify | Same reasons as Express. |
| Python / Django | Synchronous ORM is a constraint for high-concurrency booking paths. Heavier framework than needed for an API-first design. FastAPI is explicitly named alongside Django in MASTER_CONTEXT.md. |

---

## Migration Cost

**From decision to implementation**: Zero migration cost — no existing backend to migrate from.

**Future migration risk**: FastAPI services are Python; if a specific service needs Node.js (e.g., a real-time WebSocket server), it can be isolated without affecting other services. SQLAlchemy models can be reused across frameworks.

---

## Dependencies

- ADR-005 (Database) — SQLAlchemy 2.0 + GeoAlchemy2 on PostgreSQL + PostGIS
- ADR-012 (Queue) — Celery + Redis (Python-native queue worker)
- ADR-014 (API Style) — FastAPI generates OpenAPI 3.0 natively
- ADR-004 (AI Provider) — Python SDK integration in Phase 3

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-01 AuthGate | FastAPI security module handles JWT + OAuth2 flows |
| FC-03 Reservation | Async endpoint + SQLAlchemy async session for row-level locking |
| FC-05 OpsManager | Celery task receives checkout hook, dispatches turnover ticket |
| FC-06 Treasury | Celery beat scheduler for T+24h escrow release |
| Phase 3 AI | Direct Python ML library imports — no inter-language bridge |
| Hiring | Python engineers; strong pool in Egypt tech sector |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
