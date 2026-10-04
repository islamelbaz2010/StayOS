# 23 — Help Center

## Implementation (Web)
Client-rendered content catalog — no CMS dependency for articles:

- `apps/web/lib/help/catalog.ts` — categories, ordering, role targeting.
- `articles-guest.ts` / `articles-host.ts` — article bodies (EN/AR).
- Routes: `/help` (browse + search), `/help/article/[slug]` (article +
  related/recommended), `/faq` (preserved standalone FAQ).

## Role-aware
Articles tagged guest / host / shared; the catalog filters by the viewer's
role. Host-only topics (payouts, readiness, moderation) hidden from guests.

## Design
- Search across titles + bodies, EN/AR.
- Related articles via category/tags.
- Full RTL support — article bodies authored bilingually, not machine-RTL'd.

## Extending
Add an entry to the relevant `articles-*.ts` + catalog registration; add
`help.*`/`helpCenter.*` strings to `messages/{en,ar}.json`. No backend
deploy needed — content is bundled.
