# Finance Operations Training Program — StayOS

**Domain**: Training
**Audience**: Finance Team Members, New Hires
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: training, finance, escrow, payout, refund, chargeback, ledger, BR-FIN-01, reconciliation

---

## Purpose

This is the complete training program for Finance Operations team members at StayOS. By end of training, the team member can independently process daily payouts, handle refunds, respond to chargebacks, and maintain the payout ledger.

---

## Training Overview

**Duration**: 5 days
**Format**: Read → Shadow → Supervised processing → Independent + Assessment
**Assessment**: Written exam on business rules + live payout processing assessment

---

## Day 1: Financial Architecture

### Module 1.1: The Money Flow

Read `knowledge/finance/escrow_model.md` completely. This is the foundation of everything.

Money moves in this sequence for every booking:
```
Guest pays → Escrow pool (StayOS account, tracked per-booking) → 
Check-in confirmed → 24h hold → 
No dispute → Payout initiated → Host bank account (1-3 days)
```

**What "escrow" means in practice**: The guest's money is in StayOS's bank account. But it's not StayOS's money — it's a liability. Until the 24-hour hold closes and there are no disputes, that money belongs to the guest (for refund if cancelled) or the host (for payout after check-in). StayOS's revenue is the commission, separated from the escrow amount.

**The double-entry ledger requirement**: Every financial event creates two entries:
- Guest pays EGP 3,200: Debit Bank account EGP 3,200 / Credit Guest Escrow Liability EGP 3,200
- Payout initiated: Debit Guest Escrow Liability EGP 2,880 / Credit Host Payable EGP 2,880 + Debit Guest Escrow Liability EGP 320 / Credit Commission Revenue EGP 320

If you can't do double-entry bookkeeping, take a basic accounting course before your first week ends.

---

### Module 1.2: The Business Rules

These three rules govern everything you do. Violations are compliance failures:

**BR-FIN-01**: Payout cannot be initiated until 24 hours after confirmed check-in. No exceptions. No advances. No "the host needs it urgently."

**BR-FIN-02**: Tax compliance on applicable transactions. (Details from legal counsel — ensure you understand what applies before processing any transaction with tax implications.)

**BR-FIN-03**: Payout routing must be verified before release. Legal name on payout account must match legal name on KYC record exactly.

---

## Day 2: Daily Payout Operations

### Module 2.1: The Daily Payout Cycle

Read `knowledge/finance/payout_operations.md` completely.

**Daily routine**:

**10:00am**: Run the daily payout batch.

Before the batch runs, verify for each pending payout:
1. 24-hour window has closed (check-in timestamp + 24 hours < now)
2. No open disputes for this booking
3. Legal name match confirmed (BR-FIN-03)
4. Tax status clear (BR-FIN-03)
5. Host account not suspended or flagged

**After the batch**:
- Reconcile: total payout batch initiated = sum of all individual payouts in batch
- Notify all hosts via WhatsApp (Template E1 from `knowledge/support/communication_templates.md`)
- Log the batch in the daily payout report

**If a payout fails** (bank rejects, routing error):
- Identify the failure reason immediately
- Notify the host within 1 hour: Template E2 with the specific reason and steps to fix
- Set a follow-up reminder to ensure the issue is resolved

---

### Module 2.2: Payout Holds

Know when to place a hold and when to release:

**Place a hold when**:
- A dispute is filed during the 24-hour window
- Trust & Safety notifies Finance of a fraud investigation
- A BR-FIN-03 routing verification fails

**Release a hold when**:
- Trust & Safety communicates the dispute resolution
- Fraud investigation concluded with no action
- Host corrects the routing issue and Finance verifies the correction

**NEVER release a hold unilaterally.** Holds are placed and released based on communication from Trust & Safety or through the automated system. Manual hold releases require Trust & Safety Lead or Finance Lead approval.

---

## Day 3: Refunds and Chargebacks

### Module 3.1: Refund Processing

Read `knowledge/finance/refund_and_chargeback.md` — Part 1 (Refunds).

**Refund authorization sources**:
- Cancellation system record (automatic)
- Trust & Safety written decision
- Support Lead written approval (for goodwill refunds above EGP 300)

**NEVER process a refund without written authorization.** Even if a support agent verbally tells you to process a refund, the authorization must be in written form (WhatsApp message, email, or ticket).

**Refund to original payment method only**. If this is technically impossible (expired card, closed account), follow the complication handling procedures in the refund guide.

---

### Module 3.2: Chargeback Response

Read `knowledge/finance/refund_and_chargeback.md` — Part 2 (Chargebacks).

**The deadline is absolute.** When a chargeback notification arrives:
1. Note the notification date as Day 0
2. Set a hard calendar reminder for Day 6 (submission deadline) and Day 7 (hard deadline)
3. Begin evidence collection immediately

**Evidence package components** (memorize these 4 categories):
1. Booking evidence (confirmation, payment confirmation, T&C acceptance)
2. Service delivery evidence (check-in confirmation, access logs, communications)
3. Prior support contact history (did guest complain during stay?)
4. Rebuttal letter (written by Finance/T&S, approved by T&S Lead)

**Do not process a voluntary refund after a chargeback is filed.** This results in the guest being refunded twice.

---

## Day 4: Reconciliation and Reporting

### Module 4.1: Daily Reconciliation

At the end of every business day:
1. Pull the bank statement for the day (incoming and outgoing transactions)
2. Match each incoming transaction to a booking payment in the ledger
3. Match each outgoing transaction to a payout batch entry
4. Identify any unmatched transactions and investigate before end of day

**If a transaction is unmatched**: Do not close the day without resolving it. An unmatched transaction means either (a) the ledger is wrong, or (b) the bank statement is wrong, or (c) something happened that the system didn't capture. All three possibilities are problems that compound if not resolved same-day.

---

### Module 4.2: Monthly Financial Reports

At end of each month, produce:
- Total GMV (gross merchandise value = sum of all booking payments)
- Total commission revenue (StayOS's host-side revenue)
- Total service fee revenue (StayOS's guest-side revenue)
- Total payouts initiated
- Total refunds issued (by refund type)
- Chargeback report: filed, won, lost, pending
- Escrow balance at month end: how much is currently held in escrow

This report goes to the Founder by the 3rd business day of each month.

---

## Day 5: Assessment

### Written Exam: Business Rules

10 questions on BR-FIN-01, BR-FIN-02, BR-FIN-03. Must score 90%+ to pass.

Sample questions:
- "A host calls requesting advance payment before the 24-hour window closes because they have an emergency. What do you do?"
- "You receive a chargeback notification on Monday morning. What are the exact steps you take over the next 7 days?"
- "A payout is ready to initiate but the host's bank account name is 'S. Ahmed' while their KYC name is 'Sara Mohamed Ahmed.' What do you do?"

### Practical Assessment: Live Payout Processing

Under supervision, process one complete daily payout batch:
- Identify all pending payouts
- Verify each against BR-FIN-03
- Process the batch
- Generate notifications
- Reconcile against the ledger

**Pass criteria**: Zero errors. One BR-FIN-03 missed = fail. One unauthorized release = fail. All reconciliation differences resolved.

---

## Key References

- `knowledge/finance/escrow_model.md`
- `knowledge/finance/payout_operations.md`
- `knowledge/finance/refund_and_chargeback.md`
- `docs/02_product/BUSINESS_RULES.md` — BR-FIN-01, BR-FIN-02, BR-FIN-03
- `src/app/finance/services.py` — Implementation reference
