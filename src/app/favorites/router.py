from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import (
    FavoriteListResponse,
    FavoriteToggleResponse,
    LocationAutocompleteResponse,
)
from .services import get_user_favorites, location_autocomplete, toggle_favorite

router = APIRouter(tags=["favorites", "locations"])


@router.post("/favorites/{unit_id}", response_model=FavoriteToggleResponse)
async def toggle_favorite_endpoint(
    unit_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FavoriteToggleResponse:
    try:
        return await toggle_favorite(session, user, unit_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/favorites", response_model=FavoriteListResponse)
async def list_favorites(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FavoriteListResponse:
    return await get_user_favorites(session, user)


@router.get("/locations/autocomplete", response_model=LocationAutocompleteResponse)
async def location_autocomplete_endpoint(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
) -> LocationAutocompleteResponse:
    return await location_autocomplete(session, q, limit)
