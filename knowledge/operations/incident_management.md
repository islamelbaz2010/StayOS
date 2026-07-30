# Incident Management — StayOS

**Domain**: Operations
**Audience**: Operations Team, Support, Founders, On-Call
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: incidents, on-call, emergency, escalation, platform-down, SLA, recovery

---

## Purpose

This article defines how StayOS identifies, classifies, responds to, and learns from incidents — whether operational (property emergency), systemic (platform outage), or external (regulatory contact, security breach). Everyone on the team must know what to do when something goes seriously wrong.

---

## Background

In Stage 1, the team is small and incidents are handled personally. There is no 24/7 NOC, no formal incident commander, no war room. What there is: clear classification, clear ownership, and clear communication. An incident that is handled slowly because nobody knew who was responsible is worse than a small team handling it fast with clear roles.

The goal of incident management is not to prevent all incidents (impossible) — it is to ensure that every incident is contained quickly, resolved completely, and learned from systematically.

---

## Core Concept: Incident Classification

### Severity Levels

| Level | Name | Description | Example | Response Time |
|-------|------|-------------|---------|--------------|
| P0 | Critical | Platform down or serious safety risk. Business-stopping. | API down for all users, guest safety incident | 5 min |
| P1 | Major | Significant impact on active guests or hosts. Core function impaired. | Payment processing failing, 3+ properties with turnover failure | 15 min |
| P2 | Moderate | Impacting some users but workaround exists. Degraded experience. | Notification system slow, single property equipment failure | 1 hour |
| P3 | Minor | Low impact, non-urgent. Can queue for regular work hours. | Non-critical bug, cosmetic issue, single user complaint | 4 hours |

### Incident Types

**Type A: Operational Incidents** (property-level failures)
- Guest lockout
- Property equipment failure (AC, water, electricity)
- Turnover failure / cleaning team no-show
- Host unreachable at check-in
- Property damage (active stay)

**Type B: Platform Incidents** (technical failures)
- API errors affecting booking flow
- Payment processing failure
- Database connectivity issues
- Authentication system failure
- Notification delivery failure

**Type C: Trust & Safety Incidents** (people-level risk)
- Guest physical safety threat
- Fraud detected in active booking
- Host misconduct report
- Illegal activity at a property

