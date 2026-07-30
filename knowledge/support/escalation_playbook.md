# Escalation Playbook — StayOS

**Domain**: Support
**Audience**: Support Team, Operations, Trust & Safety, Founders
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: escalation, SLA, priority, incident, on-call, safety, triage

---

## Purpose

This playbook defines exactly when to escalate, who to escalate to, how to hand off, and what authority each escalation level has. An escalation that takes too long, goes to the wrong person, or loses context is worse than no escalation at all. This document removes ambiguity from every escalation decision.

---

## Background

Most support teams escalate too slowly (trying to resolve everything at the front line) or too randomly (escalating anything that feels difficult). Both patterns are failures. Slow escalation means critical issues spend too long without the right resources. Random escalation overloads senior team members with routine issues.

The right escalation system has clear triggers, specific paths, and defined authority at each level.

---

## Core Concept: Escalation Levels

```
Level 1: Support Agent        → Handles standard issues independently
Level 2: Support Lead         → Handles complex issues, approves non-standard resolutions
Level 3: Operations Manager   → Handles operational failures, field issues, turnovers
Level 4: Trust & Safety Lead  → Handles fraud, disputes, bans, safety incidents
Level 5: Founder/COO          → Handles major incidents, press/legal risks, platform failure
```

---

## Detailed Explanation

### Level 1: Support Agent

**Handles independently (no escalation needed)**:
- Information questions (cancellation policy, check-in time, how to use the app)
- Booking confirmation requests (resend confirmation, correct address)
- Minor complaints with standard resolution (goodwill credit ≤EGP 300)
- Check-in access issues that resolve within 30 minutes
- Billing/payment questions answered by booking record lookup
- Pre-stay date modification requests (if availability confirms)

**Authority**:
- Issue goodwill credits up to EGP 300 per booking
- Extend check-in flexibility up to 2 hours (if no incoming booking blocked)
- Confirm cancellation and refund timelines
- Resend any booking documentation

---

### Level 2: Support Lead

**Escalate from Level 1 when**:
- Resolution requires a refund or credit >EGP 300
- Issue has not been resolved within the Level 1 SLA
- Customer is threatening escalation (social media, formal complaint, legal)
- Issue pattern appears to affect multiple guests or hosts (systemic problem signal)
- Customer language or behavior is abusive and agent needs backup
- Issue requires modification of booking terms beyond standard policy

**Authority at Level 2**:
- Approve refunds and credits up to the full booking value
- Issue formal warnings to host or guest accounts
- Override standard cancellation policy in exceptional circumstances (documented)
- Coordinate with operations on property-level issues

**Escalation package from Level 1 to Level 2 must include**:
- Booking reference
- Full support thread to date
- Issue classification and severity
- What has been tried
- What the customer is requesting

---

### Level 3: Operations Manager

**Escalate from Level 2 when**:
- A turnover is critically late (next guest arrives in <1 hour, property not ready)
- A property has a physical failure (no electricity, no water, broken door) requiring field response
- A cleaner is a no-show with no backup arranged
- A host is unreachable and a guest needs access
- Multiple properties in the same area are experiencing issues simultaneously

**Authority at Level 3**:
- Dispatch emergency field staff
- Authorize emergency alternative accommodation bookings (charged to host account)
- Override cleaning team scheduling
- Issue property blocks (BLOCKED status — no new check-ins until resolved)
- Contact building managers directly

**Response time**: Operations Manager responds to Level 3 escalations within 10 minutes during operational hours, 20 minutes during on-call hours.

---

### Level 4: Trust & Safety Lead

**Escalate from Level 2 or Level 3 when**:
- Fraud is suspected (see `knowledge/trust/fraud_detection.md`)
- A formal dispute is opened between guest and host
- A guest or host threatens legal action
- Any safety incident involving physical harm
- A host or guest requests account ban or protection from the other party
- A chargeback dispute is received from a payment provider
- A review is reported as fake or retaliatory

