"""Host Operating System services.

Orchestrates existing bookings, payments, listings, messages, and
reviews services through a host lens. Does NOT duplicate business logic.
"""

from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings import repository as bookings_repository
from app.bookings.constants import BookingStatus
from app.bookings.models import Booking
from app.bookings.services import _compute_stay_phase
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.payments import repository as payments_repository
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError

from . import repository as host_repository
from . import schemas as host_schemas
from .constants import CoHostPermissionScope, HostTodayItemType, ListingReadinessStatus
from .permissions import (
    assert_can_access_unit,
    assert_owner_or_admin,
    get_managed_unit_ids,
)


def _assert_host_or_cohost(user: User) -> None:
    if user.role not in (UserRole.HOST, UserRole.ADMIN):
        raise AuthorizationError("Only hosts can access the host dashboard")


def _guest_name(user: User | None) -> str:
    if user is None:
        return "Guest"
    return user.display_name or "Guest"


async def _resolve_guest(
    session: AsyncSession, guest_id: str
) -> User | None:
    result = await session.execute(select(User).where(User.id == guest_id))
    return result.scalar_one_or_none()


async def _resolve_host(
    session: AsyncSession, host_id: str
) -> User | None:
    result = await session.execute(select(User).where(User.id == host_id))
    return result.scalar_one_or_none()


# ============================================================
# HOST TODAY
# ============================================================

