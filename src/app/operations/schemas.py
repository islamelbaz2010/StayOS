from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .constants import (
    MaintenanceRequestStatus,
    ReadinessStatus,
    RecurringFrequency,
    StaffRole,
    TaskPriority,
    TaskStatus,
    TaskType,
)


class ChecklistItem(BaseModel):
    item: str
    completed: bool = False


class TaskCreate(BaseModel):
    unit_id: str
    task_type: TaskType
    reservation_id: str | None = None
    parent_task_id: str | None = None
    priority: TaskPriority = TaskPriority.NORMAL
    due_by: datetime
    notes: str | None = None
    checklist: list[ChecklistItem] | None = None
    created_by_id: str | None = None


class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    field_staff_id: str | None = None
    due_by: datetime | None = None
    notes: str | None = None
    checklist: list[ChecklistItem] | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    reservation_id: str | None = None
    parent_task_id: str | None = None
    task_type: TaskType
    status: TaskStatus
    priority: TaskPriority
    field_staff_id: str | None = None
    due_by: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    verified_by_staff_id: str | None = None
    notes: str | None = None
    checklist: list[ChecklistItem] | None = None
    attachments: list[str] | None = None
    created_by_id: str | None = None
    created_at: datetime
    updated_at: datetime


class TaskAssignRequest(BaseModel):
    field_staff_id: str


class TaskCompleteRequest(BaseModel):
    completed_at: datetime | None = None
    verified_by_staff_id: str | None = None


class TaskNoteRequest(BaseModel):
    note: str = Field(..., min_length=1)


class TaskAttachmentRequest(BaseModel):
    attachment_url: str = Field(..., min_length=1)


class FieldStaffCreate(BaseModel):
    user_id: str | None = None
    name: str = Field(..., min_length=1)
    phone: str | None = None
    role: StaffRole
    is_active: bool = True


class FieldStaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    name: str
    phone: str | None = None
    role: StaffRole
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MaintenanceRequestCreate(BaseModel):
    unit_id: str
    issue_type: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    reporter_id: str | None = None


class MaintenanceRequestUpdate(BaseModel):
    status: MaintenanceRequestStatus | None = None
    related_task_id: str | None = None


class MaintenanceRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    reporter_id: str | None = None
    issue_type: str
    description: str
    status: MaintenanceRequestStatus
    related_task_id: str | None = None
    created_at: datetime
    updated_at: datetime


class PropertyReadinessUpdate(BaseModel):
    status: ReadinessStatus
    blocked_until: datetime | None = None
    reason: str | None = None


class PropertyReadinessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    reservation_id: str | None = None
    status: ReadinessStatus
    blocked_until: datetime | None = None
    reason: str | None = None
    updated_at: datetime


class RecurringMaintenanceCreate(BaseModel):
    unit_id: str
    task_type: TaskType
    frequency: RecurringFrequency
    interval_days: int | None = None
    next_run_at: datetime
    description: str | None = None


class RecurringMaintenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    unit_id: str
    task_type: TaskType
    frequency: RecurringFrequency
    interval_days: int | None = None
    next_run_at: datetime
    is_active: bool
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class OperationsDashboardResponse(BaseModel):
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks_today: int
    overdue_tasks: int
    open_maintenance_requests: int
    not_ready_units: int
    active_field_staff: int


class OutboxEventPayload(BaseModel):
    event_id: str
    event_type: str
    aggregate_type: str
    aggregate_id: str
    payload: dict[str, Any]
