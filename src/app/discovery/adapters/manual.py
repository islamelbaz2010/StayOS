"""Manual source adapter for sources that cannot be safely automated.

This adapter always returns an empty list and is marked MANUAL_SOURCE.
It exists so that the discovery pipeline can acknowledge a source
without attempting to automate it. The Founder manually adds candidates
from these sources via the admin UI.
"""

import logging

from app.discovery.adapters.base import DiscoverySearchConfig, RawCandidate, SourceAdapter
from app.discovery.constants import SourceStatus

logger = logging.getLogger(__name__)


class ManualSourceAdapter(SourceAdapter):
    """Adapter for sources that require manual data entry."""

    source_name: str = "manual"
    source_status: SourceStatus = SourceStatus.MANUAL_SOURCE

    def __init__(self, source_name: str = "manual") -> None:
        self.source_name = source_name

    async def search(self, config: DiscoverySearchConfig) -> list[RawCandidate]:
        logger.info("Manual source '%s' — no automated search", self.source_name)
        return []
