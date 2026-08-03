# 05 — CLOSED ALPHA PLAYBOOK

**Board:** Executive Project Director, COO, Marketplace Operations Director  
**Date:** 2026-08-03  
**Purpose:** Define the day-by-day operating model for the StayOS Closed Alpha

---

## 1. Closed Alpha Definition

**Duration:** 4 weeks  
**Start:** Day engineering completes Sprint 3 (Platform deployed, 5 listings created)  
**End:** MVP v1 Gate achieved (10 bookings, EGP payment, host payout, 0 fraud)  
**Participants:** 10–15 hosts, 10–20 guests, 1 founder, 1 engineering team (on-call)

---

## 2. Day 1 — Launch Day

### Engineering

| Time | Task |
|------|------|
| Morning | Deploy to production. Verify all endpoints live. Run smoke tests. |
| Afternoon | Monitor error logs. Fix any deployment issues. |
| Evening | Confirm platform is stable. Hand over to founder. |

### Founder

| Time | Task |
|------|------|
| Morning | Verify platform is accessible. Test login. Test search. |
| Afternoon | Create 5 listings manually (via CSV import or direct API). Upload photos for each. Set pricing and availability. Approve all 5 listings. |
| Late afternoon | Test full booking flow: create test guest account → search → select listing → book → pay (manual confirmation) → confirm reservation. |
| Evening | Document any issues. Send bug report to engineering via WhatsApp. |

### Success Criteria — Day 1

- [ ] Platform is live and accessible
- [ ] 5 listings visible on search page with photos
- [ ] One test booking completed end-to-end (including manual payment confirmation)
- [ ] No critical bugs

---

## 3. Week 1 — First Hosts

### Daily Routine (Founder)

| Time | Activity | Duration |
|------|----------|----------|
| 8:00 | Check platform is up. Review overnight error logs. | 15 min |
| 8:15 | Review and process pending KYC submissions (approve/reject). | 30 min |
| 8:45 | Review and process pending listing submissions (approve/reject). | 30 min |
| 9:15 | Respond to host messages on WhatsApp. | 30 min |
| 9:45 | Host outreach: call 5 potential hosts from contact list. | 90 min |
| 11:15 | Break. | 15 min |
| 11:30 | Onboard 1–2 new hosts: guide through signup, KYC, listing creation. | 90 min |
| 13:00 | Lunch. | 60 min |
| 14:00 | Create listings for hosts who can't use the web form (collect data via WhatsApp, enter manually). | 60 min |
| 15:00 | Upload photos for listings that need them. | 60 min |
| 16:00 | Respond to guest inquiries. | 30 min |
| 16:30 | Update operations playbook with lessons learned today. | 30 min |
| 17:00 | Send daily status update to engineering (bugs, feature requests). | 15 min |
| 17:15 | Check platform one more time. Done for the day. | 15 min |

### Weekly Goals — Week 1

| Goal | Target | Actual |
|------|--------|--------|
| New hosts contacted | 20 | |
| New hosts signed up | 5 | |
| New hosts KYC approved | 5 | |
| New listings created | 10 | |
| New listings live | 10 | |
| Total live listings | 15 | |
| Test bookings completed | 1 | |
| Critical bugs reported | 0 | |
| Host feedback collected | 3 hosts | |

### Engineering — Week 1

| Task | Priority |
|------|----------|
| Fix bugs reported by founder | Highest |
| Complete admin KYC queue if not finished | High |
| Complete admin listing verification if not finished | High |
| Complete CSV import if not finished | Medium |
| Monitor platform stability | Ongoing |

---

## 4. Week 2 — Supply Ramp

### Founder Focus Shift

| Activity | Week 1 | Week 2 |
|----------|--------|--------|
| Host outreach | Personal network | Agencies + individual owners |
| Onboarding | 1-on-1 hand-holding | Group onboarding sessions (2–3 hosts at a time via WhatsApp group call) |
| Listing creation | Manual for each host | CSV import for agency portfolios |
| Guest acquisition | Not started | Begin promoting to warm contacts |

