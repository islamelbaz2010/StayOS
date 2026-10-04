# 08 — Database Schema & Developer Guide

## Provider & layout
Postgres (Railway managed in prod, local in dev). Multi-schema:

| Schema | Owner | Key tables |
|---|---|---|
| `auth` | auth | `users`, `accounts`, `refresh_tokens`, `device_tokens`, `staff_permissions` |
| `pms` | listings/ops | `units`, `unit_listings`, `unit_photos`, `calendar_rules` |
| `booking` | bookings | `bookings`, `booking_offers` |
| `reservation` | reservations | `reservations`, `payment_intents`, `promo_*` |
| `payments` | payments | `payments` |
| `finance` | finance | `wallets`, `escrow_accounts`, `financial_transactions`, `ledger_entries`, `payout_requests`, `commercial_adjustments` |
| `messaging` | messages | `conversations`, `conversation_participants`, `messages`, `message_templates` |
| `notifications` | notifications | `notifications`, `notification_templates` |
| `kyc` | kyc | `kyc_documents` |
| `reviews` | reviews | `reviews`, `review_reports` |
| `disputes` | disputes | `disputes` |
| `favorites` | favorites | `user_favorites`, `location_aliases` |
| `cms` | cms | `pages`, `blocks`, `revisions`, `media` |
| `discovery` | discovery | `discovery_configs`, `discovery_runs`, `discovery_candidates` |
| `operations` | operations | `field_staff`, `operation_tasks`, `task_events`, `maintenance_requests`, `property_readiness`, `recurring_maintenance` |
| `security` | security | `audit_logs` |
| shared | shared | `outbox_events` |

## Critical constraints (do not violate)
- `messaging.conversations.booking_id` UNIQUE — one reservation conversation
  per booking. Support threads use `context_booking_id` (nullable, not unique)
  precisely to avoid colliding.
- `uq_staff_permission(user_id, permission)`, `uq_user_favorite`,
  `uq_review_booking_role(booking_id, reviewer_role)` — duplicate prevention.
- `finance.escrow_accounts.reservation_id` UNIQUE — one escrow per stay.
- Money columns are `Decimal`/numeric (migration `049_decimal_money`) — never
  float math.

## Enums of consequence
`ConversationType` = reservation/inquiry/support; `SupportStatus` =
open/waiting_for_support/waiting_for_user/resolved; `ParticipantRole` =
guest/host/co_host/support/system; `UserRole` = guest/host/field_staff/staff/admin;
booking statuses incl. requested/accepted/confirmed/completed/rejected/
cancelled/no_show.

## Migrations
- Alembic head: `053_support_conversations`. Chain 049→053 adds decimal money,
  commercial adjustments, account profile R1, KYC provider fields, support
  conversation columns.
- Local dev: `DATABASE_URL=postgresql+asyncpg://…/stayos .venv/bin/alembic upgrade head`.
- e2e DB is separate (`stayos_e2e`) — migrate it as well or the e2e test fails.
- Production: SSH tunnel via `railway connect Postgres --ssh --tunnel-only`,
  run alembic against `127.0.0.1:<port>`. Migrations are additive-only
  (nullable columns / new tables / indexes) — safe before code deploys.
- Never edit an applied migration — create a new revision.

## Seeds & test DB
`scripts/seed_acceptance*.py` create deterministic users/units
(`seed-accept-gues-…`, `seed-host-…`, `seed-admin-…`, `seed-staff-…`).
`tests/conftest.py` uses `stayos_test` + heavy AsyncMock service tests.
