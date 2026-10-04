# 06 — Backend Architecture

FastAPI + SQLAlchemy async + Alembic + Celery + Postgres + Redis.

## Module pattern (use it for new features)
```
src/app/<domain>/
  router.py       # FastAPI endpoints, auth deps, request/response
  services.py     # business logic, orchestration, authorization
  repository.py   # SQL — one place for queries
  models.py       # SQLAlchemy tables
  schemas.py      # pydantic request/response contracts
  constants.py    # enums + domain constants
  tasks.py        # celery jobs (optional)
  consumers.py    # outbox event handlers (optional)
  providers.py    # external API adapters (optional)
```

## Cross-cutting
- `app.config.Settings` — all env config, validated at import.
- `app.database` — `async_session`; routers get sessions via dependency.
- Errors: `app.shared.exceptions` (`NotFoundError`, `ValidationError`,
  `AuthorizationError`) → consistent HTTP mapping.
- `app.security` — audit log, PII redaction, rate limiting, secret hygiene.
- `app.shared.outbox` — transactional event outbox consumed by worker.
- RBAC: `user.role` ∈ guest/host/field_staff/staff/admin +
  `staff_permissions` ∈ listings, kyc, payments, operations, disputes,
  discovery, content, reports. Admins implicitly allowed.
- Auth: RS256 JWT access (15 min) + refresh (7 d); Firebase OTP/social for
  identity; `GET /auth/me` returns role/permissions.

## Async work
- `celery_app.py` — Redis broker. Worker runs outbox consumers
  (notifications, email, WhatsApp hooks), payment/finance side effects.
- Beat schedules: booking expiration, payment deadlines, payout cycles.

## Domain inventory (routers)
admin, auth, availability, bookings, cms, discovery, disputes, favorites,
finance, host, importer, kyc, listings, messages, notifications,
operations, payments, reports, reservations, reviews — 257 operations
(see `API_ROUTE_CATALOG.md`).

## Coverage gate
`pyproject.toml` enforces ≥80% — run focused tests with the full suite
expectation or use `-k` and accept the global coverage failure on partial
runs (selected tests still validate).
