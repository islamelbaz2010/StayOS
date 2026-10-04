# 02 — Repository Map

```
StayOS/
├── src/app/                    # FastAPI backend (PYTHONPATH=src)
│   ├── main.py                 # app factory, middleware, router wiring
│   ├── config.py               # pydantic-settings — ALL env vars (88)
│   ├── database.py             # async engine/session
│   ├── celery_app.py           # worker+beat config
│   ├── auth/                   # users, sessions, OTP, JWT, device tokens
│   ├── listings/               # units, listings, photos, discovery
│   ├── availability/           # calendar rules
│   ├── bookings/               # booking lifecycle, offers, cancellation
│   ├── reservations/           # stay operations (check-in/out)
│   ├── payments/               # Paymob Accept, payment proofs, refunds
│   ├── finance/                # ledger, escrow/funds-held, VAT, payouts
│   ├── messages/               # conversations (reservation/inquiry/support)
│   ├── notifications/          # in-app + outbox notifications
│   ├── host/                   # host dashboard, earnings, calendar, profile
│   ├── kyc/                    # identity verification (provider-agnostic)
│   ├── reviews/                # reviews + moderation
│   ├── favorites/              # guest favorites
│   ├── admin/                  # admin/staff users & permissions
│   ├── operations/             # staff ops (moderation, payouts)
│   ├── disputes/               # dispute workflows
│   ├── reports/                # KPI + report registry (575-line queries.py)
│   ├── cms/                    # content pages, revisions
│   ├── discovery/              # supply discovery pipeline
│   ├── importer/               # bulk listing import
│   ├── security/               # audit, PII, rate limiting, secrets
│   └── shared/                 # outbox, storage, middleware, redis
├── alembic/versions/           # 53 migrations (head: 053_support_conversations)
├── tests/                      # pytest suite (1644 tests, 80% gate)
├── apps/
│   ├── web/                    # Next.js 14 App Router, next-intl, React Query
│   │   ├── app/[locale]/       # 70 routes (see WEB_ROUTE_CATALOG.md)
│   │   ├── components/         # layouts, auth, help, support, kyc, listings…
│   │   ├── lib/                # auth ctx, queries/, help/ catalog, api.ts
│   │   └── messages/           # en.json + ar.json (typed catalogs)
│   └── mobile/                 # Expo RN app (com.stayos.mobile)
│       ├── App.tsx             # navigator + role-aware home
│       ├── src/screens/        # 16 guest + 12 host screens
│       ├── src/lib/            # api.ts (SecureStore), hooks.ts, i18n, push
│       └── app.json, eas.json  # Expo/EAS config
├── infra/docker/api|web/       # production Dockerfiles
├── scripts/                    # seeds, staging helpers, openapi export,
│                               # backup/restore, financial verification
├── docs/                       # product/eng docs (+ handoff/ — this pack)
├── .github/workflows/          # 8 workflows (see CI_CD_WORKFLOW_MAP.md)
├── railway.toml                # Railway build config (Dockerfile builder)
├── requirements.txt            # backend deps
├── pyproject.toml              # pytest/coverage/lint config (80% gate)
└── .env.example / .env.staging.example / .env.test
```

## Conventions
- Backend layering: `router → services → repository → models`; `schemas.py`
  holds Pydantic contracts; `constants.py` holds domain enums.
- Every domain module follows the same file layout — copy an existing module
  when adding a feature.
- Web data access goes through `lib/queries/*` React Query hooks only.
- `next.config`/middleware enforce locale routing: `/en/…`, `/ar/…`.
