# Android APK Workflow (non-EAS)

Verified 2026-09-02. This is the canonical way to produce an installable
StayOS Android test APK. It does **not** use EAS and does **not** require
`EXPO_TOKEN`.

## Where it lives

The workflow file, `build-android-local.yml`, was created on the
`release/test-apk-build` branch and has not been merged to `main`. It is
**not present on `main`** — to run it on another branch, copy the file
into that branch first:

```bash
git show release/test-apk-build:.github/workflows/build-android-local.yml \
  > .github/workflows/build-android-local.yml
git add .github/workflows/build-android-local.yml
git commit -m "ci: add non-EAS Android APK workflow"
git push
```

(`main` also has a *different*, EAS-based workflow —
`.github/workflows/build-mobile-android.yml` — which requires an
`EXPO_TOKEN` secret. Do not confuse the two. Prefer the non-EAS one below
unless EAS is specifically what's needed.)

## What it does

StayOS mobile is an Expo **managed** project with no committed native
`android/` directory. This workflow builds one on the runner instead of
using EAS Build's cloud service:

1. Checks out the repo, sets up Node 20 + Java 17 + the Android SDK
   (`platforms;android-34`, `build-tools;34.0.0`) from scratch on the
   runner (~60s).
2. `npm ci` in `apps/mobile`.
3. Patches `expo-modules-core`'s Gradle plugin for Gradle 8 compatibility.
4. `npx expo prebuild --platform android --no-install` — generates the
   native `android/` project (not committed).
5. `./gradlew assembleRelease` — a release-variant build, **unsigned /
   default-signed** ("no signing" per the workflow's own commit message;
   fine for internal test installs via `adb install`, not for a Play
   Store upload).
6. Verifies the APK exists and actually contains the JS bundle
   (`assets/index.android.bundle`).
7. Uploads it as a GitHub Actions artifact.

Runtime config is baked in as workflow env vars, not read from
`apps/mobile/.env`:
- `EXPO_PUBLIC_API_URL` — hardcoded to the deployed backend
  (`https://stayos-demo-production.up.railway.app/api/v1`).
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — from the `GOOGLE_MAPS_API_KEY` repo
  secret (already configured).

**Only `apps/mobile/**` matters for this build.** Backend/web changes
are irrelevant to what's *in* the APK, but note the app talks to the
already-deployed Railway backend at runtime — a backend endpoint that
exists in your branch but hasn't been deployed there yet will simply not
work when exercised from a build off that branch.

## Trigger

Manual only (`workflow_dispatch`, no push trigger). The workflow file
must exist on the ref you target — it runs whatever `apps/mobile` looks
like on that ref, so push your branch first.

```bash
git push -u origin <your-branch>
gh workflow run build-android-local.yml --ref <your-branch>
```

## Monitor

```bash
gh run list --workflow=build-android-local.yml --branch <your-branch> --limit 3
gh run view <run-id> --json status,conclusion,url
# or, to block until it finishes:
until [ "$(gh run view <run-id> --json status --jq .status)" = completed ]; do sleep 30; done
```

A cold build (Android SDK install + prebuild + Gradle) takes roughly
10–20 minutes; the workflow's own timeout is 60 minutes.

## Download the artifact

```bash
gh run download <run-id> --dir /path/to/download
# → <dir>/stayos-standalone-release-apk/app-release.apk
```

Artifact name: `stayos-standalone-release-apk` (fixed, one file:
`app-release.apk`).

## Install and launch

```bash
adb devices                                   # confirm the target device
adb -s <device-id> install -r app-release.apk
adb -s <device-id> shell monkey -p com.stayos.mobile \
  -c android.intent.category.LAUNCHER 1
```

Package name: `com.stayos.mobile`.

## Basic device validation (once installed)

App launches → Home renders → Search opens → destination search works
→ results render → listing detail opens → images render → date
calendar opens and shows blocked dates as disabled → booking flow
reaches confirmation → Trips shows the booking → Profile / Host
Profile / Host Units open → back navigation is sane → Arabic/RTL
critical screens (Home, Search, Booking) are not visually broken.

## What NOT to use for this

- Do **not** use `.github/workflows/build-mobile-android.yml` (EAS,
  needs `EXPO_TOKEN`) unless EAS specifically is what's wanted.
- Do **not** add an `EXPO_TOKEN` secret or `eas.json` changes to make
  this workflow run — it doesn't touch EAS at all.
- Do **not** commit the generated `android/` directory — it's produced
  fresh by `expo prebuild` on every run and stays out of version
  control.
