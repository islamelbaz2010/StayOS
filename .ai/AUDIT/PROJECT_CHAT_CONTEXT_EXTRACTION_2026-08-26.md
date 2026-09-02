# PROJECT_CHAT_CONTEXT_EXTRACTION_2026-08-26.md

**Source:** `reports/audits/PROJECT_CHAT_SNAPSHOT_2026-08-26.md`  
**Scope:** Historical chat extraction only — no repository verification, no reconciliation.  
**Temporal coverage observed in snapshot:** 2026-08-14 → 2026-08-26 (with embedded references back to 2026-07-21 and earlier).  
**Status at end of provided chat:** V1 commercial/legal model locked; execution path shifted to Paymob + Legal Counsel + AWS/S3 engineering; a new booking-confirmation failure surfaced immediately before chat close.

---

## 1. PROJECT IDENTITY

| Attribute | Extracted Statement | Classification | Evidence / Source Location | Temporal Status | Confidence |
|-----------|---------------------|----------------|----------------------------|-----------------|------------|
| Name | StayOS | DECISION | DEC-001, repeated throughout chat | CURRENT AT END OF CHAT | High |
| Type | AI-powered, two-sided accommodation marketplace for MENA | DECISION | DEC-001; founder review Aug 14 | CURRENT | High |
| "OS" meaning | Business metaphor, not computer operating system | DECISION | DEC-001, MASTER_CONTEXT | CURRENT | High |
| Launch market | Egypt proof-of-concept; GCC corridor is the business | DECISION | DEC-002, founder review | CURRENT | High |
| UX language | Arabic-first, not Arabic-translated | DECISION | DEC-003 | CURRENT | High |
| AI positioning | Roadmap, not launch claim | DECISION | DEC-008 | CURRENT | High |
| Current identity framing | A real Mobile V1 product exists; not a prototype | FOUNDER-ACCEPTED DECISION | Founder review Aug 14: "لدينا الآن لأول مرة Mobile V1 حقيقية" | CURRENT AT END | High |
| Product surface | Mobile-first (primary), web secondary | FOUNDER-ACCEPTED DECISION | Multiple founder messages Aug 17-19; ADR-MOBILE-FRAMEWORK referenced | CURRENT AT END | High |

---

## 2. FOUNDER DECISION REGISTER

| ID | Decision | Classification | Evidence / Quote | Date | Status at End |
|----|----------|----------------|------------------|------|---------------|
| D14 | React Native + Expo for Mobile V1; Flutter rejected | FOUNDER-ACCEPTED DECISION | ADR-MOBILE-FRAMEWORK adopted; chat extraction summary | 2026-08-17 | LOCKED ✅ |
| D15 | Standalone EAS APK replaces Expo Go | FOUNDER-ACCEPTED DECISION | Extraction summary; OPPO APK install | 2026-08-17 | LOCKED ✅ |
| D17 | Mobile is primary product target, not website | FOUNDER-ACCEPTED DECISION | "Mobile V1 حقيقية"; 8 screens built | 2026-08-17/18 | CURRENT |
| D18 | Smart location autocomplete is mandatory | FOUNDER-ACCEPTED DECISION | "Search لازم يكون أقوى من مجرد Search Box" | Aug 14/17 | CURRENT |
| D20 | Stop repeating audits / planning docs — move to code | FOUNDER DECISION | "STOP FEATURE DEVELOPMENT"; "لا نرجع للـEngineering Cycle" | Aug 17/18 | CURRENT |
| D24 | Phase 3 targeted-fix loop authorized (not redesign) | FOUNDER-ACCEPTED DECISION | Phase 3 OPPO validation reports; founder approval | 2026-08-18 | CURRENT |
| — | V1 commercial rates: 4% guest fee, 10% host commission, 2% platform take | FOUNDER-ACCEPTED DECISION | "أصبح عندنا Canonical V1" line 3988-4001 | 2026-08-23/25 | LOCKED ✅ |
| — | Payment Model A: Guest → StayOS-controlled account → Host | FOUNDER-ACCEPTED DECISION | "Guest → StayOS account → Host" accepted | 2026-08-23/25 | LOCKED ✅ |
| — | Akedly chosen for OTP; Twilio decision closed | FOUNDER-ACCEPTED DECISION | "Use: Akedly; Do NOT reopen Twilio vs Akedly" | 2026-08-23/25 | LOCKED ✅ |
| — | Airbnb/Booking.com: no integration, no scraping; discovery only | FOUNDER-ACCEPTED DECISION | "لا نلمس Airbnb أو Booking في الكود" | 2026-08-25 | LOCKED ✅ |
| — | AWS/S3 deferred pending Paymob coordination | FOUNDER-ACCEPTED DECISION | "AWS = DEFERRED" | 2026-08-25 | CURRENT |
| — | Real-money transactions blocked until legal + founder prerequisites | FOUNDER-ACCEPTED DECISION | "Real-money = BLOCKED مؤقتًا" | 2026-08-25 | CURRENT |
| — | Stop legal/commercial work; move to execution | FOUNDER DECISION | "أوقف أي شغل Legal/Commercial إضافي" | 2026-08-25 | CURRENT |
| — | First supply target: 10 real listings → Closed Pilot; 40+ for launch-readiness | FOUNDER-ACCEPTED DECISION | "10 real listings" then "40 real listings" | 2026-08-14/17 | CURRENT |
| — | Definition of Done for V1 requires real customer test + 40+ listings | FOUNDER-ACCEPTED DECISION | "Definition of Done الذي أعتمده الآن" | 2026-08-14 | CURRENT |

