# 01 — EXECUTIVE REVIEW OF SPRINT 3

**Board:** Executive Project Director, Product Director, CTO, COO, Marketplace Operations Director, PMO Director  
**Date:** 2026-08-03  
**Subject:** Business execution review of Sprint 3 planning documents  
**Decision required:** Is the current Sprint 3 plan the fastest and safest path to launching StayOS Closed Alpha?

---

## 1. Marketplace Readiness

### Verdict: NOT READY — The plan builds software but does not launch a marketplace.

The current Sprint 3 plan is an engineering build plan, not a marketplace launch plan. It defines what code to write, not how to acquire the first host, the first listing, the first guest, or the first booking. A marketplace is not a product — it is a two-sided market with liquidity. Software alone creates zero liquidity.

### Supply Blockers

| Blocker | Severity | Status |
|---------|----------|--------|
| No listing photos can be uploaded | CRITICAL | S3-004 not implemented — hard blocker |
| No host-facing listing creation form | CRITICAL | S3-003 backend only — no frontend |
| No admin verification queue | HIGH | S3-010 not implemented — listings cannot go live |
| No CSV import for bulk seeding | HIGH | S3-011 not implemented — cannot seed 50 listings quickly |
| No supply acquisition strategy | CRITICAL | Not in Sprint 3 scope at all |

### Demand Blockers

| Blocker | Severity | Status |
|---------|----------|--------|
| Payment checkout is P1, not P0 | CRITICAL | S3-018 is P1 — but you cannot complete a booking without payment |
| No guest acquisition strategy | CRITICAL | Not in Sprint 3 scope at all |
| No demand generation plan | HIGH | Not addressed |

### Trust Blockers

| Blocker | Severity | Status |
|---------|----------|--------|
| No admin KYC review queue | HIGH | S3-009 partial — cannot verify hosts manually |
| No listing verification workflow | HIGH | S3-010 not implemented — no quality gate |
| No notification to hosts on status changes | MEDIUM | S3-008 partial — triggers not wired |

### Operational Blockers

| Blocker | Severity | Status |
|---------|----------|--------|
| No operations playbook | HIGH | Not in Sprint 3 scope |
| No founder daily operations plan | HIGH | Not in Sprint 3 scope |
| No launch checklist | HIGH | Not in Sprint 3 scope |
| Ops team not hired | HIGH | External dependency D5 — not started |

---

## 2. Supply Acquisition

### Verdict: ABSENT — The plan assumes supply will appear. It will not.

The Sprint 3 goal states "prepare a Closed Alpha with 50–100 listings." But the plan contains zero supply acquisition strategy. There is no plan for:

- How the first 50 hosts will be recruited
- Who will recruit them
- What the onboarding pitch is
- Whether agencies or individual owners will be approached first
- What the cold-start sequence is
- How the CSV import will be populated (who collects the data?)
- What geographic zone to target first
- What property types to prioritize

The CSV import (S3-011) is a tool, not a strategy. Someone must still:
1. Identify 50 properties
2. Contact 50 owners
3. Collect property data and photos
4. Format it into CSV
5. Upload it

This is a 2–3 week operational effort that is not planned, staffed, or budgeted.

### Missing Work

| Missing Item | Impact | Recommendation |
|-------------|--------|----------------|
| Supply acquisition playbook | Cannot reach 50 listings | ADD — mandatory |
| Property sourcing list | Cannot start recruitment | ADD — mandatory |
| Agency onboarding script | B2B supply is fastest path | ADD — mandatory |
| Owner onboarding script | Individual owners need hand-holding | ADD — mandatory |
| Cold-start sequence (first 10 listings) | Proves the model before scaling | ADD — mandatory |
| Geographic zone definition | Focuses effort | ADD — mandatory |

---

## 3. Operations Readiness

### Verdict: OVER-ENGINEERED — The plan builds a full operations dashboard for a 50-listing alpha.

