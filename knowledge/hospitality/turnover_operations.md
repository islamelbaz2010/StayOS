# Turnover Operations — StayOS

**Domain**: Hospitality
**Audience**: Operations, Field Staff, Host Success, Cleaners
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Quarterly
**Tags**: turnover, cleaning, inspection, readiness, field-operations, BR-OPS-01, BR-INV-02

---

## Purpose

Turnover is the operational moment where guest stays end and the next booking begins. It is the highest-risk operational window in the accommodation lifecycle. A failed turnover means a guest arriving to an unclean or unready property — the single fastest way to generate a dispute, a bad review, and a churn event on both sides.

This article covers the complete StayOS turnover process: what it is, how it works, what field staff must do, how it connects to the platform's business rules, and how to handle failures.

---

## Background

In the Egyptian accommodation market, turnover failures are endemic. Hosts often manage cleaning themselves or through informal arrangements with building staff. Handoff communication is verbal and unreliable. There is no standard for what "clean" means. Guests frequently arrive to find the previous guest's dishes still in the sink.

StayOS operates a managed turnover model: the platform orchestrates the full turnover workflow from checkout trigger to readiness confirmation, with photographic evidence at every stage and a 4-hour operational window (BR-OPS-02).

**Business rules this process enforces**:
- **BR-OPS-01**: Checkout event automatically creates a high-priority turnover ticket
- **BR-OPS-02**: Turnover must complete within 4 hours of checkout
- **BR-INV-02**: Unit cannot return to `READY` status until turnover ticket is `CLOSED`
- **BR-OPS-03**: Photos required at each stage before status can advance

---

## Core Concept: The Turnover Pipeline

```
Guest Checks Out
       ↓
System Creates Turnover Ticket (automatically — BR-OPS-01)
       ↓
Turnover Ticket = Cleaning Subtask + Inspection Subtask
       ↓
Cleaning Staff Assigned → Cleaning Executed → Photos Uploaded → Cleaning CLOSED
       ↓
Inspector Assigned → Inspection Executed → Photos Uploaded → Inspection CLOSED
       ↓
Parent Turnover Ticket CLOSED → Unit Status → READY
       ↓
Next Guest Can Check In
```

No step can be skipped. No status can advance without photographic evidence (BR-OPS-03).

---

## Detailed Explanation

### Phase 1: Checkout and Ticket Creation

**When checkout is confirmed** (guest marks checkout in app, or host confirms checkout via WhatsApp, or automatic checkout at booked checkout time + 1 hour):

The platform automatically:
1. Creates a Turnover ticket in `UNASSIGNED` status with HIGH priority
2. Creates a Cleaning subtask under the Turnover ticket
3. Creates an Inspection subtask under the Turnover ticket
4. Sets the unit calendar status to `BLOCKED` (no new bookings can start until READY)
5. Notifies the assigned cleaning team via WhatsApp: property address, checkout time, next guest check-in time (or "no next booking" if none)

**The 4-hour window**: If next guest check-in is in 4 hours or less, the turnover team is notified immediately. If next guest check-in is in 6+ hours, normal priority applies. If no next booking, standard completion window is same-day by 6pm.

---

### Phase 2: Cleaning Execution

The cleaning team (StayOS partner cleaner, host-employed cleaner, or host themselves) executes the cleaning process.

**StayOS Standard Cleaning Process**

**Entry**
- Arrive with cleaning kit: cleaning supplies, fresh linens bag, spare toiletries kit
- Photograph the unit as-found BEFORE any cleaning begins (evidence of checkout state)
- Check for left-behind guest property (document and report to support immediately)
- Open all windows for ventilation before beginning

**Bedroom(s)**
- Strip all linens (pillowcases, duvet cover, flat sheet, mattress protector)
- Inspect mattress for stains or damage (photograph if found)
- Replace with fresh clean linens — white or neutral, wrinkle-free
- Vacuum mattress if no protector was used
- Dust all surfaces (nightstand, headboard, lamps)
- Wipe mirror
- Vacuum or mop floor

