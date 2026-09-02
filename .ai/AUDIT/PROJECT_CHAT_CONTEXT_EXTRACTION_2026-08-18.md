# PROJECT CHAT CONTEXT EXTRACTION — 2026-08-18

> **Supersedes / extends:** `PROJECT_CHAT_CONTEXT_EXTRACTION.md` (covered through ~2026-08-14).
> **Source snapshot:** `PROJECT_CHAT_SNAPSHOT_2026-08-18.md` (5,425 lines, 2026-07-21 → 2026-08-18).
> **Purpose:** Extract material decisions, direction changes, and frozen/rejected items **new since the prior extraction**. Earlier decisions already captured in the prior extraction are referenced, not re-documented, except where the new chat modifies or overrides them.

---

## 1. EXTRACTION SCOPE

**Chat snapshot:** `PROJECT_CHAT_SNAPSHOT_2026-08-18.md`

**Conversation coverage:**
A multi-session project conversation between the Founder (Arabic/English) and AI assistants (ChatGPT for steering/planning, Devin for execution). The snapshot is a paste-collection: deliverable file names, completion reports, founder steering messages, and pasted execution prompts. It spans 2026-07-21 through 2026-08-18.

**What is NEW vs. prior extraction (material delta):**
- Sprint 1 (S1-01 → S1-08) and Sprint 2 (S2-01 → S2-08) completion — guest journey, auth, bookings, host calendar, host bookings management, listing configuration, OpenAPI contract, production hardening.
- Pre-Sprint 3 executive review, Marketplace Operations Blueprint, Commercial Readiness Review, Final Execution Lock (Sprint 3 scope reduced to 29.5 SP).
- Sprint 3 Wave 1 implementation (host listing form, admin pending/approve/reject, photos).
- Closed Alpha execution validation, Go-Live readiness, Production deployment fixes.
- Supply pipeline audit + discovery engine (Overpass/OSM, Google Places, manual, generic JSON).
- Web UI/UX polish pass (mobile nav, layouts, price breakdown, featured listings, amenity/property-type translation, locale-aware dates, Leaflet map replacing Google Maps).
- **Mobile V1 scaffold** (React Native + Expo, 8 screens, AR/EN, RTL, live API hooks).
- **ADR-MOBILE-FRAMEWORK** decision (React Native + Expo for V1; Flutter rejected).
- Railway backend deployment + duplicate-project cleanup + incident resolution (502 → healthy).
- Vercel frontend deployment (web-amber-pi-98.vercel.app).
- **OPPO physical device validation (Phase 2 + Phase 3)** — image fallback PASS, map fallback PASS, **Booking CTA P0 FAIL**, **Map/List toggle P2 FAIL**.

**Conversation limitations:**
- Many entries are file-name placeholders without full body text.
- Several pasted files (`chatgpt stayos till 7-7.md`, `.zip` archives, `Pasted markdown(...).md`) are referenced but not fully reproduced.
- Duplicate/re-executed sections exist (e.g., Sprint 3 execution package appears twice, S2-08 completion report appears twice).
- No per-message timestamps for every entry; chronological ordering is approximate.

**Extraction confidence:** MODERATE-HIGH for explicit founder decisions (clearly stated in Arabic/English); MODERATE for inferred direction changes; the repository state itself must be reconciled separately (see Section 13).

---

## 2. FOUNDER DECISIONS (NEW OR MODIFIED)

### CHAT-D14 — Mobile framework: React Native + Expo for V1
**Decision:** StayOS Mobile V1 is built with **React Native + Expo**. Flutter is rejected for V1.
**Type:** FOUNDER DECISION (recorded as ADR)
**Status in conversation:** CURRENT AT END
**Evidence:** `ADR-MOBILE-FRAMEWORK.md` created in `.ai/DECISIONS/`. Existing scaffold already uses Expo SDK 51. Founder confirms Android device (OPPO Reno8 T) ready for testing.
**Source context:** Mobile runtime handoff, OPPO smoke test preparation.
**Impact:** Locks the mobile stack; eliminates framework ambiguity; unblocks physical device validation.

