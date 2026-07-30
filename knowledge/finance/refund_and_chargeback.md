# Refund and Chargeback Operations — StayOS

**Domain**: Finance
**Audience**: Finance Team, Trust & Safety, Support, Founders
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Quarterly
**Tags**: refund, chargeback, Paymob, Stripe, dispute, cancellation, fraud, BR-FIN-01

---

## Purpose

This article defines how StayOS processes refunds and defends against chargebacks. These are the two financial loss mechanisms that most damage cash flow and merchant reputation. Every person who handles a refund request or chargeback response must understand both processes completely.

---

## Background

Refunds and chargebacks are fundamentally different problems:

- **Refund**: Guest (or StayOS) initiates return of funds through the platform. StayOS controls the process, communicates with the guest, and executes the transfer. This is a customer service action.

- **Chargeback**: Guest goes to their bank and disputes the charge without coming to StayOS first. The bank initiates the reversal process. StayOS has limited control and must respond within a strict deadline with evidence. This is a risk management action.

Chargebacks are more costly than refunds in every dimension: they incur bank fees, consume team time on evidence preparation, harm StayOS's merchant standing with Paymob/Stripe, and — if the chargeback rate exceeds thresholds — can result in merchant account termination. A chargeback that could have been resolved as a voluntary refund is always a failure of the support process.

---

## Part 1: Refunds

### Refund Types

**Type 1: Policy Refund (Cancellation)**
Guest cancels per the cancellation policy. Refund is automatic, policy-driven, no discretion.

| Cancellation Timing | Guest Refund | Host Payout |
|--------------------|-------------|------------|
| >7 days before check-in | 100% | 0% |
| 3–7 days before check-in | 50% | 50% minus commission |
| <3 days before check-in | 0% | 100% minus commission |
| Host cancels (any timing) | 100% | 0% |

Processing time: Refund initiated within 2 hours of confirmed cancellation. Visible in guest account: 1–5 business days depending on payment method.

**Type 2: Dispute Refund (Trust & Safety Ordered)**
Following a dispute investigation, Trust & Safety orders a full or partial refund. Finance executes the refund immediately upon receiving the decision.

**Type 3: Goodwill Refund (Service Recovery)**
StayOS voluntarily provides a credit or partial refund as a service recovery gesture without a formal dispute. Examples: maintenance issue resolved late, minor cleanliness complaint. Authorized amounts:
- Support Agent: up to EGP 300 per booking (credit, not cash refund)
- Support Lead: up to full booking value (cash refund)
- Credits are applied to next booking, not returned as cash, unless the guest insists.

**Type 4: Platform Error Refund**
StayOS caused the problem (double charge, wrong amount processed, payment gateway error). Full refund plus EGP 100 goodwill credit. Escalate immediately to Finance + the relevant technical team.

---

### Refund Processing Steps

1. **Verify authorization**: Who authorized this refund and at what amount? Required: Trust & Safety decision record, cancellation system record, or Support Lead written approval.

2. **Calculate refund amount**: 
   - Policy refund: use the cancellation policy table above
   - Dispute refund: per Trust & Safety's decision amount
   - Always refund to the ORIGINAL payment method only

3. **Execute in payment system**:
   - Paymob refunds: processed through the Paymob merchant dashboard or API
   - Stripe refunds: processed through the Stripe dashboard or API
   - Processing timeline: Paymob: 3–7 business days; Stripe: 5–10 business days; InstaPay: 1–2 business days

4. **Update the booking ledger**: Mark the booking as refunded with the amount, date, and authorization reference.

5. **Notify the guest**: "Your refund of EGP [amount] has been initiated today [date] and will appear in your account within [X] business days." Send via WhatsApp and email.

6. **Check host payout impact**: If the refund reduces the host's payout (dispute where host was at fault), update the payout accordingly or issue a payout clawback if the payout was already sent.

---

### Refund Complications

**Complication 1: Original payment method no longer available (card expired, account closed)**
- Fawry / cash payments: refund by bank transfer (collect bank details from guest)
- Expired card: Paymob and Stripe can still process refunds to expired cards (funds go to the new card linked to same account); if card is fully cancelled, process by bank transfer
- Guest must provide bank details in writing for any alternative refund method

