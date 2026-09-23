# StayOS — Marketing CMS Guide

The CMS-Lite lives inside StayOS Admin at **Admin → Content**
(`/<locale>/admin/content`). It manages marketing/editorial pages only —
it cannot touch listings, prices, bookings, payments, refunds, payouts,
KYC or any operational/financial control.

## What you can edit

- Marketing pages: home sections, about, how-it-works, host landing,
  guest landing, help, FAQ, contact, campaign/landing pages.
- Each page = metadata (slug, titles) + SEO + ordered content blocks.
- Media library entries (image reference + alt text en/ar).

## What you cannot edit

- Listings, prices, availability, reservations, reviews, earnings,
  payments, payouts, KYC, staff roles — these are product data, owned by
  Product/Engineering. The CMS has no access paths to them.

## Roles

- **Marketing** role group → `content` permission: full CMS access,
  nothing else.
- **Admin**: everything, including CMS.
- Other staff role groups have no CMS access unless granted `content`.

## Workflow

```
DRAFT → PREVIEW → PUBLISH → (edit → republish) → UNPUBLISH / RESTORE
```

1. **Create** a page: choose a slug (`about`, `host-landing`, …), add
   English and/or Arabic titles.
2. **Add blocks**: pick a block type; each carries a localized content
   payload `{ "en": {...}, "ar": {...} }`.
3. **Preview**: the editor's preview panel renders the draft exactly as
   the public site will — drafts are never visible publicly.
4. **Publish**: validates the page (needs a title, and every enabled
   block needs content in at least one locale), snapshots an immutable
   revision, and makes it live at `/<locale>/p/<slug>`.
5. **Edit a live page**: safe — the public site keeps serving the last
   published revision until you publish again.
6. **Unpublish**: takes the page off the public site (history kept).
7. **Restore**: any published revision can be restored to the draft
   working copy; publish it to go live again.

## Block types

| Type | Content fields (per locale) |
|---|---|
| `hero` | heading, subheading, cta_label, cta_href |
| `heading_text` | heading, body |
| `image_text` | heading, body, image_url, alt |
| `feature_cards` | heading, cards: [{title, body}] |
| `cta` | heading, cta_label, cta_href |
| `faq` | heading, items: [{question, answer}] |
| `testimonial` | items: [{quote, author}] |
| `banner` / `announcement` | text, link_label, link_href |
| `gallery` | images: [{url, alt}] |
| `rich_text` | body (plain text, newlines preserved) |

Disabled blocks are kept but never rendered publicly.

## Localization

- Write `en` and `ar` payloads for every block. If a locale is missing,
  the public site falls back to the other locale — publish both anyway.
- Arabic fields are edited in the same JSON payload (`"ar": {...}`).

## SEO

The page SEO object supports, per locale (`en`/`ar`): `title`,
`description`, `og_title`, `og_description`; plus page-level
`canonical`, `robots` (`index` / `noindex`), and `og_image_key`.
These feed the page `<title>`, meta description, canonical, OG tags and
robots directive automatically.

## Media

- Uploads use the platform's existing secure storage (S3 presign). While
  storage credentials are pending, register external image URLs with alt
  text instead — blocks reference `image_url`/`url` values.
- Always set alt text in both locales.

## Audit trail

Every publish records version, publisher, timestamp and an optional
note; every save records the editor. Revision history is visible in the
editor and restorable in one click.

## Guardrails

- Public endpoints serve **published revisions only** — drafts and
  unpublished changes can never leak to guests or search engines.
- Preview is permission-gated (content staff/admin only) and never
  indexable.
- If in doubt whether copy implies a product rule (fees, refunds,
  payout timing, verification claims), ask Product/Founder first.