### CHAT-D15 — Build APK directly instead of Expo Go
**Decision:** After Expo Go failed to load on the OPPO (white screen, version mismatch), build a standalone EAS preview APK and install it directly via `adb install`.
**Type:** FOUNDER-ACCEPTED DECISION
**Status in conversation:** CURRENT AT END
**Evidence:** "APK طيب ايه رايك نعمل للبرنامج ونشغله مباشرة علي التليفون لو افضل بدل expo الي مش راضي ده". Then: `curl -L -o StayOS-preview.apk ... eas ... apk` → `adb install -r StayOS-preview.apk` → `adb shell am start -n com.stayos.mobile/.MainActivity` → Success.
**Source context:** OPPO Expo Go troubleshooting, EAS build pipeline.
**Impact:** Removes Expo Go as a runtime dependency; APK is the validation vehicle going forward.

### CHAT-D16 — Local product validation before any paid/external services
**Decision:** Before local product validation is complete, do NOT configure Firebase, Twilio, AWS, Paymob, production deployment, supply acquisition, financial model, or new features.
**Type:** FOUNDER DECISION (reaffirmed)
**Status in conversation:** CURRENT AT END
**Evidence:** "🎯 قرار المشروع الآن ... لن نعمل: ❌ Firebase ❌ Twilio ❌ AWS ❌ Paymob ❌ Production deployment ❌ Supply acquisition ❌ Financial Model ❌ Features جديدة ... قبل ما نخلص Local Product Validation."
**Source context:** Founder message around `Pasted markdown(20260810-032449).md`.
**Impact:** Freezes operational spending and external integrations; validates only local demo. **Note:** This was partially relaxed later — Railway + Vercel demo deployments were allowed, but Twilio/Paymob/Firebase remain unconfigured.

### CHAT-D17 — Mobile is the primary product target, not the website
**Decision:** The website is not the primary target; the **mobile app** is. The mobile app must match competitor quality (Airbnb/Booking) in appearance, colors, and typography. Map location display is critically important.
**Type:** FOUNDER DECISION
**Status in conversation:** CURRENT AT END
**Evidence:** "بالنسبة للشكل فاحنا هدفنا موبيل ابلكيشن فمش حكم الويب سايت والمفروض يبقي في مستوي البرامج المنافسه كشكل والوان وصيغة الكتابة ومهم جدا موقع الوحده علي الخريطة يظهر."
**Source context:** Founder message after web UI polish pass.
**Impact:** Redirects polish/UX effort toward mobile; web is a demo/admin surface, not the product.

### CHAT-D18 — Smart search with autocomplete is mandatory
**Decision:** Search must be smart — typing a few letters of an area must trigger autocomplete suggestions. A user typing "المعادي" must find listings tagged "maadi". Plain search-box-only is unacceptable.
**Type:** FOUNDER DECISION
**Status in conversation:** CURRENT AT END
**Evidence:** "🔍 Search لازم يكون أقوى من مجرد Search Box ... مينفعش يبقي وحده مكتوب مكانها maadi والعميل يكتب المعادي ومتظهرلوش لازم يبقي البحث ذكي والمفروض اصلا انا بمجرد مبدأ اكتب كام حرف من المنطقه بيبدأ هو لوحده يظهرلي اقتراحات."
**Source context:** Founder message after Management Situation Analysis.
**Impact:** Backend `GET /locations/autocomplete` with Arabic normalization + 14 Cairo-area seed aliases was implemented to satisfy this.

### CHAT-D19 — Founder wants to finish the first real mobile version ASAP
**Decision:** The founder has been working on the project for a long time and wants the first actual mobile app version completed as soon as possible. The agent is empowered as project manager to organize the path.
**Type:** FOUNDER DECISION
**Status in conversation:** CURRENT AT END
**Evidence:** "واخر نقطة انا بقالي كتير شغال علي المشروع محتاج بقي تشوفلك حل عشان نخلص اول نسخة فعليا من الموبيل ابلكيشن نظمها بقي براحتك انت مدير المشروع."
**Source context:** Founder message after Management Situation Analysis.
**Impact:** Authorizes the agent to drive execution priority toward mobile V1 completion.

