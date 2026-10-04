# 34 — Observability

## Health
`GET /health` → `{status, checks:{database,redis}}` — the canonical smoke
endpoint (verified: db ok, redis ok in prod).

## Metrics
`ENABLE_METRICS` exposes Prometheus-format metrics; Railway's built-in
telemetry covers CPU/mem/network per service (api, worker, beat).

## Tracing
OpenTelemetry support exists in infra tooling (`observability/`,
OTLP exporter settings) — wire `OTEL_*` to a collector for traces;
Railway request logs remain the primary signal today.

## Logging
- Structured app logs → Railway log stream; `LOG_LEVEL` env.
- PII redaction via `security/pii.py`.
- Celery worker/beat logs on their respective services.

## Errors
`SENTRY_DSN` (backend) + web Sentry config — optional but wired.

## Alerting (current)
Outbox notification failures and provider refund failures surface via
Sentry + logs; no external PagerDuty-style alerting yet — ops check
Railway service health + `/health`.

## What to watch
API latency + 5xx (Railway), worker/beat heartbeat (missed beats →
notification/payout lag), Redis connectivity (rate limits, locks),
outbox queue depth.