---

## 3. PRODUCT DIRECTION HISTORY

| Previous Direction | New Direction | Evidence | Date | Acceptance Status | What Appears Superseded |
|--------------------|---------------|----------|------|-------------------|------------------------|
| Planning-heavy / audit-heavy | Code-heavy / execution-heavy | "STOP repeating audits"; "move to code"; "لا نرجع نعمل Sprint قرارات جديد" | 2026-08-18/25 | Founder-accepted | Earlier repeated assessment cycles |
| Web-first | Mobile-first | Mobile V1 built; ADR-MOBILE-FRAMEWORK; "Mobile is primary" | 2026-08-17/18 | Founder-accepted via ADR | Web as primary V1 surface |
| Expo Go distribution | Standalone EAS APK | "Expo Go failed on OPPO"; APK built/installed | 2026-08-17 | Founder-accepted | Expo Go as primary runtime |
| Google Maps | Leaflet/OpenStreetMap fallback | Map fallback displays "الخريطة غير مُعدة" when no API key | 2026-08-17/18 | Engineering fallback | Hard Google Maps dependency for V1 |
| No production deployment | Railway + Vercel demo approved | Railway incident resolution; Vercel 200 | 2026-08-17 | Founder-accepted | On-premise / Terraform-only stance |
| "Build more features" | "Prove + Load Supply" | "لن نضيف Features جديدة الآن"; shift to supply acquisition | 2026-08-14/17 | Founder-accepted | Feature expansion beyond P0 |
| Airbnb/Booking as integration channels | Discovery intelligence only | "Airbnb/Booking = مصدر Discovery / Acquisition" | 2026-08-25 | Founder-accepted | V1 integration build |
| 0% host commission alpha | 10% host + 2% platform + 4% guest V1 rates | "Canonical V1" rates locked | 2026-08-25 | Founder-accepted (but code may still contain 0% alpha logic — conflict) | Earlier alpha commission waivers |
| Phase 0 manual-only | Phase 1 code actually built | Engineering foundation built despite Phase 0 gates | Throughout | Unresolved governance conflict | Strict Phase 0 gate enforcement |

---

## 4. OBJECTIVE HISTORY

| Period | Objective | Evidence | Temporal Status |
|--------|-----------|----------|-----------------|
| Earlier | Build governance and institutional memory before implementation | MASTER_PROJECT_MEMORY, SPRINT_MEMORY | HISTORICAL / SUPERSEDED in practice |
| Aug 14-17 | Close 3 gates: DB migration, mobile runtime acceptance, real supply | "Close these three gates" prompt | HISTORICAL (partially progressed) |
| Aug 17-18 | Finish V1 engineering: fix Booking CTA, rebuild APK, validate on OPPO | Phase 3 report; Management Analysis | SUPERSEDED by Aug 23 report claiming CTA fixed |
| Aug 19-22 | Refresh assessment suite; freeze evidence | 7-document assessment suite | HISTORICAL |
| Aug 23-25 | Lock V1 legal/commercial decisions; reconcile documents | Legal/Commercial Decision Gate prompt | HISTORICAL (completed) |
| End of chat | Execution path: Paymob → Legal Counsel → AWS/S3 → Engineering P0 → Closed Alpha → Real Money | Founder summary Aug 25 | CURRENT AT END OF CHAT |