### CHAT-D20 — Do not repeat audits / do not create unnecessary documentation
**Decision:** Stop repeating audits, readiness reports, and planning documents. Move to code.
**Type:** FOUNDER DECISION (repeated multiple times)
**Status in conversation:** CURRENT AT END
**Evidence:** "تمام انا محتاج بس انك تبقي مرك في هدف المشروع ومنعملش خطوات مش محتاجينها او مقرره وعايز نبدا بقي في الكود ونخلص البرنامج للموبيل في اسرع وقت بقالنا كتير بنخطط." Also: "اولا ايه الخطوات دي كلها يدوي متتعمل اتوماتيك احسن ... ثانيا بقاله كتير ثابت."
**Source context:** Multiple founder messages throughout August.
**Impact:** Strong anti-drift directive; the agent must not generate new strategy/audit docs unless explicitly required.

### CHAT-D21 — Reciprocal Hosting Match idea deferred
**Decision:** The "Reciprocal Hosting Match" idea (from `Hospitality Exchange idea.md`) will be studied later, after the current main work is reviewed. It must not cause drift from the current scope.
**Type:** FOUNDER DECISION
**Status in conversation:** DEFERRED
**Evidence:** "عايزك تراجع الفكره دي وتقولي رائيك فيها ومش عايزك تسرح في الفكره وتنسي احنا شغالين في ايه حاليا في المشروع." Then: "هنكمل فيها دراسة بعد مراجعه رد البرومبت الاساسي ونشوف هنضيفها ازاي وامتي للمشروع."
**Source context:** Founder messages around the hospitality-exchange idea.
**Impact:** Idea is parked; not in V1 scope.

### CHAT-D22 — Automated supply discovery approved
**Decision:** Supply acquisition will include automated discovery of publicly listed properties on the internet (not manual-only). The discovery engine (Overpass/OSM, Google Places, manual, generic JSON API adapters) is approved.
**Type:** FOUNDER-ACCEPTED DECISION
**Status in conversation:** CURRENT AT END
**Evidence:** "اتفقنا ان هيتم اضافه وحدات اتوماتيك عن طريق البحث عن المعروض ومناسب علي الانترنت عموما مش يدوي."
**Source context:** Founder message after supply pipeline audit.
**Impact:** Discovery engine code is in scope; however, **owner authorization is still required** before a discovered candidate becomes a listing (no scraping-to-listing without owner consent).

### CHAT-D23 — Railway + Vercel demo deployment approved
**Decision:** A live demo backend (Railway) and frontend (Vercel) are approved for customer demonstration, despite the earlier "no production deployment" freeze.
**Type:** FOUNDER-ACCEPTED DECISION (implicit relaxation of CHAT-D16)
**Status in conversation:** CURRENT AT END
**Evidence:** Active project `fcfb039d-bf12-4bb9-8434-98de4742c4cf` (stayos-demo) on Railway with API + Postgres + Redis; `web-amber-pi-98.vercel.app` on Vercel. Founder reviewed and approved the customer-demo-ready state.
**Source context:** Railway duplicate audit, customer demo decision section.
**Impact:** Demo infrastructure is live and protected. Twilio/Paymob/Firebase still unconfigured.

### CHAT-D24 — Phase 3 targeted-fix loop authorized
**Decision:** After Phase 2 OPPO validation revealed the Booking CTA P0 failure, the founder authorized a **targeted fix sprint** (Phase 3) — not a redesign, not new features, not framework migration.
**Type:** FOUNDER DECISION
**Status in conversation:** CURRENT AT END
**Evidence:** "لا أنصح الآن بأي Sprint كبير أو إعادة تصميم شاملة. نعمل حلقة إصلاح صغيرة ومحددة، ثم نعيد الاختبار على نفس الجهاز." Phase 3 prompt: "This is a TARGETED FIX SPRINT. Do NOT redesign the entire application. Do NOT add unrelated features."
**Source context:** Phase 2 validation report, Phase 3 prompt.
**Impact:** Phase 3 produced image/map fallback fixes but the Booking CTA P0 remains unresolved at end of chat.

---

## 3. PRODUCT DIRECTION

**Direction at end of chat:** Mobile-first V1 stabilization on physical OPPO device. The product is a **mobile app** (React Native + Expo) backed by a FastAPI backend (Railway) with a Next.js web admin/demo (Vercel). The immediate goal is to make the Booking CTA work on the physical device so the full booking flow can be validated end-to-end.

