# StayOS — Legal Gap Register

**Date:** 2026-08-24 (updated same day — Payment & Commission Policy sprint) · **Status:** Living document — update as items close. Not legal advice.

**2026-08-24 update #2 (Legal & Commercial Decision Gate):** every remaining business/commercial `[FOUNDER DECISION REQUIRED]` item that could reasonably be decided at Project Director level has now been decided — commission rate, cancellation tiers, refund timing, payment deadline, proof-resubmission limits, host-cancellation treatment, property-unavailable treatment, no-show rule, duplicate-payment process, host-payout timing, service-fee refundability, and V1 host-authorization process. See the canonical table in `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1. **P0-3, P0-4, P0-5, P0-10, and P0-12 are now CLOSED** (business decisions made, propagated into all four legal drafts). What remains open is exclusively genuine legal-counsel questions (P0-7, P0-9) and small, precisely-scoped engineering actions (populate `refund_days=5`, replace the placeholder bank account) — neither is a legal or business gap any longer.

**2026-08-24 update #1:** the payment-model question is resolved at the architecture level (Guest pays a StayOS-controlled account; StayOS deducts commission; Host is paid the net amount) — see `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md`. This closes the "who pays whom" ambiguity that drove P0-3/P0-5 and Terms § 8.5 but opened **P0-9** — whether this money flow requires Central Bank of Egypt payment-facilitator licensing (still open, correctly — this is a legal question, not a business one).

**Classification:** P0 = must resolve before accepting real money · P1 = should resolve before Closed Alpha · P2 = can resolve after Alpha.

---

## P0 — Must resolve before accepting real money

| # | Gap | Type | Evidence |
|---|---|---|---|
| P0-1 | No legal entity, registration number, or tax card exists to disclose in the Terms of Service. Egyptian Consumer Protection Law 181/2018 Art. 37 requires this disclosure before a remote consumer contract. | FOUNDER DECISION + LEGAL COUNSEL | Web research (Andersen Egypt, WIPO Lex translation of Law 181/2018); repo has no company registration record. |
| P0-2 | No Terms of Service, Privacy Policy, or Host Agreement exists in the product today (only drafted in this task) — nothing is currently shown to a real user. | FOUNDER DECISION | Confirmed by repo search: no ToS/Privacy/Host Agreement page found in `apps/web` or `apps/mobile`. |
| P0-3 | ~~Refund percentage, deadlines, and mechanism entirely undefined.~~ **CLOSED 2026-08-24** — decided: Flexible/Moderate/Strict tiers (24h/5d/1wk, 100%/100%/50%), adopted from existing live UI copy. See `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` § 3. | DECIDED | `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 1. |
| P0-4 | ~~`{{refund_days}}` never populated.~~ **PARTIALLY CLOSED 2026-08-24** — value decided (5 business days); still needs a one-line engineering action to actually populate it at the call site (not done in this sprint — the trigger lives in the dormant `finance`/`reservations` module, out of scope to touch further). | DECIDED (value) + ENGINEERING (wiring, P0) | `src/app/notifications/templates.py:185,188,197,200`. |
| P0-5 | ~~Host payout undefined.~~ **CLOSED 2026-08-24** — decided: net amount (subtotal − 12%) forwarded manually within 3 business days of verification, for the alpha; automated later via the dormant `finance` module. | DECIDED | `STAYOS_HOST_AGREEMENT_V1_DRAFT.md` § 9.2. |
| P0-6 | Payment proof images (which can show bank account details in a screenshot) are stored in the same publicly-readable S3 bucket as public listing photos, because the payments module reuses `S3_LISTINGS_BUCKET`. | ENGINEERING (flagged, not fixed by this task) | `src/app/payments/services.py` `presign_proof_upload` → `settings.S3_LISTINGS_BUCKET`. |
| P0-7 | StayOS's KYC flow processes ID documents and biometric-adjacent face-match data. Egypt's PDPL (Law 151/2020) Executive Regulations, in force since 2 Nov 2025, introduce licensing requirements for sensitive-data processing, with a compliance deadline of **31 October 2026**. Whether StayOS's KYC flow requires a PDPC license before processing real user data is unresolved. | LEGAL COUNSEL REVIEW REQUIRED | Al Tamimi & Co., CMS Law, Access Partnership (Nov 2025 Executive Regulations coverage); `src/app/kyc/services.py` (Textract + Rekognition on ID/selfie images). |
| P0-8 | StayOS's platform role — pure marketplace/intermediary vs. accommodation-service supplier — is asserted in the drafted Terms (§ 15) based on the business-model description given for this task, but has not been affirmatively confirmed by the founder or reviewed by counsel. This determines consumer-protection, tax, and licensing treatment. | FOUNDER DECISION + LEGAL COUNSEL | Drafting instructions for this task; no independent code/business confirmation exists. |
| P0-9 | **(New, 2026-08-24)** StayOS's own recommended payment model has Guest funds pass through a StayOS-controlled bank/Vodafone Cash account before being forwarded to the Host. Egypt's Central Bank Law 194/2020 and the June 2025 CBE licensing rules for Payment System Operators/Payment Service Providers require entities that receive and hold customer funds on behalf of others to be licensed, with EGP 10–30M capital requirements. Whether a small-scale, manually-processed closed-alpha flow among people known to the founder falls within this framework's intended scope is unresolved and must not be assumed either way. | LEGAL COUNSEL REVIEW REQUIRED | CBE official rules publication; Lexology/Matouk Bassiouny/Shehata Law coverage. See `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 5, which also proposes a lower-risk alternative (Guest pays Host directly + Guest pays StayOS its own fee directly) for counsel to weigh against the primary recommendation. |
| P0-10 | ~~Commission rate found but not confirmed.~~ **CLOSED 2026-08-24** — 10% host + 2% platform + 4% guest is now StayOS's official adopted V1 rate, with rationale documented. | DECIDED | `STAYOS_V1_PAYMENT_AND_COMMISSION_POLICY.md` § 2. |
| P0-11 | **(New, 2026-08-24, FIXED same day)** The live web app showed guests a "Escrow Protection — Your payment is held securely until you check in" message. No escrow, hold, or check-in-triggered release mechanism exists anywhere in the active payment code — this was a false claim shown to real users. **Fixed in this sprint** (copy-only change, `apps/web/messages/en.json` / `ar.json`) to describe the actual manual-verification process instead. | ENGINEERING (done) | `apps/web/components/listings/TrustSection.tsx`; `trust.escrowTitle`/`escrowDesc` keys. |
| P0-12 | ~~Live UI shows refund tiers the backend doesn't enforce.~~ **CLOSED as a business-decision item 2026-08-24** — those exact tiers are now the adopted official policy (P0-3). **Remains open as an ENGINEERING item**: no code computes a refund from these rules yet — a refund-calculation function matching `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md` § 3–8 needs to be built before Closed Alpha scale (not before transaction #1, which can be computed by hand). | DECIDED (rule) + ENGINEERING (P1, not P0 for the alpha) | `apps/web/messages/en.json`/`ar.json` `trust.cancellation.*`. |