**Complication 2: Partial refund where host was already paid**
- If the host payout has already been released and a subsequent dispute results in a partial refund to the guest, StayOS absorbs the refund cost initially
- StayOS then pursues recovery from the host account (deducted from next payout, or formal debt recovery if host leaves the platform)
- Document the host debt in the host's account immediately

**Complication 3: Currency difference**
- All StayOS bookings are in EGP
- If a guest paid with a USD/EUR card (Stripe), the refund is issued in EGP — the guest's bank performs the currency conversion at today's rate, not the rate at booking
- Disclose this to the guest proactively to prevent confusion about the refund amount

---

## Part 2: Chargebacks

### What Is a Chargeback?

A chargeback occurs when a cardholder disputes a charge with their bank instead of contacting StayOS. The bank contacts Paymob or Stripe, who then contact StayOS. StayOS has a window (typically 7–10 calendar days from the chargeback notification) to submit a rebuttal with evidence.

If StayOS does not respond in time, the chargeback is automatically decided against StayOS — the money is returned to the guest and StayOS also pays a chargeback fee (typically USD 15–30 per dispute).

If StayOS responds and wins: the money stays with StayOS and the chargeback fee is not charged (varies by payment processor).

---

### Chargeback Reasons (Know These by Code)

| Reason Code | Description | Frequency |
|-------------|-------------|-----------|
| 4853 | Cardholder dispute — not as described | High |
| 4855 | Non-receipt of goods/services | Medium |
| 4863 | Cardholder does not recognize | Medium |
| 4837 | No cardholder authorization | Low (fraud) |
| 4847/4812 | Declined transaction billed anyway | Very low |

The most common chargeback on StayOS will be **4853 (not as described)** — guest stayed but claims the property was misrepresented. This is the easiest chargeback to win with proper documentation.

The hardest chargeback to win is **4837 (no authorization)** — someone claims they never made the booking. This requires KYC identity evidence.

---

### Chargeback Response Package

Every chargeback response package must include the following documents:

**1. Booking Evidence**
- Booking confirmation with timestamp, guest name, email, and phone number
- Payment confirmation from Paymob/Stripe with transaction ID and cardholder details
- Terms and conditions the guest accepted at booking (including cancellation policy and refund policy)
- KYC verification records for the guest (if applicable and relevant)

**2. Service Delivery Evidence**
- Check-in confirmation (system record showing check-in timestamp)
- Guest was inside the property (any access code usage logs, if available)
- Post-cleaning/inspection photos dated BEFORE the guest's stay began
- Any communications with the guest DURING the stay (WhatsApp screenshots with timestamps)

**3. Dispute History (if guest previously contacted StayOS)**
- Any prior complaint from the guest about the same issue
- How StayOS responded (resolution offered or provided)
- Whether the guest accepted the resolution

**4. Rebuttal Letter**
Written by the Finance/Trust & Safety team. Structure:
- Transaction identification
- Statement of services provided
- Evidence of service delivery
- Evidence that the goods/services matched the description
- Why the chargeback reason code is not valid
- Request for chargeback reversal

---

### Chargeback Response Timeline

| Day | Action |
|-----|--------|
| Day 0 | Chargeback notification received from Paymob/Stripe |
| Day 0–1 | Finance team reviews notification, identifies the booking, begins evidence collection |
| Day 1–3 | Evidence package assembled (all documents listed above) |
| Day 3–6 | Rebuttal letter written, reviewed by Trust & Safety lead |
| Day 6–7 | Package submitted to Paymob/Stripe through their dispute portal |
| Day 7–30 | Bank arbitration period (varies by card network) |
| Final | Decision received: won (funds kept) or lost (funds reversed + fee) |

**Hard rule**: Never miss the submission deadline. A missed deadline is an automatic loss. Set calendar reminders from Day 0.

---

### Chargeback Prevention

The best chargeback defense is prevention:

**1. Clear booking confirmation at time of payment**
Guest who received a clear, detailed booking confirmation (property address, check-in time, access code, photos of the property) cannot credibly claim "I didn't know what I was booking."

**2. KYC reduces 4837 chargebacks**
A guest whose identity was verified at registration cannot claim "I didn't authorize this transaction." The KYC record is the strongest possible evidence against a no-authorization chargeback.

**3. Active communication during the stay**
A guest who WhatsApped with StayOS support twice during their stay cannot claim "I never received the service." Communication logs are evidence.

