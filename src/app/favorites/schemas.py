from typing import Any

from pydantic import BaseModel


class FavoriteToggleResponse(BaseModel):
    unit_id: str
    is_favorite: bool


class FavoriteListResponse(BaseModel):
    data: list[dict[str, Any]]
    total: int


class LocationSuggestion(BaseModel):
    canonical_name_en: str
    canonical_name_ar: str
    city: str
    governorate: str
    lat: float | None = None
    lng: float | None = None


class LocationAutocompleteResponse(BaseModel):
    suggestions: list[LocationSuggestion]
