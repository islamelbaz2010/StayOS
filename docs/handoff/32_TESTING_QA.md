# 32 — Testing & QA

## State (verified 2026-10-04)
- **Backend:** 1644 tests, ~80.5% coverage (`pytest` + `pytest-asyncio`,
  `tests/` mirroring `src/app` modules).
- **Web:** 222 tests (Vitest + Testing Library) — includes IA/menu,
  i18n parity, regression tests for the language-selector bug.
- **Type safety:** `tsc --noEmit` clean; `mypy`/linters in CI.
- **E2E:** `tests/test_e2e_booking_lifecycle.py` — full
  request→pay→confirm→escrow→ledger flow against `stayos_e2e` DB
  (separate `E2E_DATABASE_URL`; must migrate that DB too).

## Test DB strategy
- Unit/integration: `stayos` test schema per `conftest.py` + `.env.test`.
- E2E: dedicated `stayos_e2e` database — pending migrations there are a
  known failure cause (see TROUBLESHOOTING).

## Conventions
- Business rules need tests — the 12%-economics E2E is the commercial
  model's executable spec; support RBAC tests lock the permission matrix.
- Web: colocated `*.test.tsx` (pages + `lib/queries` hooks); i18n parity
  test keeps `en.json`/`ar.json` key sets identical.
- Never weaken/skip tests to green a run; fixture drift is fixed at the
  fixture (e.g. `_make_conversation` gained support fields).

## Commands
```bash
pytest tests/ --cov=src/app            # backend
cd apps/web && npm test                # web
cd apps/web && npx tsc --noEmit        # types
cd apps/web && npm run build           # production build
```

## Manual QA gates (per release)
Prod `/health` (db, redis) → guest journey smoke → auth boundary (401s)
→ RTL page (`dir="rtl"`) → key authed surfaces.