**Authority at Level 4**:
- Suspend or ban any user account (host or guest) pending investigation
- Freeze payouts pending dispute resolution
- Authorize full refunds for safety incidents
- Submit chargeback disputes to Paymob/Stripe
- Engage legal counsel if required
- Issue formal Notice of Violation to host or guest

**Response time**: Trust & Safety Lead responds within 15 minutes for CRITICAL, within 1 hour for HIGH.

---

### Level 5: Founder/COO

**Escalate from any level when**:
- Platform is down (not a single user issue — systemic failure)
- A safety incident results in or threatens serious injury
- A complaint is posted publicly and has significant engagement (50+ shares, media contact)
- A regulatory authority makes contact (tourism board, central bank, police)
- A major institutional partner (hotel chain) threatens to terminate
- A situation requires a decision above the Trust & Safety Lead's authority

**Response time**: Immediate. Level 5 escalations are called directly, not messaged. At 2am if necessary.

---

## Escalation Triggers Reference Card

Use this as a quick reference. When in doubt, escalate.

| Situation | Level |
|-----------|-------|
| Guest can't find the address | 1 |
| AC not working, reported mid-stay | 1 (first 2 hours) → 3 (after 2 hours unresolved) |
| Guest wants refund > EGP 300 | 2 |
| Guest threatens to post on social media | 2 |
| Host is unreachable at check-in time | 3 |
| Turnover team didn't show up | 3 |
| Suspected fake listing | 4 |
| Guest reports physical threat from host | 4 + emergency services |
| Chargeback received from payment provider | 4 |
| Platform API is returning errors | 5 |
| Journalist contacts StayOS about an incident | 5 |
| Police or regulatory body contacts StayOS | 5 |

---

## Real-World Scenarios

### Scenario A: The 2am Lockout That Becomes a Level 5
Guest (family with 3 children) locked out at 2am. Host unreachable. Building manager unreachable. Spare key not provided. Support agent calls on-call (Level 3 operations manager).

Level 3 authorizes emergency hotel booking immediately, calls 3 backup contacts, covers cost. Issue resolved at 2:45am.

In the morning: the family posts on social media. "We were locked outside with our kids at 2am in Cairo. StayOS eventually put us in a hotel but the next day StayOS gave us a full refund plus [compensation] and personally apologized." — This is a potential positive story, but only if the resolution was handled well.

**Level 5 involvement**: Founder reviews the case the next morning and makes a personal call to the family. This is the right call — a public safety incident involving children requires founder-level attention, regardless of whether it was handled correctly operationally.

### Scenario B: The Systematic Complaint Pattern
A support agent notices that 3 different guests at the same property have complained about a persistent odor in the past 2 weeks. Each complaint was resolved individually with a goodwill credit.

**Correct action**: Escalate to Level 2 (Support Lead) as a systemic signal. Level 2 escalates to Level 3 (Operations Manager) to conduct a property inspection. If the inspection confirms a persistent issue (mold, drainage), the property is blocked until remediated. The host is notified. The pattern of complaints is documented.

If the agent had not noticed the pattern (by only looking at their own tickets), this would have continued to affect guests indefinitely.

### Scenario C: The Dispute That Becomes a Fraud Case
A guest files a dispute claiming the property was "dirty." Level 2 reviews the evidence and finds the dispute claim is vague and the pre-cleaning photos show a clean property. However, when reviewing the guest's account history, Level 2 notices this is the guest's 3rd post-stay dispute in 60 days across different bookings, all claiming vague quality issues.

**Correct action**: Escalate to Level 4 (Trust & Safety). This is refund abuse fraud pattern recognition, not a standard dispute. Trust & Safety opens a fraud investigation on the guest account.

---

## Decision Tree: Should I Escalate?