**Bathroom(s)**
- Scrub toilet inside and out (including behind the base)
- Scrub sink and taps until chrome is shining
- Scrub shower/bathtub including grout lines
- Replace all towels (hand towel, bath towel, floor mat) with fresh clean set
- Restock toiletries: soap, shampoo, toilet paper (minimum 2 rolls)
- Clean mirror streak-free
- Mop floor

**Kitchen**
- Check refrigerator: remove and dispose of all perishable items left by guest
- Wipe refrigerator interior with antibacterial solution
- Wash all dishes, pots, and utensils used by guest
- Clean stove top (remove burner grates and scrub)
- Wipe oven exterior
- Wipe all counters
- Clean sink
- Empty kitchen bin with fresh bag
- Mop floor

**Living Area**
- Fluff sofa cushions and straighten arrangement
- Dust all surfaces including TV, shelves, decorative objects
- Vacuum sofa if needed
- Wipe remote controls with antibacterial wipe
- Wipe coffee table and side tables
- Mop or vacuum floor

**Final Touches**
- Set AC to default "OFF" or agreed guest arrival setting
- Leave welcome materials in place (guide, emergency contacts)
- Verify WiFi password is visibly posted
- Stage towels neatly in bathroom
- Confirm kitchen paper stocked
- Smell test: unit should have neutral or fresh scent, not cleaning product smell

**Photo Documentation Required (BR-OPS-03)**:
- Bedroom(s) — fresh linens, made bed
- Bathroom(s) — fresh towels, clean surfaces
- Kitchen — clean counters, empty sink
- Living area — straightened
- Entrance

Upload all photos to the StayOS operations app before marking Cleaning subtask `COMPLETE`.

---

### Phase 3: Inspection

The inspection is conducted by a different person than the cleaner, or by the host/StayOS agent if the cleaner is the same party. Inspection cannot be self-certified.

**Inspection Checklist**

**Cleanliness**
- [ ] All surfaces are clean to the touch (no stickiness, residue, or visible dust)
- [ ] Bathrooms smell fresh and surfaces shine
- [ ] Kitchen surfaces are clean, sink empty, refrigerator clean
- [ ] No dishes in the drying rack or cupboards that are visibly unclean
- [ ] Floors are swept/vacuumed and mopped
- [ ] No detectable odors (cooking, cigarette smoke, pet smell)

**Linens and Amenities**
- [ ] All beds made with fresh linens
- [ ] Fresh towels set in each bathroom
- [ ] Toiletries stocked (soap, shampoo, toilet paper)
- [ ] Kitchen: dish soap, sponge, kitchen paper stocked
- [ ] Coffee/tea station if listed (fully stocked)

**Functionality**
- [ ] All lights working
- [ ] AC functioning in each room
- [ ] TV and remote working
- [ ] WiFi connection tested (actually connect a device)
- [ ] All doors and windows opening and locking properly
- [ ] Hot water (turn on shower for 30 seconds)

**Presentation**
- [ ] Property looks like the listing photos
- [ ] No guest items left behind
- [ ] Welcome guide in place
- [ ] Emergency contacts visible

**Inspection PASS**: All items ✅ → Upload final inspection photos → Mark Inspection subtask `COMPLETE` → Turnover ticket auto-closes → Unit status returns to `READY`

**Inspection FAIL**: One or more items ✗ → Identify specific issue → Send back to cleaning team for correction → Re-inspect before marking COMPLETE

---

### Phase 4: Failure Recovery

When turnover fails (cleaning insufficient, time runs out before next check-in, or issue discovered during inspection):

**Scenario A: Time available before check-in (>2 hours)**
- Issue escalated to operations team immediately
- Cleaning team returns immediately
- Re-inspection conducted
- Guest not notified unless failure cannot be resolved in time

