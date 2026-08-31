import uuid
from datetime import date, timedelta
from typing import Any

import boto3
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.config import settings
from app.listings.constants import CalendarBlockType, CalendarStatus, UnitStatus
from app.listings.models import Unit, UnitListing
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError

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
    ListingCreate,
    ListingResponse,
    ListingSearchFilters,
    ListingSearchResponse,
    ListingSearchResult,
    ListingUpdate,
    PaginationInfo,
    PhotoCreate,
    PhotoPresignResponse,
    PhotoResponse,
)

_PHOTO_UPLOAD_TTL_SECONDS = 900


def _s3_client() -> Any:
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
    host: User | None = None,
) -> ListingResponse:
    return ListingResponse(
        id=unit.id,
        host_id=unit.host_id,
        host_display_name=host.display_name if host else None,
        host_kyc_status=host.kyc_status if host else None,
        host_joined_at=str(host.created_at) if host else None,
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
        house_rules=listing.house_rules,
        check_in_instructions=listing.check_in_instructions,
        policies=listing.policies,
        base_price_egp=listing.base_price_egp,
        cleaning_fee_egp=listing.cleaning_fee_egp,
        cancellation_policy=listing.cancellation_policy,
        price=listing.base_price_egp,
        currency=listing.currency,
        weekend_mult=listing.weekend_mult,
        peak_mult=listing.peak_mult,
        min_nights=listing.min_nights,
        max_nights=listing.max_nights,
        cover_image=_cover_image_url(unit, listing),
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
        "bathrooms": unit.bathrooms,
        "amenities": listing.amenities,
        "cultural_tags": listing.cultural_tags,
        "house_rules": listing.house_rules,
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

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    lat, lng = request.lat, request.lng
    return _to_listing_response(unit, listing, lat, lng)


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
    return _to_listing_response(unit, listing, lat, lng, host)


async def get_host_listing_detail(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("Only the listing owner can view it")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def get_host_listings(
    session: AsyncSession, user: User
) -> list[ListingResponse]:
    _assert_host(user)
    units = await listings_repository.get_host_units_with_listings(session, user.id)
    results: list[ListingResponse] = []
    for unit in units:
        listing = unit.listing
        if listing is None:
            continue
        lat, lng = await _fetch_coordinates(session, unit)
        results.append(_to_listing_response(unit, listing, lat, lng))
    return results


async def submit_for_review(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    _assert_host(user)
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")
    if unit.status not in (UnitStatus.DRAFT, UnitStatus.REJECTED, UnitStatus.UNLISTED):
        raise ValidationError("Only draft or rejected listings can be submitted for review")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")

    if not listing.title_ar or not listing.description_ar:
        raise ValidationError("Title and description are required before submitting")
    if listing.base_price_egp < 100:
        raise ValidationError("Price must be at least 100 EGP")

    unit = await listings_repository.set_unit_status(
        session, unit, UnitStatus.PENDING_VERIFICATION
    )
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def get_pending_listings(
    session: AsyncSession, user: User
) -> list[ListingResponse]:
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can view pending listings")
    units = await listings_repository.get_units_by_status(
        session, UnitStatus.PENDING_VERIFICATION
    )
    results: list[ListingResponse] = []
    for unit in units:
        listing = unit.listing
        if listing is None:
            continue
        lat, lng = await _fetch_coordinates(session, unit)
        results.append(_to_listing_response(unit, listing, lat, lng))
    return results


async def approve_listing(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can approve listings")
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    if unit.status != UnitStatus.PENDING_VERIFICATION:
        raise ValidationError("Only pending listings can be approved")

    unit = await listings_repository.set_unit_status(session, unit, UnitStatus.LISTED)
    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing details not found")
    lat, lng = await _fetch_coordinates(session, unit)
    return _to_listing_response(unit, listing, lat, lng)


async def reject_listing(
    session: AsyncSession, user: User, unit_id: str
) -> ListingResponse:
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("Only admins can reject listings")
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    if unit.status != UnitStatus.PENDING_VERIFICATION:
        raise ValidationError("Only pending listings can be rejected")

    unit = await listings_repository.set_unit_status(session, unit, UnitStatus.REJECTED)
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
    if unit.host_id != user.id:
        raise AuthorizationError("Only the listing owner can update it")

    listing = unit.listing
    if listing is None:
        raise NotFoundError("Listing not found")

    if request.beds is not None:
        unit.beds = request.beds
    if request.address is not None:
        unit.address = request.address
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

    data = [
        _to_search_result(unit, listing, lat, lng, hosts_map.get(unit.host_id))
        for unit, listing, lat, lng in rows
    ]
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

    days: list[CalendarDay] = []
    current = check_in
    while current < check_out:
        rule = pricing.find_rule_for_day(rules, current)
        status = str(rule.status) if rule else str(CalendarStatus.AVAILABLE)
        block_type = rule.block_type if rule else None
        price = pricing.get_day_price(listing, rule, current)
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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")
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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    if unit is None or unit.host_id != user.id:
        raise NotFoundError("Listing not found")

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
    stats = await listings_repository.get_host_dashboard_stats(session, user.id)
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

    rows = await listings_repository.get_host_reservation_calendar(
        session, user.id, unit_id, check_in, check_out
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
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("Only the listing owner or admin can upload photos")

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
    return PhotoResponse(
        id=photo.id,
        unit_id=photo.unit_id,
        s3_key=photo.s3_key,
        url=photo.url,
        display_order=photo.display_order,
        is_cover=photo.is_cover,
        caption=photo.caption_ar,
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
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("Only the listing owner or admin can upload photos")

    if request.is_cover:
        await listings_repository.clear_cover_flags(session, unit_id)

    photo = await listings_repository.create_photo(
        session,
        unit_id=unit_id,
        s3_key=request.s3_key,
        url=request.url,
        caption_ar=request.caption,
        is_cover=request.is_cover,
        display_order=request.display_order,
    )

    if request.is_cover:
        await listings_repository.set_listing_cover_photo(session, unit_id, photo.id)

    return _to_photo_response(photo)


async def list_photos(
    session: AsyncSession,
    unit_id: str,
) -> list[PhotoResponse]:
    photos = await listings_repository.get_photos_by_unit(session, unit_id)
    return [_to_photo_response(p) for p in photos]


async def set_cover_photo(
    session: AsyncSession,
    user: User,
    unit_id: str,
    photo_id: str,
) -> PhotoResponse:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("Only the listing owner or admin can manage photos")

    photo = await listings_repository.get_photo_by_id(session, unit_id, photo_id)
    if photo is None:
        raise NotFoundError("Photo not found")

    await listings_repository.clear_cover_flags(session, unit_id)
    photo.is_cover = True
    session.add(photo)
    await session.flush()
    await listings_repository.set_listing_cover_photo(session, unit_id, photo_id)
    await session.refresh(photo)
    return _to_photo_response(photo)


async def delete_photo(
    session: AsyncSession,
    user: User,
    unit_id: str,
    photo_id: str,
) -> None:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    if unit.host_id != user.id and user.role != UserRole.ADMIN:
        raise AuthorizationError("Only the listing owner or admin can manage photos")

    photo = await listings_repository.get_photo_by_id(session, unit_id, photo_id)
    if photo is None:
        raise NotFoundError("Photo not found")

    if photo.is_cover:
        await listings_repository.clear_listing_cover_photo(session, unit_id, photo_id)

    await listings_repository.delete_photo(session, photo)


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

    listings = [
        ListingSearchResult(**_to_search_result(unit, listing, float(lat), float(lng), host))
        for unit, listing, lat, lng in rows
    ]

    return HostProfileResponse(
        id=host.id,
        display_name=host.display_name,
        kyc_status=host.kyc_status,
        joined_at=str(host.created_at) if host.created_at else None,
        listings=listings,
    )
