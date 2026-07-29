from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.auth.constants import KycStatus, UserRole
from app.auth.models import User
from app.operations.constants import (
    MaintenanceRequestStatus,
    ReadinessStatus,
    RecurringFrequency,
    StaffRole,
    TaskPriority,
    TaskStatus,
    TaskType,
)
from app.operations.models import FieldStaff, MaintenanceRequest, OperationTask, PropertyReadiness
from app.operations.schemas import (
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
)
from app.operations.services import (
    add_task_attachment,
    add_task_note,
    assign_task,
    complete_task,
    create_field_staff,
    create_maintenance_request,
    create_recurring_maintenance,
    create_task,
    get_operations_dashboard,
    get_task,
    handle_cancel_event,
    handle_checkin_event,
    handle_checkout_event,
    start_task,
    update_maintenance_request,
    update_property_readiness,
)
from app.shared.exceptions import AuthorizationError, NotFoundError, ValidationError


def _make_user(role: UserRole = UserRole.ADMIN) -> User:
    now = datetime.now(UTC)
    return User(
        id="admin-1",
        phone_number="+1234567890",
        email="admin@example.com",
        firebase_uid=None,
        display_name="Admin",
        locale="ar",
        role=str(role),
        kyc_status=str(KycStatus.VERIFIED),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.flush = AsyncMock()
    session.add = MagicMock()
    return session


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


def _make_task(
    task_id: str = "task-1",
    task_type: TaskType = TaskType.CLEANING,
    status: TaskStatus = TaskStatus.PENDING,
    parent_task_id: str | None = None,
    checklist: list[dict] | None = None,
) -> OperationTask:
    return OperationTask(
        id=task_id,
        unit_id="unit-1",
        reservation_id="res-1",
        parent_task_id=parent_task_id,
        task_type=task_type,
        status=status,
        priority=TaskPriority.NORMAL,
        due_by=datetime(2026, 8, 8, 12, 0, tzinfo=UTC),
        started_at=None,
        completed_at=None,
        verified_by_staff_id=None,
        notes=None,
        checklist=checklist or [],
        attachments=None,
        created_by_id="admin-1",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_create_task(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task()
    monkeypatch.setattr(
        operations.repository, "create_task", AsyncMock(return_value=task)
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )

    request = TaskCreate(
        unit_id="unit-1",
        task_type=TaskType.CLEANING,
        due_by=datetime(2026, 8, 8, 12, 0, tzinfo=UTC),
    )
    result = await create_task(fake_session, _make_user(), request)
    assert result.task_type == TaskType.CLEANING


@pytest.mark.asyncio
async def test_create_task_rejects_non_admin(fake_session: AsyncMock) -> None:
    request = TaskCreate(
        unit_id="unit-1",
        task_type=TaskType.CLEANING,
        due_by=datetime(2026, 8, 8, 12, 0, tzinfo=UTC),
    )
    with pytest.raises(AuthorizationError):
        await create_task(fake_session, _make_user(role=UserRole.GUEST), request)


@pytest.mark.asyncio
async def test_get_task_not_found(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=None)
    )
    with pytest.raises(NotFoundError):
        await get_task(fake_session, "missing")


@pytest.mark.asyncio
async def test_assign_task(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task()
    staff = FieldStaff(
        id="staff-1",
        user_id=None,
        name="Cleaner",
        phone=None,
        role=StaffRole.CLEANER,
        is_active=True,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=task)
    )
    monkeypatch.setattr(
        operations.repository, "get_field_staff_by_id", AsyncMock(return_value=staff)
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )

    result = await assign_task(
        fake_session, _make_user(), "task-1", TaskAssignRequest(field_staff_id="staff-1")
    )
    assert result.status == TaskStatus.ASSIGNED
    assert result.field_staff_id == "staff-1"


@pytest.mark.asyncio
async def test_start_task(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task(status=TaskStatus.ASSIGNED)
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=task)
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )

    result = await start_task(fake_session, _make_user(), "task-1")
    assert result.status == TaskStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_complete_task(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task(status=TaskStatus.IN_PROGRESS, checklist=[{"item": "x", "completed": True}])
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=task)
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )
    monkeypatch.setattr(
        operations.repository,
        "get_or_create_property_readiness",
        AsyncMock(return_value=PropertyReadiness(id="pr-1", unit_id="unit-1")),
    )

    result = await complete_task(
        fake_session, _make_user(), "task-1", TaskCompleteRequest()
    )
    assert result.status == TaskStatus.COMPLETED