The current plan allocates 27 SP to Epic 2 (Admin Operations Dashboard). This is the same effort as the entire supply enablement epic. For a 50-listing alpha with the founder running operations manually, this is excessive.

### Mandatory Operations (Required for Closed Alpha)

| Function | Why | Current Plan |
|----------|-----|-------------|
| KYC review (approve/reject) | Must verify hosts | S3-009 — KEEP |
| Listing verification (approve/reject) | Must approve listings | S3-010 — KEEP |
| CSV import | Must seed 50 listings | S3-011 — KEEP but SIMPLIFY |

### Nice to Have (Defer to Post-Alpha or V1.1)

| Function | Why Defer | Current Plan |
|----------|-----------|-------------|
| Unclaimed listing creation | Founder can create listings on behalf of hosts manually for 50 listings | S3-012 — DEFER |
| Claim review and ownership transfer | No claims needed until hosts self-register at scale | S3-013 — DEFER |
| Duplicate detection | Not a problem until 100+ listings | S3-014 — DEFER |
| Support ticket queue | Founder handles support via WhatsApp/phone for alpha | S3-015 — SIMPLIFY to WhatsApp |

### Recommendation

Reduce Epic 2 from 27 SP to 11 SP (S3-009 + S3-010 + S3-011 only). Save 16 SP. Reallocate 5 SP to payment checkout (S3-018). Net time saved: 11 SP (~2 weeks).

---

## 4. Founder Execution

### Verdict: UNDEFINED — The plan does not define what the founder does during Closed Alpha.

The MVP scope freeze states "0 P0 safety or fraud incidents" as a gate criterion. The external dependencies document states "Founder covers ops until hire." But nowhere in the Sprint 3 plan is the founder's actual daily work defined.

### What the Founder Must Do During Closed Alpha

**Daily:**
- Review and approve/reject pending KYC submissions (5–10 per day during onboarding)
- Review and approve/reject pending listings (5–10 per day during onboarding)
- Respond to host questions via WhatsApp/phone
- Respond to guest questions via WhatsApp/phone
- Monitor for fraud signals (fake listings, suspicious accounts)
- Check that the platform is up and responsive

**Weekly:**
- Recruit 5–10 new hosts (calls, visits, referrals)
- Review supply pipeline (how many listings in each status)
- Collect feedback from onboarded hosts
- Review booking funnel (searches → listings viewed → bookings initiated → bookings completed)
- Test the full user journey end-to-end (signup → search → book → pay)
- Update the operations playbook with lessons learned

**Approval Workflows:**
- KYC approval: Founder reviews document images, approves or rejects with reason
- Listing approval: Founder reviews listing content and photos, approves or rejects
- Payout approval: Founder approves manual bank transfer to host
- Refund approval: Founder approves any refund requests

**Manual Tasks:**
- Create listings on behalf of hosts who cannot use the web form (during alpha, some hosts will need hand-holding)
- Collect property data and photos via WhatsApp for CSV import
- Manually confirm payments if Paymob is not ready
- Manually trigger payouts via bank transfer
- Handle all customer support via WhatsApp

**Escalation Flow:**
- Guest complaint → Founder → Resolve within 24 hours
- Host payout issue → Founder → Resolve within 48 hours
- Fraud suspicion → Founder → Suspend listing/account immediately → Document
- Technical incident → Founder → Notify engineering → Post status update

---

## 5. Engineering Priorities

### Per-Story Executive Decision

