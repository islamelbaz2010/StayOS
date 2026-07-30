# Escalation Matrix — StayOS

**Domain**: Operations
**Audience**: Operations Team, Support, All Staff
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Monthly
**Tags**: escalation, matrix, on-call, owners, SLA, contact, authority

---

## Purpose

This article is the single reference for who escalates to whom, for what, and with what authority. During a crisis, nobody should be searching for this information. Print it, post it on the wall, memorize it.

---

## Escalation Matrix by Issue Type

| Issue | First Responder | Escalate To | Escalate When | Authority Level |
|-------|----------------|-------------|---------------|-----------------|
| Guest can't find address | Support Agent | – | Never (resolve at L1) | Agent: resend instructions |
| Guest access code not working | Support Agent | Operations Manager | >15 min unresolved | Agent: correct code; Ops: contact building manager |
| Guest locked out, host unreachable | Support Agent + Operations Manager | Founder | >30 min, safety risk | Ops: emergency hotel; Founder: major incident authority |
| AC/water/electricity failure | Support Agent | Operations Manager | >30 min unresolved | Ops: dispatch technician; authorize repairs up to EGP 1,000 |
| Property not as described (major) | Support Agent | Trust & Safety | Immediately on report | T&S: full refund + host suspension review |
| Guest physical safety threat | Operations Manager + Founder | Emergency services first | Immediately | Full authority: relocate guest, suspend host |
| Cleaner no-show | Operations Agent | Operations Manager | Immediately on confirmation | Ops: dispatch backup cleaner |
| Turnover late (<1h to check-in) | Operations Manager | Founder | >3 properties in crisis | Ops: delay/relocate; Founder: systemic crisis authority |
| Host unreachable at check-in | Support Agent | Operations Manager | >15 min unresolved | Ops: emergency contact list, building manager |
| Guest damage claim | Support Agent | Trust & Safety | All damage claims | T&S: investigate with evidence, charge security deposit |
| Guest refund request <EGP 300 | Support Agent | – | Never (resolve at L1) | Agent: issue goodwill credit |
| Guest refund request >EGP 300 | Support Agent | Support Lead | Immediately | Lead: approve full refund up to booking value |
| Chargeback received | Finance Team | Trust & Safety Lead | All chargebacks | T&S: prepare evidence, lead: approve response |
| Fraud suspected | Trust & Safety | Founder | Major fraud, financial exposure >EGP 5,000 | T&S: suspend accounts; Founder: law enforcement contact |
| Platform API down | Engineering On-Call | Founder | All P0 platform incidents | Founder: public communications, business decisions |
| Payment processing failure | Engineering On-Call | Founder | >15 min or >5 users affected | Halt new bookings, coordinate with Paymob/Stripe |
| Regulatory authority contact | Any staff → Founder | Legal counsel | Immediately | Founder: all regulatory communications |
| Press inquiry | Any staff → Founder | Legal counsel if required | Immediately | Founder: all press communications |
| Host threatening to leave | Host Success | Founder | Major partner (>3 properties) | Founder: negotiate directly |
| System data breach | Engineering | Founder + Legal | Immediately | Founder: user notification decision |

---

## On-Call Schedule

### Stage 1 On-Call Roster

**Primary On-Call (Operations)**:
- Role: Operations Manager or designated team member
- Hours: 24/7 during active booking periods
- Contact method: WhatsApp first, then phone call if no response in 5 minutes
- Authority: Dispatch emergency resources, authorize repairs up to EGP 1,000, approve alternative accommodation

**Secondary On-Call (Founder)**:
- Activated for: P0 incidents, safety incidents, regulatory contact, press inquiry, major partner escalation
- Contact method: Direct phone call only (not WhatsApp for P0/safety)
- Authority: Full platform authority — any decision

**Trust & Safety On-Call**:
- Activated for: CRITICAL disputes, fraud investigations during active bookings
- Contact method: WhatsApp
- Authority: Suspend accounts, freeze payouts, authorize full refunds

---

## Authority Reference Card

Who can authorize what — quick reference:

```
Support Agent:
  - Goodwill credit: ≤EGP 300
  - Date change: if availability permits
  - Check-in grace: ≤2 hours
  
Support Lead:
  - Cash refund: up to full booking value
  - Policy override: documented, one-off
  - Account warning: formal written warning

Operations Manager:
  - Emergency cleaner dispatch: any cost
  - Property block (BLOCKED status)
  - Emergency hotel (up to EGP 800/night)
  - Repair authorization: up to EGP 1,000
  - Cleaner roster change

Trust & Safety Lead:
  - Account suspension: host or guest
  - Account ban: temporary or permanent
  - Payout freeze
  - Chargeback response authorization
  - Full refund for safety/fraud incidents

Founder:
  - Any decision above all levels
  - Law enforcement engagement
  - Regulatory body communication
  - Press/media communication
  - Major partner negotiations
  - Platform-level decisions (pricing changes, policy changes)
```

---

## Escalation Speed Requirements

| Situation | Max Time Before Escalation |
|-----------|---------------------------|
| Guest reporting physical danger | 0 minutes — escalate simultaneously with responding |
| Guest locked out, no access | 15 minutes of unsuccessful resolution |
| CRITICAL support ticket (any type) | 0 minutes — escalate when classified CRITICAL |
| HIGH support ticket unresolved at T+2h | Immediately at 2h mark |
| MEDIUM support ticket unresolved at T+12h | Immediately at 12h mark |
| Chargeback received | 0 minutes — Finance + T&S simultaneously |
| Platform P0 incident | 0 minutes — Founder simultaneously with first response |
| Regulatory contact | 0 minutes — Founder before any response is given |

---

## Escalation Communication Format

When escalating, use this structure (30 seconds to read):

```
[SEVERITY LEVEL] — [ISSUE TYPE] — [BOOKING/CASE REF]

WHO: [Guest/Host name, role]
WHAT: [One sentence description of the issue]
WHEN: [When it was reported, how long it's been active]
STATUS: [What has been done so far]
NEEDS: [What I need from you — decision, resource, authority]
DEADLINE: [When does this need resolution to prevent harm]
```

Example:
```
[HIGH] — Turnover Failure — BOOKING #4829

WHO: Incoming guest Ahmed K., check-in at 3pm
WHAT: Assigned cleaner (Fatima team) confirmed no-show at 12:30pm
WHEN: Reported 12:30pm, 2.5 hours from check-in
STATUS: Primary cleaner unreachable, called backup list — no availability
NEEDS: Authorization to book emergency commercial cleaning service (est. EGP 350)
DEADLINE: Resolution by 2pm to allow preparation window
```

---

## Related Documents

- `knowledge/operations/incident_management.md`
- `knowledge/support/escalation_playbook.md`
- `knowledge/operations/daily_operations_runbook.md`
