# FOUNDER DECISION REGISTER — StayOS

**Version**: 1.2.0
**Date**: 2026-09-21
**Branch**: `product-completion-review`
**Status**: CLOSED — see "MASTER FOUNDER DECISION CLOSURE (2026-09-21)" below for the authoritative final status of every decision. The OPEN rows in the historical table are superseded by that section.
**Companion**: `docs/benchmark/FINAL_AIRBNB_BENCHMARK_CLOSURE.md` (LIST 3), `StayOS_Technical_Release_Review_Master_2026-09-20.xlsx` sheet `04_FOUNDER_DECISIONS`

> Engineering does not decide these. Options are listed from repository evidence only; no option ranking. The Founder answers in the workbook (`Founder Choice` column) or by appending to `DECISION_LOG.md`.

| ID | Decision | Current implementation | Why a decision is required | Options evidenced by repository | Dependencies | Impact if deferred | Status |
|----|----------|------------------------|----------------------------|----------------------------------|--------------|--------------------|--------|
| FD-01 | **Payment processor** | Manual collection (bank + Vodafone Cash, placeholders). Paymob and Stripe provider code exists but dormant. `DEC-015`: Stripe scoped to international cards only. | Documented unresolved conflict: `DECISION_LOG.md` DEC-004 + `MASTER_CONTEXT.md` name Paymob; `FLOWS.md` + `ENGINEERING_BACKLOG.md` name Stripe. `AGENTS.md` prohibits resolving it. | (a) Paymob domestic + Stripe international per DEC-004/DEC-015; (b) Stripe only per FLOWS/backlog; (c) manual collection only for closed alpha (current behavior) | Legal entity; CBE PSP analysis; real collection account | Manual flow continues to work; online checkout blocked | OPEN |
| FD-02 | **KYC automated-verification architecture** | Textract/Rekognition code paths exist; proven that neither exists in canonical region `me-central-1`; documents stay `pending` → manual admin review works | Automated providers unavailable in chosen region; manual review is viable for alpha volumes | (a) Manual-only at alpha (proven path); (b) ML providers in a different AWS region; (c) alternative provider | AWS account/region; PDPL review (biometric-adjacent data) | KYC works manually; automation deferred | OPEN |
| FD-03 | **Guest-type occupancy semantics** | Booking records adults/children/infants separately; `max_guests` enforced on total; search uses single `guests` count | Airbnb splits guest types in search; whether infants/children count toward `max_guests` is a business rule | (a) Infants don't count toward capacity (Airbnb-like); (b) all types count; (c) host-configurable | DIS-06 benchmark row; listing `max_guests` | Search stays single-count; booking split already recorded | OPEN |
| FD-04 | **Review report + moderation policy** | Reviews publish via simultaneous-publication rule; no report flag or moderation workflow exists | Airbnb has "report review" + moderation; report reasons, removal criteria, appeal path are policy choices | (a) No moderation at alpha (publish all); (b) report flag → admin review queue; (c) automated screening | Admin tooling exists; legal (defamation/consumer protection) | Reviews unmoderated | OPEN |
| FD-05 | **Booking alterations (date/guest modification)** | Not implemented; cancellation + rebook is the only path | Airbnb alteration requests need repricing + host-approval rules | (a) Cancel + rebook only (current); (b) host-approved alteration with repricing | Refund engine; calendar engine | Guests must cancel and rebook | OPEN |
| FD-06 | **Host pre-approval** | Not implemented | Airbnb lets hosts pre-approve inquirers; commits host before formal request | (a) Skip (inquiry → normal request flow works); (b) pre-approval token unlocking instant accept | Messaging + booking flow | Inquiry→booking still works normally | OPEN |
| FD-07 | **Special offers (custom pricing in messaging)** | Not implemented | Airbnb special offers override listing price — pricing rules cannot be invented | (a) Skip; (b) host-set custom quote on inquiry thread | Pricing engine; payment amounts | Standard pricing only | OPEN |
| FD-08 | **Length-of-stay discounts (weekly/monthly)** | Pricing = base + weekend/peak multipliers + cleaning; no LoS discount field | Airbnb exposes weekly/monthly discounts; it's a pricing policy | (a) No LoS discounts at alpha; (b) host-set weekly/monthly % | Pricing engine; quote display | No LoS discounts | OPEN |
| FD-09 | **Smart/dynamic pricing** | Not implemented; `DEC-018` already postpones AI pricing until 1,000+ listings / 50K+ transactions | Strategy + data dependency | (a) Keep DEC-018 deferral; (b) simple rule-based suggestions earlier | Transaction data; analytics | No pricing assistance | OPEN (DEC-018 context: deferred by design) |
| FD-10 | **Multi-currency display** | EGP-only throughout (`currency` field exists on listing) | Airbnb currency switcher; single-market launch is a market decision | (a) EGP only for Egypt alpha (current); (b) multi-currency display/FX | FD-01 processor (Stripe = international cards per DEC-015) | EGP only | OPEN |
| FD-11 | **Mobile framework decision** | Expo/RN preview exists; `DEC-014` says mobile framework pending until "ADR-016" committed — but **ADR-016 is already used by `ADR-016-epos-governance-adoption.md`** (numbering collision); `DEC-018` postpones native mobile until 100+ bookings | Mobile engineering formally gated; physical-device P0s open on OPPO CPH2481 | (a) Keep Expo/RN (current code); (b) native rewrite; (c) stay PWA for alpha per DEC-018 | ADR numbering conflict to fix; device bugs | Mobile stays preview APK | OPEN |
| FD-12 | **Real collection account details** | `PAYMENT_*` config holds documented placeholders (Bank of Egypt / Vodafone Cash `01012345678`) | Guests currently see placeholder account data | (a) Founder-provided bank account + wallet numbers | Legal entity (account must be in entity name) | Checkout instructions unsafe for real money | OPEN |
| FD-13 | **Legal entity + marketplace characterization** | No entity data in repo; legal dossier lists required inputs | CBE PSP analysis, tax registration, contracts all depend on entity form | Founder/counsel: legal form, CR, tax card, HQ, activity code | Counsel engagement | All regulated blockers stay open | OPEN |
| FD-14 | **Analytics provider** | `DEC-013` deferred to Sprint 1 | Observability of funnel before alpha | (a) Defer per DEC-013; (b) pick provider now | — | No product analytics | OPEN (deferred per DEC-013) |
| FD-15 | **OTP provider confirmation** | Akedly integrated (`auth_otp_akedly` tests); **live delivery verified — Founder received a real OTP and authenticated 2026-09-20** | OTP must actually deliver SMS before real users | (a) Akedly (implemented); (b) alternative (Twilio vars referenced in infra) | Provider account/credits | — | **RESOLVED — Akedly confirmed working live** |
| FD-16 | **`ENVIRONMENT=production` cutover** | Dev-token endpoint reachable on deployed env (implies development/staging) | Dev Login must not ship to public users | (a) Flip at launch; (b) keep dev env for acceptance now | Production domain | Acceptance works; launch gated | OPEN (correct for current phase) |
| FD-17 | **Social sign-in (Google/Apple) enablement** | Code path complete (`signInWithPopup` → `POST /auth/firebase`); `FIREBASE_*` empty on Railway and `NEXT_PUBLIC_FIREBASE_*` absent on Vercel — buttons render disabled | Social login requires a Firebase project + service-account credentials + Vercel client vars | (a) Configure Firebase now; (b) launch closed alpha without social login (phone OTP + email/password both work) | Firebase console access | Social login unavailable; email/password covers the conventional-auth need | OPEN — CONFIGURATION BLOCKER (RB-19) |

