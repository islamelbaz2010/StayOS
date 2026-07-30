# Dispute Resolution — StayOS

**Domain**: Trust & Safety
**Audience**: Support Team, Trust & Safety, Operations, Founders
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: dispute, resolution, refund, host, guest, evidence, SLA, mediation

---

## Purpose

This article defines how StayOS handles every dispute between a guest and host, from the moment a complaint is received through to resolution and post-resolution learning. Every support team member and Trust & Safety team member must internalize this process before handling their first dispute.

---

## Background

Disputes are not failures — they are the moments that define whether StayOS is a trusted platform or just another website. In Egypt's accommodation market, guests have historically received no support when something went wrong. A platform that resolves disputes fairly, quickly, and transparently builds a reputation that no marketing budget can buy.

The fundamental principle: **StayOS is the arbiter, not the advocate.** Neither the guest nor the host is automatically right. The job of the Trust & Safety team is to gather evidence, apply consistent standards, and reach a fair outcome — not to win the argument for one side.

**Response SLA** (referenced from `docs/03_customer_experience/TRUST_FRAMEWORK.md`):
- Initial response to any dispute: ≤15 minutes
- Resolution for Critical/Safety disputes: ≤2 hours
- Resolution for High severity disputes: ≤4 hours
- Resolution for Standard disputes: ≤24 hours

---

## Core Concept: Dispute Categories

| Category | Description | Examples | SLA |
|----------|-------------|---------|-----|
| CRITICAL | Safety risk, immediate action required | Injury, threat, locked out with no alternative | 2 hours |
| HIGH | Major property failure or misrepresentation | No AC, property doesn't match photos, host no-show | 4 hours |
| STANDARD | Quality dispute or amenity complaint | Cleanliness below expectation, WiFi slow, late check-in | 24 hours |
| REFUND | Post-stay financial dispute | Guest wants partial/full refund after checkout | 48 hours |
| HOST | Host complaint about guest | Property damage, guest misconduct | 48 hours |

---

## Detailed Explanation

### Phase 1: Dispute Intake

When a dispute is raised (via WhatsApp, app message, or support ticket):

**Intake actions (within 15 minutes)**:
1. Assign the dispute a ticket number
2. Classify severity (CRITICAL / HIGH / STANDARD / REFUND / HOST)
3. Acknowledge to the reporting party: "We've received your complaint. Case #[number]. We're investigating and will respond by [time based on SLA]."
4. Pull all account and booking context: booking record, KYC status, prior dispute history, any support contacts during the stay
5. Notify both parties that a dispute has been opened (guest and host each receive notification)

**Important at intake**: Do NOT make any promises about outcomes. Do NOT tell the guest they will get a refund or the host they will receive their payout before the investigation is complete. "We're investigating" is the only commitment made at intake.

---

### Phase 2: Evidence Collection

**Evidence collected from the guest**:
- Description of the issue with specific details (what exactly was wrong, when they noticed, what impact it had)
- Photos or videos provided by the guest
- Any communication between guest and host (screenshots of WhatsApp messages)
- Were they inside the property when they reported it, or post-checkout?

**Evidence collected from the host**:
- Host's account of events
- Pre-cleaning as-found photos (required under BR-OPS-03)
- Post-cleaning photos (from turnover inspection)
- Any communication between host and guest

**Evidence collected from platform records**:
- Booking confirmation and all booking terms
- KYC verification records for both parties
- Support contact history during the stay (were issues reported? When?)
- Check-in and checkout confirmation timestamps
- Payment and escrow status
- Review left by the guest (if any)

**Evidence quality rule**: Time-stamped, geotagged photos carry the highest evidentiary weight. WhatsApp messages with timestamps are strong secondary evidence. Verbal accounts without supporting evidence are insufficient to decide a financial outcome.

---

### Phase 3: Investigation and Decision

**The investigation answers these questions**:
1. What was the specific issue?
2. Was the issue caused by the host (property defect) or external factors (guest behavior, external event)?
3. Was the issue reported during the stay (giving the host/StayOS opportunity to fix it)?
4. Does the evidence corroborate the complaint or contradict it?
5. What financial impact is proportional to the verified issue?

**Decision framework**:

| Situation | Decision |
|-----------|----------|
| Property materially different from listing (major rooms missing, wrong location) | Full refund to guest; warning to host |
| Major amenity failure (no AC, no water) not fixed within 2 hours | Partial refund proportional to stay portion affected |
| Major amenity failure fixed within 2 hours | No refund; optional goodwill credit (EGP 100–200) |
| Minor quality issue (slower WiFi than expected, light not working) | No refund; optional goodwill credit (EGP 50–100) |
| Guest claims issues not reported during stay | No refund; claim not supported without contemporaneous evidence |
| Host proves guest caused damage with before/after photos | Security deposit applied; guest charged |
| No before/after photo evidence for damage claim | Host claim not supported; security deposit released to guest |
| Guest safety incident (injury, threat) | Full refund; potential host account suspension pending investigation |
| Host no-show (property inaccessible at check-in) | Full refund + additional compensation; host suspension |

---

