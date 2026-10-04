# 13 — Host & Guest Lifecycle

## Guest
1. Register (Firebase OTP / provider) → `guest` role.
2. Browse/search (`/listings`, `/locations/*`, favorites).
3. Book → pay (Paymob card or bank-transfer proof) → stay → review.
4. Account: profile, trips, favorites, messages, notifications,
   preferences (account settings, language), help center, support chat.
5. Become-a-host → role upgrade (`/auth/me/role`) → host KYC + payout prefs.

## Host
1. KYC identity verification (see `14_KYC_IDENTITY.md`) + payout preference
   (bank transfer or mobile wallet — ops-executed, no automated rail yet).
2. Create listing → readiness → submit → staff moderation → live.
3. Operate: dashboard (`/host`, "needs attention" dismissible block),
   today view, calendar, availability rules, reservations inbox
   (governorate→area→listing + status filters), earnings, profile.
4. Host can also act as a guest (capability model — trips/favorites stay).

## Staff / admin
- Created via admin surfaces; `staff_permissions` grants gate console areas.
- field_staff = on-ground operations tasks only (`operations.*` tables).

## Account lifecycle
- Profile fields, avatar, display name (header shows [menu][avatar][name]).
- Deactivation blocked while active bookings exist (test-covered).
- Locale persisted on profile (`user.locale` drives language switch +
  `/account-settings/language` selector).
