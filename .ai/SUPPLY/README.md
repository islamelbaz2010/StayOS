# StayOS Supply Acquisition Operations Hub

**Created:** 2026-08-23  
**Status:** ACTIVE SPRINT — 0 live listings, target 20 by 2026-09-06  
**Owner:** Founder (outreach) + Engineering (import)

---

## Files in This Directory

| File | Purpose | Who Uses It |
|------|---------|-------------|
| `SUPPLY_TRACKER.csv` | Master pipeline — every lead from first contact to LIVE | Founder updates daily |
| `DAY1_FOUNDER_BRIEF.md` | **START HERE** — exact sequence for 2026-08-24 | Founder |
| `FOUNDER_DISCOVERY_EXPORT_INSTRUCTIONS.md` | How to get the 9 pre-qualified leads from Railway DB | Founder |
| `OUTREACH_SCRIPTS.md` | WhatsApp/phone/email templates for every contact type | Founder |
| `AGENCY_RESEARCH_RESULTS.md` | 10 real New Cairo STR operators with contacts | Founder |
| `OWNER_DATA_COLLECTION.md` | What to collect after owner says YES | Founder → Engineering |
| `AUTHORIZATION_WORKFLOW.md` | How to document owner consent legally | Founder |
| `OLX_FACEBOOK_SOURCING_GUIDE.md` | How to find new leads on OLX/Facebook/Dubizzle | Founder |
| `ENGINEERING_IMPORT_GUIDE.md` | How to import authorized listings into StayOS | Engineering |
| `AUTH_EVIDENCE/` | Screenshots of owner authorization messages | Founder saves files here |

---

## Current Pipeline Status (2026-08-23 start of sprint)

| Stage | Count | Source |
|-------|-------|--------|
| Pre-qualified leads in Railway DB (score ≥ 80, contactable) | 9 | Discovery module |
| Agency targets identified | 8 (Tier 1: 2, Tier 2: 3, Tier 3: 3) | Research 2026-08-23 |
| Personal network slots | 10 | Founder fills |
| OLX/Facebook slots | 10 | Founder fills |
| **Total leads ready to contact** | **37** | |
| **LIVE listings** | **0** | |

---

## Target Milestones

| Date | Target | Status |
|------|--------|--------|
| 2026-08-24 | 20+ leads CONTACTED | NOT STARTED |
| 2026-08-26 | 5+ leads INTERESTED | NOT STARTED |
| 2026-08-28 | 3 owner-authorized data packages received | NOT STARTED |
| 2026-08-30 | 3 listings IMPORTED (pending admin approval) | NOT STARTED |
| 2026-09-01 | 3 listings LIVE | NOT STARTED |
| 2026-09-04 | 10 listings LIVE | NOT STARTED |
| 2026-09-06 | 20 listings LIVE (closed alpha gate) | NOT STARTED |

---

## Critical Path Blockers

| Blocker | Blocks | Owner | ETA |
|---------|--------|-------|-----|
| Railway DB / Admin UI access | Extracting 9 pre-qualified leads | Founder | 2026-08-24 |
| Twilio OTP configuration | Real user auth on platform | Engineering | 3-5 days |
| Payment provider decision (Paymob vs Stripe) | Taking real bookings | Founder decision | ASAP |
| S3 configuration | Photo uploads on platform | Engineering | 3-5 days |

**Supply outreach does NOT wait for Twilio/S3/Payment.** Start contacting today. Data packages can be stored locally until import infrastructure is ready.

---

## Status Codes (for SUPPLY_TRACKER.csv)

**Contact_Status:**
- `NOT_CONTACTED` — identified, not yet messaged
- `READY_TO_CONTACT` — message drafted, waiting for founder to send
- `CONTACTED` — message sent, awaiting response
- `RESPONDED` — owner replied (positive, negative, or asking questions)
- `DECLINED` — owner said no

**Interest_Level (set after first response):**
- `HOT` — wants to move forward, asking about details
- `WARM` — interested but has questions or delays
- `COLD` — politely interested but no urgency
- `DECLINED` — explicitly no

**Authorization_Received:**
- `NO` — not yet obtained
- `VERBAL` — WhatsApp/phone verbal consent (screenshot saved in AUTH_EVIDENCE/)
- `WRITTEN` — Signed form or email (file saved in AUTH_EVIDENCE/)

---

## Daily Founder Log (add a row each day)

| Date | Contacted | Responded | Interested | Auth Received | Imported | LIVE |
|------|-----------|-----------|------------|---------------|----------|------|
| 2026-08-24 | | | | | | |
| 2026-08-25 | | | | | | |
| 2026-08-26 | | | | | | |
| 2026-08-27 | | | | | | |
| 2026-08-28 | | | | | | |
