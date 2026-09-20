# FOUNDER DECISION REGISTER — StayOS

**Version**: 1.1.0
**Date**: 2026-09-20
**Branch**: `product-completion-review`
**Status**: ACTIVE — canonical register of decisions requiring Founder input
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

## Documentation conflicts discovered (report only, not resolved)

1. **ADR-016 number collision**: `DECISION_LOG.md` DEC-014 gates mobile on "ADR-016 (mobile framework)", but `docs/architecture/adr/ADR-016-epos-governance-adoption.md` already occupies ADR-016 for a different decision. The mobile-framework ADR needs a free number.
2. **Paymob vs Stripe** — FD-01 (conflict stands; do not resolve here).
