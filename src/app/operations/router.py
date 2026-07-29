from collections.abc import Awaitable, Callable
from typing import Any, ParamSpec, TypeVar

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.database import get_session
from app.shared.exceptions import StayOSError, to_http_exception

from .schemas import (
    FieldStaffCreate,
    FieldStaffResponse,
    MaintenanceRequestCreate,
    MaintenanceRequestResponse,
    MaintenanceRequestUpdate,
    OperationsDashboardResponse,
    PropertyReadinessResponse,
    PropertyReadinessUpdate,
    RecurringMaintenanceCreate,
    RecurringMaintenanceResponse,
    TaskAssignRequest,
    TaskAttachmentRequest,
    TaskCompleteRequest,
    TaskCreate,
    TaskNoteRequest,
    TaskResponse,
    TaskUpdate,
)
from .services import (
    add_task_attachment,
    add_task_note,
    assign_task,
    complete_task,
    create_field_staff,
    create_maintenance_request,
    create_recurring_maintenance,
    create_task,
    get_maintenance_request,
    get_operations_dashboard,
    get_property_readiness,
    get_task,
    get_task_timeline,
    list_field_staff,
    list_open_maintenance_requests,
    start_task,
    update_maintenance_request,
    update_property_readiness,
    update_task,
)

router = APIRouter(prefix="/operations", tags=["operations"])


P = ParamSpec("P")
R = TypeVar("R")


def _handle(func: Callable[P, Awaitable[R]]) -> Callable[P, Awaitable[R]]:
    async def _wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        try:
            return await func(*args, **kwargs)
        except StayOSError as exc:
            raise to_http_exception(exc) from exc

    return _wrapper


@router.post("/tasks", response_model=TaskResponse)
async def post_task(
    request: TaskCreate,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(create_task)(session, user, request)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_endpoint(
    task_id: str,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    try:
        task = await get_task(session, task_id)
        return TaskResponse.model_validate(task)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def patch_task(
    task_id: str,
    request: TaskUpdate,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(update_task)(session, user, task_id, request)


@router.post("/tasks/{task_id}/assign", response_model=TaskResponse)
async def post_assign_task(
    task_id: str,
    request: TaskAssignRequest,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(assign_task)(session, user, task_id, request)


@router.post("/tasks/{task_id}/start", response_model=TaskResponse)
async def post_start_task(
    task_id: str,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(start_task)(session, user, task_id)


@router.post("/tasks/{task_id}/complete", response_model=TaskResponse)
async def post_complete_task(
    task_id: str,
    request: TaskCompleteRequest,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(complete_task)(session, user, task_id, request)


@router.post("/tasks/{task_id}/notes", response_model=TaskResponse)
async def post_task_note(
    task_id: str,
    request: TaskNoteRequest,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(add_task_note)(session, user, task_id, request)


@router.post("/tasks/{task_id}/attachments", response_model=TaskResponse)
async def post_task_attachment(
    task_id: str,
    request: TaskAttachmentRequest,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> TaskResponse:
    return await _handle(add_task_attachment)(session, user, task_id, request)


@router.get("/tasks/{task_id}/timeline")
async def get_task_timeline_endpoint(
    task_id: str,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "field_staff")),
    session: AsyncSession = Depends(get_session),
) -> list[dict[str, Any]]:
    try:
        return list(await get_task_timeline(session, task_id))
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/staff", response_model=FieldStaffResponse)
async def post_field_staff(
    request: FieldStaffCreate,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> FieldStaffResponse:
    try:
        staff = await create_field_staff(session, user, request)
        return FieldStaffResponse.model_validate(staff)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/staff", response_model=list[FieldStaffResponse])
async def get_field_staff(
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> list[FieldStaffResponse]:
    try:
        staff = await list_field_staff(session)
        return [FieldStaffResponse.model_validate(s) for s in staff]
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/maintenance", response_model=MaintenanceRequestResponse)
async def post_maintenance_request(
    request: MaintenanceRequestCreate,
    user: User = Depends(auth_dependencies.require_role("admin", "operations", "host", "guest")),
    session: AsyncSession = Depends(get_session),
) -> MaintenanceRequestResponse:
    try:
        req = await create_maintenance_request(session, user, request)
        return MaintenanceRequestResponse.model_validate(req)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/maintenance/{request_id}", response_model=MaintenanceRequestResponse)
async def get_maintenance_request_endpoint(
    request_id: str,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> MaintenanceRequestResponse:
    try:
        request = await get_maintenance_request(session, request_id)
        return MaintenanceRequestResponse.model_validate(request)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/maintenance/{request_id}", response_model=MaintenanceRequestResponse)
async def patch_maintenance_request(
    request_id: str,
    request_update: MaintenanceRequestUpdate,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> MaintenanceRequestResponse:
    try:
        req = await update_maintenance_request(
            session, user, request_id, request_update
        )
        return MaintenanceRequestResponse.model_validate(req)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/maintenance", response_model=list[MaintenanceRequestResponse])
async def list_maintenance_requests(
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> list[MaintenanceRequestResponse]:
    try:
        requests = await list_open_maintenance_requests(session)
        return [MaintenanceRequestResponse.model_validate(r) for r in requests]
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/readiness/{unit_id}", response_model=PropertyReadinessResponse)
async def get_readiness(
    unit_id: str,
    reservation_id: str | None = None,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> PropertyReadinessResponse:
    try:
        readiness = await get_property_readiness(session, unit_id, reservation_id)
        return PropertyReadinessResponse.model_validate(readiness)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.patch("/readiness/{unit_id}", response_model=PropertyReadinessResponse)
async def patch_readiness(
    unit_id: str,
    update: PropertyReadinessUpdate,
    reservation_id: str | None = None,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> PropertyReadinessResponse:
    try:
        readiness = await update_property_readiness(
            session, user, unit_id, update, reservation_id
        )
        return PropertyReadinessResponse.model_validate(readiness)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/dashboard", response_model=OperationsDashboardResponse)
async def get_dashboard(
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> OperationsDashboardResponse:
    try:
        data = await get_operations_dashboard(session)
        return OperationsDashboardResponse(**data)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/recurring-maintenance", response_model=RecurringMaintenanceResponse)
async def post_recurring_maintenance(
    request: RecurringMaintenanceCreate,
    user: User = Depends(auth_dependencies.require_role("admin", "operations")),
    session: AsyncSession = Depends(get_session),
) -> RecurringMaintenanceResponse:
    try:
        data = await create_recurring_maintenance(session, user, request)
        return RecurringMaintenanceResponse.model_validate(data)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc
