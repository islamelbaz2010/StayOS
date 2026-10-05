# Source Handoff Manifest — 2026-10-05

> **Rendered-copy rule:** the commit SHA, file counts, timestamps and
> SHA256 values below marked `«rendered»` are generated at package time.
> The **authoritative rendered manifest** ships inside the ZIP
> (`docs/handoff/SOURCE_HANDOFF_MANIFEST_2026-10-05.md`) and at the repo
> root alongside the archives. This committed copy documents the schema
> and all static fields. Self-referential values (a commit cannot contain
> its own SHA; a ZIP cannot contain its own hash) are resolved that way
> on purpose — `*.sha256` sidecar files carry the archive hashes.

## Archive
| Field | Value |
|---|---|
| ZIP filename | `STAYOS_SOURCE_HANDOFF_2026-10-05.zip` |
| Git bundle | `STAYOS_GIT_HANDOFF_2026-10-05.bundle` |
| Final handoff commit | `07c1ec9` — packaged at HEAD (bundle `--all` refs, clone-verified to `07c1ec96d594311b8c07d67eeb65b982f278012e`) |
| Application code commit | `07c1ec9` — mobile acceptance batch: traveler access, human-readable notifications, canonical money, account IA, Arabic RTL mirroring |
| Previous handoff commit | `ecde09e` (2026-10-04 package) |
| Bundle SHA256 | `c2ec5e3eaabe4e250fd497143fb5c1fcf0c760fab823e04d4823c4e04fb23ee0` — also in `STAYOS_GIT_HANDOFF_2026-10-05.bundle.sha256` |
| ZIP SHA256 | `4655a4f7c9b59bfcaabdfaa6adf8092e54687e3c09c18ebdb80655d7e051c061` — also in `STAYOS_SOURCE_HANDOFF_2026-10-05.zip.sha256` |
| ZIP file count | **1,259** (from Python `zipfile.namelist()`: 1,258 tracked files + rendered manifest) |
| Packaged at | 2026-10-05 (at `07c1ec9` after Railway deploy + post-deploy device verification) |

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
  `stayos_bulk_import_test_data.csv`, prior `2026-10-04` archives)

## Secret scan result
- Tracked working tree: **clean** — placeholders/test creds only
- Git history: **clean** — no `.env` ever committed
- Archive contents: **0** matches for env/secret/node_modules/build paths
- Archive SHA256 verification: sidecars generated + verified at package time

## Restore & run
`git clone STAYOS_GIT_HANDOFF_2026-10-05.bundle stayos` or unzip the ZIP;
then follow `docs/handoff/NEW_DEVELOPER_QUICKSTART.md`.
