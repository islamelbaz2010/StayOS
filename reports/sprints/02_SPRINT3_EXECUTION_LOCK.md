# 02 — SPRINT 3 EXECUTION LOCK

**Author:** Executive Program Director & Chief Product Officer  
**Date:** 2026-08-03  
**Status:** LOCKED — This is the definitive Sprint 3 scope. No discussion. No options. No alternatives. Engineering builds exactly this and nothing more.

---

## Conflict Resolution

Prior documents conflict. This document resolves all conflicts. Where prior reviews disagree, this document wins.

| Conflict | Resolution |
|----------|------------|
| `SPRINT3_FINAL_BACKLOG.md` lists 19 P0 stories (62 SP) | **OVERRULED.** 4 stories removed from P0. See below. |
| `02_REVISED_SPRINT3_ROADMAP.md` reduces to 44 SP | **CONFIRMED** as base, but adds vision features. |
| `07_FINAL_EXECUTIVE_DECISION.md` adds 4.5 SP vision features | **CONFIRMED.** These are mandatory. |
| `SPRINT3_GAP_ANALYSIS.md` shows 39 SP remaining | **UPDATED.** Actual remaining is 29.5 SP after scope reduction + vision additions. |
| `SPRINT3_FINAL_BACKLOG.md` marks S3-008 as WhatsApp | **OVERRULED.** SMS only. WhatsApp Business API is unresolved and not needed for alpha. |
| `SPRINT3_FINAL_BACKLOG.md` marks S3-011 as 5 SP with photo download | **OVERRULED.** Simplified to 3 SP. No photo URL download. Founder uploads photos manually. |

---

## MANDATORY (Must build before alpha)

| ID | Story | Status | Remaining SP | Why Mandatory |
|----|-------|--------|-------------|---------------|
| S3-033 | S3 bucket config + CORS | PARTIAL | 1 | Blocks all photo upload |
| S3-031 | Presigned S3 URLs for listing photos | PARTIAL | 1 | Blocks photo upload |
| S3-004 | Listing photo upload (backend + frontend) | NOT IMPLEMENTED | 5 | Hard blocker. No photos = no listings = no marketplace. |
| S3-003 | Listing creation form (frontend) | PARTIAL | 3 | Hosts cannot create listings without UI. |
| S3-007 | Submit for review endpoint | PARTIAL | 1 | Listings stuck in DRAFT without it. |
| S3-009 | Admin KYC review queue | PARTIAL | 2 | Founder cannot verify hosts without it. |
| S3-010 | Admin listing verification queue | NOT IMPLEMENTED | 3 | Founder cannot approve listings without it. |
| S3-011 | CSV import (simplified, no photo download) | NOT IMPLEMENTED | 3 | Needed to seed 30+ listings from agencies. |
| S3-008 | SMS notifications (triggers only) | PARTIAL | 2 | Hosts need to know when KYC/listing is approved. SMS, not WhatsApp. |
| S3-018 | Payment checkout (Paymob iframe or manual) | NOT IMPLEMENTED | 5 | No payment = no transaction = no marketplace. |
| V-01 | Real Arabic copy for all guest-facing pages | NOT STARTED | 2 | #1 differentiator. Placeholder text is not Arabic-first. |
| V-02 | Verified Host badge on listing detail | NOT STARTED | 0.5 | Trust infrastructure must be visible. |
| V-03 | Cultural tag filter chips on search page | NOT STARTED | 1 | Core differentiator. Unique to StayOS. |
| V-04 | Escrow trust message on booking page | NOT STARTED | 0.5 | Guests must know their payment is protected. |
| V-05 | Cancellation policy text on booking page | NOT STARTED | 0.5 | Legal protection and trust signal. |

**Total remaining mandatory: 29.5 SP**

---

## OPTIONAL (Build only if all mandatory is done and tested)

| ID | Story | SP | Why Optional |
|----|-------|----|--------------|
| S3-017 | Availability overlay on search cards | 3 | Nice-to-have. Warm contacts can be sent direct links. |
| S3-021 | Verified badges expanded (host profile, more detail) | 2 | V-02 covers the minimum. This is the expanded version. |
| S3-024 | Cancellation policy UI (interactive, not just text) | 2 | V-05 covers the minimum (static text). This is the interactive version. |

**Total optional: 7 SP — DO NOT START until all mandatory is accepted.**

---

## POST-MVP (V1.1 — After alpha, before public launch)

| ID | Story | SP | When |
|----|-------|----|------|
| S3-016 | Map-based search | 5 | V1.1 |
| S3-019 | Host dashboard | 5 | V1.1 |
| S3-020 | Host pricing/calendar from dashboard | 3 | V1.1 |
| S3-022 | Account/listing suspension admin tool | 3 | V1.1 |
| S3-023 | Photo fraud flag (reverse image search) | 3 | V1.1 |
| S3-025 | Listing quality score algorithm | 3 | V1.1 |
| S3-027 | Reviews and ratings | 3 | V1.1 |
| NEW | Egyptian wallet payments (Fawry, Vodafone Cash, Meeza) | 5 | V1.1 |
| NEW | Price transparency (total upfront) | 2 | V1.1 |
| NEW | Host guarantee / guest protection | 3 | V1.1 |
| NEW | Referral program (automated) | 3 | V1.1 |
| NEW | Arabic FAQ page | 1 | V1.1 |
| NEW | SEO landing pages (Arabic) | 2 | V1.1 |

---

## REMOVED (Do not build in Sprint 3 or V1.1)

| ID | Story | Why Removed |
|----|-------|-------------|
| S3-012 | Unclaimed listing creation | Scale feature. Founder creates listings manually or via CSV. Not needed until 100+ listings. |
| S3-013 | Claim review and ownership transfer | Depends on S3-012. Not needed until claim workflow is activated. |
| S3-014 | Duplicate listing detection | At 30-50 listings, founder checks manually. Not needed until 100+ listings. |
| S3-015 | Support ticket queue | WhatsApp is the support channel for alpha. A ticketing system for 15 hosts and 20 guests is over-engineering. |
| S3-026 | Wishlist | Vanity feature. No impact on transactions. |
| S3-028 | Google/Apple OAuth | Phone OTP is sufficient. OAuth is a conversion booster, not a launch requirement. |
| S3-029 | Founder executive dashboard | Founder uses a spreadsheet. A dashboard is management tooling, not marketplace tooling. |
| S3-008 (WhatsApp) | WhatsApp Business API integration | Unresolved external dependency. SMS via Twilio is sufficient. WhatsApp is a V1.1 item. |

---

## Summary

| Category | Count | SP |
|----------|-------|----|
| MANDATORY (remaining) | 15 | 29.5 |
| OPTIONAL | 3 | 7 |
| POST-MVP | 13 | 37 |
| REMOVED | 8 | — |

**Engineering builds the 15 mandatory items. Nothing else. If all 15 are accepted, engineering may start optional items. If optional items are not done, alpha proceeds without them.**

---

## What "Done" Means

A mandatory story is "done" when:

1. Code is written, tested, and deployed to staging
2. Acceptance criteria from `07_FINAL_IMPLEMENTATION_CONTRACT.md` are met
3. Founder can use the feature without engineering assistance
4. The feature works in Arabic RTL
5. Backend tests pass
6. Frontend lint and type-check pass

A story is NOT done when:
- It works in English but not Arabic
- It works in backend but not frontend
- It works in dev but not staging
- It works but founder needs engineering help to use it
