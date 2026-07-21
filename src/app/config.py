from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings


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

    CALENDAR_LOCK_TIMEOUT_MS: int = 5000

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