---

## 5. V1 SCOPE

### In Scope (locked or implemented by end of chat)

| Item | Evidence | Status |
|------|----------|--------|
| Mobile: 8 screens (Home, Search, Listing Details, Booking, Favorites, Trips, Account, Login) | Phase 2/3 reports; founder review | IMPLEMENTED |
| Arabic/English + RTL/LTR | Phase 3 report | IMPLEMENTED |
| Favorites backend + mobile | Backend changes list; Phase 3 report | IMPLEMENTED |
| Smart location autocomplete with Arabic normalization | Founder review; backend list | IMPLEMENTED |
| Location aliases (14 Cairo/Giza seed) | Backend changes list | IMPLEMENTED |
| City/Governorate filtering | Backend changes list | IMPLEMENTED |
| Similar listings | Backend + mobile | IMPLEMENTED |
| Booking flow (claimed resolved Aug 23; new failure Aug 25) | Reports | CLAIMED RESOLVED / NEW FAILURE |
| Payment Model A (manual alpha) | V1 Payment & Commission Policy | LOCKED |
| Terms of Service, Privacy, Host Agreement, Cancellation drafts | Legal Readiness Report | DRAFTED |
| Supply CSV import pipeline + admin approval queue | Supply Acquisition Engine Audit | IMPLEMENTED |

### Explicitly Out of Scope / Frozen for V1

| Item | Evidence | Status |
|------|----------|--------|
| Reviews | "لا Reviews" | FROZEN POST-V1 |
| Compare | "لا Compare" | FROZEN POST-V1 |
| AI recommendations / ML | "لا AI recommendations"; DEC-008 | FROZEN POST-V1 |
| Loyalty / referral | "لا loyalty"; "لا referral" | FROZEN POST-V1 |
| Host app | "لا Host app" | FROZEN POST-V1 |
| Redesign | "لا redesign" | FROZEN |
| Airbnb/Booking integration | "لا Airbnb/Booking في الكود" | REJECTED FOR V1 |
| Stripe activation | "Do NOT activate Stripe" | REJECTED FOR V1 |
| AWS/S3 implementation | "AWS = DEFERRED" | DEFERRED |
| Paymob integration code | "Do NOT build Paymob" | DEFERRED |
| Automated KYC OCR/biometric | "manual review only" | FROZEN POST-V1 |

---

## 6. LATER VERSION DECISIONS

| Version/Phase | Decision | Evidence |
|---------------|----------|----------|
| V1.1 (if time allows) | Reviews | NEXT_SPRINT.md; founder out-of-scope list | HISTORICAL |
| Phase 2 / V2 | Mobile app expansion, B2B SaaS, host dashboard | MASTER_CONTEXT; product roadmap references | FUTURE |
| Phase 3+ | AI pricing, ML matching, fraud detection, demand forecasting | DEC-008; MASTER_CONTEXT | FUTURE |
| GCC Entry | Saudi/UAE expansion 18-36 months | MASTER_CONTEXT | FUTURE |
| Future | Airbnb/Booking.com partnership if channel access secured | Founder summary | FUTURE |

---

## 7. REJECTED / DEFERRED / FROZEN

### Rejected

| Item | Evidence | Why |
|------|----------|-----|
| Airbnb API integration | "لا Airbnb API integration" | Invite-only, not accepting partners |
| Airbnb scraping | "لا scraping" | Legal/ToS violation |
| Airbnb affiliate strategy | "لا affiliate strategy" | Program ended 2021 |
| Booking.com Connectivity API integration | "لا Booking Connectivity integration" | Not accepting new requests |
| Booking Demand/Affiliate API as V1 flow | "لا نبني حول Demand/Affiliate API" | Does not keep booking inside StayOS |
| Stripe activation | "Do NOT activate Stripe" | Avoid two parallel payment models |
| Feature creep (reviews, compare, AI, loyalty, referral, host app, redesign) | Founder lists | Focus V1 |

### Deferred

