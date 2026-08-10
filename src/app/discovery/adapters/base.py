"""Source adapter abstraction for the supply discovery engine.

Each adapter wraps a single external source (e.g. a public listing website).
Adapters are independently enabled/disabled and must tolerate missing data.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from app.discovery.constants import SourceStatus

logger = logging.getLogger(__name__)


@dataclass
class RawCandidate:
    """Raw data extracted from a source before normalization."""

    source: str
    source_url: str
    external_listing_id: str | None = None
    raw_title: str | None = None
    raw_description: str | None = None
    raw_price: str | None = None
    raw_currency: str | None = None
    raw_location: str | None = None
    raw_images: list[str] = field(default_factory=list)
    raw_amenities: list[str] = field(default_factory=list)
    raw_contact: dict[str, Any] = field(default_factory=dict)
    raw_payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class DiscoverySearchConfig:
    """Search parameters passed to an adapter's search() method."""

    country: str = "Egypt"
    city: str | None = None
    zone: str | None = None
    property_type: str | None = None
    min_price: int | None = None
    max_price: int | None = None
    min_bedrooms: int | None = None
    min_guest_capacity: int | None = None
    keywords: list[str] = field(default_factory=list)
    max_candidates: int = 50


class SourceAdapter(ABC):
    """Base class for all source adapters."""

    source_name: str = "base"
    source_status: SourceStatus = SourceStatus.ENABLED

    @abstractmethod
    async def search(self, config: DiscoverySearchConfig) -> list[RawCandidate]:
        """Search the source and return raw candidates."""
        ...

    def get_source_url(self, candidate: RawCandidate) -> str:
        return candidate.source_url

    def get_external_id(self, candidate: RawCandidate) -> str | None:
        return candidate.external_listing_id

    def extract_contact_data(self, candidate: RawCandidate) -> dict[str, Any]:
        return candidate.raw_contact

    def is_available(self) -> bool:
        return self.source_status in (SourceStatus.ENABLED, SourceStatus.MANUAL_SOURCE)


class SourceRegistry:
    """Registry of available source adapters."""

    def __init__(self) -> None:
        self._adapters: dict[str, SourceAdapter] = {}

    def register(self, adapter: SourceAdapter) -> None:
        self._adapters[adapter.source_name] = adapter
        logger.info("Registered source adapter: %s (status=%s)", adapter.source_name, adapter.source_status)

    def get(self, source_name: str) -> SourceAdapter | None:
        return self._adapters.get(source_name)

    def get_available(self) -> list[SourceAdapter]:
        return [a for a in self._adapters.values() if a.is_available()]

    def list_sources(self) -> list[dict[str, str]]:
        return [
            {
                "source": a.source_name,
                "status": a.source_status.value,
            }
            for a in self._adapters.values()
        ]


# Global registry instance
registry = SourceRegistry()
