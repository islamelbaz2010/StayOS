# Android APK GitHub Automation — Decision Record

**Date:** 2026-08-26
**Scope:** `.github/workflows/build-mobile-android.yml` only.
**Status:** Implemented, validated locally. Remote GitHub Actions run not executed by this session.

## What was requested

Give StayOS the same practical developer experience Tajribti has: push code,
GitHub Actions builds the Android APK, the newest successful build is always
easy to find and download from GitHub.

## Reference: how Tajribti does it

Inspected read-only via `gh api repos/islamelbaz2010/Tajribti/contents/...`
(no clone, no write, no push to Tajribti).

`.github/workflows/build-consumer-android.yml`:

- **Trigger:** `push` to `main` / an active sprint branch, path-filtered to
  `apps/consumer/**` plus the workflow file itself; also `workflow_dispatch`.
- **Build system:** Flutter, compiled entirely on the `ubuntu-latest` runner
  (`flutter build apk --release`). No native `android/` dir is committed —
  the workflow runs `flutter create --platforms android` first to regenerate
  it, then restores the two files that carry real content
  (`AndroidManifest.xml`, `pubspec.yaml`) from a backup.
- **Persistence mechanism:** `actions/upload-artifact@v4`. **Not** a GitHub
  Release, **not** a commit into the repo, **not** GitHub Pages.
- **Naming:** `tajribti-consumer-android-${{ github.run_number }}`.
- **Retention:** 14 days on the main build workflow (other diagnostic/e2e
  variants use 3–7 days).
- **Secrets:** none required — the whole build runs locally on the runner.
- **Releases/tags:** none. `gh api repos/.../releases` returns 0 releases.
- Confirmed via three other workflow variants in the same repo
  (`DIAGNOSTIC_CONSUMER_DEBUG.yml`, `build-consumer-e2e-disposable.yml`,
  `build-consumer-fix-mlkit-r8.yml`) — all follow the identical
  build-locally → `upload-artifact` pattern, just with different retention
  windows.

## Why StayOS can't copy it verbatim

StayOS mobile is a **managed Expo/EAS** project (`apps/mobile`), not a bare
Flutter/Gradle project. There is no committed native `android/` directory,
and the team's existing, verified workflow is `eas build` against the
`preview` profile in `apps/mobile/eas.json` (`distribution: internal`,
`android.buildType: apk`) — the same profile that produced the last known
good build (EAS build ID `647f0b6a-4e21-49a9-a509-8ea63e8a5b83`, commit
`db65382`, 2026-08-23).

A fully local build (`eas build --local`, mirroring Tajribti's on-runner
compile) was considered and rejected: it would require standing up a full
Android SDK/NDK toolchain on the runner and reproducing Expo's remote
keystore/signing management locally — a materially larger, more fragile CI
change than the task calls for, and a real risk of producing an APK signed
differently from the existing installed builds.

## Decision

Keep EAS Build (cloud) as the compilation step — zero change to how the app
is actually built — and reproduce Tajribti's **persistence** mechanism on
top of it:

1. `eas build --platform android --profile preview --non-interactive --json`
   (existing profile, existing toolchain, `eas-cli` already a devDependency
   in `apps/mobile/package.json`).
2. Download the resulting APK from the URL EAS returns.
3. `actions/upload-artifact@v4`, named `StayOS-android-<version>-<run
   number>`, `retention-days: 14` — same mechanism, same retention window as
   Tajribti's primary Android build workflow.

## Trigger

`push` to `main`, path-filtered to `apps/mobile/**`, plus `workflow_dispatch`
for manual runs. Deliberately *excludes* the workflow file's own path (unlike
Tajribti's filter, which includes it): publishing or editing this workflow
must not, by itself, fire a build attempt — only an actual `apps/mobile/**`
change does that automatically, or a manual `workflow_dispatch` run.

## Required GitHub secret

`EXPO_TOKEN` — an Expo access token, the environment variable EAS CLI reads
for non-interactive authentication. **Not created by this change** — the
workflow fails with a clear `::error::` message (no build attempted) if it
is absent. Create one at
`https://expo.dev/accounts/islamelbaz/settings/access-tokens` and add it as
a repository secret named `EXPO_TOKEN`
(Settings → Secrets and variables → Actions).

(Note: the sprint brief that requested this referred to this credential as
"EAS_TOKEN" — the actual environment variable EAS CLI reads is `EXPO_TOKEN`.
The secret is named `EXPO_TOKEN` here to match what the tooling expects.)

## Security review

- No AWS, Twilio, Akedly, Paymob, or Railway credentials are referenced.
- No token is hardcoded; `EXPO_TOKEN` is read only from `secrets.EXPO_TOKEN`.
- No `.env` file is read or uploaded.
- No personal filesystem path is embedded in the workflow.
- `permissions: contents: read` set explicitly (Tajribti's workflow relies
  on the default token permissions; this repo's workflow declares the
  minimum explicitly instead).

## Not done / left for the owner

- The workflow has not been run remotely by this session — GitHub Actions
  execution was not triggered. Its correctness is validated locally only
  (YAML parses; structure mirrors the verified Tajribti pattern).
- `EXPO_TOKEN` has not been created or added as a secret — that requires an
  action on expo.dev and in the GitHub repo settings that this session
  cannot perform.
