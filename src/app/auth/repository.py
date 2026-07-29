from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Account, DeviceToken, RefreshToken, User


async def get_user_by_id(session: AsyncSession, user_id: str) -> User | None:
    return await session.get(User, user_id)


async def get_user_by_phone(session: AsyncSession, phone_number: str) -> User | None:
    result = await session.execute(
        select(User).where(User.phone_number == phone_number)
    )
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_firebase_uid(
    session: AsyncSession, firebase_uid: str
) -> User | None:
    result = await session.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, **kwargs: object) -> User:
    user = User(**kwargs)
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def update_user(
    session: AsyncSession, user: User, **kwargs: object
) -> User:
    for key, value in kwargs.items():
        setattr(user, key, value)
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def get_account_by_user_id(
    session: AsyncSession, user_id: str
) -> Account | None:
    result = await session.execute(
        select(Account).where(Account.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_account(session: AsyncSession, **kwargs: object) -> Account:
    account = Account(**kwargs)
    session.add(account)
    await session.flush()
    await session.refresh(account)
    return account


async def update_account(
    session: AsyncSession, account: Account, **kwargs: object
) -> Account:
    for key, value in kwargs.items():
        setattr(account, key, value)
    session.add(account)
    await session.flush()
    await session.refresh(account)
    return account


async def create_refresh_token(
    session: AsyncSession, **kwargs: object
) -> RefreshToken:
    token = RefreshToken(**kwargs)
    session.add(token)
    await session.flush()
    await session.refresh(token)
    return token


async def get_refresh_token_by_hash(
    session: AsyncSession, token_hash: str
) -> RefreshToken | None:
    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    return result.scalar_one_or_none()


async def revoke_refresh_token(
    session: AsyncSession, token: RefreshToken, revoked_at: datetime
) -> RefreshToken:
    token.revoked_at = revoked_at
    session.add(token)
    await session.flush()
    await session.refresh(token)
    return token


async def get_device_token_by_token(
    session: AsyncSession, token: str
) -> DeviceToken | None:
    result = await session.execute(
        select(DeviceToken).where(DeviceToken.token == token)
    )
    return result.scalar_one_or_none()


async def upsert_device_token(
    session: AsyncSession,
    user_id: str,
    token: str,
    platform: str,
    app_version: str | None,
) -> DeviceToken:
    now = datetime.utcnow()
    existing = await get_device_token_by_token(session, token)
    if existing:
        existing.user_id = user_id
        existing.platform = platform
        existing.app_version = app_version
        existing.is_active = True
        existing.last_used_at = now
        session.add(existing)
        await session.flush()
        await session.refresh(existing)
        return existing

    import uuid

    device_token = DeviceToken(
        id=str(uuid.uuid4()),
        user_id=user_id,
        token=token,
        platform=platform,
        app_version=app_version,
        is_active=True,
        last_used_at=now,
    )
    session.add(device_token)
    await session.flush()
    await session.refresh(device_token)
    return device_token