**Scenario B: Tight time window (<2 hours before check-in)**
- Operations team escalated immediately
- Proactive WhatsApp sent to guest: "Your unit is being prepared, it will be ready by [time]"
- If unit cannot be ready on time, guest offered: early access to a communal area, or a delay credit
- If unit will be >1 hour late: guest offered a free upgrade or compensation per the `knowledge/support/escalation_playbook.md`

**Scenario C: Critical issue found during inspection (damage, mold, broken amenity)**
- Unit remains BLOCKED — next guest cannot check in
- Operations manager notified immediately
- If same-day booking: guest immediately relocated to alternative or offered refund
- If future booking: host contacted, issue documented, remediation required before next booking can proceed

---

## Real-World Scenarios

### Scenario 1: The North Coast Peak Season Crunch
August peak season at a North Coast property. Guest checks out at 12pm. Next guest checks in at 4pm. That is the 4-hour window. The property has 4 bedrooms.

**How it should run**: Cleaning team of 2 arrives at 12:15pm. Simultaneous cleaning by both team members (person A: all bedrooms; person B: all bathrooms and kitchen). Completed at 2:30pm. Inspector arrives at 2:45pm. Passes at 3:15pm. Unit marked READY at 3:15pm. 45 minutes before check-in. ✅

**How it goes wrong**: Single cleaner arrives at 1pm (transport delay). Works alone for 3 hours. Does not finish until 4pm. Guest arrives at 4pm to a half-cleaned property. Dispute raised. Refund issued.

**Prevention**: Peak season properties with <6 hours between checkout and check-in must always be assigned a 2-person team. Log all transport delays and build a "buffer time" into cleaner assignments (cleaner arrives 15 minutes after checkout, not at checkout time).

### Scenario 2: The Left-Behind Guest Property
The cleaner finds a designer handbag worth EGP 15,000 under the bed.

**Correct action**:
1. Photograph the item in its found location immediately
2. Do NOT move it yet
3. Contact StayOS operations team immediately
4. Operations contacts the departed guest via WhatsApp: "We found a personal item at the property. Can you describe it?"
5. Guest claims it → coordinate return pickup
6. Guest does not respond within 24 hours → item stored in StayOS secure storage for 30 days

Do NOT leave items with the incoming guest or dispose of them under any circumstances.

### Scenario 3: The Cigarette Smell
A non-smoking property. The cleaner opens the door and is immediately hit with cigarette smoke smell.

**Correct action**:
1. Photograph cigarette evidence (ash, burns, butts) if visible
2. Report to operations team immediately (possible damage claim)
3. Open all windows immediately
4. Deep clean with specific odor eliminator — standard cleaning is insufficient for cigarette smoke
5. If smell cannot be cleared in time for next guest: next guest is proactively contacted and offered alternative or credit
6. Guest who smoked is charged the cleaning surcharge as documented in the booking agreement

---

## Decision Tree: Turnover Status Assessment

```
Has the cleaning subtask been completed with photos uploaded?
  NO  → Cleaning team is not done. Unit stays BLOCKED. Escalate if overdue.
  YES → Continue.

Has the inspection been conducted by a different person than the cleaner?
  NO  → Inspection must not be self-certified. Assign inspector.
  YES → Continue.

Did inspection pass all checklist items?
  NO  → What failed?
        - Cleanliness: Return to cleaning. Re-inspect.
        - Functionality: Notify host. Fix issue. Re-inspect.
        - Safety issue: Unit blocked until fixed. Notify operations.
  YES → Mark inspection COMPLETE → Turnover CLOSED → Unit → READY.

Is next check-in within 1 hour?
  YES → Notify guest of exact readiness time. Have backup option ready.
  NO  → Standard process. Unit will be ready on time.
```

---

## Best Practices

1. **Always assign the cleaning team before checkout.** Do not wait for the checkout to confirm before assigning cleaners. Every booking with a same-day or next-day incoming guest should have a cleaning team pre-assigned.

2. **2-person teams for properties with 3+ bedrooms.** A single cleaner cleaning a 4-bedroom apartment in 4 hours produces rushed, inadequate results. Staff turnover accordingly.

