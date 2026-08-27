"""Normalization service — converts RawCandidate data to normalized fields."""

from __future__ import annotations

import re
from typing import Any

from app.discovery.adapters.base import RawCandidate

# Map common property type strings to StayOS valid types
PROPERTY_TYPE_MAP: dict[str, str] = {
    "apartment": "APARTMENT",
    "flat": "APARTMENT",
    "شقة": "APARTMENT",
    "villa": "VILLA",
    "house": "VILLA",
    "فيلا": "VILLA",
    "chalet": "CHALET",
    "شاليه": "CHALET",
    "studio": "STUDIO",
    "استوديو": "STUDIO",
    "hotel": "HOTEL_ROOM",
    "hotel room": "HOTEL_ROOM",
    "resort": "RESORT_UNIT",
    "resort unit": "RESORT_UNIT",
}

# Egyptian governorate/city normalization
CITY_NORMALIZATION: dict[str, str] = {
    "new cairo": "New Cairo",
    "التجمع": "New Cairo",
    "التجمع الخامس": "New Cairo",
    "5th settlement": "New Cairo",
    "maadi": "Maadi",
    "المعادي": "Maadi",
    "zamalek": "Zamalek",
    "الزمالك": "Zamalek",
    "6th october": "6th October",
    "6 october": "6th October",
    "أكتوبر": "6th October",
    "nasr city": "Nasr City",
    "مدينة نصر": "Nasr City",
    "heliopolis": "Heliopolis",
    "مصر الجديدة": "Heliopolis",
    "alexandria": "Alexandria",
    "الإسكندرية": "Alexandria",
}

GOVERNORATE_MAP: dict[str, str] = {
    "new cairo": "Cairo",
    "maadi": "Cairo",
    "zamalek": "Cairo",
    "nasr city": "Cairo",
    "heliopolis": "Cairo",
    "6th october": "Giza",
    "alexandria": "Alexandria",
}

# Map OSM tourism tag values to StayOS property types
_OSM_TOURISM_TO_PROPERTY_TYPE: dict[str, str] = {
    "hotel": "HOTEL_ROOM",
    "motel": "HOTEL_ROOM",
    "resort": "RESORT_UNIT",
    "apartment": "APARTMENT",
    "guest_house": "APARTMENT",
    "hostel": "APARTMENT",
    "chalet": "CHALET",
}


def normalize_property_type(raw: str | None) -> str | None:
    if not raw:
        return None
    key = raw.strip().lower()
    return PROPERTY_TYPE_MAP.get(key, key.upper() if key else None)


def normalize_city(raw: str | None) -> str | None:
    if not raw:
        return None
    key = raw.strip().lower()
    return CITY_NORMALIZATION.get(key, raw.strip())


def infer_governorate(city: str | None) -> str | None:
    if not city:
        return None
    key = city.strip().lower()
    return GOVERNORATE_MAP.get(key)


def parse_price(raw_price: str | None, raw_currency: str | None) -> tuple[int | None, str | None]:
    """Extract numeric price and currency from raw price string."""
    if not raw_price:
        return None, None
    digits = re.sub(r"[^\d]", "", str(raw_price))
    if not digits:
        return None, None
    price = int(digits)
    currency = (raw_currency or "EGP").strip().upper()
    return price, currency


def parse_coordinates(raw_location: str | None, raw_payload: dict[str, Any]) -> tuple[float | None, float | None]:
    """Try to extract lat/lng from raw payload or location string."""
    for lat_key in ("latitude", "lat", "geo_lat"):
        for lng_key in ("longitude", "lng", "lon", "geo_lng"):
            lat = raw_payload.get(lat_key)
            lng = raw_payload.get(lng_key)
            if lat is not None and lng is not None:
                try:
                    return float(lat), float(lng)
                except (ValueError, TypeError):
                    pass

    if raw_location:
        coord_match = re.search(r"(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)", raw_location)
        if coord_match:
            lat, lng = float(coord_match.group(1)), float(coord_match.group(2))
            if 0 < lat < 35 and 25 < lng < 35:
                return lat, lng

    return None, None


