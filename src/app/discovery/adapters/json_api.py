"""Generic JSON API source adapter.

This adapter queries any public HTTP endpoint that returns JSON with
accommodation listing data. It is designed to work with sources that expose
structured APIs (e.g. property management sites with public search endpoints).

The adapter is configured via the DiscoverySearchConfig and a per-source
configuration dict that specifies:
  - url: the base search URL
  - listing_url_template: template for individual listing URLs (with {id})
  - field_mapping: maps source JSON fields to RawCandidate fields
  - rate_limit_seconds: delay between requests

If a source does not expose a JSON API, a different adapter type (e.g. HTML
adapter) should be used instead.
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

DEFAULT_TIMEOUT = 30
DEFAULT_RATE_LIMIT = 2.0  # seconds between requests


class JsonApiAdapter(SourceAdapter):
    """Adapter for sources that expose a JSON search API."""

    source_name: str = "json_api"
    source_status: SourceStatus = SourceStatus.ENABLED

    def __init__(
        self,
        base_url: str,
        listing_url_template: str = "",
        field_mapping: dict[str, str] | None = None,
        rate_limit_seconds: float = DEFAULT_RATE_LIMIT,
        source_name: str = "json_api",
        headers: dict[str, str] | None = None,
    ) -> None:
        self.source_name = source_name
        self._base_url = base_url
        self._listing_url_template = listing_url_template
        self._field_mapping = field_mapping or _DEFAULT_MAPPING
        self._rate_limit = rate_limit_seconds
        self._headers = {
            "User-Agent": "StayOS-Discovery-Bot/1.0",
            "Accept": "application/json",
            **(headers or {}),
        }

    async def search(self, config: DiscoverySearchConfig) -> list[RawCandidate]:
        params = self._build_params(config)
        candidates: list[RawCandidate] = []

        try:
            async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
                page = 1
                while len(candidates) < config.max_candidates:
                    params["page"] = page
                    response = await client.get(self._base_url, params=params, headers=self._headers)

                    if response.status_code == 429:
                        logger.warning("Rate limited by %s, backing off", self.source_name)
                        await asyncio.sleep(self._rate_limit * 5)
                        continue

                    response.raise_for_status()
                    data = response.json()

                    items = self._extract_items(data)
                    if not items:
                        break

                    for item in items:
                        candidate = self._map_to_candidate(item)
                        if candidate:
                            candidates.append(candidate)

                    if not self._has_more_pages(data, page):
                        break

                    page += 1
                    await asyncio.sleep(self._rate_limit)

        except httpx.HTTPError as exc:
            logger.error("HTTP error fetching from %s: %s", self.source_name, exc)
        except Exception as exc:
            logger.error("Unexpected error fetching from %s: %s", self.source_name, exc)

        return candidates[:config.max_candidates]

    def _build_params(self, config: DiscoverySearchConfig) -> dict[str, Any]:
        params: dict[str, Any] = {}
        if config.city:
            params["city"] = config.city
        if config.zone:
            params["zone"] = config.zone
        if config.property_type:
            params["property_type"] = config.property_type
        if config.min_price:
            params["min_price"] = config.min_price
        if config.max_price:
            params["max_price"] = config.max_price
        if config.min_bedrooms:
            params["min_bedrooms"] = config.min_bedrooms
        if config.keywords:
            params["q"] = " ".join(config.keywords)
        params["per_page"] = min(config.max_candidates, 50)
        return params

    def _extract_items(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        for key in ("data", "items", "results", "listings"):
            if key in data and isinstance(data[key], list):
                result: list[dict[str, Any]] = data[key]
                return result
        if isinstance(data, list):
            return data
        return []

    def _has_more_pages(self, data: dict[str, Any], current_page: int) -> bool:
        if isinstance(data, dict):
            if "has_more" in data:
                return bool(data["has_more"])
            if "next_page" in data:
                return data["next_page"] is not None
            pagination = data.get("pagination", {})
            if isinstance(pagination, dict):
                return bool(pagination.get("has_more", False))
        return False

    def _map_to_candidate(self, item: dict[str, Any]) -> RawCandidate | None:
        def get_field(target: str) -> Any:
            source_key = self._field_mapping.get(target, target)
            if source_key in item:
                return item[source_key]
            for key in item:
                if key.lower() == source_key.lower():
                    return item[key]
            return None

        external_id = get_field("external_listing_id")
        source_url = get_field("source_url")
        if not source_url and external_id and self._listing_url_template:
            source_url = self._listing_url_template.format(id=external_id)
        if not source_url:
            return None

        raw_images = get_field("raw_images") or []
        if isinstance(raw_images, str):
            raw_images = [raw_images]

        raw_amenities = get_field("raw_amenities") or []
        if isinstance(raw_amenities, str):
            raw_amenities = [a.strip() for a in raw_amenities.split(",")]

        return RawCandidate(
            source=self.source_name,
            source_url=str(source_url),
            external_listing_id=str(external_id) if external_id else None,
            raw_title=get_field("raw_title"),
            raw_description=get_field("raw_description"),
            raw_price=str(get_field("raw_price")) if get_field("raw_price") is not None else None,
            raw_currency=get_field("raw_currency"),
            raw_location=get_field("raw_location"),
            raw_images=list(raw_images),
            raw_amenities=list(raw_amenities),
            raw_contact=get_field("raw_contact") or {},
            raw_payload=item,
        )


_DEFAULT_MAPPING: dict[str, str] = {
    "external_listing_id": "id",
    "source_url": "url",
    "raw_title": "title",
    "raw_description": "description",
    "raw_price": "price",
    "raw_currency": "currency",
    "raw_location": "location",
    "raw_images": "images",
    "raw_amenities": "amenities",
    "raw_contact": "contact",
}
