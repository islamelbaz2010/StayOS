# Operations Team Training Program — StayOS

**Domain**: Training
**Audience**: Operations Team Members, New Hires
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: training, operations, turnover, cleaning, inspection, runbook, escalation, incident

---

## Purpose

This is the complete training program for Operations team members. By end of training, the team member can independently manage the daily operations cycle, coordinate turnovers, and handle operational incidents.

---

## Training Overview

**Duration**: 5 days
**Format**: Read → Shadow 5 complete days → Execute 3 supervised days → Independent
**Assessment**: Complete a full day independently with debrief

---

## Day 1: Operations Foundation

### Module 1.1: The Operations Role

Operations at StayOS has one mission: **every property is READY before every guest arrives.** 

READY means:
- The property is clean (turnover complete)
- The property is inspected (quality confirmed, photos uploaded)
- The guest has their check-in instructions
- The access code works
- Someone is reachable if there's a problem

When this mission fails, guests have bad experiences. Bad experiences create disputes, negative reviews, and lost hosts. Operations failure is business failure.

---

### Module 1.2: The Daily Rhythm

Read `knowledge/operations/daily_operations_runbook.md` completely.

The operations day runs 06:00 to 23:59. Key touchpoints:
- **06:00**: System boot — review all check-outs and check-ins for the day
- **07:30**: Morning review — calendar, cleaner confirmation, system health
- **09:00**: Check-out monitoring begins
- **11:00**: Turnover windows open (most check-outs complete by 11am)
- **15:00**: Check-in window opens
- **22:00**: On-call handoff
- **23:59**: End-of-day review

**The most critical 4 hours**: 11am–3pm. This is when turnovers happen — the property transitions from checked-out to guest-ready. Every decision in that 4-hour window affects whether the next guest has a good check-in or a bad one.

---

### Module 1.3: Business Rules That Govern Operations

These are non-negotiable. Memorize them:

**BR-INV-02**: Minimum gap between check-out and check-in on same property = turnover window (configurable, default 4 hours). You do NOT allow a booking that violates this gap. If someone asks to check in at 11am and the previous guest checks out at 10am, the answer is no.

**BR-OPS-01**: No check-in without a confirmed, completed turnover. You do not allow a guest to check in if the property is not confirmed READY.

**BR-OPS-02**: Operations team has responsibility to coordinate cleaning and inspection for every checkout. You do not delegate this to the host and forget about it.

**BR-OPS-03**: Photos required at two points: (1) as-found condition before cleaning starts (documents what the outgoing guest left), (2) post-inspection condition after cleaning confirms property is READY. No photos = no confirmation of status.

---

## Day 2: Turnover Execution

### Module 2.1: The Turnover Pipeline

Read `knowledge/hospitality/turnover_operations.md` completely.

Property status progression:
```
CHECKOUT CONFIRMED → DIRTY → CLEANING_IN_PROGRESS → INSPECTING → READY
```

Your job is to move every property from DIRTY to READY within the turnover window.

**The pre-cleaning photo** (BR-OPS-03 requirement):
Before the cleaning team touches anything, the cleaner takes a photo of every room in its as-found state. These photos serve one purpose: if the next guest files a damage or cleanliness complaint, these photos prove the condition left by the outgoing guest.

**If the pre-cleaning photos aren't taken**: you lose the ability to differentiate between outgoing guest damage and incoming guest damage. This is a Trust & Safety problem, a dispute problem, and a financial problem.

---

### Module 2.2: Managing the Cleaning Team

**What the cleaning team does**: Clean the property according to the room-by-room checklist in the turnover operations guide.

**What you do**:
- Confirm cleaner assignment at least 2 hours before the checkout
- Contact cleaner at checkout to confirm they are en route
- Check in with cleaner at 75% of the turnover window (e.g., 3 hours into a 4-hour window)
- Receive completion notification from cleaner (with cleaning completion photos)
- Assign inspection task

