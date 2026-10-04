# 05 — Web Architecture

Next.js 14 App Router + TypeScript + Tailwind + next-intl + TanStack Query.

## Structure
- `app/[locale]/` — all routes localized (`en`/`ar`), middleware resolves locale.
- Layouts: `GuestLayout`, `HostLayout`, `AdminLayout` (`components/layouts/`).
- `ProtectedRoute` (`components/auth/`) — client gate; backend authoritative.
- `lib/auth/` — auth context (Firebase OTP + backend session JWT in SecureStore-free
  web storage), `useAuth()`.
- `lib/queries/` — one hook module per domain; all data access flows through
  `lib/api.ts` (axios → `NEXT_PUBLIC_API_URL` → `/api/v1`).
- `lib/help/` — Help Center typed catalog (`catalog.ts`, `articles-guest.ts`,
  `articles-host.ts`) with 17 unit tests.
- `messages/en.json`, `messages/ar.json` — full translation catalogs.

## State & data patterns
- React Query everywhere (`refetchInterval` on live surfaces: 30s bookings).
- Filters persist in URL search params (shareable; stale selections cleared
  by effects that re-validate against active filters).
- Money: displayed verbatim from API — the client never computes prices.
- Role awareness: UI reads `user.role` + `user.staff_permissions` for hiding;
  server rejects unauthorized calls regardless.

## Header / account menu
Two-level hierarchical menu (`AccountMenuLevels` in
`components/layouts/Header.tsx`): root shows category rows
(Account / Hosting / Admin Console / Preferences / Help & Support / Sign out)
that drill into compact submenus with a Back row. Shared by the desktop
dropdown and the mobile drawer; aggregate badges roll up to group rows.

## i18n / RTL
`dir=rtl` driven by locale; all strings via `useTranslations(namespace)`.
Language names are literals ("English" / "العربية"), never translation keys
— the `bg-primary-700` dead-token bug that rendered the active language
invisible is fixed; convention is `bg-brand-900`.

## Help Center / Support
`/help` — role-aware searchable article catalog + `/help/article/[slug]`;
`/faq` preserved. `/support` — authenticated support chat; `/admin/support`
— ops inbox behind `operations` permission.
