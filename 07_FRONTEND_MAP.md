# 07_FRONTEND_MAP

## Purpose

This document maps the frontend application structure, routing, pages, layouts, localization, styling, and build configuration.

## Application Location

- Path: `apps/web/`
- Framework: Next.js 14 with the App Router (`app/` directory)
- Language: TypeScript
- Styling: Tailwind CSS
- Package manager: `npm` / `pnpm` (CI uses `pnpm`)

## Build Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts: `dev`, `build`, `start`, `lint`, `type-check` |
| `next.config.mjs` | React Strict Mode, SWC minify |
| `tsconfig.json` | TypeScript compiler options |
| `tailwind.config.ts` | Tailwind content paths and theme |
| `.eslintrc.json` | ESLint rules |
| `next-env.d.ts` | Next.js TypeScript declarations |
| `tsconfig.tsbuildinfo` | Incremental build info |

## Page Structure

```mermaid
graph LR
    ROOT[app/page.tsx]
    AR[app/ar/page.tsx]
    LAYOUT[app/layout.tsx]
    LOCALE_LAYOUT[app/[locale]/layout.tsx]
    LOCALE_PAGE[app/[locale]/page.tsx]
    SEARCH[app/[locale]/search/page.tsx]

    ROOT -->|redirect| AR
    AR --> LOCALE_LAYOUT
    LOCALE_LAYOUT --> LOCALE_PAGE
    LOCALE_PAGE -->|redirect| SEARCH
```

## Pages

| Route | File | Behavior |
|-------|------|----------|
| `/` | `app/page.tsx` | Redirects to `/ar` |
| `/ar` | `app/ar/page.tsx` | Arabic route segment |
| `/[locale]` | `app/[locale]/page.tsx` | Validates locale (`ar` or `en`), redirects to `/{locale}/search` |
| `/[locale]/search` | `app/[locale]/search/page.tsx` | Search page with destination input form |

## Layouts

### Root Layout (`app/layout.tsx`)

- Wraps all pages.
- Sets HTML `lang="ar"` and `dir="rtl"` by default.
- Renders `{children}` directly.

### Locale Layout (`app/[locale]/layout.tsx`)

- Validates `locale` is either `ar` or `en`.
- Returns `notFound()` for unsupported locales.
- Sets `dir` to `rtl` for `ar` and `ltr` for `en`.
- Sets `lang` to the selected locale.

## Search Page

- File: `app/[locale]/search/page.tsx`
- Accepts `?q=...` query parameter.
- Displays an Arabic-first search form with destination placeholder.
- Renders a message indicating the current search query or prompt.
- No external data fetching is wired on this page.

## Utilities

- File: `lib/utils.ts`
- `cn(...inputs)` — merges `clsx` and `tailwind-merge` for conditional Tailwind classes.
- `formatMoney(amount)` — formats EGP using `Intl.NumberFormat` with `ar-EG`.
- `formatDate(date, locale)` — formats a date using `Intl.DateTimeFormat`.

## Internationalization

- Locale support: `ar` (Arabic), `en` (English)
- Message files:
  - `messages/ar.json`
  - `messages/en.json`
- Structure: nested `common` and `search` keys.
- The i18n implementation is file-based; the current pages use inline Arabic strings in the search page and the root layout hard-codes `ar`.

## Styling

- Tailwind CSS via `tailwindcss`, `postcss`, `autoprefixer`.
- Tailwind content configuration includes `pages/`, `components/`, and `app/` directories.
- Search page uses Tailwind utility classes for layout, form inputs, and buttons.
- No custom components directory exists in `apps/web/`; all markup is inline in pages.

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| next | 14.0.4 | Framework |
| react | ^18.2.0 | UI library |
| react-dom | ^18.2.0 | DOM renderer |
| clsx | ^2.0.0 | Conditional classes |
| tailwind-merge | ^2.0.0 | Merge Tailwind classes |
| tailwindcss | ^3.3.5 | Styling |
| postcss | ^8.4.31 | CSS processing |
| autoprefixer | ^10.4.16 | CSS autoprefixing |
| eslint | ^8.54.0 | Linting |
| eslint-config-next | 14.0.4 | Next.js lint rules |
| typescript | ^5.3.2 | Type checking |

## Frontend Build Pipeline

1. `pnpm install` — install dependencies.
2. `pnpm lint` — ESLint.
3. `pnpm type-check` — `tsc --noEmit`.
4. `pnpm build` — Next.js production build.
5. `pnpm start` — Next.js production server.

## Frontend-to-Backend Connection

- The Next.js application does not currently contain an API client or data layer.
- It is designed to call the FastAPI backend over HTTP at runtime (`CORS_ORIGINS` in `app.config` includes `http://localhost:3000`).
- The search page is a static form and does not yet fetch results from `/api/v1/listings`.
