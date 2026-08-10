"""Qualification and scoring engine for discovery candidates.

Scores candidates 0-100 against configurable criteria.
Classifies into HIGH_PRIORITY, REVIEW, LOW_PRIORITY, or REJECT.
"""

from __future__ import annotations

from typing import Any

from app.discovery.constants import (
    DEFAULT_WEIGHTS,
    HIGH_PRIORITY_MIN,
    LOW_PRIORITY_MIN,
    REVIEW_MIN,
)

# Weights for PLACE candidates (e.g. OSM POIs) — price/bedrooms not expected
PLACE_WEIGHTS = {
    "geography": 25,
    "property_type": 20,
    "price": 0,       # PLACE sources rarely have price
    "completeness": 20,
    "contact": 20,    # Contact is the key differentiator for PLACE → SUPPLY_LEAD
    "source_quality": 15,
}


def _score_geography(normalized: dict[str, Any], config: dict[str, Any] | None) -> float:
    """Score based on geographic match."""
    if not config:
        return 50.0

    city = normalized.get("city")
    config_city = config.get("city")
    config_zone = config.get("zone")

    if config_city and city:
        if city.lower() == config_city.lower():
            if config_zone and normalized.get("zone"):
                if normalized["zone"].lower() == config_zone.lower():
                    return 100.0
                return 70.0
            return 100.0
        return 20.0

    if normalized.get("country") and config.get("country"):
        if normalized["country"].lower() == config["country"].lower():
            return 50.0

    return 30.0


def _score_property_type(normalized: dict[str, Any], config: dict[str, Any] | None) -> float:
    """Score based on property type match."""
    ptype = normalized.get("property_type")
    if not ptype:
        return 0.0

    if config and config.get("property_type"):
        if ptype.upper() == config["property_type"].upper():
            return 100.0
        return 20.0

    valid_types = {"APARTMENT", "VILLA", "CHALET", "HOTEL_ROOM", "RESORT_UNIT", "STUDIO"}
    return 100.0 if ptype.upper() in valid_types else 30.0


def _score_price(normalized: dict[str, Any], config: dict[str, Any] | None) -> float:
    """Score based on price range."""
    price = normalized.get("nightly_price")
    if price is None or price <= 0:
        return 0.0

    if config:
        min_price = config.get("min_price")
        max_price = config.get("max_price")
        if min_price and price < min_price:
            return 20.0
        if max_price and price > max_price:
            return 20.0
        if min_price and max_price and min_price <= price <= max_price:
            return 100.0

    # Reasonable price range for Egyptian short-term rentals
    if 100 <= price <= 50000:
        return 80.0
    if price < 100:
        return 20.0
    return 40.0


def _score_completeness(completeness_score: float) -> float:
    """Score based on data completeness."""
    return completeness_score


def _score_contact(contact_status: str, contact_confidence: float) -> float:
    """Score based on contact availability."""
    if contact_status == "AVAILABLE":
        return 50.0 + (contact_confidence * 50.0)
    if contact_status == "NOT_AVAILABLE":
        return 10.0
    return 30.0


def _score_source_quality(source_confidence: float) -> float:
    """Score based on source quality."""
    return source_confidence * 100.0


def classify_candidate_type(
    contact_status: str,
    normalized: dict[str, Any],
    source: str,
) -> str:
    """Classify a candidate as PLACE or SUPPLY_LEAD.
    
    SUPPLY_LEAD = has contact info (phone, whatsapp, email, or website)
    or has a rental signal (price, or rental-specific source).
    PLACE = building/business exists but no actionable contact or rental signal.
    """
    from app.discovery.constants import CandidateType
    
    if contact_status == "AVAILABLE":
        return CandidateType.SUPPLY_LEAD
    
    # If source provides rental signals (price, availability), it's a supply lead
    if normalized.get("nightly_price") is not None:
        return CandidateType.SUPPLY_LEAD
    
    return CandidateType.PLACE


def compute_qualification_score(
    normalized: dict[str, Any],
    completeness_score: float,
    contact_status: str,
    contact_confidence: float,
    source_confidence: float,
    config: dict[str, Any] | None = None,
    weights: dict[str, float] | None = None,
    candidate_type: str | None = None,
) -> float:
    """Compute overall qualification score (0-100).
    
    For PLACE candidates, uses PLACE_WEIGHTS which zero out price
    (not expected from place-discovery sources like OSM).
    """
    if weights is None and candidate_type == "PLACE":
        weights = PLACE_WEIGHTS
    w = weights or DEFAULT_WEIGHTS

    scores = {
        "geography": _score_geography(normalized, config),
        "property_type": _score_property_type(normalized, config),
        "price": _score_price(normalized, config),
        "completeness": _score_completeness(completeness_score),
        "contact": _score_contact(contact_status, contact_confidence),
        "source_quality": _score_source_quality(source_confidence),
    }

    total_weight = sum(w.values())
    if total_weight == 0:
        return 0.0

    weighted_sum = sum(scores[k] * w.get(k, 0) for k in scores)
    return round(weighted_sum / total_weight, 1)


def classify_qualification(score: float) -> str:
    """Classify a qualification score into a priority band."""
    if score >= HIGH_PRIORITY_MIN:
        return "HIGH_PRIORITY"
    if score >= REVIEW_MIN:
        return "REVIEW"
    if score >= LOW_PRIORITY_MIN:
        return "LOW_PRIORITY"
    return "REJECT"


def extract_contact(raw_contact: dict[str, Any]) -> tuple[str, str | None, str | None, float]:
    """Extract contact info from raw_contact dict.

    Returns (contact_status, contact_type, contact_value, contact_confidence).
    """
    if not raw_contact:
        return "NOT_AVAILABLE", None, None, 0.0

    for field_name, contact_type in [
        ("phone", "phone"),
        ("whatsapp", "whatsapp"),
        ("email", "email"),
        ("contact_url", "contact_url"),
        ("messaging_url", "messaging_url"),
    ]:
        value = raw_contact.get(field_name)
        if value and str(value).strip():
            confidence = 1.0 if field_name in ("phone", "whatsapp", "email") else 0.7
            return "AVAILABLE", contact_type, str(value).strip(), confidence

    return "NOT_AVAILABLE", None, None, 0.0


def compute_source_confidence(source: str) -> float:
    """Base confidence score per source type."""
    confidence_map = {
        "airbnb": 0.9,
        "google_places": 0.8,
        "json_api": 0.8,
        "overpass_osm": 0.7,
        "olx": 0.6,
        "dubizzle": 0.6,
        "facebook": 0.4,
        "manual": 0.5,
    }
    return confidence_map.get(source, 0.5)
