import unicodedata

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.models import User
from app.favorites.models import LocationAlias, UserFavorite
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing
from app.shared.exceptions import NotFoundError

from .schemas import (
    FavoriteListResponse,
    FavoriteToggleResponse,
    LocationAutocompleteResponse,
    LocationSuggestion,
)


async def toggle_favorite(
    session: AsyncSession, user: User, unit_id: str
) -> FavoriteToggleResponse:
    existing = await session.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == user.id,
            UserFavorite.unit_id == unit_id,
        )
    )
    fav = existing.scalar_one_or_none()

    if fav:
        await session.execute(
            delete(UserFavorite).where(UserFavorite.id == fav.id)
        )
        await session.commit()
        return FavoriteToggleResponse(unit_id=unit_id, is_favorite=False)

    unit_check = await session.execute(
        select(Unit).where(Unit.id == unit_id, Unit.status == UnitStatus.LISTED)
    )
    if unit_check.scalar_one_or_none() is None:
        raise NotFoundError("Listing not found")

    session.add(UserFavorite(user_id=user.id, unit_id=unit_id))
    await session.commit()
    return FavoriteToggleResponse(unit_id=unit_id, is_favorite=True)


async def get_user_favorites(
    session: AsyncSession, user: User
) -> FavoriteListResponse:
    lat_col = func.ST_Y(Unit.coordinates).label("lat")
    lng_col = func.ST_X(Unit.coordinates).label("lng")

    result = await session.execute(
        select(Unit, UnitListing, lat_col, lng_col)
        .options(selectinload(UnitListing.cover_photo))
        .join(UserFavorite, UserFavorite.unit_id == Unit.id)
        .join(UnitListing, Unit.id == UnitListing.unit_id)
        .where(UserFavorite.user_id == user.id, Unit.status == UnitStatus.LISTED)
        .order_by(UserFavorite.created_at.desc())
    )

    data = []
    for unit, listing, lat, lng in result.all():
        data.append({
            "id": unit.id,
            "title": listing.title_ar or listing.title_en or "",
            "title_en": listing.title_en,
            "title_ar": listing.title_ar,
            "city": unit.city,
            "governorate": unit.governorate,
            "price": listing.base_price_egp,
            "currency": listing.currency,
            "lat": float(lat),
            "lng": float(lng),
            "max_guests": unit.max_guests,
            "bedrooms": unit.bedrooms,
            "bathrooms": unit.bathrooms,
            "cover_image": listing.cover_photo.url if listing.cover_photo else None,
            "amenities": listing.amenities,
        })

    return FavoriteListResponse(data=data, total=len(data))


async def is_favorited(
    session: AsyncSession, user_id: str, unit_id: str
) -> bool:
    result = await session.execute(
        select(UserFavorite.id).where(
            UserFavorite.user_id == user_id,
            UserFavorite.unit_id == unit_id,
        )
    )
    return result.scalar_one_or_none() is not None


def _normalize_arabic(text: str) -> str:
    """Normalize Arabic text for matching: remove diacritics, unify alef/ya/ta marbuta."""
    text = unicodedata.normalize("NFKD", text)
    text = text.replace("\u0623", "\u0627")  # أ → ا
    text = text.replace("\u0625", "\u0627")  # إ → ا
    text = text.replace("\u0622", "\u0627")  # آ → ا
    text = text.replace("\u0649", "\u064a")  # ى → ي
    text = text.replace("\u0629", "\u0647")  # ة → ه
    text = text.replace("\u0640", "")         # tatweel
    text = text.strip()
    return text


async def location_autocomplete(
    session: AsyncSession, query: str, limit: int = 10
) -> LocationAutocompleteResponse:
    if not query or len(query.strip()) < 2:
        return LocationAutocompleteResponse(suggestions=[])

    q = query.strip().lower()
    q_normalized = _normalize_arabic(q)

    result = await session.execute(
        select(LocationAlias)
        .where(
            func.lower(LocationAlias.alias).like(f"{q}%")
            | func.lower(LocationAlias.alias).like(f"%{q}%")
        )
        .limit(limit * 3)
    )
    rows = result.scalars().all()

    seen: set[str] = set()
    suggestions: list[LocationSuggestion] = []

    for row in rows:
        key = f"{row.canonical_name_en}:{row.city}"
        if key in seen:
            continue

        alias_norm = _normalize_arabic(row.alias.lower())
        if q_normalized not in alias_norm:
            continue

        seen.add(key)
        suggestions.append(
            LocationSuggestion(
                canonical_name_en=row.canonical_name_en,
                canonical_name_ar=row.canonical_name_ar,
                city=row.city,
                governorate=row.governorate,
                lat=row.lat,
                lng=row.lng,
            )
        )

        if len(suggestions) >= limit:
            break

    return LocationAutocompleteResponse(suggestions=suggestions)


async def location_popular(
    session: AsyncSession, limit: int = 20
) -> LocationAutocompleteResponse:
    """Return a curated set of distinct canonical locations for discovery."""
    result = await session.execute(
        select(LocationAlias)
        .where(LocationAlias.alias_type == "exact")
        .order_by(LocationAlias.canonical_name_en)
        .limit(limit * 3)
    )
    rows = result.scalars().all()

    seen: set[str] = set()
    suggestions: list[LocationSuggestion] = []
    for row in rows:
        key = f"{row.canonical_name_en}:{row.city}"
        if key in seen:
            continue
        seen.add(key)
        suggestions.append(
            LocationSuggestion(
                canonical_name_en=row.canonical_name_en,
                canonical_name_ar=row.canonical_name_ar,
                city=row.city,
                governorate=row.governorate,
                lat=row.lat,
                lng=row.lng,
            )
        )
        if len(suggestions) >= limit:
            break

    return LocationAutocompleteResponse(suggestions=suggestions)
