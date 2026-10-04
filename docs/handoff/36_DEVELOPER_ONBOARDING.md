# 36 — Developer Onboarding

Fast path: **`NEW_DEVELOPER_QUICKSTART.md`** — this doc is the "why" around it.

## Week-one map
1. `STAYOS_SOURCE_CODE_DEVELOPER_HANDOFF_2026-10-04.md` (master) →
   `01_PROJECT_OVERVIEW` → `02_REPOSITORY_MAP` → `03_ARCHITECTURE`.
2. Set up locally per quickstart; get `/health` + web `/search` green.
3. Read the domain docs for your area (booking/payments/KYC/etc.).
4. Run the test suites once before touching anything.

## Where things live
- Business logic → `src/app/<domain>/services.py` (never in routers).
- Money → `src/app/finance` + ledger entries; commercial model is
  founder-locked (`18_COMMERCIAL_MODEL.md`).
- Permissions → service-layer checks; mirror any new surface's UX gating
  with the server check.
- Translations → both `messages/{en,ar}.json` in the same commit.

## Safe-modification rules
- Don't change the commercial model, ledger posting semantics, or
  authz checks without a founder decision + test updates.
- Don't add fee lines to guest-facing payloads.
- Alembic: one migration per change; autogen then review by hand.
- Support threads use `context_booking_id`, never `booking_id` (that FK
  is reserved for the unique reservation thread).
- Optional integrations fail closed — feature-flag new third parties.
