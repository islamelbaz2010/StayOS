# 06 — STOP DOING LIST

**Author:** Executive Program Director & Chief Product Officer  
**Date:** 2026-08-03  
**Status:** LOCKED — This list prevents engineering drift. If it's not in `02_SPRINT3_EXECUTION_LOCK.md` and not on this list, ask before building. If it IS on this list, do not build it. Period.

---

## DO NOT BUILD

### Engineering Features

| # | Feature | Why Not | When (If Ever) |
|---|---------|---------|----------------|
| 1 | Native iOS/Android app | Web PWA is sufficient for alpha. Mobile is expensive and premature. | Phase 2 (after 100+ bookings) |
| 2 | AI-powered pricing or matching | No transaction data. AI without data is a parlor trick. | Phase 2+ (after 1,000+ listings) |
| 3 | Channel manager sync (Airbnb/Booking.com) | Strategic decision: NEVER. StayOS is not a channel manager. | NEVER |
| 4 | B2B SaaS subscription billing | Second revenue stream. Focus on the first (commission). | Phase 3 |
| 5 | Support ticket system (S3-015) | WhatsApp is the support channel for alpha. A ticketing system for 15 hosts is over-engineering. | V1.1 (if at all) |
| 6 | Unclaimed listing creation (S3-012) | Scale feature. Founder creates listings manually. | V1.1 (if at all) |
| 7 | Claim review workflow (S3-013) | Depends on S3-012. Not needed until claim workflow is activated. | V1.1 (if at all) |
| 8 | Duplicate detection (S3-014) | At 30-50 listings, founder checks manually. | V1.1 (if at all) |
| 9 | WhatsApp Business API integration | Unresolved external dependency. SMS via Twilio is sufficient. | V1.1 |
| 10 | Real-time messaging (SSE/WebSocket) | WhatsApp/phone is sufficient for alpha. | Phase 2 |
| 11 | In-app notification center | SMS is the notification channel. | V1.1 |
| 12 | Push notifications (FCM) | No mobile app. SMS is the channel. | Phase 2 |
| 13 | Map-based search (S3-016) | Important but not needed for alpha. Warm contacts get direct links. | V1.1 |
| 14 | Reviews and ratings (S3-027) | Manual review collection for alpha. Founder calls guests after checkout. | V1.1 |
| 15 | Google/Apple OAuth (S3-028) | Phone OTP is sufficient. OAuth is a conversion booster, not a launch requirement. | V1.1 |
| 16 | Founder executive dashboard (S3-029) | Founder uses a spreadsheet. Dashboards are management tooling, not marketplace tooling. | V1.1 (if at all) |
| 17 | Wishlist (S3-026) | Vanity feature. No impact on transactions. | V1.1 (if at all) |
| 18 | KYC OCR/biometric automation | Manual review is sufficient for 50 hosts. | V1.1 |
| 19 | CloudFront CDN | Direct S3 is sufficient for 50 listings. | V1.1 |
| 20 | Multi-AZ RDS | Single-AZ is sufficient for alpha. | V1.1 |
| 21 | Advanced admin CRM / incident console | Basic queues suffice. | V1.5 |
| 22 | Field operations / turnover tickets | Relevant only after 50+ active units. | V1.5 |
| 23 | B2B multi-unit portfolio management | Focus on individual listings and CSV import. | Phase 2 |
| 24 | Cursor-based pagination | Offset pagination is fine for 50 listings. | V1.1 |
| 25 | Materialized search views | Not needed at this scale. | V1.1 |
| 26 | pg_trgm / unaccent extensions | Simple text search is sufficient for alpha. | V1.1 |
| 27 | Arabic morphological search | Nice-to-have, not a launch requirement. | V1.1 |
| 28 | Photo drag-and-reorder | Integer display_order field is sufficient. | V1.1 |
| 29 | Map picker in listing form | Text input for lat/lng is sufficient. Founder verifies coordinates. | V1.1 |
| 30 | Advanced amenities multi-step selector | Checkbox list is sufficient. | V1.1 |
| 31 | Quality score algorithm | Manual review is the quality gate. | V1.1 |
| 32 | Host guarantee fund | Founder mediates disputes during alpha. | V1.1 |
| 33 | Automated payout batch | Manual bank transfers for alpha. | V1.1 |
| 34 | Email notifications | SMS and WhatsApp are the channels. | V1.1 |
| 35 | Multi-currency support | EGP only for alpha. | Phase 2 (GCC) |
| 36 | Multi-language support (English) | Arabic-first. English is V1.1. | V1.1 |
| 37 | Booking.com/Airbnb API integration | Strategic decision: NEVER. | NEVER |
| 38 | Automated host onboarding (no human touch) | 60%+ of hosts need founder assistance. | V1.5 |
| 39 | Dynamic pricing engine | No data. Manual pricing for alpha. | Phase 2+ |
| 40 | Guest verification (ID upload for guests) | Phone OTP is sufficient for guests during alpha. | V1.1 |

