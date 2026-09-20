# ruff: noqa: I001
"""Host custom offers on inquiry conversations (FD-07 / FD-20).

A host can attach an all-inclusive stay offer to a conversation; the
guest accepts to create a booking priced at the offered total. The
offered total IS the guest price — economics are derived at payment time
by the canonical commercial engine, so hosts never set fees and guests
never see a breakdown.
"""
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from app.auth.constants import UserRole
from app.auth.models import User
from app.listings import repository as listings_repository
from app.listings.constants import UnitStatus
from app.messages import repository as messages_repository
from app.messages import services as messages_services
from app.messages.schemas import MessageCreate
from app.shared.exceptions import (
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.shared.outbox import write_event
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import repository as bookings_repository
from .constants import BookingStatus
from .models import Booking, BookingOffer
from .schemas import BookingOfferCreate, BookingOfferResponse, BookingResponse

OFFER_TTL_HOURS = 24


def _to_offer_response(offer: BookingOffer) -> BookingOfferResponse:
    return BookingOfferResponse.model_validate(offer)


async def _conversation_participants(conversation: Any) -> tuple[str | None, str | None]:
    """Return (host_id, guest_id) for a reservation/inquiry conversation."""
    host_id: str | None = None
    guest_id: str | None = None
    for p in conversation.participants or []:
        if p.role == "host":
            host_id = p.user_id
        elif p.role == "guest":
            guest_id = p.user_id
    return host_id, guest_id


async def create_booking_offer(
    session: AsyncSession,
    user: User,
    conversation_id: str,
    request: BookingOfferCreate,
) -> BookingOfferResponse:
    """Host sends a custom price offer inside an inquiry conversation."""
    if user.role != UserRole.HOST:
        raise AuthorizationError("Only hosts can send offers")

    conversation = await messages_repository.get_conversation_by_id_or_raise(
        session, conversation_id
    )
    if not await messages_repository.is_conversation_participant(
        session, conversation_id, user.id
    ):
        raise AuthorizationError("Not a participant of this conversation")

    host_id, guest_id = await _conversation_participants(conversation)
    if host_id != user.id or guest_id is None:
        raise ValidationError("Offers require a host and a guest participant")

    unit_id = conversation.unit_id
    if unit_id is None:
        raise ValidationError("This conversation is not linked to a listing")

    unit = await listings_repository.get_unit_with_listing(session, unit_id)
    if unit is None or unit.listing is None or unit.host_id != user.id:
        raise AuthorizationError("You can only offer your own listing")
    if unit.status != UnitStatus.LISTED:
        raise ValidationError("Listing is not available for booking")

    if request.check_out <= request.check_in:
        raise ValidationError("check_out must be after check_in")
    if request.check_in < datetime.now(UTC).date():
        raise ValidationError("check_in cannot be in the past")
    nights = (request.check_out - request.check_in).days
    listing = unit.listing
    if nights < listing.min_nights or nights > listing.max_nights:
        raise ValidationError(
            f"Stay must be between {listing.min_nights} and {listing.max_nights} nights"
        )

    await listings_repository.lock_unit_for_booking(session, unit_id)
    from .services import _assert_no_conflicts

    await _assert_no_conflicts(session, unit_id, request.check_in, request.check_out)

    # One active offer per conversation — supersede any pending ones.
    pending = await session.execute(
        select(BookingOffer).where(
            BookingOffer.conversation_id == conversation_id,
            BookingOffer.status == "pending",
        )
    )
    for old in pending.scalars().all():
        old.status = "superseded"
        session.add(old)

    offer = BookingOffer(
        id=str(uuid4()),
        conversation_id=conversation_id,
        unit_id=unit_id,
        host_id=user.id,
        guest_id=guest_id,
        check_in=request.check_in,
        check_out=request.check_out,
        total_price_egp=request.total_price_egp,
        status="pending",
        expires_at=datetime.now(UTC) + timedelta(hours=OFFER_TTL_HOURS),
    )
    session.add(offer)
    await session.flush()

    note = f" {request.message.strip()}" if request.message else ""
    await messages_services.send_message(
        session,
        user=user,
        conversation_id=conversation_id,
        request=MessageCreate(
            content=(
                f"[OFFER:{offer.id}] {request.check_in.isoformat()} → "
                f"{request.check_out.isoformat()} — EGP {request.total_price_egp:,}"
                f" total.{note}"
            )
        ),
    )

    await write_event(
        session,
        aggregate_type="BookingOffer",
        aggregate_id=UUID(offer.id),
        event_type="offer.created",
        payload={
            "offer_id": offer.id,
            "conversation_id": conversation_id,
            "unit_id": unit_id,
            "host_id": user.id,
            "guest_id": guest_id,
            "total_price_egp": offer.total_price_egp,
            "actor_id": user.id,
        },
    )
    return _to_offer_response(offer)


async def _pending_offer_or_raise(
    session: AsyncSession, offer_id: str
) -> BookingOffer:
    result = await session.execute(
        select(BookingOffer).where(BookingOffer.id == offer_id)
    )
    offer = result.scalar_one_or_none()
    if offer is None:
        raise NotFoundError("Offer not found")
    if offer.status != "pending":
        raise ConflictError(f"Offer is {offer.status}")
    if datetime.now(UTC) > offer.expires_at.replace(
        tzinfo=offer.expires_at.tzinfo or UTC
    ):
        offer.status = "expired"
        session.add(offer)
        await session.flush()
        raise ConflictError("Offer has expired")
    return offer


async def list_conversation_offers(
    session: AsyncSession, user: User, conversation_id: str
) -> list[BookingOfferResponse]:
    if not await messages_repository.is_conversation_participant(
        session, conversation_id, user.id
    ):
        raise AuthorizationError("Not a participant of this conversation")
    result = await session.execute(
        select(BookingOffer)
        .where(BookingOffer.conversation_id == conversation_id)
        .order_by(BookingOffer.created_at.desc())
    )
    return [_to_offer_response(o) for o in result.scalars().all()]


async def accept_booking_offer(
    session: AsyncSession, user: User, offer_id: str
) -> BookingResponse:
    """Guest accepts → creates an ACCEPTED booking priced at the offer and
    issues the payment request immediately (host pre-committed)."""
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can accept offers")
    offer = await _pending_offer_or_raise(session, offer_id)
    if offer.guest_id != user.id:
        raise AuthorizationError("This offer is not addressed to you")

    from app.auth import dependencies as auth_dependencies

    await auth_dependencies.require_kyc_verified(user)

    unit = await listings_repository.get_unit_with_listing(session, offer.unit_id)
    if unit is None or unit.status != UnitStatus.LISTED:
        raise ValidationError("Listing is no longer available")

    await listings_repository.lock_unit_for_booking(session, offer.unit_id)
    from .services import _assert_no_conflicts

    await _assert_no_conflicts(
        session, offer.unit_id, offer.check_in, offer.check_out
    )

    now = datetime.now(UTC)
    booking = await bookings_repository.create_booking(
        session,
        unit_id=offer.unit_id,
        guest_id=user.id,
        check_in=offer.check_in,
        check_out=offer.check_out,
        adults=1,
        children=0,
        infants=0,
        status=BookingStatus.ACCEPTED,
        accepted_at=now,
    )
    booking.unit = unit
    booking.custom_total_egp = offer.total_price_egp
    booking.offer_id = offer.id
    session.add(booking)

    offer.status = "accepted"
    offer.booking_id = booking.id
    session.add(offer)

    await write_event(
        session,
        aggregate_type="Booking",
        aggregate_id=UUID(booking.id),
        event_type="booking.created",
        payload={
            "booking_id": booking.id,
            "unit_id": offer.unit_id,
            "guest_id": user.id,
            "host_id": offer.host_id,
            "check_in": offer.check_in.isoformat(),
            "check_out": offer.check_out.isoformat(),
            "status": BookingStatus.ACCEPTED.value,
            "offer_id": offer.id,
            "actor_id": user.id,
        },
    )

    # Payment request at the offered all-inclusive total.
    from app.payments import services as payment_services

    await payment_services.create_payment_for_booking(session, booking, user)

    await messages_services.send_message(
        session,
        user=user,
        conversation_id=offer.conversation_id,
        request=MessageCreate(content=f"[OFFER_ACCEPTED:{offer.id}]"),
    )
    await session.refresh(booking)
    from .services import _to_response

    return _to_response(booking)


async def decline_booking_offer(
    session: AsyncSession, user: User, offer_id: str
) -> BookingOfferResponse:
    if user.role != UserRole.GUEST:
        raise AuthorizationError("Only guests can decline offers")
    offer = await _pending_offer_or_raise(session, offer_id)
    if offer.guest_id != user.id:
        raise AuthorizationError("This offer is not addressed to you")
    offer.status = "declined"
    session.add(offer)
    await session.flush()

    await messages_services.send_message(
        session,
        user=user,
        conversation_id=offer.conversation_id,
        request=MessageCreate(content=f"[OFFER_DECLINED:{offer.id}]"),
    )
    return _to_offer_response(offer)