| ID | Story | Decision | Justification |
|----|-------|----------|---------------|
| S3-001 | Host OTP signup | KEEP | Done. No action needed. |
| S3-002 | KYC upload | KEEP | Done. No action needed. |
| S3-003 | Listing creation form | KEEP but SIMPLIFY | Critical for supply. Build minimal form — no map picker, no drag-reorder, no advanced amenities selector. Title, description, location, price, photos. That's it. |
| S3-004 | Listing photo upload | KEEP — HIGHEST PRIORITY | Hard blocker. Nothing works without photos. Build this first. |
| S3-005 | Base pricing | KEEP | Done. No action needed. |
| S3-006 | Calendar availability | KEEP | Done. No action needed. |
| S3-007 | Submit for review | KEEP | Simple endpoint. Needed for verification workflow. |
| S3-008 | WhatsApp notifications | SIMPLIFY | Use SMS via Twilio only. WhatsApp API is unresolved. Do not block on WhatsApp. Wire SMS triggers only. |
| S3-009 | Admin KYC queue | KEEP | Must verify hosts. Build minimal queue — list, approve, reject. No fancy filters. |
| S3-010 | Listing verification queue | KEEP | Must approve listings. Build minimal queue — list, approve, reject. |
| S3-011 | CSV import | KEEP but SIMPLIFY | Must seed 50 listings. Build basic CSV upload. Skip photo URL download — ops can upload photos manually after import. |
| S3-012 | Unclaimed listing creation | DEFER TO P1 | Founder can create listings on behalf of hosts for 50 listings. Claim workflow is over-engineered for alpha. |
| S3-013 | Claim review/transfer | DEFER TO P1 | Depends on S3-012. Not needed until hosts self-register at scale. |
| S3-014 | Duplicate detection | DEFER TO P1 | Not a problem until 100+ listings. Founder can manually check for duplicates. |
| S3-015 | Support ticket queue | SIMPLIFY | Replace with WhatsApp. Founder handles all support via WhatsApp during alpha. No ticketing system needed. |
| S3-018 | Payment checkout | ELEVATE TO P0 | Cannot complete a booking without payment. This is on the critical path. Must be P0. |
| S3-030 | unit_photos migration | KEEP | Done. No action needed. |
| S3-031 | Presigned S3 URLs | KEEP | Required for S3-004. |
| S3-032 | State machine | KEEP | Done. No action needed. |
| S3-033 | S3 bucket config | KEEP | Required for S3-004. |

### Summary of Changes

| Action | Stories | SP Impact |
|--------|---------|-----------|
| DEFER to P1 | S3-012, S3-013, S3-014 | -13 SP |
| SIMPLIFY | S3-008 (SMS only), S3-011 (no photo download), S3-015 (WhatsApp) | -3 SP effective |
| ELEVATE to P0 | S3-018 (payment checkout) | +5 SP |
| **Net change** | | **-11 SP** |

### Revised Effort

| Category | Original SP | Revised SP | Change |
|----------|-------------|------------|--------|
| Epic 1 (Supply) | 27 | 22 | -5 (simplifications) |
| Epic 2 (Admin Ops) | 27 | 11 | -16 (deferrals) |
| Epic 3 (Booking) | 23 (P1) | 5 (S3-018 elevated) | +5 |
| Epic 6 (Infra) | 8 | 6 | -2 (simplifications) |
| **Total P0** | **62** | **44** | **-18** |

Remaining work (after subtracting completed): **~25 SP** (down from ~39 SP).

---

## 6. Critical Path

### The TRUE Commercial Critical Path

```
Host identified (ops/founder)
    ↓
Host signs up (phone OTP)                    [S3-001 — DONE]
    ↓
Host uploads KYC                             [S3-002 — DONE]
    ↓
Founder reviews and approves KYC             [S3-009 — BUILD]
    ↓
Host creates listing                         [S3-003 — BUILD FRONTEND]
    ↓
Host uploads photos                          [S3-004 — BUILD, HIGHEST PRIORITY]
    ↓
Host sets price and availability             [S3-005, S3-006 — DONE]
    ↓
Host submits for review                      [S3-007 — BUILD ENDPOINT]
    ↓
Founder reviews and approves listing         [S3-010 — BUILD]
    ↓
Listing is live and searchable               [Search — DONE]
    ↓
Guest searches and finds listing             [Search — DONE]
    ↓
Guest books                                  [Booking — DONE]
    ↓
Guest pays                                   [S3-018 — ELEVATE TO P0]
    ↓
Payment confirmed, reservation created       [Reservations — DONE]
    ↓
Guest stays                                  [Operations — MANUAL]
    ↓
Founder collects feedback                    [MANUAL]
    ↓
Payout to host                               [Finance — MANUAL for alpha]
```

