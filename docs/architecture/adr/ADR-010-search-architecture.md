# ADR-010: Search Architecture

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend — FastAPI), ADR-005 (Database — PostGIS), ADR-001 (Frontend — map UI)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — "Maps: Google Maps API (Arabic geocoding)"
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §6 FC-02 Spatial Search definition, §11 search < 2 seconds
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §2 PMS Core with FC-02 Search
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 PostGIS confirmed, Google Maps API confirmed
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §3 Business Rules

---

## Problem

FC-02 Spatial Search Engine requires:
1. **Geo-spatial proximity queries**: Find listings within a map viewport or within X km of a point
2. **Interactive map rendering**: Google Maps with Arabic geocoding
3. **Full-text search**: Property names, descriptions in Arabic and English
4. **Filtered search**: Dates, price range, amenities, family-friendly/halal filters

PostGIS is confirmed for geo-spatial queries. However:
- Full-text search strategy is not defined (PostgreSQL tsvector vs Elasticsearch vs Algolia)
- Map tile rendering strategy is not defined
- Arabic full-text search requirements are unique — Arabic morphology requires specialized tokenization

The search < 2 second threshold (PRODUCT_CANON.md §11) is non-negotiable.

---

## Search Components

### Component 1: Geo-Spatial Query (Confirmed: PostGIS)

**Decision**: PostGIS on PostgreSQL (already confirmed in TECH_STACK.md).

Implementation:
- `unit` table stores `coordinates GEOMETRY(POINT, 4326)` column with GIST spatial index
- Search query: `ST_DWithin(coordinates, ST_MakePoint($lng, $lat)::geography, $radius_meters)` for radius search
- Viewport search: `ST_Within(coordinates, ST_MakeEnvelope($sw_lng, $sw_lat, $ne_lng, $ne_lat, 4326))` for map viewport bounds
- Spatial index makes viewport queries < 50ms even at 100K+ listings

No alternatives evaluated — PostGIS is confirmed and sufficient for Phase 1–3 scale.

### Component 2: Map Rendering (Confirmed: Google Maps API)

**Decision**: Google Maps JavaScript API (Arabic geocoding confirmed in MASTER_CONTEXT.md).

Implementation in Next.js:
- `@vis.gl/react-google-maps` library for React-native Maps integration
- Arabic locale: `language=ar&region=EG` query parameters on Maps API load
- Dynamic pin clustering: `@googlemaps/markerclusterer` for viewport density management
- Price overlays on map pins (FEATURE_CATALOG.md FC-02 requirement)
- RTL-aware controls (zoom, search box) per ENGINEERING_RULES.md §9

Cost: Google Maps Platform — $7 per 1,000 Dynamic Maps loads. At Phase 1 volume (10K sessions/month): ~$70/month. Acceptable.

### Component 3: Full-Text Search — Decision Required

Arabic full-text search is uniquely challenging:
- Arabic is a morphologically rich language — "شقة" (apartment) has 15+ derived forms
- Standard PostgreSQL `tsvector` uses `simple` or `english` dictionaries — does not handle Arabic morphology
- Algolia has Arabic support but adds cost and vendor dependency
- Elasticsearch has Arabic analyzer plugin

**Options**:

**Option A: PostgreSQL tsvector with `arabic` text search configuration**

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Zero additional cost. Stays within PostgreSQL. |
| **Scalability** | Sufficient for Phase 1 (<10K listings). Degrades at 100K+ listings for complex Arabic queries. |
| **Operational Complexity** | Low. No new infrastructure. |
| **Security** | Same as PostgreSQL. |
| **Performance** | GIN index on tsvector column. Arabic: standard PostgreSQL `simple` dictionary does not stem Arabic words correctly. Basic prefix search works; morphological matching does not. |
| **Arabic NLP** | Limited. English works well; Arabic needs `unaccent` + `arabic` dictionary (available in PostgreSQL 16 via `pg_catalog.arabic`). |

Pros: Zero cost. No new infrastructure. Sufficient for English property names.
Cons: Arabic morphological search is incomplete with standard dictionaries. "شقق" (apartments) won't match "شقة" (apartment singular) without stemming.

