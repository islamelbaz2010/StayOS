from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError
from app.shared.outbox import write_event

from . import repository as operations_repository
from .constants import (
    ReadinessStatus,
    RecurringFrequency,
    TaskPriority,
    TaskStatus,
    TaskType,
)
from .models import FieldStaff, MaintenanceRequest, OperationTask, PropertyReadiness
from .schemas import (
    FieldStaffCreate,
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    PropertyReadinessUpdate,
    RecurringMaintenanceCreate,
    TaskAssignRequest,
    TaskAttachmentRequest,
    TaskCompleteRequest,
    TaskCreate,
    TaskNoteRequest,
    TaskResponse,
    TaskUpdate,
)


def _assert_role(user: User, *allowed: str) -> None:
    if user.role not in allowed:
        raise AuthorizationError("Insufficient permissions")


def _serialize_task(task: OperationTask) -> TaskResponse:
    return TaskResponse.model_validate(task)


def _compute_due_by(
    checked_out_at: datetime, next_check_in: datetime | None
) -> datetime:
    if next_check_in is not None:
        return next_check_in
    return checked_out_at + timedelta(hours=48)


def _parse_iso(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return parsed


async def create_task(
    session: AsyncSession,
    user: User,
    request: TaskCreate,
) -> TaskResponse:
    _assert_role(user, "admin", "operations")
    checklist = [item.model_dump() for item in (request.checklist or [])]
    task = await operations_repository.create_task(
        session,
        request.unit_id,
        request.task_type,
        request.due_by,
        request.priority,
        reservation_id=request.reservation_id,
        parent_task_id=request.parent_task_id,
        notes=request.notes,
        checklist=checklist,
        created_by_id=user.id,
    )
    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_CREATED",
        user.id,
        {"task_type": task.task_type},
    )
    return _serialize_task(task)


async def get_task(session: AsyncSession, task_id: str) -> OperationTask:
    task = await operations_repository.get_task_by_id(session, task_id)
    if task is None:
        raise NotFoundError("Task not found")
    return task


async def update_task(
    session: AsyncSession,
    user: User,
    task_id: str,
    request: TaskUpdate,
) -> TaskResponse:
    _assert_role(user, "admin", "operations", "field_staff")
    task = await get_task(session, task_id)
    update_fields: dict[str, Any] = {
        "status": request.status,
        "priority": request.priority,
        "field_staff_id": request.field_staff_id,
        "due_by": request.due_by,
        "notes": request.notes,
        "started_at": request.started_at,
        "completed_at": request.completed_at,
    }
    if request.checklist is not None:
        update_fields["checklist"] = [item.model_dump() for item in request.checklist]
    await operations_repository.update_task(session, task, **update_fields)
    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_UPDATED",
        user.id,
        {"status": task.status, "priority": task.priority},
    )
    return _serialize_task(task)


async def assign_task(
    session: AsyncSession,
    user: User,
    task_id: str,
    request: TaskAssignRequest,
) -> TaskResponse:
    _assert_role(user, "admin", "operations")
    staff = await operations_repository.get_field_staff_by_id(
        session, request.field_staff_id
    )
    if staff is None:
        raise NotFoundError("Field staff not found")
    task = await get_task(session, task_id)
    task.field_staff_id = staff.id
    task.status = TaskStatus.ASSIGNED
    await session.flush()
    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_ASSIGNED",
        user.id,
        {"staff_id": staff.id, "staff_name": staff.name},
    )
    return _serialize_task(task)


async def start_task(session: AsyncSession, user: User, task_id: str) -> TaskResponse:
    _assert_role(user, "admin", "operations", "field_staff")
    task = await get_task(session, task_id)
    if task.status not in (TaskStatus.PENDING, TaskStatus.ASSIGNED):
        raise ValidationError("Task cannot be started from current status")
    task.status = TaskStatus.IN_PROGRESS
    task.started_at = datetime.now(UTC)
    await session.flush()
    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_STARTED",
        user.id,
        {},
    )
    return _serialize_task(task)


