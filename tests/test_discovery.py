"""Tests for the supply discovery module — normalizer, scoring, dedup, adapters, API."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.discovery.adapters.base import DiscoverySearchConfig, RawCandidate, SourceRegistry
from app.discovery.adapters.google_places import GooglePlacesAdapter
from app.discovery.adapters.json_api import JsonApiAdapter
from app.discovery.adapters.manual import ManualSourceAdapter
from app.discovery.adapters.overpass import OverpassAdapter, _build_overpass_query, _get_bbox
from app.discovery.constants import (
    CandidateType,
    DuplicateStatus,
    SourceStatus,
)
from app.discovery.dedup import (
    classify_duplicate,
    compute_duplicate_confidence,
    coordinate_similarity,
    price_similarity,
    title_similarity,
)
from app.discovery.normalizer import (
    compute_completeness,
    normalize_candidate,
    normalize_city,
    normalize_property_type,
    parse_coordinates,
    parse_price,
)
from app.discovery.scoring import (
    PLACE_WEIGHTS,
    classify_candidate_type,
    classify_qualification,
    compute_qualification_score,
    compute_source_confidence,
    extract_contact,
)

# ─── Normalizer Tests ───


class TestNormalizer:
    def test_normalize_property_type_apartment(self):
        assert normalize_property_type("apartment") == "APARTMENT"
        assert normalize_property_type("flat") == "APARTMENT"
        assert normalize_property_type("شقة") == "APARTMENT"

    def test_normalize_property_type_villa(self):
        assert normalize_property_type("villa") == "VILLA"
        assert normalize_property_type("house") == "VILLA"

    def test_normalize_property_type_unknown(self):
        assert normalize_property_type("yurt") == "YURT"

    def test_normalize_property_type_none(self):
        assert normalize_property_type(None) is None

    def test_normalize_city_cairo(self):
        assert normalize_city("new cairo") == "New Cairo"
        assert normalize_city("Maadi") == "Maadi"
        assert normalize_city("المعادي") == "Maadi"

    def test_normalize_city_unknown(self):
        assert normalize_city("Unknown City") == "Unknown City"

    def test_parse_price_numeric(self):
        price, currency = parse_price("1500", "EGP")
        assert price == 1500
        assert currency == "EGP"

    def test_parse_price_with_text(self):
        price, currency = parse_price("EGP 2,500/night", None)
        assert price == 2500
        assert currency == "EGP"

    def test_parse_price_none(self):
        price, currency = parse_price(None, None)
        assert price is None
        assert currency is None

    def test_parse_coordinates_from_payload(self):
        lat, lng = parse_coordinates(None, {"latitude": 30.05, "longitude": 31.23})
        assert lat == 30.05
        assert lng == 31.23

    def test_parse_coordinates_from_location_string(self):
        lat, lng = parse_coordinates("30.05, 31.23", {})
        assert lat == 30.05
        assert lng == 31.23

    def test_parse_coordinates_invalid(self):
        lat, lng = parse_coordinates("not coords", {})
        assert lat is None
        assert lng is None

    def test_normalize_candidate_full(self):
        raw = RawCandidate(
            source="test",
            source_url="https://example.com/listing/1",
            external_listing_id="123",
            raw_title="Beautiful Apartment in Maadi",
            raw_description="2 bedroom apartment, sleeps 4",
            raw_price="EGP 1,500",
            raw_currency="EGP",
            raw_location="Maadi",
            raw_images=["https://img.example.com/1.jpg"],
            raw_amenities=["wifi", "ac"],
            raw_contact={"phone": "+201234567890"},
            raw_payload={"bedrooms": 2, "property_type": "apartment"},
        )
        result = normalize_candidate(raw)
        assert result["title"] == "Beautiful Apartment in Maadi"
        assert result["city"] == "Maadi"
        assert result["property_type"] == "APARTMENT"
        assert result["nightly_price"] == 1500
        assert result["currency"] == "EGP"
        assert result["bedrooms"] == 2
        assert result["image_urls"] == ["https://img.example.com/1.jpg"]

    def test_compute_completeness_full(self):
        normalized = {
            "title": "Test",
            "description": "Desc",
            "city": "Cairo",
            "latitude": 30.0,
            "longitude": 31.0,
            "property_type": "APARTMENT",
            "nightly_price": 500,
            "bedrooms": 2,
            "bathrooms": 1,
            "guest_capacity": 4,
            "image_urls": ["url"],
        }
        assert compute_completeness(normalized) == 100.0

    def test_compute_completeness_partial(self):
        normalized = {
            "title": "Test",
            "city": "Cairo",
            "property_type": "APARTMENT",
            "nightly_price": 500,
        }
        score = compute_completeness(normalized)
        assert 0 < score < 100


# ─── Scoring Tests ───


class TestScoring:
    def test_compute_qualification_high_score(self):
        normalized = {
            "title": "Test",
            "city": "Cairo",
            "property_type": "APARTMENT",
            "nightly_price": 1500,
            "country": "Egypt",
        }
        score = compute_qualification_score(
            normalized,
            completeness_score=90.0,
            contact_status="AVAILABLE",
            contact_confidence=1.0,
            source_confidence=0.9,
        )
        assert score >= 60

    def test_compute_qualification_low_score(self):
        normalized = {
            "title": None,
            "city": None,
            "property_type": None,
            "nightly_price": None,
        }
        score = compute_qualification_score(
            normalized,
            completeness_score=10.0,
            contact_status="NOT_AVAILABLE",
            contact_confidence=0.0,
            source_confidence=0.3,
        )
        assert score < 40

    def test_classify_qualification_bands(self):
        assert classify_qualification(85) == "HIGH_PRIORITY"
        assert classify_qualification(70) == "REVIEW"
        assert classify_qualification(50) == "LOW_PRIORITY"
        assert classify_qualification(30) == "REJECT"

    def test_extract_contact_phone(self):
        status, ctype, value, confidence = extract_contact({"phone": "+201234567890"})
        assert status == "AVAILABLE"
        assert ctype == "phone"
        assert value == "+201234567890"
        assert confidence == 1.0

    def test_extract_contact_whatsapp(self):
        status, ctype, value, confidence = extract_contact({"whatsapp": "+201111111111"})
        assert status == "AVAILABLE"
        assert ctype == "whatsapp"

    def test_extract_contact_none(self):
        status, ctype, value, confidence = extract_contact({})
        assert status == "NOT_AVAILABLE"
        assert value is None

    def test_compute_source_confidence(self):
        assert compute_source_confidence("airbnb") == 0.9
        assert compute_source_confidence("json_api") == 0.8
        assert compute_source_confidence("unknown") == 0.5


# ─── Dedup Tests ───


class TestDedup:
    def test_title_similarity_identical(self):
        assert title_similarity("Beautiful Apartment", "Beautiful Apartment") == 1.0

    def test_title_similarity_different(self):
        sim = title_similarity("Beautiful Apartment", "Villa with Pool")
        assert sim < 0.5

    def test_title_similarity_none(self):
        assert title_similarity(None, "Test") == 0.0

    def test_price_similarity_identical(self):
        assert price_similarity(1500, 1500) == 1.0

    def test_price_similarity_close(self):
        sim = price_similarity(1500, 1600)
        assert sim > 0.9

    def test_price_similarity_none(self):
        assert price_similarity(None, 1500) == 0.0

    def test_coordinate_similarity_same(self):
        assert coordinate_similarity(30.05, 31.23, 30.05, 31.23) == 1.0

    def test_coordinate_similarity_far(self):
        assert coordinate_similarity(30.05, 31.23, 31.0, 32.0) == 0.0

    def test_compute_duplicate_confidence_same_url(self):
        candidate = {"source_url": "https://example.com/1", "title": "Test", "city": "Cairo"}
        existing = {"source_url": "https://example.com/1", "title": "Test", "city": "Cairo"}
        confidence = compute_duplicate_confidence(candidate, existing)
        assert confidence >= 0.85

    def test_compute_duplicate_confidence_different(self):
        candidate = {
            "source_url": "https://example.com/1",
            "title": "Apartment in Cairo",
            "city": "Cairo",
            "nightly_price": 1500,
            "latitude": 30.05,
            "longitude": 31.23,
            "bedrooms": 2,
        }
        existing = {
            "source_url": "https://example.com/2",
            "title": "Villa in Giza",
            "city": "Giza",
            "nightly_price": 5000,
            "latitude": 30.0,
            "longitude": 31.2,
            "bedrooms": 4,
        }
        confidence = compute_duplicate_confidence(candidate, existing)
        assert confidence < 0.5

    def test_classify_duplicate(self):
        assert classify_duplicate(0.9) == DuplicateStatus.CONFIRMED_DUPLICATE
        assert classify_duplicate(0.7) == DuplicateStatus.POSSIBLE_DUPLICATE
        assert classify_duplicate(0.3) == DuplicateStatus.UNIQUE


# ─── Adapter Tests ───


class TestAdapters:
    def test_manual_source_adapter(self):
        adapter = ManualSourceAdapter("airbnb")
        assert adapter.source_name == "airbnb"
        assert adapter.source_status == SourceStatus.MANUAL_SOURCE
        assert adapter.is_available()

    @pytest.mark.asyncio
    async def test_manual_source_search_returns_empty(self):
        adapter = ManualSourceAdapter("airbnb")
        config = DiscoverySearchConfig(city="Cairo")
        results = await adapter.search(config)
        assert results == []

    def test_source_registry(self):
        reg = SourceRegistry()
        adapter1 = ManualSourceAdapter("source1")
        adapter2 = ManualSourceAdapter("source2")
        reg.register(adapter1)
        reg.register(adapter2)
        assert reg.get("source1") == adapter1
        assert reg.get("source2") == adapter2
        assert reg.get("nonexistent") is None
        assert len(reg.get_available()) == 2
        assert len(reg.list_sources()) == 2

    def test_json_api_adapter_init(self):
        adapter = JsonApiAdapter(
            base_url="https://api.example.com/search",
            listing_url_template="https://example.com/listing/{id}",
            source_name="test_api",
        )
        assert adapter.source_name == "test_api"
        assert adapter.source_status == SourceStatus.ENABLED

    @pytest.mark.asyncio
    async def test_json_api_adapter_search_mock(self):
        adapter = JsonApiAdapter(
            base_url="https://api.example.com/search",
            source_name="test_api",
            rate_limit_seconds=0,
        )
        config = DiscoverySearchConfig(city="Cairo", max_candidates=2)

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": [
                {
                    "id": "123",
                    "url": "https://example.com/1",
                    "title": "Test Apartment",
                    "description": "Nice place",
                    "price": "1500",
                    "currency": "EGP",
                    "location": "Cairo",
                    "images": ["https://img.example.com/1.jpg"],
                    "amenities": ["wifi"],
                    "contact": {"phone": "+201234567890"},
                },
            ],
            "has_more": False,
        }
        mock_response.raise_for_status = MagicMock()

        with patch("app.discovery.adapters.json_api.httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=None)
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value = mock_client

            results = await adapter.search(config)

        assert len(results) == 1
        assert results[0].source == "test_api"
        assert results[0].raw_title == "Test Apartment"
        assert results[0].external_listing_id == "123"


# ─── API Integration Tests ───


class TestDiscoveryAPI:
    def test_list_sources_requires_auth(self, client):
        response = client.get("/api/v1/discovery/sources")
        assert response.status_code == 401

    def test_list_sources_requires_admin(self, client):
        from app.auth.services import create_access_token

        user = type("U", (), {
            "id": "test-guest-001",
            "phone_number": "+201000000000",
            "email": "guest@test.com",
            "role": "guest",
            "kyc_status": "VERIFIED",
            "is_active": True,
        })()
        token = create_access_token(user)

        with patch("app.auth.repository.get_user_by_id", new_callable=AsyncMock) as mock_get_user:
            mock_get_user.return_value = user
            response = client.get(
                "/api/v1/discovery/sources",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403

    def test_list_sources_success(self, client, mock_redis_client):
        from app.auth.services import create_access_token

        user = type("U", (), {
            "id": "test-admin-001",
            "phone_number": "+201000000000",
            "email": "admin@test.com",
            "role": "admin",
            "kyc_status": "VERIFIED",
            "is_active": True,
        })()
        token = create_access_token(user)

        with patch("app.auth.repository.get_user_by_id", new_callable=AsyncMock) as mock_get_user:
            mock_get_user.return_value = user
            response = client.get(
                "/api/v1/discovery/sources",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert any(s["source"] == "airbnb" for s in data)

    def test_list_sources_includes_overpass(self, client, mock_redis_client):
        from app.auth.services import create_access_token
        user = type("U", (), {"id": "test-admin-002", "phone_number": "+201000000000", "email": "admin@test.com", "role": "admin", "kyc_status": "VERIFIED", "is_active": True})()
        token = create_access_token(user)
        with patch("app.auth.repository.get_user_by_id", new_callable=AsyncMock) as mock_get_user:
            mock_get_user.return_value = user
            response = client.get("/api/v1/discovery/sources", headers={"Authorization": f"Bearer {token}"})
            assert response.status_code == 200
            sources = {s["source"]: s["status"] for s in response.json()}
            assert sources.get("overpass_osm") == "ENABLED"
            assert sources.get("google_places") == "REQUIRES_CREDENTIALS"


class TestOverpassAdapter:
    def test_adapter_init(self):
        a = OverpassAdapter()
        assert a.source_name == "overpass_osm"
        assert a.source_status == SourceStatus.ENABLED
        assert a.is_available()

    def test_build_query(self):
        q = _build_overpass_query((29.95, 31.40, 30.10, 31.60), 50)
        assert "[out:json]" in q and "tourism" in q and "out center tags" in q

    def test_get_bbox_new_cairo(self):
        bbox = _get_bbox(DiscoverySearchConfig(city="New Cairo"))
        assert len(bbox) == 4 and bbox[0] < bbox[2] and bbox[1] < bbox[3]

    def test_get_bbox_unknown_defaults_egypt(self):
        bbox = _get_bbox(DiscoverySearchConfig(city="Unknown", country="Egypt"))
        assert len(bbox) == 4

    def test_map_element_node(self):
        a = OverpassAdapter()
        c = a._map_element({"type": "node", "id": 123, "lat": 30.05, "lon": 31.5, "tags": {"tourism": "hotel", "name": "Test", "addr:city": "New Cairo", "phone": "+201234"}})
        assert c is not None
        assert c.external_listing_id == "osm_node_123"
        assert c.raw_title == "Test"
        assert c.raw_contact["phone"] == "+201234"
        assert c.raw_payload["lat"] == 30.05

    def test_map_element_way_with_center(self):
        a = OverpassAdapter()
        c = a._map_element({"type": "way", "id": 789, "center": {"lat": 30.0, "lon": 31.0}, "tags": {"tourism": "apartment"}})
        assert c is not None
        assert c.external_listing_id == "osm_way_789"
        assert c.raw_payload["lat"] == 30.0

    def test_map_element_no_tags(self):
        a = OverpassAdapter()
        assert a._map_element({"type": "node", "id": 1, "lat": 30.0, "lon": 31.0}) is None

    def test_map_element_no_coords(self):
        a = OverpassAdapter()
        assert a._map_element({"type": "node", "id": 1, "tags": {"tourism": "hotel"}}) is None

    def test_map_element_non_accommodation(self):
        a = OverpassAdapter()
        assert a._map_element({"type": "node", "id": 1, "lat": 30.0, "lon": 31.0, "tags": {"tourism": "attraction"}}) is None

    @pytest.mark.asyncio
    async def test_search_with_mock_response(self):
        a = OverpassAdapter(rate_limit_seconds=0)
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"elements": [
            {"type": "node", "id": 100, "lat": 30.05, "lon": 31.5, "tags": {"tourism": "hotel", "name": "Mock Hotel"}},
            {"type": "node", "id": 200, "lat": 30.06, "lon": 31.51, "tags": {"tourism": "apartment", "name": "Mock Apt"}},
        ]}
        mock_resp.raise_for_status = MagicMock()
        with patch("app.discovery.adapters.overpass.httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=None)
            mock_client.post = AsyncMock(return_value=mock_resp)
            mock_cls.return_value = mock_client
            results = await a.search(DiscoverySearchConfig(city="New Cairo", max_candidates=10))
        assert len(results) == 2
        assert results[0].raw_title == "Mock Hotel"
        assert results[1].raw_title == "Mock Apt"

    @pytest.mark.asyncio
    async def test_search_all_endpoints_timeout(self):
        a = OverpassAdapter(endpoints=["https://invalid.example.com/api"], rate_limit_seconds=0)
        results = await a.search(DiscoverySearchConfig(city="New Cairo", max_candidates=5))
        assert results == []


class TestGooglePlacesAdapter:
    def test_adapter_no_key_requires_credentials(self):
        a = GooglePlacesAdapter(api_key=None)
        assert a.source_status == SourceStatus.REQUIRES_CREDENTIALS
        assert not a.is_available()

    def test_adapter_with_key_enabled(self):
        a = GooglePlacesAdapter(api_key="fake_key")
        assert a.source_status == SourceStatus.ENABLED
        assert a.is_available()

    @pytest.mark.asyncio
    async def test_search_no_key_returns_empty(self):
        a = GooglePlacesAdapter(api_key=None)
        results = await a.search(DiscoverySearchConfig(city="Cairo", max_candidates=10))
        assert results == []

    def test_map_place(self):
        a = GooglePlacesAdapter(api_key="fake")
        c = a._map_place({
            "id": "place123",
            "displayName": {"text": "Test Hotel"},
            "location": {"latitude": 30.05, "longitude": 31.50},
            "formattedAddress": "123 Test St, Cairo",
            "primaryType": "hotel",
            "internationalPhoneNumber": "+201234567890",
            "websiteUri": "https://example.com",
        })
        assert c is not None
        assert c.external_listing_id == "gplaces_place123"
        assert c.raw_title == "Test Hotel"
        assert c.raw_contact["phone"] == "+201234567890"
        assert c.raw_payload["mapped_property_type"] == "HOTEL_ROOM"

    def test_map_place_no_id(self):
        a = GooglePlacesAdapter(api_key="fake")
        assert a._map_place({"displayName": {"text": "No ID"}}) is None

    def test_map_place_no_location(self):
        a = GooglePlacesAdapter(api_key="fake")
        assert a._map_place({"id": "123", "displayName": {"text": "Test"}}) is None


class TestCandidateTypeClassification:
    def test_with_contact_is_supply_lead(self):
        assert classify_candidate_type("AVAILABLE", {}, "overpass_osm") == CandidateType.SUPPLY_LEAD

    def test_without_contact_is_place(self):
        assert classify_candidate_type("NOT_AVAILABLE", {}, "overpass_osm") == CandidateType.PLACE

    def test_with_price_is_supply_lead(self):
        assert classify_candidate_type("NOT_AVAILABLE", {"nightly_price": 500}, "overpass_osm") == CandidateType.SUPPLY_LEAD


class TestPlaceScoring:
    def test_place_weights_zero_price(self):
        assert PLACE_WEIGHTS["price"] == 0

    def test_place_score_not_penalized_for_missing_price(self):
        normalized = {"city": "New Cairo", "country": "Egypt", "property_type": "APARTMENT", "nightly_price": None}
        place_score = compute_qualification_score(
            normalized, 50.0, "NOT_AVAILABLE", 0.0, 0.7,
            {"city": "New Cairo", "country": "Egypt"}, candidate_type="PLACE")
        default_score = compute_qualification_score(
            normalized, 50.0, "NOT_AVAILABLE", 0.0, 0.7,
            {"city": "New Cairo", "country": "Egypt"})
        assert place_score > default_score

    def test_supply_lead_with_contact_scores_higher(self):
        normalized = {"city": "New Cairo", "country": "Egypt", "property_type": "HOTEL_ROOM", "nightly_price": None}
        score = compute_qualification_score(
            normalized, 60.0, "AVAILABLE", 1.0, 0.7,
            {"city": "New Cairo", "country": "Egypt"}, candidate_type="SUPPLY_LEAD")
        assert score >= 60.0


class TestSourceConfidenceUpdates:
    def test_overpass_confidence(self):
        assert compute_source_confidence("overpass_osm") == 0.7

    def test_google_places_confidence(self):
        assert compute_source_confidence("google_places") == 0.8