**Type D: External Incidents** (outside StayOS's direct control)
- Regulatory authority contact (tourism board, police)
- Press inquiry about an incident
- Building emergency (fire, flood) at a StayOS property
- Political/civil unrest affecting operations

---

## Detailed Explanation

### Step 1: Detection

How incidents are detected:

- **Guest or host report** via WhatsApp support
- **Platform monitoring alerts** (API error rates, database connection failures)
- **Operations team observation** during daily monitoring rounds
- **External notification** (regulatory body, news media, emergency services)

**Key principle**: The person who detects the incident is responsible for the next step — logging it and getting the right person involved. Detection + silence = negligence.

---

### Step 2: Classification

Within 2 minutes of detection, the detecting person must:
1. Assign a severity level (P0–P3)
2. Assign an incident type (A–D)
3. Determine who should lead the response

**Classification rule**: When in doubt, classify higher (e.g., if unsure between P1 and P2, call P1). Downgrading is faster than escalating after delay.

---

### Step 3: Notification

| Severity | Who is notified | How | Within |
|----------|----------------|-----|--------|
| P0 | Founder + entire ops team + on-call | Phone call | 5 min |
| P1 | Operations Manager + relevant leads | WhatsApp group + phone | 10 min |
| P2 | Operations Manager | WhatsApp | 30 min |
| P3 | Support team | WhatsApp log | 4 hours |

**No silent incidents.** Even if you believe you can resolve it alone, notify the appropriate level. The cost of a notification that wasn't needed is 30 seconds of someone's time. The cost of an unnotified incident that escalates is hours of damage control.

---

### Step 4: Response and Command

**P0 and P1 incidents require a designated Incident Commander** — one person who owns the resolution process. In Stage 1:
- P0: Founder takes command
- P1: Operations Manager takes command
- P2: Support Lead or Operations Manager takes command

The Incident Commander is responsible for:
1. Maintaining awareness of the current status
2. Directing resources (who does what)
3. Communicating status updates every 30 minutes (to team) and every 15 minutes (to affected users)
4. Declaring the incident resolved

Every other team member: do their assigned task, report back to the Incident Commander, do not improvise.

---

### Step 5: User Communication During Incident

For any incident affecting users (guests, hosts):

**P0 — First Communication Within 10 Minutes of Detection**:
"We're aware of an issue affecting [brief description] and our team is working on it now. We'll update you every [timeframe]. Reference #[number]."

**Update Cadence**:
- P0: Every 15 minutes until resolved
- P1: Every 30 minutes until resolved

**Resolution Communication**:
"The issue with [brief description] has been resolved as of [time]. [Brief explanation of what happened and what was done to fix it.] We apologize for the disruption."

**Rule**: Never go silent during an active incident. A status update that says "still working on it" is infinitely better than no update.

---

### Step 6: Resolution and Verification

The incident is resolved when:
1. The core failure is fixed
2. The fix is verified (not just deployed)
3. Affected users have been contacted and confirmed they're operational
4. No additional failures have been triggered by the fix

**Post-resolution verification checklist**:
- [ ] Core service restored and tested
- [ ] All affected users / properties contacted
- [ ] No secondary failures observed (check for 30 minutes post-fix)
- [ ] Monitoring shows stable metrics

---

### Step 7: Post-Incident Review

**Every P0 and P1 incident gets a post-incident review within 48 hours.**

The review answers:
1. What happened? (timeline of events)
2. Why did it happen? (root cause, not just proximate cause)
3. How was it detected? (was the detection fast enough?)
4. How was it resolved? (was the response correct and fast?)
5. What would have prevented it?
6. What monitoring would have caught it earlier?
7. What action items result from this review?

**Action items from post-incident reviews are mandatory to complete within 30 days**, tracked by the Operations Manager.

Post-incident reviews are written in `.ai/LOGS/incident-[date]-[brief-name].md` and referenced in the monthly operations report.

---

## Playbooks for Specific Incident Types

### Playbook A1: Guest Lockout

```
Trigger: Guest reports they cannot access the property.

Immediate (within 5 minutes):
1. Acknowledge the guest (Template G1 from communication_templates.md)
2. Verify the correct access code from the host record
3. Send the correct code to the guest (Template B2)
4. Call the guest within 5 minutes if the code issue persists

If code is correct but still not working (within 10 minutes):
5. Contact host by phone (emergency number on file)
6. Simultaneously contact building manager if host unreachable

If property access still not restored within 30 minutes:
7. Escalate to Operations Manager (P1 activation)
8. Operations Manager authorizes emergency hotel booking
9. Full refund authorized immediately
10. Host receives formal incident notice

After resolution:
- Root cause identified (wrong code? code changed by host? lock failure?)
- Host receives guidance on prevention
```

---

### Playbook A2: Turnover Failure (Cleaner No-Show)

```
Trigger: Operations team or check-in monitoring reveals property is NOT ready and incoming guest arrives in <3 hours.

Immediate:
1. Contact assigned cleaner by phone (not WhatsApp — phone)
2. Confirm: are they coming? ETA?

If cleaner is coming but late (ETA within 1 hour of check-in):
3. Contact guest: "Preparing your property is taking a little longer than expected. Your check-in will be slightly delayed. We'll update you by [time]."
4. Monitor completion. Do not let guest arrive to uncleaned property.

If cleaner confirmed no-show or ETA is impossible:
5. Escalate to Operations Manager immediately (P1)
6. Operations Manager dispatches backup cleaner from roster
7. If no backup available within 45 minutes: escalate to alternative accommodation
8. Guest contacted with alternative or delay timeline

After resolution:
- Cleaner no-show recorded in cleaner performance log
- 3 no-shows = removal from roster
```

---

### Playbook B1: Payment Processing Failure

```
Trigger: Support receives multiple contacts about payment failure, or monitoring detects payment API error rate >5%.

Immediate:
1. Verify scope: is this one user or all users?
2. Test the payment flow in staging/test mode
3. Check Paymob/Stripe status page for outage notifications

If Paymob is down:
4. P0 activation — notify Founder immediately
5. Update booking flow: display "Payment processing temporarily unavailable. Please try again in [X] minutes."
6. Do NOT accept bookings during payment outage
7. Monitor Paymob status for resolution

If StayOS payment code is the issue:
8. Engineering on call to diagnose and fix
9. Rollback to last known good deployment if fix not available within 30 minutes
10. No new bookings accepted until payment is verified working

After resolution:
- Verify all payments that were attempted during the outage
- Any failed payments that should have succeeded: contact users and offer priority booking
```

---

### Playbook C1: Guest Safety Incident

```
Trigger: Guest reports a physical safety threat, injury, or dangerous condition.

Immediate (P0 — within 5 minutes):
1. Call the guest (WhatsApp call or regular call) — do not wait for text
2. If life-threatening emergency: instruct guest to call emergency services (123/122) FIRST
3. Get the guest's exact location
4. Contact building manager / property manager
5. Notify Founder immediately

Founder actions:
6. Decide on full evacuation vs. on-site resolution
7. Authorize emergency alternative accommodation if needed
8. Determine if property should be permanently blocked pending investigation

After immediate safety is secured:
9. Full refund authorized immediately
10. Document all evidence for legal protection
11. Host account suspended pending safety investigation
12. Post-incident review within 24 hours (not 48)
```

---

### Playbook D1: Regulatory Authority Contact

```
Trigger: Police, tourism board, central bank, or any government authority contacts StayOS.

Immediate:
1. Note the authority's name, badge/ID number, and stated reason for contact
2. Do NOT provide any information without involving the Founder
3. "Thank you for reaching out. I'm going to connect you with our founder who can address your request appropriately."

Founder:
4. Engage legal counsel before responding substantively to any regulatory inquiry
5. Do not admit fault, provide data, or make commitments without legal advice
6. Document all interactions

This applies to online inquiries (official email from a ministry) as well as in-person visits.
```

---

## Real-World Scenarios

### Scenario A: The 3pm Cascade Failure
On a Friday afternoon, 3 turnovers are scheduled simultaneously. Two cleaners are stuck in traffic, one property has a maintenance issue. Three check-ins scheduled from 3pm–4pm.

**What correct incident management looks like**:
- 1:00pm: Operations morning review identifies 3 same-window check-ins with cleaners confirmed. No issue yet.
- 2:30pm: Operations calls each cleaner — two are stuck in traffic on the Ring Road. Expected ETA: 4:30–5pm.
- 2:31pm: Operations Manager activated (P1 incident). Two properties at risk.
- 2:35pm: Backup cleaners contacted from roster. One available immediately. One unavailable.
- 2:40pm: Guest 1 contacted: "Your check-in will be available at 5pm instead of 3pm — we're preparing your property. Would you like our recommendation for a nearby café?" (The hospitality recovery move.)
- 2:45pm: Third property cleaning team proceeds normally. That check-in is fine.
- 2:50pm: Guest 2: one backup cleaner dispatched. Should be ready by 4:30pm. Guest contacted with 4:30pm timeline.
- 5:15pm: Both delayed guests checked in. Goodwill credits issued.

**What wrong incident management looks like**: Nobody monitors until the guest WhatsApps at 3pm. Three simultaneous crises with no preparation. Three upset guests and no resources to fix any of them.

### Scenario B: The Slow Payment System
Monday morning, 8 support contacts in 30 minutes: "My payment didn't go through." Operations team checks — Paymob API response times are 8–12 seconds instead of <1 second.

**Correct response**:
- This is degraded but not down. P1 incident.
- Operations Manager informed.
- Engineering checks Paymob status: "Paymob reported degraded performance 6:30am–10am."
- Booking flow updated with "payment may take additional time to process."
- All 8 contacts responded to: "Our payment processor is experiencing delays this morning. Your booking attempt was not charged — please try again at 10am when the issue is expected to be resolved."
- 10:15am: Performance normal. Monitoring confirms resolution.
- Post-incident: Consider adding a Paymob status check to the morning operations review.

---

## Decision Tree: Incident Response

```
Incident detected. Can you resolve it alone in <5 minutes?
  YES → Resolve. Log in daily operations note. No incident created.
  NO  → Continue.

Does it affect guest safety or platform-wide access?
  YES → P0. Call Founder immediately. Activate all hands.

Does it affect 3+ guests or hosts with no workaround?
  YES → P1. Notify Operations Manager. Coordinate response.

Does it affect 1–2 guests with a workaround available?
  YES → P2. Notify Operations Manager. Handle in parallel with normal operations.

Is it a systemic signal that needs investigation but no immediate user impact?
  YES → P3. Log, queue, address in next operations meeting.
```

---

## Best Practices

1. **Declare early, downgrade later.** It costs nothing to declare P1 and have it resolve in 20 minutes. It costs a lot to discover at the 90-minute mark that what you thought was P2 was actually P1.

2. **The Incident Commander does not resolve the incident — they command.** In a crisis, the instinct is to jump in and fix things personally. The IC who is calling the cleaner, texting the guest, AND debugging the API is failing at all three. Assign resources and coordinate; don't execute.

3. **Communication is half the job.** A guest who is locked out but hears from StayOS in 5 minutes with a plan is a very different guest from one locked out who hears nothing for 30 minutes. The technical fix and the communication happen in parallel.

4. **Post-incident reviews must produce action items.** A review that concludes "we'll do better next time" with no specific actions is worthless. Every review must end with named owners and deadlines.

5. **Build the on-call roster before you need it.** In Stage 1, the on-call roster is likely just the founder and operations manager. Before go-live of the first property, this roster must exist with direct phone numbers verified as functional.

---

## Common Mistakes

**Mistake 1: Treating a P1 as a P3 to avoid "bothering" the manager**
The manager would rather be called at 2pm with a P1 that resolves in 30 minutes than be called at 4pm to find out a P1 that wasn't escalated is now a P0.

**Mistake 2: Resolving the symptom without finding the root cause**
The AC was fixed. Great. But why did it break? If it's because the host hasn't serviced the HVAC in 3 years, fixing it once means it breaks again next month. Root cause analysis is not optional.

**Mistake 3: No post-resolution verification**
Declaring the incident resolved 5 minutes after deploying a fix, without testing whether the fix actually works, creates a false sense of resolution that the next guest will disprove.

---

## FAQs

**Q: Who is on call at 3am?**
A: In Stage 1, the founder and operations manager share on-call duty. P0 incidents require an immediate call regardless of time. P1 requires a call within 20 minutes. P2 and P3 can wait until operational hours.

**Q: What if the on-call person is unreachable?**
A: Every on-call person must name a backup before their on-call window starts. If the primary is unreachable, the backup takes over. This must be established before the first property goes live.

**Q: Do we communicate incidents publicly (social media, website)?**
A: For P0 platform-wide outages that affect many users: yes, post a brief status update on the platform. For individual property incidents: no, communicate only with affected parties.

---

## Checklist

### Active Incident Checklist (P0/P1)
- [ ] Incident detected and classified within 2 minutes
- [ ] Appropriate team members notified within 5 (P0) or 10 (P1) minutes
- [ ] Incident Commander designated
- [ ] Affected users contacted within 10 minutes
- [ ] Status updates sent every 15 (P0) or 30 (P1) minutes
- [ ] Resolution verified (not just deployed)
- [ ] Affected users confirmed operational
- [ ] Incident closed and time logged
- [ ] Post-incident review scheduled within 48 hours

---

## References

- `knowledge/support/escalation_playbook.md`
- `knowledge/operations/daily_operations_runbook.md`
- `knowledge/operations/escalation_matrix.md`
- `docs/03_customer_experience/TRUST_FRAMEWORK.md`

## Related Documents

- `knowledge/operations/escalation_matrix.md`
- `knowledge/support/support_workflows.md`
- `knowledge/trust/dispute_resolution.md`
