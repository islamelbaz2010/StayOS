import logging
import math
import uuid
from datetime import date, datetime, timedelta
from statistics import median
from typing import Any

import boto3
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import services as auth_services
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.config import settings
from app.host.permissions import (
    assert_can_edit_listing,
    assert_can_manage_calendar,
    assert_owner_or_admin,
    get_managed_unit_ids,
    get_unit_permission_scopes,
)
from app.listings.constants import CalendarBlockType, CalendarStatus, UnitStatus
from app.listings.models import Unit, UnitListing
from app.messages.constants import ConversationType, ParticipantRole
from app.messages.models import Conversation, ConversationParticipant, Message
from app.reviews import repository as reviews_repository
from app.shared.exceptions import (
    AuthorizationError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)

from . import configuration as listing_configuration
from . import pricing
from . import repository as listings_repository
from .schemas import (
    AvailabilityResponse,
    BulkAvailabilityRequest,
    BulkPricingRequest,
    CalendarDay,
    CalendarRuleCreate,
    CalendarRuleResponse,
    CalendarRuleUpdate,
    HostDashboardStats,
    HostProfileResponse,
    HostReservationCalendarItem,
    HostReservationCalendarResponse,
    ListingChangeEvent,
    ListingCreate,
    ListingResponse,
    ListingSearchFilters,
    ListingSearchResponse,
    ListingSearchResult,
    ListingUpdate,
    PaginationInfo,
    PriceBucket,
    PriceDistributionResponse,
    PhotoCreate,
    PhotoPresignResponse,
    PhotoReorderRequest,
    PendingPhotoRef,
    PhotoResponse,
)

logger = logging.getLogger(__name__)

_PHOTO_UPLOAD_TTL_SECONDS = 900
_PHOTO_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _emit_listing_event(
    session: AsyncSession,
    unit_id: str,
    event_type: str,
    payload: dict[str, Any],
) -> None:
    """Record a listing lifecycle event in the persistent outbox log so
    the admin review history survives across resubmissions."""
    from app.shared.models import OutboxEvent

    session.add(
        OutboxEvent(
            aggregate_type="listing",
            aggregate_id=unit_id,
            event_type=event_type,
            payload=payload,
        )
    )
    await session.flush()


def _require_storage_config() -> None:
    missing = [
        name
        for name in (
            "S3_LISTINGS_BUCKET",
            "AWS_REGION",
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
        )
        if not getattr(settings, name)
    ]
    if missing:
        logger.error(
            "Listing photo storage is not configured (missing: %s)",
            ", ".join(missing),
        )
        raise ServiceUnavailableError(
            "Photo upload is temporarily unavailable. Please try again later."
        )


def _s3_client() -> Any:
    _require_storage_config()
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def _resolve_title(listing: UnitListing) -> str:
    return listing.title_ar or listing.title_en or ""


def _resolve_description(listing: UnitListing) -> str:
    return listing.description_ar or listing.description_en or ""


def _cover_image_url(unit: Unit, listing: UnitListing) -> str | None:
    return listing_configuration.resolve_cover_image_url(unit, listing)


def _to_listing_response(
    unit: Unit, listing: UnitListing, lat: float, lng: float,
    host: User | None = None, permission_scope: str | None = None,
    host_response_rate: int | None = None,
    host_response_time_hours: float | None = None,
    include_pending: bool = False,
) -> ListingResponse:
    # Extract accessibility features that have at least one evidence photo.
    # Pending-add photos are not public yet, so they don't count as
    # published evidence.
    accessibility_photo_features = sorted({
        photo.accessibility_feature
        for photo in (unit.photos or [])
        if photo.accessibility_feature
        and getattr(photo, "moderation_state", "live") != "pending_add"
    })
    return ListingResponse(
        id=unit.id,
        host_id=unit.host_id,
        host_display_name=host.display_name if host else None,
        host_bio=host.bio if host else None,
        host_kyc_status=host.kyc_status if host else None,
        host_joined_at=str(host.created_at) if host else None,
        host_languages=list(host.languages or []) if host else [],
        host_response_rate=host_response_rate,
        host_response_time_hours=host_response_time_hours,
        property_type=unit.property_type,
        status=unit.status,
        lat=lat,
        lng=lng,
        governorate=unit.governorate,
        city=unit.city,
        country=listing.country,
        district=unit.district,
        address=unit.address,
        max_guests=unit.max_guests,
        bedrooms=unit.bedrooms,
        beds=unit.beds,
        bathrooms=unit.bathrooms,
        category=listing.category,
        title_ar=listing.title_ar,
        title_en=listing.title_en,
        title=_resolve_title(listing),
        description_ar=listing.description_ar,
        description_en=listing.description_en,
        description=_resolve_description(listing),
        amenities=listing.amenities,
        cultural_tags=listing.cultural_tags,
        allows_pets=bool(listing.allows_pets),
        self_check_in=bool(listing.self_check_in),
        self_check_in_methods=list(listing.self_check_in_methods or []),
        accessibility_features=list(listing.accessibility_features or []),
        house_rules=listing.house_rules,
        check_in_instructions=listing.check_in_instructions,
        check_in_time=listing.check_in_time,
        check_out_time=listing.check_out_time,
        pre_arrival_info_release_hours=listing.pre_arrival_info_release_hours,
        policies=listing.policies,
        sleeping_arrangements=listing.sleeping_arrangements,
        base_price_egp=listing.base_price_egp,
        cleaning_fee_egp=listing.cleaning_fee_egp,
        listing_discount_pct=int(listing.listing_discount_pct or 0),
        weekly_discount_pct=int(listing.weekly_discount_pct or 0),
        monthly_discount_pct=int(listing.monthly_discount_pct or 0),
        cancellation_policy=listing.cancellation_policy,
        instant_book=bool(listing.instant_book),
        price=listing.base_price_egp,
        currency=listing.currency,
        weekend_mult=listing.weekend_mult,
        peak_mult=listing.peak_mult,
        min_nights=listing.min_nights,
        max_nights=listing.max_nights,
        accessibility_photo_features=accessibility_photo_features,
        cover_image=_cover_image_url(unit, listing),
        permission_scope=permission_scope,
        rejection_reason=unit.rejection_reason
        if isinstance(unit.rejection_reason, str)
        else None,
        has_pending_changes=bool(listing.pending_changes)
        or any(
            getattr(p, "moderation_state", "live") in ("pending_add", "pending_remove")
            for p in (unit.photos or [])
        ),
        pending_changes=listing.pending_changes if include_pending else None,
        pending_photos=[
            PendingPhotoRef(
                id=p.id,
                url=p.url,
                moderation_state=getattr(p, "moderation_state", "live"),
                is_cover=bool(p.is_cover),
            )
            for p in (unit.photos or [])
            if getattr(p, "moderation_state", "live")
            in ("pending_add", "pending_remove")
        ]
        if include_pending
        else [],
    )


