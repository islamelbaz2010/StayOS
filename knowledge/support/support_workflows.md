# Support Workflows — StayOS

**Domain**: Support
**Audience**: Support Team, Operations, Founders
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: support, workflows, SLA, tickets, triage, WhatsApp, CSAT, escalation

---

## Purpose

This article defines how StayOS handles every incoming support contact — from first message through resolution. It establishes SLAs, triage rules, communication standards, and the escalation path. Every support team member must follow this workflow on every contact.

---

## Background

In Stage 1, support is done almost entirely through WhatsApp Business. There is no chatbot, no ticket portal, no IVR tree. The StayOS support experience is: a human reads your message, understands your situation, and responds. This is a competitive advantage, not a limitation — and it must be maintained as volume grows through training, templates, and shift coverage, not by hiding behind automation.

Support volume prediction for Stage 1: approximately 2–3 support contacts per completed booking (one pre-stay, one during, one post-stay). At 100 bookings per month, this is 200–300 support contacts. At 1,000 bookings: 2,000–3,000. Planning staffing accordingly.

---

## Core Concept: The Four Support Pillars

1. **Speed**: First response within SLA every time, no exceptions
2. **Clarity**: One message that fully answers the question, not a conversation of 10 messages
3. **Authority**: Support agent has authority to resolve — no "let me check with my manager" for standard issues
4. **Follow-through**: The issue is not closed until the customer confirms it is resolved

---

## Detailed Explanation

### Incoming Contact Channels

**Primary**: WhatsApp Business (main +20 number, visible on website and all confirmation messages)
**Secondary**: In-app messaging (for logged-in users with active bookings)
**Emergency only**: Phone call (on-call number for after-hours critical issues)

All channels are monitored during operational hours. After-hours coverage is for CRITICAL and HIGH issues only.

---

### Step 1: Message Reception and Triage

Every incoming message is read and classified within the response SLA. Before typing a single word in response:

1. **Identify who is contacting**: Guest, host, or unknown?
2. **Pull their context**: Open their booking record immediately — who they are, what they booked, what stage of their booking they're in
3. **Classify the issue**: 

| Severity | Definition | Example | SLA |
|----------|-----------|---------|-----|
| CRITICAL | Physical safety or complete access failure | Locked out, injury, fire, no shelter | 5 min first response, 2h resolution |
| HIGH | Major stay-impacting failure | AC broken, property not as described, host no-show | 15 min first response, 4h resolution |
| MEDIUM | Service quality issue | Slow WiFi, minor cleanliness complaint, late check-in | 1h first response, 24h resolution |
| LOW | Information request or non-urgent inquiry | Cancellation policy question, receipt request | 4h first response, 24h resolution |

4. **Route appropriately**: CRITICAL and HIGH → operations team + support agent together. MEDIUM and LOW → support agent alone.

---

### Step 2: First Response

**Never let an SLA elapse without a response.** If you cannot resolve the issue within the SLA, send an acknowledgment before the SLA expires.

Acknowledgment format:
> "مرحبا [Name]! شكرا لتواصلك مع StayOS. استلمنا رسالتك بخصوص [brief issue description]. رقم مرجعك #[number]. سيتواصل معك فريقنا قبل [specific time]."
>
> "Hi [Name]! Thank you for reaching out to StayOS. We've received your message regarding [brief issue description]. Your reference is #[number]. Our team will be in touch before [specific time]."

**Do not use generic auto-replies.** Every first response must include:
- The person's name (shows you read their message)
- A brief description of the issue (shows you understood)
- A case reference number
- A specific time commitment (not "soon" — a clock time or timeframe)

---

### Step 3: Issue Resolution

**Resolution principles**:

**Principle 1: Resolve in one interaction whenever possible.**
A support conversation that takes 6 back-and-forth messages to answer one question is a failed interaction, even if the question is eventually answered. Before sending a reply, ask: "Does this message fully resolve the issue, or am I creating another exchange?"

**Principle 2: Give agents authority to resolve standard issues without approval.**
The following resolutions are pre-authorized for any support agent:
- Goodwill credit up to EGP 300 per booking
- Booking modification (change dates if availability permits)
- Sending additional property access instructions
- Extending check-in grace period up to 2 hours if next booking permits
- Confirming cancellation and refund timeline

The following require escalation to the support lead:
- Refunds >EGP 300 or full booking refunds
- Property relocation
- Host account suspension or warning
- Guest account suspension or warning
- Any case involving a safety incident

