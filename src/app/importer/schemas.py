from pydantic import BaseModel, Field


class ImportRowData(BaseModel):
    """Represents a single parsed row from an import file."""

    row_number: int
    title: str
    description: str
    address: str | None = None
    district: str | None = None
    city: str
    governorate: str
    country: str = "Egypt"
    latitude: float
    longitude: float
    property_type: str
    bedrooms: int = 0
    beds: int = 1
    bathrooms: int = 1
    max_guests: int = 1
    price: int
    currency: str = "EGP"
    amenities: list[str] = Field(default_factory=list)
    image_urls: list[str] = Field(default_factory=list)
    host_name: str | None = None
    host_phone: str | None = None
    host_email: str | None = None
    status: str = "LISTED"


class ImportRowError(BaseModel):
    row_number: int
    field: str
    message: str


class ImportPreviewRow(BaseModel):
    row_number: int
    title: str
    city: str
    governorate: str
    price: int
    property_type: str
    host_name: str | None
    host_phone: str | None
    host_email: str | None
    is_valid: bool
    is_duplicate: bool = False
    errors: list[ImportRowError] = Field(default_factory=list)


class ImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    rows: list[ImportPreviewRow]


class ImportConfirmRequest(BaseModel):
    """Sent by the frontend after the user reviews the preview."""

    rows: list[ImportRowData]


class ImportResultRow(BaseModel):
    row_number: int
    title: str
    unit_id: str | None = None
    status: str
    error: str | None = None


class ImportSummaryResponse(BaseModel):
    total_requested: int
    created: int
    failed: int
    results: list[ImportResultRow]
