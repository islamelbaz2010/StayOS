"""Verification provider registry — resolves the configured provider.

The KYC domain asks for ``get_verification_provider()``; the registry
returns the configured adapter or ``None`` when credentials are absent so
the service can fall back to the manual-review path."""

from .base import (
    IdentityVerificationProvider,
    ProviderEvent,
    ProviderOutcome,
    ProviderUnavailableError,
    VerificationProviderError,
    VerificationSession,
)
from .sumsub import SumsubProvider

__all__ = [
    "IdentityVerificationProvider",
    "ProviderEvent",
    "ProviderOutcome",
    "ProviderUnavailableError",
    "VerificationProviderError",
    "VerificationSession",
    "get_verification_provider",
]

_PROVIDERS: dict[str, type[IdentityVerificationProvider]] = {
    SumsubProvider.name: SumsubProvider,
}


def get_verification_provider() -> IdentityVerificationProvider | None:
    """Return the configured provider, or None when unavailable."""
    provider = SumsubProvider()
    return provider if provider.is_configured() else None
