import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any

from app.celery_app import celery_app
from app.config import settings
from app.database import AsyncSessionLocal
from app.payments import repository as payments_repository
from app.shared.exceptions import StayOSError

from . import repository as bookings_repository
from . import services as booking_services


@celery_app.task(  # type: ignore[untyped-decorator]
    bind=True,
    name="app.bookings.tasks.expire_unpaid_bookings",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_jitter=True,
)
def expire_unpaid_bookings(self: Any, batch_size: int = 100) -> int:
    """Cancel accepted bookings whose payment deadline has passed.

    V1 Cancellation & Refund Policy §1.2: once the host accepts, the guest
    has PAYMENT_DEADLINE_HOURS to submit payment proof; after that the
    booking may be cancelled. Only payments still PENDING/REJECTED are swept
    — a PROOF_UPLOADED payment has a receipt awaiting admin review.
    """

    async def _expire() -> int:
        expired = 0
        async with AsyncSessionLocal() as session:
            async with session.begin():
                payments = await payments_repository.list_expired_unpaid_payments(
                    session, datetime.now(UTC), limit=batch_size
                )
                for payment in payments:
                    try:
                        await booking_services.cancel_booking_system(
                            session,
                            payment.booking_id,
                            reason="payment_deadline_expired",
                        )
                        expired += 1
                    except StayOSError:
                        # Booking changed state concurrently — skip it.
                        continue
        return expired

    return asyncio.run(_expire())


@celery_app.task(  # type: ignore[untyped-decorator]
    bind=True,
    name="app.bookings.tasks.expire_unanswered_bookings",
    autoretry_for=(Exception,),
    max_retries=3,
    retry_backoff=True,
    retry_jitter=True,
)
def expire_unanswered_bookings(self: Any, batch_size: int = 100) -> int:
    """Cancel booking requests the host has not responded to within the deadline.

    Airbnb benchmark: hosts have 24 hours to accept or decline a booking
    request. After that the request expires, the inventory is released,
    and the guest is notified. Uses the existing system cancellation path
    so the refund engine, outbox event, and notification pipeline all fire.
    """

    async def _expire() -> int:
        expired = 0
        cutoff = datetime.now(UTC) - timedelta(hours=settings.REQUEST_EXPIRATION_HOURS)
        async with AsyncSessionLocal() as session:
            async with session.begin():
                bookings = await bookings_repository.list_expired_requested_bookings(
                    session, cutoff, limit=batch_size
                )
                for booking in bookings:
                    try:
                        await booking_services.cancel_booking_system(
                            session,
                            booking.id,
                            reason="request_expired",
                        )
                        expired += 1
                    except StayOSError:
                        # Booking changed state concurrently — skip it.
                        continue
        return expired

    return asyncio.run(_expire())