async def complete_task(
    session: AsyncSession,
    user: User,
    task_id: str,
    request: TaskCompleteRequest,
) -> TaskResponse:
    _assert_role(user, "admin", "operations", "field_staff")
    task = await get_task(session, task_id)
    if task.status != TaskStatus.IN_PROGRESS:
        raise ValidationError("Task must be in progress before completion")

    if task.checklist:
        incomplete = [i for i in task.checklist if not i.get("completed")]
        if incomplete:
            raise ValidationError("All checklist items must be completed")

    task.status = TaskStatus.COMPLETED
    task.completed_at = request.completed_at or datetime.now(UTC)
    task.verified_by_staff_id = request.verified_by_staff_id or user.id
    await session.flush()

    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_COMPLETED",
        user.id,
        {},
    )

    if task.parent_task_id:
        await _maybe_complete_parent(session, user, task.parent_task_id)
    else:
        await _update_readiness_after_task(session, task)

    return _serialize_task(task)


async def _maybe_complete_parent(
    session: AsyncSession, user: User, parent_task_id: str
) -> None:
    parent = await operations_repository.get_task_by_id(session, parent_task_id)
    if parent is None:
        return
    children = await operations_repository.get_child_tasks(session, parent.id)
    if not children:
        return
    if all(child.status == TaskStatus.COMPLETED for child in children):
        parent.status = TaskStatus.COMPLETED
        parent.completed_at = datetime.now(UTC)
        parent.verified_by_staff_id = user.id
        await session.flush()
        await operations_repository.add_task_event(
            session,
            parent.id,
            "TASK_COMPLETED",
            user.id,
            {"completed_by": "child_completion"},
        )
        await write_event(
            session,
            "OperationTask",
            UUID(parent.id),
            "ops.turnover_complete",
            {
                "ticket_id": parent.id,
                "unit_id": parent.unit_id,
                "completed_at": parent.completed_at.isoformat(),
                "verified_by_staff_id": parent.verified_by_staff_id,
            },
        )
        await _update_readiness_after_task(session, parent)


async def _update_readiness_after_task(task_session: AsyncSession, task: OperationTask) -> None:
    readiness = await operations_repository.get_or_create_property_readiness(
        task_session, task.unit_id, task.reservation_id
    )
    if task.task_type == TaskType.TURNOVER and task.status == TaskStatus.COMPLETED:
        readiness.status = ReadinessStatus.READY
        readiness.blocked_until = None
        readiness.reason = None
    elif task.status in (TaskStatus.IN_PROGRESS, TaskStatus.PENDING, TaskStatus.ASSIGNED):
        readiness.status = ReadinessStatus.NOT_READY
        readiness.reason = f"{task.task_type} pending"
    await task_session.flush()


async def add_task_note(
    session: AsyncSession,
    user: User,
    task_id: str,
    request: TaskNoteRequest,
) -> TaskResponse:
    task = await get_task(session, task_id)
    _assert_role(user, "admin", "operations", "field_staff")
    task.notes = f"{task.notes or ''}\n{request.note}".strip()
    await session.flush()
    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_NOTE_ADDED",
        user.id,
        {"note": request.note},
    )
    return _serialize_task(task)


async def add_task_attachment(
    session: AsyncSession,
    user: User,
    task_id: str,
    request: TaskAttachmentRequest,
) -> TaskResponse:
    task = await get_task(session, task_id)
    _assert_role(user, "admin", "operations", "field_staff")
    if task.attachments is None:
        task.attachments = []
    task.attachments.append(request.attachment_url)
    await session.flush()
    await operations_repository.add_task_event(
        session,
        task.id,
        "TASK_ATTACHMENT_ADDED",
        user.id,
        {"attachment_url": request.attachment_url},
    )
    return _serialize_task(task)


async def get_task_timeline(
    session: AsyncSession, task_id: str
) -> Sequence[dict[str, Any]]:
    task = await get_task(session, task_id)
    return [
        {
            "id": event.id,
            "event_type": event.event_type,
            "actor_id": event.actor_id,
            "payload": event.payload,
            "created_at": event.created_at,
        }
        for event in task.timeline
    ]


async def create_field_staff(
    session: AsyncSession, user: User, request: FieldStaffCreate
) -> FieldStaff:
    _assert_role(user, "admin", "operations")
    return await operations_repository.create_field_staff(
        session,
        request.user_id,
        request.name,
        request.phone,
        request.role,
        request.is_active,
    )


