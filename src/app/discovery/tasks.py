"""Celery tasks for the supply discovery pipeline."""

import logging

from sqlalchemy import select

from app.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.discovery.adapters.base import DiscoverySearchConfig, registry
from app.discovery.models import DiscoveryConfig
from app.discovery.services import run_discovery

logger = logging.getLogger(__name__)


@celery_app.task(name="app.discovery.tasks.run_scheduled_discovery")
def run_scheduled_discovery() -> dict:
    """Run discovery for all enabled configs."""
    import asyncio

    async def _run() -> dict:
        results = []
        async with AsyncSessionLocal() as session:
            stmt = select(DiscoveryConfig).where(DiscoveryConfig.enabled.is_(True))
            result = await session.execute(stmt)
            configs = result.scalars().all()

            for config in configs:
                adapter = registry.get(config.source)
                if not adapter or not adapter.is_available():
                    logger.info("Skipping config '%s' — source '%s' not available", config.name, config.source)
                    continue

                search_config = DiscoverySearchConfig(
                    country=config.country,
                    city=config.city,
                    zone=config.zone,
                    property_type=config.property_type,
                    min_price=config.min_price,
                    max_price=config.max_price,
                    min_bedrooms=config.min_bedrooms,
                    min_guest_capacity=config.min_guest_capacity,
                    keywords=config.keywords,
                    max_candidates=config.max_candidates_per_run,
                )

                config_dict = {
                    "city": config.city,
                    "zone": config.zone,
                    "property_type": config.property_type,
                    "min_price": config.min_price,
                    "max_price": config.max_price,
                    "country": config.country,
                }

                try:
                    run = await run_discovery(
                        session, adapter, search_config,
                        config_id=config.id,
                        config_dict=config_dict,
                    )
                    results.append({
                        "config": config.name,
                        "run_id": run.id,
                        "status": run.status,
                        "new_candidates": run.new_candidates,
                        "duplicates": run.duplicates,
                    })
                    await session.commit()
                except Exception as exc:
                    logger.error("Discovery run failed for config '%s': %s", config.name, exc)
                    results.append({
                        "config": config.name,
                        "error": str(exc),
                    })

        return {"runs": results}

    return asyncio.run(_run())


@celery_app.task(name="app.discovery.tasks.run_discovery_manual")
def run_discovery_manual(source: str, config_id: str | None = None) -> dict:
    """Manually trigger a discovery run for a specific source."""
    import asyncio

    async def _run() -> dict:
        adapter = registry.get(source)
        if not adapter:
            return {"error": f"Source '{source}' not registered"}
        if not adapter.is_available():
            return {"error": f"Source '{source}' not available"}

        async with AsyncSessionLocal() as session:
            config_dict: dict = {}
            if config_id:
                stmt = select(DiscoveryConfig).where(DiscoveryConfig.id == config_id)
                result = await session.execute(stmt)
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

            run = await run_discovery(
                session, adapter, search_config,
                config_id=config_id,
                config_dict=config_dict or None,
            )
            await session.commit()
            return {
                "run_id": run.id,
                "status": run.status,
                "new_candidates": run.new_candidates,
                "duplicates": run.duplicates,
                "qualified": run.qualified,
            }

    return asyncio.run(_run())
