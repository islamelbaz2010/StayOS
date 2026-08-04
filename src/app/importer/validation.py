from app.importer.schemas import ImportRowData, ImportRowError

VALID_PROPERTY_TYPES = {
    "APARTMENT",
    "VILLA",
    "CHALET",
    "HOTEL_ROOM",
    "RESORT_UNIT",
    "STUDIO",
}

VALID_STATUSES = {"DRAFT", "PENDING_VERIFICATION", "LISTED", "UNLISTED"}

REQUIRED_FIELDS = ["title", "description", "city", "governorate", "property_type"]


def validate_row(row: ImportRowData) -> list[ImportRowError]:
    errors: list[ImportRowError] = []

    for field in REQUIRED_FIELDS:
        value = getattr(row, field, None)
        if not value or (isinstance(value, str) and not value.strip()):
            errors.append(
                ImportRowError(
                    row_number=row.row_number,
                    field=field,
                    message=f"{field} is required",
                )
            )

    if not (-90 <= row.latitude <= 90):
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="latitude",
                message="latitude must be between -90 and 90",
            )
        )

    if not (-180 <= row.longitude <= 180):
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="longitude",
                message="longitude must be between -180 and 180",
            )
        )

    if row.latitude == 0.0 and row.longitude == 0.0:
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="coordinates",
                message="coordinates cannot be 0,0",
            )
        )

    if row.price < 100:
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="price",
                message="price must be at least 100",
            )
        )

    if row.property_type and row.property_type not in VALID_PROPERTY_TYPES:
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="property_type",
                message=f"property_type must be one of: {', '.join(sorted(VALID_PROPERTY_TYPES))}",
            )
        )

    if row.status and row.status not in VALID_STATUSES:
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="status",
                message=f"status must be one of: {', '.join(sorted(VALID_STATUSES))}",
            )
        )

    if row.max_guests < 1:
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="max_guests",
                message="max_guests must be at least 1",
            )
        )

    if row.bathrooms < 1:
        errors.append(
            ImportRowError(
                row_number=row.row_number,
                field="bathrooms",
                message="bathrooms must be at least 1",
            )
        )

    return errors


def find_duplicates(rows: list[ImportRowData]) -> set[int]:
    """Return row numbers that are duplicates within the batch."""
    seen: dict[str, int] = {}
    duplicate_rows: set[int] = set()

    for row in rows:
        key = f"{row.title.lower().strip()}|{row.city.lower().strip()}|{row.governorate.lower().strip()}"
        if key in seen:
            duplicate_rows.add(row.row_number)
        else:
            seen[key] = row.row_number

    return duplicate_rows
