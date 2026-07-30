# Payout Operations — StayOS

**Domain**: Finance
**Audience**: Finance Team, Support, Host Success, Founders
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Quarterly
**Tags**: payout, host-payment, escrow, BR-FIN-01, BR-FIN-03, commission, ledger, bank-transfer

---

## Purpose

This article defines how host payouts work — from the moment escrow releases to the moment funds arrive in the host's bank account. Anyone who answers questions about payouts, processes payouts, or troubleshoots payout issues must know this process completely.

---

## Background

Host payout timing and reliability is one of the top 3 drivers of host churn in any accommodation marketplace. A host who does not receive their payout on the expected timeline will lose trust quickly — regardless of how good the platform is in every other dimension. Payout operations must be reliable, predictable, and transparent.

In Egypt, payout complexity is higher than in Western markets because: (a) EGP currency controls limit certain transfer types, (b) some hosts are individuals without company accounts, (c) Paymob's payout rails are different from standard bank transfers, and (d) tax considerations are complex and not always well understood by hosts.

---

## Core Concept: Payout Flow

```
Booking Confirmed (Escrow Created)
         ↓
Guest Check-In Confirmed
         ↓
24-Hour Hold (BR-FIN-01) — Dispute Window
         ↓
Dispute Window Closes Without Dispute
         ↓
Payout Calculation
         ↓
Payout Routing Verified (BR-FIN-03 Check)
         ↓
Payout Initiated → Bank Transfer / Paymob Transfer
         ↓
Host Account Credited (1–3 Business Days)
         ↓
Host Notified (WhatsApp + Platform)
```

---

## Detailed Explanation

### Payout Calculation

Every payout is calculated as:

```
Gross Booking Value (guest paid)
- Host Commission (8–12% — StayOS's host-side revenue)
- Any Security Deposit Released (if applicable — passes through)
- Any Deductions (damage charges, if applicable)
= Net Host Payout
```

**Example calculation**:
- Guest paid: EGP 3,200 for 4 nights
- Host commission: 10% = EGP 320
- No damage deductions
- **Net payout to host**: EGP 2,880

**Cleaning fee**: If StayOS collects a cleaning fee from the guest as part of the booking, and StayOS manages the cleaning, StayOS retains the cleaning fee. If the host manages their own cleaning and sets their own cleaning fee, the cleaning fee passes through to the host (less commission).

**Guest service fee**: Collected from the guest, retained by StayOS. Never deducted from the host payout.

---

### Payout Routing Verification (BR-FIN-03)

Before any payout is processed, the system verifies:

1. **Legal name match**: The payout account's registered name must match the host's legal name on their KYC document exactly. "Mohamed Ahmed Khalil" cannot receive a payout to an account registered as "M. Ahmed" — the names must match character by character (BR-ID-02).

2. **Account verification status**: Payout account must have been verified at onboarding (micro-deposit confirmation or Paymob account verification).

3. **Tax status**: No outstanding tax errors on the host profile (BR-FIN-03). If tax fields contain an error, payout is held until the error is corrected.

4. **Active account**: No outstanding fraud investigations or account suspensions blocking the payout.

If any check fails, payout is held and the host is notified immediately with specific instructions on what needs to be corrected.

---

### Payout Methods

**Method 1: Paymob Merchant Transfer (Preferred)**
- Fastest for hosts already using Paymob for payments
- Processed within 1 business day
- Available for hosts with Paymob business accounts

**Method 2: Egyptian Bank Transfer (Standard)**
- Direct transfer to any Egyptian bank account
- Processing time: 1–3 business days
- Most common method for individual hosts
- Supported banks: CIB, NBE, Banque Misr, QNB, HSBC Egypt, and all major Egyptian banks

**Method 3: Instapay Transfer**
- For hosts who prefer mobile wallet settlement
- Processing time: immediate to 4 hours
- Useful for smaller hosts who manage cash flow via mobile banking

**International transfers**: Not supported in Stage 1. All hosts must have Egyptian bank accounts.

---

### Payout Schedule

**Standard schedule**: Payout initiated the same day the 24-hour escrow window closes. Bank processing: 1–3 business days after initiation.

**Payout batch timing**: Payouts are initiated in daily batches at 10:00am Cairo time. Any escrow that closed after 10:00am the previous day is included in the next day's batch.

