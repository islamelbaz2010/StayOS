"""Post-publication listing moderation.

When a host edits a LISTED listing, public-facing fields are held in
``unit_listings.pending_changes`` instead of going live immediately. The
published version stays visible to guests until an admin approves (apply
pending) or rejects (discard pending). Non-public operational fields
still apply directly — moderation is for guest-visible content only.
"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes

from .models import Unit, UnitListing, UnitPhoto

# Unit fields shown publicly / used by search — require review on LISTED.
REVIEWED_UNIT_FIELDS = {
    "property_type",
    "governorate",
    "city",
    "district",
    "address",
    "max_guests",
    "bedrooms",
    "beds",
    "bathrooms",
}

# Listing fields that are internal/operational — apply immediately.
NON_REVIEWED_LISTING_FIELDS = {
    "google_place_id",  # internal mapping reference
    "check_in_instructions",  # revealed to confirmed guests only
    "pre_arrival_info_release_hours",  # operational timing
}

# Photo moderation states.
PHOTO_LIVE = "live"
PHOTO_PENDING_ADD = "pending_add"
PHOTO_PENDING_REMOVE = "pending_remove"


def split_update_for_moderation(
    update_data: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    """Split a ListingUpdate payload into (unit changes, reviewed listing
    changes, direct listing changes) for a LISTED unit."""
    unit_changes: dict[str, Any] = {}
    reviewed_listing: dict[str, Any] = {}
    direct_listing: dict[str, Any] = {}

    for field, value in update_data.items():
        if field in ("lat", "lng"):
            unit_changes[field] = value
        elif field in REVIEWED_UNIT_FIELDS:
            unit_changes[field] = value
        elif field == "cover_photo_id":
            reviewed_listing[field] = value
        elif field in NON_REVIEWED_LISTING_FIELDS:
            direct_listing[field] = value
        else:
            reviewed_listing[field] = value

    return unit_changes, reviewed_listing, direct_listing


def stash_pending_changes(
    unit: Unit,
    listing: UnitListing,
    update_data: dict[str, Any],
    submitted_by: str,
) -> bool:
    """Merge reviewed changes into ``listing.pending_changes``.

    Returns True if anything was stashed. Non-reviewed fields are applied
    directly by the caller — this function only touches pending_changes.
    """
    unit_changes, reviewed_listing, _direct = split_update_for_moderation(
        update_data
    )

    if not unit_changes and not reviewed_listing:
        return False

    pending: dict[str, Any] = dict(listing.pending_changes or {})
    pending_unit = dict(pending.get("unit") or {})
    pending_listing = dict(pending.get("listing") or {})

    for field, value in unit_changes.items():
        if field in ("lat", "lng"):
            pending[field] = value
        else:
            pending_unit[field] = value
    for field, value in reviewed_listing.items():
        pending_listing[field] = value

    if pending_unit:
        pending["unit"] = pending_unit
    if pending_listing:
        pending["listing"] = pending_listing
    pending["submitted_by"] = submitted_by
    pending["submitted_at"] = datetime.now(UTC).isoformat()

    # Force SQLAlchemy to notice the in-place JSON mutation.
    listing.pending_changes = pending
    attributes.flag_modified(listing, "pending_changes")
    return True


async def apply_pending_changes(
    session: AsyncSession, unit: Unit, listing: UnitListing
) -> bool:
    """Publish stashed host changes. Returns True when changes existed."""
    pending = listing.pending_changes or {}
    if not pending:
        return False

    for field, value in (pending.get("unit") or {}).items():
        if hasattr(unit, field):
            setattr(unit, field, value)

    lat = pending.get("lat")
    lng = pending.get("lng")
    if lat is not None and lng is not None:
        import math

        from geoalchemy2 import WKTElement

        if math.isfinite(float(lat)) and math.isfinite(float(lng)):
            unit.coordinates = WKTElement(f"POINT({lng} {lat})", srid=4326)

    for field, value in (pending.get("listing") or {}).items():
        if field == "cover_photo_id":
            listing.cover_photo_id = value
        elif hasattr(listing, field):
            setattr(listing, field, value)

    # Photos: pending_add -> live, pending_remove -> deleted.
    photos_result = await session.execute(
        select(UnitPhoto).where(UnitPhoto.unit_id == unit.id)
    )
    for photo in photos_result.scalars().all():
        if photo.moderation_state == PHOTO_PENDING_ADD:
            photo.moderation_state = PHOTO_LIVE
            session.add(photo)
        elif photo.moderation_state == PHOTO_PENDING_REMOVE:
            await session.delete(photo)

    listing.pending_changes = None
    session.add(unit)
    session.add(listing)
    await session.flush()
    return True


async def discard_pending_changes(
    session: AsyncSession, unit: Unit, listing: UnitListing
) -> bool:
    """Reject stashed host changes — published version stays live."""
    pending = listing.pending_changes or {}
    photos_result = await session.execute(
        select(UnitPhoto).where(UnitPhoto.unit_id == unit.id)
    )
    had_photos = False
    for photo in photos_result.scalars().all():
        if photo.moderation_state == PHOTO_PENDING_ADD:
            await session.delete(photo)
            had_photos = True
        elif photo.moderation_state == PHOTO_PENDING_REMOVE:
            photo.moderation_state = PHOTO_LIVE
            session.add(photo)
            had_photos = True

    if not pending and not had_photos:
        return False
    listing.pending_changes = None
    session.add(listing)
    await session.flush()
    return True


async def has_pending_photo_changes(session: AsyncSession, unit_id: str) -> bool:
    result = await session.execute(
        select(UnitPhoto.id).where(
            UnitPhoto.unit_id == unit_id,
            UnitPhoto.moderation_state.in_(
                [PHOTO_PENDING_ADD, PHOTO_PENDING_REMOVE]
            ),
        )
    )
    return result.first() is not None