async def get_host_today(
    session: AsyncSession, user: User
) -> host_schemas.HostTodayResponse:
    """Build the host's operational "what do I need to do today?" view.

    Uses the live bookings path. No fake counters.
    """
    _assert_host_or_cohost(user)
    today = date.today()
    managed_unit_ids = await get_managed_unit_ids(session, user)
    if not managed_unit_ids:
        return host_schemas.HostTodayResponse(items=[], summary={})

    # Get all relevant bookings for managed units
    stmt = (
        select(Booking)
        .options(selectinload(Booking.unit).selectinload(Unit.listing))
        .where(Booking.unit_id.in_(managed_unit_ids))
        .where(
            Booking.status.in_([
                BookingStatus.REQUESTED,
                BookingStatus.ACCEPTED,
                BookingStatus.CONFIRMED,
            ])
        )
        .order_by(Booking.check_in.asc())
    )
    result = await session.execute(stmt)
    bookings = list(result.scalars().all())

    items: list[host_schemas.HostTodayItem] = []
    guest_ids = {b.guest_id for b in bookings}
    guests_map: dict[str, User] = {}
    if guest_ids:
        guest_result = await session.execute(
            select(User).where(User.id.in_(guest_ids))
        )
        guests_map = {g.id: g for g in guest_result.scalars().all()}

    for booking in bookings:
        guest = guests_map.get(booking.guest_id)
        guest_name = _guest_name(guest)
        unit_title = None
        if booking.unit is not None and booking.unit.listing is not None:
            unit_title = booking.unit.listing.title_ar or booking.unit.listing.title_en

        phase = _compute_stay_phase(booking)
        status = BookingStatus(booking.status)

        # Check-in today
        if (
            status == BookingStatus.CONFIRMED
            and booking.check_in == today
            and booking.checked_in_at is None
        ):
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.CHECK_IN_TODAY,
                booking_id=booking.id,
                unit_id=booking.unit_id,
                guest_id=booking.guest_id,
                guest_name=guest_name,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
                stay_phase=phase,
                title=f"Check-in: {guest_name}",
                subtitle=unit_title,
                priority=10,
            ))

        # Check-out today
        if (
            status == BookingStatus.CONFIRMED
            and booking.check_out == today
            and booking.checked_in_at is not None
            and booking.checked_out_at is None
        ):
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.CHECK_OUT_TODAY,
                booking_id=booking.id,
                unit_id=booking.unit_id,
                guest_id=booking.guest_id,
                guest_name=guest_name,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
                stay_phase=phase,
                title=f"Check-out: {guest_name}",
                subtitle=unit_title,
                priority=9,
            ))

        # Current stay (checked in, not checked out, not checking out today)
        if (
            status == BookingStatus.CONFIRMED
            and booking.checked_in_at is not None
            and booking.checked_out_at is None
            and booking.check_out != today
        ):
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.CURRENT_STAY,
                booking_id=booking.id,
                unit_id=booking.unit_id,
                guest_id=booking.guest_id,
                guest_name=guest_name,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
                stay_phase=phase,
                title=f"Staying: {guest_name}",
                subtitle=unit_title,
                priority=5,
            ))

        # Pending request (needs host action)
        if status == BookingStatus.REQUESTED:
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.PENDING_REQUEST,
                booking_id=booking.id,
                unit_id=booking.unit_id,
                guest_id=booking.guest_id,
                guest_name=guest_name,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
                stay_phase=phase,
                title=f"Booking request: {guest_name}",
                subtitle=unit_title,
                priority=8,
            ))

        # Upcoming arrival (check-in within 3 days, not yet checked in)
        if (
            status == BookingStatus.CONFIRMED
            and booking.checked_in_at is None
            and today < booking.check_in <= today + timedelta(days=3)
            and booking.check_in != today
        ):
            days_until = (booking.check_in - today).days
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.UPCOMING_ARRIVAL,
                booking_id=booking.id,
                unit_id=booking.unit_id,
                guest_id=booking.guest_id,
                guest_name=guest_name,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
                stay_phase=phase,
                title=f"Arriving in {days_until}d: {guest_name}",
                subtitle=unit_title,
                priority=6,
            ))

        # Upcoming departure (check-out within 2 days, currently staying)
        if (
            status == BookingStatus.CONFIRMED
            and booking.checked_in_at is not None
            and booking.checked_out_at is None
            and today < booking.check_out <= today + timedelta(days=2)
            and booking.check_out != today
        ):
            days_until = (booking.check_out - today).days
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.UPCOMING_DEPARTURE,
                booking_id=booking.id,
                unit_id=booking.unit_id,
                guest_id=booking.guest_id,
                guest_name=guest_name,
                check_in=booking.check_in,
                check_out=booking.check_out,
                status=booking.status,
                stay_phase=phase,
                title=f"Departing in {days_until}d: {guest_name}",
                subtitle=unit_title,
                priority=7,
            ))

    # Unread messages count
    unread_count = await host_repository.get_host_unread_conversations_count(
        session, user.id
    )
    if unread_count > 0:
        items.append(host_schemas.HostTodayItem(
            item_type=HostTodayItemType.UNREAD_MESSAGE,
            title=f"{unread_count} unread message{'s' if unread_count != 1 else ''}",
            priority=4,
        ))

    # Incomplete listings
    incomplete_stmt = (
        select(Unit, UnitListing)
        .join(UnitListing, UnitListing.unit_id == Unit.id)
        .where(
            Unit.host_id == user.id,
            Unit.status.in_([UnitStatus.DRAFT, UnitStatus.UNLISTED]),
        )
    )
    incomplete_result = await session.execute(incomplete_stmt)
    incomplete_rows = incomplete_result.all()
    for unit, listing in incomplete_rows:
        readiness = await compute_listing_readiness(session, unit, listing)
        if readiness.status == ListingReadinessStatus.ACTION_REQUIRED:
            items.append(host_schemas.HostTodayItem(
                item_type=HostTodayItemType.INCOMPLETE_LISTING,
                unit_id=unit.id,
                title=f"Listing incomplete: {listing.title_ar or listing.title_en}",
                subtitle=f"{len(readiness.missing_items)} items need attention",
                priority=3,
            ))

    # Sort by priority (descending)
    items.sort(key=lambda x: x.priority, reverse=True)

    summary = {
        "check_ins_today": sum(1 for i in items if i.item_type == HostTodayItemType.CHECK_IN_TODAY),
        "check_outs_today": sum(1 for i in items if i.item_type == HostTodayItemType.CHECK_OUT_TODAY),
        "current_stays": sum(1 for i in items if i.item_type == HostTodayItemType.CURRENT_STAY),
        "pending_requests": sum(1 for i in items if i.item_type == HostTodayItemType.PENDING_REQUEST),
        "unread_messages": unread_count,
        "incomplete_listings": sum(1 for i in items if i.item_type == HostTodayItemType.INCOMPLETE_LISTING),
    }

    return host_schemas.HostTodayResponse(items=items, summary=summary)


# ============================================================
# HOST RESERVATIONS
# ============================================================

