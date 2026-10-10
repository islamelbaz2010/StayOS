# 01 — Project Overview

## Identity
- **Product:** StayOS — Airbnb-like hospitality marketplace for Egypt / Arab markets.
- **Repo:** `islamelbaz2010/StayOS` (monorepo: FastAPI backend + Next.js web + Expo mobile).
- **Production web:** <https://web-amber-pi-98.vercel.app> (Vercel, tracks `main`)
- **Production API:** <https://stayos-demo-production.up.railway.app> (Railway project `stayos-demo`)

## Product purpose
Marketplace connecting guests and hosts for short-term stays in Egypt.
All-inclusive guest pricing under **Commercial Model B**: platform share is
12% of accommodation (host 6% + guest 6%), VAT 14% engineering assumption
(accountant-to-confirm). Guests never see internal fee splits.

## Current state (2026-10-04)
- **Web: CLOSED.** Latest closure commit `53625cb` (hierarchical account
  menu, language selector fix, responsive host reservation filters).
- **Backend:** deployed on Railway (api + celery worker + celery beat +
  Postgres + Redis). Alembic head `053_support_conversations`.
- **Tests:** backend 1644 passed (80.46% coverage), web 222 passed, tsc clean,
  Next build clean.
- **Mobile:** substantive Expo app — the next execution phase.
- **Phase:** PHASE 3 (handoff) in progress → PHASE 4 (Mobile) next.

## Benchmark policy
Airbnb is a benchmark for behavior/IA only — never copy branding, assets,
proprietary content, or Airbnb-only features (Experiences, AirCover, gift
cards, co-host marketplace…). StayOS copy and business rules are authoritative.

## Hard rules
- Never change Commercial Model B, VAT rate, payout timing without a founder decision.
- Never expose internal 6%/12% splits, host commission, or platform revenue to guests.
- Never invent contact details, payment providers, or capabilities.
- Guest-facing wording uses "funds held" — never "legal escrow".
- All RBAC enforcement is server-side; client hiding is cosmetic only.
