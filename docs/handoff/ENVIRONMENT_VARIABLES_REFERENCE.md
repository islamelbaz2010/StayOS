# StayOS Environment Variables Reference

Backend variables are declared in `src/app/config.py` (pydantic-settings).
Real values live in Railway service variables (production) and local
`.env` (never committed). `.env.example` / `.env.staging.example` hold
safe placeholders only.

## Backend (`src/app/config.py`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | required | — | PostgreSQL database URL |
| `REDIS_URL` | required | — | Redis URL |
| `ENVIRONMENT` | optional | `"development"` |  |
| `LOG_LEVEL` | optional | `"INFO"` |  |
| `CORS_ORIGINS` | optional | `"http://localhost:3000"` | Comma-separated CORS origins |
| `CORS_ORIGIN_REGEX` | optional | `""` | Regex pattern for allowed CORS origins (e.g. Vercel preview URLs) |
| `WEB_BASE_URL` | optional | `Field(` |  |
| `PAYMENT_RETURN_TOKEN_TTL_HOURS` | optional | `Field(` |  **⚠ secret** |
| `VAT_RATE_PCT` | optional | `Field(` |  |
| `FIREBASE_PROJECT_ID` | optional | `""` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | optional | `""` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | optional | `""` | Firebase service account private key **⚠ secret** |
| `TWILIO_ACCOUNT_SID` | optional | `""` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | optional | `""` | Twilio auth token **⚠ secret** |
| `TWILIO_VERIFY_SERVICE_SID` | optional | `Field(` |  |
| `TWILIO_SMS_FROM` | optional | `Field(` |  |
| `AKEDLY_API_KEY` | optional | `""` | Akedly API key **⚠ secret** |
| `AKEDLY_PIPELINE_ID` | optional | `""` | Akedly pipeline ID |
| `AKEDLY_BASE_URL` | optional | `Field(` |  |
| `PAYMOB_API_KEY` | optional | `Field(` |  **⚠ secret** |
| `PAYMOB_SECRET_KEY` | optional | `Field(` |  **⚠ secret** |
| `PAYMOB_PUBLIC_KEY` | optional | `Field(` |  **⚠ secret** |
| `PAYMOB_HMAC_SECRET` | optional | `""` | Paymob HMAC secret **⚠ secret** |
| `PAYMOB_INTEGRATION_ID` | optional | `Field(` |  |
| `PAYMOB_IFRAME_ID` | optional | `Field(` |  |
| `PAYMOB_NOTIFICATION_URL` | optional | `Field(` |  |
| `PAYMOB_PAYOUT_CLIENT_ID` | optional | `Field(` |  |
| `PAYMOB_PAYOUT_CLIENT_SECRET` | optional | `Field(` |  **⚠ secret** |
| `PAYMOB_PAYOUT_USERNAME` | optional | `Field(` |  |
| `PAYMOB_PAYOUT_PASSWORD` | optional | `Field(` |  **⚠ secret** |
| `PAYMOB_PAYOUT_BASE_URL` | optional | `Field(` |  |
| `STRIPE_SECRET_KEY` | optional | `""` | Stripe secret key **⚠ secret** |
| `STRIPE_WEBHOOK_SECRET` | optional | `Field(` |  **⚠ secret** |
| `META_WHATSAPP_TOKEN` | optional | `""` | Meta WhatsApp API token **⚠ secret** |
| `META_PHONE_NUMBER_ID` | optional | `""` | Meta WhatsApp phone number ID |
| `S3_LISTINGS_BUCKET` | optional | `""` | S3 bucket for listing photos |
| `S3_PAYMENT_PROOF_BUCKET` | optional | `Field(` |  |
| `S3_KYC_BUCKET` | optional | `""` | S3 bucket for KYC documents |
| `S3_KYC_ACCESS_KEY_ID` | optional | `""` | KYC bucket access key (falls back to AWS_ACCESS_KEY_ID) **⚠ secret** |
| `S3_KYC_SECRET_ACCESS_KEY` | optional | `""` | KYC bucket secret (falls back to AWS_SECRET_ACCESS_KEY) **⚠ secret** |
| `S3_PAYMENT_PROOF_ACCESS_KEY_ID` | optional | `""` | Payment-proof bucket access key (falls back to AWS_ACCESS_KEY_ID) **⚠ secret** |
| `S3_PAYMENT_PROOF_SECRET_ACCESS_KEY` | optional | `""` | Payment-proof bucket secret (falls back to AWS_SECRET_ACCESS_KEY) **⚠ secret** |
| `AWS_REGION` | optional | `""` | AWS region |
| `AWS_ACCESS_KEY_ID` | optional | `""` | AWS access key ID **⚠ secret** |
| `AWS_SECRET_ACCESS_KEY` | optional | `""` | AWS secret access key **⚠ secret** |
| `S3_ENDPOINT_URL` | optional | `Field(` |  |
| `S3_PRESIGNED_GET_TTL_SECONDS` | optional | `86400` |  |
| `KYC_VERIFICATION_MODE` | optional | `Field(` |  |
| `SUMSUB_BASE_URL` | optional | `"https://api.sumsub.com"` |  |
| `SUMSUB_APP_TOKEN` | optional | `""` | Sumsub app token **⚠ secret** |
| `SUMSUB_SECRET_KEY` | optional | `""` | Sumsub API secret for request signing **⚠ secret** |
| `SUMSUB_LEVEL_NAME` | optional | `Field(` |  |
| `SUMSUB_WEBHOOK_SECRET` | optional | `Field(` |  **⚠ secret** |
| `SUMSUB_ALLOW_SANDBOX` | optional | `Field(` |  |
| `SENTRY_DSN` | optional | `""` | Sentry DSN |
| `SES_FROM_EMAIL` | optional | `Field(` |  |
| `EXPO_ACCESS_TOKEN` | optional | `Field(` |  **⚠ secret** |
| `GOOGLE_MAPS_API_KEY` | optional | `""` | Google Maps Platform API key (mobile app maps; never used by Supply Discovery) **⚠ secret** |
| `GOOGLE_PLACES_API_KEY` | optional | `""` | Google Places API key for Supply Discovery (server-side; separate credential from GOOGLE_MAPS_API_KEY) **⚠ secret** |
| `OTP_TTL_SECONDS` | optional | `300` |  |
| `OTP_MAX_ATTEMPTS` | optional | `3` |  |
| `OTP_RATE_LIMIT_WINDOW` | optional | `900` |  |
| `IMAGE_HOST_ALLOWLIST` | optional | `Field(` |  |
| `JWT_PRIVATE_KEY` | required | — | RSA private key PEM for JWT signing **⚠ secret** |
| `JWT_PUBLIC_KEY` | required | — | RSA public key PEM for JWT verification **⚠ secret** |
| `JWT_ALGORITHM` | optional | `"RS256"` |  |
| `JWT_ACCESS_TOKEN_TTL_MINUTES` | optional | `15` |  **⚠ secret** |
| `JWT_REFRESH_TOKEN_TTL_DAYS` | optional | `7` |  **⚠ secret** |
| `CALENDAR_LOCK_TIMEOUT_MS` | optional | `5000` |  |
| `PLATFORM_TOTAL_SHARE_PCT` | optional | `0.12` |  |
| `HOST_SIDE_SHARE_PCT` | optional | `0.06` |  |
| `GUEST_SIDE_SHARE_PCT` | optional | `0.06` |  |
| `PAYMENT_BANK_NAME_AR` | optional | `Field(` |  |
| `PAYMENT_BANK_NAME_EN` | optional | `Field(` |  |
| `PAYMENT_ACCOUNT_NAME` | optional | `Field(` |  |
| `PAYMENT_BANK_ACCOUNT_NUMBER` | optional | `Field(` |  |
| `PAYMENT_VODAFONE_CASH_NUMBER` | optional | `Field(` |  |
| `CANCELLATION_FULL_REFUND_DAYS` | optional | `7` |  |
| `CANCELLATION_PARTIAL_REFUND_DAYS` | optional | `3` |  |
| `CANCELLATION_PARTIAL_REFUND_PCT` | optional | `0.5` |  |
| `PAYMENT_DEADLINE_HOURS` | optional | `Field(` |  |
| `REQUEST_EXPIRATION_HOURS` | optional | `Field(` |  |
| `PAYMENT_PROOF_MAX_REJECTIONS` | optional | `3` |  |
| `PAYMENT_PROOF_RESUBMISSION_WINDOW_HOURS` | optional | `48` |  |
| `REFUND_PROCESSING_DAYS` | optional | `Field(` |  |
| `DEFAULT_CHECK_IN_TIME` | optional | `Field(` |  |
| `DEFAULT_CHECK_OUT_TIME` | optional | `Field(` |  |
| `PRE_ARRIVAL_INFO_RELEASE_HOURS` | optional | `Field(` |  |

