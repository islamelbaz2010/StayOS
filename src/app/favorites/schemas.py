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


class LocationArea(BaseModel):
    """A canonical district/area inside a city."""

    name_en: str
    name_ar: str
    lat: float | None = None
    lng: float | None = None


class LocationCity(BaseModel):
    name: str
    areas: list[LocationArea]


class LocationGovernorate(BaseModel):
    name: str
    cities: list[LocationCity]


class LocationTreeResponse(BaseModel):
    """Structured Egypt location data for dependent selectors."""

    governorates: list[LocationGovernorate]
