# 08 — FINAL STAGE GATE DECISION

**Board:** Executive Project Director, Product Director, CTO, COO, Marketplace Operations Director, PMO Director  
**Date:** 2026-08-03  
**Subject:** Final executive decision on Sprint 3 execution strategy

---

## 1. Decision

### OPTION C — REDUCE SPRINT 3 SCOPE

The board unanimously approves **Option C: Reduce Sprint 3 scope** and reinvest the saved time in marketplace execution (supply acquisition, demand generation, and founder operations).

---

## 2. Rationale

### The Current Plan Builds Software. The Company Needs a Marketplace.

The existing Sprint 3 planning documents are high-quality engineering artifacts. They define precise API contracts, database migrations, frontend pages, and execution sequences. But they answer the question "what code should we write?" not "how do we launch a marketplace?"

A marketplace is not a product. It is a two-sided market with liquidity. Software is necessary but not sufficient. The current plan has:

- **62 SP of engineering** but **0 SP of supply acquisition**
- **19 P0 stories** but **no founder operations plan**
- **6 execution phases** but **no demand generation plan**
- **A 5-week timeline** that produces software but not bookings

### The MVP Gate Is Commercial, Not Technical

The MVP v1 Gate from `MVP_SCOPE_FREEZE.md` is:
1. 10 live bookings completed
2. Payment collected in EGP
3. Payout transferred to verified Egyptian host
4. 0 P0 safety or fraud incidents

None of these are engineering deliverables. They are business outcomes. The engineering plan optimizes for code delivery. The board optimizes for business outcomes.

### 16 SP of Admin Tooling Is Not Needed for 50 Listings

S3-012 (unclaimed listing creation), S3-013 (claim review), S3-014 (duplicate detection), and S3-015 (support ticket queue) total 16 SP. These features serve a marketplace at scale (100+ listings, multiple operators, self-service host registration). For a 50-listing alpha with the founder as sole operator, they are unnecessary. The founder can:
- Create listings on behalf of hosts manually
- Handle ownership transfers with a database update
- Check for duplicates by browsing the listing list
- Handle support via WhatsApp

### Payment Checkout Is on the Critical Path but Is P1

S3-018 (payment checkout) is classified as P1. But the MVP gate requires "payment collected in EGP." You cannot complete a booking without payment. This is a contradiction in the current plan. Payment must be P0.

### The 2 Weeks Saved Are Worth More Than the Features Removed

By deferring 16 SP of admin tooling and simplifying 3 SP of other stories, the engineering timeline drops from 5 weeks to 3 weeks. The 2 weeks saved are reinvested in:
- Founder spending 50% of time on host recruitment (Weeks 1–4)
- Founder preparing supply data for CSV import
- Founder building a warm-contact demand list
- Founder testing the platform with real hosts before launch

This parallel execution is the difference between launching with 0 listings and launching with 10.

---

## 3. Approved Changes

### Stories Deferred from P0 to P1

| ID | Story | SP Saved | Justification |
|----|-------|----------|---------------|
| S3-012 | Unclaimed listing creation | 5 | Founder creates listings manually for 50 listings |
| S3-013 | Claim review and ownership transfer | 5 | No claims needed until hosts self-register at scale |
| S3-014 | Duplicate listing detection | 3 | Not a problem until 100+ listings |
| S3-015 | Support ticket queue | 3 | WhatsApp is sufficient for alpha support |

### Stories Simplified

| ID | Story | SP Saved | Change |
|----|-------|----------|--------|
| S3-003 | Listing creation form | 2 | Minimal form: no map picker, no drag-reorder, basic amenities checkboxes |
| S3-008 | Notifications | 1 | SMS via Twilio only. No WhatsApp dependency. |
| S3-011 | CSV import | 2 | Skip photo URL download. Ops uploads photos manually post-import. |

### Stories Elevated

| ID | Story | SP Added | Justification |
|----|-------|----------|---------------|
| S3-018 | Payment checkout | 5 | On critical path to MVP gate. Cannot complete booking without payment. |

### Net Impact

| Metric | Original | Revised | Change |
|--------|----------|---------|--------|
| Total P0 SP | 62 | 48 | -14 |
| Remaining P0 SP | ~39 | ~25 | -14 |
| Engineering timeline | 5 weeks | 3 weeks | -2 weeks |
| Admin tooling SP | 27 | 11 | -16 |
| Payment checkout | P1 | P0 | +5 SP |

---

## 4. Revised Critical Path

```
S3-033 (S3 config) → S3-031 (presigned URLs) → S3-004 (photo upload)
    → S3-003 (listing form, minimal) → S3-007 (submit for review)
    → S3-009 (KYC queue) → S3-010 (listing verification queue)
    → S3-011 (CSV import, simplified) → S3-018 (payment checkout)
    → LAUNCH CLOSED ALPHA
    → Recruit 50 hosts (4 weeks, parallel)
    → Drive 10 bookings (4 weeks, parallel)
    → MVP v1 GATE
```

---

## 5. Revised Success Criteria

Sprint 3 is successful when:

1. **Platform is deployed** and accessible
2. **Host can create a listing** with photos, pricing, and availability
3. **Founder can review KYC** and approve/reject
4. **Founder can review listings** and approve/reject
5. **Founder can import CSV** to bulk-create listings
6. **Guest can search, book, and pay** (Paymob or manual confirmation)
7. **5 listings are live** on Day 1 of Closed Alpha
8. **One test booking** is completed end-to-end before launch

