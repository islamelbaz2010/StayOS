from geoalchemy2.elements import WKTElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import repository as auth_repository
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.importer.parser import parse_file
from app.importer.schemas import (
    ImportConfirmRequest,
    ImportPreviewResponse,
    ImportPreviewRow,
    ImportResultRow,
    ImportRowData,
    ImportSummaryResponse,
)
from app.importer.validation import find_duplicates, validate_row
from app.listings.constants import UnitStatus
from app.listings.models import Unit, UnitListing, UnitPhoto
from app.shared.exceptions import ValidationError


async def _find_or_create_host(
    session: AsyncSession,
    host_name: str | None,
    host_phone: str | None,
    host_email: str | None,
) -> User:
    """Find an existing user by phone/email, or create a placeholder host."""

    if host_phone:
        user = await auth_repository.get_user_by_phone(session, host_phone)
        if user:
            return user

    if host_email:
        user = await auth_repository.get_user_by_email(session, host_email)
        if user:
            return user

    display_name = host_name or host_phone or host_email or "Imported Host"
    user = await auth_repository.create_user(
        session,
        phone_number=host_phone,
        email=host_email,
        display_name=display_name,
        role=UserRole.HOST,
        kyc_status=KycStatus.VERIFIED,
        locale="ar",
    )
    return user


async def generate_preview(
    filename: str,
    content: bytes,
) -> ImportPreviewResponse:
    rows = parse_file(filename, content)
    duplicate_row_numbers = find_duplicates(rows)

    preview_rows: list[ImportPreviewRow] = []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0

    for row in rows:
        errors = validate_row(row)
        is_duplicate = row.row_number in duplicate_row_numbers
        is_valid = len(errors) == 0 and not is_duplicate

        if is_valid:
            valid_count += 1
        elif is_duplicate:
            duplicate_count += 1
        else:
            invalid_count += 1

        preview_rows.append(
            ImportPreviewRow(
                **row.model_dump(),
                is_valid=is_valid,
                is_duplicate=is_duplicate,
                errors=errors,
            )
        )

    return ImportPreviewResponse(
        total_rows=len(rows),
        valid_rows=valid_count,
        invalid_rows=invalid_count,
        duplicate_rows=duplicate_count,
        rows=preview_rows,
    )


async def _check_existing_duplicate(
    session: AsyncSession, row: ImportRowData
) -> bool:
    result = await session.execute(
        select(UnitListing.id)
        .join(Unit, Unit.id == UnitListing.unit_id)
        .where(
            UnitListing.title_ar == row.title,
            Unit.city == row.city,
            Unit.governorate == row.governorate,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _create_unit_and_listing(
    session: AsyncSession,
    row: ImportRowData,
    host_id: str,
) -> str:
    unit = Unit(
        host_id=host_id,
        property_type=row.property_type,
        status=row.status if row.status in [s.value for s in UnitStatus] else UnitStatus.LISTED,
        coordinates=WKTElement(
            f"POINT({row.longitude} {row.latitude})", srid=4326
        ),
        governorate=row.governorate,
        city=row.city,
        district=row.district,
        address=row.address,
        max_guests=row.max_guests,
        bedrooms=row.bedrooms,
        beds=row.beds,
        bathrooms=row.bathrooms,
    )
    session.add(unit)
    await session.flush()
    await session.refresh(unit)

    listing = UnitListing(
        unit_id=unit.id,
        title_ar=row.title,
        title_en=None,
        description_ar=row.description,
        description_en=None,
        amenities=row.amenities,
        cultural_tags=[],
        base_price_egp=row.price,
        country=row.country,
        currency=row.currency,
    )
    session.add(listing)
    await session.flush()
    await session.refresh(listing)

    if row.image_urls:
        for idx, url in enumerate(row.image_urls):
            photo = UnitPhoto(
                unit_id=unit.id,
                s3_key=f"imported/{unit.id}/{idx}",
                url=url,
                display_order=idx,
                is_cover=(idx == 0),
            )
            session.add(photo)
            await session.flush()
            if idx == 0:
                listing.cover_photo_id = photo.id
                await session.flush()

    return unit.id


async def execute_import(
    session: AsyncSession,
    request: ImportConfirmRequest,
) -> ImportSummaryResponse:
    if not request.rows:
        raise ValidationError("No rows to import")

    results: list[ImportResultRow] = []
    created = 0
    failed = 0

    host_cache: dict[str, User] = {}

    for row in request.rows:
        try:
            errors = validate_row(row)
            if errors:
                raise ValueError("; ".join(e.message for e in errors))

            cache_key = f"{row.host_phone or ''}|{row.host_email or ''}|{row.host_name or ''}"
            if cache_key in host_cache:
                host = host_cache[cache_key]
            else:
                host = await _find_or_create_host(
                    session,
                    row.host_name,
                    row.host_phone,
                    row.host_email,
                )
                host_cache[cache_key] = host

            if await _check_existing_duplicate(session, row):
                results.append(
                    ImportResultRow(
                        row_number=row.row_number,
                        title=row.title,
                        status="skipped",
                        error="Duplicate listing already exists",
                    )
                )
                continue

            unit_id = await _create_unit_and_listing(session, row, host.id)
            created += 1
            results.append(
                ImportResultRow(
                    row_number=row.row_number,
                    title=row.title,
                    unit_id=unit_id,
                    status="created",
                )
            )
        except Exception as exc:
            failed += 1
            results.append(
                ImportResultRow(
                    row_number=row.row_number,
                    title=row.title,
                    status="failed",
                    error=str(exc),
                )
            )

    await session.commit()

    return ImportSummaryResponse(
        total_requested=len(request.rows),
        created=created,
        failed=failed,
        results=results,
    )