async def list_field_staff(session: AsyncSession) -> Sequence[FieldStaff]:
    return await operations_repository.list_active_field_staff(session)


async def create_maintenance_request(
    session: AsyncSession,
    user: User,
    request: MaintenanceRequestCreate,
) -> MaintenanceRequest:
    _assert_role(user, "admin", "operations", "host", "guest")
    return await operations_repository.create_maintenance_request(
        session,
        request.unit_id,
        request.issue_type,
        request.description,
        reporter_id=request.reporter_id or user.id,
    )


async def get_maintenance_request(
    session: AsyncSession, request_id: str
) -> MaintenanceRequest:
    request = await operations_repository.get_maintenance_request_by_id(
        session, request_id
    )
    if request is None:
        raise NotFoundError("Maintenance request not found")
    return request


async def update_maintenance_request(
    session: AsyncSession,
    user: User,
    request_id: str,
    request_update: MaintenanceRequestUpdate,
) -> MaintenanceRequest:
    _assert_role(user, "admin", "operations")
    request = await get_maintenance_request(session, request_id)
    if request_update.status is not None:
        request.status = request_update.status
    if request_update.related_task_id is not None:
        request.related_task_id = request_update.related_task_id
    await session.flush()
    return request


async def list_open_maintenance_requests(
    session: AsyncSession,
) -> Sequence[MaintenanceRequest]:
    return await operations_repository.list_open_maintenance_requests(session)


async def get_property_readiness(
    session: AsyncSession, unit_id: str, reservation_id: str | None = None
) -> PropertyReadiness:
    return await operations_repository.get_or_create_property_readiness(
        session, unit_id, reservation_id
    )


async def update_property_readiness(
    session: AsyncSession,
    user: User,
    unit_id: str,
    update: PropertyReadinessUpdate,
    reservation_id: str | None = None,
) -> PropertyReadiness:
    _assert_role(user, "admin", "operations")
    readiness = await operations_repository.get_or_create_property_readiness(
        session, unit_id, reservation_id
    )
    readiness.status = update.status
    readiness.blocked_until = update.blocked_until
    readiness.reason = update.reason
    await session.flush()
    return readiness


async def get_operations_dashboard(session: AsyncSession) -> dict[str, int]:
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return {
        "pending_tasks": await operations_repository.count_tasks_by_status(
            session, TaskStatus.PENDING
        ),
        "in_progress_tasks": await operations_repository.count_tasks_by_status(
            session, TaskStatus.IN_PROGRESS
        ),
        "completed_tasks_today": await operations_repository.count_tasks_by_status(
            session, TaskStatus.COMPLETED, since=today_start
        ),
        "overdue_tasks": await operations_repository.count_overdue_tasks(session, now),
        "open_maintenance_requests": len(
            await operations_repository.list_open_maintenance_requests(session)
        ),
        "not_ready_units": await operations_repository.count_not_ready_units(session),
        "active_field_staff": len(
            await operations_repository.list_active_field_staff(session)
        ),
    }


async def create_recurring_maintenance(
    session: AsyncSession,
    user: User,
    request: RecurringMaintenanceCreate,
) -> dict[str, Any]:
    _assert_role(user, "admin", "operations")
    recurring = await operations_repository.create_recurring_maintenance(
        session,
        request.unit_id,
        request.task_type,
        request.frequency,
        request.next_run_at,
        request.interval_days,
        request.description,
    )
    return {
        "id": recurring.id,
        "unit_id": recurring.unit_id,
        "task_type": recurring.task_type,
        "frequency": recurring.frequency,
        "interval_days": recurring.interval_days,
        "next_run_at": recurring.next_run_at,
        "is_active": recurring.is_active,
        "description": recurring.description,
        "created_at": recurring.created_at,
        "updated_at": recurring.updated_at,
    }