| Item | Evidence | Return Condition |
|------|----------|------------------|
| AWS/S3 | "AWS = DEFERRED" | After Paymob coordination / legal clarity |
| Paymob integration code | "Do NOT build Paymob" | After Paymob confirms marketplace/split capability |
| Wiring dormant finance module | "Deferred" | Scale / Paymob integration |
| Formal CBE legal opinion | "LEGAL COUNSEL REQUIRED" | After lawyer review |
| Automated KYC biometric/ownership verification | "manual for first 1-10" | Scale |

### Frozen

| Item | Evidence |
|------|----------|
| V1 scope (29.5 SP) | "V1 scope frozen" references |
| Commission rates 4/10/2 | "Canonical V1" locked |
| Payment Model A | "StayOS V1 Commercial Model = LOCKED" |
| Akedly for OTP | "Do NOT reopen Twilio vs Akedly" |

---

## 8. COMMERCIAL DECISIONS

| Topic | Decision | Classification | Evidence | Status |
|-------|----------|----------------|----------|--------|
| Guest service fee | 4% | FOUNDER-ACCEPTED | "Guest fee = 4%" | LOCKED ✅ |
| Host commission | 10% | FOUNDER-ACCEPTED | "Host commission = 10%" | LOCKED ✅ |
| Platform take | 2% | FOUNDER-ACCEPTED | "Platform take = 2%" | LOCKED ✅ |
| Total StayOS take | ~12% (10+2) of host-side + 4% guest fee | FOUNDER-ACCEPTED | Calculation in Payment Policy | LOCKED ✅ |
| Payment flow | Guest → StayOS-controlled account → Host | FOUNDER-ACCEPTED | Model A | LOCKED ✅ |
| Payment deadline | 24 hours | FOUNDER-ACCEPTED | "Payment deadline = 24 ساعة" | LOCKED ✅ |
| Payment proof attempts | 3 attempts / 48 hours | FOUNDER-ACCEPTED | "Proof = 3 محاولات / 48 ساعة" | LOCKED ✅ |
| Refund timing | 5 business days | FOUNDER-ACCEPTED | "Refund = 5 أيام عمل" | LOCKED ✅ |
| Host payout timing | 3 business days | FOUNDER-ACCEPTED | "Host payout = 3 أيام عمل" | LOCKED ✅ |
| Host cancellation | 100% refund to guest | FOUNDER-ACCEPTED | "Host cancellation = 100% refund" | LOCKED ✅ |
| Guest no-show | No refund | FOUNDER-ACCEPTED | "Guest no-show = No refund" | LOCKED ✅ |
| Host no-show / property unavailable | 100% refund to guest | FOUNDER-ACCEPTED | "Host no-show = 100% refund" | LOCKED ✅ |
| Service fee refundability | Non-refundable (inferred from guest no-show rule) | PROJECT-MANAGER DECISION | Cancellation policy draft | LOCKED ✅ |
| First 1-10 hosts | Manual ownership/authorization confirmation | FOUNDER-ACCEPTED | "manual ownership/authorization confirmation" | LOCKED ✅ |
| Alpha commission | **Conflict:** Earlier 0% for first 3 host bookings / first 10 guest bookings; later overridden by 4/10/2 | **UNRESOLVED / SUPERSEDED?** | Prompt line 631-640 vs. canonical V1 | REQUIRES RECONCILIATION |

---

## 9. TECHNICAL DECISIONS

| Topic | Decision | Classification | Evidence | Status |
|-------|----------|----------------|----------|--------|
| Mobile framework | React Native + Expo (V1) | DECISION | ADR-MOBILE-FRAMEWORK | ADOPTED |
| Mobile distribution | Standalone EAS APK | DECISION | OPPO APK install; Phase 3 report | ADOPTED |
| OTP provider | Akedly | DECISION | "Use: Akedly" | LOCKED |
| Deployment platform | Railway (backend) + Vercel (web) | DECISION | Railway incident resolution | CURRENT |
| Maps | Fallback to Leaflet/OSM; Google Maps API key provided but not configured | OPTION/FALLBACK | Map fallback; Google Maps API key line 2343 | PARTIAL |
| Metro file watcher | fsevents@2.3.3 prebuilt binary | EXECUTED DECISION | Handoff report | COMPLETED |
| Dark mode | Force light via app.json | EXECUTED DECISION | V1 execution sprint | COMPLETED |
| Booking CTA fix | TouchableOpacity + Alert.alert diagnostic recommended | RECOMMENDATION | Phase 3 report; end of chat indicates later resolved | UNCERTAIN |
| Repository structure | reports/, evidence/, assets/, docs/governance/ | EXECUTED DECISION | Repository Organization Audit | COMPLETED |
| Backend tests | 491 passing | EXECUTED DECISION | Audit reports | CURRENT |