---

## DO NOT DO

### Process and Behavior

| # | What Not To Do | Why Not |
|---|----------------|---------|
| 1 | Do not add features not in `02_SPRINT3_EXECUTION_LOCK.md` | Scope creep kills startups. |
| 2 | Do not optimize for engineering elegance | Optimize for marketplace launch, not code quality. |
| 3 | Do not build infrastructure for scale | 50 listings and 10 bookings is not scale. |
| 4 | Do not write tests for features not in scope | Test what you're building, not what you might build. |
| 5 | Do not refactor working code | If it works, leave it. Refactor later. |
| 6 | Do not add new dependencies/packages | Use what's in the project. New deps = new risk. |
| 7 | Do not change the database schema beyond what's needed | Migrations are risky. Only add what's specified. |
| 8 | Do not spend time on CI/CD pipelines | Manual deploy is fine for alpha. |
| 9 | Do not write documentation for internal tools | The founder is the only user. |
| 10 | Do not hold design meetings | The design is in `03_ENGINEERING_BUILD_ORDER.md`. Build it. |
| 11 | Do not debate architecture | The architecture is set. Build on top of it. |
| 12 | Do not build "just in case" features | If it's not in the execution lock, it doesn't exist. |
| 13 | Do not start optional items before mandatory items are done | Optional means "after mandatory is accepted." |
| 14 | Do not spend time on SEO during alpha | 3-5 landing pages are enough. Don't build an SEO strategy. |
| 15 | Do not run paid ads | No paid acquisition until 50+ listings and 10+ bookings. |
| 16 | Do not hire more than 1 operations person for alpha | 1 person is sufficient. 12-14 is absurd for alpha. |
| 17 | Do not build a mobile-responsive design separately | The web app should be responsive by default. No separate mobile build. |
| 18 | Do not create separate admin authentication | Use existing Firebase + role-based access. |
| 19 | Do not add analytics platforms | Use simple page view tracking. Don't install Mixpanel/Amplitude. |
| 20 | Do not build a staging environment separate from production | Use one environment. Deploy carefully. |

---

## DO NOT MEASURE

### Vanity Metrics

| # | Metric | Why Not |
|---|--------|---------|
| 1 | Total page views | Doesn't inform any decision during alpha. |
| 2 | Unique visitors | Doesn't inform any decision during alpha. |
| 3 | Social media followers | Doesn't inform any decision during alpha. |
| 4 | Email list size | Doesn't inform any decision during alpha. |
| 5 | Total signups | Only measure hosts with listings and guests with bookings. |
| 6 | App store ratings | No app. |
| 7 | Press mentions | No PR during alpha. |
| 8 | Time on site | Doesn't correlate with bookings at this scale. |
| 9 | Bounce rate | Doesn't correlate with bookings at this scale. |
| 10 | Number of features shipped | Measure outcomes, not output. |

---

## THE RULE

**If a feature, process, or metric is not in `02_SPRINT3_EXECUTION_LOCK.md`, `03_ENGINEERING_BUILD_ORDER.md`, or `05_ALPHA_SUCCESS_SCORECARD.md`, and it is not on this STOP DOING list, ASK BEFORE BUILDING.**

The answer will almost always be "no."

The only person who can approve a new feature is the Executive Program Director. The only person who can approve a scope change is the Founder. No one else.

**Engineering's job is to build what's specified. Not to invent. Not to optimize. Not to "improve." Build what's in the contract. Ship it. Move to the next task.**
