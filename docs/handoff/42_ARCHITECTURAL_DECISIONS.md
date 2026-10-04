# 42 — Architectural Decision Records (condensed)

| ADR | Decision | Rationale | Consequence |
|---|---|---|---|
| 1 | Domain-per-module `src/app/<domain>` with router/service/repository layers | testability, team-scale ownership | routers stay thin; business rules live in services |
| 2 | PostgreSQL schemas per domain (`auth`, `pms`, `booking`, `finance`, `messaging`, …) | logical isolation in one DB | cross-schema FKs allowed; migrations touch schema-qualified tables |
| 3 | Double-entry ledger, no mutable balances | auditability + idempotent finance | reads sum entries; reversal via counter-entries |
| 4 | Idempotency keys on every money move | webhook/retry safety | safe replays by design |
| 5 | Support as a messaging `SUPPORT` type (`context_booking_id`) | reuse participants/unread/notifications; avoid colliding with the unique `booking_id` reservation thread | one conversation subsystem for everything |
| 6 | Presigned S3 URLs, private buckets, `s3://` refs | API never proxies media; KYC media isolated | CORS + TTL tuning required |
| 7 | RS256 JWT + rotating refresh | revocable sessions, key-rotation ready | keys via env; refresh table |
| 8 | next-intl `[locale]` segment + bundled catalogs | SEO-friendly locale URLs; type-safe keys | parity test guards drift |
| 9 | Celery beat + outbox for notifications | money transactions never block on delivery | notification lag possible; retry by design |
| 10 | Capability model for booking detail (owner/host/staff scopes) | one screen, relationship-based actions | server returns `permission_scope`; UI adapts |
| 11 | Railway+Vercel deploy (not the AWS workflows) | ops simplicity for current scale | `deploy-*.yml` stale — flagged |
| 12 | KYC provider abstraction + manual-first mode | unblock launch without Sumsub provisioning | activation = config + creds, no rewrite |