async def list_host_reservations(
    session: AsyncSession,
    user: User,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[host_schemas.HostReservationSummary]:
    """List reservations for the host's units (live bookings path)."""
    _assert_host_or_cohost(user)
    managed_unit_ids = await get_managed_unit_ids(session, user)
    if not managed_unit_ids:
        return []

    stmt = (
        select(Booking)
        .options(selectinload(Booking.unit).selectinload(Unit.listing))
        .where(Booking.unit_id.in_(managed_unit_ids))
        .order_by(Booking.check_in.desc(), Booking.id.desc())
        .offset(offset)
        .limit(limit)
    )
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    result = await session.execute(stmt)
    bookings = list(result.scalars().all())

    guest_ids = {b.guest_id for b in bookings}
    guests_map: dict[str, User] = {}
    if guest_ids:
        guest_result = await session.execute(
            select(User).where(User.id.in_(guest_ids))
        )
        guests_map = {g.id: g for g in guest_result.scalars().all()}

    summaries: list[host_schemas.HostReservationSummary] = []
    for booking in bookings:
        guest = guests_map.get(booking.guest_id)
        unit_title = None
        if booking.unit is not None and booking.unit.listing is not None:
            unit_title = booking.unit.listing.title_ar or booking.unit.listing.title_en
        summaries.append(host_schemas.HostReservationSummary(
            id=booking.id,
            unit_id=booking.unit_id,
            unit_title=unit_title,
            guest_id=booking.guest_id,
            guest_name=_guest_name(guest),
            guest_phone=guest.phone_number if guest else None,
            status=booking.status,
            stay_phase=_compute_stay_phase(booking),
            check_in=booking.check_in,
            check_out=booking.check_out,
            adults=booking.adults,
            children=booking.children,
            infants=booking.infants,
            requested_at=booking.requested_at,
            accepted_at=booking.accepted_at,
            cancelled_at=booking.cancelled_at,
            checked_in_at=booking.checked_in_at,
            checked_out_at=booking.checked_out_at,
            cancel_reason=booking.cancel_reason,
        ))
    return summaries


async def get_host_reservation_detail(
    session: AsyncSession, user: User, booking_id: str
) -> host_schemas.HostReservationDetail:
    """Full reservation detail with payment and property context."""
    _assert_host_or_cohost(user)
    booking = await bookings_repository.get_booking_or_raise(session, booking_id)

    # Authorization: must be able to access the unit
    if booking.unit is None:
        raise NotFoundError("Booking unit not found")
    await assert_can_access_unit(session, user, booking.unit)

    guest = await _resolve_guest(session, booking.guest_id)
    unit_title = None
    if booking.unit.listing is not None:
        unit_title = booking.unit.listing.title_ar or booking.unit.listing.title_en

    summary = host_schemas.HostReservationSummary(
        id=booking.id,
        unit_id=booking.unit_id,
        unit_title=unit_title,
        guest_id=booking.guest_id,
        guest_name=_guest_name(guest),
        guest_phone=guest.phone_number if guest else None,
        status=booking.status,
        stay_phase=_compute_stay_phase(booking),
        check_in=booking.check_in,
        check_out=booking.check_out,
        adults=booking.adults,
        children=booking.children,
        infants=booking.infants,
        requested_at=booking.requested_at,
        accepted_at=booking.accepted_at,
        cancelled_at=booking.cancelled_at,
        checked_in_at=booking.checked_in_at,
        checked_out_at=booking.checked_out_at,
        cancel_reason=booking.cancel_reason,
    )

    # Property info
    property_info: dict[str, Any] = {
        "unit_id": booking.unit_id,
        "title": unit_title,
        "address": booking.unit.address,
        "city": booking.unit.city,
        "governorate": booking.unit.governorate,
        "property_type": booking.unit.property_type,
        "max_guests": booking.unit.max_guests,
    }

    # Payment info
    payment = await payments_repository.get_payment_by_booking(session, booking.id)
    payment_info: dict[str, Any] | None = None
    if payment is not None:
        payment_info = {
            "id": payment.id,
            "status": payment.status,
            "method": payment.method,
            "amount_egp": payment.amount_egp,
            "nights": payment.nights,
            "reference_number": payment.reference_number,
            "proof_uploaded_at": payment.proof_uploaded_at.isoformat() if payment.proof_uploaded_at else None,
            "verified_at": payment.verified_at.isoformat() if payment.verified_at else None,
            "refund_amount_egp": payment.refund_amount_egp,
            "instructions": payment.instructions,
        }

    # Cancellation preview (only if cancellable)
    cancellation_preview: dict[str, Any] | None = None
    if BookingStatus(booking.status) in (
        BookingStatus.REQUESTED,
        BookingStatus.ACCEPTED,
        BookingStatus.CONFIRMED,
    ):
        from app.bookings.services import (
            _cancellation_actor,
            _evaluate_cancellation_refund,
            _refund_policy_label,
        )
        try:
            cancelled_by = _cancellation_actor(booking, user)
            current_payment = await payments_repository.get_payment_by_booking(session, booking.id)
            refund_amount, total_paid = _evaluate_cancellation_refund(
                cancelled_by=cancelled_by,
                payment=current_payment,
                requested_at=booking.requested_at,
                check_in=booking.check_in,
            )
            cancellation_preview = {
                "cancellable": True,
                "cancelled_by": cancelled_by,
                "total_paid_egp": total_paid,
                "refund_amount_egp": refund_amount,
                "refund_policy_applied": _refund_policy_label(refund_amount, total_paid),
            }
        except AuthorizationError:
            pass

    return host_schemas.HostReservationDetail(
        booking=summary,
        property=property_info,
        payment=payment_info,
        cancellation_preview=cancellation_preview,
    )


# ============================================================
# HOST EARNINGS
# ============================================================

async def get_host_earnings(
    session: AsyncSession, user: User
) -> host_schemas.HostEarningsSummary:
    """Host-facing financial visibility — read-only, no payout claims."""
    _assert_host_or_cohost(user)
    data = await host_repository.get_host_earnings(session, user.id)
    return host_schemas.HostEarningsSummary(**data)


# ============================================================
# HOST CALENDAR
# ============================================================

async def get_host_calendar(
    session: AsyncSession,
    user: User,
    unit_id: str | None,
    check_in: date,
    check_out: date,
) -> host_schemas.HostCalendarResponse:
    """Host calendar view — availability + reservations + pricing."""
    _assert_host_or_cohost(user)

    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")
    if (check_out - check_in).days > 365:
        raise ValidationError("Date range cannot exceed 365 days")

    managed_unit_ids = await get_managed_unit_ids(session, user)
    if not managed_unit_ids:
        return host_schemas.HostCalendarResponse(
            unit_id=unit_id, check_in=check_in, check_out=check_out, days=[]
        )

    if unit_id is not None and unit_id not in managed_unit_ids:
        raise AuthorizationError("You do not have access to this property")

    target_unit_ids = [unit_id] if unit_id else managed_unit_ids

    # Get bookings in range
    booking_stmt = (
        select(Booking)
        .options(selectinload(Booking.unit))
        .where(
            Booking.unit_id.in_(target_unit_ids),
            Booking.check_in < check_out,
            Booking.check_out > check_in,
            Booking.status.notin_([BookingStatus.CANCELLED, BookingStatus.REJECTED]),
        )
    )
    booking_result = await session.execute(booking_stmt)
    bookings = list(booking_result.scalars().all())

    # Get calendar rules in range
    from app.listings import pricing as pricing_module
    from app.listings import repository as listings_repository
    from app.listings.constants import CalendarStatus
    from app.listings.models import CalendarRule

    # Get listing for pricing
    listing_map: dict[str, UnitListing] = {}
    if unit_id:
        unit = await listings_repository.get_unit_with_listing(session, unit_id)
        if unit is not None and unit.listing is not None:
            listing_map[unit_id] = unit.listing
    else:
        for uid in target_unit_ids:
            unit = await listings_repository.get_unit_with_listing(session, uid)
            if unit is not None and unit is not None and unit.listing is not None:
                listing_map[uid] = unit.listing

    # Get calendar rules
    rules_map: dict[str, list[CalendarRule]] = {}
    for uid in target_unit_ids:
        rules = await listings_repository.get_calendar_rules_in_range(
            session, uid, check_in, check_out
        )
        rules_map[uid] = rules

    # Build day-by-day view
    days: list[host_schemas.HostCalendarDay] = []
    current = check_in
    while current < check_out:
        # Check if any booking covers this day
        day_booking: Booking | None = None
        for b in bookings:
            if b.check_in <= current < b.check_out:
                day_booking = b
                break

        if day_booking is not None:
            guest = await _resolve_guest(session, day_booking.guest_id)
            days.append(host_schemas.HostCalendarDay(
                date=current,
                status=str(CalendarStatus.BOOKED),
                price_egp=0,
                reservation_id=day_booking.id,
                reservation_status=day_booking.status,
                guest_name=_guest_name(guest),
            ))
        else:
            # Check calendar rules
            day_status = str(CalendarStatus.AVAILABLE)
            block_type = None
            price = 0
            for uid in target_unit_ids:
                rules = rules_map.get(uid, [])
                rule = pricing_module.find_rule_for_day(rules, current)
                if rule is not None:
                    day_status = str(rule.status)
                    block_type = rule.block_type
                    listing = listing_map.get(uid)
                    if listing is not None:
                        price = pricing_module.get_day_price(listing, rule, current)
                    break

            if price == 0 and listing_map:
                # Use base price as fallback
                first_listing = next(iter(listing_map.values()), None)
                if first_listing is not None:
                    price = first_listing.base_price_egp

            days.append(host_schemas.HostCalendarDay(
                date=current,
                status=day_status,
                block_type=block_type,
                price_egp=price,
            ))

        current += timedelta(days=1)

    return host_schemas.HostCalendarResponse(
        unit_id=unit_id, check_in=check_in, check_out=check_out, days=days
    )


# ============================================================
# LISTING READINESS
# ============================================================

# Required fields for a listing to be publishable.
# These are the minimum for a guest to have a complete booking experience.
_REQUIRED_FIELDS: dict[str, tuple[str, str, str]] = {
    # key: (model_attr, field_label_en, field_label_ar)
    "title": ("title_ar", "Listing title", "عنوان الإقامة"),
    "description": ("description_ar", "Description", "الوصف"),
    "photos": ("_has_photos", "At least one photo", "صورة واحدة على الأقل"),
    "price": ("base_price_egp", "Base price (min 100 EGP)", "السعر الأساسي (100 جنيه على الأقل)"),
    "address": ("address", "Property address", "عنوان العقار"),
    "check_in_instructions": ("check_in_instructions", "Check-in instructions", "تعليمات تسجيل الوصول"),
    "house_rules": ("house_rules", "House rules", "قواعد المنزل"),
}


async def compute_listing_readiness(
    session: AsyncSession,
    unit: Unit,
    listing: UnitListing | None,
) -> host_schemas.ListingReadinessResponse:
    """Compute listing readiness — what's missing before publishing."""
    missing_items: list[str] = []
    missing_labels: dict[str, str] = {}

    if listing is None:
        missing_items.append("listing_details")
        missing_labels["listing_details"] = "Listing details"
        return host_schemas.ListingReadinessResponse(
            unit_id=unit.id,
            status=str(ListingReadinessStatus.ACTION_REQUIRED),
            missing_items=missing_items,
            missing_item_labels=missing_labels,
            computed_at=datetime.now(UTC),
        )

    for key, (attr, label_en, _label_ar) in _REQUIRED_FIELDS.items():
        if attr == "_has_photos":
            photos = await session.execute(
                select(func.count(Unit.id))
                .join(Unit.photos)
                .where(Unit.id == unit.id)
            )
            photo_count = photos.scalar() or 0
            if photo_count == 0:
                missing_items.append(key)
                missing_labels[key] = label_en
        else:
            value = getattr(listing, attr, None)
            if attr == "base_price_egp":
                if value is None or value < 100:
                    missing_items.append(key)
                    missing_labels[key] = label_en
            elif not value:
                missing_items.append(key)
                missing_labels[key] = label_en

    # Check address on unit
    if not unit.address:
        missing_items.append("address")
        missing_labels["address"] = "Property address"

    status = (
        str(ListingReadinessStatus.READY)
        if not missing_items
        else str(ListingReadinessStatus.ACTION_REQUIRED)
    )

    # Persist the readiness check
    await host_repository.upsert_readiness_check(
        session, unit.id, status, missing_items
    )

    return host_schemas.ListingReadinessResponse(
        unit_id=unit.id,
        status=status,
        missing_items=missing_items,
        missing_item_labels=missing_labels,
        computed_at=datetime.now(UTC),
    )


async def get_listing_readiness(
    session: AsyncSession, user: User, unit_id: str
) -> host_schemas.ListingReadinessResponse:
    """Get listing readiness for a specific unit."""
    from app.listings import repository as listings_repository

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_access_unit(session, user, unit)
    listing = unit.listing
    return await compute_listing_readiness(session, unit, listing)


# ============================================================
# CO-HOST MANAGEMENT
# ============================================================

async def invite_co_host(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: host_schemas.CoHostInvite,
) -> host_schemas.CoHostResponse:
    """Invite a co-host to help manage a unit. Owner/admin only."""
    from app.listings import repository as listings_repository

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)

    # Validate permission scope
    if request.permission_scope not in [s.value for s in CoHostPermissionScope]:
        raise ValidationError(f"Invalid permission scope: {request.permission_scope}")

    # Can't invite yourself
    if request.co_host_user_id == user.id:
        raise ValidationError("You cannot invite yourself as a co-host")

    # Can't invite the owner
    if request.co_host_user_id == unit.host_id:
        raise ValidationError("The owner cannot be a co-host of their own unit")

    # Check if user exists
    co_host_user = await _resolve_host(session, request.co_host_user_id)
    if co_host_user is None:
        raise NotFoundError("User not found")

    # Check if already a co-host
    existing = await host_repository.get_co_host(session, unit_id, request.co_host_user_id)
    if existing is not None:
        raise ValidationError("This user is already a co-host for this property")

    co_host = await host_repository.create_co_host(
        session,
        unit_id=unit_id,
        co_host_user_id=request.co_host_user_id,
        permission_scope=request.permission_scope,
        invited_by=user.id,
    )

    return host_schemas.CoHostResponse(
        id=co_host.id,
        unit_id=co_host.unit_id,
        co_host_user_id=co_host.co_host_user_id,
        co_host_display_name=co_host_user.display_name,
        co_host_phone=co_host_user.phone_number,
        permission_scope=co_host.permission_scope,
        is_active=co_host.is_active,
        created_at=co_host.created_at,
        updated_at=co_host.updated_at,
    )


