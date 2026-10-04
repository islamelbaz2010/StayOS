# 03 — Architecture Overview

## Shape
Classic modular monolith + SPA + mobile app:

```
┌──────────┐   ┌──────────┐        ┌──────────────────────────────┐
│ Next.js  │   │ Expo RN  │  JWT   │ FastAPI (uvicorn ×4, Docker) │
│  web     │──▶│  mobile  │───────▶│  /api/v1/* routers            │
└──────────┘   └──────────┘        └──────┬───────────────┬───────┘
                                          │               │
                                   ┌──────▼─────┐  ┌──────▼──────┐
                                   │ Postgres   │  │ Redis        │
                                   │ (Railway)  │  │ (cache,     │
                                   │            │  │  locks,      │
                                   │            │  │  rate-limits)│
                                   └────────────┘  └─────────────┘
                                          ▲
                          ┌───────────────┴────────────┐
                          │ celery worker + celery beat │
                          │ (same image, outbox events, │
                          │  expirations, notifications)│
                          └────────────────────────────┘
```

## Key architectural decisions
1. **Modular monolith**, not microservices — one deployable API, domains
   isolated as packages with router/services/repository layering.
2. **Async everything** — SQLAlchemy async + asyncpg; uvicorn 4 workers.
3. **Outbox pattern** — notifications/audit/events written to an outbox
   table in the request transaction, consumed by the worker. Support
   messages notify the ops queue through the same path.
4. **Server-side truth** — every role/permission check, fee split, and
   privacy boundary is enforced in services/repository, never trusted
   from the client. Web hides UI for UX only.
5. **Escrow-style funds-held model** — payment capture recognizes
   platform revenue + VAT into the ledger; host net stays as an escrow
   liability until release (check-in + 24h). See `17_FINANCIAL_LEDGER`.
6. **Capability-based booking detail** — the same booking page adapts by
   viewer relationship (owner/host/co-host/staff), not by hard role.
7. **Idempotency-first finance** — capture, recognition, release and
   refund each have idempotency keys; replays self-heal.
8. **Single source of pricing** — all-inclusive quote computed server-
   side; the UI never recomputes money.

## Where things live
- HTTP entry: `src/app/main.py` — CORS, security middleware, routers under `/api/v1`.
- DB session: `src/app/database.py` (`async_session`).
- Settings: `src/app/config.py` — single `Settings` object, env-driven.
- Worker: `src/app/celery_app.py`; periodic jobs in each module's `tasks.py`.
- Notifications fan-out: `src/app/notifications/` + `shared/outbox.py`.