### What Is NOT on the Critical Path

| Story | Why It's Not on the Path | Decision |
|-------|--------------------------|----------|
| S3-012 (Unclaimed listing) | Founder can create listings on behalf of hosts | DEFER |
| S3-013 (Claim review) | No claims needed for alpha | DEFER |
| S3-014 (Duplicate detection) | 50 listings won't have duplicates | DEFER |
| S3-015 (Support ticket queue) | WhatsApp is sufficient | SIMPLIFY |
| S3-008 (WhatsApp notifications) | SMS is sufficient | SIMPLIFY |

### Critical Path Engineering Sequence

```
S3-033 (S3 config) → S3-031 (presigned URLs) → S3-004 (photo upload)
    → S3-003 (listing form frontend) → S3-007 (submit for review)
    → S3-009 (KYC queue) → S3-010 (listing verification queue)
    → S3-011 (CSV import) → S3-018 (payment checkout)
    → CLOSED ALPHA LAUNCH
```

**Estimated timeline: 3 weeks (15 working days)** down from 5 weeks.

---

## 7. Launch Checklist

### Minimum Viable Launch Checklist

**Supply (must have 10+ live listings):**
- [ ] S3 buckets configured and CORS working
- [ ] Listing photo upload works end-to-end
- [ ] Host listing creation form works (Arabic RTL)
- [ ] Host can set price and block dates
- [ ] Host can submit listing for review
- [ ] Admin can approve/reject listings
- [ ] 10 listings live with photos and pricing

**Trust (must verify hosts):**
- [ ] KYC upload works
- [ ] Admin can review and approve/reject KYC
- [ ] Only verified hosts can have live listings

**Discovery (guests must find listings):**
- [ ] Search page returns results
- [ ] Listing detail page shows photos, price, and host info
- [ ] Search filters work (location, price, property type)

**Booking (must complete a transaction):**
- [ ] Guest can select dates and guest count
- [ ] Guest can complete payment (Paymob or manual confirmation)
- [ ] Reservation is created and confirmed
- [ ] Host is notified of booking

**Operations (founder must be able to run it):**
- [ ] Founder can review KYC submissions
- [ ] Founder can review and approve listings
- [ ] Founder can confirm payments manually if needed
- [ ] Founder can trigger payouts manually via bank transfer
- [ ] Founder has a WhatsApp group for host communication
- [ ] Platform is deployed and accessible

**NOT required for launch:**
- [ ] ~~Unclaimed listing creation~~ — Founder creates listings manually
- [ ] ~~Claim review workflow~~ — Not needed for alpha
- [ ] ~~Duplicate detection~~ — Not needed for 50 listings
- [ ] ~~Support ticket system~~ — WhatsApp is sufficient
- [ ] ~~WhatsApp Business API~~ — SMS is sufficient
- [ ] ~~Admin dashboard UI~~ — API endpoints + simple admin page is sufficient
- [ ] ~~Map-based search~~ — List view is sufficient for alpha
- [ ] ~~Reviews~~ — Manual feedback collection

---

## 8. Pilot Operations — Closed Alpha Operating Model

### Day 1 — Launch Day

**Engineering:**
- Deploy to production
- Verify all endpoints are live
- Monitor error logs

**Founder:**
- Manually create 5 listings using the CSV import or direct API
- Upload photos for each listing
- Set pricing and availability
- Approve all 5 listings (set to LISTED)
- Test search and listing detail pages
- Test booking flow end-to-end with a test guest account
- Test payment flow (even if manual confirmation)
- Document any issues found

