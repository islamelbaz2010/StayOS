# LEGAL_COMMERCIAL_EXECUTION_REPORT_2026-08-26.md

**Role:** StayOS Project Director and execution agent — Legal + Commercial sprint.  
**Date:** 2026-08-26  
**Mandate:** No implementation; no deployment; no commit; no push.

---

## A. Executive Status

**CONDITIONAL GO** for V1 legal/commercial documentation.

All seven legal/commercial documents have been reconciled against the canonical V1 commercial policy. One material conflict (0% alpha commission vs. canonical 4/10/2) was resolved by recognizing the alpha incentives as a limited promotional override. P0 blockers are now limited to genuine Founder/external actions: real collection account, legal entity, legal counsel, and Paymob outreach.

---

## B. What Is Closed

| Item | Status |
|------|--------|
| V1 commission rate and alpha incentives | CLOSED — first 3 host bookings at 0% host commission; first 10 guest bookings at 0% guest service fee; then 10%/2%/4% |
| Payment flow (Model A — StayOS-controlled account) | CLOSED as business decision; legal licensing remains open |
| Cancellation/refund tiers and timing | CLOSED |
| Service-fee refundability rule | CLOSED |
| Host payout timing | CLOSED — 3 business days |
| Refund timing | CLOSED — 5 business days (`refund_days=5`) |
| Off-platform payment prohibition | CLOSED |
| Host authorization process for first 1–10 listings | CLOSED — KYC + Host Agreement + founder manual confirmation |
| Paymob requirements request | CLOSED / READY TO SEND |
| False escrow language removal | CLOSED — already fixed in `apps/web/messages/` |
| Alpha manual transaction procedure | CLOSED — written |
| Founder action pack | CLOSED — extracted |
| Engineering dependency list | CLOSED — classified |

---

## C. What Remains Founder-Owned

- Real StayOS collection account (bank/Vodafone Cash).
- Legal entity name, registration number, tax card, address.
- Support/contact channel details.
- Confirmation of platform-role characterization.
- First 1–10 listing owner confirmations.
- Dispatch of Paymob Requirements Request.
- Data retention periods.
- Account deletion/export process.
- Suspension/appeal process.

---

## D. What Remains Legal Counsel-Owned

- CBE PSP/PSO licensing classification for Model A.
- PDPL/KYC licensing and DPO requirement (deadline 31 Oct 2026).
- Consumer Protection Law 181/2018 disclosure format.
- Platform role / marketplace liability under Egyptian law.
- Short-term-rental regulatory status.
- Governing law and dispute forum.
- Limitation of liability / disclaimers enforceability.
- Cross-border data transfer licensing.

---

## E. What Remains Paymob/Provider-Owned

- Paymob response to marketplace/split-payment feasibility (12 questions).
- Twilio/Akedly production OTP configuration.
- AWS/S3 production credentials and region confirmation.

---

## F. What Remains Engineering-Owned

| Item | Classification |
|------|----------------|
| Replace fake collection account with real one (once provided) | P0 |
| Wire `refund_days=5` into cancellation notification | P0 |
| Separate payment-proof S3 bucket from public listing bucket | P0/P1 |
| Refund calculation from V1 tiers | P1 |
| 24-hour payment-deadline timer | P1 |
| No-show / duplicate-payment handling | P1 |
| Account-deletion / data-export endpoints | P1 |
| Dormant Stripe path keep/kill decision | P1 |

---

## G. Contradictions Found and How Resolved

| Contradiction | Resolution |
|---------------|------------|
| Newer financial-model draft: "0% platform commission during Alpha" vs. canonical 4/10/2 | **Resolved as Alpha promotional override:** the first 3 completed bookings per Host are charged 0% host commission (2% platform take still applies); the first 10 completed guest bookings globally are charged 0% guest service fee. After those thresholds, the standard 10%/2%/4% applies. Propagated to `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`, `STAYOS_TERMS_OF_SERVICE_V1_DRAFT.md`, `STAYOS_HOST_AGREEMENT_V1_DRAFT.md`, and their Arabic sections. |
| `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` alpha procedure step 7 said 88% payout for all alpha bookings | **Updated to 98% for first 3 host bookings, 88% otherwise**, matching the `finance` module logic. |
| `EXPERIENCE_RULES.md` refund ≤24h vs. V1 policy 5 business days | **Identified as open conflict** — not resolved; requires Founder decision on which rule governs. Listed in unresolved conflicts below. |

