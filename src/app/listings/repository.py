from datetime import date
from typing import Any
from uuid import uuid4

from geoalchemy2.elements import WKTElement
from sqlalchemy import Select, delete, exists, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.listings.models import CalendarRule, Unit, UnitListing, UnitPhoto

from .constants import CalendarStatus, UnitStatus
from .schemas import ListingCreate, ListingSearchFilters, ListingUpdate


async def create_listing(
    session: AsyncSession, host_id: str, request: ListingCreate
) -> Unit:
    unit = Unit(
        host_id=host_id,
        property_type=request.property_type,
        status=UnitStatus.PENDING_VERIFICATION,
        coordinates=WKTElement(
            f"POINT({request.lng} {request.lat})", srid=4326
        ),
        governorate=request.governorate,
        city=request.city,
        district=request.district,
        google_place_id=request.google_place_id,
        address=request.address,
        max_guests=request.max_guests,
        bedrooms=request.bedrooms,
        beds=request.beds,
        bathrooms=request.bathrooms,
    )
    session.add(unit)
    await session.flush()
    await session.refresh(unit)

    listing = UnitListing(
        unit_id=unit.id,
        title_ar=request.title_ar,
        title_en=request.title_en,
        description_ar=request.description_ar,
        description_en=request.description_en,
        amenities=request.amenities,
        cultural_tags=request.cultural_tags,
        house_rules=request.house_rules,
        check_in_instructions=request.check_in_instructions,
        policies=request.policies,
        base_price_egp=request.base_price_egp,
        cleaning_fee_egp=request.cleaning_fee_egp,
        cancellation_policy=request.cancellation_policy,
        category=request.category,
        weekend_mult=request.weekend_mult,
        peak_mult=request.peak_mult,
        min_nights=request.min_nights,
        max_nights=request.max_nights,
        country=request.country,
        currency=request.currency,
        cover_photo_id=request.cover_photo_id,
    )
    session.add(listing)
    await session.flush()
    await session.refresh(listing)

    return unit


async def get_unit_with_listing(
    session: AsyncSession, unit_id: str
) -> Unit | None:
    result = await session.execute(
        select(Unit)
        .options(selectinload(Unit.listing), selectinload(Unit.photos))
        .where(Unit.id == unit_id)
    )
    return result.scalar_one_or_none()


async def get_host_unit_ids(session: AsyncSession, host_id: str) -> list[str]:
    result = await session.execute(
        select(Unit.id).where(Unit.host_id == host_id)
    )
    return [row[0] for row in result.all()]


async def get_host_units_with_listings(
    session: AsyncSession, host_id: str
) -> list[Unit]:
    result = await session.execute(
        select(Unit)
        .options(selectinload(Unit.listing), selectinload(Unit.photos))
        .where(Unit.host_id == host_id)
        .order_by(Unit.created_at.desc())
    )
    return list(result.scalars().all())


async def get_units_by_status(
    session: AsyncSession, status: str
) -> list[Unit]:
    result = await session.execute(
        select(Unit)
        .options(selectinload(Unit.listing), selectinload(Unit.photos))
        .where(Unit.status == status)
        .order_by(Unit.created_at.desc())
    )
    return list(result.scalars().all())


async def update_unit_listing(
    session: AsyncSession, unit: Unit, listing: UnitListing, request: ListingUpdate
) -> UnitListing:
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(listing, field):
            setattr(listing, field, value)

    session.add(listing)
    await session.flush()
    await session.refresh(listing)
    return listing


