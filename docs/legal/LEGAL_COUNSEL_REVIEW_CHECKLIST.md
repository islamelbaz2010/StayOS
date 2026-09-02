# StayOS — Legal Counsel Review Checklist

## 0. P0 Priority — Read These First

Everything else in this checklist is important; these six are what actually gates real-money transaction #1 or carry near-term deadlines:

1. **Payment licensing** (§ 8) — does StayOS's Guest→StayOS-account→Host model require Central Bank of Egypt PSP/PSO licensing?
2. **PDPL / KYC data processing** (§ 5) — does biometric-adjacent KYC processing (ID + selfie face-match) require a Personal Data Protection Center license, before the **31 October 2026** compliance deadline?
3. **Legal entity / disclosures** (§ 10) — StayOS has no registered entity to disclose yet; Consumer Protection Law 181/2018 Art. 37 requires this before any remote consumer contract.
4. **Platform role** (§ 3) — is "marketplace intermediary, not accommodation supplier" defensible given StayOS's actual level of control (approves listings, verifies payment, can suspend accounts)?
5. **Refund/legal disclosures** (§ 6) — do the now-decided cancellation tiers and fee-refundability rules (see `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md`, DECIDED as of 2026-08-24) need any different disclosure treatment under consumer law?
6. **Consumer protection** (§ 6) — pre-contract disclosure completeness under Law 181/2018 Arts. 36–37.

All commercial/operational numbers referenced below (commission rate, refund tiers, timing) are **already decided by StayOS** as of 2026-08-24 — counsel's job is to confirm their *legal* treatment, not to set the numbers themselves.

**Purpose:** let an Egyptian lawyer review the StayOS V1 legal package efficiently. This is a checklist and question list, not a summary of conclusions — none of the open questions below have been answered by this drafting process; that is exactly what counsel review is for.

---

## 1. Documents to Review (in this order)

1. `STAYOS_TERMS_OF_SERVICE_V1_DRAFT.md`
2. `STAYOS_HOST_AGREEMENT_V1_DRAFT.md` (read together with Terms — the authorization clause is the load-bearing part)
3. `STAYOS_CANCELLATION_REFUND_POLICY_V1_DRAFT.md`
4. `STAYOS_PRIVACY_POLICY_V1_DRAFT.md`
5. `LEGAL_GAP_REGISTER.md` — full list of open items, prioritized
6. `docs/phase--1/risks/09_LEGAL_RISKS.md` — earlier, broader speculative risk register (corporate structure, tourism regulation); still unresolved, referenced by the drafts above but not superseded by them

## 2. Business Assumptions Stated in the Drafts (verify or correct)

- StayOS operates as a marketplace connecting independent Hosts and Guests; it is **not** the accommodation provider and is **not a party** to the accommodation contract. **[Founder must confirm this is the intended positioning; counsel must confirm the legal consequence of it.]**
- **(Updated 2026-08-24)** StayOS's recommended V1/alpha model has the Guest pay into a StayOS-controlled account; StayOS manually verifies the transfer, deducts commission, and forwards the net amount to the Host. This is not framed as regulated "escrow," but counsel should independently assess whether it functions as one for licensing purposes (§ 8, priority questions).
- StayOS does not verify property ownership or listing authority — only the identity of the person submitting KYC documents. The Host Agreement's representation clause is the sole basis for treating a listing as authorized.
- No legal entity is currently disclosed in any draft (placeholder only).

## 3. Legal Questions

- Is the "marketplace intermediary, not accommodation supplier" characterization defensible under Egyptian consumer-protection and civil-contract principles given StayOS's actual level of control (approves listings, verifies payment, can suspend accounts)?
- What governing law and dispute forum should the Terms specify?
- Can the Limitation of Liability / Disclaimers sections (Terms of Service § 17–18) be drafted in a way that doesn't conflict with non-waivable protections under Consumer Protection Law 181/2018?

## 4. Regulatory Questions

- Does StayOS's business model, as currently coded, require any license or registration beyond standard commercial registration (e.g., tourism-sector approval, GAFI investment authority involvement)? The repository's own Phase-1 risk register flags this as unresolved (LEG-016–030) and is not itself a legal opinion.
- Does short-term-rental regulation in Egypt (national or, per the risk register, potentially compound/governorate-level) impose obligations on StayOS as the platform, versus solely on the Host?

## 5. Data-Protection Questions (Law 151/2020)

- Given the Executive Regulations in force since 2 November 2025 and the compliance deadline of **31 October 2026**: does StayOS's KYC flow (ID document OCR via AWS Textract, selfie-to-ID face match via AWS Rekognition) fall within a "sensitive data" or biometric-processing category requiring a PDPC license?
- Is a registered Data Protection Officer required for StayOS at its current or projected scale?
- Does StayOS's use of AWS, Twilio, Google/Firebase (none confirmed as Egypt-region-only) trigger the cross-border-transfer licensing provisions?
- What data-subject rights (access, correction, deletion) must be operationalized before real users are onboarded, and on what timeline relative to the 31 October 2026 deadline?
- What breach-notification procedure (72-hour PDPC / 3-business-day individual notice, per public summaries of the regulations) must StayOS have in place before processing real KYC/payment data?

