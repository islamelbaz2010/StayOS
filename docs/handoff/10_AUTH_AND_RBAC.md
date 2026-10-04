# 10 — Authentication & RBAC

## Authentication
- **Identity:** Firebase OTP (phone) + social providers; backend issues its
  own RS256 JWT pair on verified login.
- **Sessions:** access token 15 min; refresh token 7 d, rotating
  (`auth.refresh_tokens` table). `/auth/logout-all` revokes all devices.
- **Password reset:** `/auth/forgot-password` flow exists.
- **Device tokens:** `POST /auth/device-token` registers Expo push tokens.
- **Dev login:** `POST /auth/dev-token` — gated by `ENVIRONMENT`; returns 404
  in true production. The Railway prod service runs `ENVIRONMENT=staging`,
  which intentionally keeps it enabled for ops verification.
- **OTP fallback:** Akedly (Egyptian OTP provider) + Twilio Verify.

## Roles
| Role | Meaning |
|---|---|
| `guest` | marketplace guest |
| `host` | property host (still books as a user) |
| `field_staff` | on-ground ops, no console |
| `staff` | internal staff — needs `staff_permissions` grants |
| `admin` | full access (implicit all permissions) |

## Staff permissions
`listings`, `kyc`, `payments`, `operations`, `disputes`, `discovery`,
`content`, `reports` — rows in `auth.staff_permissions`
(`uq_staff_permission`). Support inbox requires `operations`.

## Enforcement rules
- Every check is server-side in `services.py`/deps — e.g.
  `_can_handle_support()` for the ops queue, booking ownership for
  booking-context support, unit ownership for host surfaces.
- Capability model: booking detail grants by relationship
  (owner / unit host / co-host scope / staff permission), not just role.
- Frontend hides links for UX only; a hidden link must still 403 server-side.

## Security surfaces
- Rate limiting on auth/OTP endpoints (`security/rate_limit.py`, Redis).
- Audit trail: `security/audit.py` writes `audit_logs` for sensitive actions.
- PII: `security/pii.py` redaction in logs.
- CSRF: not applicable — pure bearer-token API (no cookie auth).