def _build_search_statement(filters: ListingSearchFilters) -> Select[Any]:
    lat_col = func.ST_Y(Unit.coordinates).label("lat")
    lng_col = func.ST_X(Unit.coordinates).label("lng")

    stmt = (
        select(Unit, UnitListing, lat_col, lng_col)
        .options(selectinload(Unit.photos))
        .join(UnitListing, Unit.id == UnitListing.unit_id)
        .where(Unit.status == UnitStatus.LISTED)
    )

    if filters.sw_lat is not None and filters.sw_lng is not None and filters.ne_lat is not None and filters.ne_lng is not None:
        envelope = func.ST_MakeEnvelope(
            filters.sw_lng, filters.sw_lat, filters.ne_lng, filters.ne_lat, 4326
        )
        stmt = stmt.where(func.ST_Within(Unit.coordinates, envelope))

    if filters.lat is not None and filters.lng is not None and filters.radius_km is not None:
        center_wkt = f"SRID=4326;POINT({filters.lng} {filters.lat})"
        center_geog = func.ST_GeogFromText(center_wkt, 4326)
        unit_wkt = func.ST_AsText(Unit.coordinates)
        unit_geog = func.ST_GeogFromText(unit_wkt, 4326)
        stmt = stmt.where(
            func.ST_DWithin(unit_geog, center_geog, filters.radius_km * 1000)
        )

    if filters.check_in is not None and filters.check_out is not None:
        blocked = exists().where(
            CalendarRule.unit_id == Unit.id,
            CalendarRule.status.in_(
                [CalendarStatus.BLOCKED, CalendarStatus.BOOKED, CalendarStatus.HOLD]
            ),
            CalendarRule.date_from < filters.check_out,
            CalendarRule.date_to > filters.check_in,
        )
        stmt = stmt.where(~blocked)

    if filters.min_price is not None:
        stmt = stmt.where(UnitListing.base_price_egp >= filters.min_price)
    if filters.max_price is not None:
        stmt = stmt.where(UnitListing.base_price_egp <= filters.max_price)

    if filters.property_type:
        stmt = stmt.where(Unit.property_type.in_(filters.property_type))

    if filters.guests is not None:
        stmt = stmt.where(Unit.max_guests >= filters.guests)

    if filters.amenities:
        stmt = stmt.where(UnitListing.amenities.op("&&")(filters.amenities))

    if filters.cultural_tags:
        stmt = stmt.where(UnitListing.cultural_tags.op("&&")(filters.cultural_tags))

    if filters.city:
        stmt = stmt.where(func.lower(Unit.city) == filters.city.lower())

    if filters.governorate:
        stmt = stmt.where(func.lower(Unit.governorate) == filters.governorate.lower())

    if filters.q:
        tsquery = func.plainto_tsquery("simple", filters.q)
        stmt = stmt.where(UnitListing.search_vector.bool_op("@@")(tsquery))

    stmt = stmt.order_by(Unit.created_at.desc(), Unit.id.desc())
    return stmt


async def search_listings(
    session: AsyncSession, filters: ListingSearchFilters, offset: int, limit: int
) -> tuple[list[tuple[Unit, UnitListing, float, float]], int]:
    stmt = _build_search_statement(filters)

    count_stmt = stmt.with_only_columns(func.count(Unit.id)).order_by(None)
    total = await session.scalar(count_stmt)
    total = total or 0

    stmt = stmt.offset(offset).limit(limit)
    result = await session.execute(stmt)
    rows: list[tuple[Unit, UnitListing, float, float]] = []
    for unit, listing, lat, lng in result.all():
        rows.append((unit, listing, float(lat), float(lng)))

    return rows, total


async def get_calendar_rules_in_range(
    session: AsyncSession, unit_id: str, check_in: date, check_out: date
) -> list[CalendarRule]:
    result = await session.execute(
        select(CalendarRule)
        .where(
            CalendarRule.unit_id == unit_id,
            CalendarRule.date_from < check_out,
            CalendarRule.date_to > check_in,
        )
        .order_by(CalendarRule.date_from)
    )
    return list(result.scalars().all())


async def set_unit_status(
    session: AsyncSession, unit: Unit, status: str
) -> Unit:
    unit.status = status
    session.add(unit)
    await session.flush()
    return unit


async def get_calendar_rule_by_id(
    session: AsyncSession, unit_id: str, rule_id: str
) -> CalendarRule | None:
    result = await session.execute(
        select(CalendarRule).where(
            CalendarRule.id == rule_id, CalendarRule.unit_id == unit_id
        )
    )
    return result.scalar_one_or_none()


