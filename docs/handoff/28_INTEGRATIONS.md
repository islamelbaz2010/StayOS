# 28 — Integrations

| Service | Purpose | Status in prod | Credential vars |
|---|---|---|---|
| Firebase | Phone OTP auth | Active | `FIREBASE_*` |
| Paymob Accept | Card payments (Intention + IFrame) | **Live** | `PAYMOB_SECRET/PUBLIC_KEY`, `PAYMOB_*_INTEGRATION_ID`, `PAYMOB_IFRAME_ID`, `PAYMOB_HMAC_SECRET` |
| Paymob Payouts | Host disbursement rail | **Not provisioned** | `PAYMOB_PAYOUT_*` (unset) |
| Sumsub | Automated KYC | Architecture implemented, **not activated** (manual mode) | `SUMSUB_*` (unset) |
| Twilio Verify | OTP fallback | Configured | `TWILIO_*` |
| Akedly | Egyptian OTP | Configured | `AKEDLY_*` |
| Resend/SMTP | Email | `EMAIL_PROVIDER` | `EMAIL_*`, `RESEND_API_KEY` |
| S3/Tigris | Object storage | Active | `AWS_*`, `S3_*` |
| Upstash Redis | Cache/locks/Celery broker | Active | `REDIS_URL`, `UPSTASH_REDIS_*` |
| Google Maps | Places + maps | `ENABLE_GOOGLE_MAPS` gated | `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Firebase Dynamic Links | Share links | Optional | `FIREBASE_DYNAMIC_LINKS_*` |
| Expo | Push notifications | Configured | `EXPO_ACCESS_TOKEN`, `EXPO_PROJECT_ID` |
| Cloudflare Turnstile | Abuse protection | Optional | `TURNSTILE_*` |
| Sentry | Error monitoring | Optional | `SENTRY_DSN` |
| Prometheus | Metrics | `ENABLE_METRICS` | — |
| Geoapify | Geocoding | Optional | `GEOAPIFY_API_KEY` |
| ExchangeRate-API | FX rates | Optional | `EXCHANGE_RATE_API_KEY` |

## Pattern
Every integration sits behind a provider module (`finance/providers.py`,
`kyc` providers, `notifications` senders) — never call third parties from
routers. Optional integrations fail closed (feature flagged) rather than
crashing.
