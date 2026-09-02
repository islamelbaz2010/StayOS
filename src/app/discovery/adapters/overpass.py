"""Overpass API (OpenStreetMap) source adapter.

Queries the Overpass API for accommodation-related OSM tags within a bounding
box or area.  No authentication required.  Data is licensed under the Open
Database License (ODbL) — see https://www.openstreetmap.org/copyright.

This adapter discovers real accommodation POIs (hotels, apartments, guest
houses, hostels, chalets, motels, resorts) from OpenStreetMap contributor
data.  It is the first fully automated, credential-free source in the
StayOS discovery pipeline.

Rate limiting: the public Overpass instances request that clients limit
to 1 concurrent request and wait between calls.  We use a 5-second delay
between requests and rotate between known public endpoints.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.discovery.adapters.base import (
    DiscoverySearchConfig,
    RawCandidate,
    SourceAdapter,
)
from app.discovery.constants import SourceStatus

logger = logging.getLogger(__name__)

# Public Overpass endpoints (rotated for resilience)
_OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# OSM tourism tags that represent accommodation
_ACCOMMODATION_TAGS = [
    "hotel",
    "apartment",
    "guest_house",
    "hostel",
    "chalet",
    "motel",
    "resort",
]

# Map OSM tourism values to StayOS property types
_OSM_TO_PROPERTY_TYPE: dict[str, str] = {
    "hotel": "HOTEL_ROOM",
    "motel": "HOTEL_ROOM",
    "resort": "RESORT_UNIT",
    "apartment": "APARTMENT",
    "guest_house": "APARTMENT",
    "hostel": "APARTMENT",
    "chalet": "CHALET",
}

# Default timeout for a single Overpass request
_DEFAULT_TIMEOUT = 45
_DEFAULT_RATE_LIMIT = 5.0  # seconds between requests


# Bounding boxes for known Egyptian cities (south, west, north, east)
_CITY_BBOXES: dict[str, tuple[float, float, float, float]] = {
    "new cairo": (29.95, 31.40, 30.10, 31.60),
    "6th october": (29.90, 30.90, 30.08, 31.08),
    "6 october": (29.90, 30.90, 30.08, 31.08),
    "maadi": (29.94, 31.22, 30.00, 31.34),
    "zamalek": (30.05, 31.20, 30.08, 31.23),
    "nasr city": (30.04, 31.30, 30.09, 31.42),
    "heliopolis": (30.07, 31.30, 30.12, 31.38),
    "alexandria": (31.15, 29.85, 31.30, 30.05),
    "cairo": (29.95, 31.15, 30.15, 31.55),
    "giza": (29.85, 30.95, 30.10, 31.25),
}

# Default bbox for Egypt (approximate)
_EGYPT_BBOX = (22.0, 25.0, 32.0, 35.0)


def _build_overpass_query(bbox: tuple[float, float, float, float], max_results: int) -> str:
    """Build an Overpass QL query for accommodation POIs in a bounding box."""
    south, west, north, east = bbox
    tag_filter = "|".join(_ACCOMMODATION_TAGS)
    limit = min(max_results, 200)
    return (
        f'[out:json][timeout:25];\n'
        f'(\n'
        f'  nwr["tourism"~"^{tag_filter}$"]({south},{west},{north},{east});\n'
        f'  nwr["tourism"="short_stay"]({south},{west},{north},{east});\n'
        f');\n'
        f'out center tags {limit};'
    )


def _get_bbox(config: DiscoverySearchConfig) -> tuple[float, float, float, float]:
    """Determine the bounding box from search config."""
    if config.city:
        key = config.city.strip().lower()
        if key in _CITY_BBOXES:
            return _CITY_BBOXES[key]
    if config.zone:
        key = config.zone.strip().lower()
        if key in _CITY_BBOXES:
            return _CITY_BBOXES[key]
    if config.country and config.country.lower() == "egypt":
        return _EGYPT_BBOX
    return _EGYPT_BBOX


class OverpassAdapter(SourceAdapter):
    """Automated source adapter for OpenStreetMap via the Overpass API.

    No credentials required.  Data licensed under ODbL.
    Suitable for discovering accommodation POIs with coordinates, names,
    and partial metadata (phone, website, address).
    """

    source_name: str = "overpass_osm"
    source_status: SourceStatus = SourceStatus.ENABLED

    def __init__(
        self,
        endpoints: list[str] | None = None,
        rate_limit_seconds: float = _DEFAULT_RATE_LIMIT,
        source_name: str = "overpass_osm",
    ) -> None:
        self.source_name = source_name
        self._endpoints = endpoints or list(_OVERPASS_ENDPOINTS)
        self._rate_limit = rate_limit_seconds

    async def search(self, config: DiscoverySearchConfig) -> list[RawCandidate]:
        bbox = _get_bbox(config)
        query = _build_overpass_query(bbox, config.max_candidates)
        candidates: list[RawCandidate] = []

        for endpoint in self._endpoints:
            try:
                logger.info("Querying Overpass endpoint: %s", endpoint)
                async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
                    response = await client.post(
                        endpoint,
                        data={"data": query},
                        headers={
                            "User-Agent": "StayOS-Discovery-Bot/1.0 (supply-discovery)",
                        },
                    )

                    if response.status_code == 429:
                        logger.warning("Rate limited by %s, backing off", endpoint)
                        await asyncio.sleep(self._rate_limit * 4)
                        continue

                    if response.status_code == 406:
                        logger.warning("Endpoint %s returned 406, trying next", endpoint)
                        continue

                    response.raise_for_status()

                    data = response.json()
                    elements = data.get("elements", [])
                    logger.info(
                        "Overpass returned %d elements from %s", len(elements), endpoint
                    )

                    for element in elements:
                        candidate = self._map_element(element)
                        if candidate:
                            candidates.append(candidate)

                    # Success — no need to try other endpoints
                    break

            except httpx.TimeoutException:
                logger.warning("Timeout querying %s, trying next endpoint", endpoint)
                continue
            except httpx.HTTPError as exc:
                logger.warning("HTTP error from %s: %s, trying next endpoint", endpoint, exc)
                continue
            except Exception as exc:
                logger.error("Unexpected error from %s: %s", endpoint, exc)
                continue

            await asyncio.sleep(self._rate_limit)

        return candidates[:config.max_candidates]

    def _map_element(self, element: dict[str, Any]) -> RawCandidate | None:
        """Map an OSM element to a RawCandidate."""
        tags = element.get("tags", {})
        if not tags:
            return None

        tourism = tags.get("tourism")
        if not tourism or tourism not in _ACCOMMODATION_TAGS:
            return None

        elem_type = element.get("type", "node")
        elem_id = element.get("id")
        if elem_id is None:
            return None

        # Get coordinates — nodes have lat/lon directly, ways have center
        center = element.get("center", {})
        lat = center.get("lat") or element.get("lat")
        lon = center.get("lon") or element.get("lon")
        if lat is None or lon is None:
            return None

        external_id = f"osm_{elem_type}_{elem_id}"
        source_url = f"https://www.openstreetmap.org/{elem_type}/{elem_id}"

        # Extract name
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ar")

        # Extract description
        description_parts = []
        for desc_key in ("description", "description:en", "description:ar", "note"):
            val = tags.get(desc_key)
            if val:
                description_parts.append(val)
        description = " | ".join(description_parts) if description_parts else None

        # Extract location info
        city = tags.get("addr:city") or tags.get("addr:suburb")
        street = tags.get("addr:street")
        housenumber = tags.get("addr:housenumber")
        location_parts = []
        if housenumber and street:
            location_parts.append(f"{housenumber} {street}")
        elif street:
            location_parts.append(street)
        if city:
            location_parts.append(city)
        raw_location = ", ".join(location_parts) if location_parts else None

        # Extract contact info (only legitimately public tags)
        raw_contact: dict[str, Any] = {}
        if tags.get("phone"):
            raw_contact["phone"] = tags["phone"]
        if tags.get("contact:phone"):
            raw_contact["phone"] = tags["contact:phone"]
        if tags.get("contact:whatsapp"):
            raw_contact["whatsapp"] = tags["contact:whatsapp"]
        if tags.get("email"):
            raw_contact["email"] = tags["email"]
        if tags.get("contact:email"):
            raw_contact["email"] = tags["contact:email"]
        if tags.get("website"):
            raw_contact["contact_url"] = tags["website"]

        # Extract images (only if explicitly tagged, not third-party)
        raw_images: list[str] = []
        for img_key in ("image", "image:0", "image:1", "image:2"):
            val = tags.get(img_key)
            if val and val.startswith("http"):
                raw_images.append(val)

        # Extract amenities
        raw_amenities: list[str] = []
        amenity_keys = [
            "wifi", "internet_access", "air_conditioning",
            "swimming_pool", "parking", "pool", "gym",
        ]
        for key in amenity_keys:
            val = tags.get(key)
            if val and val.lower() not in ("no", "false", "0"):
                raw_amenities.append(key.replace("_", " "))

        # Extract price if available (rare in OSM)
        raw_price = tags.get("price") or tags.get("fee")
        raw_currency = tags.get("currency") or "EGP"

        # Build raw payload preserving all tags
        return RawCandidate(
            source=self.source_name,
            source_url=source_url,
            external_listing_id=external_id,
            raw_title=name,
            raw_description=description,
            raw_price=str(raw_price) if raw_price else None,
            raw_currency=raw_currency if raw_price else None,
            raw_location=raw_location or city,
            raw_images=raw_images,
            raw_amenities=raw_amenities,
            raw_contact=raw_contact,
            raw_payload={
                "osm_type": elem_type,
                "osm_id": elem_id,
                "tourism": tourism,
                "lat": lat,
                "lon": lon,
                "tags": tags,
            },
        )
