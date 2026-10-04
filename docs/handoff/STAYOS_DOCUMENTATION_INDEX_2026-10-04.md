# StayOS Documentation Index — 2026-10-04
**"Where do I start?" → read in this order.**

## CURRENT SOURCE OF TRUTH (in precedence order)
1. `STAYOS_SOURCE_CODE_DEVELOPER_HANDOFF_2026-10-04.md` — master doc
2. `STAYOS_CURRENT_STATUS_2026-10-04.md` — authoritative status matrix
3. Numbered docs `01`–`42` + catalogs under `docs/handoff/`
4. `StayOS_Legal_Accounting_Regulatory_Readiness_Egypt_2026-10-04_v4{,_AR}.pdf`
5. `StayOS_Marketing_Launch_Brief_V3_PRODUCT_UI.pdf`
6. `StayOS_Technical_Developer_Handoff_Workbook_2026-10-04_v4.xlsx`

**Anything outside this list that conflicts is NOT authoritative.**
80+ older documents across `docs/`, `reports/`, `.ai/`, `epos/`,
`knowledge/`, and `business/` are marked `STATUS: SUPERSEDED /
HISTORICAL` at the top of the file — including the old release
handoffs, "Single Source of Truth", engineering master plans, sprint
boards, audit reports, AWS-ECS deployment guides, ADRs predating the
Railway/Vercel move, and the old `.ai/CURRENT` agent rules (which
describe a stale Phase-0 state and an unresolved Paymob/Stripe
conflict — both long resolved). They are kept for evidence only — do
not use them for current-state answers.

## Start here
1. `STAYOS_SOURCE_CODE_DEVELOPER_HANDOFF_2026-10-04.md` — master doc
2. `01_PROJECT_OVERVIEW.md` — what StayOS is
3. `02_REPOSITORY_MAP.md` — where code lives
4. `03_ARCHITECTURE.md` + `04_RUNTIME_TOPOLOGY.md` — system shape
5. `NEW_DEVELOPER_QUICKSTART.md` — get it running

## Architecture deep-dives
| Need | Doc |
|---|---|
| Frontend | `05_WEB_ARCHITECTURE.md`, `WEB_ROUTE_CATALOG.md` |
| Backend | `06_BACKEND_ARCHITECTURE.md`, `09_API_CONTRACTS.md`, `API_ROUTE_CATALOG.md` |
| Mobile | `07_MOBILE_ARCHITECTURE.md`, `MOBILE_SCREEN_CATALOG.md`, `38_MOBILE_READINESS.md` |
| Database | `08_DATABASE_SCHEMA.md`, `DATABASE_RELATIONSHIP_MAP.md`, `DATABASE_DEVELOPER_GUIDE.md` |

## Business logic
`10_AUTH_AND_RBAC` · `11_BOOKING_LIFECYCLE` · `12_LISTING_LIFECYCLE` ·
`13_HOST_GUEST_LIFECYCLE` · `14_KYC_IDENTITY` · `15_PAYMENTS` ·
`16_REFUNDS` · `17_FINANCIAL_LEDGER` · `18_COMMERCIAL_MODEL` ·
`19_VAT_AND_TAX_ENGINEERING` · `20_PAYOUTS` · `21_MESSAGING` ·
`22_SUPPORT` · `23_HELP_CENTER` · `24_NOTIFICATIONS` ·
`25_STORAGE_AND_MEDIA` · `26_I18N_RTL` · `27_ADMIN_AND_OPERATIONS`

## Platform
`28_INTEGRATIONS` · `29_ENVIRONMENT_CONFIGURATION` +
`ENVIRONMENT_VARIABLES_REFERENCE` · `30_CI_CD` + `CI_CD_WORKFLOW_MAP` ·
`31_DEPLOYMENT` · `32_TESTING_QA` · `33_SECURITY` · `34_OBSERVABILITY` ·
`35_TROUBLESHOOTING` / `TROUBLESHOOTING` · `36_DEVELOPER_ONBOARDING` ·
`37_RELEASE_CHECKLIST`

## Mobile phase
`MOBILE_GAP_AUDIT_2026-10-04` · `MOBILE_API_PARITY_2026-10-04` ·
`MOBILE_PHASE_1_EXECUTION_PLAN`

## Governance
`39_CURRENT_STATUS` + `STAYOS_CURRENT_STATUS_2026-10-04` ·
`40_KNOWN_LIMITATIONS` · `41_FOUNDER_DECISIONS` ·
`42_ARCHITECTURAL_DECISIONS` · `SOURCE_CODE_CATALOG{.json,.md}` ·
`SOURCE_HANDOFF_MANIFEST_2026-10-04`

## External artifacts (repo root)
- `StayOS_Technical_Developer_Handoff_Workbook_2026-10-04_v4.xlsx`
- `StayOS_Legal_Accounting_Regulatory_Readiness_Egypt_2026-10-04_v4{,_AR}.pdf`
- `StayOS_Marketing_Launch_Brief_V3_PRODUCT_UI.pdf`
- `STAYOS_SOURCE_HANDOFF_2026-10-04.zip` (+ optional `.bundle`)