**Option B: Elasticsearch with Arabic Analyzer**

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | AWS OpenSearch Service: ~$200–500/month for a small cluster. |
| **Scalability** | Built for search at scale. Handles 1M+ documents efficiently. |
| **Operational Complexity** | High. Separate service. Index sync from PostgreSQL (Debezium CDC or manual sync). |
| **Security** | AWS OpenSearch VPC-isolated. |
| **Performance** | Sub-100ms full-text queries at any scale. Arabic analyzer handles morphology correctly. |
| **Arabic NLP** | Elasticsearch Arabic analyzer stems correctly. Handles diacritics, hamza normalization. |

Pros: Production-grade Arabic search. Scales without degradation.
Cons: High operational complexity for Phase 1. Additional $200–500/month cost. Sync pipeline from PostgreSQL adds failure modes.

**Option C: Algolia**

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Free tier: 10K records, 10K requests/month. $1/1K additional requests. |
| **Scalability** | Algolia scales transparently. |
| **Operational Complexity** | Low API. Index sync via webhook or batch. |
| **Security** | Data leaves own infrastructure. API keys in environment variables. |
| **Performance** | < 100ms globally. Algolia CDN serves search results from nearest edge. |
| **Arabic NLP** | Native Arabic language support. Morphological stemming included. |

Pros: Best developer experience for search. Arabic support. Fast.
Cons: Data in Algolia's cloud (not in Middle East). Cost grows with scale. Vendor lock-in for search.

---

## Decision

**Phase 1**: PostgreSQL full-text search with `pg_trgm` (trigram similarity) + Arabic `unaccent` normalization + English `english` dictionary.

**Phase 2** (at 10K+ listings or when Arabic search quality is a retention signal): Migrate to **Algolia** for full-text search (Arabic morphological stemming).

**Geo-spatial always**: PostGIS (confirmed — not changing).
**Map rendering always**: Google Maps API with Arabic locale (confirmed — not changing).

---

## Decision Rationale

1. **Phase 1 scale does not require Elasticsearch**: At 500–5,000 listings (Phase 1 target), PostgreSQL with `pg_trgm` and GIN index delivers sub-200ms full-text results. The < 2 second threshold is met with headroom.

2. **Arabic morphological search is a Phase 2 investment**: Phase 0 customer validation will determine whether Arabic search quality is a primary friction point. If guests say "I can't find what I'm looking for in Arabic" — that's the Phase 2 trigger for Algolia migration. Do not over-invest before validation.

3. **Algolia over Elasticsearch when the time comes**: Algolia requires zero infrastructure management. Elasticsearch requires a cluster, sync pipeline, and operational overhead that a small team cannot afford in Phase 2. Algolia's cost at Phase 2 volume is manageable.

4. **PostGIS is non-negotiable**: Spatial search is the primary differentiator of FC-02. Map-first search (vs list-first) is a core product decision. PostGIS is confirmed and correct.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| Elasticsearch in Phase 1 | Over-engineered for < 5K listings; $200–500/month cost not justified; operational complexity for small team |
| Algolia in Phase 1 | Cost acceptable but Arabic morphological search is not validated as a Phase 1 requirement — build only if evidence demands |

---

## Migration Cost

**PostgreSQL → Algolia (Phase 2)**: Algolia index populated from PostgreSQL via batch job. FastAPI search endpoint updated to call Algolia API instead of SQLAlchemy query. Migration cost: 2–3 sprint days. No data loss.

---

## Dependencies

- ADR-005 (Database) — PostGIS extension, pg_trgm extension, GIN indexes
- ADR-001 (Frontend) — Google Maps JavaScript API in Next.js
- ADR-007 (Deployment) — Google Maps API key managed in AWS Secrets Manager

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-02 Spatial Search | PostGIS for geo; pg_trgm for text; Google Maps for rendering |
| Experience threshold | Search < 2 seconds — met with PostGIS + indexed PostgreSQL queries |
| Arabic UX | Arabic locale on Maps; Arabic text indexed via unaccent; morphological search deferred to Phase 2 |
| Phase 2 planning | Algolia migration is pre-planned — not a surprise |
| Monthly cost | ~$70/month Google Maps + $0 additional for search at Phase 1 |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
