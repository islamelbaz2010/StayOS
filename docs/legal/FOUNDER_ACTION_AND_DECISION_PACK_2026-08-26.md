# FOUNDER_ACTION_AND_DECISION_PACK_2026-08-26.md

**Status:** Extracted from the 2026-08-26 Legal & Commercial execution pass.  
**Purpose:** Separate every item that genuinely requires the Founder, external counsel, an external provider, or an operational/external action from work that can be done inside the existing codebase.

---

## A. Founder Decisions (Business / Strategic)

| # | Item | Current Evidence | Decision Needed | Urgency |
|---|------|------------------|-----------------|---------|
| A1 | Legal entity name, type, registration number, tax card, registered address | Not in repository; required by Consumer Protection Law 181/2018 Art. 37 | Confirm entity or proceed as a natural person / unregistered project for the alpha | P0 |
| A2 | Minimum age / geographic eligibility for V1 Closed Alpha | ToS § 2 says 18+ and Egypt law; alpha scope not specified | Confirm whether V1 is Egypt-residents-only or broader | P1 |
| A3 | Platform role characterization | ToS § 15 asserts "marketplace intermediary, not accommodation supplier" | Affirmatively confirm this is the intended legal positioning | P0 |
| A4 | Refund tiers | DECIDED: Flexible/Moderate/Strict (24h/5d/1wk) | No further decision needed; preserved | Closed |
| A5 | Commercial rates | DECIDED: 10% host + 2% platform + 4% guest, with alpha incentives | No further decision needed; propagated | Closed |
| A6 | Suspension/appeal process | ToS § 14 and Host Agreement § 11 mention admin action; no appeal workflow | Define whether V1 alpha appeals are handled via direct support email/phone only | P1 |
| A7 | Account deletion / data-export process | Privacy Policy § 10 notes no self-service deletion endpoint | Decide whether V1 alpha uses manual support-request deletion/export | P1 |
| A8 | Data retention periods | Privacy Policy § 6 notes no retention period is defined | Set retention periods for KYC docs, payment proof, account data, logs | P1 |
| A9 | Escalation/reporting process for fraud | ToS § 12 mentions referral to law enforcement | Confirm actual escalation process or defer to manual admin action | P1 |
| A10 | Notice mechanism for Terms/Privacy changes | ToS § 22 and Privacy Policy § 13 require definition | Decide how users will be notified of material changes | P1 |

---

## B. Founder Operational Actions

| # | Item | Detail | Urgency |
|---|------|--------|---------|
| B1 | Provide real StayOS collection account | Bank account name/number or Vodafone Cash number to replace placeholder in `src/app/payments/services.py` lines 31–49 | P0 |
| B2 | Provide legal entity / registration details | For ToS § 0, Privacy Policy § 12, Host Agreement § 1 | P0 |
| B3 | Confirm first 1–10 listings and owners | Manually confirm ownership/authorization with owners before publication | P0 |
| B4 | Recruit first real guest(s) for transaction #1 | Manual outreach to test the closed alpha loop | P0 |
| B5 | Set up support contact channel | Email/phone/WhatsApp for disputes, complaints, appeals | P1 |
| B6 | Prepare manual accounting ledger | Spreadsheet template for transactions 1–10 | P1 |
| B7 | Confirm payout method for hosts | Bank transfer or Vodafone Cash; collect host payout details | P1 |

---

## C. External Provider Actions

| # | Provider | Action | Status |
|---|----------|--------|--------|
| C1 | Paymob | Send `PAYMOB_REQUIREMENTS_REQUEST.md` to determine marketplace/split-payment feasibility | READY TO SEND — requires Founder dispatch |
| C2 | Egyptian legal counsel | Retain counsel and provide all draft documents; obtain written opinion on payment licensing, PDPL/KYC, platform role, consumer protection | NOT STARTED |
| C3 | Twilio / Akedly | Decide on OTP provider; configure production credentials if using Twilio; or keep dev-token bypass for alpha | NOT STARTED |
| C4 | AWS / S3 | Provide real S3 credentials; decide on bucket separation for payment proof vs. listing photos | NOT STARTED |

---

## D. Lawyer / Accountant Actions

| # | Item | Counsel/Accountant | Status |
|---|------|--------------------|--------|
| D1 | CBE PSP/PSO licensing opinion | Egyptian banking/fintech lawyer | OPEN |
| D2 | PDPL/KYC licensing and DPO requirement | Egyptian data-protection lawyer | OPEN |
| D3 | Consumer Protection Law 181/2018 disclosures | Egyptian consumer-law lawyer | OPEN |
| D4 | Platform role / short-term-rental liability | Egyptian tourism/commercial lawyer | OPEN |
| D5 | Governing law and dispute forum | Egyptian lawyer | OPEN |
| D6 | Tax treatment of commission and payout | Accountant / tax advisor | OPEN |

---

## E. Engineering Follow-up (Identified, Not Implemented in This Pass)

| # | Item | Classification | Owner | Notes |
|---|------|---------------|-------|-------|
| E1 | Wire `refund_days=5` into `booking.cancelled` notification payload | P0 | Engineering | Tiny code change; value is decided |
| E2 | Replace fake collection account in `src/app/payments/services.py` | P0 (blocked by B1) | Engineering | Cannot proceed without real account from Founder |
| E3 | Separate payment-proof S3 bucket from public listing-photo bucket | P0 / P1 | Engineering + Founder | Privacy/security gap |
| E4 | Build refund calculation from V1 cancellation tiers | P1 | Engineering | Not required for first 1–10 manual transactions |
| E5 | Add 24-hour payment-deadline expiry timer | P1 | Engineering | Manual for alpha; no automatic timer currently |
| E6 | Add no-show / duplicate-payment handling in active flow | P1 | Engineering | Manual for alpha |
| E7 | Add account-deletion / data-export endpoints | P1 | Engineering | Privacy Policy gap |
| E8 | Implement data-retention enforcement | P1 | Engineering | Requires A8 decision |
| E9 | Decide keep/kill/wire dormant `finance`/`reservations` Stripe path | P1 | Founder + Engineering | Two parallel payment systems mounted |

---

## F. Deferred Items (Post-Alpha)

| # | Item | Rationale |
|---|------|-----------|
| F1 | Paymob/Stripe automated integration | Wait for Paymob response and legal counsel on Model A |
| F2 | AI pricing / cultural filters | Phase 2+ per DEC-008 |
| F3 | Reviews | V1.1 |
| F4 | Channel manager integrations | Explicitly excluded from V1 |
| F5 | Full governing-law / arbitration clause drafting | P2 legal |
| F6 | Cookie Policy | No cookie/tracking mechanism found |

---

**End of Founder Action & Decision Pack.**