### Phase 4: Decision Communication

**Communicate the decision to both parties simultaneously (not sequentially).**

Communicating to one party first creates an information asymmetry that the other party will perceive as bias.

**Language for decisions in favor of guest**:
"After reviewing the evidence from both parties, we have determined that [specific issue] represents [description of finding]. We are processing a [full/partial] refund of EGP [amount] to your original payment method. Please allow [1–3] business days. We are also taking action with the host to ensure this does not happen again."

**Language for decisions in favor of host**:
"After reviewing the evidence from both parties, including [list key evidence], we have determined that the claim [description] is not supported by the available evidence. Your payout of EGP [amount] will be released according to the normal schedule."

**Language when the decision is partial or nuanced**:
"The evidence shows [specific issue]. We have determined that a partial refund of EGP [amount] is appropriate to compensate for [specific portion of stay affected]. Your full refund timeline and what is included: [details]."

**Never use vague language**: "We reviewed everything" is not acceptable. "We reviewed the time-stamped pre-cleaning photos from 10:23am on July 14th and the guest's photos taken at 3:15pm on July 14th, and found no evidence of the water damage the guest described" is the standard.

---

### Phase 5: Execution

**Refund execution**:
- Refunds processed to original payment method only
- Processing time: 1–3 business days (dependent on Paymob/Stripe processing time)
- Guest notified when refund is initiated AND when it clears
- If refund requires holding host payout: hold immediately while dispute is open

**Payout release**:
- Once dispute is resolved in host's favor: release escrow per normal schedule
- If dispute caused a delay: communicate the delay and final release date to host

**Account actions**:
- First documented violation: formal written warning to account
- Second documented violation: 30-day suspension from new bookings
- Third documented violation or severe first violation: permanent ban
- All account actions documented in the account record with evidence reference

---

### Phase 6: Post-Resolution Learning

After every resolved dispute, the Trust & Safety lead must answer:
1. Could this dispute have been prevented? How?
2. Was the resolution process followed correctly?
3. Are there changes to property standards, operations, or support workflows that would prevent recurrence?
4. Should this dispute be added as a pattern to the fraud detection guide?

**Monthly dispute review**: A 30-minute monthly review of all disputes, looking for patterns. If 5 disputes in a month involve the same issue (e.g., WiFi not working as described), that is a systemic problem requiring a product or operations fix, not just a dispute resolution backlog.

---

## Real-World Scenarios

### Scenario A: The Ghost Check-In
Guest arrives at the property. The key code provided in the check-in instructions does not work. It is 9pm. Guest is standing outside in the dark. No response from host after 3 WhatsApp messages.

**Correct response**:
- On-call answers within 5 minutes
- Attempts to reach host by phone (emergency number on file)
- If host unreachable within 15 minutes: dispatches property manager or building manager with spare key
- If property access is not restored within 1 hour: immediately books the guest in the nearest acceptable alternative hotel and covers the cost
- Full refund issued immediately
- Host receives formal suspension pending investigation of why they were unreachable

**Why this resolution matters**: A guest locked out of a property at 9pm in an unfamiliar neighborhood will remember what happened next for the rest of their lives. A resolution in under 1 hour with a hotel and a sincere apology converts this into the most powerful trust story StayOS can tell.

### Scenario B: The Cleaning Dispute
Guest checks out. Posts a 2-star review: "The apartment was dirty. Bathroom had hair everywhere and the sheets weren't changed from the previous guest."

48 hours later, host sees the review and contacts StayOS demanding it be removed.

**Correct response**:
- Review the turnover photos from before guest check-in (taken by cleaning team per BR-OPS-03)
- If photos show a clean bathroom and fresh linens: respond to host "The inspection photos from [time] show the property was cleaned to standard. We cannot remove an honest guest review."
- If photos are missing or unclear: this is a protocol failure by operations. Host receives partial refund of commission. Guest receives goodwill credit. Operations team is counseled on photo requirement.
- If photos clearly show dirty bathroom and unchanged linens: the cleaning team failed. Host is not charged for this booking's commission. Guest receives a partial refund. Cleaning team receives formal warning.

### Scenario C: The Damage Claim
Guest checks out. 2 hours later, host WhatsApps photos of a cracked bathroom mirror, claiming the guest caused it.

**Correct response**:
- Request the pre-cleaning as-found photos from the turnover before the guest's stay
- If pre-cleaning photos show an undamaged mirror: damage occurred during the guest's stay
  - Contact guest with photos, inform them of the damage claim
  - If guest denies: compare check-in photos vs. checkout photos with timestamps
  - If damage confirmed: apply security deposit charge
- If pre-cleaning photos also show a cracked mirror: damage pre-existed. Host claim denied.
- If no pre-cleaning photos exist: operations protocol failure. StayOS bears cost. Host cannot charge guest.

---

## Decision Tree: Dispute Resolution