**Example**: Guest checks in Monday at 3pm. 24-hour window closes Tuesday 3pm. Tuesday's 10am batch has already run. Payout initiated Wednesday 10am. Funds arrive Thursday or Friday depending on bank.

**Maximum effective delay**: For a Monday 3pm check-in, funds arrive Thursday–Friday. Host should be informed of this timeline at onboarding so there are no surprises.

---

### Payout Holds

A payout may be held beyond the standard schedule in these situations:

**Hold Type 1: Open Dispute (BR-FIN-01 exception)**
An unresolved dispute from the 24-hour window freezes the payout. The payout is released or redirected (refund to guest) upon Trust & Safety's decision.

**Hold Type 2: Payout Routing Error (BR-FIN-03)**
Legal name mismatch, tax error, or account verification failure. Host notified within 1 hour of the hold being placed. Hold lifted as soon as host corrects the specific issue.

**Hold Type 3: Fraud Investigation**
Trust & Safety has flagged the host account for investigation. Payout is held until the investigation concludes (24–48 hours standard, up to 7 days for complex cases).

**Hold Type 4: Account Balance Insufficient (Edge Case)**
In rare cases where StayOS's operating account has a temporary shortfall, payouts may be delayed by 1 business day. This should never happen if cash flow is managed correctly but must be documented here as a possibility.

---

### Payout Statements

Every host receives a payout statement with every payment. The statement includes:

- Booking reference
- Guest stay dates
- Gross booking value (what guest paid)
- Commission deducted (amount and percentage)
- Cleaning fee treatment (passed through or retained)
- Any deductions (damage, etc.)
- Net payout amount
- Payout method
- Expected arrival date

Payout statements are accessible in the host dashboard and delivered via email to the host's registered email address.

---

## Real-World Scenarios

### Scenario A: Host Payout Not Received
Host WhatsApps on Friday: "I haven't received my payment. Guest checked out last Monday."

**Response process**:
1. Pull the booking: confirm check-in time, check-out time, and payout initiation record
2. Check for holds: any open dispute? Any payout routing error? Any fraud flag?
3. If no holds found: check Paymob/bank transfer status — did it leave StayOS's account?
4. If transfer was initiated: share the transfer reference with the host so their bank can trace it
5. If transfer was NOT initiated: this is a system error — escalate to Finance immediately
6. Response to host: "Your payout of EGP [amount] was initiated on [date] to [bank name]. Transfer reference: [number]. Please allow 1–3 business days for your bank to process. If you don't receive it by [specific date], please contact us and we'll trace it directly."

### Scenario B: Name Mismatch Hold
Host onboards with KYC name "Mohamed Ibrahim Hassan" but provides payout account in the name "M. Ibrahim." Payout is held on first booking.

**Response**:
- System notifies host immediately: "Your payout is on hold because the account name 'M. Ibrahim' does not match your verified ID name 'Mohamed Ibrahim Hassan.' Please update your payout account to exactly match your legal name."
- Most bank accounts allow name corrections through the bank branch. If the host has difficulty, support walks them through the process.
- Payout releases immediately upon verification of the corrected account.

### Scenario C: Multi-Property Payout Reconciliation
A property management company manages 15 properties on StayOS. They want a single consolidated payout for all bookings completed in the week.

**Current capability**: Each booking generates a separate payout. Consolidated payouts are not available in Stage 1 but should be built for Stage 2 as a feature requirement for institutional hosts.

**Interim solution**: Provide the property management company a weekly payout report (CSV export of all completed booking payouts) so their accounting team can reconcile. Manual, but functional until the feature is built.

---

## Decision Tree: Payout Investigation

```
Host reports missing payout. When was check-in?

Check-in was in the last 48 hours?
  → Payout may not have been initiated yet (24h hold + batch timing).
  → Explain the timeline. No action needed.

Check-in was 2–5 days ago?
  → Check payout initiation record.
        Not initiated → System or routing error. Escalate to Finance immediately.
        Initiated → Check bank transfer status. Share transfer reference.

Check-in was 5+ days ago and payout not received?
  → Transfer reference shared with host's bank for trace.
  → If bank trace fails: likely routing error. Initiate a new transfer.
  → Document the failure case for Finance review.

Payout shows as HELD?
  → What is the hold reason?
        Open Dispute → Explain to host: "Your payout is held while the dispute is resolved."
        Routing Error → Notify host with specific correction required.
        Fraud Investigation → Do not reveal investigation exists. Say: "Your payout requires additional verification. Our team will contact you within [timeframe]."
```

