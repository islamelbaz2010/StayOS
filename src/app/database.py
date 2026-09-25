import json
import sys
from collections.abc import AsyncGenerator
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import settings

_db_url = str(settings.DATABASE_URL)
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Celery prefork workers share the parent's connection pool across child
# processes, which causes asyncpg "another operation is in progress" errors
# when two fork processes try to use the same pooled connection.  Using
# NullPool in the worker context ensures each session gets its own fresh
# connection, avoiding the cross-process sharing issue.  The API service
# keeps the pooled engine for request throughput.
_is_celery_worker = "celery" in sys.argv[0] and "worker" in sys.argv

def _json_default(value):
    # Money is Decimal internally — JSON columns (outbox payloads,
    # provider metadata) carry it as a plain number.
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


_engine_kwargs: dict = {
    "echo": settings.ENVIRONMENT == "development",
    "json_serializer": lambda v: json.dumps(v, default=_json_default),
}
if _is_celery_worker:
    _engine_kwargs["poolclass"] = NullPool
else:
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20

engine = create_async_engine(_db_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
