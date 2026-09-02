from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import ReviewCreate, ReviewListResponse, ReviewResponse
from .services import create_review, get_listing_reviews

router = APIRouter(tags=["reviews"])


@router.post("/bookings/{booking_id}/reviews", response_model=ReviewResponse, status_code=201)
async def post_booking_review(
    booking_id: str,
    request: ReviewCreate,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ReviewResponse:
    try:
        return await create_review(session, user, booking_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/listings/{unit_id}/reviews", response_model=ReviewListResponse)
async def get_unit_reviews(
    unit_id: str,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> ReviewListResponse:
    return await get_listing_reviews(session, unit_id, limit, offset)