---

## H. Files Changed

| File | Change |
|------|--------|
| `docs/legal/STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` | Added alpha incentive rows to canonical table; updated §2 and §4 step 7 |
| `docs/legal/STAYOS_TERMS_OF_SERVICE_V1_DRAFT.md` | Updated §8.5 and Arabic §8.5 to reflect alpha incentives |
| `docs/legal/STAYOS_HOST_AGREEMENT_V1_DRAFT.md` | Updated §9.3 and Arabic §9.3 to reflect alpha host incentive |
| `docs/legal/FOUNDER_ACTION_AND_DECISION_PACK_2026-08-26.md` | Created |
| `docs/legal/ALPHA_MANUAL_TRANSACTION_PROCEDURE_2026-08-26.md` | Created |
| `docs/legal/P0_P1_P2_ENGINEERING_DEPENDENCIES_2026-08-26.md` | Created |
| `.ai/AUDIT/LEGAL_COMMERCIAL_EXECUTION_REPORT_2026-08-26.md` | Created |

---

## I. Files Intentionally Not Changed

| File | Reason |
|------|--------|
| `docs/legal/STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` | Already consistent with canonical policy; no changes needed |
| `docs/legal/STAYOS_PRIVACY_POLICY_V1_DRAFT.md` | Draft is current; only `[FOUNDER DECISION REQUIRED]` / `[LEGAL REVIEW REQUIRED]` markers remain, which cannot be resolved without counsel/Founder |
| `docs/legal/LEGAL_GAP_REGISTER.md` | Already current from 2026-08-24 sprint |
| `docs/legal/LEGAL_COUNSEL_REVIEW_CHECKLIST.md` | Already complete and current |
| `docs/legal/PAYMOB_REQUIREMENTS_REQUEST.md` | Already finalized; marked READY TO SEND |
| `src/app/payments/services.py` | Fake account cannot be replaced without real Founder-provided account |
| `src/app/reservations/services.py` | `refund_days` wiring not performed in this legal/commercial pass (listed as P0 engineering) |
| `src/app/notifications/templates.py` | `refund_days` value decided; wiring is engineering |

---

## J. P0 Blockers

| # | Blocker | Owner |
|---|---------|-------|
| 1 | Real StayOS collection account | Founder |
| 2 | Legal entity / registration details | Founder |
| 3 | Egyptian legal counsel retained | Founder |
| 4 | Paymob outreach dispatched | Founder |
| 5 | `refund_days=5` wired in code | Engineering (no Founder/external dependency) |
| 6 | Payment-proof S3 bucket separation | Engineering + Founder (AWS credentials) |

---

## K. Exact Next Action

**Founder: provide the real StayOS-controlled bank account or Vodafone Cash number so Engineering can replace the placeholder in `src/app/payments/services.py`.**

Until this is provided, no real transaction can occur, regardless of how complete the documentation is.

---

## L. Evidence / Confidence Notes

- **Alpha incentives:** Confirmed in `src/app/config.py` (`ALPHA_HOST_FREE_BOOKINGS=3`, `ALPHA_GUEST_FREE_BOOKINGS=10`) and `src/app/finance/services.py` / `src/app/payments/services.py` logic.
- **Commission rates:** Confirmed in `src/app/config.py` (`GUEST_SERVICE_FEE_PCT=0.04`, `HOST_COMMISSION_PCT=0.10`, `PLATFORM_TAKE_RATE_PCT=0.02`).
- **Payment flow:** Confirmed by `src/app/payments/services.py` `_build_instructions` and `src/app/finance/services.py` `handle_manual_payment_verified`.
- **Refund timing:** Decided at 5 business days; not yet wired in `src/app/reservations/services.py`.
- **Escrow language:** Verified absent from current `apps/web/messages/`; only historical references remain in audit/chat documents.
- **Paymob request:** Verified complete; 12 questions cover marketplace/split, host onboarding, commission, settlement, refunds, chargebacks, webhooks, StayOS onboarding, sandbox, timeline, fees, Egypt-specific methods.
- **Legal questions:** No legal conclusions invented; all genuine legal questions preserved as `LEGAL COUNSEL REQUIRED`.

---

**End of Legal + Commercial Execution Report.**