async def list_co_hosts(
    session: AsyncSession, user: User, unit_id: str
) -> list[host_schemas.CoHostResponse]:
    """List co-hosts for a unit. Must have access to the unit."""
    from app.listings import repository as listings_repository

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_can_access_unit(session, user, unit)

    co_hosts = await host_repository.list_co_hosts_for_unit(session, unit_id)
    return [
        host_schemas.CoHostResponse(
            id=ch.id,
            unit_id=ch.unit_id,
            co_host_user_id=ch.co_host_user_id,
            co_host_display_name=u.display_name,
            co_host_phone=u.phone_number,
            permission_scope=ch.permission_scope,
            is_active=ch.is_active,
            created_at=ch.created_at,
            updated_at=ch.updated_at,
        )
        for ch, u in co_hosts
    ]


async def update_co_host(
    session: AsyncSession,
    user: User,
    unit_id: str,
    co_host_id: str,
    request: host_schemas.CoHostUpdate,
) -> host_schemas.CoHostResponse:
    """Update a co-host's permissions. Owner/admin only."""
    from app.listings import repository as listings_repository

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)

    co_host = await host_repository.get_co_host_by_id(session, co_host_id)
    if co_host is None or co_host.unit_id != unit_id:
        raise NotFoundError("Co-host not found")

    if request.permission_scope is not None:
        if request.permission_scope not in [s.value for s in CoHostPermissionScope]:
            raise ValidationError(f"Invalid permission scope: {request.permission_scope}")
        co_host.permission_scope = request.permission_scope
    if request.is_active is not None:
        co_host.is_active = request.is_active

    session.add(co_host)
    await session.flush()
    await session.refresh(co_host)

    co_host_user = await _resolve_host(session, co_host.co_host_user_id)
    return host_schemas.CoHostResponse(
        id=co_host.id,
        unit_id=co_host.unit_id,
        co_host_user_id=co_host.co_host_user_id,
        co_host_display_name=co_host_user.display_name if co_host_user else None,
        co_host_phone=co_host_user.phone_number if co_host_user else None,
        permission_scope=co_host.permission_scope,
        is_active=co_host.is_active,
        created_at=co_host.created_at,
        updated_at=co_host.updated_at,
    )