**Direction changes during the chat:**
1. **Web-first → Mobile-first:** Early August work focused on web UI/UX polish (Sprint 1, Sprint 2, web polish pass). The founder then explicitly redirected: "هدفنا موبيل ابلكيشن فمش حكم الويب سايت". Web remains as demo/admin.
2. **Planning-heavy → Code-heavy:** The chat shows a long sequence of planning/audit documents (Sprint 3 executive review, marketplace operations, commercial readiness, final execution lock) followed by the founder repeatedly saying "stop planning, start coding." The final stretch (Aug 14-18) is predominantly code execution.
3. **Expo Go → Standalone APK:** Expo Go failed on the OPPO; the team pivoted to EAS-built standalone APKs installed via adb.
4. **Google Maps → Leaflet/OpenStreetMap:** The web map was switched from Google Maps (empty API key) to Leaflet + OpenStreetMap (free, no API key). The mobile map uses a fallback when no API key is configured.

---

## 4. PROJECT OBJECTIVE HISTORY (current at end of chat)

1. **Phase 0 (Customer Validation):** Formally active per governance docs, but not cleared. 0 real users, 0 real listings, 0 real bookings, 0 revenue at end of chat.
2. **Engineering Phase:** "Code-Complete Pre-Alpha" — ~88-90% engineering completion per `PROJECT_STATE.md`. Backend strong (FastAPI, 401 tests, Alembic, payments, escrow). Frontend (web) functional for guest/host/admin journeys. Mobile V1 scaffolded and physically tested but with a P0 blocker.
3. **Immediate Objective:** Fix the mobile Booking CTA P0, then complete the full booking flow validation on the OPPO device (Dates → Guests → Nights → Price → Submit), then favorites, then English/LTR. Only after the functional loop passes will Twilio/Paymob/real supply be addressed.

---

## 5. V1 DECISIONS (Mobile V1)

### V1-MOB-01 — Stack
React Native + Expo (SDK 51), TypeScript, AR/EN i18n, RTL layout, live API hooks against `https://stayos-demo-production.up.railway.app/api/v1`.

### V1-MOB-02 — Screens implemented
Home, Search, Listing Detail, Booking, Favorites, Trips, Account, Login (8 screens).

### V1-MOB-03 — Distribution
EAS preview APK built from `apps/mobile`, installed via `adb install -r` on OPPO CPH2481 / Android 15. Package: `com.stayos.mobile`. MainActivity entry.

### V1-MOB-04 — Dark mode
`userInterfaceStyle: "light"` forced in `app.json` to fix the dark-mode black screen on OPPO/ColorOS.

### V1-MOB-05 — Physical validation status (end of chat)
| Check | Status |
|-------|--------|
| App launches (light + dark) | ✅ PASS |
| StayOS branding | ✅ PASS |
| 5 bottom tabs (Home, Search, Favorites, Trips, Account) | ✅ PASS |
| Search results with real seed listings | ✅ PASS |
| Listing Detail info / back navigation | ✅ PASS |
| Trips and Account empty states | ✅ PASS |
| RTL Arabic layout | ✅ PASS |
| Image fallback (branded placeholder) | ✅ PASS |
| Valid images render | ✅ PASS |
| Map fallback (when no API key) | ✅ PASS |
| **Booking CTA "احجز الآن"** | 🔴 **P0 FAIL** — visible, isolated, but tap does not navigate; no logcat error |
| **Search map/list toggle "خريطة"** | 🟡 **P2 FAIL** — does not change view |
| Booking date picker / guests / price / submit | ⚪ NOT TESTED (blocked by CTA) |
| Favorites toggle | ⚪ NOT TESTED |
| English / LTR switch | ⚪ NOT TESTED |

### V1-MOB-06 — Recommended next investigation (from Phase 3 report)
1. Swap `Pressable` → `TouchableOpacity` for the CTA and view toggle.
2. Add a temporary `Alert.alert` diagnostic inside `handleBook` to confirm the callback is invoked.
3. Minimal `Pressable` reproduction if required.

---

## 6. LATER VERSION / ROADMAP DECISIONS