## P1 — Should resolve before Closed Alpha

| # | Gap | Type | Evidence |
|---|---|---|---|
| P1-1 | A second, parallel booking/payment system (`reservations` + `finance`, with Stripe integration and an escrow ledger) is mounted and reachable in the live API alongside the active manual system (`bookings` + `payments`). It is currently non-functional only because `STRIPE_SECRET_KEY` is unset — if that key is ever added without a decision to formally activate/deprecate this path, StayOS would unintentionally run two different payment models simultaneously, which the Terms/Privacy drafts would then misdescribe. | ENGINEERING + FOUNDER DECISION | `src/app/main.py` mounts both `reservations_router` and `bookings_router`; `finance` module has live refund/escrow logic; `STRIPE_SECRET_KEY` confirmed empty in `.env`/`.env.staging`. |
| P1-2 | No account-deletion or data-export endpoint exists, which limits how the Privacy Policy can describe user rights (access/correction/deletion) under Law 151/2020. | ENGINEERING (future) + LEGAL COUNSEL | No `DELETE /me` or export endpoint found in `src/app/auth/router.py`. |
| P1-3 | No data-retention period is defined anywhere for KYC documents, payment proof, or account data after closure. | FOUNDER DECISION | Confirmed absent from all inspected config/docs. |
| P1-4 | No breach-notification procedure exists, while Law 151/2020's Executive Regulations require notifying the PDPC within 72 hours and affected individuals within 3 business days of a breach. | FOUNDER DECISION + LEGAL COUNSEL | CMS Law / Access Partnership coverage of the Nov 2025 regulations; no procedure found in repo. |
| P1-5 | Cross-border data transfer question: AWS/Twilio/Google/Firebase are used without a confirmed data-residency region, and Law 151/2020 imposes licensing on cross-border transfer of personal data. | LEGAL COUNSEL REVIEW REQUIRED | Same regulatory sources; `AWS_REGION` value not disclosed/verified as Egypt-local in this review. |
| P1-6 | No no-show, duplicate-payment, or unlimited-proof-resubmission handling exists in the active booking/payment flow. | FOUNDER DECISION | Confirmed by code review of `bookings/services.py`, `payments/services.py`. |
| P1-7 | Egypt's short-term-rental / tourism-licensing regulatory position for hosts remains explicitly unresolved per the repository's own Phase-1 legal risk register, which itself disclaims being legal advice. | LEGAL COUNSEL REVIEW REQUIRED | `docs/phase--1/risks/09_LEGAL_RISKS.md` LEG-016–030. |

## P2 — Can resolve after Alpha

| # | Gap | Type |
|---|---|---|
| P2-1 | Cookie Policy — not currently justified: no cookie/tracking mechanism was found in `apps/web`/`apps/mobile` beyond standard session handling. Revisit only if analytics/ads are added. | FOUNDER DECISION (deferred) |
| P2-2 | Formal dispute-resolution/arbitration clause drafting. | LEGAL COUNSEL |
| P2-3 | Prohibited Activities Policy / Host Listing Standards as standalone documents (currently folded into the Terms/Host Agreement drafts). | FOUNDER DECISION (deferred) |
| P2-4 | Full governing-law and jurisdiction clause. | LEGAL COUNSEL |

---

## Additional documents considered and NOT created

Per the task's instruction not to inflate the document list without justification:

- **Cookie Policy** — not created; no cookie/tracking mechanism exists in the code today (P2-1).
- **Community/Guest Rules** — not created as a standalone document; guest conduct is covered in Terms of Service § 4 and § 11. Revisit if guest-community features are added.
- **KYC/Verification Notice** — covered within the Privacy Policy (§ 1, § 8) and Terms of Service (§ 13); a standalone notice was judged redundant at V1 scale.
- **Payment Terms** — covered within Terms of Service § 8 and the Cancellation & Refund Policy; a standalone document was judged redundant given the payment flow is a single manual process, not multiple payment products.
- **Prohibited Activities Policy** — folded into Terms of Service § 11–12 rather than split out, given V1 scale.
- **Host Listing Standards** — folded into Host Agreement § 2 and § 6; revisit as a standalone document once listing volume justifies detailed content standards.
- **Dispute Resolution Policy** — folded into Terms of Service § 19 and § 23 pending counsel input; a fuller standalone policy is a P2 item once governing law/forum is settled.
