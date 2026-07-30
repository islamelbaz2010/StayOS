"""Listing configuration service for country, currency, and cover photo."""

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.listings.models import Unit, UnitListing, UnitPhoto
from app.shared.exceptions import NotFoundError, ValidationError

from .schemas import ListingCreate, ListingUpdate

_CURRENCY_RE = re.compile(r"^[A-Z]{3}$")


def resolve_cover_image_url(unit: Unit, listing: UnitListing) -> str | None:
    """Return the configured cover photo URL with sensible fallbacks."""
    photos = getattr(unit, "photos", None) or []

    if listing.cover_photo_id:
        for photo in photos:
            if photo.id == listing.cover_photo_id:
                return photo.url

    for photo in photos:
        if getattr(photo, "is_cover", False):
            return photo.url

    if photos:
        return photos[0].url

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