## Deferred-by-governance (not blocking, recorded for completeness)

| ID | Item | Governing record |
|----|------|------------------|
| FD-D1 | Native iOS/Android build timing | DEC-018: postponed until 100+ bookings |
| FD-D2 | AI pricing/matching | DEC-018: postponed until 1,000+ listings / 50K+ txns |
| FD-D3 | Field operations / turnover tickets | DEC-018: postponed until 50+ active units |
| FD-D4 | Channel-manager sync | DEC-018: "Never" per existing strategy |
| FD-D5 | Real-time messaging transport | DEC-014: SSE + Redis pub/sub decided (ADR-008); WebSocket rejected |

## MASTER FOUNDER DECISION CLOSURE (2026-09-21)

Authoritative final statuses per the "MASTER FOUNDER DECISION CLOSURE"
package. The prompt's FD-17 (profile navigation) collides with this
register's FD-17 (social sign-in); it is recorded as **FD-27** below.
Register FD-17 (social sign-in) keeps its own identity and status.

| ID | Decision (final) | Status | Evidence / boundary |
|----|------------------|--------|---------------------|
| FD-01 | Paymob = primary PSP for Egypt alpha; Stripe dormant legacy | CLOSED — IMPLEMENTED BEHIND CONFIGURATION | Paymob provider/webhook/idempotency code exists; live collection awaits merchant account approval + credentials |
| FD-02 | Manual KYC review for alpha | CLOSED — IMPLEMENTED | Admin KYC queue; automated providers dormant |
| FD-03 | Adults + children count toward `max_guests`; infants do not | CLOSED — IMPLEMENTED | `bookings/services.py` + `reservations/services.py` capacity checks exclude infants |
| FD-04 | Review report → admin moderation queue; no AI moderation | CLOSED — IMPLEMENTED | `support.review_reports`, `POST /reviews/{id}/report`, admin report queue + `is_hidden` moderation action (DISPUTES permission) |
| FD-05 | Alterations = cancel + rebook only | CLOSED — IMPLEMENTED | No alteration flow added; existing cancel/rebook path is the contract |
| FD-06 | No separate host pre-approval | CLOSED — IMPLEMENTED | Inquiry → request flow unchanged |
| FD-07 | Host custom offers from inquiry | CLOSED — IMPLEMENTED | `booking.booking_offers`, `/bookings/offers*` endpoints; all-inclusive host-set total, guest accept/decline |
| FD-08 | Weekly/monthly + listing discounts | CLOSED — IMPLEMENTED | `unit_listings.{listing,weekly,monthly}_discount_pct`; one applicable discount per booking feeds the canonical engine |
| FD-09 | AI/dynamic pricing | CLOSED — DEFERRED BY STRATEGY | DEC-018 stands; no AI pricing in alpha |
| FD-10 | EGP only in alpha | CLOSED — IMPLEMENTED | Single-currency contract throughout |
| FD-11 | Expo / React Native mobile | CLOSED — IMPLEMENTED | `apps/mobile` remains the mobile surface |
| FD-14 | External analytics provider | CLOSED — DEFERRED BY STRATEGY | DEC-013 stands; Host Performance Center uses canonical transactional data only |
| FD-15 | Akedly OTP | CLOSED — IMPLEMENTED | Verified live previously |
| FD-16 | `ENVIRONMENT=production` only at real launch | CLOSED — IMPLEMENTED BEHIND CONFIGURATION | Env-gated; dev endpoints stay off public envs |
| FD-18 | Staff Role Group → Permission Set → Staff User (+ overrides) | CLOSED — IMPLEMENTED | `STAFF_ROLE_GROUPS` in `auth/constants.py`; `GET /admin/staff/role-groups`; validation rejects unknown groups/permissions |
| FD-19 | 12% total economics = 6% host + 6% guest internal; all-inclusive guest UX | CLOSED — IMPLEMENTED | `finance/commercial.py` canonical engine; no guest-facing fee breakdown anywhere |
| FD-20 | Host promotions | CLOSED — IMPLEMENTED | Discount fields + host visibility of original/discount/payout |
| FD-21 | Host Earnings Simulator on canonical engine | CLOSED — IMPLEMENTED | `POST /host/earnings/simulate` |
| FD-22 | Listing Readiness | CLOSED — IMPLEMENTED | Expanded readiness checks (content, photos, amenities, pricing, address, policies, availability, identity, payout) with actionable missing items |
| FD-23 | Host Performance Center | CLOSED — IMPLEMENTED | `GET /host/performance` — canonical aggregates, no AI recommendations |
| FD-24 | Rule-based explainable Local Fit | CLOSED — IMPLEMENTED | `listings/fit.py` + `GET /listings/{unit}/fit` + `PUT /auth/me/preferences` |
| FD-25 | Egypt-localized payment experience | CLOSED — IMPLEMENTED BEHIND CONFIGURATION | Paymob checkout rails; live methods gated on merchant account |
| FD-26 | Host payout preferences | CLOSED — IMPLEMENTED BEHIND CONFIGURATION | `auth.accounts.payout_*` collection; execution blocked on provider/legal prerequisites |
| FD-27 | Profile via Account/Avatar/Name menu, not primary nav | CLOSED — IMPLEMENTED | Header account affordance links to `/profile`; route retained |
| FD-12 | Real collection/payout account details | BLOCKED — EXTERNAL DEPENDENCY | Requires legal entity bank account |
| FD-13 | Legal entity + marketplace funds characterization | BLOCKED — LEGAL | Counsel + CBE analysis required; not inventable |
| FD-17 (register) | Social sign-in (Google/Apple) | BLOCKED — PROVIDER / CREDENTIAL | Firebase project + credentials (RB-19) |

## Documentation conflicts discovered (report only, not resolved)

1. **ADR-016 number collision**: `DECISION_LOG.md` DEC-014 gates mobile on "ADR-016 (mobile framework)", but `docs/architecture/adr/ADR-016-epos-governance-adoption.md` already occupies ADR-016 for a different decision. The mobile-framework ADR needs a free number.
2. **Paymob vs Stripe** — FD-01 (conflict stands; do not resolve here).
