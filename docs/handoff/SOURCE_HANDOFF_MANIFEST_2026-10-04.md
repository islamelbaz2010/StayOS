# Source Handoff Manifest — 2026-10-04

> **Rendered-copy rule:** the commit SHA, file counts, timestamps and
> SHA256 values below marked `«rendered»` are generated at package time.
> The **authoritative rendered manifest** ships inside the ZIP
> (`docs/handoff/SOURCE_HANDOFF_MANIFEST_2026-10-04.md`) and at the repo
> root alongside the archives. This committed copy documents the schema
> and all static fields. Self-referential values (a commit cannot contain
> its own SHA; a ZIP cannot contain its own hash) are resolved that way
> on purpose — `*.sha256` sidecar files carry the archive hashes.

## Archive
| Field | Value |
|---|---|
| ZIP filename | `STAYOS_SOURCE_HANDOFF_2026-10-04.zip` |
| Git bundle | `STAYOS_GIT_HANDOFF_2026-10-04.bundle` |
| Final handoff commit | `«rendered»` — the commit whose tree the ZIP archives; equals `git rev-parse main` at package time and the bundle's `main` ref |
| `product-completion-review` ref | `«rendered»` — local ref SHA at package time; `main` is the authoritative head (review is an ancestor) |
| ZIP SHA256 | `«rendered»` — also in `STAYOS_SOURCE_HANDOFF_2026-10-04.zip.sha256` |
| Bundle SHA256 | `«rendered»` — also in `STAYOS_GIT_HANDOFF_2026-10-04.bundle.sha256` |
| ZIP file count | `«rendered»` (computed from the archive listing) |
| Source files (py/ts/tsx/js) | `«rendered»` |
| Documentation files | `«rendered»` |
| `docs/handoff` files | `«rendered»` |
| Packaged at | `«rendered»` |

## Included
- `src/app/**` backend (all domain modules), `alembic/**`, `tests/**`
- `apps/web/**` source incl. `lib/openapi.json` (API contract export)
- `apps/mobile/**` Expo source (app.json, eas.json, screens, lib)
- `docs/**` incl. the complete `docs/handoff/` handbook
- `scripts/**`, `.github/workflows/**`, configs, manifests + locks,
  locale catalogs (`messages/{en,ar}.json`), `*.env.example` files
- Generated artifacts: workbook v4, legal pack v4 EN/AR, marketing brief V3

## Excluded (verified absent from archive)
- `.env`, `.env.staging`, `apps/web/.env.local`, `apps/mobile/.env`
  (untracked secret-bearing files)
- `node_modules/`, `.next/`, `dist/`, caches, coverage, logs, `.DS_Store`
- Production data, DB dumps, uploads
- Superseded root artifacts (v2/v3 PDFs, v3 workbook, investor decks,
  `stayos_bulk_import_test_data.csv`)

## Secret scan result
- Tracked working tree: **clean** — placeholders/test creds only
- Git history (444+ commits): **clean** — no `.env` ever committed
- Archive contents: **0** matches for env/secret/node_modules/build paths
- Archive SHA256 verification: `«rendered»`

## Restore & run
`git clone STAYOS_GIT_HANDOFF_2026-10-04.bundle stayos` or unzip the ZIP;
then follow `docs/handoff/NEW_DEVELOPER_QUICKSTART.md`.
