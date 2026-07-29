from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.shared.models import Base, TimestampMixin, UUIDMixin

from .constants import (
    MaintenanceRequestStatus,
    ReadinessStatus,
    TaskPriority,
    TaskStatus,
)


class FieldStaff(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "field_staff"
    __table_args__ = {"schema": "operations"}

    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("auth.users.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    assigned_tasks: Mapped[list["OperationTask"]] = relationship(
        "OperationTask", back_populates="field_staff", foreign_keys="OperationTask.field_staff_id"
    )


class OperationTask(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "operation_tasks"
    __table_args__ = (
        Index("idx_operation_tasks_unit_id", "unit_id"),
        Index("idx_operation_tasks_reservation_id", "reservation_id"),
        Index("idx_operation_tasks_status", "status"),
        Index("idx_operation_tasks_due_by", "due_by"),
        {"schema": "operations"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    reservation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    parent_task_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("operations.operation_tasks.id"), nullable=True
    )
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=TaskStatus.PENDING
    )
    priority: Mapped[str] = mapped_column(
        String(50), nullable=False, default=TaskPriority.NORMAL
    )
    field_staff_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("operations.field_staff.id"), nullable=True
    )
    due_by: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_staff_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("operations.field_staff.id"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    checklist: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    attachments: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_by_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    field_staff: Mapped["FieldStaff | None"] = relationship(
        "FieldStaff", back_populates="assigned_tasks", foreign_keys="OperationTask.field_staff_id"
    )
    verifier: Mapped["FieldStaff | None"] = relationship(
        "FieldStaff", foreign_keys="OperationTask.verified_by_staff_id"
    )
    timeline: Mapped[list["TaskEvent"]] = relationship(
        "TaskEvent", back_populates="task", order_by="TaskEvent.created_at"
    )


class TaskEvent(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "task_events"
    __table_args__ = (
        Index("idx_task_events_task_id", "task_id"),
        {"schema": "operations"},
    )

    task_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("operations.operation_tasks.id", ondelete="CASCADE"), nullable=False
    )
    actor_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    task: Mapped["OperationTask"] = relationship("OperationTask", back_populates="timeline")


class MaintenanceRequest(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "maintenance_requests"
    __table_args__ = (
        Index("idx_maintenance_requests_unit_id", "unit_id"),
        Index("idx_maintenance_requests_status", "status"),
        {"schema": "operations"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    reporter_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    issue_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=MaintenanceRequestStatus.OPEN
    )
    related_task_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("operations.operation_tasks.id"), nullable=True
    )


class PropertyReadiness(UUIDMixin, Base):
    __tablename__ = "property_readiness"
    __table_args__ = (
        Index("idx_property_readiness_unit_id", "unit_id"),
        {"schema": "operations"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    reservation_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=ReadinessStatus.NOT_READY
    )
    blocked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class RecurringMaintenance(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "recurring_maintenance"
    __table_args__ = (
        Index("idx_recurring_maintenance_unit_id", "unit_id"),
        {"schema": "operations"},
    )

    unit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pms.units.id"), nullable=False
    )
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    interval_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    next_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