---

## 10. DEPENDENCIES / BLOCKERS

| ID | Blocker | Type | Evidence | Status at End |
|----|---------|------|----------|---------------|
| B1 | Booking CTA unresponsive on OPPO | Engineering P0 | Phase 2/3 reports | **CONFLICTED** — Aug 23 report claims resolved; Aug 25 message reports booking confirmation still failing |
| B2 | 0 real owner-authorized listings | Operations P0 | Supply reports; "4 real listings" then "0 real" | OPEN |
| B3 | Legal counsel: Is Model A (collecting guest funds) allowed under CBE/PSP licensing? | Legal P0 | "LEGAL COUNSEL REQUIRED"; CBE Law 194/2020 | OPEN |
| B4 | Real StayOS collection account (bank/Vodafone Cash) not designated | Founder P0 | Payment Policy; founder action list | OPEN |
| B5 | Paymob not integrated / not confirmed | Provider P1 | "Paymob = READY TO CONTACT" | OPEN |
| B6 | Twilio not configured (if Akedly not yet wired) | Engineering P1 | OTP returns 422; Akedly chosen but not implemented | OPEN |
| B7 | S3 not configured; payment-proof images in public bucket | Engineering/Security P1 | "S3_LISTINGS_BUCKET العام" | OPEN |
| B8 | Legal docs not published in-product | Legal P0 | Legal Readiness Report | OPEN |
| B9 | No legal entity / registration / tax card | Legal P0 | Legal Readiness Report | OPEN |
| B10 | Railway container healthcheck removed (workaround) | Infrastructure P1 | Railway incident resolution | MONITOR |
| B11 | Migration 022 not proven on production | Backend P1 | Founder gate list | OPEN |
| B12 | Mobile physical-device acceptance not 100% | Engineering P1 | OPPO reports | OPEN |
| B13 | PDPL KYC licensing deadline 2026-10-31 | Legal P0 | Legal Readiness Report | OPEN |

---

## 11. SUPERSEDED DECISIONS

| Superseded Decision | Superseded By | Evidence | Date |
|---------------------|---------------|----------|------|
| Mobile postponed to V3/Phase 2 (DEC-018) | ADR-MOBILE-FRAMEWORK: React Native + Expo for V1 | Reconciliation v2 | 2026-08-17 |
| Expo Go as runtime | Standalone EAS APK | OPPO validation; APK install | 2026-08-17 |
| Web-first product target | Mobile-first | Mobile V1 built; founder statements | 2026-08-17/18 |
| Planning/audit-heavy mode | Code/execution-heavy | "Stop audits"; "move to code" | 2026-08-18/25 |
| No production deployment | Railway + Vercel demo | Railway incident resolution | 2026-08-17 |
| Airbnb/Booking as integration dependencies | Discovery intelligence only | Founder summary Aug 25 | 2026-08-25 |
| 0% host commission for alpha (earlier prompt) | 10% host commission canonical V1 | "Canonical V1" line 3988 | 2026-08-25 |
| Phase 0 manual-only gate | Actual Phase 1 code built and deployed | Governance conflict documented | Ongoing |

---

## 12. UNRESOLVED QUESTIONS