**Principle 3: Speak Arabic first, English second.**
All outgoing support messages are sent in Arabic first. If the guest/host has been communicating in English, mirror their language. Never send an Arabic message to someone who has been writing in English and vice versa.

---

### Step 4: Communication Standard

**Tone**: Warm, professional, and solution-oriented. Not corporate, not robotic, not over-apologetic.

**What works**: "Your AC should be working within the next 90 minutes — our technician has been dispatched. We'll check in with you then."

**What doesn't work**: "We sincerely apologize for the inconvenience caused by this unfortunate situation and assure you we are doing everything in our power to address your concerns as quickly as possible."

**Length**: Minimum necessary to fully answer the question. No padding. No unnecessary formalities beyond the initial greeting.

**Emojis**: Light use in casual contexts (1–2 max per message). No emojis in formal or complaint responses.

**WhatsApp formatting**: Bold with *asterisks* for key information (check-in time, address, reference number). No other markdown formatting (doesn't render in WhatsApp).

---

### Step 5: Escalation

When an issue exceeds the support agent's authority or expertise:

1. Do not tell the customer "I need to escalate this" — say "I'm getting [name/role] involved right now to resolve this quickly for you."
2. Brief the escalation point clearly: context, what was tried, what the customer wants
3. Transfer full communication responsibility — do not leave the customer messaging two people
4. The escalation point owns the resolution from that moment forward

See `knowledge/support/escalation_playbook.md` for full escalation rules.

---

### Step 6: Resolution and Close

A ticket is not closed until the customer confirms the issue is resolved.

**Confirmation message** (sent after solution):
> "هل تم حل المشكلة لديك؟ أي شيء تاني نقدر نساعدك فيه؟"
> "Has everything been resolved to your satisfaction? Is there anything else we can help you with?"

If the customer confirms: close the ticket. Record the resolution type.
If the customer does not respond within 24 hours: close the ticket with a note "No response after resolution attempt."
If the customer says it is not resolved: reopen and escalate.

---

### Step 7: Post-Resolution Quality Check

**Not every ticket — sampled tickets (10% random + all CRITICAL and HIGH).**

Quality dimensions:
- Was SLA met for first response?
- Was the resolution accurate and complete?
- Was Arabic used as primary language?
- Was tone appropriate?
- Was the issue resolved without unnecessary back-and-forth?

Score each dimension 1–5. Average across sampled tickets = the support quality score for that agent that week.

---

## Real-World Scenarios

### Scenario A: The Pre-Arrival Panic
Guest is arriving in 3 hours. WhatsApps: "أنا مش لاقي العنوان الصح على خرائط Google" (I can't find the correct address on Google Maps.)

**What went wrong**: The confirmation message contained only the neighborhood, not the full address + building name + GPS coordinates.

**Correct response (immediate)**:
- Reply within 5 minutes: "أهلاً [Name]! العنوان الكامل هو: [Full address with building name and floor]. إحداثيات Google Maps: [link]. لو محتاج تاني حاجة اتصل بيها على [on-call number]."
- Review the confirmation template — this information should be in the original message.
- Fix the template immediately.

### Scenario B: The Billing Confusion
Host WhatsApps: "ليه استلمت EGP 2,700 وليس EGP 3,000?" (Why did I receive EGP 2,700 and not EGP 3,000?)

**Correct response**:
- Pull the booking immediately and calculate: "The guest paid EGP 3,000. We deducted our 10% commission (EGP 300) which is what was agreed in your host agreement. Your net payout: EGP 2,700. Here's the breakdown: [detail]."
- If the host is new and didn't understand the commission: "I can also send you our commission explanation guide — would that be helpful?"
- Do not apologize for charging commission. It was agreed to at onboarding.

### Scenario C: The Angry Guest Mid-Stay
Guest WhatsApps at 11pm: "المكيف مش شغال وأنا فضيت 2 ساعة في عيلتي. أنا عارف إنكم مش بتردوا" (The AC isn't working. I've been waiting 2 hours with my family. I know you're not going to respond.)

**Correct response**:
- Respond within 5 minutes (this is HIGH severity)
- "أنا آسف جداً [Name]. اتصلت دلوقتي بالميكانيكي والبعت إيه اسمه و رقمه هيتصل بيك في خلال 30 دقيقة. هيحل الموضوع الليلة. لو في أي مشكلة تاني منا على رقم [number]."
- Actually call the technician before sending this — confirm they are available and will respond in 30 minutes
- Do NOT make a commitment you haven't verified
- Follow up at the 30-minute mark regardless of whether the guest messages again

---

## Decision Tree: Support Triage

```
Message received. Identify severity.

Does it involve immediate physical safety or complete access failure?
  YES → CRITICAL. All other activities stop. Respond in ≤5 minutes.
        Escalate to operations + on-call simultaneously.

Does it involve a stay-impacting failure (AC, water, property not matching)?
  YES → HIGH. Respond in ≤15 minutes.
        Operations notified if physical resolution required.

Is it a quality complaint or inconvenience during the stay?
  YES → MEDIUM. Respond in ≤1 hour.
        Resolution within 24 hours.

Is it an information question or non-urgent request?
  YES → LOW. Respond in ≤4 hours.

Can you fully resolve this within your authority?
  YES → Resolve, confirm, close.
  NO  → Brief the escalation point. Transfer ownership.
```

---

## Best Practices

1. **Read the booking context before responding.** A host asking "where is my payout?" gets a different response if they checked out 2 hours ago (payout is in the 24-hour escrow window) versus 5 days ago (something is wrong).

2. **One good message beats three short ones.** The goal is to close the issue in a single exchange. This requires thinking before responding, not responding first and figuring out the rest.

3. **Track response time personally.** Every support agent should know their average first-response time. If it's above the SLA for their volume, they need to identify why (too many contacts, slow classification, template gaps) and fix it.

4. **Create templates for every common scenario.** If you've answered the same question 5 times, write a template. Templates don't reduce quality — they increase consistency and speed. See `knowledge/support/communication_templates.md`.

5. **Never end a shift without clearing the queue.** Open contacts that are unanswered when a shift ends must be handed to the next shift with full context. A customer who sent a message 6 hours ago and has received nothing should never exist.

---

## Common Mistakes

**Mistake 1: Responding to the symptom, not the issue**
Guest says "the door isn't opening." Support sends the key code again. The code IS the problem — it's wrong. The support agent should ask: "Is the code you received [code]? Let me verify the correct code from the host right now." Responding to the symptom (send the code again) without diagnosing the issue (is the code correct?) creates additional failure.

**Mistake 2: Apologizing repeatedly instead of resolving**
"I'm so sorry about this... we sincerely apologize... I'm really sorry for the trouble..." An apology in the first message is appropriate. Three apologies with no action is noise. Customers want solutions, not apologies.

**Mistake 3: Closing tickets without customer confirmation**
Marking a ticket resolved after sending a solution (without waiting for the customer to confirm) produces artificially good resolution metrics but leaves real customers with unresolved issues.

**Mistake 4: Insufficient Arabic proficiency**
Arabic is the primary language. Support agents must be able to write fluent, natural Arabic (not Google Translate Arabic). Test this during hiring with a written WhatsApp response exercise in Arabic.

---

## FAQs

**Q: What hours is support expected to respond?**
A: Operational hours: 8am–10pm Cairo time (Sunday–Thursday), 10am–10pm Friday–Saturday. CRITICAL and HIGH issues: 24/7 on-call coverage. LOW issues: response within 4 business hours (next day if received after 8pm).

**Q: Can support agents offer discounts to unhappy customers?**
A: Goodwill credits up to EGP 300 per booking — yes, at the agent's discretion. Discounts on future bookings — yes, up to 15% at agent's discretion. Full refunds or credits above EGP 300 — must be approved by support lead.

**Q: What language do we use with GCC travelers?**
A: Standard Modern Arabic (فصحى) for written communication is universally understood. If the GCC traveler initiates in a Gulf dialect, mirror their dialect. If they write in English, respond in English.

---

## Checklist

### Incoming Contact Checklist
- [ ] Customer identity confirmed (guest or host)
- [ ] Booking context pulled before responding
- [ ] Severity classified (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] Response sent within SLA
- [ ] Issue fully addressed in response (not a partial reply)
- [ ] Customer confirmation received that issue is resolved
- [ ] Ticket closed with resolution type recorded
- [ ] Sampled tickets reviewed for quality score

---

## References

- `docs/03_customer_experience/CUSTOMER_JOURNEY_BIBLE.md`
- `docs/03_customer_experience/TRUST_FRAMEWORK.md` — Resolution SLA
- `src/app/notifications/` — Platform notification system

## Related Documents

- `knowledge/support/escalation_playbook.md`
- `knowledge/support/communication_templates.md`
- `knowledge/operations/incident_management.md`
- `knowledge/trust/dispute_resolution.md`
