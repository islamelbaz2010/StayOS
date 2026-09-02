# STAYOS OPPO RUNTIME DIAGNOSTIC

## 1. Device Identity

| Property | Value |
|---|---|
| Manufacturer | OPPO |
| Model | CPH2481 |
| Product | OPPO Reno8 T |
| Android Version | 15 (API 35) |
| ColorOS/ROM Version | V15.0.0 |
| Build Display | CPH248122282_15.0.0.1800(EX01) |
| ADB Serial | TKINR8IJ5D9DSKQK |

## 2. APK Identity

| Property | Value |
|---|---|
| Package | `com.stayos.mobile` |
| versionName | `1.0.0` |
| versionCode | `1` |
| targetSdk | `34` |
| minSdk | `23` |
| primaryCpuAbi | `arm64-v8a` |
| installer | `com.android.shell` (ADB) |
| firstInstallTime | 2026-08-17 15:36:48 |
| installed | `true` |
| stopped (User 0) | `false` |
| enabled (User 0) | `0` (= `COMPONENT_ENABLED_STATE_DEFAULT`) |
| suspended | `false` |
| hidden | `false` |

## 3. Initial Runtime State

Before the clean launch:
- `adb shell pidof com.stayos.mobile` returned no PID.
- `dumpsys activity activities` showed `mFocusedApp=com.android.launcher/.Launcher`.
- `dumpsys package com.stayos.mobile` showed the package was installed, enabled, not stopped, not suspended.
- `dumpsys package` showed `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` runtime permissions were **not granted** (`granted=false`).

## 4. Launch Diagnostics

A clean launch was performed:

```bash
adb shell am force-stop com.stayos.mobile
adb shell logcat -c
adb shell am start -n com.stayos.mobile/.MainActivity
```

Post-launch:
- `pidof com.stayos.mobile` returned `22836`.
- `dumpsys activity activities` showed:
  - `topResumedActivity=ActivityRecord{e1cf2c7 u0 com.stayos.mobile/.MainActivity t1019}`
  - `ResumedActivity: ActivityRecord{e1cf2c7 u0 com.stayos.mobile/.MainActivity t1019}`
  - `mCurrentFocus=Window{be67413 u0 com.stayos.mobile/com.stayos.mobile.MainActivity}`
  - `mFocusedApp=ActivityRecord{e1cf2c7 u0 com.stayos.mobile/.MainActivity t1019}`
- No `FATAL`, `AndroidRuntime`, `ANR`, or `Exception` entries appeared in the filtered `logcat`.
- The `SurfaceFlinger` log showed a surface for `com.stayos.mobile/com.stayos.mobile.MainActivity`.

**Key finding:** Android considered the `MainActivity` to be **resumed, focused, and visible** with a valid window surface. The app was not frozen, suspended, or ANR'd.

## 5. ANR / Freeze Diagnostics

- `adb shell dumpsys activity anr` did not reveal any ANR for `com.stayos.mobile`.
- `dumpsys activity top` confirmed `MainActivity` is the top activity.
- `dumpsys SurfaceFlinger` confirmed a surface existed for the StayOS window.
- `OplusHansManager` was active on the device, but its `freeze` actions in the captured log were for `com.whatsapp`, **not** `com.stayos.mobile`.
- `mObscuringWindow` was the StayOS `MainActivity` window itself.

**Conclusion:** The app was not in an ANR or frozen state. The OS was correctly treating StayOS as the foreground, focused application.

## 6. OPPO / ColorOS Restrictions

- `OplusHansManager` did not freeze `com.stayos.mobile` during the test window.
- `UlPriorityPolicyForeground` logged `match: config has not com.stayos.mobile` (neutral — the foreground policy simply did not have a specific entry for StayOS).
- `dumpsys package` showed the package is not `stopped`, `suspended`, `hidden`, `quarantined`, or `enabled=2` (disabled).
- No app-specific background-restriction, hibernation, or freezer state was observed for `com.stayos.mobile`.

## 7. Battery Optimization State

Battery optimization was not modified during this diagnostic. The package is not in any restricted/standby bucket that is visible through the inspected `dumpsys` output. No app-specific exemption was required to restore the UI.

## 8. Network Dependency Verification

- The app is a **standalone EAS preview APK** with `expo-updates` not requiring a running Metro bundler.
- The public backend is healthy on `https://stayos-demo-production.up.railway.app`.
- The home screen screenshot captured after resolution shows a live API response (`New Cairo` listing with price `80000 EGP / ليلة`).
- No `127.0.0.1`, `192.168.x.x`, or `localhost` dependencies were observed in the logs.

## 9. Actions Performed