```
Can I fully resolve this issue within my authority?
  YES → Resolve it. No escalation needed.
  NO  → Continue below.

Does this involve a safety risk (physical harm, lockout with no shelter)?
  YES → Skip all levels. Go to Level 3 AND Level 5 simultaneously. Act immediately.

Does this require money beyond my authority or account action?
  YES → Escalate to Level 2 immediately. Do not delay while trying to solve it yourself.

Does this involve fraud, dispute, or threat of legal action?
  YES → Escalate to Level 4.

Does this require physical field response (turnover failure, property failure)?
  YES → Escalate to Level 3.

Has this SLA elapsed and issue is unresolved?
  YES → Escalate to next level immediately. Do not wait.

If none of the above, can you resolve with another 30 minutes?
  YES → Try. Set yourself a timer. Escalate if not resolved.
  NO  → Escalate now.
```

---

## Best Practices

1. **Escalate with context, not just the problem.** "I have a problem with a guest" is not an escalation — it's a transfer of anxiety. A proper escalation includes: booking reference, what the guest reported, what was tried, what the customer wants, and the current SLA status.

2. **Escalate early, not late.** The cost of an unnecessary escalation is a 2-minute conversation with the level above. The cost of a missed escalation is a crisis. Default to escalating when in doubt.

3. **One owner at a time.** Once a ticket is escalated, the receiving level owns it. The original agent does not continue messaging the customer independently. This avoids contradictory messages and customer confusion about who is handling their issue.

4. **Do not "park" tickets while waiting for escalation.** If you are waiting for a Level 2 decision and the customer WhatsApps asking for an update: give them an update. "We're finalizing your case with our team lead — we expect to have an answer within [time]."

5. **Document every escalation.** Date, time, escalation level, reason, outcome. This data reveals whether the escalation system is working (correct level, appropriate speed, right resolution) or needs adjustment.

---

## Common Mistakes

**Mistake 1: Trying to handle a Level 3 situation at Level 1 to avoid "bothering" the manager**
A turnover that is critically late needs the Operations Manager immediately. A support agent who tries to solve this by re-messaging the cleaner (without authority to dispatch a backup) will burn the SLA while the manager is unaware of the issue.

**Mistake 2: Escalating without a handoff message**
The receiving level must be fully briefed. A ticket that arrives with "urgent — please help" and no context forces the receiving person to re-read the entire conversation and potentially re-contact the customer for information already collected.

**Mistake 3: De-escalating too quickly**
A situation that was CRITICAL and is now "under control" is still under active management until it is fully resolved and the customer confirms. Do not send a CRITICAL ticket back to Level 1 the moment a technician is dispatched.

**Mistake 4: Escalating to the founder for non-Level-5 issues**
The founder is not the default escalation path for difficult situations. An inability to resolve difficult situations at Level 1–3 is a training gap, not a reason to involve the founder. Reserve Level 5 for genuine systemic failures and public incidents.

---

## FAQs

**Q: What if the escalation point is unreachable?**
A: Every level must have a backup. Level 2 backup: any other support lead or senior agent. Level 3 backup: any field operations manager or operations team member with dispatch authority. Level 4 backup: the founder during Stage 1. Level 5: no backup — the founder is Level 5.

**Q: How do we handle a customer who demands to speak to a manager?**
A: "I understand you'd like to speak with someone from our leadership team. I'm connecting you with [Support Lead name] right now." Do not argue about whether the escalation is warranted. If the customer wants a manager, they get a manager. The manager then decides if the escalation was appropriate.

**Q: What if the correct escalation level is unavailable at 2am?**
A: CRITICAL and HIGH: on-call coverage must be provided 24/7. Anyone on the on-call roster must be reachable by phone. MEDIUM and LOW: these can wait until operational hours.

---

## Checklist

### Escalation Checklist (Before Escalating)
- [ ] Severity classified correctly
- [ ] Booking context pulled and included in handoff
- [ ] Full support history summarized for receiving level
- [ ] What has been tried already
- [ ] What the customer is specifically requesting
- [ ] Current SLA status (are we within SLA or already over?)
- [ ] Receiving level contacted and confirmed they have the case

---

## References

- `knowledge/support/support_workflows.md`
- `knowledge/operations/incident_management.md`
- `knowledge/trust/dispute_resolution.md`
- `docs/03_customer_experience/TRUST_FRAMEWORK.md`
