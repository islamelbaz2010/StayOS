from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session

from . import repository
from .schemas import (
    InAppNotificationItem,
    InAppNotificationList,
    MarkAllReadResponse,
)

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=InAppNotificationList)
async def list_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> InAppNotificationList:
    items = await repository.list_in_app_notifications(
        session, str(user.id), limit=limit
    )
    unread = await repository.count_unread_in_app(session, str(user.id))
    return InAppNotificationList(
        items=[InAppNotificationItem.model_validate(item) for item in items],
        unread_count=unread,
    )


@router.post("/notifications/{notification_id}/read", response_model=InAppNotificationItem)
async def mark_notification_read(
    notification_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> InAppNotificationItem:
    notification = await repository.get_in_app_notification(
        session, notification_id, str(user.id)
    )
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    if notification.read_at is None:
        notification = await repository.mark_read(session, notification)
    return InAppNotificationItem.model_validate(notification)


@router.post("/notifications/read-all", response_model=MarkAllReadResponse)
async def mark_all_notifications_read(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MarkAllReadResponse:
    marked = await repository.mark_all_read(session, str(user.id))
    return MarkAllReadResponse(marked=marked)