async def _fetch_coordinates(
    session: AsyncSession, unit: Unit
) -> tuple[float, float]:
    result = await session.execute(
        select(
            func.ST_X(Unit.coordinates).label("lng"),
            func.ST_Y(Unit.coordinates).label("lat"),
        ).where(Unit.id == unit.id)
    )
    row = result.one()
    return float(row.lat), float(row.lng)


def _to_search_result(
    unit: Unit, listing: UnitListing, lat: float, lng: float,
    host: User | None = None,
) -> dict[str, object]:
    return {
        "id": unit.id,
        "title_ar": listing.title_ar,
        "title_en": listing.title_en,
        "title": _resolve_title(listing),
        "description": _resolve_description(listing),
        "property_type": unit.property_type,
        "category": listing.category,
        "city": unit.city,
        "governorate": unit.governorate,
        "country": listing.country,
        "base_price_egp": listing.base_price_egp,
        "price": listing.base_price_egp,
        "currency": listing.currency,
        "lat": lat,
        "lng": lng,
        "max_guests": unit.max_guests,
        "bedrooms": unit.bedrooms,
        "beds": unit.beds,
        "bathrooms": unit.bathrooms,
        "amenities": listing.amenities,
        "cultural_tags": listing.cultural_tags,
        "house_rules": listing.house_rules,
        "instant_book": bool(listing.instant_book),
        "host_kyc_status": host.kyc_status if host else None,
        "cover_image": _cover_image_url(unit, listing),
    }


def _assert_host(user: User) -> None:
    if user.role != UserRole.HOST:
        raise AuthorizationError("Only hosts can manage listings")


async def _fetch_host(session: AsyncSession, host_id: str) -> User | None:
    result = await session.execute(select(User).where(User.id == host_id))
    return result.scalar_one_or_none()


async def create_listing(
    session: AsyncSession, user: User, request: ListingCreate
) -> ListingResponse:
    _assert_host(user)
    if not request.is_draft and user.kyc_status != KycStatus.VERIFIED:
        raise AuthorizationError("Host KYC must be verified to publish a listing")

    unit = await listings_repository.create_listing(session, user.id, request)
    await listing_configuration.validate_listing_configuration(session, unit, request)
    if request.is_draft:
        unit = await listings_repository.set_unit_status(
            session, unit, UnitStatus.DRAFT
        )

    # Re-fetch with the listing and photos relationships eagerly loaded
    # to avoid MissingGreenlet lazy-loads outside the async context.
    await session.refresh(unit, attribute_names=["listing", "photos"])
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    host = await _fetch_host(session, unit.host_id)
    lat, lng = request.lat, request.lng
    return _to_listing_response(unit, listing, lat, lng, host=host)


async def get_listing_detail(
    session: AsyncSession, unit_id: str
) -> ListingResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None or unit.status != UnitStatus.LISTED:
        raise NotFoundError("Listing not found")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    host = await _fetch_host(session, unit.host_id)
    lat, lng = await _fetch_coordinates(session, unit)
    host_response_rate, host_response_time_hours = (
        await _calculate_host_response_metrics(session, unit.host_id)
    )
    response = _to_listing_response(
        unit, listing, lat, lng, host,
        host_response_rate=host_response_rate,
        host_response_time_hours=host_response_time_hours,
    )
    response.average_rating, response.review_count = (
        await reviews_repository.get_rating_aggregate_for_unit(session, unit_id)
    )
    return response


