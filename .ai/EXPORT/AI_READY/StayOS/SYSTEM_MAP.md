<!-- tokens: 448 / budget 8000 -->

# System Map — StayOS

## Module Map

- `.github/` — CI/CD, issue templates, and project automation
- `ai_agents/` — ai_agents module (md files)
- `alembic/` — Alembic database migrations
- `apps/` — application / UI layer
- `archive/` — archived or historical materials
- `business/` — business, product, and sprint planning
- `docs/` — documentation and guides
- `infra/` — infrastructure / deployment
- `research/` — market, competitor, and risk research
- `src/` — main source code
- `tools/` — tools module (md, py files)

## Data Model

Entities and structures derived from schema/model files:
- `alembic/versions/001_create_schemas.py` — `auth`, `pms`, `reservation`, `finance`, `notify`, `outbox`
- `src/app/shared/models.py` — `Base`, `TimestampMixin`, `UUIDMixin`
- `src/app/shared/schemas.py` — `BaseResponse`, `PaginatedResponse`, `HealthResponse`

## Interface Surface

| Surface | Purpose | Auth |
| --- | --- | --- |
| `src/app/main.py` | entry / routing file | — |

## Critical Flows

1. **GET /health** — HTTP endpoint in `src/app/main.py` — handler `health_check`
2. **GET /** — HTTP endpoint in `src/app/main.py` — handler `root`

## Invariants & Sharp Edges

_No explicit invariants discovered from a quick scan._

## Excerpts

### `src/app/main.py`
```py
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import Depends, FastAPI
from redis import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session

redis_client: Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = await aioredis.from_url(str(settings.REDIS_URL))
    yield
    await redis_client.close()
```
