from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.constants import UserRole
from app.auth.models import User
from app.bookings.models import Booking
from app.listings import pricing
from app.listings import repository as listings_repository
from app.listings.constants import CalendarBlockType, CalendarStatus
from app.listings.models import CalendarRule, Unit, UnitListing
from app.reservations.models import Reservation
from app.shared.exceptions import AuthorizationError, ConflictError, NotFoundError, ValidationError

from . import repository as availability_repository
from .constants import AvailabilityStatus
from .schemas import (
    AvailabilityDay,
    AvailabilityResponse,
    AvailabilityRule,
    AvailabilityUpdateRequest,
    CalendarRuleResponse,
)


def _assert_host_or_admin(user: User) -> None:
    if user.role not in (UserRole.HOST, UserRole.ADMIN):
        raise AuthorizationError("Only hosts or admins can manage availability")


async def _get_unit_or_raise(
    session: AsyncSession, unit_id: str
) -> Unit:
    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None:
        raise NotFoundError("Unit not found")
    return unit


async def _assert_unit_ownership(user: User, unit: Unit) -> None:
    if user.role == UserRole.ADMIN:
        return
    if unit.host_id != user.id:
        raise AuthorizationError("Only the listing owner can manage its availability")


def _assert_date_range(check_in: date, check_out: date) -> None:
    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")
    if (check_out - check_in).days > 365:
        raise ValidationError("Date range cannot exceed 365 days")


def _find_blocked_rule(day: date, rules: list[CalendarRule]) -> CalendarRule | None:
    for rule in rules:
        if rule.date_from <= day < rule.date_to:
            if rule.status == CalendarStatus.BLOCKED:
                return rule
    return None


def _overlaps(
    start1: date, end1: date, start2: date, end2: date
) -> bool:
    return start1 < end2 and end1 > start2


def _build_day_statuses(
    check_in: date,
    check_out: date,
    rules: list[CalendarRule],
    accepted_bookings: list[Booking],
    confirmed_reservations: list[Reservation],
    listing: UnitListing | None = None,
) -> list[AvailabilityDay]:
    # Index occupied date ranges for fast lookup.
    occupied_ranges: list[tuple[date, date, str, str | None]] = []

    for rule in rules:
        if rule.reservation_id:
            occupied_ranges.append(
                (rule.date_from, rule.date_to, CalendarStatus.BOOKED, rule.block_type)
            )
        elif rule.status in (CalendarStatus.BOOKED, CalendarStatus.HOLD):
            occupied_ranges.append(
                (rule.date_from, rule.date_to, str(rule.status), rule.block_type)
            )

    for booking in accepted_bookings:
        occupied_ranges.append(
            (booking.check_in, booking.check_out, CalendarStatus.BOOKED, None)
        )

    for reservation in confirmed_reservations:
        occupied_ranges.append(
            (reservation.check_in, reservation.check_out, CalendarStatus.BOOKED, None)
        )

    days: list[AvailabilityDay] = []
    current = check_in
    while current < check_out:
        status = str(CalendarStatus.AVAILABLE)
        block_type: str | None = None
        rule_for_day: CalendarRule | None = None

        for start, end, occ_status, occ_block_type in occupied_ranges:
            if start <= current < end:
                status = occ_status
                block_type = occ_block_type
                break
        else:
            rule_for_day = _find_blocked_rule(current, rules)
            if rule_for_day:
                status = str(CalendarStatus.BLOCKED)
                block_type = rule_for_day.block_type

        price_egp: int | None = None
        if listing is not None:
            price_egp = pricing.get_day_price(listing, rule_for_day, current)

        days.append(
            AvailabilityDay(
                date=current, status=status, block_type=block_type, price_egp=price_egp
            )
        )
        current += timedelta(days=1)

    return days


async def get_unit_availability(
    session: AsyncSession,
    unit_id: str,
    check_in: date,
    check_out: date,
    listing: UnitListing | None = None,
) -> list[AvailabilityDay]:
    """Return the per-day availability status for a unit in a date range.

    This is the single source of truth used by the public calendar, the
    host availability view, the booking validator and the reservation
    validator.
    """
    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")
    if (check_out - check_in).days > 365:
        raise ValidationError("Date range cannot exceed 365 days")

    rules = await availability_repository.get_calendar_rules_for_unit(
        session, unit_id, check_in, check_out
    )
    accepted_bookings = await availability_repository.get_accepted_bookings_for_unit(
        session, unit_id, check_in, check_out
    )
    confirmed_reservations = await availability_repository.get_confirmed_reservations_for_unit(
        session, unit_id, check_in, check_out
    )

    return _build_day_statuses(
        check_in,
        check_out,
        rules,
        accepted_bookings,
        confirmed_reservations,
        listing=listing,
    )