- **V1.1:** Owner claim workflow, property quality score, duplicate detection, support tickets (all deferred from Sprint 3 P0 — see Section 7).
- **V3:** Mobile was originally classified as deferred V3 in the Portfolio Assessment; the ADR-MOBILE-FRAMEWORK pulled it forward to V1.
- **Post-MVP (37 SP):** 13 stories deferred per `02_SPRINT3_EXECUTION_LOCK.md`.
- **Reciprocal Hosting Match:** Deferred for later study (CHAT-D21).

---

## 7. FROZEN / DO-NOT-BUILD / DEFERRED ITEMS (NEW)

### Removed from Sprint 3 P0 (4 stories, -16 SP)
- S3-012 — Unclaimed listings
- S3-013 — Claim review workflow
- S3-014 — Duplicate detection
- S3-015 — Support tickets

### Do-not-build (founder-confirmed)
- Owner claim workflow — founder contacts owners manually via WhatsApp (CHAT-D12, reaffirmed).
- Property quality score — manual quality checklist instead (CHAT-D13, reaffirmed).

### Deferred to V1.1 or later
- Native mobile deep features (beyond V1 scaffold)
- AI pricing
- Channel managers
- Field operations at scale
- Multi-city expansion
- GCC marketing
- Reciprocal Hosting Match (CHAT-D21)

### Frozen (not to be configured until functional loop passes)
- Twilio (OTP returns controlled 422, not 500, after guard added — but real SMS not configured)
- Paymob (no commercial IDs confirmed; manual bank transfer fallback available)
- Firebase (not configured; local auth path used for validation)
- Google Maps API key (Leaflet/OpenStreetMap used instead on web; mobile uses fallback)
- Production deployment beyond the Railway+Vercel demo

### Anti-drift enforcement (founder directive)
- No new audits, readiness reports, or planning documents unless explicitly required (CHAT-D20).
- No Bootstrap / CLI / DX Architecture work (carried over from prior extraction, CHAT-D04).
- 40 features + 20 processes + 10 metrics explicitly banned in `06_STOP_DOING_LIST.md`.

---

## 8. COMMERCIAL DECISIONS (NEW)

- **Demo infrastructure is live and protected:** Railway `stayos-demo-production.up.railway.app` (API + Postgres 18 + PostGIS 3.6.4 + Redis) and Vercel `web-amber-pi-98.vercel.app`. A duplicate Railway project (`687a4577...`) was deleted after audit confirmed it was an abandoned initial attempt.
- **Supply funnel (end of chat):** 240 candidates → 36 SUPPLY_LEAD (contactable) → 0 OWNER_INTERESTED → 0 real listings. All 7 PMS listings are seed/test data. The bottleneck is human outreach, not engineering.
- **First outreach batch identified:** 6 P0 residential leads + 3 P1 boutique leads, all from OpenStreetMap, with phone numbers and Arabic WhatsApp scripts ready in `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` §6.1. **None have been contacted yet.**
- **Revenue:** EGP 0. No real bookings.

---

## 9. TECHNICAL DECISIONS (NEW)

### TECH-NEW-01 — Web map provider
Leaflet + OpenStreetMap tiles (free, no API key) replacing Google Maps. `ListingMap.tsx` dynamically imported with `ssr: false` to prevent SSR crash from Leaflet's `window` access.

### TECH-NEW-02 — Mobile map
Conditional render with fallback ("الخريطة غير مُعدة" when no API key). No Google Maps API key configured.

### TECH-NEW-03 — Image hosts
`images.unsplash.com` added to `NEXT_PUBLIC_IMAGE_HOSTS` for demo listing photos. Mobile image fallback shows branded StayOS placeholder on failed URLs.

### TECH-NEW-04 — Backend new endpoints (uncommitted at time of delta report, later committed)
- `GET /locations/autocomplete` — Arabic normalization, 14 Cairo-area seed aliases.
- `GET /listings/{unit_id}/similar` — similar-listings recommendations.
- Favorites module — migration, models, router.
- Discovery engine — Overpass/OSM, Google Places, manual, generic JSON API adapters.

### TECH-NEW-05 — Railway healthcheck fix
Removed explicit `healthcheckPath` and `healthcheckTimeout` from `railway.toml`. With the explicit health check configured, Railway kept terminating the container even though uvicorn was running. Removing it let the deployment reach SUCCESS.

### TECH-NEW-06 — Mobile OTP field fix
`LoginScreen` was sending `phone` but the API expects `phone_number`. Fixed. Backend Twilio-credential guard added to prevent 500s (returns controlled 422 instead).

