# Source Handoff Manifest — 2026-10-04

## Archive
| Item | Value |
|---|---|
| Filename | `STAYOS_SOURCE_HANDOFF_2026-10-04.zip` |
| Size | 7.0 MB |
| Total files | 1,128 |
| Source files (py/ts/tsx/js) | 496 |
| Documentation files | 197 (incl. `docs/handoff/` 59) |
| Base commit | `main @ 53625cb` (web-closure head) |

## Included
- `src/app/**` backend (all domain modules), `alembic/**`, `tests/**`
- `apps/web/**` source incl. `lib/openapi.json` (API contract export)
- `apps/mobile/**` Expo source (app.json, eas.json, screens, lib)
- `docs/**` incl. the complete `docs/handoff/` handbook (42 numbered docs
  + catalogs + mobile audit set + this manifest)
- `scripts/**`, `.github/workflows/**`, configs, package manifests + locks,
  locale catalogs (`messages/{en,ar}.json`), `*.env.example` files
- Generated artifacts: workbook v4, legal pack v4 EN/AR, marketing brief V3

## Excluded (verified absent from archive)
- `.env`, `.env.staging`, `apps/web/.env.local`, `apps/mobile/.env` (untracked secrets)
- `node_modules/`, `.next/`, `dist/`, caches, coverage, logs, `.DS_Store`
- Production data, DB dumps, uploads — never packaged
- Superseded root artifacts (v2/v3 PDFs, v3 workbook, investor decks,
  `stayos_bulk_import_test_data.csv`) — known omission: superseded
  versions; recoverable from git if ever needed

## Secret scan result
- Tracked working tree: **clean** — placeholders/test creds only
- Git history (444 commits): **clean** — no `.env` ever committed;
  only `*.example`/test files
- Archive contents: **0** matches for env/secret/node_modules/build paths

## Git bundle
`STAYOS_GIT_HANDOFF_2026-10-04.bundle` — 33 MB, refs `main` (53625cb) +
`product-completion-review`, complete sha1 history, verified.
Restore: `git clone STAYOS_GIT_HANDOFF_2026-10-04.bundle stayos`.
Note: local `product-completion-review` ref (4348e20) lags the deployed
ref; `main` is the authoritative head and contains it.

## Restore & run
See `docs/handoff/NEW_DEVELOPER_QUICKSTART.md` — unzip → `.env.example` →
venv/deps → Postgres+Redis → `alembic upgrade head` → uvicorn + Next +
Expo.