@pytest.mark.asyncio
async def test_complete_task_with_parent(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    parent_id = str(uuid4())
    parent = _make_task(task_id=parent_id, task_type=TaskType.TURNOVER, status=TaskStatus.IN_PROGRESS)
    task = _make_task(status=TaskStatus.IN_PROGRESS, parent_task_id=parent_id, checklist=[{"item": "x", "completed": True}])
    sibling = _make_task(task_id=str(uuid4()), status=TaskStatus.COMPLETED, parent_task_id=parent_id, checklist=[{"item": "x", "completed": True}])
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(side_effect=[task, parent])
    )
    monkeypatch.setattr(
        operations.repository, "get_child_tasks", AsyncMock(return_value=[task, sibling])
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )
    monkeypatch.setattr(
        operations.repository,
        "get_or_create_property_readiness",
        AsyncMock(return_value=PropertyReadiness(id="pr-1", unit_id="unit-1")),
    )

    with patch("app.operations.services.write_event", new=AsyncMock()):
        result = await complete_task(
            fake_session, _make_user(), "task-1", TaskCompleteRequest()
        )
    assert result.status == TaskStatus.COMPLETED


@pytest.mark.asyncio
async def test_complete_task_checklist_incomplete(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task(status=TaskStatus.IN_PROGRESS, checklist=[{"item": "x", "completed": False}])
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=task)
    )

    with pytest.raises(ValidationError):
        await complete_task(fake_session, _make_user(), "task-1", TaskCompleteRequest())


@pytest.mark.asyncio
async def test_add_task_note(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task()
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=task)
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )

    result = await add_task_note(
        fake_session, _make_user(), "task-1", TaskNoteRequest(note="new note")
    )
    assert result.notes == "new note"