async def get_host_listing_detail(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    from app.host.permissions import assert_can_access_unit

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_access_unit(session, user, unit)

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def get_host_listings(
    session: AsyncSession, user: User
) -> list[ListingResponse]:
    _assert_host(user)
    managed_unit_ids = await get_managed_unit_ids(session, user)
    units = await listings_repository.get_host_units_with_listings(
        session, user.id, unit_ids=managed_unit_ids
    )
    scope_map = await get_unit_permission_scopes(
        session, user, [unit.id for unit in units]
    )
    results: list[ListingResponse] = []
    for unit in units:
        listing = unit.listing
        if listing is None:
            continue
        lat, lng = await _fetch_coordinates(session, unit)
        results.append(
            _to_listing_response(
                unit, listing, lat, lng, permission_scope=scope_map.get(unit.id)
            )
        )
    return results


async def submit_for_review(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)
    if unit.status not in (UnitStatus.DRAFT, UnitStatus.REJECTED, UnitStatus.UNLISTED):
        raise ValidationError("Only draft or rejected listings can be submitted for review")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    if not listing.title_ar or not listing.description_ar:
        raise ValidationError("Title and description are required before submitting")
    if listing.base_price_egp < 100:
        raise ValidationError("Price must be at least 100 EGP")

    # Enforce the listing-readiness checklist at the actual submission
    # transition so incomplete listings cannot enter the review queue.
    from app.host import services as host_services
    from app.host.constants import ListingReadinessStatus

    # Refresh to ensure we evaluate the latest persisted state
    await session.refresh(unit)
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    readiness = await host_services.compute_listing_readiness(session, unit, listing)
    if readiness.status != ListingReadinessStatus.READY:
        missing = ", ".join(readiness.missing_item_labels.values())
        raise ValidationError(
            f"Listing is not ready for review. Missing: {missing or 'required fields'}"
        )

    unit.rejection_reason = None
    unit = await listings_repository.set_unit_status(
        session, unit, UnitStatus.PENDING_VERIFICATION
    )
    await _emit_listing_event(
        session, unit.id, "listing.submitted", {"submitted_by": user.id}
    )
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def get_pending_listings(
    session: AsyncSession, user: User
) -> list[ListingResponse]:
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise AuthorizationError("Only admins can view pending listings")
    units = await listings_repository.get_units_by_status(
        session, UnitStatus.PENDING_VERIFICATION
    )
    # Listings with a pending edit change-set are also awaiting review.
    units += await listings_repository.get_units_with_pending_changes(session)
    results: list[ListingResponse] = []
    for unit in units:
        listing = unit.listing
        if listing is None:
            continue
        lat, lng = await _fetch_coordinates(session, unit)
        results.append(
            _to_listing_response(unit, listing, lat, lng, include_pending=True)
        )
    return results


async def approve_listing(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise AuthorizationError("Only admins can approve listings")
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    if unit.status == UnitStatus.LISTED:
        # Published listing with a pending edit change-set — approval
        # publishes the stashed changes; the unit stays LISTED.
        from . import moderation

        # Capture the change-set before apply clears it.
        pending_snapshot = dict(listing.pending_changes or {})
        applied = await moderation.apply_pending_changes(session, unit, listing)
        if not applied:
            raise ValidationError("No pending changes to approve")
        await _emit_listing_event(
            session,
            unit.id,
            "listing.edit_approved",
            {
                "decided_by": user.id,
                "fields": sorted(
                    set(pending_snapshot.get("unit") or {})
                    | set(pending_snapshot.get("listing") or {})
                    | {k for k in ("lat", "lng") if pending_snapshot.get(k)}
                ),
                "submitted_by": pending_snapshot.get("submitted_by"),
            },
        )
        if unit.rejection_reason:
            # Approval resolves any outstanding rejection record.
            unit.rejection_reason = None
            session.add(unit)
            await session.flush()
    elif unit.status == UnitStatus.PENDING_VERIFICATION:
        unit = await listings_repository.set_unit_status(session, unit, UnitStatus.LISTED)
        await _emit_listing_event(
            session, unit.id, "listing.approved", {"decided_by": user.id}
        )
    else:
        raise ValidationError("Only pending listings can be approved")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def reject_listing(
    session: AsyncSession, user: User, unit_id: str, reason: str | None = None
) -> ListingResponse:
    if user.role not in (UserRole.ADMIN, UserRole.STAFF):
        raise AuthorizationError("Only admins can reject listings")
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    if unit.status == UnitStatus.LISTED:
        # Published listing with pending edits — rejection discards the
        # change-set; the approved version stays live.
        from . import moderation

        pending_snapshot = dict(listing.pending_changes or {})
        discarded = await moderation.discard_pending_changes(session, unit, listing)
        if not discarded:
            raise ValidationError("No pending changes to reject")
        unit.rejection_reason = reason or None
        session.add(unit)
        await session.flush()
        await _emit_listing_event(
            session,
            unit.id,
            "listing.edit_rejected",
            {
                "decided_by": user.id,
                "reason": reason,
                "fields": sorted(
                    set(pending_snapshot.get("unit") or {})
                    | set(pending_snapshot.get("listing") or {})
                    | {k for k in ("lat", "lng") if pending_snapshot.get(k)}
                ),
                "submitted_by": pending_snapshot.get("submitted_by"),
            },
        )
    elif unit.status == UnitStatus.PENDING_VERIFICATION:
        unit.rejection_reason = reason or None
        unit = await listings_repository.set_unit_status(session, unit, UnitStatus.REJECTED)
        await _emit_listing_event(
            session,
            unit.id,
            "listing.rejected",
            {"decided_by": user.id, "reason": reason},
        )
    else:
        raise ValidationError("Only pending listings can be rejected")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def update_listing(
    session: AsyncSession, user: User, unit_id: str, request: ListingUpdate
) -> ListingResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_edit_listing(session, user, unit)

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    update_data = request.model_dump(exclude_unset=True)

    # Post-publication moderation: on a LISTED unit, edits by the host go
    # into a reviewable change-set; the published version stays live until
    # an admin approves. Admins edit the live record directly. Only
    # public-facing fields are held — internal operational fields
    # (check-in instructions, pre-arrival timing) apply immediately.
    is_listed_edit = (
        unit.status == UnitStatus.LISTED and user.role != UserRole.ADMIN
    )
    if is_listed_edit:
        from . import moderation

        _unit_changes, _reviewed, direct = moderation.split_update_for_moderation(
            update_data
        )
        stashed = moderation.stash_pending_changes(
            unit, listing, update_data, submitted_by=user.id
        )
        if stashed:
            await _emit_listing_event(
                session,
                unit.id,
                "listing.edit_submitted",
                {
                    "submitted_by": user.id,
                    "fields": sorted(update_data.keys()),
                },
            )
        if stashed and unit.rejection_reason:
            # A prior change-set rejection is superseded once the host
            # submits a new change-set for review.
            unit.rejection_reason = None
            session.add(unit)
        if direct:
            for field, value in direct.items():
                if hasattr(unit, field):
                    setattr(unit, field, value)
                elif hasattr(listing, field):
                    setattr(listing, field, value)
            session.add(unit)
        session.add(listing)
        await session.flush()
        lat, lng = await _fetch_coordinates(session, unit)
        return _to_listing_response(
            unit, listing, lat, lng, include_pending=stashed or listing.pending_changes is not None
        )

    unit_fields = {
        "property_type",
        "governorate",
        "city",
        "district",
        "google_place_id",
        "address",
        "max_guests",
        "bedrooms",
        "beds",
        "bathrooms",
    }
    for field in unit_fields:
        if field in update_data:
            setattr(unit, field, update_data[field])

    if "lat" in update_data and "lng" in update_data:
        lat_val = update_data["lat"]
        lng_val = update_data["lng"]
        if (
            lat_val is not None
            and lng_val is not None
            and math.isfinite(float(lat_val))
            and math.isfinite(float(lng_val))
        ):
            unit.coordinates = WKTElement(
                f"POINT({lng_val} {lat_val})", srid=4326
            )
    elif "lat" in update_data or "lng" in update_data:
        raise ValidationError("Both lat and lng are required to update coordinates")

    session.add(unit)

    await listing_configuration.validate_listing_configuration(session, unit, request)
    updated = await listings_repository.update_unit_listing(
        session, unit, listing, request
    )
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, updated, lat, lng)


async def search_listings(
    session: AsyncSession, filters: ListingSearchFilters
) -> ListingSearchResponse:
    if filters.sw_lat is not None and None in (
        filters.sw_lat,
        filters.sw_lng,
        filters.ne_lat,
        filters.ne_lng,
    ):
        raise ValidationError("Viewport requires all four bounds")
    if filters.radius_km is not None and None in (filters.lat, filters.lng):
        raise ValidationError("radius_km requires lat and lng")
    if filters.check_in is not None and filters.check_out is not None:
        if filters.check_out <= filters.check_in:
            raise ValidationError("check_out must be after check_in")
        if (filters.check_out - filters.check_in).days > 90:
            raise ValidationError("Date range cannot exceed 90 days")
    elif (filters.check_in is not None) != (filters.check_out is not None):
        raise ValidationError("Both check_in and check_out are required")
    if (
        filters.min_price is not None
        and filters.max_price is not None
        and filters.min_price > filters.max_price
    ):
        raise ValidationError("min_price cannot be greater than max_price")

    offset = filters.get_offset()
    rows, total = await listings_repository.search_listings(
        session, filters, offset, filters.limit
    )

    host_ids = {unit.host_id for unit, _, _, _ in rows}
    hosts_map: dict[str, User] = {}
    if host_ids:
        host_result = await session.execute(
            select(User).where(User.id.in_(host_ids))
        )
        hosts_map = {h.id: h for h in host_result.scalars().all()}

    unit_ids = [unit.id for unit, _, _, _ in rows]
    ratings_map = await reviews_repository.get_rating_aggregates_for_units(session, unit_ids)

    data = [
        _to_search_result(unit, listing, lat, lng, hosts_map.get(unit.host_id))
        for unit, listing, lat, lng in rows
    ]
    has_search_dates = filters.check_in is not None and filters.check_out is not None
    for item, (unit, listing, _, _) in zip(data, rows, strict=True):
        avg_rating, review_count = ratings_map.get(unit.id, (None, 0))
        item["average_rating"] = avg_rating
        item["review_count"] = review_count
        item["available_for_dates"] = has_search_dates if has_search_dates else None
        if has_search_dates:
            nights = (filters.check_out - filters.check_in).days
            item["nights"] = nights
            accommodation = pricing.compute_subtotal(
                listing, unit.calendar_rules, filters.check_in, filters.check_out
            )
            # All-inclusive pricing (Founder commercial decision): the
            # search-card total is the final guest price — the applicable
            # host discount applied, cleaning included, VAT added, no
            # other fee.
            discount_pct = pricing.applicable_discount_pct(listing, nights)
            accommodation -= int(round(accommodation * discount_pct / 100))
            cleaning = listing.cleaning_fee_egp or 0
            taxable = accommodation + cleaning
            guest_total = taxable + int(round(taxable * settings.VAT_RATE_PCT))
            item["total_egp"] = guest_total
            effective_nightly = int(round(guest_total / nights)) if nights else None
            item["effective_nightly_egp"] = effective_nightly
            item["discounted"] = bool(
                effective_nightly is not None
                and effective_nightly < listing.base_price_egp
            )
    has_more = offset + len(data) < total
    next_cursor = (
        ListingSearchFilters.encode_cursor(offset + filters.limit)
        if has_more
        else None
    )

    return ListingSearchResponse(
        data=[ListingSearchResult(**item) for item in data],
        pagination=PaginationInfo(
            next_cursor=next_cursor,
            has_more=has_more,
            total_count=total,
        ),
    )


_PRICE_HISTOGRAM_BUCKETS = 20


async def get_price_distribution(
    session: AsyncSession, filters: ListingSearchFilters
) -> PriceDistributionResponse:
    """Nightly-price histogram over the listings matching the current
    non-price filters — used by the price-range filter UI."""
    import copy

    priceless = copy.copy(filters)
    priceless.min_price = None
    priceless.max_price = None
    prices = await listings_repository.search_price_values(session, priceless)
    if not prices:
        return PriceDistributionResponse(
            min_price_egp=None, max_price_egp=None, total=0, buckets=[]
        )

    lo, hi = min(prices), max(prices)
    if lo == hi:
        return PriceDistributionResponse(
            min_price_egp=lo,
            max_price_egp=hi,
            total=len(prices),
            buckets=[PriceBucket(from_egp=lo, to_egp=hi, count=len(prices))],
        )

    bucket_count = min(_PRICE_HISTOGRAM_BUCKETS, len(prices))
    width = max(1, math.ceil((hi - lo + 1) / bucket_count))
    buckets = [0] * bucket_count
    for price in prices:
        idx = min((price - lo) // width, bucket_count - 1)
        buckets[idx] += 1

    return PriceDistributionResponse(
        min_price_egp=lo,
        max_price_egp=hi,
        total=len(prices),
        buckets=[
            PriceBucket(from_egp=lo + i * width, to_egp=lo + (i + 1) * width - 1, count=c)
            for i, c in enumerate(buckets)
        ],
    )


async def get_listing_change_history(
    session: AsyncSession, unit_id: str
) -> list[ListingChangeEvent]:
    """Review lifecycle history for a unit: submissions, approvals,
    change requests and resubmissions, newest first."""
    events = await listings_repository.list_listing_events(session, unit_id)
    actor_ids = {
        str(payload_actor)
        for e in events
        for payload_actor in [
            (e.payload or {}).get("submitted_by") or (e.payload or {}).get("decided_by")
        ]
        if payload_actor
    }
    actors: dict[str, User] = {}
    if actor_ids:
        result = await session.execute(
            select(User).where(User.id.in_(actor_ids))
        )
        actors = {u.id: u for u in result.scalars().all()}

    response: list[ListingChangeEvent] = []
    for event in events:
        payload = dict(event.payload or {})
        actor_id = payload.get("submitted_by") or payload.get("decided_by")
        actor = actors.get(actor_id) if actor_id else None
        response.append(
            ListingChangeEvent(
                id=event.id,
                event_type=event.event_type,
                created_at=event.created_at,
                actor_id=actor_id,
                actor_name=actor.display_name if actor else None,
                payload=payload,
            )
        )
    return response


async def _calculate_host_response_metrics(
    session: AsyncSession, host_id: str
) -> tuple[int | None, float | None]:
    """Compute host response rate (%) and median response time (hours) over
    the last 30 days, matching Airbnb's documented behavior.

    Counts both pre-booking inquiries (first non-automated host message in
    a conversation) and booking requests (host accept/reject action) as
    responses.  Returns ``(None, None)`` when the host has received no
    inquiries or requests in the window.
    """
    cutoff = datetime.utcnow() - timedelta(days=30)

    # Subquery: earliest non-automated host message per conversation.
    first_host_msg = (
        select(
            Message.conversation_id,
            func.min(Message.created_at).label("first_response_at"),
        )
        .where(
            Message.sender_role == ParticipantRole.HOST,
            Message.automation_type.is_(None),
        )
        .group_by(Message.conversation_id)
    ).subquery()

    conv_rows = (
        await session.execute(
            select(
                Conversation.created_at,
                first_host_msg.c.first_response_at,
            )
            .select_from(Conversation)
            .join(
                ConversationParticipant,
                ConversationParticipant.conversation_id == Conversation.id,
            )
            .outerjoin(first_host_msg, first_host_msg.c.conversation_id == Conversation.id)
            .where(
                ConversationParticipant.user_id == host_id,
                ConversationParticipant.role == ParticipantRole.HOST,
                Conversation.type.in_(
                    [ConversationType.INQUIRY, ConversationType.RESERVATION]
                ),
                Conversation.created_at >= cutoff,
            )
        )
    ).all()

    booking_rows = (
        await session.execute(
            select(
                Booking.requested_at,
                Booking.accepted_at,
                Booking.rejected_at,
            )
            .join(Unit, Unit.id == Booking.unit_id)
            .where(
                Unit.host_id == host_id,
                Booking.requested_at >= cutoff,
                (Booking.accepted_at.is_not(None))
                | (Booking.rejected_at.is_not(None)),
            )
        )
    ).all()

    response_times_hours: list[float] = []
    total = 0
    responded_within_24h = 0

    for created_at, first_response_at in conv_rows:
        total += 1
        if first_response_at is not None:
            delta = first_response_at - created_at
            hours = delta.total_seconds() / 3600
            response_times_hours.append(hours)
            if hours <= 24:
                responded_within_24h += 1

    for requested_at, accepted_at, rejected_at in booking_rows:
        total += 1
        response_at = accepted_at or rejected_at
        if response_at is not None:
            delta = response_at - requested_at
            hours = delta.total_seconds() / 3600
            response_times_hours.append(hours)
            if hours <= 24:
                responded_within_24h += 1

    if total == 0:
        return None, None

    rate = round((responded_within_24h / total) * 100)
    med = round(median(response_times_hours), 1) if response_times_hours else None
    return rate, med


async def get_host_profile(
    session: AsyncSession, host_id: str
) -> HostProfileResponse:
    host = await _fetch_host(session, host_id)
    if host is None:
        raise NotFoundError("Host not found")

    lat_col = func.ST_Y(Unit.coordinates).label("lat")
    lng_col = func.ST_X(Unit.coordinates).label("lng")

    result = await session.execute(
        select(Unit, UnitListing, lat_col, lng_col)
        .options(selectinload(Unit.photos))
        .join(UnitListing, Unit.id == UnitListing.unit_id)
        .where(
            Unit.host_id == host_id,
            Unit.status == UnitStatus.LISTED,
        )
        .order_by(Unit.created_at.desc())
    )
    rows = result.all()

    response_rate, response_time_hours = await _calculate_host_response_metrics(
        session, host_id
    )

    ratings_map = await reviews_repository.get_rating_aggregates_for_units(
        session, [unit.id for unit, _, _, _ in rows]
    )
    listings = []
    for unit, listing, lat, lng in rows:
        avg_rating, review_count = ratings_map.get(unit.id, (None, 0))
        listings.append(
            ListingSearchResult(
                **_to_search_result(unit, listing, float(lat), float(lng), host),
                average_rating=avg_rating,
                review_count=review_count,
            )
        )

    return HostProfileResponse(
        id=host.id,
        display_name=host.display_name,
        bio=host.bio,
        avatar_url=auth_services.avatar_url(host),
        kyc_status=host.kyc_status,
        joined_at=str(host.created_at) if host.created_at else None,
        languages=list(host.languages or []),
        response_rate=response_rate,
        response_time_hours=response_time_hours,
        listings=listings,
    )


async def get_similar_listings(
    session: AsyncSession, unit_id: str, limit: int = 6
) -> list[dict[str, object]]:
    """Deterministic recommendations: same city, similar price band, same property type."""
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None or unit.status != UnitStatus.LISTED:
        raise NotFoundError("Listing not found")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    price = listing.base_price_egp
    price_min = max(100, int(price * 0.5))
    price_max = int(price * 2.0)

    lat_col = func.ST_Y(Unit.coordinates).label("lat")
    lng_col = func.ST_X(Unit.coordinates).label("lng")

    stmt = (
        select(Unit, UnitListing, lat_col, lng_col)
        .options(selectinload(Unit.photos))
        .join(UnitListing, Unit.id == UnitListing.unit_id)
        .where(
            Unit.status == UnitStatus.LISTED,
            Unit.id != unit_id,
            Unit.city == unit.city,
            UnitListing.base_price_egp.between(price_min, price_max),
        )
        .order_by(
            func.abs(UnitListing.base_price_egp - price).asc(),
            Unit.created_at.desc(),
        )
        .limit(limit)
    )

    result = await session.execute(stmt)
    rows = result.all()

    if len(rows) < limit:
        existing_ids = {unit_id} | {u.id for u, _, _, _ in rows}
        fallback_stmt = (
            select(Unit, UnitListing, lat_col, lng_col)
            .options(selectinload(Unit.photos))
            .join(UnitListing, Unit.id == UnitListing.unit_id)
            .where(
                Unit.status == UnitStatus.LISTED,
                ~Unit.id.in_(existing_ids),
            )
            .order_by(Unit.created_at.desc())
            .limit(limit - len(rows))
        )
        fallback_result = await session.execute(fallback_stmt)
        rows = list(rows) + list(fallback_result.all())

    host_ids = {u.host_id for u, _, _, _ in rows}
    hosts_map: dict[str, User] = {}
    if host_ids:
        host_result = await session.execute(
            select(User).where(User.id.in_(host_ids))
        )
        hosts_map = {h.id: h for h in host_result.scalars().all()}

    return [
        _to_search_result(u, listing, float(lat), float(lng), hosts_map.get(u.host_id))
        for u, listing, lat, lng in rows
    ]


async def get_availability(
    session: AsyncSession, unit_id: str, check_in: date, check_out: date
) -> AvailabilityResponse:
    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")
    if (check_out - check_in).days > 90:
        raise ValidationError("Date range cannot exceed 90 days")

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None or unit.status != UnitStatus.LISTED:
        raise NotFoundError("Listing not found")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    rules = await listings_repository.get_calendar_rules_in_range(
        session, unit_id, check_in, check_out
    )
    active_bookings = await bookings_repository.list_overlapping_bookings(
        session, unit_id, check_in, check_out
    )

    non_available_rules = [r for r in rules if r.status != CalendarStatus.AVAILABLE]
    available_rules = [r for r in rules if r.status == CalendarStatus.AVAILABLE]

    days: list[CalendarDay] = []
    current = check_in
    while current < check_out:
        status = str(CalendarStatus.AVAILABLE)
        block_type: str | None = None
        available_rule = pricing.find_rule_for_day(available_rules, current)
        price = pricing.get_day_price(listing, available_rule, current)

        for booking in active_bookings:
            if booking.check_in <= current < booking.check_out:
                status = str(CalendarStatus.BOOKED)
                block_type = None
                price = 0
                break

        if status == str(CalendarStatus.AVAILABLE):
            for rule in non_available_rules:
                if rule.date_from <= current < rule.date_to:
                    status = str(rule.status)
                    block_type = (
                        rule.block_type
                        if rule.status == CalendarStatus.BLOCKED
                        else None
                    )
                    price = 0
                    break

        days.append(
            CalendarDay(
                date=current, status=status, block_type=block_type, price_egp=price
            )
        )
        current += timedelta(days=1)

    return AvailabilityResponse(
        unit_id=unit_id,
        check_in=check_in,
        check_out=check_out,
        days=days,
    )


def _to_calendar_rule_response(rule: Any) -> CalendarRuleResponse:
    return CalendarRuleResponse(
        id=rule.id,
        unit_id=rule.unit_id,
        date_from=rule.date_from,
        date_to=rule.date_to,
        status=rule.status,
        block_type=rule.block_type,
        price_override=rule.price_override,
    )


async def publish_listing(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    _assert_host(user)
    if user.kyc_status != KycStatus.VERIFIED:
        raise AuthorizationError("Host KYC must be verified to publish a listing")

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)
    if unit.status == UnitStatus.ARCHIVED:
        raise ValidationError("Archived listings cannot be published")

    unit = await listings_repository.set_unit_status(session, unit, UnitStatus.LISTED)
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def unpublish_listing(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)

    unit = await listings_repository.set_unit_status(
        session, unit, UnitStatus.UNLISTED
    )
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def archive_listing(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)

    unit = await listings_repository.set_unit_status(
        session, unit, UnitStatus.ARCHIVED
    )
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def create_host_calendar_rule(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: CalendarRuleCreate,
) -> CalendarRuleResponse:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_manage_calendar(session, user, unit)

    if request.status == CalendarStatus.BLOCKED and not request.block_type:
        request.block_type = CalendarBlockType.MANUAL

    rule = await listings_repository.create_calendar_rule(
        session,
        unit_id,
        request.date_from,
        request.date_to,
        request.status,
        request.block_type,
        request.price_override,
    )
    return _to_calendar_rule_response(rule)


async def update_host_calendar_rule(
    session: AsyncSession,
    user: User,
    unit_id: str,
    rule_id: str,
    request: CalendarRuleUpdate,
) -> CalendarRuleResponse:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_manage_calendar(session, user, unit)

    rule = await listings_repository.get_calendar_rule_by_id(
        session, unit_id, rule_id
    )
    if rule is None:
        raise NotFoundError("Calendar rule not found")
    if rule.reservation_id:
        raise ValidationError("Cannot modify a booking-related rule")

    if request.status == CalendarStatus.BLOCKED and not request.block_type:
        request.block_type = CalendarBlockType.MANUAL

    updated = await listings_repository.update_calendar_rule(
        session,
        rule,
        request.date_from,
        request.date_to,
        request.status,
        request.block_type,
        request.price_override,
    )
    return _to_calendar_rule_response(updated)


async def delete_host_calendar_rule(
    session: AsyncSession, user: User, unit_id: str, rule_id: str
) -> None:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_manage_calendar(session, user, unit)

    rule = await listings_repository.get_calendar_rule_by_id(
        session, unit_id, rule_id
    )
    if rule is None:
        raise NotFoundError("Calendar rule not found")
    if rule.reservation_id:
        raise ValidationError("Cannot delete a booking-related rule")

    await listings_repository.delete_calendar_rule(session, rule)


async def bulk_update_availability(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: BulkAvailabilityRequest,
) -> list[CalendarRuleResponse]:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_manage_calendar(session, user, unit)

    rules: list[tuple[date, date, str, str | None, int | None]] = []
    for item in request.rules:
        block_type = item.block_type
        if item.status == CalendarStatus.BLOCKED and not block_type:
            block_type = CalendarBlockType.MANUAL
        rules.append((item.date_from, item.date_to, item.status, block_type, None))

    created = await listings_repository.bulk_replace_calendar_rules(
        session, unit_id, rules
    )
    return [_to_calendar_rule_response(rule) for rule in created]


async def bulk_update_pricing(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: BulkPricingRequest,
) -> list[CalendarRuleResponse]:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_manage_calendar(session, user, unit)

    rules: list[tuple[date, date, str, str | None, int | None]] = [
        (
            item.date_from,
            item.date_to,
            CalendarStatus.AVAILABLE,
            None,
            item.price_override,
        )
        for item in request.rules
    ]

    created = await listings_repository.bulk_replace_calendar_rules(
        session, unit_id, rules
    )
    return [_to_calendar_rule_response(rule) for rule in created]


async def get_host_dashboard(
    session: AsyncSession, user: User
) -> HostDashboardStats:
    _assert_host(user)
    managed_unit_ids = await get_managed_unit_ids(session, user)
    stats = await listings_repository.get_host_dashboard_stats(
        session, user.id, unit_ids=managed_unit_ids
    )
    return HostDashboardStats(**stats)


async def get_host_reservation_calendar(
    session: AsyncSession,
    user: User,
    unit_id: str | None,
    check_in: date,
    check_out: date,
) -> HostReservationCalendarResponse:
    _assert_host(user)
    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")
    if (check_out - check_in).days > 365:
        raise ValidationError("Date range cannot exceed 365 days")

    managed_unit_ids = await get_managed_unit_ids(session, user)
    rows = await listings_repository.get_host_reservation_calendar(
        session, user.id, unit_id, check_in, check_out, unit_ids=managed_unit_ids
    )
    reservations = [
        HostReservationCalendarItem(
            reservation_id=row.id,
            unit_id=row.unit_id,
            guest_id=row.guest_id,
            status=row.status,
            check_in=row.check_in,
            check_out=row.check_out,
            total_amount_egp=row.total_amount_egp,
        )
        for row in rows
    ]
    return HostReservationCalendarResponse(
        unit_id=unit_id or "",
        check_in=check_in,
        check_out=check_out,
        reservations=reservations,
    )


async def generate_photo_presigned_url(
    session: AsyncSession,
    user: User,
    unit_id: str,
    filename: str,
    content_type: str,
) -> PhotoPresignResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_edit_listing(session, user, unit)

    if content_type not in _PHOTO_CONTENT_TYPES:
        raise ValidationError("Only JPG, PNG or WebP images are accepted")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    photo_key = f"listings/{unit_id}/photo_{uuid.uuid4().hex}.{ext}"

    client = _s3_client()
    upload_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_LISTINGS_BUCKET,
            "Key": photo_key,
            "ContentType": content_type,
        },
        ExpiresIn=_PHOTO_UPLOAD_TTL_SECONDS,
    )

    return PhotoPresignResponse(upload_url=upload_url, photo_key=photo_key)


