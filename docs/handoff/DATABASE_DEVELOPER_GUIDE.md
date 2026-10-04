# Database Developer Guide

Companion to `08_DATABASE_SCHEMA.md` (full table inventory) and
`DATABASE_RELATIONSHIP_MAP.md` (ER map). Operational details here.

## Connection model
- `src/app/database.py` — async engine (`postgresql+asyncpg`), pooled
  `async_session` injected per-request via FastAPI dependency.
- Tests override with `stayos_test` (conftest) and `stayos_e2e` (e2e file).

## Schema ownership
Each backend module owns its DB schema (see `08_DATABASE_SCHEMA.md` table).
Cross-schema FKs exist (e.g. `messaging.conversations → booking.bookings`,
`finance.* → reservation.*`) — treat them as stable contracts.

## Financial invariants
- `ledger_entries` is append-only; reversals are new rows, never UPDATE/DELETE.
- `escrow_accounts.balance == amount − recognised(revenue + VAT)` — the
  `scripts/verify_financial_truth.py` script proves this per escrow.
- All money uses numeric/Decimal; rounding is quantized in services.

## Idempotency model
- Escrow recognition keyed by `escrow-recognize` transaction type +
  ledger-existence check — replays self-heal.
- Payment capture/webhook handlers dedupe by provider transaction reference.

## Audit & soft-delete
- `security.audit_logs` — append-only audit trail (actor, action, target).
- No broad soft-delete pattern; lifecycle is status-driven (booking/listing
  statuses), history preserved by design.

## Migration procedure (production)
1. `railway connect Postgres --ssh --tunnel-only -P 5433` (service: Postgres).
2. `DATABASE_URL="postgresql+asyncpg://postgres:<pw>@127.0.0.1:5433/railway" .venv/bin/alembic upgrade head`
3. Close tunnel. Alembic prints each applied revision; `alembic current` verifies head.

## Seed data
`scripts/seed_acceptance.py|_guest|_staff` — deterministic acceptance users,
units, bookings (`seed-*` IDs). `scripts/seed_demo_supply.py`, `seed_cms_pages.py`
for catalog/content. Never run seeds against production data you care about
without checking the script's upsert semantics first.
