# 26 — i18n & RTL

## Web
- `next-intl`, locale segment `app/[locale]/*` — `en` and `ar`.
- Message catalogs `apps/web/messages/{en,ar}.json` (~2000 keys each) —
  must stay key-parity; tests catch drift (`i18n-parity` checks in CI).
- `dir="rtl"` set on `<html>` for `ar` (verified in production HTML);
  logical CSS utilities preferred over `left/right` physical props.
- Language selector on `/account-settings/language` — literal labels
  `English`/`العربية`; persists to `user.locale` via profile API and
  updates the URL segment. Active state uses `brand-900` (regression:
  dead `primary-700` token fixed — see TROUBLESHOOTING).
- Numbers/dates: locale-aware formatting via next-intl + intl APIs.

## Backend
- `notification_templates` carry EN/AR bodies; user locale picks the body.
- Validation/messages that surface to clients are translated where the
  contract exposes localized fields.

## Mobile
- `apps/mobile/src/lib/i18n.ts` — AsyncStorage persistence, EN/AR, RTL
  layout switching (`I18nManager`) with app reload for direction change.

## Rules
- Never hardcode user-facing strings — always through catalogs.
- New UI string → add to both locale files in the same commit.
- RTL chevrons/carousels must mirror (`scale-x-100`/`-scale-x-100` pattern
  in Header submenus, swiper config).