def _to_photo_response(photo: Any) -> PhotoResponse:
    state = getattr(photo, "moderation_state", "live")
    return PhotoResponse(
        id=photo.id,
        unit_id=photo.unit_id,
        s3_key=photo.s3_key,
        url=photo.url,
        display_order=photo.display_order,
        is_cover=photo.is_cover,
        caption=photo.caption_ar,
        accessibility_feature=photo.accessibility_feature,
        moderation_state=state if isinstance(state, str) else "live",
    )


async def create_photo(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: PhotoCreate,
) -> PhotoResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_edit_listing(session, user, unit)

    # Photos on a LISTED unit are moderated: the new photo stays hidden
    # from guests until an admin approves the pending change-set.
    is_listed_edit = (
        unit.status == UnitStatus.LISTED and user.role != UserRole.ADMIN
    )

    if request.is_cover and not is_listed_edit:
        await listings_repository.clear_cover_flags(session, unit_id)

    photo = await listings_repository.create_photo(
        session,
        unit_id=unit_id,
        s3_key=request.s3_key,
        url=request.url,
        caption_ar=request.caption,
        is_cover=request.is_cover if not is_listed_edit else False,
        display_order=request.display_order,
        accessibility_feature=request.accessibility_feature,
    )
    if is_listed_edit:
        photo.moderation_state = "pending_add"
        session.add(photo)

    if request.is_cover:
        if is_listed_edit:
            from . import moderation

            moderation.stash_pending_changes(
                unit,
                unit.listing,
                {"cover_photo_id": photo.id},
                submitted_by=user.id,
            )
            session.add(unit.listing)
            await session.flush()
        else:
            await listings_repository.set_listing_cover_photo(
                session, unit_id, photo.id
            )

    return _to_photo_response(photo)


