import logging

from app.config import settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    dsn = settings.SENTRY_DSN
    if not dsn:
        logger.info("SENTRY_DSN not configured; skipping Sentry initialization")
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=1.0 if settings.ENVIRONMENT == "production" else 0.1,
            profiles_sample_rate=0.2,
            integrations=[
                StarletteIntegration(),
                FastApiIntegration(),
            ],
        )
        logger.info("Sentry initialized for environment %s", settings.ENVIRONMENT)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to initialize Sentry: %s", exc)