async def remove_co_host(
    session: AsyncSession, user: User, unit_id: str, co_host_id: str
) -> None:
    """Remove a co-host. Owner/admin only."""
    from app.listings import repository as listings_repository

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")
    await assert_owner_or_admin(user, unit)

    co_host = await host_repository.get_co_host_by_id(session, co_host_id)
    if co_host is None or co_host.unit_id != unit_id:
        raise NotFoundError("Co-host not found")

    await session.delete(co_host)
    await session.flush()


# ============================================================
# HOST PROFILE
# ============================================================

async def get_host_listing_detail(
    session: AsyncSession, user: User, unit_id: str
) -> host_schemas.HostListingDetail:
    """Full listing detail for the host management view.

    Combines listing data with photos, readiness, and the user's
    permission scope — everything the mobile editor needs in one call.
    """
    from sqlalchemy import func as sa_func

    from app.listings import repository as listings_repository

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Listing not found")

    scope = await assert_can_access_unit(session, user, unit)
    listing = unit.listing

    # Coordinates
    lat_result = await session.execute(
        select(
            sa_func.ST_Y(Unit.coordinates).label("lat"),
            sa_func.ST_X(Unit.coordinates).label("lng"),
        ).where(Unit.id == unit.id)
    )
    coord_row = lat_result.one()
    lat = float(coord_row.lat)
    lng = float(coord_row.lng)

    # Photos
    photos = await listings_repository.get_photos_by_unit(session, unit.id)
    photo_list = [
        host_schemas.HostListingPhoto(
            id=p.id,
            url=p.url,
            display_order=p.display_order,
            is_cover=p.is_cover,
            caption=p.caption_ar,
        )
        for p in photos
    ]

    # Cover image
    cover_url: str | None = None
    if listing is not None and listing.cover_photo_id:
        for p in photos:
            if p.id == listing.cover_photo_id:
                cover_url = p.url
                break
    if cover_url is None:
        for p in photos:
            if p.is_cover:
                cover_url = p.url
                break
    if cover_url is None and photos:
        cover_url = photos[0].url

    # Readiness
    readiness = await compute_listing_readiness(session, unit, listing)

    if listing is None:
        raise NotFoundError("Listing details not found")

    return host_schemas.HostListingDetail(
        id=unit.id,
        host_id=unit.host_id,
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
        description_ar=listing.description_ar,
        description_en=listing.description_en,
        amenities=listing.amenities,
        cultural_tags=listing.cultural_tags,
        house_rules=listing.house_rules,
        check_in_instructions=listing.check_in_instructions,
        check_in_time=listing.check_in_time,
        check_out_time=listing.check_out_time,
        pre_arrival_info_release_hours=listing.pre_arrival_info_release_hours,
        policies=listing.policies,
        base_price_egp=listing.base_price_egp,
        cleaning_fee_egp=listing.cleaning_fee_egp,
        cancellation_policy=listing.cancellation_policy,
        currency=listing.currency,
        weekend_mult=float(listing.weekend_mult),
        peak_mult=float(listing.peak_mult),
        min_nights=listing.min_nights,
        max_nights=listing.max_nights,
        cover_image=cover_url,
        photos=photo_list,
        readiness=readiness,
        permission_scope=scope,
    )


