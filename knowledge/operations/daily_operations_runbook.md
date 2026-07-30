# Daily Operations Runbook — StayOS

**Domain**: Operations
**Audience**: Operations Team, Founders, Support
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: operations, runbook, daily-ops, checklist, turnovers, support, escalation

---

## Purpose

This is the daily operating guide for the StayOS operations team. It defines what must happen every day, in what order, who is responsible, what good looks like, and what to do when things go wrong. Every person in an operations role must have read this document before their first shift.

---

## Background

Operations is the backbone of marketplace trust. Technology automates the predictable. Operations handles the unpredictable. In Stage 1, almost everything is unpredictable. This runbook is designed for a small team (2–5 people) managing daily operations manually with platform support.

The operations team is responsible for four continuous functions:
1. **Turnover orchestration** — cleaners dispatched, properties verified ready before each check-in
2. **Support triage** — guest and host issues resolved within SLA
3. **Inventory monitoring** — calendar integrity, no double-bookings, accurate availability
4. **Exception handling** — anything that falls outside normal automated flows

---

## Core Concept: The Operations Clock

Every day has a rhythm tied to check-in and checkout times:

```
06:00 — Morning operations review
08:00 — Checkout confirmations begin (most checkouts are 10am–12pm)
10:00–14:00 — Peak turnover window
14:00–20:00 — Peak check-in window
18:00 — Afternoon operations review
20:00 — Evening handoff to on-call coverage
23:59 — End of operations day
```

The critical constraint: every checkout must be followed by a completed, verified turnover before the next check-in in the same property. This is not always possible if checkout and check-in are on the same day — which requires same-day turnover completion.

---

## Detailed Explanation

### Morning Operations Review (06:00–07:30)

**Run every weekday morning. The on-call person runs it on weekends.**

**Step 1: Check Today's Calendar (10 minutes)**

Open the operations dashboard (or Google Sheets in Stage 1). For every active property:
- Who is checking out today? At what time?
- Who is checking in today? At what time?
- Is there a same-day turnover required? (Checkout before 14:00 + Check-in after 15:00 = manageable; tighter windows need pre-positioned teams)
- Are there any bookings where the checkout and check-in are less than 4 hours apart? → Flag as HIGH PRIORITY turnover

**Output**: A prioritized list of today's turnovers, ranked by check-in urgency.

---

**Step 2: Confirm Cleaning Team Assignments (15 minutes)**

For each turnover today:
- Is a cleaning team assigned? (Should have been pre-assigned yesterday)
- Has the cleaner confirmed they are coming? (WhatsApp confirmation required)
- If no confirmation from cleaner by 07:00: call immediately, escalate to backup cleaner if no answer by 07:30

**Never assume a cleaner is coming without same-day confirmation.** The most common turnover failure cause is a cleaner who agreed but did not show up.

---

**Step 3: Review Open Support Tickets (15 minutes)**

Check the support queue (WhatsApp Business, ticketing system, or operations dashboard):
- Any tickets from last night that are unresolved?
- Any tickets marked URGENT that do not have a response?
- Any host or guest complaints that require follow-up today?

SLA reminder:
- CRITICAL (safety, locked out, no water/electricity): respond within 15 minutes
- HIGH (cleanliness dispute, wrong amenity, access issue): respond within 1 hour
- MEDIUM (complaint, pricing question, request): respond within 4 hours
- LOW (feedback, non-urgent query): respond within 24 hours

---

**Step 4: Check System Health (10 minutes)**

Verify:
- Platform operational (`/health` endpoint returns OK)
- Payment processing operational (no failed transactions in queue)
- Notification delivery working (WhatsApp messages sent last night delivered?)
- Any alerts from monitoring (Sentry, Prometheus `/metrics`)

If any system is down: escalate to engineering immediately. Do not wait.

---

### Morning Checkout Monitoring (08:00–12:00)

As checkouts happen (most occur between 10:00–12:00):

For each checkout:
1. Confirm the checkout (platform auto-detects, or guest WhatsApps "we've left")
2. Notify the cleaning team: "Property [name] is now clear. You can begin."
3. Start the 4-hour countdown timer for that property's turnover
4. Mark the turnover ticket ACTIVE in the system

**Common problem: Late Checkout**

Guest was booked to check out at 11:00. It is 11:30 and there is no checkout confirmation.

**Response**:
1. WhatsApp the guest at 11:00 (checkout reminder sent automatically or manually)
2. If no response by 11:30: call the guest
3. If guest requests late checkout: check if next booking allows it. If yes: approve up to 13:00 maximum. If no: politely explain the next guest's check-in time and offer a luggage storage solution.
4. If guest is unresponsive and a next guest is arriving at 14:00: contact the host to use their key access. Document everything.

---

### Turnover Management (10:00–18:00)

This is the highest-stakes window of the day.

**Turnover status tracker (maintained in real-time)**:

| Property | Checkout Time | Cleaner | Started | Cleaning Done | Inspected | READY | Next Check-in |
|----------|--------------|---------|---------|---------------|-----------|-------|---------------|
| Unit A   | 11:00        | Mariam  | 11:15   | 13:00         | 13:30     | 13:30 | 15:00 ✅     |
| Unit B   | 12:00        | Ahmed   | 12:10   | ?             | ?         | ?     | 16:00 ⚠️     |

**If a turnover is tracking late**:
- 2 hours before check-in with no READY: escalate to operations manager
- 1 hour before check-in with no READY: proactively contact the arriving guest
- 30 minutes before check-in with no READY: offer the guest alternatives (see `knowledge/support/escalation_playbook.md`)

---

### Check-in Coordination (14:00–22:00)

For each arriving guest:

**2 hours before check-in**:
- WhatsApp sent to guest: "Your stay at [property name] in [area] is confirmed for today. Here are your access instructions: [key code / key pickup / building entry]. Please message us when you arrive and we'll confirm everything is ready."

**At check-in time + 30 minutes** (if no check-in confirmation from guest):
- WhatsApp: "Did you arrive safely? Is everything to your satisfaction? We're here if you need anything."

**First-hour issue detection**: 70% of stay-quality issues are reported in the first hour. A proactive check-in message dramatically reduces escalations because minor issues are resolved immediately instead of building into major disputes.

---

### Afternoon Operations Review (18:00–18:30)

**Daily review covering**:
- All turnovers completed: ✅ / count not done and why
- All check-ins completed: ✅ / any issues and resolution
- Open support tickets: count, SLA status, any overdue
- Payment exceptions: any failed payments or pending payout issues
- Tomorrow's preview: repeat morning review process for next day

**Record the review results** in the daily operations log (Notion, Google Sheets, or operations system). This log is the institutional memory for operations. Pattern analysis (three consecutive late turnovers on Fridays in Unit B = probably the same cleaner who is unavailable Fridays) requires a written record.

---

### Evening On-Call Coverage (20:00–06:00)

After 20:00, a designated on-call person monitors for emergencies. The on-call person is not expected to actively manage operations — they respond to CRITICAL and HIGH issues only.

**On-call coverage scope**:
- Locked-out guests
- Emergency at property (water leak, power outage, safety incident)
- Guest who cannot access the property
- Any guest safety concern

**On-call does NOT include**:
- Routine booking questions
- Pricing queries
- Non-urgent complaints

---

## Real-World Scenarios

### Scenario A: The 2pm Domino
Three properties all check out at 11am. Three cleaning teams are dispatched. One cleaner (Unit C) does not respond to the 11am confirmation WhatsApp. Operations calls: voicemail. It is now 11:30am. Unit C's next guest checks in at 3pm.

**Resolution**:
- 11:30: Call backup cleaner immediately
- 11:45: If no backup answer, call any available cleaner from the pool
- 12:00: If cleaner still unconfirmed, notify operations manager
- 12:30: If still unconfirmed, contact host — can they arrange emergency cleaning?
- 13:00: If still no cleaner: WhatsApp the arriving guest proactively: "We have a slight delay with your preparation. Your unit will be ready by 3:30pm instead of 3pm. We're sorry for this and are crediting your account with EGP 100 for the inconvenience."
- 15:00: Inspector confirms READY. Guest notified.

**Post-incident**: Document the cleaner absence. If this is a repeat pattern, remove from active pool.

### Scenario B: The Midnight Lockout
11:47pm. Guest WhatsApps: "I cannot get into the apartment. The key code is not working."

**Resolution**:
- On-call responds within 5 minutes: "I'm so sorry to hear this. I'm resolving it right now."
- Call the host immediately (emergency contact number on file)
- If host unreachable: try the building manager/doorman (should be on file for every property)
- If building manager can open the door: resolved
- If nobody can provide access: contact operations manager. Emergency hotel booking for the guest (StayOS covers the cost, charges back to host per contract)

**Root cause after resolution**: Why did the key code fail? Battery dead? Code changed? Lock malfunction? Document and fix before any future guest.

### Scenario C: The Back-to-Back Ramadan Booking Surge
During Ramadan, booking volume spikes 40%. Multiple properties have late-night check-ins (guests arrive after Iftar, around 9–10pm). Turnover teams are unavailable after 6pm due to Iftar and Tarawih prayer commitments.

**Proactive resolution** (this should be planned 2 weeks before Ramadan):
- Negotiate with cleaning team for flexible Ramadan hours (morning-only with premium Ramadan pay)
- Block properties from back-to-back booking during peak Ramadan evenings
- Pre-clear late-checkout/late-check-in properties by 6pm buffer
- Add a Ramadan operations protocol to the runbook for next year

---

## Decision Tree: Operations Triage