async def assert_availability_for_range(
    session: AsyncSession,
    unit: Unit,
    listing: UnitListing,
    check_in: date,
    check_out: date,
) -> None:
    """Shared backend safety check for both Booking and Reservation creation."""
    if unit.status != UnitStatus.LISTED:
        raise ValidationError("Unit is not available for booking")

    if check_out <= check_in:
        raise ValidationError("check_out must be after check_in")

    today = datetime.now(UTC).date()
    if check_in < today:
        raise ValidationError("check_in cannot be in the past")

    nights = (check_out - check_in).days
    if nights < listing.min_nights:
        raise ValidationError(
            f"Stay must be at least {listing.min_nights} nights"
        )
    if nights > listing.max_nights:
        raise ValidationError(
            f"Stay cannot exceed {listing.max_nights} nights"
        )

    days = await get_unit_availability(
        session, unit.id, check_in, check_out, listing=listing
    )
    for day in days:
        if day.status != str(CalendarStatus.AVAILABLE):
            raise ConflictError("Requested dates are not available")


async def get_availability(
    session: AsyncSession,
    user: User,
    unit_id: str,
    check_in: date,
    check_out: date,
) -> AvailabilityResponse:
    _assert_host_or_admin(user)
    _assert_date_range(check_in, check_out)

    unit = await _get_unit_or_raise(session, unit_id)
    await _assert_unit_ownership(user, unit)

    listing = unit.listing
    days = await get_unit_availability(
        session,
        unit_id,
        check_in,
        check_out,
        listing=listing,
    )

    return AvailabilityResponse(
        unit_id=unit_id,
        check_in=check_in,
        check_out=check_out,
        days=days,
    )


def _validate_rules(request: AvailabilityUpdateRequest) -> None:
    for rule in request.rules:
        if rule.date_to <= rule.date_from:
            raise ValidationError("date_to must be after date_from in each rule")

    # Ensure sorted and no overlap.
    sorted_rules = sorted(request.rules, key=lambda r: r.date_from)
    for i in range(len(sorted_rules) - 1):
        current = sorted_rules[i]
        next_rule = sorted_rules[i + 1]
        if next_rule.date_from < current.date_to:
            raise ValidationError(
                f"Rule {i + 1} overlaps with rule {i + 2}"
            )


def _rule_to_calendar_tuple(rule: AvailabilityRule) -> tuple[date, date, str, str | None]:
    if rule.status.value == AvailabilityStatus.BLOCKED.value:
        return (rule.date_from, rule.date_to, CalendarStatus.BLOCKED, CalendarBlockType.MANUAL)
    return (
        rule.date_from,
        rule.date_to,
        CalendarStatus.AVAILABLE,
        None,
    )


def _validate_rules_against_occupancy(
    rules: list[AvailabilityRule],
    calendar_rules: list[CalendarRule],
    accepted_bookings: list[Booking],
    confirmed_reservations: list[Reservation],
) -> None:
    for rule in rules:
        # Check against existing booking-related calendar rules.
        for cal_rule in calendar_rules:
            if not cal_rule.reservation_id and cal_rule.status not in (
                CalendarStatus.BOOKED,
                CalendarStatus.HOLD,
            ):
                continue
            if _overlaps(
                rule.date_from,
                rule.date_to,
                cal_rule.date_from,
                cal_rule.date_to,
            ):
                action = (
                    "block"
                    if rule.status == AvailabilityStatus.BLOCKED
                    else "unblock"
                )
                raise ConflictError(
                    f"Cannot {action} dates that are already occupied by a booking or reservation"
                )

        # Check against accepted bookings.
        for booking in accepted_bookings:
            if _overlaps(
                rule.date_from,
                rule.date_to,
                booking.check_in,
                booking.check_out,
            ):
                raise ConflictError(
                    f"Cannot {rule.status.value} dates that overlap an accepted booking"
                )

        # Check against confirmed reservations.
        for reservation in confirmed_reservations:
            if _overlaps(
                rule.date_from,
                rule.date_to,
                reservation.check_in,
                reservation.check_out,
            ):
                raise ConflictError(
                    f"Cannot {rule.status.value} dates that overlap a confirmed reservation"
                )


async def update_availability(
    session: AsyncSession,
    user: User,
    unit_id: str,
    request: AvailabilityUpdateRequest,
) -> list[CalendarRuleResponse]:
    _assert_host_or_admin(user)
    _validate_rules(request)

    unit = await _get_unit_or_raise(session, unit_id)
    await _assert_unit_ownership(user, unit)

    # Determine the full date range covered by the request to load existing data.
    date_min = min(r.date_from for r in request.rules)
    date_max = max(r.date_to for r in request.rules)

    calendar_rules = await availability_repository.get_calendar_rules_for_unit(
        session, unit_id, date_min, date_max
    )
    accepted_bookings = await availability_repository.get_accepted_bookings_for_unit(
        session, unit_id, date_min, date_max
    )
    confirmed_reservations = await availability_repository.get_confirmed_reservations_for_unit(
        session, unit_id, date_min, date_max
    )

    _validate_rules_against_occupancy(
        request.rules, calendar_rules, accepted_bookings, confirmed_reservations
    )

    bulk_rules = [_rule_to_calendar_tuple(rule) for rule in request.rules]
    created = await availability_repository.replace_host_availability_rules(
        session, unit_id, bulk_rules
    )

    return [
        CalendarRuleResponse.model_validate(rule) for rule in created
    ]