**4. Quick resolution of complaints during the stay**
A guest who complained about the AC and had it fixed in 2 hours is very unlikely to file a chargeback for "not as described." The complaint was resolved. Document the resolution.

**5. Clear cancellation policy acknowledgment**
Every guest accepts the cancellation policy at booking. This acceptance (timestamped) is submitted with every chargeback where the guest cancels late and disputes the no-refund charge.

---

### Chargeback Rate Management

**Target chargeback rate**: ≤0.5% of all transactions (volume basis).

**Paymob threshold**: Typically 1%. Exceeding triggers "high risk" merchant designation — increased scrutiny, possible account freeze.

**If chargeback rate exceeds 0.5%**: Immediate audit of all chargebacks in the past 30 days. Look for:
- Common guest profile (did the same guest file multiple chargebacks?)
- Common property (is one listing generating disproportionate disputes?)
- Common issue type (is there a systemic fraud pattern?)
- Response quality (are our chargeback responses winning?)

---

## Real-World Scenarios

### Scenario A: The Late Cancellation Chargeback
Guest cancels 1 day before check-in. Policy: no refund. Guest contacts their bank and files a chargeback claiming "services not received."

**Response**: This is a 4855 (non-receipt) chargeback. StayOS submits:
- Booking confirmation showing the dates
- Cancellation policy that the guest accepted at booking
- Record of the cancellation (guest-initiated, not StayOS-initiated)
- Evidence that the property was available and prepared for check-in
- Statement that the service was available but the guest chose not to use it per the cancellation policy

**Win probability**: High (80%+) with this evidence. The policy was clear and the guest accepted it.

### Scenario B: The "Not as Described" Chargeback
Guest stayed for 3 nights, checked out without complaint, then filed a chargeback 2 weeks later claiming the property was "not as described."

**Response**: This is a 4853 chargeback. StayOS submits:
- Booking confirmation with property description
- Check-in confirmation showing the guest accessed the property
- Pre-stay inspection photos of the property (time-stamped)
- Support contact history during the 3-night stay (no complaints received)
- Checkout confirmation (no complaints at checkout)
- Statement: guest stayed for 3 nights without reporting any issues during the stay or at checkout

**Win probability**: Very high (90%+). A 3-night stay with no complaints, then a post-stay chargeback, is a pattern the bank will recognize.

### Scenario C: The Fraudulent "No Authorization" Chargeback
Guest books and stays. 3 weeks later, chargeback filed: "I never made this booking." This is likely identity theft fraud (real cardholder had their card used by someone else) OR it is a bad-faith chargeback by the guest themselves.

**Response**: This is a 4837 chargeback.
- KYC verification records matching the guest profile (if verified)
- Device fingerprint from registration
- IP address at booking vs. guest's claimed location
- WhatsApp communication with the guest during the stay (if available — proving interaction)

**Win probability**: Medium. If StayOS has strong KYC data, the win rate is good. If the guest was not KYC-verified, the evidence is weaker. This is a primary reason KYC verification is required (BR-ID-01).

---

## Decision Tree: Refund vs. Chargeback Response

```
Received a payment reversal request. Who initiated?

GUEST contacted StayOS directly?
  → This is a refund request. Proceed with Refund Processing Steps.

BANK (via Paymob/Stripe notification) initiated?
  → This is a chargeback. Set Day 0 deadline. Start evidence collection immediately.

Is the chargeback amount consistent with a legitimate cancellation policy refund?
  YES → Did guest actually cancel? 
          YES → Voluntary refund would have been appropriate. Why didn't they contact us?
                Investigate whether communication channels were accessible.
          NO  → Guest is claiming non-refund policy was unfair. Strong case for StayOS.

Does the chargeback claim "not as described" but the guest stayed?
  → Pull all evidence of the stay: check-in confirmation, access logs, support contact history.
  → Build the evidence package proving service was delivered as described.

Does the chargeback claim "no authorization"?
  → Pull KYC records immediately. If guest is KYC-verified, this is the primary defense.
```

---

## Best Practices

1. **Respond to every chargeback, even small amounts.** A pattern of unchallenged chargebacks signals to Paymob/Stripe that StayOS accepts them, which invites more. Every chargeback gets a full response, regardless of the amount.

2. **Build the chargeback evidence package before you need it.** The pre-cleaning photos, the check-in confirmation, the support contact history — these exist because operations captured them during the normal booking lifecycle. The chargeback response simply compiles what already exists. If the evidence isn't there, the response fails.