async def create_calendar_rule(
    session: AsyncSession,
    unit_id: str,
    date_from: date,
    date_to: date,
    status: str,
    block_type: str | None,
    price_override: int | None,
) -> CalendarRule:
    rule = CalendarRule(
        id=str(uuid4()),
        unit_id=unit_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        block_type=block_type,
        price_override=price_override,
    )
    session.add(rule)
    await session.flush()
    await session.refresh(rule)
    return rule


async def delete_calendar_rule(
    session: AsyncSession, rule: CalendarRule
) -> None:
    await session.delete(rule)
    await session.flush()


async def update_calendar_rule(
    session: AsyncSession,
    rule: CalendarRule,
    date_from: date | None,
    date_to: date | None,
    status: str | None,
    block_type: str | None,
    price_override: int | None,
) -> CalendarRule:
    if date_from is not None:
        rule.date_from = date_from
    if date_to is not None:
        rule.date_to = date_to
    if status is not None:
        rule.status = status
    if block_type is not None:
        rule.block_type = block_type
    if price_override is not None:
        rule.price_override = price_override
    session.add(rule)
    await session.flush()
    await session.refresh(rule)
    return rule


async def bulk_replace_calendar_rules(
    session: AsyncSession,
    unit_id: str,
    rules: list[tuple[date, date, str, str | None, int | None]],
) -> list[CalendarRule]:
    # Remove any existing host-managed rules that overlap the requested ranges.
    if rules:
        date_min = min(r[0] for r in rules)
        date_max = max(r[1] for r in rules)
        await session.execute(
            delete(CalendarRule).where(
                CalendarRule.unit_id == unit_id,
                CalendarRule.reservation_id.is_(None),
                CalendarRule.date_from < date_max,
                CalendarRule.date_to > date_min,
            )
        )

    created: list[CalendarRule] = []
    for date_from, date_to, status, block_type, price_override in rules:
        rule = CalendarRule(
            id=str(uuid4()),
            unit_id=unit_id,
            date_from=date_from,
            date_to=date_to,
            status=status,
            block_type=block_type,
            price_override=price_override,
        )
        session.add(rule)
        created.append(rule)
    await session.flush()
    for rule in created:
        await session.refresh(rule)
    return created


async def get_host_dashboard_stats(
    session: AsyncSession, host_id: str
) -> dict[str, Any]:
    from app.reservations.constants import ReservationStatus
    from app.reservations.models import Reservation

    unit_ids = await get_host_unit_ids(session, host_id)
    if not unit_ids:
        return {
            "total_listings": 0,
            "listed_listings": 0,
            "total_reservations": 0,
            "upcoming_reservations": 0,
            "total_revenue_egp": 0,
            "occupancy_rate_pct": 0.0,
        }

    total_listings = await session.scalar(
        select(func.count(Unit.id)).where(Unit.host_id == host_id)
    )
    total_listings = total_listings or 0

    listed_listings = await session.scalar(
        select(func.count(Unit.id)).where(
            Unit.host_id == host_id, Unit.status == UnitStatus.LISTED
        )
    )
    listed_listings = listed_listings or 0

    total_reservations = await session.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.unit_id.in_(unit_ids)
        )
    )
    total_reservations = total_reservations or 0

    today = date.today()
    upcoming_reservations = await session.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.unit_id.in_(unit_ids),
            Reservation.check_in >= today,
            Reservation.status == ReservationStatus.CONFIRMED,
        )
    )
    upcoming_reservations = upcoming_reservations or 0

    revenue = await session.scalar(
        select(func.coalesce(func.sum(Reservation.host_amount_egp), 0)).where(
            Reservation.unit_id.in_(unit_ids),
            Reservation.status == ReservationStatus.CONFIRMED,
        )
    )
    revenue = revenue or 0

    total_nights_raw = await session.scalar(
        select(
            func.coalesce(
                func.sum(
                    Reservation.check_out - Reservation.check_in
                ),
                0,
            )
        ).where(
            Reservation.unit_id.in_(unit_ids),
            Reservation.status == ReservationStatus.CONFIRMED,
        )
    )
    total_nights: int = total_nights_raw if total_nights_raw is not None else 0  # type: ignore[assignment]

    # Approximate available nights over a 365-day horizon for all host units.
    listed_units_count = await session.scalar(
        select(func.count(Unit.id)).where(
            Unit.host_id == host_id, Unit.status == UnitStatus.LISTED
        )
    )
    listed_units_count = listed_units_count or 0
    available_nights = listed_units_count * 365
    occupancy_rate = (
        (total_nights / available_nights * 100) if available_nights else 0.0
    )

    return {
        "total_listings": total_listings,
        "listed_listings": listed_listings,
        "total_reservations": total_reservations,
        "upcoming_reservations": upcoming_reservations,
        "total_revenue_egp": int(revenue),
        "occupancy_rate_pct": round(occupancy_rate, 2),
    }