| Question | Why It Matters | Source |
|----------|----------------|--------|
| Is Model A (Guest → StayOS account → Host) legally permissible for alpha in Egypt? | Blocks first real-money transaction | Legal/Commercial Decision Gate; founder summary |
| What is the exact current Git status of `apps/mobile/`? | Risk of uncommitted source loss | Repository Safety Check prompt; extraction v2 |
| Was the Booking CTA actually fixed, and what is the Aug 25 booking confirmation failure? | Contradicts Aug 23 resolved claim | User message Aug 25; V1 Release report Aug 23 |
| Are the canonical 4/10/2 rates actually committed in code and environment files? | Code may still contain 0% alpha or different values | Payment Policy; earlier prompt |
| Has the founder contacted any of the 9/36 supply leads? | Critical path for real listings | Supply Acquisition Engine Audit |
| Is Paymob Requirements Request actually sent? | Unblocks Paymob integration design | Founder summary |
| Has legal counsel been retained and asked the 6 P0 questions? | Blocks real-money legality | Founder summary |
| Is the Google Maps API key configured in the mobile build? | Map rendering | Snapshot line 2343 |
| Is `refund_days = 5` actually set in code/templates? | Prevents broken cancellation promise | Legal Readiness Report; Engineering P0 item |
| What is the actual burn rate / runway remaining? | Portfolio/portfolio prioritization | Missing founder-provided file |

---

## 13. CURRENT-AT-END-OF-CHAT POSITION

**Date represented in snapshot:** 2026-08-26.

### What is true at end of provided chat

1. **Product:** Mobile V1 engineering is reported complete (8/16 screens, backend 491 tests, Railway+Vercel live). However, a new booking-confirmation failure was surfaced by the founder on the day before/at chat close.
2. **Commercial:** V1 commercial model is locked: 4% guest fee / 10% host commission / 2% platform take / Model A payment flow.
3. **Legal:** Draft legal docs exist; real-money transactions are blocked pending legal counsel on CBE/PSP licensing and founder provision of real collection account/entity details.
4. **Operations:** Zero real owner-authorized listings; 36 contactable supply leads exist but contact status unknown.
5. **External:** Paymob Requirements Request ready but not confirmed sent; Akedly chosen for OTP but not wired; AWS/S3 deferred.
6. **Governance:** Phase 0/Phase 1 boundary conflict unresolved; mobile-first pivot unformalized in canonical docs.
7. **Next step (per founder):** Execution path — Paymob → Legal Counsel → AWS/S3 → Engineering P0 (`refund_days = 5`) → Closed Alpha → Real Money.

### What is NOT true / must not be assumed

- Do not assume Booking CTA is fixed; verify against Aug 25 booking-confirmation failure.
- Do not assume real-money readiness; legal + founder prerequisites block it.
- Do not assume 4/10/2 rates are in code; verify `src/app/payments/services.py` and environment files.
- Do not assume mobile source is safely in Git; verify `apps/mobile/` tracking.
- Do not assume Paymob capability; only a requirements request exists.

---

## 14. DECISION TIMELINE

| Date | Event | Material Decision / Change |
|------|-------|----------------------------|
| 2026-08-14 | Founder review of mobile/backend report | Rejects "Mobile V1 DONE"; defines 3 gates (migration, runtime, supply); stops feature expansion |
| 2026-08-14/17 | Founder declares strategic shift | BUILD → PROVE + LOAD SUPPLY; first target 40 listings (later 10 → 40) |
| 2026-08-17 | fsevents fix + .env Railway | Metro runs on Mac; iPhone can connect via LAN |
| 2026-08-17 | Phase 1 Completion Report | Backend favorites/locations/similar committed; Railway container initially unhealthy |
| 2026-08-17 | Railway incident resolution | Removes healthcheckPath; backend healthy |
| 2026-08-17 | OPPO Runtime Diagnostic | Dark mode black screen fixed; UI works |
| 2026-08-17/18 | V1 Execution Sprint | app.json light mode, i18n fixes, Home chips, Search debounce, Booking date picker, mobile added to git |
| 2026-08-18 00:45 | Phase 2 OPPO Validation | Booking CTA P0 FAIL, image P1 FAIL |
| 2026-08-18 05:04 | Phase 3 Targeted Fix | Image/map fallback PASS; Booking CTA still FAIL; TouchableOpacity recommended |
| 2026-08-18 | 7-document assessment suite produced | Extraction → Reconciliation → Audit → MSA → Preflight → Portfolio → Evidence Freeze |
| 2026-08-19 | Repository Safety Check requested | Founder wants Git state verified before Phase 4 |
| 2026-08-22 | Evidence Freeze v1 | Assessment suite frozen; no commits since 2026-08-18 |
| 2026-08-23 | V1 Legal/Commercial Decision Gate prompt | Delegates business decisions to Project Director; locks Model A and 4/10/2 rates |
| 2026-08-23/25 | Founder accepts canonical V1 | Commercial model locked; Paymob ready to contact; legal counsel required; AWS deferred |
| 2026-08-25 | User reports Devin failing to confirm a booking | New P0 issue: booking confirmation loop failing; asks whether to stop or continue |
| 2026-08-25/26 | Founder finalizes Airbnb/Booking decision | No integration, no scraping; discovery-only; direct supply is V1 path |