async def handle_checkout_event(
    session: AsyncSession, payload: dict[str, Any]
) -> OperationTask | None:
    reservation_id = payload.get("reservation_id")
    unit_id = payload.get("unit_id")
    if not reservation_id or not unit_id:
        return None

    existing = await operations_repository.get_tasks_by_reservation_and_type(
        session, reservation_id, TaskType.TURNOVER
    )
    if existing:
        return existing[0]

    checked_out_at = _parse_iso(payload.get("checked_out_at"))
    if checked_out_at is None:
        checked_out_at = datetime.now(UTC)
    next_check_in = _parse_iso(payload.get("next_check_in"))

    due_by = _compute_due_by(checked_out_at, next_check_in)

    turnover = await operations_repository.create_task(
        session,
        unit_id,
        TaskType.TURNOVER,
        due_by,
        TaskPriority.HIGH,
        reservation_id=reservation_id,
        notes="Auto-generated turnover after checkout",
        checklist=[{"item": "Cleaning completed", "completed": False}, {"item": "Inspection completed", "completed": False}],
    )

    cleaning_due = due_by - timedelta(hours=12)
    inspection_due = due_by - timedelta(hours=2)
    await operations_repository.create_task(
        session,
        unit_id,
        TaskType.CLEANING,
        cleaning_due,
        TaskPriority.HIGH,
        reservation_id=reservation_id,
        parent_task_id=turnover.id,
        notes="Cleaning subtask",
    )
    await operations_repository.create_task(
        session,
        unit_id,
        TaskType.INSPECTION,
        inspection_due,
        TaskPriority.HIGH,
        reservation_id=reservation_id,
        parent_task_id=turnover.id,
        notes="Inspection subtask",
    )

    readiness = await operations_repository.get_or_create_property_readiness(
        session, unit_id, reservation_id
    )
    readiness.status = ReadinessStatus.NOT_READY
    readiness.reason = "Turnover in progress"
    await session.flush()

    await write_event(
        session,
        "OperationTask",
        UUID(turnover.id),
        "ops.ticket_created",
        {
            "ticket_id": turnover.id,
            "unit_id": unit_id,
            "reservation_id": reservation_id,
            "priority": turnover.priority,
            "due_by": turnover.due_by.isoformat(),
        },
    )
    return turnover


async def handle_checkin_event(
    session: AsyncSession, payload: dict[str, Any]
) -> None:
    reservation_id = payload.get("reservation_id")
    unit_id = payload.get("unit_id")
    if not reservation_id or not unit_id:
        return
    readiness = await operations_repository.get_or_create_property_readiness(
        session, unit_id, reservation_id
    )
    if readiness.status != ReadinessStatus.READY:
        readiness.status = ReadinessStatus.NOT_READY
        readiness.reason = "Property not marked ready before check-in"
        await session.flush()


async def handle_cancel_event(
    session: AsyncSession, payload: dict[str, Any]
) -> None:
    reservation_id = payload.get("reservation_id")
    if not reservation_id:
        return
    tasks = await operations_repository.get_tasks_by_reservation(session, reservation_id)
    for task in tasks:
        if task.status not in (TaskStatus.COMPLETED, TaskStatus.CANCELLED):
            task.status = TaskStatus.CANCELLED
            await operations_repository.add_task_event(
                session,
                task.id,
                "TASK_CANCELLED",
                None,
                {"reason": "reservation_cancelled"},
            )
    await session.flush()


async def spawn_recurring_tasks(session: AsyncSession) -> Sequence[OperationTask]:
    due = await operations_repository.list_due_recurring_maintenance(session)
    created: list[OperationTask] = []
    for recurring in due:
        task = await operations_repository.create_task(
            session,
            recurring.unit_id,
            recurring.task_type,
            recurring.next_run_at,
            TaskPriority.NORMAL,
            notes=recurring.description,
        )
        created.append(task)
        next_run = _next_run(recurring.next_run_at, recurring.frequency, recurring.interval_days)
        await operations_repository.update_recurring_maintenance(
            session, recurring, next_run
        )
    return created


def _next_run(
    current: datetime, frequency: str, interval_days: int | None
) -> datetime:
    days = interval_days or 30
    if frequency == RecurringFrequency.DAILY:
        return current + timedelta(days=1)
    if frequency == RecurringFrequency.WEEKLY:
        return current + timedelta(weeks=1)
    if frequency == RecurringFrequency.MONTHLY:
        return current + timedelta(days=days)
    if frequency == RecurringFrequency.YEARLY:
        return current + timedelta(days=365)
    return current + timedelta(days=days)