### TECH-NEW-07 — fsevents fix for Metro
Mac's `kern.maxfilesperproc = 10240`. Without fsevents, Metro's NodeWatcher opened 5,178 individual watchers, exhausting file descriptors. Manually installed `fsevents@2.3.3` prebuilt binary to fix EMFILE.

### TECH-NEW-08 — Demo coordinates are placeholders
All 3 seed listings (Zamalek, Maadi, New Cairo) share the same hardcoded coordinates `ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326)` (central Cairo). Not actual property locations. Must be updated when real properties are imported.

---

## 10. MAJOR EXTERNAL DEPENDENCIES / BLOCKERS (NEW)

| Dependency | Status | Blocks |
|-----------|--------|--------|
| **Mobile Booking CTA tap** | 🔴 P0 FAIL — no navigation, no logcat error | Entire booking flow validation |
| **Search map/list toggle** | 🟡 P2 FAIL | Map view on mobile search |
| Twilio credentials | ❌ Not configured | Real OTP login |
| Paymob commercial IDs | ❌ Not confirmed | Real payment checkout (manual fallback exists) |
| Firebase | ❌ Not configured | Phone OTP (local path used for validation) |
| Google Maps API key | ❌ Not configured | Mobile map (fallback works) |
| Real owner-authorized listings | ❌ 0 | Real marketplace validation |
| Operations team | ❌ Not hired | Closed Alpha operations (12-14 people required) |

---

## 11. SUPERSEDED DECISIONS (NEW)

| Prior Decision | Superseded By | Reason |
|---------------|---------------|--------|
| Mobile deferred to V3 (Portfolio Assessment) | ADR-MOBILE-FRAMEWORK (React Native + Expo for V1) | Founder pulled mobile forward; V1 is mobile-first |
| Sprint 3 P0 = 62 SP (`SPRINT3_FINAL_BACKLOG.md`) | Sprint 3 P0 = 29.5 SP (`02_SPRINT3_EXECUTION_LOCK.md`) | Overruled by final execution lock; 4 stories removed, 5 vision features added |
| Expo Go as runtime | Standalone EAS APK | Expo Go failed on OPPO |
| Google Maps on web | Leaflet + OpenStreetMap | Empty API key; Leaflet is free |
| "No production deployment" (CHAT-D16) | Railway + Vercel demo approved (CHAT-D23) | Demo deployment needed for customer validation |

---

## 12. UNRESOLVED QUESTIONS

1. **Why does the Booking CTA `احجز الآن` not navigate when tapped?** No logcat error, other Pressable elements work, layout changes (moving out of absolute, into ScrollView) did not fix it. Next step: TouchableOpacity swap + Alert.alert diagnostic.
2. **Why does the search map/list toggle `خريطة` not change the view?** Same class of issue — Pressable tap not producing the expected state change.
3. **Will the booking flow work end-to-end once the CTA is fixed?** Untested beyond the CTA. Date picker, guest steppers, price calculation, submit are all behind the CTA gate.
4. **Are the uncommitted mobile/backend changes now fully committed and deployed?** The delta report (2026-08-17) said mobile code was untracked. Phase 1 report says favorites/autocomplete/similar were committed and pushed to main. Phase 3 commit `215e483` is on `tooling/repository-intelligence`. Reconciliation with repository state needed.
5. **Has the founder contacted any of the 9 identified supply leads?** No evidence in the chat. The bottleneck is human action.
6. **Is the Railway backend running the latest committed code?** Phase 1 report says code was pushed to main and deployed; the 502 incident was resolved. Needs re-verification.

---

## 13. CURRENT-AT-END OF PROVIDED CHAT — NOT YET RECONCILED WITH REPOSITORY

The chat ends on 2026-08-18 with:
- **Phase 3 targeted fix report** filed at `.ai/AUDIT/STAYOS_V1_PHASE_3_TARGETED_FIX_REPORT_2026-08-18.md`.
- **Final commit referenced:** `215e483` on `tooling/repository-intelligence` (Phase 3); earlier `ca82f31` also referenced in the END_SESSION instruction.
- **Final decision:** "B. TARGETED FIXES REMAIN — REPEAT DEVICE LOOP."
- **Founder's last instruction:** Execute `.ai/BOOTSTRAP/END_SESSION.md`, record the Phase 3 result accurately, do not claim the booking flow was tested beyond the CTA, report what was written and the final repository/working-tree state. Then close the day.