async def get_host_reservation_calendar(
    session: AsyncSession,
    host_id: str,
    unit_id: str | None,
    check_in: date,
    check_out: date,
) -> list[Any]:
    from app.reservations.models import Reservation

    unit_ids = await get_host_unit_ids(session, host_id)
    if not unit_ids:
        return []
    if unit_id is not None and unit_id not in unit_ids:
        return []
    filter_unit_ids = [unit_id] if unit_id else unit_ids

    result = await session.execute(
        select(
            Reservation.id,
            Reservation.unit_id,
            Reservation.guest_id,
            Reservation.status,
            Reservation.check_in,
            Reservation.check_out,
            Reservation.total_amount_egp,
        ).where(
            Reservation.unit_id.in_(filter_unit_ids),
            Reservation.check_in < check_out,
            Reservation.check_out > check_in,
        )
    )
    return list(result.all())


async def create_photo(
    session: AsyncSession,
    unit_id: str,
    s3_key: str,
    url: str,
    caption_ar: str | None,
    is_cover: bool,
    display_order: int,
) -> UnitPhoto:
    photo = UnitPhoto(
        id=str(uuid4()),
        unit_id=unit_id,
        s3_key=s3_key,
        url=url,
        caption_ar=caption_ar,
        is_cover=is_cover,
        display_order=display_order,
    )
    session.add(photo)
    await session.flush()
    await session.refresh(photo)
    return photo


async def get_photos_by_unit(
    session: AsyncSession, unit_id: str
) -> list[UnitPhoto]:
    result = await session.execute(
        select(UnitPhoto)
        .where(UnitPhoto.unit_id == unit_id)
        .order_by(UnitPhoto.display_order)
    )
    return list(result.scalars().all())


async def get_photo_by_id(
    session: AsyncSession, unit_id: str, photo_id: str
) -> UnitPhoto | None:
    result = await session.execute(
        select(UnitPhoto).where(
            UnitPhoto.id == photo_id, UnitPhoto.unit_id == unit_id
        )
    )
    return result.scalar_one_or_none()


async def clear_cover_flags(session: AsyncSession, unit_id: str) -> None:
    await session.execute(
        update(UnitPhoto)
        .where(UnitPhoto.unit_id == unit_id, UnitPhoto.is_cover.is_(True))
        .values(is_cover=False)
    )
    await session.flush()


async def set_listing_cover_photo(
    session: AsyncSession, unit_id: str, photo_id: str
) -> None:
    await session.execute(
        update(UnitListing)
        .where(UnitListing.unit_id == unit_id)
        .values(cover_photo_id=photo_id)
    )
    await session.flush()


async def clear_listing_cover_photo(
    session: AsyncSession, unit_id: str, photo_id: str
) -> None:
    await session.execute(
        update(UnitListing)
        .where(
            UnitListing.unit_id == unit_id,
            UnitListing.cover_photo_id == photo_id,
        )
        .values(cover_photo_id=None)
    )
    await session.flush()


async def delete_photo(session: AsyncSession, photo: UnitPhoto) -> None:
    await session.delete(photo)
    await session.flush()
