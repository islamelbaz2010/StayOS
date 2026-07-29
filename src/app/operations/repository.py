from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .constants import ReadinessStatus, TaskStatus
from .models import (
    FieldStaff,
    MaintenanceRequest,
    OperationTask,
    PropertyReadiness,
    RecurringMaintenance,
    TaskEvent,
)


async def create_task(
    session: AsyncSession,
    unit_id: str,
    task_type: str,
    due_by: datetime,
    priority: str,
    reservation_id: str | None = None,
    parent_task_id: str | None = None,
    notes: str | None = None,
    checklist: list[dict[str, Any]] | None = None,
    created_by_id: str | None = None,
) -> OperationTask:
    task = OperationTask(
        unit_id=unit_id,
        task_type=task_type,
        reservation_id=reservation_id,
        parent_task_id=parent_task_id,
        priority=priority,
        due_by=due_by,
        notes=notes,
        checklist=checklist or [],
        created_by_id=created_by_id,
    )
    session.add(task)
    await session.flush()
    return task


async def get_task_by_id(session: AsyncSession, task_id: str) -> OperationTask | None:
    result = await session.execute(
        select(OperationTask).where(OperationTask.id == task_id)
    )
    return result.scalar_one_or_none()


async def get_tasks_by_reservation_and_type(
    session: AsyncSession, reservation_id: str, task_type: str
) -> Sequence[OperationTask]:
    result = await session.execute(
        select(OperationTask).where(
            OperationTask.reservation_id == reservation_id,
            OperationTask.task_type == task_type,
        )
    )
    return result.scalars().all()


async def get_tasks_by_reservation(
    session: AsyncSession, reservation_id: str
) -> Sequence[OperationTask]:
    result = await session.execute(
        select(OperationTask).where(OperationTask.reservation_id == reservation_id)
    )
    return result.scalars().all()


async def get_child_tasks(session: AsyncSession, parent_task_id: str) -> Sequence[OperationTask]:
    result = await session.execute(
        select(OperationTask).where(OperationTask.parent_task_id == parent_task_id)
    )
    return result.scalars().all()


async def update_task(
    session: AsyncSession, task: OperationTask, **fields: Any
) -> OperationTask:
    for key, value in fields.items():
        if value is not None and hasattr(task, key):
            setattr(task, key, value)
    await session.flush()
    return task


async def add_task_event(
    session: AsyncSession,
    task_id: str,
    event_type: str,
    actor_id: str | None,
    payload: dict[str, Any] | None = None,
) -> TaskEvent:
    event = TaskEvent(
        task_id=task_id,
        actor_id=actor_id,
        event_type=event_type,
        payload=payload or {},
    )
    session.add(event)
    await session.flush()
    return event


async def create_field_staff(
    session: AsyncSession,
    user_id: str | None,
    name: str,
    phone: str | None,
    role: str,
    is_active: bool = True,
) -> FieldStaff:
    staff = FieldStaff(
        user_id=user_id,
        name=name,
        phone=phone,
        role=role,
        is_active=is_active,
    )
    session.add(staff)
    await session.flush()
    return staff


async def get_field_staff_by_id(session: AsyncSession, staff_id: str) -> FieldStaff | None:
    result = await session.execute(
        select(FieldStaff).where(FieldStaff.id == staff_id)
    )
    return result.scalar_one_or_none()


async def list_active_field_staff(session: AsyncSession) -> Sequence[FieldStaff]:
    result = await session.execute(
        select(FieldStaff).where(FieldStaff.is_active.is_(True))
    )
    return result.scalars().all()


async def create_maintenance_request(
    session: AsyncSession,
    unit_id: str,
    issue_type: str,
    description: str,
    reporter_id: str | None = None,
) -> MaintenanceRequest:
    request = MaintenanceRequest(
        unit_id=unit_id,
        issue_type=issue_type,
        description=description,
        reporter_id=reporter_id,
    )
    session.add(request)
    await session.flush()
    return request


async def get_maintenance_request_by_id(
    session: AsyncSession, request_id: str
) -> MaintenanceRequest | None:
    result = await session.execute(
        select(MaintenanceRequest).where(MaintenanceRequest.id == request_id)
    )
    return result.scalar_one_or_none()


async def list_open_maintenance_requests(
    session: AsyncSession,
) -> Sequence[MaintenanceRequest]:
    from .constants import MaintenanceRequestStatus
    result = await session.execute(
        select(MaintenanceRequest).where(
            MaintenanceRequest.status == MaintenanceRequestStatus.OPEN
        )
    )
    return result.scalars().all()


async def get_or_create_property_readiness(
    session: AsyncSession, unit_id: str, reservation_id: str | None = None
) -> PropertyReadiness:
    result = await session.execute(
        select(PropertyReadiness).where(
            PropertyReadiness.unit_id == unit_id,
            PropertyReadiness.reservation_id == reservation_id,
        )
    )
    readiness = result.scalar_one_or_none()
    if readiness is None:
        readiness = PropertyReadiness(unit_id=unit_id, reservation_id=reservation_id)
        session.add(readiness)
        await session.flush()
    return readiness


async def count_tasks_by_status(
    session: AsyncSession, status: str | None = None, since: datetime | None = None
) -> int:
    stmt = select(func.count(OperationTask.id))
    if status is not None:
        stmt = stmt.where(OperationTask.status == status)
    if since is not None:
        stmt = stmt.where(OperationTask.created_at >= since)
    result = await session.scalar(stmt)
    return result or 0


async def count_overdue_tasks(session: AsyncSession, as_of: datetime) -> int:
    result = await session.scalar(
        select(func.count(OperationTask.id)).where(
            OperationTask.due_by < as_of,
            OperationTask.status.notin_([TaskStatus.COMPLETED, TaskStatus.CANCELLED]),
        )
    )
    return result or 0


async def count_not_ready_units(session: AsyncSession) -> int:
    result = await session.scalar(
        select(func.count(PropertyReadiness.id)).where(
            PropertyReadiness.status == ReadinessStatus.NOT_READY
        )
    )
    return result or 0


async def create_recurring_maintenance(
    session: AsyncSession,
    unit_id: str,
    task_type: str,
    frequency: str,
    next_run_at: datetime,
    interval_days: int | None,
    description: str | None,
) -> RecurringMaintenance:
    recurring = RecurringMaintenance(
        unit_id=unit_id,
        task_type=task_type,
        frequency=frequency,
        next_run_at=next_run_at,
        interval_days=interval_days,
        description=description,
    )
    session.add(recurring)
    await session.flush()
    return recurring


async def list_due_recurring_maintenance(
    session: AsyncSession, as_of: datetime | None = None
) -> Sequence[RecurringMaintenance]:
    as_of = as_of or datetime.now(UTC)
    result = await session.execute(
        select(RecurringMaintenance).where(
            RecurringMaintenance.is_active.is_(True),
            RecurringMaintenance.next_run_at <= as_of,
        )
    )
    return result.scalars().all()


async def update_recurring_maintenance(
    session: AsyncSession, recurring: RecurringMaintenance, next_run_at: datetime
) -> RecurringMaintenance:
    recurring.next_run_at = next_run_at
    await session.flush()
    return recurring


async def get_recurring_maintenance_by_id(
    session: AsyncSession, recurring_id: str
) -> RecurringMaintenance | None:
    result = await session.execute(
        select(RecurringMaintenance).where(RecurringMaintenance.id == recurring_id)
    )
    return result.scalar_one_or_none()