async def list_photos(
    session: AsyncSession,
    unit_id: str,
    viewer: User | None = None,
) -> list[PhotoResponse]:
    """Photos for a unit.

    Public viewers only see approved photos (pending_add hidden; a photo
    pending removal still shows until the removal is approved). The owner,
    co-hosts and admins see the full set with moderation_state so the UI
    can badge pending items.
    """
    photos = await listings_repository.get_photos_by_unit(session, unit_id)
    include_pending = False
    if viewer is not None:
        if viewer.role == UserRole.ADMIN:
            include_pending = True
        elif viewer.role == UserRole.STAFF:
            from app.auth.staff import has_permission

            include_pending = await has_permission(
                session, viewer, "listings"
            )
        else:
            unit_result = await session.execute(
                select(Unit.host_id).where(Unit.id == unit_id)
            )
            host_id = unit_result.scalar_one_or_none()
            if host_id == viewer.id:
                include_pending = True
            elif host_id is not None:
                from app.listings.cohost_models import UnitCoHost

                cohost = await session.execute(
                    select(UnitCoHost.id).where(
                        UnitCoHost.unit_id == unit_id,
                        UnitCoHost.co_host_user_id == viewer.id,
                        UnitCoHost.is_active.is_(True),
                    )
                )
                include_pending = cohost.first() is not None
    return [
        _to_photo_response(p)
        for p in photos
        if include_pending or p.moderation_state != "pending_add"
    ]