@pytest.mark.asyncio
async def test_add_task_attachment(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task()
    monkeypatch.setattr(
        operations.repository, "get_task_by_id", AsyncMock(return_value=task)
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )

    result = await add_task_attachment(
        fake_session, _make_user(), "task-1", TaskAttachmentRequest(attachment_url="http://img.jpg")
    )
    assert result.attachments == ["http://img.jpg"]


@pytest.mark.asyncio
async def test_create_field_staff(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    staff = FieldStaff(
        id="staff-1",
        name="Cleaner",
        role=StaffRole.CLEANER,
        is_active=True,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        operations.repository, "create_field_staff", AsyncMock(return_value=staff)
    )

    result = await create_field_staff(
        fake_session, _make_user(), FieldStaffCreate(name="Cleaner", role=StaffRole.CLEANER)
    )
    assert result.name == "Cleaner"


@pytest.mark.asyncio
async def test_create_maintenance_request(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    request = MaintenanceRequest(
        id="mr-1",
        unit_id="unit-1",
        issue_type="plumbing",
        description="leak",
        status=MaintenanceRequestStatus.OPEN,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        operations.repository, "create_maintenance_request", AsyncMock(return_value=request)
    )

    result = await create_maintenance_request(
        fake_session,
        _make_user(),
        MaintenanceRequestCreate(unit_id="unit-1", issue_type="plumbing", description="leak"),
    )
    assert result.status == MaintenanceRequestStatus.OPEN


@pytest.mark.asyncio
async def test_update_maintenance_request(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    request = MaintenanceRequest(
        id="mr-1",
        unit_id="unit-1",
        issue_type="plumbing",
        description="leak",
        status=MaintenanceRequestStatus.OPEN,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    monkeypatch.setattr(
        operations.repository, "get_maintenance_request_by_id", AsyncMock(return_value=request)
    )

    result = await update_maintenance_request(
        fake_session,
        _make_user(),
        "mr-1",
        MaintenanceRequestUpdate(status=MaintenanceRequestStatus.RESOLVED),
    )
    assert result.status == MaintenanceRequestStatus.RESOLVED


@pytest.mark.asyncio
async def test_update_property_readiness(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    readiness = PropertyReadiness(id="pr-1", unit_id="unit-1")
    monkeypatch.setattr(
        operations.repository,
        "get_or_create_property_readiness",
        AsyncMock(return_value=readiness),
    )

    result = await update_property_readiness(
        fake_session,
        _make_user(),
        "unit-1",
        PropertyReadinessUpdate(status=ReadinessStatus.READY),
    )
    assert result.status == ReadinessStatus.READY


@pytest.mark.asyncio
async def test_get_operations_dashboard(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    monkeypatch.setattr(
        operations.repository, "count_tasks_by_status", AsyncMock(return_value=1)
    )
    monkeypatch.setattr(
        operations.repository, "count_overdue_tasks", AsyncMock(return_value=0)
    )
    monkeypatch.setattr(
        operations.repository, "list_open_maintenance_requests", AsyncMock(return_value=[])
    )
    monkeypatch.setattr(
        operations.repository, "count_not_ready_units", AsyncMock(return_value=0)
    )
    monkeypatch.setattr(
        operations.repository, "list_active_field_staff", AsyncMock(return_value=[])
    )

    result = await get_operations_dashboard(fake_session)
    assert result["pending_tasks"] == 1
    assert result["overdue_tasks"] == 0


@pytest.mark.asyncio
async def test_create_recurring_maintenance(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    recurring = MagicMock()
    recurring.id = "rm-1"
    recurring.unit_id = "unit-1"
    recurring.task_type = TaskType.MAINTENANCE
    recurring.frequency = RecurringFrequency.MONTHLY
    recurring.interval_days = 30
    recurring.next_run_at = datetime(2026, 9, 1, tzinfo=UTC)
    recurring.is_active = True
    recurring.description = "AC filter"
    recurring.created_at = datetime.now(UTC)
    recurring.updated_at = datetime.now(UTC)
    monkeypatch.setattr(
        operations.repository, "create_recurring_maintenance", AsyncMock(return_value=recurring)
    )

    result = await create_recurring_maintenance(
        fake_session,
        _make_user(),
        RecurringMaintenanceCreate(
            unit_id="unit-1",
            task_type=TaskType.MAINTENANCE,
            frequency=RecurringFrequency.MONTHLY,
            next_run_at=datetime(2026, 9, 1, tzinfo=UTC),
        ),
    )
    assert result["id"] == "rm-1"


@pytest.mark.asyncio
async def test_handle_checkout_event_creates_turnover(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    parent = _make_task(task_id=str(uuid4()), task_type=TaskType.TURNOVER)
    child1 = _make_task(task_id=str(uuid4()), task_type=TaskType.CLEANING)
    child2 = _make_task(task_id=str(uuid4()), task_type=TaskType.INSPECTION)
    readiness = PropertyReadiness(id="pr-1", unit_id="unit-1")

    monkeypatch.setattr(
        operations.repository,
        "get_tasks_by_reservation_and_type",
        AsyncMock(return_value=[]),
    )
    monkeypatch.setattr(
        operations.repository,
        "create_task",
        AsyncMock(side_effect=[parent, child1, child2]),
    )
    monkeypatch.setattr(
        operations.repository,
        "get_or_create_property_readiness",
        AsyncMock(return_value=readiness),
    )

    with patch("app.operations.services.write_event", new=AsyncMock()):
        result = await handle_checkout_event(
            fake_session,
            {
                "reservation_id": "res-1",
                "unit_id": "unit-1",
                "checked_out_at": "2026-08-07T11:00:00+00:00",
                "next_check_in": "2026-08-08T15:00:00+00:00",
            },
        )

    assert result is parent
    assert readiness.status == ReadinessStatus.NOT_READY


@pytest.mark.asyncio
async def test_handle_checkout_event_idempotent(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    existing = _make_task(task_id=str(uuid4()), task_type=TaskType.TURNOVER)
    monkeypatch.setattr(
        operations.repository,
        "get_tasks_by_reservation_and_type",
        AsyncMock(return_value=[existing]),
    )

    result = await handle_checkout_event(
        fake_session,
        {"reservation_id": "res-1", "unit_id": "unit-1"},
    )
    assert result is existing


@pytest.mark.asyncio
async def test_handle_cancel_event(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    task = _make_task(status=TaskStatus.PENDING)
    monkeypatch.setattr(
        operations.repository, "get_tasks_by_reservation", AsyncMock(return_value=[task])
    )
    monkeypatch.setattr(
        operations.repository, "add_task_event", AsyncMock()
    )

    await handle_cancel_event(fake_session, {"reservation_id": "res-1"})
    assert task.status == TaskStatus.CANCELLED


@pytest.mark.asyncio
async def test_handle_checkin_event(fake_session: AsyncMock, monkeypatch) -> None:
    from app import operations

    readiness = PropertyReadiness(id="pr-1", unit_id="unit-1")
    monkeypatch.setattr(
        operations.repository,
        "get_or_create_property_readiness",
        AsyncMock(return_value=readiness),
    )

    await handle_checkin_event(fake_session, {"reservation_id": "res-1", "unit_id": "unit-1"})
    assert readiness.status == ReadinessStatus.NOT_READY