## 6. Consumer-Protection Questions (Law 181/2018)

- What exact supplier-identification information (name, address, phone, email, commercial registration number, tax card) must appear in the Terms of Service before StayOS can lawfully contract with a consumer remotely (Art. 37)?
- What pre-contract disclosures (Art. 36) are specifically required for a booking transaction, beyond what the drafted Terms already include?
- Does StayOS need to reference or integrate with the statutory Consumer Protection Agency complaint mechanism?

## 7. Marketplace-Liability Questions

- What is StayOS's realistic liability exposure for: a fraudulent host, a misrepresented property, guest misconduct/property damage, a platform outage during a live transaction? (See the risk table drafted for internal use in the P0 readiness report from the prior task in this engagement, if available, for the operational-control side of this analysis.)
- Should StayOS carry any form of liability insurance before Closed Alpha, and does Egyptian law require or make this advisable for a marketplace of this kind?

## 8. Payment Questions

- **(Priority, added 2026-08-24)** StayOS's chosen V1/alpha model has the Guest pay into a StayOS-controlled account, with StayOS then forwarding the Host's net share (commission deducted) after manual verification. Does this fall within the Central Bank of Egypt's Law 194/2020 / June 2025 licensing framework for Payment System Operators / Payment Service Providers (entities holding customer funds, EGP 10–30M capital requirement, 3-business-day forwarding rule)? Does answer change based on transaction volume/scale (e.g., a 1–10 transaction closed alpha vs. ongoing operation)?
- **(Priority, added 2026-08-24)** As a lower-risk alternative, would StayOS collecting only its own service fee directly (Guest pays Host directly for accommodation; Guest pays StayOS its fee separately) avoid the above licensing question, since StayOS would only ever receive money that is unambiguously its own commercial income rather than a third party's funds passing through it?
- Does StayOS's manual role (displaying bank-transfer/Vodafone Cash instructions, collecting a reference number and proof screenshot, and confirming a transfer occurred) constitute a regulated payment-services activity under Egyptian law, even at small scale?
- Once Paymob (or another licensed PSP) is integrated for the long-term model, does routing funds through a licensed PSP's marketplace/split-payment product resolve the licensing question above for StayOS itself?
- Note for context: a separate, currently non-functional code path exists that would use Stripe and an escrow ledger if activated (`STRIPE_SECRET_KEY` is unset in every environment inspected) — counsel should be aware this exists in the codebase even though it does not describe current live behavior.
- The 10%/2%/4% commission split found in the codebase (see § 10, "Confirmed intended fee/commission model") has not been reviewed for compliance with any fee-transparency/disclosure requirement under Consumer Protection Law 181/2018 — should the Guest-facing price display the service fee as a separate line item, and is this already required by Art. 36's disclosure obligations?

## 9. KYC Questions

- Is AWS Rekognition's face-match processing of a selfie against an ID photo legally "biometric data processing" under Egyptian law, and if so what specific obligations attach?
- What happens, legally, to KYC documents/images after rejection — is there a mandated deletion timeline, or purely a business decision?
- Who inside StayOS may access raw KYC images, and does that access need to be logged/audited beyond what currently exists (private S3 bucket only, no access-logging feature confirmed in this review)?

## 10. Missing Company Information (counsel will need this before finalizing any document)

- [ ] Legal entity name and type (planned or existing)
- [ ] Commercial registration number (once obtained)
- [ ] Tax card number (once obtained)
- [ ] Registered business address
- [ ] Officially designated support/legal contact email and phone
- [ ] Confirmed AWS region(s) in actual use for production data storage
- [x] Fee/commission model — **DECIDED**: 10% host + 2% platform + 4% guest (Terms of Service § 8.5, Host Agreement § 9.3). Counsel to confirm disclosure treatment only, not the rate.
- [x] Host payout mechanism and timing — **DECIDED**: StayOS forwards net amount within 3 business days of verification (Host Agreement § 9.2).
- [x] Refund percentage/deadline tiers — **DECIDED**: Flexible/Moderate/Strict, 24h/5d/1wk, 100%/100%/50% (Cancellation & Refund Policy § 3). Counsel to confirm disclosure format only.

---

**Reminder to whoever hands this package to counsel:** every `[FOUNDER DECISION REQUIRED]` marker in the four draft documents must be resolved by the founder — counsel cannot make those business decisions, only confirm their legal consequences once made. Every `[LEGAL REVIEW REQUIRED]` marker is a genuine open legal question this drafting process could not and did not resolve.