### Weekly Goals — Week 2

| Goal | Target | Cumulative |
|------|--------|------------|
| New hosts contacted | 30 | 50 |
| New hosts signed up | 5 | 10 |
| New hosts KYC approved | 5 | 10 |
| New listings created | 15 | 25 |
| New listings live | 15 | 25 |
| Total live listings | 25 | 25 |
| Agency meetings completed | 2 | 2 |
| CSV imports completed | 1 | 1 |
| First real guest booking | 1 | 1 |
| Host feedback collected | 5 more hosts | 8 total |

### Engineering — Week 2

| Task | Priority |
|------|----------|
| Fix bugs reported by hosts | Highest |
| Complete payment integration (Paymob) | High |
| Build CSV import if not finished | High |
| Monitor platform stability | Ongoing |

---

## 5. Week 3 — First Bookings

### Founder Focus Shift

| Activity | Week 2 | Week 3 |
|----------|--------|--------|
| Host outreach | Agencies + owners | Follow-up + referrals from onboarded hosts |
| Guest acquisition | Warm contacts | Warm contacts + social media |
| Operations | Onboarding | Booking management + payment + payout |
| Listing creation | CSV import | Final batch + photo uploads |

### Weekly Goals — Week 3

| Goal | Target | Cumulative |
|------|--------|------------|
| New hosts signed up | 5 | 15 |
| New listings live | 15 | 40 |
| Bookings initiated | 5 | 5 |
| Bookings completed (stayed + checked out) | 3 | 3 |
| Payments collected | 3 | 3 |
| Payouts processed | 1 | 1 |
| Guest feedback collected | 2 guests | 2 |
| Host feedback collected | 5 more | 13 total |

### Critical Milestone — Week 3

**First completed booking cycle:**
```
Guest searches → Finds listing → Books → Pays → Check-in → Stay → Check-out → Host payout
```

This must happen at least once in Week 3. If it doesn't, the founder must:
1. Identify the bottleneck (search? booking? payment? guest acquisition?)
2. Fix it manually (personally match a guest to a listing)
3. Document the issue for engineering

### Engineering — Week 3

| Task | Priority |
|------|----------|
| Fix payment-related bugs | Highest |
| Fix booking-related bugs | High |
| Monitor booking flow end-to-end | Ongoing |
| Prepare analytics queries for founder | Medium |

---

## 6. Week 4 — Alpha Validation

### Founder Focus Shift

| Activity | Week 3 | Week 4 |
|----------|--------|--------|
| Host outreach | Active recruitment | Wrap up + referrals |
| Guest acquisition | Warm contacts + social | All channels + word of mouth |
| Operations | Booking management | Full cycle + feedback + payouts |
| Strategy | Execution | Evaluation + V1.1 planning |

### Weekly Goals — Week 4

| Goal | Target | Cumulative |
|------|--------|------------|
| New listings live | 10 | 50 |
| Bookings completed | 7 | 10 |
| Payments collected | 7 | 10 |
| Payouts processed | 4 more | 5 total |
| Guest feedback collected | 5 more | 7 total |
| Host feedback collected | All remaining | 15 total |
| Operations playbook | Complete | Complete |
| V1.1 plan | Draft | Draft |

### MVP v1 Gate Check — End of Week 4

| Criterion | Target | Status |
|-----------|--------|--------|
| 10 live bookings completed | 10 | |
| Payment collected in EGP | Yes | |
| Payout transferred to verified Egyptian host | Yes | |
| 0 P0 safety or fraud incidents | 0 | |

### Engineering — Week 4

| Task | Priority |
|------|----------|
| Stabilize platform | Highest |
| Fix remaining bugs | High |
| Prepare analytics summary for founder | Medium |
| Begin V1.1 technical planning | Low |

---