```
Dispute received. What is the severity?

CRITICAL (safety, locked out, no shelter)?
  → Immediate on-call activation. Resolution within 2 hours.
  → Full refund authorized automatically if stay is compromised.

HIGH (major amenity failure, host no-show, property misrepresentation)?
  → Evidence collection starts immediately.
  → 4-hour resolution target.
  → Partial or full refund based on verified impact.

STANDARD (quality complaint, minor issue)?
  → Evidence collected within 24 hours.
  → Goodwill credit considered (not automatic).
  → No financial outcome without evidence.

REFUND REQUEST (post-stay)?
  → Was issue reported during the stay? 
        NO → Claim not supported (no opportunity for resolution). No refund.
        YES → Was resolution provided? 
                YES (within SLA) → No refund. Issue was addressed.
                NO (missed SLA) → Partial refund proportional to impact.

HOST DAMAGE CLAIM?
  → Do pre-cleaning photos exist showing no damage pre-stay?
        NO → Claim cannot be supported without evidence. No charge to guest.
        YES → Guest is notified and asked to respond. Decision based on photo evidence.
```

---

## Best Practices

1. **Always acknowledge within 15 minutes.** The acknowledgment does not commit to an outcome. It commits to engagement. A guest or host waiting hours for a first response will escalate to social media.

2. **Never take sides publicly.** The response to a public review, WhatsApp post, or social media complaint from a guest or host is always: "We take this seriously. We've opened an investigation. Case #[number]. Please DM us." Never argue publicly.

3. **Document every decision with its specific evidence basis.** Decisions without documented evidence are pattern-inconsistent (different outcomes for similar cases based on who handled them). This creates legal exposure and guest/host perception of unfairness.

4. **The system that requires evidence creates the culture of evidence.** Operations teams take pre-cleaning photos because disputes require them. KYC is completed at registration because fraud defense requires it. Every evidence requirement must be enforced upstream, not just at the dispute resolution moment.

5. **Fast, fair, and final.** The worst dispute outcome is a resolution that is slow, unclear, or subject to reversal. Communicate once with a clear decision and make it final. Exceptions require written approval from the Trust & Safety lead.

---

## Common Mistakes

**Mistake 1: Promising outcomes before investigation**
"Don't worry, we'll get your refund" before evidence has been reviewed creates a commitment that the evidence may not support. Only "we're investigating" should be promised at intake.

**Mistake 2: Deciding based on who the complainant is (guest vs. host)**
The platform's business depends on both sides. A reputation for siding with guests against hosts will cause host churn. A reputation for siding with hosts against guests will cause guest churn. Decide on evidence, not sympathy.

**Mistake 3: Failing to communicate the decision to both parties**
The losing party often finds out about the decision through the other party instead of directly from StayOS. This is a trust failure regardless of whether the decision was correct.

**Mistake 4: No post-resolution follow-up**
The dispute is closed. The affected party is never contacted again. A guest who won a refund with no follow-up feels like a number, not a person. A simple "Your refund has been processed — how was the rest of your experience?" message closes the loop and creates a recovery opportunity.

---

## FAQs

**Q: Can a host counter-file a dispute against a guest who filed a dispute?**
A: Yes. Disputes can involve claims from both parties simultaneously. The investigation covers all claims from both sides in a single process. Counter-claims do not receive priority over the original claim.

**Q: What if the guest and host both have compelling evidence that contradicts each other?**
A: Escalate to the Trust & Safety lead. In truly ambiguous cases (no clear preponderance of evidence), a split resolution may be appropriate: partial refund to guest, partial payout to host, both parties receive a formal explanation of the ambiguity.

**Q: How do we handle a dispute in a language other than Arabic or English?**
A: All disputes in Stage 1 must be handled in Arabic (primary) or English. Documents in other languages require translation before they can be considered as evidence. The requesting party is responsible for translation at their expense.

**Q: Is there an appeal process?**
A: Yes. Either party may request a review within 7 days of the decision. The review is conducted by the Trust & Safety lead (not the original investigator). New evidence must be presented for the review to be accepted. The Trust & Safety lead's decision is final.

---

## Checklist

### Dispute Investigation Checklist
- [ ] Dispute acknowledged within 15 minutes (case # assigned)
- [ ] Severity classified (CRITICAL / HIGH / STANDARD / REFUND / HOST)
- [ ] Both parties notified that dispute is open
- [ ] All platform evidence collected (booking, KYC, photos, support contacts)
- [ ] Evidence collected from complaining party
- [ ] Evidence collected from responding party
- [ ] Decision made with documented evidence basis
- [ ] Decision communicated to both parties simultaneously
- [ ] Financial action executed (refund or payout) with timeline communicated
- [ ] Account action taken if warranted (warning / suspension / ban)
- [ ] Post-resolution follow-up sent
- [ ] Case added to monthly dispute review log

---

## References

- `docs/03_customer_experience/TRUST_FRAMEWORK.md`
- `docs/02_product/BUSINESS_RULES.md` — BR-FIN-01 (escrow), BR-OPS-03 (photo requirements)
- `src/app/reservations/services.py` — Cancellation refund policy implementation

## Related Documents

- `knowledge/trust/fraud_detection.md`
- `knowledge/finance/refund_and_chargeback.md`
- `knowledge/support/escalation_playbook.md`
- `knowledge/operations/incident_management.md`