**Success criteria:** 5 live listings visible on the platform. One test booking completed end-to-end.

### Week 1 — First Hosts

**Engineering:**
- Fix bugs reported by founder
- Monitor platform stability
- Build any missing admin endpoints (KYC queue, listing queue)

**Founder:**
- Contact 20 potential hosts from the supply acquisition list
- Onboard 5 hosts: help them sign up, upload KYC, create listings
- Review and approve 5 KYC submissions
- Review and approve 5 listings
- Collect feedback on the onboarding experience
- Update operations playbook daily

**Success criteria:** 10 live listings. 5 verified hosts. 0 critical bugs.

### Week 2 — Supply Ramp

**Engineering:**
- Fix bugs reported by hosts
- Begin payment integration if not yet complete
- Build CSV import if not yet complete

**Founder:**
- Contact 30 more potential hosts
- Onboard 10 more hosts
- Seed 10 more listings via CSV import (from data collected via WhatsApp)
- Review and approve 10 KYC submissions
- Review and approve 10 listings
- Begin promoting the platform to potential guests (personal network, social media)
- Collect first guest feedback

**Success criteria:** 25 live listings. 10 verified hosts. First real guest booking initiated.

### Week 3 — First Bookings

**Engineering:**
- Complete payment integration
- Fix any payment-related bugs
- Monitor booking flow

**Founder:**
- Onboard 10 more hosts
- Reach 40+ live listings
- Drive 5–10 guest bookings through personal network
- Confirm payments (manually if needed)
- Process first payout to host (manual bank transfer)
- Collect feedback from first guests and hosts
- Document the full booking lifecycle

**Success criteria:** 40+ live listings. 3+ completed bookings. 1+ payout to host. First booking → stay → feedback cycle complete.

### Week 4 — Alpha Validation

**Engineering:**
- Stabilize platform
- Fix remaining bugs
- Prepare analytics dashboard for founder (manual SQL queries if needed)

**Founder:**
- Reach 50 live listings
- Drive 10 total bookings
- Complete 10-booking milestone
- Collect and document all feedback
- Make go/no-go decision on V1.1
- Hire operations person if budget allows

**Success criteria:** 50 live listings. 10 completed bookings. Payment collected in EGP. Payout transferred to verified Egyptian host. 0 P0 safety or fraud incidents. **MVP v1 Gate achieved.**

---

## 9. Risk Review

### Risk Ranking

| # | Risk | Category | Likelihood | Impact | Mitigation |
|---|------|----------|-----------|--------|------------|
| R1 | No supply acquisition — 0 hosts onboarded | Marketplace | HIGH | CRITICAL | Founder must spend 50% of time on host recruitment during Weeks 1–4 |
| R2 | Payment integration not ready | Technical | HIGH | HIGH | Manual payment confirmation as fallback. Do not block launch. |
| R3 | S3 buckets not configured | Technical | MEDIUM | CRITICAL | Engineering must resolve in first 3 days. Hard blocker. |
| R4 | Founder overwhelmed by manual operations | Operational | HIGH | HIGH | Defer all non-critical admin tooling. Keep operations simple. |
| R5 | Hosts cannot use the web form | Market | MEDIUM | HIGH | Founder creates listings on behalf of hosts. Collect data via WhatsApp. |
| R6 | No demand — 0 guest bookings | Marketplace | MEDIUM | CRITICAL | Founder drives demand through personal network. Target 10 bookings from warm contacts. |
| R7 | Legal/compliance issue with KYC storage | Legal | LOW | HIGH | S3 buckets encrypted. Access logged. KYC data not exposed. |
| R8 | Platform downtime during alpha | Technical | LOW | HIGH | Monitor daily. Founder checks platform every morning. |
| R9 | Fraud — fake listings or fake bookings | Marketplace | MEDIUM | HIGH | Founder manually verifies every listing. Manual KYC review. No automated payouts. |
| R10 | Host churn — hosts leave after onboarding | Market | MEDIUM | MEDIUM | Personal relationship with founder. WhatsApp support. Fast payout. |

