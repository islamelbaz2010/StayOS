# S1-04_COMPLETION_REPORT.md

## 1. Changes Made

Created the reusable Listing Card component for Sprint 1 search results.

- Added `ListingCard` client component in `apps/web/components/listings/ListingCard.tsx`.
- Added `ListingCardSkeleton` component in `apps/web/components/listings/ListingCardSkeleton.tsx`.
- Exported a shared `Listing` interface from `ListingCard.tsx` for use by future tasks.
- Added a local placeholder image at `apps/web/public/placeholder.svg` for listings with no `coverImage`.
- Updated `apps/web/lib/utils.ts` `formatMoney` to accept an optional currency while defaulting to `EGP`.
- All visible text uses i18n keys from `messages/ar.json` and `messages/en.json`.

## 2. Files Modified

- `apps/web/lib/utils.ts`

## 3. Components Created

- `apps/web/components/listings/ListingCard.tsx`
- `apps/web/components/listings/ListingCardSkeleton.tsx`
- `apps/web/public/placeholder.svg`

## 4. Accessibility Verification

- The entire card is a single semantic `<article>` containing one `<Link>`.
- The link has an `aria-label` combining the listing title and city.
- Image has `alt` text set to the listing title.
- Focus states use `focus-within:ring-2` and `focus-visible:ring-2` with the brand color.
- Skeleton has `aria-label="Loading listing"` and uses `aria-hidden` on individual skeleton bars via the existing `Skeleton` component.
- Components are keyboard accessible and use standard Next.js `Link` navigation.

## 5. Verification Results

| Command | Result |
|---------|--------|
| `npm --prefix apps/web run lint` | PASS — `No ESLint warnings or errors` |
| `npm --prefix apps/web run type-check` | PASS — `tsc --noEmit` exit 0 |
| `npm --prefix apps/web run build` | PASS — build completed with 4 routes |

## 6. Remaining Issues

None for S1-04.

## 7. Ready for S1-05?

**YES**
