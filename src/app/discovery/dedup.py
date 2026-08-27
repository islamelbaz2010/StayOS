"""Deduplication logic for discovery candidates.

Uses multiple signals to detect duplicates without destructive merging.
Returns duplicate status and confidence — never deletes candidates.
"""

from __future__ import annotations

import logging
from difflib import SequenceMatcher
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.discovery.constants import DuplicateStatus
from app.discovery.models import DiscoveryCandidate

logger = logging.getLogger(__name__)

# Confidence thresholds
CONFIRMED_THRESHOLD = 0.85
POSSIBLE_THRESHOLD = 0.60


def title_similarity(a: str | None, b: str | None) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def price_similarity(a: int | None, b: int | None) -> float:
    if a is None or b is None:
        return 0.0
    if a == 0 and b == 0:
        return 1.0
    if a == 0 or b == 0:
        return 0.0
    diff = abs(a - b) / max(a, b)
    return max(0.0, 1.0 - diff)


def coordinate_similarity(
    lat_a: float | None, lng_a: float | None,
    lat_b: float | None, lng_b: float | None,
) -> float:
    if None in (lat_a, lng_a, lat_b, lng_b):
        return 0.0
    assert lat_a is not None and lng_a is not None and lat_b is not None and lng_b is not None
    # Rough distance in km using equirectangular approximation
    import math
    x = (lng_b - lng_a) * math.cos(math.radians((lat_a + lat_b) / 2)) * 111
    y = (lat_b - lat_a) * 111
    dist_km = math.sqrt(x * x + y * y)
    if dist_km < 0.1:
        return 1.0
    if dist_km < 0.5:
        return 0.9
    if dist_km < 1.0:
        return 0.7
    if dist_km < 2.0:
        return 0.4
    return 0.0


def compute_duplicate_confidence(
    candidate: dict[str, Any],
    existing: dict[str, Any],
) -> float:
    """Compute duplicate confidence between two candidates (0.0 to 1.0)."""
    signals: list[float] = []
    weights: list[float] = []

    # Source URL match (strongest signal)
    if candidate.get("source_url") and existing.get("source_url"):
        if candidate["source_url"] == existing["source_url"]:
            signals.append(1.0)
            weights.append(3.0)

    # External listing ID match
    if candidate.get("external_listing_id") and existing.get("external_listing_id"):
        if candidate["external_listing_id"] == existing["external_listing_id"]:
            signals.append(1.0)
            weights.append(3.0)

    # Title similarity
    title_sim = title_similarity(candidate.get("title"), existing.get("title"))
    signals.append(title_sim)
    weights.append(2.0)

    # City match
    if candidate.get("city") and existing.get("city"):
        if candidate["city"].lower() == existing["city"].lower():
            signals.append(1.0)
            weights.append(1.0)
        else:
            signals.append(0.0)
            weights.append(1.0)

    # Price similarity
    price_sim = price_similarity(
        candidate.get("nightly_price"),
        existing.get("nightly_price"),
    )
    if candidate.get("nightly_price") is not None and existing.get("nightly_price") is not None:
        signals.append(price_sim)
        weights.append(1.5)

    # Coordinate similarity
    coord_sim = coordinate_similarity(
        candidate.get("latitude"), candidate.get("longitude"),
        existing.get("latitude"), existing.get("longitude"),
    )
    if None not in (candidate.get("latitude"), candidate.get("longitude"),
                     existing.get("latitude"), existing.get("longitude")):
        signals.append(coord_sim)
        weights.append(2.0)

    # Bedrooms match
    if candidate.get("bedrooms") is not None and existing.get("bedrooms") is not None:
        if candidate["bedrooms"] == existing["bedrooms"]:
            signals.append(1.0)
            weights.append(0.5)
        else:
            signals.append(0.0)
            weights.append(0.5)

    if not signals:
        return 0.0

    total_weight = sum(weights)
    weighted_sum = sum(s * w for s, w in zip(signals, weights, strict=True))
    return round(weighted_sum / total_weight, 3)


def classify_duplicate(confidence: float) -> DuplicateStatus:
    if confidence >= CONFIRMED_THRESHOLD:
        return DuplicateStatus.CONFIRMED_DUPLICATE
    if confidence >= POSSIBLE_THRESHOLD:
        return DuplicateStatus.POSSIBLE_DUPLICATE
    return DuplicateStatus.UNIQUE


async def check_duplicate(
    session: AsyncSession,
    candidate_data: dict[str, Any],
    source: str,
    source_url: str,
    external_listing_id: str | None = None,
) -> tuple[DuplicateStatus, float, str | None]:
    """Check if a candidate is a duplicate of existing candidates.

    Returns (duplicate_status, confidence, duplicate_of_id).
    """
    # First: exact source_url or external_listing_id match
    stmt = select(DiscoveryCandidate).where(
        DiscoveryCandidate.source == source,
        DiscoveryCandidate.source_url == source_url,
    )
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        return DuplicateStatus.CONFIRMED_DUPLICATE, 1.0, existing.id

    if external_listing_id:
        stmt = select(DiscoveryCandidate).where(
            DiscoveryCandidate.source == source,
            DiscoveryCandidate.external_listing_id == external_listing_id,
        )
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return DuplicateStatus.CONFIRMED_DUPLICATE, 1.0, existing.id

    # Second: fuzzy match against candidates in the same city
    city = candidate_data.get("city")
    if city:
        stmt = select(DiscoveryCandidate).where(
            DiscoveryCandidate.city == city,
            DiscoveryCandidate.status != "REJECTED",
        )
        result = await session.execute(stmt)
        candidates = result.scalars().all()

        best_confidence = 0.0
        best_id: str | None = None

        for existing in candidates:
            existing_data = {
                "title": existing.title,
                "city": existing.city,
                "nightly_price": existing.nightly_price,
                "latitude": existing.latitude,
                "longitude": existing.longitude,
                "bedrooms": existing.bedrooms,
                "source_url": existing.source_url,
                "external_listing_id": existing.external_listing_id,
            }
            confidence = compute_duplicate_confidence(candidate_data, existing_data)
            if confidence > best_confidence:
                best_confidence = confidence
                best_id = existing.id

        if best_confidence >= POSSIBLE_THRESHOLD:
            return classify_duplicate(best_confidence), best_confidence, best_id

    return DuplicateStatus.UNIQUE, 0.0, None