### Top 3 Risks

**R1 — No supply acquisition is the #1 risk.** The entire Sprint 3 plan focuses on building software, not acquiring supply. If the founder does not actively recruit 50 hosts, the platform launches with 0 listings. A marketplace with 0 listings is dead.

**R4 — Founder overwhelmed is the #2 risk.** By deferring S3-012, S3-013, S3-014, and S3-015, we reduce the founder's tooling burden. But the founder must still handle KYC review, listing verification, support, host recruitment, guest acquisition, payment confirmation, and payouts. This is sustainable for 4 weeks, not more.

**R6 — No demand is the #3 risk.** The Sprint 3 plan does not address demand generation at all. For 10 bookings, the founder's personal network is sufficient. But this must be explicitly planned, not assumed.

---

## 10. Final Recommendation

### OPTION C — REDUCE SPRINT 3 SCOPE

The current Sprint 3 plan is sound in its technical architecture but over-scoped for a 50-listing Closed Alpha. It allocates equal effort to admin tooling as to supply enablement, includes features (claim workflow, duplicate detection, support tickets) that are not needed until 100+ listings, and omits the most critical function for completing a booking (payment checkout).

### Evidence

1. **16 SP of admin tooling is not needed for alpha.** S3-012 (5 SP), S3-013 (5 SP), S3-014 (3 SP), S3-015 (3 SP) build infrastructure for scale, not for alpha. The founder can handle claims, duplicates, and support manually for 50 listings.

2. **Payment checkout is on the critical path but is P1.** S3-018 (5 SP) must be elevated to P0. You cannot complete the MVP gate ("10 live bookings, payment collected in EGP") without it.

3. **No supply acquisition plan exists.** The plan builds the supply pipe but does not plan how to fill it. This is the #1 marketplace risk.

4. **No demand plan exists.** The plan builds search and listing pages but does not plan how to get the first 10 guests. This is the #3 marketplace risk.

5. **No operations playbook exists.** The plan builds admin dashboards but does not define how the founder will operate the marketplace daily.

### Changes Approved

| Change | Impact |
|--------|--------|
| DEFER S3-012, S3-013, S3-014 to P1 | -13 SP |
| SIMPLIFY S3-008 to SMS-only | -1 SP |
| SIMPLIFY S3-011 (no photo download) | -2 SP |
| SIMPLIFY S3-015 to WhatsApp support | -3 SP |
| ELEVATE S3-018 to P0 | +5 SP |
| ADD supply acquisition plan | 0 SP (operational, not engineering) |
| ADD founder daily operations plan | 0 SP (operational, not engineering) |
| ADD Closed Alpha playbook | 0 SP (operational, not engineering) |
| **Net engineering change** | **-14 SP** |

### Revised Timeline

| Metric | Original | Revised |
|--------|----------|---------|
| Total P0 SP | 62 | 48 |
| Remaining P0 SP | ~39 | ~25 |
| Engineering timeline | 5 weeks | 3 weeks |
| Time saved | — | 2 weeks |
| Reallocated to | — | Supply acquisition + demand generation |

### Executive Statement

> The board approves OPTION C. Sprint 3 is reduced to the minimum engineering required to launch a working marketplace. The 2 weeks saved are reinvested in supply acquisition, demand generation, and founder operations preparation. The claim workflow, duplicate detection, and support ticket system are deferred to P1. Payment checkout is elevated to P0. The founder is responsible for all manual operations during the 4-week Closed Alpha. The MVP v1 Gate (10 bookings, EGP payment, host payout, 0 fraud) is the sole success criterion.