def parse_bedrooms(raw_payload: dict[str, Any], raw_title: str | None, raw_description: str | None) -> int | None:
    for key in ("bedrooms", "beds_count", "num_bedrooms"):
        val = raw_payload.get(key)
        if val is not None:
            try:
                return int(val)
            except (ValueError, TypeError):
                pass
    text = f"{raw_title or ''} {raw_description or ''}"
    match = re.search(r"(\d+)\s*(?:bedroom|bed room|غرفة نوم|غرف نوم)", text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def parse_bathrooms(raw_payload: dict[str, Any], raw_description: str | None) -> int | None:
    for key in ("bathrooms", "baths", "num_bathrooms"):
        val = raw_payload.get(key)
        if val is not None:
            try:
                return int(val)
            except (ValueError, TypeError):
                pass
    match = re.search(r"(\d+)\s*(?:bathroom|bath|حمام)", raw_description or "", re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def parse_guest_capacity(raw_payload: dict[str, Any], raw_description: str | None) -> int | None:
    for key in ("guests", "max_guests", "guest_capacity", "capacity"):
        val = raw_payload.get(key)
        if val is not None:
            try:
                return int(val)
            except (ValueError, TypeError):
                pass
    match = re.search(r"(\d+)\s*(?:guest|person|ضيف|أفراد)", raw_description or "", re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def normalize_candidate(raw: RawCandidate) -> dict[str, Any]:
    """Normalize a RawCandidate into a dict matching DiscoveryCandidate normalized fields."""
    title = raw.raw_title
    description = raw.raw_description

    # Extract tags from OSM-style payloads
    tags = raw.raw_payload.get("tags", {}) if isinstance(raw.raw_payload.get("tags"), dict) else {}

    # City: try tags first, then raw_location, then payload
    city_raw = tags.get("addr:city") or tags.get("addr:suburb") or tags.get("addr:town")
    if not city_raw:
        city_raw = raw.raw_payload.get("city")
    if not city_raw:
        city_raw = raw.raw_location
    city = normalize_city(city_raw) if city_raw else None

    # Property type: check OSM tourism tag, then payload fields
    tourism = tags.get("tourism") or raw.raw_payload.get("tourism")
    if tourism:
        property_type = _OSM_TOURISM_TO_PROPERTY_TYPE.get(tourism)
        if not property_type:
            property_type = normalize_property_type(tourism)
    else:
        property_type = normalize_property_type(
            raw.raw_payload.get("property_type") or raw.raw_payload.get("type")
        )

    price, currency = parse_price(raw.raw_price, raw.raw_currency)
    lat, lng = parse_coordinates(raw.raw_location, raw.raw_payload)
    bedrooms = parse_bedrooms(raw.raw_payload, raw.raw_title, raw.raw_description)
    bathrooms = parse_bathrooms(raw.raw_payload, raw.raw_description)
    guest_capacity = parse_guest_capacity(raw.raw_payload, raw.raw_description)

    # Zone: try tags, then payload
    zone = tags.get("addr:suburb") or tags.get("addr:neighbourhood") or raw.raw_payload.get("zone") or raw.raw_payload.get("district")

    return {
        "title": title,
        "description": description,
        "country": "Egypt",
        "city": city,
        "zone": zone,
        "latitude": lat,
        "longitude": lng,
        "property_type": property_type,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "guest_capacity": guest_capacity,
        "nightly_price": price,
        "currency": currency,
        "image_urls": raw.raw_images,
        "amenities": raw.raw_amenities,
    }


def compute_completeness(normalized: dict[str, Any]) -> float:
    """Score 0-100 based on how many key fields are present."""
    key_fields = [
        "title", "description", "city", "latitude", "longitude",
        "property_type", "nightly_price", "bedrooms", "bathrooms",
        "guest_capacity", "image_urls",
    ]
    present = sum(1 for f in key_fields if normalized.get(f) is not None and normalized[f] != [])
    return round((present / len(key_fields)) * 100, 1)
