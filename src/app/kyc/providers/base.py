"""Identity verification provider abstraction.

StayOS business logic depends on the internal verification model defined
here — never on provider-specific response objects — so the provider can be
replaced without touching the KYC domain.

Outcomes map onto the internal lifecycle (``app.auth.constants.KycStatus``):

    IN_PROGRESS      → applicant mid-flow / result pending (``pending``)
    VERIFIED         → provider verified the applicant (``verified``)
    RETRY_REQUIRED   → recoverable rejection (poor capture, glare, expiry)
                       — the user may retry (``retry_required``)
    MANUAL_REVIEW    → provider escalated to human review (``manual_review``)
    REJECTED         → definitive rejection (``rejected``)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any


class VerificationProviderError(Exception):
    """Raised when a provider call fails."""


class ProviderUnavailableError(VerificationProviderError):
    """Provider is not configured or unreachable — callers may fall back
    to the manual-review path."""


class ProviderOutcome(StrEnum):
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    RETRY_REQUIRED = "retry_required"
    MANUAL_REVIEW = "manual_review"
    REJECTED = "rejected"


@dataclass
class VerificationSession:
    """A provider verification session handed to the client SDK."""

    provider: str
    applicant_id: str
    access_token: str
    expires_at: datetime | None = None


@dataclass
class ProviderEvent:
    """Normalized webhook event. ``raw`` is retained for the audit payload
    but must never be logged with personal data."""

    provider: str
    applicant_id: str
    outcome: ProviderOutcome
    event_type: str
    reason: str | None = None
    legal_name: str | None = None
    document_type: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


class IdentityVerificationProvider(ABC):
    """Contract every verification provider adapter must implement."""

    name: str

    @abstractmethod
    def is_configured(self) -> bool:
        """True when all required credentials/settings are present."""

    @abstractmethod
    async def create_session(
        self, user_id: str, applicant_id: str | None = None
    ) -> VerificationSession:
        """Create (or resume) a provider session for client-side capture.

        ``applicant_id`` resumes an existing provider applicant so retries
        reuse the same verification attempt chain.
        """

    @abstractmethod
    def verify_webhook_signature(
        self, headers: dict[str, str], body: bytes
    ) -> bool:
        """Verify the webhook sender. Must fail closed when no signing
        secret is configured — an unverifiable result is never trusted."""

    @abstractmethod
    def parse_webhook(self, body: dict[str, Any]) -> ProviderEvent | None:
        """Normalize a provider webhook payload into a ProviderEvent, or
        None when the event type carries no verification decision."""

    @abstractmethod
    async def get_status(self, applicant_id: str) -> ProviderOutcome:
        """Pull the provider-side status for reconciliation."""