| # | Action | Reason | Result | Reversible? |
|---|---|---|---|---|
| 1 | `adb shell cmd uimode night no` | A previous `am start` produced a completely black screen even though `MainActivity` was resumed and focused. The device's dark mode was suspected of making the Expo/RN splash and first view appear black. | The OS switched from dark to light UI mode. **The next `force-stop` + `am start` rendered the StayOS home screen.** | Yes — `adb shell cmd uimode night yes` or the user can toggle in Settings > Display. |
| 2 | `adb shell pm unsuspend com.stayos.mobile` (repeated) | Rule out suspension as a cause. | Package state remained `suspended=false`. | Yes — `adb shell pm suspend com.stayos.mobile` would restore it. |
| 3 | `adb shell am force-stop com.stayos.mobile` | Clear any stale runtime/foreground state before a clean launch. | Process killed. | Yes — just launching again. |
| 4 | `adb shell am start -n com.stayos.mobile/.MainActivity` | Cold launch the app. | `MainActivity` resumed and the UI rendered successfully. | Yes — stopping the app ends it. |

## 10. Evidence

Selected command outputs:

```text
$ adb shell getprop ro.product.manufacturer
OPPO

$ adb shell getprop ro.product.model
CPH2481

$ adb shell getprop ro.build.version.release
15

$ adb shell getprop ro.build.version.sdk
35

$ adb shell getprop ro.build.version.oplusrom
V15.0.0
```

Package state snippet:

```text
User 0: ... installed=true hidden=false suspended=false ... stopped=false notLaunched=false enabled=0 ...
```

Activity state snippet:

```text
  * Task{7b5601d #1019 type=standard A=10169:com.stayos.mobile U=0 visible=true visibleRequested=true mode=fullscreen translucent=false sz=1}
    topResumedActivity=ActivityRecord{e1cf2c7 u0 com.stayos.mobile/.MainActivity t1019}
    Resumed: ActivityRecord{e1cf2c7 u0 com.stayos.mobile/.MainActivity t1019}
    mCurrentFocus=Window{be67413 u0 com.stayos.mobile/com.stayos.mobile.MainActivity}
    mFocusedApp=ActivityRecord{e1cf2c7 u0 com.stayos.mobile/.MainActivity t1019}
```

Screencap after resolution:

![stayos_phase2.png](/tmp/stayos_phase2.png)

The screenshot shows the Arabic StayOS home screen with:
- `ستاي أو إس` logo
- Search bar (`إلى أين؟`)
- City chips (`الأقصر`, `الإسكندرية`, `الجيزة`, `القاهرة`)
- Featured listing `New Cairo شقة` with `80000 EGP / ليلة`
- Bottom navigation tabs with icons (home, search, favorites, trips, account)

## 11. Root Cause

**Classification:** `OS / OPPO/COLOROS` — device dark UI mode

**Confidence:** `MEDIUM`

**Reasoning:**
- The `MainActivity` was always resuming and the process was always alive.
- No ANR, no crash, no freeze, and no ColorOS-specific restriction was applied to `com.stayos.mobile`.
- The only visible symptom was a black screen while the app was technically fully foreground.
- After switching the device out of dark mode with `cmd uimode night no` and performing a force-stop/restart, the full home UI appeared immediately.
- This indicates the React Native/Expo bundle was loading correctly, but the initial visual output was being rendered as black under the device's dark theme, making it appear as though the app was frozen.

A plausible contributing factor is that the Expo `splash.backgroundColor` and/or the initial React Native view react to `userInterfaceStyle: "automatic"` by using a dark background, and the app was not drawing any content over that background before the home UI appeared.

## 12. Resolution

The UI became visible and usable after:

1. `adb shell cmd uimode night no` — switched OPPO out of dark mode.
2. `adb shell am force-stop com.stayos.mobile` — cleared the previous activity process.
3. `adb shell am start -n com.stayos.mobile/.MainActivity` — cold launched the app.

The app now renders the full home screen and loads live listing data from the Railway backend.

## 13. Current Device Status

**WORKING**

- StayOS launches.
- StayOS UI is visibly rendered.
- Home screen is visible with Arabic UI.
- `MainActivity` is resumed and focused.
- Process remains alive.
- No crash or ANR.
- Live API data is shown on the home screen.

## 14. Remaining Blockers

- The standalone APK currently renders best in light mode on this OPPO device. If the user switches back to dark mode, the initial splash/first view may again appear black. This is an **application UI / splash theme** concern, but it was not addressed in this device-side diagnostic.
- `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` runtime permissions are not granted. The app does not crash without them for the home screen, but photo-related features may request them later.

## 15. Recommended Next Step

Verify that the app behaves correctly with interactive navigation on the physical OPPO:

1. Tap **Search** tab.
2. Tap the search bar and type `Maadi`.
3. Confirm autocomplete suggestions appear.
4. Tap a suggestion and confirm listing results load.
5. Tap a listing card to open detail.
6. Tap back and navigate between all bottom tabs.

If this passes, the physical-device runtime smoke test is complete. If any product defects appear, they should be handed back to the engineering phase.
