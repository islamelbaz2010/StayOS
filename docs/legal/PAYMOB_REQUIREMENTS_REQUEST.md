# Paymob Requirements Request — FINAL VERSION, Ready to Send

**Status:** Reviewed and finalized in the 2026-08-24 Legal & Commercial Decision Gate sprint. No changes needed to the question list from the prior draft — it was already complete, and no wording claimed an unconfirmed Paymob capability as fact. One addition made below (§ 3 now states StayOS's actual decided commission structure, so Paymob's answer is concrete rather than generic).

**Purpose:** send this to Paymob to determine whether/how their platform supports StayOS's marketplace payment model. Not sent yet — prepared for founder review and dispatch. No Paymob capability below is asserted as confirmed; each is either sourced from Paymob's own public materials (marked) or explicitly framed as a question for Paymob to answer.

---

## Message to Send

> Hi — we're building StayOS, an Arabic-first hospitality marketplace in Egypt connecting independent property hosts with guests. We're evaluating Paymob as our payment infrastructure and want to confirm the right product/structure before integration. Our model:
>
> - A **Guest** books accommodation from a **Host** through our platform and pays the full amount (accommodation + our service fee).
> - We need to **automatically deduct our platform commission** and **pay out the net amount to the Host**.
> - We currently have **~0 real hosts** (pre-launch, closed alpha starting with a handful of transactions), scaling from there.
>
> We understand Paymob offers a Marketplace product with split payments and sub-merchant onboarding — could you confirm:
>
> 1. **Marketplace structure:** Does your Marketplace/split-payment product support a single "Guest pays, platform + Host both get their share automatically" flow? What's it called and how is it structured (sub-merchant per Host, or a single merchant account with StayOS calculating and initiating each split)?
> 2. **Host onboarding:** What KYC/onboarding does each individual Host need to complete with Paymob before they can receive payouts (e.g., national ID, bank account, business registration)? Can this happen per-host on an ongoing basis as we add hosts, or does it need to be batch-set-up upfront?
> 3. **Commission/split configuration:** Our current model deducts 10% + 2% (12% total) from the Host's side and adds 4% to the Guest's side — can your split product apply a rate like this automatically per transaction? Can it be set per transaction, per host, or only account-wide, and can it be changed later?
> 4. **Settlement timing:** How long after a guest payment is confirmed does the Host actually receive their payout? Is this configurable?
> 5. **Refunds:** If a booking is refunded after Paymob has already split funds to the Host, how is that reversed — through Paymob's API, or manually?
> 6. **Chargebacks:** For card payments, what's our (the platform's) and the Host's exposure to a chargeback, and how are marketplace transactions typically handled differently from a normal merchant chargeback?
> 7. **Webhooks/reconciliation:** What webhook events do you send for payment confirmation, split settlement, payout completion, and refunds? Is there a reconciliation report/API we can pull for accounting?
> 8. **KYC/entity requirements for StayOS itself:** What does StayOS need (business registration, minimum volume, minimum capital, other licensing) to onboard as a marketplace merchant, versus a standard single merchant?
> 9. **API/sandbox:** Is there a sandbox environment for the marketplace/split-payment product specifically (not just standard checkout), and what's the process to get sandbox access now versus production access later?
> 10. **Production onboarding timeline:** Realistically, how long does marketplace onboarding take from application to live production, for a company at our stage (pre-revenue, closed alpha)?
> 11. **Fees:** What are your standard transaction fees for the marketplace/split product specifically (may differ from standard checkout fees)? Any setup or minimum-volume fees?
> 12. **Vodafone Cash / Fawry / Meeza support:** Can the marketplace/split product process these Egypt-specific payment methods, or is it card-only?
>
> We are not looking to integrate immediately — we want to understand feasibility and requirements first so we can plan our engineering work accurately.

---

## What We Already Know (Public Sources — Not Confirmed by Paymob Directly)

- Paymob is a Cairo-headquartered, CBE-licensed payment infrastructure provider serving Egypt, Saudi Arabia, UAE, Oman, and Pakistan. [Source: search-aggregated public description, paymob.com.]
- Paymob publicly advertises a "Marketplace" product offering split payments, multi-merchant/sub-merchant onboarding, and automated downstream payouts. [Source: paymob.com/en/marketplace.]
- Paymob's developer hub lists 18+ public APIs including Intentions, Subscriptions, and Card Tokens APIs; specific marketplace/split-payment API documentation was not independently verified in this pass and should be requested directly. [Source: developers.paymob.com/hub/egypt, apis.io/providers/paymob.]
- StayOS's codebase already has a Paymob integration skeleton (`src/app/finance/providers.py`: `paymob_auth_token`, `paymob_create_order`, `paymob_create_payment_key`, `create_paymob_payment`) — this is order/payment-key creation for standard checkout, **not** confirmed to be the marketplace/split product. This existing code is not being activated in this sprint; it is noted here only because it will shape what our engineering team asks about once Paymob responds.

**Do not claim to Paymob that any specific feature "exists" in our product yet** — we have code that anticipates a Paymob integration, but nothing is live. Frame this as a pre-integration feasibility conversation, not an integration-in-progress status update.
