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
| Final handoff commit | `git rev-parse main` at package time — application code at `cb31f94`; docs commits may follow (per the «rendered» rule above, the bundle's `main` ref is authoritative and clone-verified) |
| Application code commit | `cb31f94` — founder acceptance fixes (QA build, reactive auth, booking/payment, GH artifact) |
| Previous handoff commit | `cfa222a1156e31c9465800899d53e3fe31bda7f9` (pre-mobile-acceptance-fixes) |
| ZIP SHA256 | recorded in `STAYOS_SOURCE_HANDOFF_2026-10-04.zip.sha256` (a ZIP cannot contain its own hash — sidecar + release report carry it) |
| Bundle SHA256 | `5881374c4dd90c3706a85e08e682144d4f6439f5d582e291a36c039b39f0222e` — also in `STAYOS_GIT_HANDOFF_2026-10-04.bundle.sha256` |
| ZIP file count | **1,491** (from `unzip -l`) |
| Packaged at | 2026-10-04 (regenerated after mobile acceptance-fix commit `cb31f94`) |

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
- Archive SHA256 verification: sidecars generated + verified at package time

## Restore & run
`git clone STAYOS_GIT_HANDOFF_2026-10-04.bundle stayos` or unzip the ZIP;
then follow `docs/handoff/NEW_DEVELOPER_QUICKSTART.md`.