async def get_host_profile(
    session: AsyncSession, user: User
) -> host_schemas.HostProfileResponse:
    """Get the host's own profile."""
    _assert_host_or_cohost(user)

    total_listings = await session.scalar(
        select(func.count(Unit.id)).where(Unit.host_id == user.id)
    )
    total_listings = total_listings or 0

    listed_listings = await session.scalar(
        select(func.count(Unit.id)).where(
            Unit.host_id == user.id, Unit.status == UnitStatus.LISTED
        )
    )
    listed_listings = listed_listings or 0

    co_host_units = await host_repository.count_co_hosted_units(session, user.id)

    return host_schemas.HostProfileResponse(
        id=user.id,
        display_name=user.display_name,
        phone_number=user.phone_number,
        email=user.email,
        kyc_status=user.kyc_status,
        locale=user.locale,
        is_active=user.is_active,
        total_listings=total_listings,
        listed_listings=listed_listings,
        co_host_units=co_host_units,
        created_at=user.created_at,
    )


async def update_host_profile(
    session: AsyncSession, user: User, request: host_schemas.HostProfileUpdate
) -> host_schemas.HostProfileResponse:
    """Update the host's own profile."""
    _assert_host_or_cohost(user)

    if request.display_name is not None:
        user.display_name = request.display_name
    if request.email is not None:
        user.email = request.email
    if request.locale is not None:
        if request.locale not in ("ar", "en"):
            raise ValidationError("Locale must be 'ar' or 'en'")
        user.locale = request.locale

    session.add(user)
    await session.flush()
    await session.refresh(user)

    return await get_host_profile(session, user)
