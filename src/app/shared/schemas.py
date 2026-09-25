from decimal import Decimal
from typing import Annotated, Any, Generic, TypeVar

from pydantic import BaseModel, PlainSerializer, WithJsonSchema

T = TypeVar("T")

# Money on the API boundary: Decimal internally (exact 2dp EGP), JSON
# number on the wire so clients see ``4058.4`` — never a string, never a
# float computed client-side.
Money = Annotated[
    Decimal,
    WithJsonSchema({"type": "number"}),
    PlainSerializer(
        lambda d: float(d) if d is not None else None,
        return_type=float,
        when_used="json",
    ),
]


class BaseResponse(BaseModel):
    success: bool = True
    message: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str


class ErrorResponse(BaseModel):
    code: str
    message: str
    message_ar: str
    details: dict[str, Any] | None = None


class VersionResponse(BaseModel):
    name: str
    version: str
    environment: str


class RootResponse(BaseModel):
    message: str
    version: str
