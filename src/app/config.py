from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    REDIS_URL: str = Field(..., description="Redis URL")

    ENVIRONMENT: Literal["development", "staging", "production", "test"] = "development"
    LOG_LEVEL: str = "INFO"

    CORS_ORIGINS: str = Field(default="http://localhost:3000", description="Comma-separated CORS origins")

    FIREBASE_PROJECT_ID: str = Field(..., description="Firebase project ID")
    FIREBASE_CLIENT_EMAIL: str = Field(..., description="Firebase service account email")
    FIREBASE_PRIVATE_KEY: str = Field(..., description="Firebase service account private key")

    TWILIO_ACCOUNT_SID: str = Field(..., description="Twilio account SID")
    TWILIO_AUTH_TOKEN: str = Field(..., description="Twilio auth token")
    TWILIO_VERIFY_SERVICE_SID: str = Field(..., description="Twilio Verify service SID")

    PAYMOB_API_KEY: str = Field(..., description="Paymob API key")
    PAYMOB_HMAC_SECRET: str = Field(..., description="Paymob HMAC secret")
    PAYMOB_INTEGRATION_ID: int | None = Field(
        default=None, description="Paymob payment integration id"
    )
    PAYMOB_IFRAME_ID: int | None = Field(
        default=None, description="Paymob iframe id for hosted checkout"
    )

    STRIPE_SECRET_KEY: str = Field(default="", description="Stripe secret key")
    STRIPE_WEBHOOK_SECRET: str = Field(
        default="", description="Stripe webhook endpoint secret"
    )

    META_WHATSAPP_TOKEN: str = Field(..., description="Meta WhatsApp API token")
    META_PHONE_NUMBER_ID: str = Field(..., description="Meta WhatsApp phone number ID")

    S3_LISTINGS_BUCKET: str = Field(..., description="S3 bucket for listing photos")
    S3_KYC_BUCKET: str = Field(..., description="S3 bucket for KYC documents")
    AWS_REGION: str = Field(..., description="AWS region")
    AWS_ACCESS_KEY_ID: str = Field(..., description="AWS access key ID")
    AWS_SECRET_ACCESS_KEY: str = Field(..., description="AWS secret access key")

    SENTRY_DSN: str = Field(default="", description="Sentry DSN")

    OTP_TTL_SECONDS: int = 300
    OTP_MAX_ATTEMPTS: int = 3
    OTP_RATE_LIMIT_WINDOW: int = 900

    JWT_PRIVATE_KEY: str = Field(..., description="RSA private key PEM for JWT signing")
    JWT_PUBLIC_KEY: str = Field(..., description="RSA public key PEM for JWT verification")
    JWT_ALGORITHM: str = "RS256"
    JWT_ACCESS_TOKEN_TTL_MINUTES: int = 15
    JWT_REFRESH_TOKEN_TTL_DAYS: int = 7

    CALENDAR_LOCK_TIMEOUT_MS: int = 5000

    # Booking / pricing settings
    GUEST_SERVICE_FEE_PCT: float = Field(default=0.04, ge=0.0, le=1.0)
    HOST_COMMISSION_PCT: float = Field(default=0.10, ge=0.0, le=1.0)
    PLATFORM_TAKE_RATE_PCT: float = Field(default=0.02, ge=0.0, le=1.0)
    CANCELLATION_FULL_REFUND_DAYS: int = Field(default=7, ge=0)
    CANCELLATION_PARTIAL_REFUND_DAYS: int = Field(default=3, ge=0)
    CANCELLATION_PARTIAL_REFUND_PCT: float = Field(default=0.5, ge=0.0, le=1.0)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