---

## Best Practices

1. **Set payout timing expectations at onboarding.** Every host should understand the timeline before their first booking completes: check-in + 24h hold + batch timing + bank processing = 2–4 business days from check-in to funds received. This prevents the "where is my money?" call that damages trust.

2. **Maintain a payout status dashboard.** The Finance team should be able to see at any moment: how many payouts are pending, how many are in-transit, how many are held and why. This is the first tool for diagnosing systemic payout issues.

3. **Never use payout holds as leverage.** A payout hold is a technical or risk management action, not a negotiating tool. Withholding a payout to pressure a host to resolve a dispute faster is legally dangerous and ethically wrong.

4. **Reconcile daily.** The Finance team reconciles the payout ledger against the bank statement every business day. Discrepancies identified within 24 hours are far easier to resolve than discrepancies discovered weeks later.

5. **Send payout notifications proactively.** A host who receives a WhatsApp saying "Your EGP 2,880 payout has been initiated today" is happy before they even check their account. A host who checks their account and finds money without any notification wonders if they're getting the right amount.

---

## Common Mistakes

**Mistake 1: Processing payouts without name verification**
A single payout to the wrong person due to a name mismatch creates a financial recovery problem and a legal issue. Name verification must be part of every payout process, not just onboarding.

**Mistake 2: Not communicating payout holds immediately**
A host who notices their payout didn't arrive and cannot get information about why will escalate quickly. Any hold must generate an immediate notification with the specific reason and how to resolve it.

**Mistake 3: Confusing net and gross amounts with hosts**
"You'll receive EGP 3,000" when you mean the guest pays EGP 3,000 creates an expectation of EGP 3,000 and a real payout of EGP 2,700. Always communicate NET payout clearly: "The guest pays EGP 3,000. After our 10% commission, your payout is EGP 2,700."

**Mistake 4: Releasing payouts without checking the dispute window**
The 24-hour window must close cleanly before the payout is initiated. A payout that goes to the host while a guest dispute is being investigated creates a recovery problem. Payout automation must be strictly gated by dispute status.

---

## FAQs

**Q: Can a host request an advance on their payout before the 24-hour window closes?**
A: No. The 24-hour window is a firm guest protection mechanism (BR-FIN-01). No advances, no exceptions. If a host needs faster cash flow, the right solution is faster booking cycles and lower average nights between stays, not advance payouts.

**Q: What happens to the payout if the host's bank account is closed?**
A: The transfer fails and funds return to StayOS's account within 2–5 business days. StayOS contacts the host for updated banking details and re-initiates the payout. If the host does not provide updated details within 30 days, the funds are held in a dormant payout account per financial regulations.

**Q: Are host payouts taxable?**
A: This is a legal/accounting question that StayOS cannot answer for individual hosts. StayOS provides hosts with annual payout summaries for tax purposes. Hosts are responsible for understanding and meeting their own tax obligations. StayOS complies with Egyptian tax withholding regulations (BR-FIN-02) for applicable transaction types.

**Q: Can a host receive payouts in a currency other than EGP?**
A: Not in Stage 1. All payouts are in EGP. Currency conversion is the host's responsibility if they have foreign currency needs.

---

## Checklist

### Daily Payout Processing Checklist (Finance)
- [ ] All escrow windows that closed yesterday identified
- [ ] Payout routing verified for each (name, account verification, tax status, no holds)
- [ ] Payout batch submitted at 10:00am
- [ ] Payout notifications sent to all hosts in batch
- [ ] Payout ledger reconciled with bank outflow
- [ ] Any transfer failures identified and host notified immediately
- [ ] Daily payout report generated and saved

---

## References

- `docs/02_product/BUSINESS_RULES.md` — BR-FIN-01, BR-FIN-02, BR-FIN-03
- `src/app/finance/services.py` — Payout service implementation
- `src/app/finance/models.py` — HostPayout, EscrowLedger models
- `src/app/finance/providers.py` — Paymob payout integration

## Related Documents

- `knowledge/finance/escrow_model.md`
- `knowledge/finance/refund_and_chargeback.md`
- `knowledge/customer_success/host_lifecycle.md`
- `knowledge/training/finance_training.md`