3. **Build a trusted cleaner network, not a list of individual contractors.** Cleaners who work StayOS properties regularly know the standard. One-time contractors do not. Invest in a small core team of reliable cleaners who are trained on the StayOS standard.

4. **The first impression is the bed.** Guests entering a property look first at the bedroom. A beautifully made bed signals care and professionalism instantly. If time is short, prioritize the bedroom and bathroom above all else.

5. **Photograph before, during, and after.** The before photos protect StayOS in damage disputes. The after photos confirm readiness. This is not optional bureaucracy — it is the only evidence you will have when a guest claims damage that was pre-existing.

---

## Common Mistakes

**Mistake 1: Self-certification of inspection**
The cleaner inspects their own work. They will always find it acceptable — they did it. Inspection must always be a second pair of eyes.

**Mistake 2: Ignoring the odor test**
A unit can look clean and smell of old food, cigarettes, or mold. The smell test is the first thing a guest does when entering. Add it explicitly to inspection.

**Mistake 3: Not photographing the as-found state**
When a guest later claims damage to a wall or appliance, the only evidence of whether it pre-existed is the as-found photo from the cleaning entry. Without it, StayOS cannot adjudicate the claim.

**Mistake 4: Rushing the bathroom**
Guests judge accommodation quality primarily by bathroom cleanliness. A perfectly cleaned bedroom and a mediocre bathroom = bad review. The bathroom must be the most thoroughly cleaned area of any property.

**Mistake 5: Ignoring the WiFi test**
"WiFi available" is one of the top three amenities guests use to decide to book. If the WiFi is not working at check-in, the guest's first experience is a support call. Always connect a device during inspection.

---

## FAQs

**Q: Who pays for the cleaning?**
A: Hosts are responsible for cleaning costs. The cleaning fee is collected from guests at booking time and passed through to the host minus the platform's coordination fee if StayOS manages the cleaning.

**Q: What if the host wants to clean the property themselves?**
A: Accepted, provided: (a) the host completes the same checklist, (b) submits the same photographic evidence, (c) the inspection is conducted by StayOS or an independent inspector. Self-cleaning without inspection is not accepted for properties with back-to-back bookings.

**Q: What is the standard for a "deep clean" vs a "standard turnover"?**
A: Standard turnover (every checkout): as described in this document. Deep clean (monthly, or after long stay >14 nights): includes oven interior, refrigerator coils, inside kitchen cupboards, bathroom grout scrubbing, and window interiors.

**Q: What happens if a property is found in very bad condition after checkout?**
A: Photograph everything immediately. Contact operations. If the condition is severe enough to delay the next booking, the departing guest's security deposit (if any) is held and a damage claim is filed. Operations reviews the photos and determines the appropriate charge.

---

## Checklist

### Standard Turnover Checklist
- [ ] Pre-cleaning as-found photos uploaded
- [ ] Bedroom(s): stripped, fresh linens, dusted, floor cleaned
- [ ] Bathroom(s): scrubbed, fresh towels, toiletries stocked, floor cleaned
- [ ] Kitchen: dishes clean, refrigerator cleared, counters clean, floor cleaned
- [ ] Living area: straightened, dusted, floor cleaned
- [ ] All lights and AC tested
- [ ] WiFi connected and working
- [ ] All doors and locks working
- [ ] Welcome materials in place
- [ ] Smell test passed
- [ ] Post-cleaning photos uploaded
- [ ] Inspection conducted by second person
- [ ] Inspection checklist completed and passed
- [ ] Unit status confirmed READY in platform

---

## References

- `docs/02_product/BUSINESS_RULES.md` — BR-OPS-01, BR-OPS-02, BR-OPS-03, BR-INV-02
- `src/app/operations/` — Operations module implementation
- `src/app/operations/models.py` — OperationTask, TaskEvent models

## Related Documents

- `knowledge/hospitality/property_quality_standards.md`
- `knowledge/operations/incident_management.md`
- `knowledge/trust/dispute_resolution.md`
- `knowledge/training/operations_training.md`