```
An issue has been reported. What is it?

SAFETY (gas leak, fire, injury, violence)?
  → Call emergency services FIRST (Fire: 180, Police: 122, Ambulance: 123)
  → Then notify operations manager and escalate
  → Document everything

LOCKED OUT (guest cannot enter property)?
  → Call host (within 5 min)
  → Call building manager if host unreachable (within 5 min)
  → If still stuck: operations manager + emergency hotel booking

PROPERTY NOT AS DESCRIBED (significant discrepancy)?
  → Is the guest already in the property?
        YES → Is the issue severe (no AC, no water, major cleanliness failure)?
                YES → Offer relocation immediately
                NO  → Offer resolution (repair/clean) within 2 hours
        NO  → Delay check-in, fix the issue first
  → Escalate to support team for dispute documentation

TURNOVER NOT COMPLETE (next guest arrives soon)?
  → How much time remains?
        >2 hours → Expedite cleaning team, no guest notification yet
        1-2 hours → Expedite AND send proactive delay notification to guest
        <1 hour → Notify guest immediately, offer compensation, escalate to operations manager

PAYMENT ISSUE (guest payment failed, host payout not received)?
  → Log the specific transaction ID
  → Check finance dashboard for status
  → If system error: notify engineering
  → Contact guest/host with status and ETA
```

---

## Best Practices

1. **Pre-assign every cleaning team before the checkout happens.** Do not assign day-of — assign the evening before. A cleaning team assigned at 8am for a 10am checkout is already behind.

2. **Build a bench of backup cleaners.** The primary cleaning team will eventually have an emergency. A single-source dependency on one cleaner per property will cause a guest disaster eventually. Maintain a list of 3–5 backup cleaners who know the StayOS standard and can be dispatched on short notice.

3. **Call, don't text, for urgent coordination.** WhatsApp messages to cleaners, hosts, and guests during time-critical situations are read too slowly. Call first. WhatsApp as a follow-up record.

4. **Log everything, every day.** The daily operations log is the most valuable database the company has. Pattern analysis from the log reveals systemic problems (always late on Fridays, always problems with Unit 4B's elevator) that cannot be seen from individual incidents.

5. **The proactive notification is always better than the complaint.** A guest who receives a 30-minute heads-up about a delay and a small credit will almost never leave a bad review. A guest who arrives to a not-ready property and discovers it themselves will almost always escalate.

---

## Common Mistakes

**Mistake 1: Assuming cleaners will confirm without prompting**
Never assume. Always require morning confirmation. Any cleaner who does not confirm by 07:30 is treated as unconfirmed until proven otherwise.

**Mistake 2: Not reviewing tomorrow's schedule today**
The morning review should include a 5-minute preview of tomorrow. Back-to-back bookings identified today allow pre-positioning teams. Discovered tomorrow morning, they cause emergencies.

**Mistake 3: Closing tickets without confirming resolution**
A ticket closed as "resolved" when the issue is still outstanding trains the team to optimize the metric instead of the outcome. Only close a ticket when the guest or host has confirmed the issue is resolved.

**Mistake 4: Manual tracking that diverges from platform**
If the team uses a manual spreadsheet AND the platform, they must be kept in sync. A unit marked READY in the spreadsheet but BLOCKED in the platform means the next booking cannot proceed. The platform is the system of record.

---

## FAQs

**Q: What if we have no issues in a day — is the runbook still required?**
A: Yes. The Morning Review and Afternoon Review happen regardless of issue volume. The purpose is detection, not reaction. You do not find out that tomorrow has a problematic back-to-back booking by waiting for tomorrow's emergency — you find it in today's 10-minute calendar review.

**Q: Who is on call during weekends and holidays?**
A: Establish a rotating on-call schedule before launch. Every operations team member takes a turn. Eid and major holidays require a senior team member on-call. On-call hours and response expectations must be in the employment agreement.

**Q: How do we handle a guest who checks in very late (e.g., 2am flight arrival)?**
A: The host should be informed of the arrival time at booking. If the host cannot personally receive late arrivals: use a smart lock or key safe. Confirm access method works before the guest travels. Have the on-call number ready for that night.

---

## Checklist

### Morning Operations Review Checklist (Daily)
- [ ] Today's checkout list reviewed and turnover priority established
- [ ] Cleaning teams confirmed for all turnovers
- [ ] Backup cleaner identified for each at-risk property
- [ ] Open support tickets reviewed for SLA compliance
- [ ] System health checked and confirmed operational
- [ ] Any overnight on-call issues reviewed and resolved or escalated

### Evening Operations Review Checklist (Daily)
- [ ] All today's turnovers completed and units marked READY
- [ ] All check-ins completed without unresolved issues
- [ ] Open support tickets updated with status
- [ ] Daily operations log updated
- [ ] Tomorrow's schedule previewed (back-to-back bookings flagged)
- [ ] On-call handoff confirmed (who is on call tonight and they have the briefing)

---

## References

- `docs/02_product/BUSINESS_RULES.md` — BR-OPS-01, BR-OPS-02, BR-OPS-03, BR-INV-02
- `src/app/operations/` — Platform operations module
- `src/app/operations/models.py` — OperationTask, FieldStaff, PropertyReadiness models

## Related Documents

- `knowledge/hospitality/turnover_operations.md`
- `knowledge/operations/incident_management.md`
- `knowledge/operations/escalation_matrix.md`
- `knowledge/support/support_workflows.md`
