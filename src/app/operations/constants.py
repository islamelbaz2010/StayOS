from enum import StrEnum


class TaskType(StrEnum):
    TURNOVER = "TURNOVER"
    CLEANING = "CLEANING"
    INSPECTION = "INSPECTION"
    MAINTENANCE = "MAINTENANCE"


class TaskStatus(StrEnum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TaskPriority(StrEnum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class StaffRole(StrEnum):
    CLEANER = "CLEANER"
    INSPECTOR = "INSPECTOR"
    MAINTENANCE = "MAINTENANCE"
    OPERATIONS = "OPERATIONS"


class MaintenanceRequestStatus(StrEnum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class ReadinessStatus(StrEnum):
    NOT_READY = "NOT_READY"
    READY = "READY"


class RecurringFrequency(StrEnum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"
