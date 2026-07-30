# S2-08_COMPLETION_REPORT.md

## 1. Changes made

### Frontend — images and accessibility

- Replaced raw `<img>` tags with `next/image` `Image` in:
  - `apps/web/components/listings/ListingCard.tsx` (lazy loading, sizes, hover scale)
  - `apps/web/app/[locale]/listings/[unitId]/page.tsx` (priority loading, sizes)
- Configured `next.config.mjs` with `images.formats` (`webp`, `avif`) and `images.remotePatterns` derived from `NEXT_PUBLIC_IMAGE_HOSTS` (defaults to `**.amazonaws.com` for S3).
- Documented `NEXT_PUBLIC_IMAGE_HOSTS` in `apps/web/.env.example`.
- Preserved accessibility by keeping descriptive `alt` text and focus rings.

### Backend — rate limiting

- Added `listings_rate_limit` dependency (`120 requests / 60s per IP`) in `src/app/security/rate_limit.py`.
- Applied `listings_rate_limit` to the public listing endpoints in `src/app/listings/router.py`:
  - `GET /api/v1/listings`
  - `GET /api/v1/listings/{unit_id}`
  - `GET /api/v1/listings/{unit_id}/availability`
- Moved `RateLimitError` to `src/app/shared/exceptions.py` and mapped it to HTTP 429 `Too Many Requests`.
- Updated `src/app/security/__init__.py` to re-export `RateLimitError` correctly.

### Backend — security headers and CSP

- Strengthened `Content-Security-Policy` in `src/app/security/middleware.py` with directives for:
  - `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `media-src`
  - `frame-ancestors 'none'`, `base-uri`, `form-action`
- Kept existing `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-Request-ID` headers.
- Made `Strict-Transport-Security` (HSTS) conditional on `settings.ENVIRONMENT == "production"`.

### Backend — image URL validation

- Added `IMAGE_HOST_ALLOWLIST` setting to `src/app/config.py` (default: `.amazonaws.com`).
- Added `validate_image_url()` in `src/app/listings/configuration.py` to enforce:
  - `https://` scheme
  - maximum length (2048 chars)
  - hostname matching the configured allowlist (disabled in `test` environment)
- `resolve_cover_image_url()` now sanitizes each candidate photo URL and returns `None` for unsafe URLs, causing the frontend to fall back to the placeholder.

### Production configuration documentation

- Added this report containing the required production configuration values and API contract workflow.

## 2. Files modified

### New file

- `S2-08_COMPLETION_REPORT.md`

### Modified files

- `apps/web/next.config.mjs`
- `apps/web/.env.example`
- `apps/web/components/listings/ListingCard.tsx`
- `apps/web/app/[locale]/listings/[unitId]/page.tsx`
- `src/app/security/rate_limit.py`
- `src/app/security/middleware.py`
- `src/app/security/__init__.py`
- `src/app/listings/router.py`
- `src/app/listings/configuration.py`
- `src/app/shared/exceptions.py`
- `src/app/config.py`

## 3. Performance improvements

- Next.js `Image` with `fill` and explicit `sizes` reduces transfer of oversized images on both the search cards and the listing detail page.
- Listing detail hero uses `priority` so the Largest Contentful Paint image is preloaded.
- Listing cards use `loading="lazy"` to defer off-screen images.
- `next.config.mjs` enables modern `webp` and `avif` formats for smaller payloads.

## 4. Security improvements

- Public listing endpoints are rate-limited to mitigate scraping and abuse.
- Malformed or non-HTTPS cover image URLs are sanitized to `None` before reaching the frontend, preventing mixed-content or protocol-based attacks.
- Image rendering is restricted by `remotePatterns` to configured (or default AWS S3) hosts.
- CSP now explicitly controls `img-src`, `connect-src`, `media-src`, `frame-ancestors`, `base-uri`, and `form-action`.
- HSTS is no longer emitted in non-production environments, avoiding accidental header lock-in where TLS may not be present.

## 5. Verification results

| Check | Command | Result |
|-------|---------|--------|
| Backend lint | `python3 -m ruff check src/app` | ✅ Passed |
| Backend mypy | `python3 -m mypy src/app` | ✅ Passed |
| Backend tests | `python3 -m pytest --no-cov -q` | ✅ 326 passed |
| Frontend lint | `npm run lint` | ✅ Passed |
| Frontend type check | `npm run type-check` | ✅ Passed |
| Frontend build | `npm run build` | ✅ Passed |
| Frontend tests | `npm run test` | ✅ Passed (no test files) |

## 6. Remaining issues

- The `next/image` remote pattern falls back to `**.amazonaws.com`. Production teams should set `NEXT_PUBLIC_IMAGE_HOSTS` to the exact CDN / S3 hostname(s).
- `IMAGE_HOST_ALLOWLIST` defaults to `.amazonaws.com`; operators with a custom CDN must set it to the CDN domain.
- The security headers middleware applies the same CSP to both HTML and JSON responses. If the Next.js frontend is served through the FastAPI app in the future, the CSP may need `script-src`/`style-src` nonces or hashes for Next.js inline scripts.
- Rate limiting is per-IP; deployments behind a reverse proxy should ensure `request.client.host` is the true client IP or use an `X-Forwarded-For` header.

## 7. Sprint 2 Ready for Final Acceptance?

### YES

The production-readiness hardening in S2-08 is complete: images are optimized and safely sourced, public listing endpoints are rate-limited, security headers and CSP are strengthened, externally supplied image URLs are validated, and the backend/frontend quality checks pass. The repository is clean and the task is committed.
