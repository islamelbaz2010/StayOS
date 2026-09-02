from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from . import services as messages_services
from .schemas import (
    AutomatedMessageSend,
    ConversationDetailResponse,
    ConversationListItem,
    ConversationResponse,
    MarkReadRequest,
    MessageCreate,
    MessageResponse,
    MessageTemplateResponse,
    UnreadCountResponse,
)

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations", response_model=list[ConversationListItem])
async def get_conversations(
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConversationListItem]:
    try:
        return await messages_services.list_conversations(session, user, limit, offset)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/conversations/unread", response_model=UnreadCountResponse)
async def get_unread_count(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UnreadCountResponse:
    try:
        return await messages_services.get_unread_count(session, user)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConversationDetailResponse:
    try:
        return await messages_services.get_conversation_detail(session, user, conversation_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[MessageResponse]:
    try:
        return await messages_services.list_messages(session, user, conversation_id, limit, offset)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def post_message(
    conversation_id: str,
    request: MessageCreate,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse:
    try:
        return await messages_services.send_message(session, user, conversation_id, request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/conversations/{conversation_id}/read")
async def post_mark_read(
    conversation_id: str,
    _request: MarkReadRequest,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    try:
        await messages_services.mark_conversation_read(session, user, conversation_id)
        return {"status": "ok"}
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/bookings/{booking_id}/conversation", response_model=ConversationResponse)
async def get_conversation_for_booking(
    booking_id: str,
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ConversationResponse:
    try:
        return await messages_services.get_conversation_for_booking(session, user, booking_id)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/templates", response_model=list[MessageTemplateResponse])
async def get_message_templates(
    locale: str = "ar",
    user: User = Depends(auth_dependencies.get_current_user),
) -> list[MessageTemplateResponse]:
    try:
        return await messages_services.list_message_templates(locale)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/conversations/{conversation_id}/automated", response_model=MessageResponse | None)
async def post_automated_message(
    conversation_id: str,
    request: AutomatedMessageSend,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> MessageResponse | None:
    try:
        return await messages_services.send_automated_message(
            session,
            conversation_id,
            request.template_key,
            request.template_key,
            request.variables,
            locale=user.locale or "ar",
        )
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
