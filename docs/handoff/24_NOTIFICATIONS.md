# 24 — Notifications

## Channels
| Channel | Implementation |
|---|---|
| In-app | `notifications.notifications` + `/notifications` API + web page + header badge |
| Push | Expo push (`EXPO_ACCESS_TOKEN` optional) → `auth.device_tokens`; `EXPO_PROJECT_ID` |
| Email | SMTP (`EMAIL_HOST/USER/PASSWORD`, `EMAIL_FROM_*`) |
| SMS | Disabled by default (`SMS_DELIVERY_ENABLED=false`) — Twilio Verify only for OTP |

## Pipeline (event-driven)
1. Domain events → `shared.outbox_events`.
2. `notifications/tasks.py` (celery beat) claims → renders
   `notification_templates` (EN/AR bodies) → fan-out per user prefs
   (`notification_prefs` table) → records + external send.
3. Unread state via `read_at`; `/notifications/{id}/read`, `/unread-count`.

## Categories
Booking lifecycle, messages, support updates, payment events, listing
moderation, KYC results, payout status, ops tasks (field staff).

## Preferences
`/account-settings/notifications` — per-channel toggles honored at fan-out.

## Failure behavior
Outbox rows retry; a dead channel doesn't block others. Failed sends
surface via Sentry/structured logs — notification delivery is best-effort,
never the transactional boundary for money moves.
