# ADR-001: Frontend Framework

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend Runtime), ADR-006 (Authentication), ADR-014 (API Style)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "React or Next.js with Arabic RTL support"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §13 Arabic-first UX requirements
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §1 System Type, §2 Client Layer
- [`TECH_STACK.md`](../../TECH_STACK.md) — §2 Proposed (no ADR)
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §9 Arabic RTL Requirements

---

## Problem

`MASTER_CONTEXT.md` names "React or Next.js" as the frontend choice. No decision was recorded. This ambiguity blocks:
- Frontend scaffold creation
- SEO strategy (SSR vs CSR is a fundamental choice)
- Routing architecture
- Team hiring (React vs Next.js skill requirements differ)
- Arabic RTL implementation strategy

The Egyptian and GCC accommodation market requires strong Arabic SEO — guests search in Arabic on Google. A client-side-only React SPA would be invisible to search crawlers for the initial page load. This makes the SSR/SSG question architecturally significant, not cosmetic.

---

## Options Evaluated

### Option A: React (Create React App / Vite SPA)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low setup cost. No server infrastructure for frontend. CDN-served static bundle. |
| **Scalability** | Scales horizontally via CDN. No SSR compute cost. |
| **Operational Complexity** | Low. Static files on S3/CloudFront. |
| **Security** | XSS risk managed at component level. No server-side exposure. |
| **Performance** | First paint slow (JS bundle parse). Arabic RTL requires CSS-level handling. Time-to-interactive poor on low-end Egyptian mobile devices. |
| **Future Global Expansion** | No inherent blocker, but SEO disadvantage compounds in every new market. |

**Pros**: Simplest setup. Pure client-side. No server to manage for frontend.
**Cons**: No SSR — Arabic search terms (حجز شقق القاهرة) will not be indexed on first load. No built-in routing. Additional libraries needed for code splitting, data fetching. GCC travelers on mobile expect fast first paint.

---

### Option B: Next.js (App Router — SSR/SSG hybrid)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Moderate. Requires Node.js server or serverless functions (Vercel/AWS Lambda) for SSR pages. |
| **Scalability** | Excellent. Static pages via ISR. Dynamic pages via serverless. No server fleet to manage. |
| **Operational Complexity** | Moderate. Deployment via Vercel or Next.js on AWS ECS. More moving parts than pure SPA. |
| **Security** | Server components reduce client-side bundle exposure. API routes as BFF layer reduce direct API exposure. |
| **Performance** | Fast first paint via SSR. Excellent Core Web Vitals. Streams HTML to browser. Critical for low-bandwidth Egyptian mobile users. |
| **Future Global Expansion** | SSR + ISR enables per-market page generation (Egyptian Arabic vs Gulf Arabic content). Locale-aware routing built in. |

**Pros**: SSR for Arabic SEO. File-based routing. API routes as Backend-for-Frontend (BFF). React Server Components reduce JS bundle. Built-in image optimization. i18n routing for Arabic/English. Superset of React — all React skills transfer.
**Cons**: More complex deployment than pure SPA. Server compute required for SSR pages.

---

### Option C: Vue.js / Nuxt.js

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Similar to Next.js |
| **Scalability** | Similar to Next.js |
| **Operational Complexity** | Similar to Next.js |
| **Security** | Similar |
| **Performance** | Comparable to Next.js |
| **Future Global Expansion** | Smaller Arabic-speaking developer community in MENA |

**Pros**: Excellent DX. SSR via Nuxt.
**Cons**: Not mentioned in any repository document. Smaller Egyptian developer hiring pool than React. No existing codebase context.

---

## Decision

**Next.js (App Router, TypeScript)**

---

## Decision Rationale

1. **SEO is existential for a marketplace**: Arabic search queries for Cairo apartments, Red Sea villas, and GCC-friendly properties must be indexed. A CSR-only SPA fails this requirement. SSR is not a nice-to-have — it is a marketplace survival requirement.

2. **MASTER_CONTEXT.md resolves in Next.js's favor**: The document says "React or Next.js." Next.js is a superset of React — choosing Next.js does not reject React. It adds SSR, routing, and API routes to React. No React skill is lost.

3. **Arabic RTL support**: Next.js has built-in `dir="rtl"` HTML attribute support via its `<html>` configuration in `app/layout.tsx`. CSS logical properties work identically in both frameworks, but Next.js's built-in locale routing (`i18n` config) enables Arabic-first routing (`/ar/...`) from day one.

4. **BFF pattern via API routes**: Next.js API routes allow a Backend-for-Frontend layer that reduces direct exposure of backend service URLs to the browser, improving security for authentication flows.

5. **ISR for listing pages**: Property listing pages can be statically generated and revalidated on demand — critical for performance and SEO without server rendering cost on every request.

6. **Team fit**: Egypt's developer market has a large React community. Next.js requires minimal additional knowledge beyond React.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| React SPA (Vite/CRA) | SEO failure for Arabic search queries; poor first-paint performance on Egyptian mobile networks; unacceptable for marketplace discovery |
| Vue.js / Nuxt | Not referenced in any repository document; smaller MENA developer hiring pool; no existing context |

---

## Migration Cost

**From decision to implementation**: Zero migration cost — no existing frontend to migrate from. Fresh start.

**Future migration risk**: If Next.js is later replaced, React components are portable to any React-based framework. BFF API routes are not portable but represent a thin layer.

---

## Dependencies

- ADR-002 (Backend Runtime) — Next.js API routes serve as BFF; they call the Python/FastAPI backend internally
- ADR-006 (Authentication) — Firebase Authentication SDK has a Next.js integration
- ADR-014 (API Style) — Next.js API routes will proxy REST calls to the backend

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-01 AuthGate UI | Guest/host login, KYC upload flows |
| FC-02 Spatial Search UI | Map rendering, filter components, listing cards |
| FC-04 PMS Host Dashboard | Calendar grid, pricing UI |
| FC-07 Incident Console | CRM command dashboard |
| SEO | All public listing pages indexed in Arabic by Google |
| Field Staff App | Next.js is NOT used for the field staff mobile app (see ADR-007) |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
