from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.operations.constants import (
    RecurringFrequency,
    StaffRole,
    TaskPriority,
    TaskStatus,
    TaskType,
)
from app.operations.models import (
    FieldStaff,
    MaintenanceRequest,
    OperationTask,
    PropertyReadiness,
    RecurringMaintenance,
)
from app.operations.repository import (
    add_task_event,
    count_not_ready_units,
    count_overdue_tasks,
    count_tasks_by_status,
    create_field_staff,
    create_maintenance_request,
    create_recurring_maintenance,
    create_task,
    get_child_tasks,
    get_field_staff_by_id,
    get_maintenance_request_by_id,
    get_or_create_property_readiness,
    get_task_by_id,
    get_tasks_by_reservation,
    get_tasks_by_reservation_and_type,
    list_active_field_staff,
    list_due_recurring_maintenance,
    list_open_maintenance_requests,
    update_recurring_maintenance,
    update_task,
)


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    execute_result = MagicMock()
    execute_result.scalar_one_or_none = MagicMock(return_value=None)
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[])
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    session.execute = AsyncMock(return_value=execute_result)
    session.scalar = AsyncMock(return_value=0)
    return session


@pytest.fixture
def fake_session() -> AsyncMock:
    return _make_session()


@pytest.mark.asyncio
async def test_create_task(fake_session: AsyncMock) -> None:
    task = await create_task(
        fake_session,
        "unit-1",
        TaskType.CLEANING,
        datetime(2026, 8, 8, tzinfo=UTC),
        TaskPriority.NORMAL,
    )
    assert task.unit_id == "unit-1"
    fake_session.add.assert_called()


@pytest.mark.asyncio
async def test_get_task_by_id(fake_session: AsyncMock) -> None:
    task = OperationTask(id="task-1", unit_id="unit-1")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=task)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_task_by_id(fake_session, "task-1")
    assert result == task


@pytest.mark.asyncio
async def test_get_tasks_by_reservation_and_type(fake_session: AsyncMock) -> None:
    task = OperationTask(id="task-1", unit_id="unit-1")
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[task])
    execute_result = MagicMock()
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=execute_result)

    result = await get_tasks_by_reservation_and_type(fake_session, "res-1", TaskType.TURNOVER)
    assert result == [task]


@pytest.mark.asyncio
async def test_get_tasks_by_reservation(fake_session: AsyncMock) -> None:
    task = OperationTask(id="task-1", unit_id="unit-1")
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[task])
    execute_result = MagicMock()
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=execute_result)

    result = await get_tasks_by_reservation(fake_session, "res-1")
    assert result == [task]


@pytest.mark.asyncio
async def test_get_child_tasks(fake_session: AsyncMock) -> None:
    task = OperationTask(id="task-1", unit_id="unit-1")
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[task])
    execute_result = MagicMock()
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=execute_result)

    result = await get_child_tasks(fake_session, "parent-1")
    assert result == [task]


@pytest.mark.asyncio
async def test_update_task(fake_session: AsyncMock) -> None:
    task = OperationTask(id="task-1", unit_id="unit-1")
    result = await update_task(fake_session, task, status=TaskStatus.COMPLETED)
    assert result.status == TaskStatus.COMPLETED


@pytest.mark.asyncio
async def test_add_task_event(fake_session: AsyncMock) -> None:
    event = await add_task_event(fake_session, "task-1", "TEST", "user-1")
    assert event.task_id == "task-1"
    fake_session.add.assert_called()


@pytest.mark.asyncio
async def test_create_field_staff(fake_session: AsyncMock) -> None:
    staff = await create_field_staff(
        fake_session, None, "Cleaner", None, StaffRole.CLEANER
    )
    assert staff.name == "Cleaner"


@pytest.mark.asyncio
async def test_get_field_staff_by_id(fake_session: AsyncMock) -> None:
    staff = FieldStaff(id="staff-1", name="Cleaner", role=StaffRole.CLEANER)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=staff)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_field_staff_by_id(fake_session, "staff-1")
    assert result == staff


