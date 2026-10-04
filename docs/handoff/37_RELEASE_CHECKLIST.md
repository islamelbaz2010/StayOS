# 37 — Release Checklist

## Before merge
- [ ] `pytest` green (backend) — coverage not regressed
- [ ] Web `npm test` + `tsc --noEmit` + `npm run build` green
- [ ] Both locale files updated for any new UI strings; parity test passes
- [ ] Alembic migration included + hand-reviewed (one per change)
- [ ] No secrets/credentials in diff; only `*.example` env changes
- [ ] Authz: new surface has server-side permission/ownership check
- [ ] Guest payloads free of internal fee economics

## Deploy
- [ ] Push to `product-completion-review` → Railway api/worker/beat deploy
- [ ] `main` → Vercel production
- [ ] `alembic upgrade head` via `railway connect` tunnel if migration exists
- [ ] `/health` → db ok, redis ok

## Post-deploy smoke (canonical URL only)
- [ ] Guest journey: `/search` → listing → quote (200s, EN+AR, `dir="rtl"`)
- [ ] Auth boundary: unauthenticated `/api/v1/messages/*` → 401
- [ ] Authed spot-check: bookings, messages, support
- [ ] Worker/beat alive (Railway service status)

## Rollback ready
- [ ] Prior Railway deployment + Vercel deployment identified
- [ ] Migration reversibility assessed (forward-fix preferred)