async def set_cover_photo(
    session: AsyncSession,
    user: User,
    unit_id: str,
    photo_id: str,
) -> PhotoResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_edit_listing(session, user, unit)

    photo = await listings_repository.get_photo_by_id(session, unit_id, photo_id)
    if photo is None:
        raise NotFoundError("Photo not found")

    is_listed_edit = (
        unit.status == UnitStatus.LISTED and user.role != UserRole.ADMIN
    )
    if is_listed_edit:
        # Cover changes are guest-facing — stash for admin review.
        from . import moderation

        moderation.stash_pending_changes(
            unit,
            unit.listing,
            {"cover_photo_id": photo.id},
            submitted_by=user.id,
        )
        session.add(unit.listing)
        await session.flush()
        await session.refresh(photo)
        return _to_photo_response(photo)

    await listings_repository.clear_cover_flags(session, unit_id)
    photo.is_cover = True
    session.add(photo)
    await session.flush()
    await listings_repository.set_listing_cover_photo(session, unit_id, photo_id)
    await session.refresh(photo)
    return _to_photo_response(photo)


async def reorder_photos(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: PhotoReorderRequest,
) -> list[PhotoResponse]:
    """Update photo display order. Photo ordering is listing content, so it
    uses the same permission as listing edits (owner/admin/full_access)."""
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_edit_listing(session, user, unit)

    photos = await listings_repository.get_photos_by_unit(session, unit_id)
    photos_by_id = {p.id: p for p in photos}

    seen: set[str] = set()
    for item in request.photo_orders:
        if item.photo_id in seen:
            raise ValidationError(f"Duplicate photo_id: {item.photo_id}")
        seen.add(item.photo_id)
        photo = photos_by_id.get(item.photo_id)
        if photo is None:
            raise NotFoundError("Photo not found")
        photo.display_order = item.display_order
        session.add(photo)
    await session.flush()

    photos.sort(key=lambda p: p.display_order)
    return [_to_photo_response(p) for p in photos]


async def delete_photo(
    session: AsyncSession,
    user: User,
    unit_id: str,
    photo_id: str,
) -> None:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_edit_listing(session, user, unit)

    photo = await listings_repository.get_photo_by_id(session, unit_id, photo_id)
    if photo is None:
        raise NotFoundError("Photo not found")

    is_listed_edit = (
        unit.status == UnitStatus.LISTED and user.role != UserRole.ADMIN
    )
    if is_listed_edit:
        # Removal on a published listing is moderated: the photo stays
        # public until an admin approves the removal.
        photo.moderation_state = "pending_remove"
        session.add(photo)
        await session.flush()
        return

    if photo.is_cover:
        await listings_repository.clear_listing_cover_photo(session, unit_id, photo_id)

    await listings_repository.delete_photo(session, photo)