@pytest.mark.asyncio
async def test_list_active_field_staff(fake_session: AsyncMock) -> None:
    staff = FieldStaff(id="staff-1", name="Cleaner", role=StaffRole.CLEANER)
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[staff])
    execute_result = MagicMock()
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=execute_result)

    result = await list_active_field_staff(fake_session)
    assert result == [staff]


@pytest.mark.asyncio
async def test_create_maintenance_request(fake_session: AsyncMock) -> None:
    request = await create_maintenance_request(
        fake_session, "unit-1", "plumbing", "leak"
    )
    assert request.unit_id == "unit-1"


@pytest.mark.asyncio
async def test_get_maintenance_request_by_id(fake_session: AsyncMock) -> None:
    request = MaintenanceRequest(id="mr-1", unit_id="unit-1", issue_type="x", description="y")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=request)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_maintenance_request_by_id(fake_session, "mr-1")
    assert result == request


@pytest.mark.asyncio
async def test_list_open_maintenance_requests(fake_session: AsyncMock) -> None:
    request = MaintenanceRequest(id="mr-1", unit_id="unit-1", issue_type="x", description="y")
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[request])
    execute_result = MagicMock()
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=execute_result)

    result = await list_open_maintenance_requests(fake_session)
    assert result == [request]


@pytest.mark.asyncio
async def test_get_or_create_property_readiness(fake_session: AsyncMock) -> None:
    readiness = PropertyReadiness(id="pr-1", unit_id="unit-1")
    result_mock = MagicMock()
    result_mock.scalar_one_or_none = MagicMock(return_value=readiness)
    fake_session.execute = AsyncMock(return_value=result_mock)

    result = await get_or_create_property_readiness(fake_session, "unit-1")
    assert result == readiness


@pytest.mark.asyncio
async def test_count_tasks_by_status(fake_session: AsyncMock) -> None:
    await count_tasks_by_status(fake_session, TaskStatus.PENDING)
    fake_session.scalar.assert_awaited()


@pytest.mark.asyncio
async def test_count_overdue_tasks(fake_session: AsyncMock) -> None:
    await count_overdue_tasks(fake_session, datetime.now(UTC))
    fake_session.scalar.assert_awaited()


@pytest.mark.asyncio
async def test_count_not_ready_units(fake_session: AsyncMock) -> None:
    await count_not_ready_units(fake_session)
    fake_session.scalar.assert_awaited()


@pytest.mark.asyncio
async def test_create_recurring_maintenance(fake_session: AsyncMock) -> None:
    recurring = await create_recurring_maintenance(
        fake_session,
        "unit-1",
        TaskType.MAINTENANCE,
        RecurringFrequency.MONTHLY,
        datetime(2026, 9, 1, tzinfo=UTC),
        30,
        "AC filter",
    )
    assert recurring.unit_id == "unit-1"


@pytest.mark.asyncio
async def test_list_due_recurring_maintenance(fake_session: AsyncMock) -> None:
    recurring = RecurringMaintenance(
        id="rm-1",
        unit_id="unit-1",
        task_type=TaskType.MAINTENANCE,
        frequency=RecurringFrequency.MONTHLY,
        next_run_at=datetime(2026, 8, 1, tzinfo=UTC),
    )
    scalars_mock = MagicMock()
    scalars_mock.all = MagicMock(return_value=[recurring])
    execute_result = MagicMock()
    execute_result.scalars = MagicMock(return_value=scalars_mock)
    fake_session.execute = AsyncMock(return_value=execute_result)

    result = await list_due_recurring_maintenance(fake_session)
    assert result == [recurring]


@pytest.mark.asyncio
async def test_update_recurring_maintenance(fake_session: AsyncMock) -> None:
    recurring = RecurringMaintenance(
        id="rm-1",
        unit_id="unit-1",
        task_type=TaskType.MAINTENANCE,
        frequency=RecurringFrequency.MONTHLY,
        next_run_at=datetime(2026, 8, 1, tzinfo=UTC),
    )
    result = await update_recurring_maintenance(
        fake_session, recurring, datetime(2026, 9, 1, tzinfo=UTC)
    )
    assert result.next_run_at == datetime(2026, 9, 1, tzinfo=UTC)
