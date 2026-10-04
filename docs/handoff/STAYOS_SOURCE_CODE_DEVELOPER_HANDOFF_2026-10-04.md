# StayOS — Source Code Developer Handoff
**Date: 2026-10-04 · Web = CLOSED · Phase 3 handoff · Phase 4 Mobile = ready**

A senior developer new to StayOS should be able to understand the whole
system from this file + the linked `docs/handoff/` handbook without
asking the founder architectural questions. Detail lives in the numbered
docs — this is the map + the non-negotiable facts.

## 1–4. Identity · purpose · state · repo
StayOS is an Airbnb-like hospitality marketplace for Egypt/Arab markets
(EN/AR, RTL). FastAPI backend, Next.js 14 web, Expo React Native mobile,
Postgres + Redis + Celery. Repo layout: `src/app` (backend domains),
`apps/web`, `apps/mobile`, `alembic/`, `tests/`, `docs/handoff/`.
→ `01_PROJECT_OVERVIEW.md`, `02_REPOSITORY_MAP.md`, `39_CURRENT_STATUS.md`

## 5–10. Architecture
- Runtime: Railway (`stayos-demo` api + worker + beat + Postgres) + Vercel
  (web) + Upstash Redis. → `03_ARCHITECTURE.md`, `04_RUNTIME_TOPOLOGY.md`
- Web: Next `[locale]` app router, next-intl, React Query, Tailwind.
  → `05_WEB_ARCHITECTURE.md`, `WEB_ROUTE_CATALOG.md`
- Backend: domain modules → routers/services/repositories; schemas per
  domain in Postgres. → `06_BACKEND_ARCHITECTURE.md`
- Mobile: Expo, SecureStore auth, axios + React Query, EN/AR RTL.
  → `07_MOBILE_ARCHITECTURE.md`, `MOBILE_SCREEN_CATALOG.md`
- DB: `08_DATABASE_SCHEMA.md`, `DATABASE_RELATIONSHIP_MAP.md`,
  `DATABASE_DEVELOPER_GUIDE.md`

## 11–26. Lifecycles & business logic
Auth/RBAC (RS256 JWT, roles + staff permissions, capability model) → `10`.
Booking: request→accept→pay→confirm→stay→complete; cancel by guest/admin
→ `11`. Listings: draft→submit→moderate→live → `12`. Host/guest → `13`.
KYC: **manual mode in prod**; Sumsub architecture implemented but
unprovisioned → `14`. Payments: Paymob Accept **live**; manual transfer
placeholder; **payout rail unprovisioned** → `15`, `20`. Refunds → `16`.
Ledger: double-entry, idempotent → `17`. **Commercial Model B (6+6=12%,
all-inclusive, guest-blind) is founder-locked** → `18`. VAT 14% assumption
→ `19`. Messaging + support (`SUPPORT` type, ops queue) → `21`, `22`.
Help center (bundled role-aware catalog) → `23`. Notifications (outbox)
→ `24`. Storage (private S3 buckets + presign) → `25`. i18n/RTL → `26`.

## 27–36. Platform
Admin console + field ops → `27`. Integrations matrix → `28`.
Env vars (88, generated reference) → `29` + `ENVIRONMENT_VARIABLES_REFERENCE.md`.
CI/CD: `ci.yml` is the real gate; **`deploy-*.yml` are stale AWS ECS —
ignore** → `30` + `CI_CD_WORKFLOW_MAP.md`. Deploy + migrations via
`railway connect` tunnel → `31`. Tests (1644 BE / 222 web) → `32`.
Security → `33`. Observability → `34`. Troubleshooting → `35` /
`TROUBLESHOOTING.md`. Onboarding → `36` + `NEW_DEVELOPER_QUICKSTART.md`.

## 37–42. Governance
Release checklist → `37`. Mobile readiness → `38` + mobile audits.
Status → `39`. Limitations → `40`. Founder decisions → `41`. ADRs → `42`.

## The five things that break StayOS if you ignore them
1. **Money:** ledger semantics + Model B are founder-locked and test-enforced.
2. **AuthZ:** every new surface needs server-side checks; UI hiding ≠ security.
3. **`context_booking_id` ≠ `booking_id`** on support conversations.
4. **Guest-facing payloads never expose fee internals.**
5. **Deploy reality = Railway/Vercel**, not the red AWS workflows.

## Exact next action
`MOBILE_PHASE_1_EXECUTION_PLAN.md` — support inbox, `/host/bookings`
filter parity, build profiles. No blockers.
