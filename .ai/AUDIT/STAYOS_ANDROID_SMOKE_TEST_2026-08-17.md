# STAYOS — ANDROID SMOKE TEST PREPARATION & DIAGNOSIS

**Date:** 2026-08-17
**Device:** OPPO Reno8 T (CPH2481)
**Android:** 15
**ColorOS:** 15.0
**RAM:** 8 GB + 8 GB virtual
**CPU:** Helio G99

---

## 1. DIAGNOSTIC SUMMARY

**Android connectivity result:** PREPARED — device and Mac must be on the same LAN.
**Metro result:** PASS — Metro Bundler is running on LAN IP `192.168.1.4:8081`.
**API connectivity result:** PASS — `apps/mobile/.env` points to the live Railway API.
**Mobile smoke-test result:** NOT TESTED — the physical device was not reachable via `adb` and the assistant cannot directly operate the phone.
**Exact blocker:** In-device interaction must be completed by the founder.
**Recommended next single action:** Open Expo Go on the OPPO Reno8 T, scan the QR or navigate to `exp://192.168.1.4:8081`, and complete the 11 unauthenticated checks below.

---

## 2. VERIFIED ENVIRONMENT DATA

| Field | Value | Evidence |
|-------|-------|----------|
| Device | OPPO Reno8 T (CPH2481) | User-supplied |
| Android version | 15 | User-supplied |
| ColorOS | 15.0 | User-supplied |
| Expo SDK | 51.0.28 | `apps/mobile/package.json` |
| Expo Go version | UNKNOWN — check the installed Expo Go app version on device | Device-side |
| Mac LAN IP | 192.168.1.4 | `ipconfig getifaddr en0` |
| Metro port | 8081 | `lsof -i :8081` / `ps` |
| API URL | `https://stayos-demo-production.up.railway.app/api/v1` | `apps/mobile/.env` |

---

## 3. STEP-BY-STEP VERIFICATION

### STEP 1 — Local Network

**Result:** PASS

```
Mac LAN IP: 192.168.1.4
Metro listening on: 192.168.1.4:8081
Process: node /Users/ahmed/Documents/Projects/StayOS/apps/mobile/node_modules/.bin/expo start --lan
```

The Mac and the OPPO must be on the same Wi-Fi network for LAN mode to work.

### STEP 2 — Verify Expo

**Expo SDK:** 51.0.28 (from `apps/mobile/package.json`)
**Expo Go requirement:** The device must have an Expo Go app that supports SDK 51. The latest Expo Go from Google Play supports multiple SDKs including 51.
**Metro port:** 8081 (confirmed via `lsof -i :8081`)
**Metro /json endpoint:** `http://192.168.1.4:8081/json` returns `[]` with HTTP 200. This confirms the dev server is listening and responding, but no bundle has been requested yet (normal before a client connects).
**LAN URL:** `exp://192.168.1.4:8081`

**Result:** PASS (server side); device-side Expo Go version not verified.

### STEP 3 — Verify API Configuration

`apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://stayos-demo-production.up.railway.app/api/v1
```

**Result:** PASS — already correct. No change made.

### STEP 4 — Physical Android Smoke Test

**Result:** NOT TESTED

The assistant cannot physically open the device or capture logs because:
1. `adb devices` returned no connected devices.
2. The device is not on USB with debugging enabled.
3. No remote access to the device screen is available.

The dev server is ready for the founder to connect the OPPO manually.

---

## 4. SMOKE-TEST CHECKLIST (FOR FOUNDER)

Use this checklist in the exact order. Do **NOT** test OTP or booking in this run.

| # | Test | Result | Evidence / Notes |
|---|------|--------|------------------|
| 1 | App launches | NOT TESTED | Tap the LAN URL in Expo Go |
| 2 | Home renders | NOT TESTED | Should show "StayOS" header, city chips, "Featured Listings" |
| 3 | Search opens | NOT TESTED | Tap search bar or Search tab |
| 4 | `GET /listings` works | NOT TESTED | Search should show the 3 seed listings |
| 5 | Listing cards render | NOT TESTED | Cards show image, title, city, price |
| 6 | Listing detail opens | NOT TESTED | Tap a card |
| 7 | Images load | NOT TESTED | Cover image should appear |
| 8 | Map renders | NOT TESTED | MapView on listing detail |
| 9 | Navigation works | NOT TESTED | Bottom tabs: Home, Search, Favorites, Trips, Account |
| 10 | Arabic/English switching works | NOT TESTED | Tap language button in Account screen |
| 11 | RTL/LTR behavior works | NOT TESTED | Arabic should be RTL, English LTR |

**After completing the test, update this file with PASS / PARTIAL / FAIL for each row.**

---

## 5. BLOCKER ANALYSIS

| Blocker | Severity | Evidence | Proposed Fix |
|---------|----------|----------|--------------|
| Physical device not accessible to assistant | LOW / PROCESSED | `adb devices` empty | Founder performs the 11-step checklist manually. No code change. |
| Expo Go version unknown | LOW | Device-side | Confirm Expo Go is up to date on the OPPO (Google Play). SDK 51 requires a recent version. |
| If Expo Go cannot load LAN URL | MEDIUM | Not yet observed | Ensure Mac and OPPO are on the same Wi-Fi and no firewall blocks port 8081. If LAN still fails, use a direct `exp://192.168.1.4:8081` link. Do NOT use tunnel or ngrok. |

---

## 6. EXPECTED BEHAVIOR

When the founder opens `exp://192.168.1.4:8081` in Expo Go:

1. Metro should begin bundling `index.ts` for Android.
2. The app should show the Home screen.
3. The Home screen should call `GET https://stayos-demo-production.up.railway.app/api/v1/listings?limit=10`.
4. The 3 seed listings should render in the "Featured Listings" section.
5. Tapping a listing should call `GET /listings/{id}` and open `ListingDetailScreen`.
6. The listing detail should show the image, title, location, host, amenities, map, and similar-properties section (may 404 until backend is redeployed — this is expected).

**Known expected 404s on current live backend (not failures):**
- `GET /locations/autocomplete` — not yet deployed.
- `GET /favorites` — not yet deployed.
- `GET /listings/{id}/similar` — not yet deployed.

These will appear as empty/missing data in the app but should not crash it if error handling works.

---

## 7. STOP CONDITION

This report is **preparation and diagnosis only**.

- No product features were added.
- No mobile code was modified.
- No backend was modified or redeployed.
- No tunnel or ngrok was used.
- No new audit was started.

The only required next action is the founder completing the in-device checklist.