## Railway production service (55 variables)

The production `stayos-demo` service defines the backend set above plus
Railway-provided `PG*` / `RAILWAY_*` variables. Names only — values are
managed in the Railway dashboard:

- Database: `DATABASE_URL`, `PGDATABASE`, `PGHOST`, `PGPASSWORD`,
  `PGPORT`, `PGUSER`
- Infra: `REDIS_URL`, `RAILWAY_DOCKERFILE_PATH`, `ENVIRONMENT=staging`
  (staging-mode flag on the production service — enables `/auth/dev-token`)
- Web: `WEB_BASE_URL`, `CORS_ORIGINS`, `CORS_ORIGIN_REGEX`
- Auth: `JWT_*`, `FIREBASE_*`, `TWILIO_*`, `AKEDLY_*`
- Payments: `PAYMOB_*`, `STRIPE_*`
- Storage: `AWS_*`, `S3_*`
- Other: `GOOGLE_*`, `IMAGE_HOST_ALLOWLIST`, `KYC`/`SUMSUB` providers,
  business knobs (`*_PCT`, `*_DAYS`, `*_HOURS`)

## Mobile

- Mobile env detected: EXPO_PUBLIC_API_URL, EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
- Web `.env.local` holds `NEXT_PUBLIC_*` values (API base URL etc.).

## Flags

- `ENVIRONMENT` gates `/auth/dev-token` (404 outside dev/staging).
- `KYC_VERIFICATION_MODE` selects manual vs provider verification.
- `SUMSUB_ALLOW_SANDBOX` must stay false in real production.
- Paymob `sk_test_*` vs `sk_live_*` env separation is enforced in code.