3. **Track all chargebacks in a registry.** Date, booking reference, chargeback reason, amount, response submitted, outcome. This registry reveals patterns and measures win rate.

4. **Never refund after a chargeback is filed.** Once a chargeback is open, issuing a voluntary refund does not cancel the chargeback — it results in the guest getting their money back twice. Fight the chargeback OR issue the refund through the chargeback process; never both.

5. **Contact guests who file chargebacks.** If a guest files a chargeback, call them (not WhatsApp — a phone call). Explain that the matter is being handled through the bank process and ask if there's a reason they didn't contact StayOS first. Sometimes chargebacks are filed by mistake (guest didn't recognize the merchant name). Resolving these directly can withdraw the chargeback and save the fee.

---

## Common Mistakes

**Mistake 1: Missing the chargeback deadline**
The deadline is absolute. There are no extensions. A 9-day response window that results in a submission on day 10 is a loss. Set reminders from Day 0 with escalation if not submitted by Day 6.

**Mistake 2: Submitting incomplete evidence**
A chargeback response that lacks the booking confirmation, or the cancellation policy acknowledgment, or the check-in confirmation is weaker than a complete response. The bank needs a complete story. Missing documents create doubt.

**Mistake 3: Processing a voluntary refund after a chargeback is filed**
This pays the guest twice. Once a chargeback is received from the bank, only the bank process should proceed to resolution.

**Mistake 4: Treating all chargebacks as fraud**
Some chargebacks are mistakes (guest didn't recognize the charge name). Some are bad faith. Some are legitimate. Treat each case on its evidence and respond accordingly. A hostile, accusatory rebuttal letter loses chargeback cases — a professional, evidence-based response wins them.

---

## FAQs

**Q: Who at StayOS is responsible for chargeback responses?**
A: The Finance team is responsible for compiling the evidence package and submitting through Paymob/Stripe. The Trust & Safety lead reviews and approves the rebuttal letter before submission. The founder is notified of any chargeback above EGP 2,000.

**Q: Can we blacklist a guest who files a fraudulent chargeback?**
A: Yes. A guest whose chargeback is determined to be bad faith (they stayed, had no legitimate complaint, and filed a chargeback) should have their account suspended and be added to the fraud registry (`knowledge/trust/fraud_detection.md`). They cannot rebook on StayOS.

**Q: What is our target win rate for chargebacks?**
A: 70%+ win rate on contested chargebacks. Below 60% indicates either weak evidence practices in operations (pre-cleaning photos missing, no check-in confirmation) or a systematic fraud problem.

**Q: What happens to our Paymob account if we exceed the chargeback threshold?**
A: Paymob's standard high-risk threshold is approximately 1% chargeback rate. Above this, Paymob may require a reserve fund, increase their fees, or in severe cases terminate the merchant account. Managing chargeback rate is a business continuity issue.

---

## Checklist

### Refund Processing Checklist
- [ ] Refund authorization verified (Trust & Safety decision, cancellation record, or Lead approval)
- [ ] Refund amount calculated correctly per policy
- [ ] Refund issued to original payment method only
- [ ] Booking ledger updated with refund event
- [ ] Host payout adjusted if applicable (or host debt recorded)
- [ ] Guest notified with refund amount, method, and timeline

### Chargeback Response Checklist
- [ ] Chargeback notification received and Day 0 set
- [ ] Booking identified and all platform records pulled
- [ ] Evidence package assembled (all 4 categories)
- [ ] Rebuttal letter drafted
- [ ] Trust & Safety lead reviewed and approved
- [ ] Response submitted through Paymob/Stripe before deadline (Day 7)
- [ ] Chargeback registry updated with response submitted date
- [ ] Outcome recorded when received (won/lost, amount, reason)

---

## References

- `docs/02_product/BUSINESS_RULES.md` — BR-FIN-01 (escrow), BR-FIN-03 (payout halts)
- `src/app/finance/providers.py` — Paymob integration
- `src/app/reservations/services.py` — Cancellation policy implementation
- `knowledge/trust/fraud_detection.md` — Fraud guest registry

## Related Documents

- `knowledge/finance/escrow_model.md`
- `knowledge/finance/payout_operations.md`
- `knowledge/trust/dispute_resolution.md`
- `knowledge/support/escalation_playbook.md`