The original criterion of "50 listings on staging" is moved to the Closed Alpha execution plan (Week 4 target).

---

## 6. Conditions of Approval

The board approves Option C with the following conditions:

### Condition 1: Founder Commits 50% Time to Supply Acquisition

The founder must spend at least 50% of working time during Weeks 1–4 on host recruitment and onboarding. This is non-negotiable. If the founder is spending more than 50% on operations or engineering coordination, the board intervenes.

### Condition 2: Payment Checkout Has a Manual Fallback

If Paymob is not ready by Day 15, the founder uses manual payment confirmation. The platform launches regardless. Payment integration is not a launch blocker if manual confirmation works.

### Condition 3: SMS Notifications Work Before Launch

WhatsApp Business API is not required. SMS via Twilio must work for all notification events (KYC, listing, booking). This is tested before launch.

### Condition 4: Operations Playbook Is Documented Daily

The founder maintains a daily operations log and updates the operations playbook every day. This document becomes the basis for hiring and training the first operations person.

### Condition 5: Board Receives Weekly Status Report

The founder sends a 1-page status report to the board every Sunday with: metrics, progress vs. target, top risks, and asks. The board reviews and responds within 48 hours.

### Condition 6: Deferred Stories Are Revisited at MVP Gate

S3-012, S3-013, S3-014, and S3-015 are deferred to V1.1, not cancelled. They are revisited when the MVP v1 Gate is achieved. The V1.1 plan must include these stories.

### Condition 7: Engineering Timeline Is 3 Weeks

Engineering must complete all revised P0 stories within 15 working days. If the timeline slips, the board reviews and may further reduce scope. No scope additions are permitted without board approval.

---

## 7. Risk Acceptance

The board accepts the following risks:

| Risk | Acceptance Rationale |
|------|---------------------|
| No claim workflow during alpha | Founder handles ownership manually. Risk is low at 50 listings. |
| No duplicate detection during alpha | Founder checks manually. Risk is low at 50 listings. |
| No support ticket system during alpha | WhatsApp is sufficient. Risk is low with 15 hosts and 20 guests. |
| SMS-only notifications | WhatsApp is a better channel but not ready. SMS is reliable in Egypt. |
| Manual payment confirmation | Paymob may not be ready. Manual confirmation is a proven fallback. |
| Manual payouts | No automated payout for alpha. Bank transfers are reliable in Egypt. |
| Founder as single point of failure | Sustainable for 4 weeks. Operations hire begins during Week 2. |

The board does NOT accept:
- Launching without listing photos (S3-004 is mandatory)
- Launching without KYC review (S3-009 is mandatory)
- Launching without listing verification (S3-010 is mandatory)
- Launching without payment (S3-018 or manual confirmation is mandatory)

---

## 8. Execution Authority

| Decision | Authority |
|----------|-----------|
| Engineering priorities and scope | Board (this document) |
| Daily engineering execution | CTO / Engineering Lead |
| Supply acquisition strategy | Founder |
| Host onboarding | Founder |
| Guest acquisition | Founder |
| KYC approval/rejection | Founder |
| Listing approval/rejection | Founder |
| Payment confirmation | Founder |
| Payout processing | Founder |
| Bug prioritization | Founder → CTO |
| Scope changes | Board only |
| Budget allocation | Board |

---

## 9. Timeline Summary

| Milestone | Date | Owner |
|-----------|------|-------|
| Board decision approved | 2026-08-03 | Board |
| Engineering sprint begins | 2026-08-04 | CTO |
| S3 buckets configured | 2026-08-06 | Engineering |
| Photo upload works | 2026-08-08 | Engineering |
| Listing form works | 2026-08-11 | Engineering |
| Admin queues work | 2026-08-13 | Engineering |
| CSV import works | 2026-08-15 | Engineering |
| Payment checkout works | 2026-08-18 | Engineering |
| Platform deployed | 2026-08-19 | Engineering |
| Closed Alpha begins | 2026-08-19 | Founder |
| 5 listings live | 2026-08-19 | Founder |
| 15 listings live | 2026-08-26 | Founder |
| 25 listings live | 2026-09-02 | Founder |
| First booking completed | 2026-09-02 | Founder |
| 40 listings live | 2026-09-09 | Founder |
| 50 listings live | 2026-09-16 | Founder |
| 10 bookings completed | 2026-09-16 | Founder |
| MVP v1 Gate achieved | 2026-09-16 | Board |
| V1.1 planning begins | 2026-09-17 | Board |

---

## 10. Board Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Executive Project Director | | APPROVED | 2026-08-03 |
| Product Director | | APPROVED | 2026-08-03 |
| CTO | | APPROVED | 2026-08-03 |
| COO | | APPROVED | 2026-08-03 |
| Marketplace Operations Director | | APPROVED | 2026-08-03 |
| PMO Director | | APPROVED | 2026-08-03 |

---

## 11. Executive Statement

> The board has reviewed the Sprint 3 planning documents and finds them technically sound but commercially incomplete. The plan optimizes for software delivery, not marketplace launch. By reducing engineering scope by 14 SP, elevating payment checkout to P0, deferring admin tooling to V1.1, and reinvesting 2 weeks of saved time into supply acquisition and founder operations, the company significantly increases its probability of achieving the MVP v1 Gate (10 bookings, EGP payment, host payout, 0 fraud) within 6 weeks of engineering completion.
>
> The founder is the critical path. The platform is the enabler. The marketplace is the goal.
>
> **Decision: OPTION C — REDUCE SPRINT 3 SCOPE. Approved unanimously.**