**Cleaner no-show protocol** (from `knowledge/operations/incident_management.md`):
1. Contact assigned cleaner by phone immediately on confirmation of no-show
2. Contact backup cleaner from roster
3. If no backup within 45 minutes: escalate to Operations Manager
4. If no backup within 90 minutes of checkout: consider guest delay or alternative accommodation

---

### Module 2.3: The Inspection

The inspection is done by someone other than the cleaning team lead (separation of duties). The inspector checks:
- All items on the cleaning checklist are complete
- Linens are fresh (no odors, no stains)
- Appliances are functional (test AC, test hot water, test WiFi)
- No damage visible
- Welcome items in place (if the listing includes any)

**Inspection photo requirement**: After inspection confirms READY status, photos of key spaces (living room, bedroom, kitchen, bathroom) are uploaded. These serve as the before-stay condition record.

**Inspection failure**: If inspection finds a problem:
- If fixable within the turnover window: fix it and re-inspect
- If not fixable: escalate to Operations Manager. Property cannot be confirmed READY. Guest must be contacted.

---

## Day 3: Guest Coordination

### Module 3.1: Check-In Coordination

**2 hours before scheduled check-in**:
Send the guest check-in instructions (if not already sent automatically):
- Full address with building name, floor, apartment number
- GPS coordinates link
- Access code
- WiFi name and password
- Emergency contact number

**Welfare check at 30 minutes post-check-in**:
"أهلاً [Name]، وصلتم تمام وكل حاجة تمام؟" — This is not optional. This 30-minute check catches problems early (access code not working, guest arrived to the wrong address, something looks different from the photos). A problem caught at 30 minutes is a problem you can solve. A problem discovered at 11pm is an incident.

---

### Module 3.2: Late Check-Out Handling

Property has a checkout time of 11am. Guest has not left by 11am. Steps:
1. 11:05am: Message the guest: "تذكير بلطف: موعد تسجيل المغادرة كان الساعة 11 الصبح. الفريق جاي لتجهيز الوحدة. محتاجين نعرف توقيت تقريبي."
2. If no response in 20 minutes: Phone call to guest
3. If the late checkout will affect the turnover window for the next booking: Escalate to Operations Manager immediately

A guest who is 1 hour late but has no next booking is a minor inconvenience. A guest who is 1 hour late when the next booking checks in at 3pm is a critical issue.

---

## Day 4: Incident Response

### Module 4.1: Incident Management

Read `knowledge/operations/incident_management.md` completely.

Know the severity levels (P0–P3) and your role:
- P0: You notify the Founder immediately and do what you're told
- P1: You are the Incident Commander. The specific playbooks guide your response.
- P2: Handle autonomously, notify Operations Manager
- P3: Log, handle, move on

**The most common P1 operational incident**: Turnover failure with a guest arriving in <2 hours. Know the Playbook A2 from the incident management guide by heart.

---

### Module 4.2: Escalation Matrix

Read `knowledge/operations/escalation_matrix.md` — the authority reference card section.

Know your authority:
- You can authorize emergency cleaner dispatch at any cost within reason
- You can block a property (BLOCKED status) if safety is a concern
- You can authorize alternative accommodation for a guest up to EGP 800/night — but you must immediately notify the Operations Manager when you do this

---

## Day 5: Assessment

### Practical Assessment: Full Supervised Day

Complete one full operations day, from morning review to on-call handoff, independently. The Operations Manager observes but does not intervene unless you are about to cause harm.

**Pass criteria**:
- All turnovers completed and properties confirmed READY before guest arrival
- All check-ins coordinated with welfare check completed
- Morning and evening reviews completed correctly
- Any incidents handled at the correct severity level and with correct notification
- End-of-day report accurate and complete

---

## Key References

- `knowledge/operations/daily_operations_runbook.md`
- `knowledge/hospitality/turnover_operations.md`
- `knowledge/operations/incident_management.md`
- `knowledge/operations/escalation_matrix.md`
- `knowledge/support/communication_templates.md` — Templates for guest coordination
