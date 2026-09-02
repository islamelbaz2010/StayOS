from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest

from app.auth import services as auth_services
from app.auth.constants import KycStatus
from app.auth.models import User
from app.database import get_session
from app.operations.constants import (
    MaintenanceRequestStatus,
    ReadinessStatus,
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
from app.operations.schemas import (
    TaskResponse,
)
from app.shared.exceptions import NotFoundError


def _make_user(user_id: str = "admin-1", role: str = "admin") -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id,
        phone_number="+201000000000",
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


def _token_for(user: User) -> str:
    return auth_services.create_access_token(user)


def _make_get_session_override(fake_session):
    async def _override():
        yield fake_session

    return _override


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


@pytest.fixture
def ops_client(client, fake_session):
    client.app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    client.app.dependency_overrides.pop(get_session, None)


def _make_task_response(task_id: str = "task-1", status: TaskStatus = TaskStatus.PENDING) -> TaskResponse:
    now = datetime.now(UTC)
    return TaskResponse(
        id=task_id,
        unit_id="unit-1",
        task_type=TaskType.CLEANING,
        status=status,
        priority=TaskPriority.NORMAL,
        due_by=now,
        created_at=now,
        updated_at=now,
    )


def _make_task_orm(task_id: str = "task-1", status: str = "PENDING") -> OperationTask:
    now = datetime.now(UTC)
    return OperationTask(
        id=task_id,
        unit_id="unit-1",
        task_type=TaskType.CLEANING,
        status=status,
        priority=TaskPriority.NORMAL,
        due_by=now,
        created_at=now,
        updated_at=now,
    )


def _make_staff() -> FieldStaff:
    now = datetime.now(UTC)
    return FieldStaff(
        id="staff-1",
        name="Cleaner",
        role=StaffRole.CLEANER,
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_maintenance_request() -> MaintenanceRequest:
    now = datetime.now(UTC)
    return MaintenanceRequest(
        id="mr-1",
        unit_id="unit-1",
        issue_type="plumbing",
        description="leak",
        status=MaintenanceRequestStatus.OPEN,
        created_at=now,
        updated_at=now,
    )


def _make_readiness() -> PropertyReadiness:
    now = datetime.now(UTC)
    return PropertyReadiness(
        id="pr-1",
        unit_id="unit-1",
        status=ReadinessStatus.READY,
        updated_at=now,
    )


def _make_recurring() -> RecurringMaintenance:
    now = datetime.now(UTC)
    return RecurringMaintenance(
        id="rm-1",
        unit_id="unit-1",
        task_type=TaskType.MAINTENANCE,
        frequency=RecurringFrequency.MONTHLY,
        next_run_at=now,
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def test_create_task_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_task",
        AsyncMock(return_value=_make_task_response()),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks",
        json={
            "unit_id": "unit-1",
            "task_type": "CLEANING",
            "due_by": datetime.now(UTC).isoformat(),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == "task-1"


def test_get_task_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_task",
        AsyncMock(return_value=_make_task_orm()),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/tasks/task-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == "task-1"


def test_update_task_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.update_task",
        AsyncMock(return_value=_make_task_response(status=TaskStatus.IN_PROGRESS)),
    )
    token = _token_for(user)
    response = ops_client.patch(
        "/api/v1/operations/tasks/task-1",
        json={"status": "IN_PROGRESS"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


def test_assign_task_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.assign_task",
        AsyncMock(return_value=_make_task_response(status=TaskStatus.ASSIGNED)),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks/task-1/assign",
        json={"field_staff_id": "staff-1"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_start_task_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.start_task",
        AsyncMock(return_value=_make_task_response(status=TaskStatus.IN_PROGRESS)),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks/task-1/start",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_complete_task_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.complete_task",
        AsyncMock(return_value=_make_task_response(status=TaskStatus.COMPLETED)),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks/task-1/complete",
        json={},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"


def test_add_task_note_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    task = _make_task_orm()
    task.notes = "new note"
    monkeypatch.setattr(
        "app.operations.router.add_task_note",
        AsyncMock(return_value=_make_task_response()),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks/task-1/notes",
        json={"note": "new note"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_add_task_attachment_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.add_task_attachment",
        AsyncMock(return_value=_make_task_response()),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks/task-1/attachments",
        json={"attachment_url": "http://example.com/img.jpg"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_get_task_timeline_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    now = datetime.now(UTC).isoformat()
    monkeypatch.setattr(
        "app.operations.router.get_task_timeline",
        AsyncMock(return_value=[{"event_type": "CREATED", "created_at": now}]),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/tasks/task-1/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()[0]["event_type"] == "CREATED"


def test_create_field_staff_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_field_staff",
        AsyncMock(return_value=_make_staff()),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/staff",
        json={"name": "Cleaner", "role": "CLEANER"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Cleaner"


def test_list_field_staff_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.list_field_staff",
        AsyncMock(return_value=[_make_staff()]),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/staff",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_create_maintenance_request_route(ops_client, monkeypatch) -> None:
    user = _make_user(role="host")
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_maintenance_request",
        AsyncMock(return_value=_make_maintenance_request()),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/maintenance",
        json={"unit_id": "unit-1", "issue_type": "plumbing", "description": "leak"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["unit_id"] == "unit-1"


def test_get_maintenance_request_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_maintenance_request",
        AsyncMock(return_value=_make_maintenance_request()),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/maintenance/mr-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_update_maintenance_request_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    req = _make_maintenance_request()
    req.status = MaintenanceRequestStatus.RESOLVED
    monkeypatch.setattr(
        "app.operations.router.update_maintenance_request",
        AsyncMock(return_value=req),
    )
    token = _token_for(user)
    response = ops_client.patch(
        "/api/v1/operations/maintenance/mr-1",
        json={"status": "RESOLVED"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "RESOLVED"


def test_list_maintenance_requests_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.list_open_maintenance_requests",
        AsyncMock(return_value=[_make_maintenance_request()]),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/maintenance",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_property_readiness_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_property_readiness",
        AsyncMock(return_value=_make_readiness()),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/readiness/unit-1?reservation_id=res-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["unit_id"] == "unit-1"


def test_update_property_readiness_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.update_property_readiness",
        AsyncMock(return_value=_make_readiness()),
    )
    token = _token_for(user)
    response = ops_client.patch(
        "/api/v1/operations/readiness/unit-1?reservation_id=res-1",
        json={"status": "READY"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


def test_get_operations_dashboard_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_operations_dashboard",
        AsyncMock(return_value={
            "pending_tasks": 1,
            "in_progress_tasks": 2,
            "completed_tasks_today": 3,
            "overdue_tasks": 0,
            "open_maintenance_requests": 0,
            "not_ready_units": 1,
            "active_field_staff": 4,
        }),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["pending_tasks"] == 1


def test_create_recurring_maintenance_route(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_recurring_maintenance",
        AsyncMock(return_value=_make_recurring()),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/recurring-maintenance",
        json={
            "unit_id": "unit-1",
            "task_type": "MAINTENANCE",
            "frequency": "MONTHLY",
            "next_run_at": datetime.now(UTC).isoformat(),
            "interval_days": 30,
            "description": "AC filter",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["unit_id"] == "unit-1"


def test_task_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_task",
        AsyncMock(side_effect=NotFoundError("Task not found")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/tasks/missing",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_create_task_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_task",
        AsyncMock(side_effect=NotFoundError("Unit not found")),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/tasks",
        json={"unit_id": "missing", "task_type": "CLEANING", "due_by": datetime.now(UTC).isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_create_field_staff_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_field_staff",
        AsyncMock(side_effect=NotFoundError("User not found")),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/staff",
        json={"name": "Cleaner", "role": "CLEANER"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_list_field_staff_error_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.list_field_staff",
        AsyncMock(side_effect=NotFoundError("no staff")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/staff",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_create_maintenance_request_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user(role="host")
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_maintenance_request",
        AsyncMock(side_effect=NotFoundError("Unit not found")),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/maintenance",
        json={"unit_id": "missing", "issue_type": "plumbing", "description": "leak"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_get_maintenance_request_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_maintenance_request",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/maintenance/mr-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_update_maintenance_request_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.update_maintenance_request",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.patch(
        "/api/v1/operations/maintenance/mr-1",
        json={"status": "RESOLVED"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_list_maintenance_requests_error_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.list_open_maintenance_requests",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/maintenance",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_get_readiness_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_property_readiness",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/readiness/unit-1",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_update_readiness_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.update_property_readiness",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.patch(
        "/api/v1/operations/readiness/unit-1",
        json={"status": "READY"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_get_dashboard_error_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_operations_dashboard",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_create_recurring_maintenance_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.create_recurring_maintenance",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.post(
        "/api/v1/operations/recurring-maintenance",
        json={"unit_id": "missing", "task_type": "MAINTENANCE", "frequency": "MONTHLY", "next_run_at": datetime.now(UTC).isoformat()},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


def test_get_task_timeline_not_found_returns_404(ops_client, monkeypatch) -> None:
    user = _make_user()
    _patch_auth_user(monkeypatch, user)
    monkeypatch.setattr(
        "app.operations.router.get_task_timeline",
        AsyncMock(side_effect=NotFoundError("not found")),
    )
    token = _token_for(user)
    response = ops_client.get(
        "/api/v1/operations/tasks/task-1/timeline",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404
