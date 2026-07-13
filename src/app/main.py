from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from redis import Redis
from app.config import settings
from app.database import get_session
import redis.asyncio as aioredis

redis_client: Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global redis_client
    redis_client = await aioredis.from_url(str(settings.REDIS_URL))
    yield
    await redis_client.close()


app = FastAPI(
    title="StayOS API",
    description="AI-powered accommodation marketplace for MENA",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check(session: AsyncSession = Depends(get_session)):
    db_status = "ok"
    redis_status = "ok"
    
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    
    try:
        if redis_client:
            await redis_client.ping()
    except Exception:
        redis_status = "error"
    
    overall_status = "ok" if db_status == "ok" and redis_status == "ok" else "error"
    
    return {
        "status": overall_status,
        "database": db_status,
        "redis": redis_status,
    }


@app.get("/")
async def root():
    return {"message": "StayOS API", "version": "0.1.0"}
