"""Listing configuration service for country, currency, and cover photo."""

import re
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.listings.models import Unit, UnitListing, UnitPhoto
from app.shared.exceptions import NotFoundError, ValidationError

from .schemas import ListingCreate, ListingUpdate

_CURRENCY_RE = re.compile(r"^[A-Z]{3}$")


def validate_image_url(url: str) -> bool:
    """Return True when *url* is a safe HTTPS image URL from an allowed host."""
    if settings.ENVIRONMENT == "test":
        return True

    if not url or len(url) > 2048:
        return False

    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False

    host = parsed.hostname or ""
    allowlist = [h.strip() for h in settings.IMAGE_HOST_ALLOWLIST.split(",") if h.strip()]
    if not allowlist:
        return True

    return any(
        host == allowed or host.endswith(allowed) for allowed in allowlist
    )


def resolve_cover_image_url(unit: Unit, listing: UnitListing) -> str | None:
    """Return the configured cover photo URL with sensible fallbacks."""
    photos = getattr(unit, "photos", None) or []

    if listing.cover_photo_id:
        for photo in photos:
            if photo.id == listing.cover_photo_id and validate_image_url(photo.url):
                return photo.url

    for photo in photos:
        if getattr(photo, "is_cover", False) and validate_image_url(photo.url):
            return photo.url

    for photo in photos:
        if validate_image_url(photo.url):
            return photo.url

    return None


async def _assert_cover_photo_belongs_to_unit(
    session: AsyncSession, unit: Unit, cover_photo_id: str
) -> None:
    result = await session.execute(
        select(UnitPhoto.id)
        .where(UnitPhoto.id == cover_photo_id, UnitPhoto.unit_id == unit.id)
    )
    if result.scalar_one_or_none() is None:
        raise NotFoundError(
            "Cover photo not found or does not belong to this listing"
        )


def _validate_currency(currency: str) -> None:
    if not _CURRENCY_RE.match(currency):
        raise ValidationError("currency must be a 3-letter ISO code")


def _validate_country(country: str) -> None:
    if not country.strip():
        raise ValidationError("country cannot be empty")


async def validate_listing_configuration(
    session: AsyncSession,
    unit: Unit,
    request: ListingCreate | ListingUpdate,
) -> None:
    """Validate listing configuration fields before persistence."""
    if request.currency is not None:
        _validate_currency(request.currency)

    if request.country is not None:
        _validate_country(request.country)

    if request.cover_photo_id:
        await _assert_cover_photo_belongs_to_unit(session, unit, request.cover_photo_id)