**Repository reconciliation required (not verifiable from chat alone):**
- Confirm `215e483` (or `ca82f31`) is the HEAD of `tooling/repository-intelligence`.
- Confirm the working tree state (clean vs. modified/untracked).
- Confirm the mobile code is tracked in git.
- Confirm the Railway backend is running the latest committed code.
- Confirm the END_SESSION.md protocol was executed and what was written.

---

## 14. DECISION REGISTER (NEW ENTRIES)

| ID | Decision | Type | Status |
|----|----------|------|--------|
| CHAT-D14 | Mobile framework: React Native + Expo for V1 | FOUNDER | CURRENT |
| CHAT-D15 | Build standalone APK instead of Expo Go | FOUNDER-ACCEPTED | CURRENT |
| CHAT-D16 | No paid/external services before local validation | FOUNDER | CURRENT (partially relaxed by D23) |
| CHAT-D17 | Mobile is primary target, not website | FOUNDER | CURRENT |
| CHAT-D18 | Smart search with autocomplete mandatory | FOUNDER | CURRENT |
| CHAT-D19 | Finish first real mobile version ASAP; agent is PM | FOUNDER | CURRENT |
| CHAT-D20 | No repeated audits / unnecessary docs | FOUNDER | CURRENT |
| CHAT-D21 | Reciprocal Hosting Match deferred | FOUNDER | DEFERRED |
| CHAT-D22 | Automated supply discovery approved | FOUNDER-ACCEPTED | CURRENT |
| CHAT-D23 | Railway + Vercel demo deployment approved | FOUNDER-ACCEPTED | CURRENT |
| CHAT-D24 | Phase 3 targeted-fix loop authorized | FOUNDER | CURRENT |

---

## 15. RECONCILIATION HANDOFF

**For the next session:**

1. **Verify repository state:** Confirm HEAD commit, branch, working tree cleanliness, and that mobile code is tracked. The chat references both `215e483` and `ca82f31` as the "final tested commit" — disambiguate.
2. **Verify live infrastructure:** Confirm `https://stayos-demo-production.up.railway.app/health` returns 200 and `https://web-amber-pi-98.vercel.app` loads. Confirm the backend is running the latest committed code (favorites, autocomplete, similar endpoints should return non-404).
3. **Primary P0 — Booking CTA:** The next engineering action is the TouchableOpacity swap + `Alert.alert` diagnostic inside `handleBook` in `apps/mobile/screens/ListingDetailScreen.tsx` (or equivalent). Do NOT attempt zIndex or layout changes again — they have been tried and failed. Do NOT touch the booking backend until the CTA is proven to invoke the callback.
4. **Secondary P2 — Map/List toggle:** Same approach — TouchableOpacity swap + diagnostic alert.
5. **After CTA is fixed:** Rebuild EAS APK, install on OPPO, run the full booking flow (Dates → Guests → Nights → Price → Submit), then favorites, then English/LTR.
6. **Do not** start Twilio/Paymob/Firebase/real-supply work until the functional loop passes on the device.
7. **Do not** create new audits, readiness reports, or planning documents (CHAT-D20).
8. **Supply:** The 9 identified leads and scripts are ready in `SUPPLY_ACQUISITION_PLAYBOOK_FINAL.md` §6.1. This is a founder human-action item, not an engineering item.

**Key files to read first in the next session:**
- `.ai/AUDIT/STAYOS_V1_PHASE_3_TARGETED_FIX_REPORT_2026-08-18.md` — authoritative Phase 3 evidence.
- `.ai/DECISIONS/ADR-MOBILE-FRAMEWORK.md` — mobile stack decision.
- `apps/mobile/screens/ListingDetailScreen.tsx` (or equivalent) — the CTA code to fix.
- `apps/mobile/app.json` — `userInterfaceStyle: "light"` confirmation.

---

*Extraction produced 2026-08-18. This document extends, and does not replace, `PROJECT_CHAT_CONTEXT_EXTRACTION.md`. Reconcile with repository state before acting on any item in Section 13.*
