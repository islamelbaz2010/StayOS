"""Google Places API source adapter.

Uses the Google Places API (New) Nearby Search to discover lodging
establishments.  Requires a Google Maps Platform API key with the
Places API enabled.

This adapter implements the full SourceAdapter interface but is marked
REQUIRES_EXTERNAL_CREDENTIALS until a valid API key is provided.
When no key is configured, search() returns an empty list and logs a
warning.

Google Places API pricing (2025):
  - Free tier: 5,000 Nearby Search (Pro) calls/month
  - $200 monthly credit applies automatically
  - Lodging types: hotel, motel, resort_hotel, guest_house, hostel,
    bed_and_breakfast, extended_stay_hotel, farmstay, etc.

Data is subject to Google Maps Platform Terms of Service.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings
from app.discovery.adapters.base import (
    DiscoverySearchConfig,
    RawCandidate,
    SourceAdapter,
)
from app.discovery.constants import SourceStatus

logger = logging.getLogger(__name__)

_PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"

# Google Places lodging types (from Table A)
_LODGING_TYPES = [
    "lodging",
    "hotel",
    "motels",
    "resort_hotel",
    "guest_house",
    "hostel",
    "bed_and_breakfast",
    "extended_stay_hotel",
    "farmstay",
    "campground",
    "camping_cabin",
    "cottage",
    "inn",
    "japanese_inn",
    "private_guest_room",
    "rv_park",
    "mobile_home_park",
]

# City center coordinates for geolocation
_CITY_CENTERS: dict[str, tuple[float, float]] = {
    "new cairo": (30.03, 31.50),
    "6th october": (29.96, 31.00),
    "6 october": (29.96, 31.00),
    "maadi": (29.96, 31.26),
    "zamalek": (30.06, 31.22),
    "nasr city": (30.06, 31.36),
    "heliopolis": (30.09, 31.34),
    "alexandria": (31.20, 29.92),
    "cairo": (30.04, 31.24),
    "giza": (30.01, 31.13),
}

# Default search radius in meters
_DEFAULT_RADIUS = 10000


class GooglePlacesAdapter(SourceAdapter):
    """Google Places API adapter for accommodation discovery.

    Requires GOOGLE_MAPS_API_KEY in environment.
    Marked REQUIRES_EXTERNAL_CREDENTIALS when no key is present.
    """

    source_name: str = "google_places"
    source_status: SourceStatus = SourceStatus.REQUIRES_CREDENTIALS

    def __init__(self, api_key: str | None = None) -> None:
        self._api_key = api_key or getattr(settings, "GOOGLE_MAPS_API_KEY", None)
        if self._api_key:
            self.source_status = SourceStatus.ENABLED
        else:
            self.source_status = SourceStatus.REQUIRES_CREDENTIALS

    def is_available(self) -> bool:
        return self._api_key is not None and self.source_status == SourceStatus.ENABLED

    async def search(self, config: DiscoverySearchConfig) -> list[RawCandidate]:
        if not self._api_key:
            logger.warning(
                "GooglePlacesAdapter: no API key configured — "
                "BLOCKED: EXTERNAL CREDENTIAL REQUIRED (GOOGLE_MAPS_API_KEY)"
            )
            return []

        lat, lng = self._get_center(config)
        radius = _DEFAULT_RADIUS

        # Use Essentials + Pro fields to minimize cost
        field_mask = (
            "places.displayName,"
            "places.formattedAddress,"
            "places.location,"
            "places.primaryType,"
            "places.types,"
            "places.websiteUri,"
            "places.internationalPhoneNumber,"
            "places.rating,"
            "places.userRatingCount,"
            "places.id"
        )

        candidates: list[RawCandidate] = []

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    _PLACES_NEARBY_URL,
                    headers={
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": self._api_key,
                        "X-Goog-FieldMask": field_mask,
                    },
                    json={
                        "includedTypes": ["lodging"],
                        "maxResultCount": min(config.max_candidates, 20),
                        "locationRestriction": {
                            "circle": {
                                "center": {"latitude": lat, "longitude": lng},
                                "radius": radius,
                            }
                        },
                        "languageCode": "en",
                    },
                )

                if response.status_code == 429:
                    logger.warning("Google Places API rate limited")
                    return []

                response.raise_for_status()
                data = response.json()
                places = data.get("places", [])

                for place in places:
                    candidate = self._map_place(place)
                    if candidate:
                        candidates.append(candidate)

        except httpx.HTTPError as exc:
            logger.error("Google Places API error: %s", exc)
        except Exception as exc:
            logger.error("Unexpected Google Places error: %s", exc)

        return candidates[:config.max_candidates]

    def _get_center(self, config: DiscoverySearchConfig) -> tuple[float, float]:
        if config.city:
            key = config.city.strip().lower()
            if key in _CITY_CENTERS:
                return _CITY_CENTERS[key]
        if config.zone:
            key = config.zone.strip().lower()
            if key in _CITY_CENTERS:
                return _CITY_CENTERS[key]
        # Default to Cairo center
        return (30.04, 31.24)

    def _map_place(self, place: dict[str, Any]) -> RawCandidate | None:
        place_id = place.get("id")
        if not place_id:
            return None

        display_name = place.get("displayName", {})
        name = display_name.get("text") if isinstance(display_name, dict) else None

        location = place.get("location", {})
        lat = location.get("latitude")
        lng = location.get("longitude")
        if lat is None or lng is None:
            return None

        formatted_address = place.get("formattedAddress")
        primary_type = place.get("primaryType", "")

        # Extract contact
        raw_contact: dict[str, Any] = {}
        if place.get("internationalPhoneNumber"):
            raw_contact["phone"] = place["internationalPhoneNumber"]
        if place.get("websiteUri"):
            raw_contact["contact_url"] = place["websiteUri"]

        # Map Google types to StayOS property types
        property_type_map = {
            "hotel": "HOTEL_ROOM",
            "motels": "HOTEL_ROOM",
            "resort_hotel": "RESORT_UNIT",
            "guest_house": "APARTMENT",
            "hostel": "APARTMENT",
            "bed_and_breakfast": "APARTMENT",
            "extended_stay_hotel": "HOTEL_ROOM",
            "farmstay": "VILLA",
            "cottage": "CHALET",
            "inn": "APARTMENT",
            "private_guest_room": "APARTMENT",
        }
        mapped_type = property_type_map.get(primary_type, "APARTMENT")

        source_url = f"https://www.google.com/maps/place/?q=place_id:{place_id}"

        return RawCandidate(
            source=self.source_name,
            source_url=source_url,
            external_listing_id=f"gplaces_{place_id}",
            raw_title=name,
            raw_description=formatted_address,
            raw_price=None,
            raw_currency=None,
            raw_location=formatted_address,
            raw_images=[],
            raw_amenities=[],
            raw_contact=raw_contact,
            raw_payload={
                "place_id": place_id,
                "primary_type": primary_type,
                "types": place.get("types", []),
                "rating": place.get("rating"),
                "user_rating_count": place.get("userRatingCount"),
                "mapped_property_type": mapped_type,
                "lat": lat,
                "lng": lng,
            },
        )
