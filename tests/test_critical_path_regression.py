"""Regression tests for critical-path fixes: price override, description fallback, approval."""
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.discovery.constants import CandidateStatus
from app.importer.schemas import ImportResultRow, ImportSummaryResponse
from app.shared.exceptions import ValidationError


def _cand(**kw):
    c = MagicMock()
    c.id = "cand-1"
    c.status = kw.get("status", CandidateStatus.QUALIFIED.value)
    c.title = kw.get("title", "Test Hotel")
    c.city = kw.get("city", "Cairo")
    c.latitude = 30.0
    c.longitude = 31.0
    c.property_type = kw.get("property_type", "HOTEL_ROOM")
    c.nightly_price = kw.get("nightly_price", None)
    c.description = kw.get("description", None)
    c.source = kw.get("source", "overpass_osm")
    c.raw_title = kw.get("raw_title", "Test Hotel")
    c.bedrooms = None
    c.bathrooms = None
    c.guest_capacity = None
    c.currency = None
    c.amenities = []
    c.image_urls = []
    c.contact_value = None
    c.contact_type = None
    return c


def _import_ok():
    return ImportSummaryResponse(
        total_requested=1, created=1, failed=0,
        results=[ImportResultRow(row_number=1, title="Test Hotel", unit_id="unit-1", status="created")],
    )


class TestImportPriceOverride:
    """Bug: import_candidate validated candidate.nightly_price before checking overrides.
    Fix: resolve effective_price from overrides first."""

    @pytest.mark.asyncio
    async def test_no_price_with_override_succeeds(self, monkeypatch):
        from app.discovery import services

        monkeypatch.setattr(services, "get_candidate", AsyncMock(return_value=_cand()))
        captured = []
        async def fake_exec(session, req):
            captured.extend(req.rows)
            return _import_ok()
        monkeypatch.setattr(services, "execute_import", fake_exec)

        session = AsyncMock()
        unit_id = await services.import_candidate(
            session, "cand-1", host_name="Owner", overrides={"price": 500}
        )
        assert unit_id == "unit-1"
        assert captured[0].price == 500

    @pytest.mark.asyncio
    async def test_no_price_without_override_fails(self, monkeypatch):
        from app.discovery import services

        monkeypatch.setattr(services, "get_candidate", AsyncMock(return_value=_cand()))
        monkeypatch.setattr(services, "execute_import", AsyncMock(return_value=_import_ok()))

        session = AsyncMock()
        with pytest.raises(ValidationError, match="price"):
            await services.import_candidate(session, "cand-1", host_name="Owner")


class TestImportDescriptionFallback:
    """Bug: candidates with description=None failed import validation.
    Fix: generate deterministic fallback from source + title."""

    @pytest.mark.asyncio
    async def test_none_description_gets_fallback(self, monkeypatch):
        from app.discovery import services

        cand = _cand(title="Hyatt Regency", source="overpass_osm", description=None)
        monkeypatch.setattr(services, "get_candidate", AsyncMock(return_value=cand))
        captured = []
        async def fake_exec(session, req):
            captured.extend(req.rows)
            return _import_ok()
        monkeypatch.setattr(services, "execute_import", fake_exec)

        session = AsyncMock()
        await services.import_candidate(
            session, "cand-1", host_name="Owner", overrides={"price": 500}
        )
        desc = captured[0].description
        assert "overpass_osm" in desc
        assert "Hyatt Regency" in desc
        assert len(desc) > 10
