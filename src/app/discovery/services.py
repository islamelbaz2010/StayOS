"""Discovery services — orchestrates the full discovery pipeline."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.discovery.adapters.base import DiscoverySearchConfig, RawCandidate
from app.discovery.constants import (
    CandidateStatus,
    ContactStatus,
    DuplicateStatus,
    RunStatus,
)
from app.discovery.dedup import check_duplicate
from app.discovery.models import DiscoveryCandidate, DiscoveryConfig, DiscoveryRun
from app.discovery.normalizer import compute_completeness, normalize_candidate
from app.discovery.scoring import (
    classify_candidate_type,
    compute_qualification_score,
    compute_source_confidence,
    extract_contact,
)
from app.importer.schemas import ImportConfirmRequest, ImportRowData
from app.importer.services import execute_import
from app.shared.exceptions import NotFoundError, ValidationError

logger = logging.getLogger(__name__)


async def create_config(session: AsyncSession, config_data: dict[str, Any]) -> DiscoveryConfig:
    config = DiscoveryConfig(**config_data)
    session.add(config)
    await session.flush()
    await session.refresh(config)
    return config


async def list_configs(session: AsyncSession) -> list[DiscoveryConfig]:
    result = await session.execute(select(DiscoveryConfig).order_by(DiscoveryConfig.created_at.desc()))
    return list(result.scalars().all())


async def list_candidates(
    session: AsyncSession,
    source: str | None = None,
    city: str | None = None,
    property_type: str | None = None,
    status: str | None = None,
    candidate_type: str | None = None,
    duplicate_status: str | None = None,
    contact_status: str | None = None,
    min_score: float | None = None,
    max_score: float | None = None,
    limit: int = 50,
    offset: int = 0,
    sort_by: str = "newest",
) -> tuple[list[DiscoveryCandidate], int]:
    stmt = select(DiscoveryCandidate)

    if source:
        stmt = stmt.where(DiscoveryCandidate.source == source)
    if city:
        stmt = stmt.where(DiscoveryCandidate.city == city)
    if property_type:
        stmt = stmt.where(DiscoveryCandidate.property_type == property_type)
    if status:
        stmt = stmt.where(DiscoveryCandidate.status == status)
    if candidate_type:
        stmt = stmt.where(DiscoveryCandidate.candidate_type == candidate_type)
    if duplicate_status:
        stmt = stmt.where(DiscoveryCandidate.duplicate_status == duplicate_status)
    if contact_status:
        stmt = stmt.where(DiscoveryCandidate.contact_status == contact_status)
    if min_score is not None:
        stmt = stmt.where(DiscoveryCandidate.qualification_score >= min_score)
    if max_score is not None:
        stmt = stmt.where(DiscoveryCandidate.qualification_score <= max_score)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    count_result = await session.execute(count_stmt)
    total = count_result.scalar_one()

    sort_map = {
        "newest": DiscoveryCandidate.discovered_at.desc(),
        "highest_score": DiscoveryCandidate.qualification_score.desc(),
        "best_completeness": DiscoveryCandidate.data_completeness_score.desc(),
        "source": DiscoveryCandidate.source.asc(),
        "city": DiscoveryCandidate.city.asc(),
    }
    stmt = stmt.order_by(sort_map.get(sort_by, DiscoveryCandidate.discovered_at.desc()))
    stmt = stmt.limit(limit).offset(offset)

    result = await session.execute(stmt)
    candidates = list(result.scalars().all())
    return candidates, total


async def get_candidate(session: AsyncSession, candidate_id: str) -> DiscoveryCandidate:
    result = await session.execute(
        select(DiscoveryCandidate).where(DiscoveryCandidate.id == candidate_id)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise NotFoundError(f"Candidate {candidate_id} not found")
    return candidate


async def update_candidate_status(
    session: AsyncSession,
    candidate_id: str,
    new_status: str,
    notes: str | None = None,
) -> DiscoveryCandidate:
    candidate = await get_candidate(session, candidate_id)

    valid_statuses = {s.value for s in CandidateStatus}
    if new_status not in valid_statuses:
        raise ValidationError(f"Invalid status: {new_status}. Valid: {valid_statuses}")

    candidate.status = new_status
    if notes is not None:
        candidate.notes = notes
    await session.flush()
    await session.refresh(candidate)
    return candidate


async def _persist_candidate(
    session: AsyncSession,
    raw: RawCandidate,
    run_id: str | None,
    config: dict[str, Any] | None = None,
) -> DiscoveryCandidate | None:
    """Normalize, dedup, score, and persist a single raw candidate."""
    normalized = normalize_candidate(raw)
    completeness = compute_completeness(normalized)
    source_confidence = compute_source_confidence(raw.source)
    contact_status, contact_type, contact_value, contact_confidence = extract_contact(raw.raw_contact)
    candidate_type = classify_candidate_type(contact_status, normalized, raw.source)
    qualification = compute_qualification_score(
        normalized,
        completeness,
        contact_status,
        contact_confidence,
        source_confidence,
        config,
        candidate_type=candidate_type,
    )

    dup_status, dup_confidence, dup_of_id = await check_duplicate(
        session,
        normalized,
        raw.source,
        raw.source_url,
        raw.external_listing_id,
    )

    if dup_status == DuplicateStatus.CONFIRMED_DUPLICATE:
        return None

    candidate = DiscoveryCandidate(
        source=raw.source,
        source_url=raw.source_url,
        external_listing_id=raw.external_listing_id,
        candidate_type=candidate_type,
        raw_payload=raw.raw_payload,
        raw_title=raw.raw_title,
        raw_description=raw.raw_description,
        raw_price=raw.raw_price,
        raw_currency=raw.raw_currency,
        raw_location=raw.raw_location,
        raw_images=raw.raw_images,
        raw_amenities=raw.raw_amenities,
        raw_contact=raw.raw_contact,
        title=normalized["title"],
        description=normalized["description"],
        country=normalized["country"],
        city=normalized["city"],
        zone=normalized["zone"],
        latitude=normalized["latitude"],
        longitude=normalized["longitude"],
        property_type=normalized["property_type"],
        bedrooms=normalized["bedrooms"],
        bathrooms=normalized["bathrooms"],
        guest_capacity=normalized["guest_capacity"],
        nightly_price=normalized["nightly_price"],
        currency=normalized["currency"],
        image_urls=normalized["image_urls"],
        amenities=normalized["amenities"],
        source_confidence=source_confidence,
        data_completeness_score=completeness,
        qualification_score=qualification,
        contact_status=contact_status,
        contact_type=contact_type,
        contact_value=contact_value,
        contact_confidence=contact_confidence,
        duplicate_status=dup_status.value,
        duplicate_confidence=dup_confidence,
        duplicate_of_id=dup_of_id,
        status=CandidateStatus.DISCOVERED if dup_status == DuplicateStatus.UNIQUE else CandidateStatus.DUPLICATE,
        run_id=run_id,
    )
    session.add(candidate)
    await session.flush()
    return candidate


async def run_discovery(
    session: AsyncSession,
    adapter: Any,
    search_config: DiscoverySearchConfig,
    config_id: str | None = None,
    config_dict: dict[str, Any] | None = None,
) -> DiscoveryRun:
    """Execute a full discovery run through the pipeline."""
    run = DiscoveryRun(
        config_id=config_id,
        source=adapter.source_name,
        status=RunStatus.RUNNING,
    )
    session.add(run)
    await session.flush()
    await session.refresh(run)

    errors: list[str] = []
    new_count = 0
    dup_count = 0
    qualified_count = 0
    rejected_count = 0
    pages = 0

    try:
        raw_candidates = await adapter.search(search_config)
        pages = max(1, len(raw_candidates) // 50)

        for raw in raw_candidates:
            try:
                candidate = await _persist_candidate(session, raw, run.id, config_dict)
                if candidate is None:
                    dup_count += 1
                else:
                    new_count += 1
                    if candidate.qualification_score >= 40:
                        qualified_count += 1
                        if candidate.status == CandidateStatus.DISCOVERED:
                            candidate.status = CandidateStatus.QUALIFIED
                    else:
                        rejected_count += 1
            except Exception as exc:
                logger.error("Error persisting candidate: %s", exc)
                errors.append(str(exc))

        run.status = RunStatus.COMPLETED if not errors else RunStatus.PARTIAL

    except Exception as exc:
        logger.error("Discovery run failed: %s", exc)
        errors.append(str(exc))
        run.status = RunStatus.FAILED

    run.completed_at = datetime.now(timezone.utc)
    run.pages_scanned = pages
    run.candidates_found = new_count + dup_count
    run.new_candidates = new_count
    run.duplicates = dup_count
    run.qualified = qualified_count
    run.rejected = rejected_count
    run.errors = errors

    await session.flush()
    await session.refresh(run)
    return run


async def import_candidate(
    session: AsyncSession,
    candidate_id: str,
    host_name: str | None = None,
    host_phone: str | None = None,
    host_email: str | None = None,
    overrides: dict[str, Any] | None = None,
) -> str:
    """Promote a discovery candidate into the existing import pipeline.

    Returns the created unit_id.
    """
    candidate = await get_candidate(session, candidate_id)

    if candidate.status not in (
        CandidateStatus.READY_FOR_IMPORT.value,
        CandidateStatus.PROSPECT.value,
        CandidateStatus.QUALIFIED.value,
        CandidateStatus.OWNER_INTERESTED.value,
    ):
        raise ValidationError(
            f"Candidate must be in READY_FOR_IMPORT, PROSPECT, QUALIFIED, or OWNER_INTERESTED status. "
            f"Current: {candidate.status}"
        )

    if not candidate.title:
        raise ValidationError("Candidate has no title — cannot import")
    if not candidate.city:
        raise ValidationError("Candidate has no city — cannot import")
    if candidate.latitude is None or candidate.longitude is None:
        raise ValidationError("Candidate has no coordinates — cannot import")
    if not candidate.property_type:
        raise ValidationError("Candidate has no property type — cannot import")

    overrides = overrides or {}

    effective_price = overrides.get("price", candidate.nightly_price)
    if effective_price is None or effective_price < 100:
        raise ValidationError("Candidate has no valid price (min 100 EGP) — cannot import")

    row_data = ImportRowData(
        row_number=1,
        title=overrides.get("title", candidate.title) or candidate.title,
        description=overrides.get("description", candidate.description) or candidate.description or f"Discovered via {candidate.source}: {candidate.title or candidate.raw_title}",
        city=overrides.get("city", candidate.city) or candidate.city,
        governorate=overrides.get("governorate", _infer_governorate(candidate.city)) or "Cairo",
        country=overrides.get("country", "Egypt"),
        latitude=float(overrides.get("latitude", candidate.latitude)),
        longitude=float(overrides.get("longitude", candidate.longitude)),
        property_type=overrides.get("property_type", candidate.property_type) or "APARTMENT",
        bedrooms=overrides.get("bedrooms", candidate.bedrooms) or 0,
        beds=overrides.get("beds", 1),
        bathrooms=overrides.get("bathrooms", candidate.bathrooms) or 1,
        max_guests=overrides.get("max_guests", candidate.guest_capacity) or 1,
        price=overrides.get("price", candidate.nightly_price) or 100,
        currency=overrides.get("currency", candidate.currency) or "EGP",
        amenities=overrides.get("amenities", candidate.amenities) or [],
        image_urls=overrides.get("image_urls", candidate.image_urls) or [],
        host_name=host_name,
        host_phone=host_phone,
        host_email=host_email,
        status="PENDING_VERIFICATION",
    )

    result = await execute_import(session, ImportConfirmRequest(rows=[row_data]))

    if result.created > 0 and result.results:
        unit_id = result.results[0].unit_id
        candidate.status = CandidateStatus.IMPORTED
        candidate.imported_unit_id = unit_id
        await session.flush()
        return unit_id or ""
    raise ValidationError(f"Import failed: {result.results[0].error if result.results else 'unknown'}")


def _infer_governorate(city: str | None) -> str:
    from app.discovery.normalizer import infer_governorate
    return infer_governorate(city) or "Cairo"


async def get_stats(session: AsyncSession) -> dict[str, Any]:
    """Get discovery pipeline statistics."""
    total = await session.scalar(select(func.count()).select_from(DiscoveryCandidate))
    unique = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.duplicate_status == "UNIQUE").subquery()
        )
    )
    qualified = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.qualification_score >= 60).subquery()
        )
    )
    prospects = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.status == CandidateStatus.PROSPECT).subquery()
        )
    )
    contacted = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.status == CandidateStatus.CONTACTED).subquery()
        )
    )
    interested = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.status == CandidateStatus.OWNER_INTERESTED).subquery()
        )
    )
    ready = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.status == CandidateStatus.READY_FOR_IMPORT).subquery()
        )
    )
    imported = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.status == CandidateStatus.IMPORTED).subquery()
        )
    )
    duplicates = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(DiscoveryCandidate.duplicate_status != "UNIQUE").subquery()
        )
    )

    # By source
    source_stmt = (
        select(DiscoveryCandidate.source, func.count())
        .group_by(DiscoveryCandidate.source)
    )
    source_result = await session.execute(source_stmt)
    by_source = {row[0]: row[1] for row in source_result}

    # By candidate_type
    type_stmt = (
        select(DiscoveryCandidate.candidate_type, func.count())
        .group_by(DiscoveryCandidate.candidate_type)
    )
    type_result = await session.execute(type_stmt)
    by_type = {row[0]: row[1] for row in type_result}

    # Contactable candidates (with phone/whatsapp/email)
    contactable = await session.scalar(
        select(func.count()).select_from(
            select(DiscoveryCandidate).where(
                DiscoveryCandidate.contact_status == "AVAILABLE"
            ).subquery()
        )
    )

    total_count = total or 1
    dup_rate = round((duplicates or 0) / total_count * 100, 1)

    return {
        "total_candidates": total or 0,
        "unique_candidates": unique or 0,
        "qualified_candidates": qualified or 0,
        "prospects": prospects or 0,
        "contacted": contacted or 0,
        "owner_responses": 0,
        "owners_interested": interested or 0,
        "ready_for_import": ready or 0,
        "imported": imported or 0,
        "duplicate_rate": dup_rate,
        "by_source": by_source,
        "by_candidate_type": by_type,
        "contactable_candidates": contactable or 0,
    }
