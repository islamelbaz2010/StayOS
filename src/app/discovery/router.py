"""API router for the supply discovery pipeline."""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.discovery import services as discovery_services
from app.discovery.adapters.base import DiscoverySearchConfig, registry
from app.discovery.schemas import (
    CandidateImportRequest,
    CandidateListResponse,
    CandidateStatusUpdate,
    DiscoveryCandidateResponse,
    DiscoveryConfigCreate,
    DiscoveryConfigResponse,
    DiscoveryRunResponse,
    DiscoveryRunTriggerRequest,
    DiscoveryStatsResponse,
)
from app.shared.exceptions import StayOSError, to_http_exception

router = APIRouter(prefix="/discovery", tags=["discovery"])


@router.get("/sources")
async def list_sources(
    _: User = Depends(auth_dependencies.require_role("admin")),
) -> list[dict[str, str]]:
    return registry.list_sources()


@router.get("/stats", response_model=DiscoveryStatsResponse)
async def get_discovery_stats(
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> DiscoveryStatsResponse:
    stats = await discovery_services.get_stats(session)
    return DiscoveryStatsResponse(**stats)


# --- Configs ---

@router.post("/configs", response_model=DiscoveryConfigResponse)
async def create_config(
    request: DiscoveryConfigCreate,
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> DiscoveryConfigResponse:
    config = await discovery_services.create_config(session, request.model_dump())
    return DiscoveryConfigResponse.model_validate(config)


@router.get("/configs", response_model=list[DiscoveryConfigResponse])
async def list_configs(
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> list[DiscoveryConfigResponse]:
    configs = await discovery_services.list_configs(session)
    return [DiscoveryConfigResponse.model_validate(c) for c in configs]


# --- Candidates ---

@router.get("/candidates", response_model=CandidateListResponse)
async def list_candidates(
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
    source: str | None = Query(None),
    city: str | None = Query(None),
    property_type: str | None = Query(None),
    status: str | None = Query(None),
    candidate_type: str | None = Query(None),
    duplicate_status: str | None = Query(None),
    contact_status: str | None = Query(None),
    min_score: float | None = Query(None),
    max_score: float | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("newest"),
) -> CandidateListResponse:
    candidates, total = await discovery_services.list_candidates(
        session,
        source=source,
        city=city,
        property_type=property_type,
        status=status,
        candidate_type=candidate_type,
        duplicate_status=duplicate_status,
        contact_status=contact_status,
        min_score=min_score,
        max_score=max_score,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
    )
    return CandidateListResponse(
        data=[DiscoveryCandidateResponse.model_validate(c) for c in candidates],
        pagination={
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
        },
    )


@router.get("/candidates/{candidate_id}", response_model=DiscoveryCandidateResponse)
async def get_candidate(
    candidate_id: str,
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> DiscoveryCandidateResponse:
    candidate = await discovery_services.get_candidate(session, candidate_id)
    return DiscoveryCandidateResponse.model_validate(candidate)


@router.patch("/candidates/{candidate_id}/status", response_model=DiscoveryCandidateResponse)
async def update_candidate_status(
    candidate_id: str,
    request: CandidateStatusUpdate,
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> DiscoveryCandidateResponse:
    candidate = await discovery_services.update_candidate_status(
        session, candidate_id, request.status, request.notes
    )
    return DiscoveryCandidateResponse.model_validate(candidate)


@router.post("/candidates/{candidate_id}/import", response_model=dict)
async def import_candidate(
    candidate_id: str,
    request: CandidateImportRequest,
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    unit_id = await discovery_services.import_candidate(
        session,
        candidate_id,
        host_name=request.host_name,
        host_phone=request.host_phone,
        host_email=request.host_email,
        overrides=request.overrides,
    )
    return {"unit_id": unit_id, "status": "PENDING_VERIFICATION"}


# --- Runs ---

@router.post("/runs", response_model=DiscoveryRunResponse)
async def trigger_run(
    request: DiscoveryRunTriggerRequest,
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> DiscoveryRunResponse:
    source = request.source or "json_api"
    adapter = registry.get(source)
    if not adapter:
        raise to_http_exception(StayOSError(f"Source '{source}' not registered"))

    if not adapter.is_available():
        raise to_http_exception(StayOSError(f"Source '{source}' is not available (status: {adapter.source_status})"))

    config_dict: dict[str, Any] = {}
    config_id = request.config_id

    if config_id:
        from sqlalchemy import select as sa_select

        from app.discovery.models import DiscoveryConfig
        result = await session.execute(
            sa_select(DiscoveryConfig).where(DiscoveryConfig.id == config_id)
        )
        config = result.scalar_one_or_none()
        if config:
            config_dict = {
                "city": config.city,
                "zone": config.zone,
                "property_type": config.property_type,
                "min_price": config.min_price,
                "max_price": config.max_price,
                "country": config.country,
            }

    search_config = DiscoverySearchConfig(
        country=config_dict.get("country", "Egypt"),
        city=config_dict.get("city"),
        zone=config_dict.get("zone"),
        property_type=config_dict.get("property_type"),
        min_price=config_dict.get("min_price"),
        max_price=config_dict.get("max_price"),
    )

    run = await discovery_services.run_discovery(
        session, adapter, search_config, config_id=config_id, config_dict=config_dict or None
    )
    return DiscoveryRunResponse.model_validate(run)


@router.get("/runs", response_model=list[DiscoveryRunResponse])
async def list_runs(
    _: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(20, ge=1, le=100),
) -> list[DiscoveryRunResponse]:
    from sqlalchemy import select as sa_select

    from app.discovery.models import DiscoveryRun
    result = await session.execute(
        sa_select(DiscoveryRun).order_by(DiscoveryRun.created_at.desc()).limit(limit)
    )
    runs = result.scalars().all()
    return [DiscoveryRunResponse.model_validate(r) for r in runs]