---

## 15. RECONCILIATION HANDOFF

### Material Items Requiring Repository Verification

1. **Booking CTA / booking flow current state:** Aug 23 report claims CTA resolved; Aug 25 message indicates booking confirmation still failing. Verify `apps/mobile/src/screens/ListingDetailScreen.tsx`, `BookingScreen.tsx`, and latest APK/EAS build.
2. **Git status of `apps/mobile/`:** Is the mobile source tracked and committed? Verify `git ls-files apps/mobile` and `git status`.
3. **Commission rates in code:** Are `GUEST_SERVICE_FEE_PCT=4`, `HOST_COMMISSION_PCT=10`, `PLATFORM_TAKE_RATE_PCT=2` present in `src/app/payments/services.py` and environment files? Are they consistent with the 0% alpha waivers referenced in earlier prompts?
4. **`refund_days = 5` in templates:** Verify `src/app/notifications/templates.py` no longer contains unfilled `{{refund_days}}`.
5. **Railway backend health:** Re-confirm `GET /health` returns 200.
6. **Migration 022:** Verify `022_add_favorites_and_locations.py` has been applied to the target database.
7. **Legal docs in `docs/legal/`:** Confirm ToS, Privacy, Host Agreement, Cancellation/Refund drafts exist and are internally consistent.
8. **Paymob Requirements Request:** Confirm `docs/legal/PAYMOB_REQUIREMENTS_REQUEST.md` exists and is ready to send.

### Potential Supersession Checks

1. **Aug 23 "CTA resolved" vs. Aug 25 booking failure:** Determine which is current. If CTA is fixed, the failure may be in booking confirmation (unit availability, API response, payment) rather than navigation.
2. **0% alpha commission vs. 4/10/2 canonical:** Resolve whether alpha transactions use 0% promotional rates or the locked 4/10/2 rates.
3. **Twilio vs. Akedly:** Akedly was chosen, but Twilio may still be referenced in code/Railway env. Verify OTP configuration.
4. **Google Maps API key:** A key was provided in chat; verify if it is configured in mobile build.
5. **ADR-MOBILE-FRAMEWORK vs. DEC-018:** ADR supersedes mobile postponement, but the mobile-first priority shift may not be formally documented.

### Potential Conflicts

1. **Paymob vs. Stripe:** DEC-004 / MASTER_CONTEXT name Paymob; `FLOWS.md`, `ENGINEERING_BACKLOG.md` reference Stripe; dormant Stripe finance module exists.
2. **Phase 0 gate enforcement vs. Phase 1 code:** `AGENTS.md`/`CLAUDE.md` block Phase 1 code until Phase 0 gates clear, but code is built and deployed.
3. **Model A legal risk:** Commercially locked, but CBE/PSP licensing unresolved; doing real-money transactions before legal counsel could create regulatory risk.
4. **0% commission alpha vs. locked 4/10/2:** Could confuse launch pricing and host agreements.
5. **PROJECT_STATE.md vs. reality:** State files claim no deployed environment / mobile deferred, contradicting live Railway/Vercel and mobile V1.

### Items That MUST NOT Be Assumed Current

- **Booking CTA fixed:** Must be physically re-tested on OPPO after Aug 25 failure report.
- **Real-money ready:** Legal counsel and founder prerequisites are blocking.
- **4/10/2 rates in code:** Must be verified against actual `src/app/payments/services.py` and env files.
- **Mobile source in Git:** Must verify `git ls-files apps/mobile`.
- **Supply leads contacted:** No evidence of contact in snapshot; 0 real listings assumed until proven.
- **Paymob capability confirmed:** Only a requirements request exists.
- **Legal docs published:** Drafts only; not shown to users.
- **CTA diagnosis complete:** TouchableOpacity experiment recommended but not verified in snapshot.

---

**End of extraction.**

*This document represents only what the supplied historical conversation shows. It does not claim current repository truth or make strategic recommendations.*