## 7. Communication Model

### Daily

| Channel | Who | What |
|---------|-----|------|
| WhatsApp (founder + engineering) | Founder → Eng | Bug reports, feature requests, status updates |
| WhatsApp (host group) | Founder → Hosts | Announcements, tips, community building |
| WhatsApp (1-on-1 with hosts) | Host → Founder | Questions, issues, feedback |
| WhatsApp (1-on-1 with guests) | Guest → Founder | Booking questions, support |
| Phone | Founder → Hosts/Guests | Urgent issues, onboarding assistance |

### Weekly

| Channel | Who | What | When |
|---------|-----|------|------|
| Founder status report | Founder → Board | Metrics, progress, risks, asks | Every Sunday |
| Host newsletter | Founder → Hosts | New listings, tips, performance | Every Sunday |
| Engineering sync | Founder ↔ Eng | Bug review, priority adjustment | Every Monday |

---

## 8. Decision Framework

### When Founder Encounters a Problem

| Problem Type | Decision Maker | Response Time |
|--------------|---------------|---------------|
| Bug (platform broken) | Engineering | < 4 hours |
| Host can't use a feature | Founder (workaround) | < 1 hour |
| Guest can't complete booking | Founder (manual booking) | < 30 min |
| Payment fails | Founder (manual confirmation) | < 1 hour |
| Fraud suspicion | Founder (suspend immediately) | Immediate |
| KYC unclear | Founder (request resubmission) | < 24 hours |
| Listing quality concern | Founder (reject with reason) | < 24 hours |
| Host wants to leave | Founder (personal call) | < 24 hours |

### Escalation to Engineering

Founder escalates to engineering ONLY for:
1. Platform is down
2. Data loss or corruption
3. Security breach
4. Feature is completely broken (no workaround)

Everything else is handled manually by the founder during alpha.

---

## 9. Feedback Collection

### Host Feedback (Weekly)

3 questions via WhatsApp:
1. "How was your experience with StayOS this week? (1–10)"
2. "What was the hardest part? (free text)"
3. "What would make you recommend StayOS to another host? (free text)"

### Guest Feedback (Post-Stay)

3 questions via WhatsApp after check-out:
1. "How was your stay? (1–10)"
2. "Was the booking process easy? (1–10)"
3. "Would you book again on StayOS? (yes/no/maybe)"

### Founder Self-Assessment (Daily)

At end of each day, founder answers:
1. "Did the platform work today? (yes/no)"
2. "How many hours did I spend on manual workarounds? (number)"
3. "What was the biggest bottleneck today? (free text)"
4. "What should engineering fix first? (free text)"

---

## 10. Closed Alpha Exit

### Successful Exit (All Criteria Met)

1. 50 live listings
2. 10 completed bookings
3. EGP payment collected
4. Host payout transferred
5. 0 fraud incidents
6. Host NPS >= 50
7. Guest NPS >= 50
8. Operations playbook documented

**Next step:** Transition to V1.1 planning. Begin building deferred P1 stories (S3-012, S3-013, S3-014, S3-015, S3-016, S3-019).

### Failed Exit (Criteria Not Met)

If < 10 bookings by Week 4:

1. Diagnose the failure:
   - Supply problem? (< 30 live listings) → Extend alpha 2 weeks, focus on host recruitment
   - Demand problem? (< 5 bookings initiated) → Extend alpha 2 weeks, focus on guest acquisition
   - Conversion problem? (bookings initiated but not completed) → Fix booking/payment flow
   - Trust problem? (hosts or guests abandoning) → Improve verification and communication

2. Extend alpha by 2 weeks with focused intervention.

3. Re-evaluate at Week 6.

If < 30 live listings by Week 4:

1. Supply acquisition strategy is failing.
2. Founder must spend 80% of time on host recruitment.
3. Consider paid host acquisition (offer $50 onboarding bonus per host).
4. Re-evaluate at Week 6.
