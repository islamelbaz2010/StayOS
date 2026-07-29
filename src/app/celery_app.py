from celery import Celery

from app.config import settings

celery_app = Celery(
    "stayos",
    broker=str(settings.REDIS_URL).replace("/0", "/1"),
    backend=str(settings.REDIS_URL).replace("/0", "/2"),
    include=[
        "app.kyc.tasks",
        "app.operations.tasks",
        "app.finance.tasks",
        "app.notifications.tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    beat_schedule={
        "poll-outbox-every-30-seconds": {
            "task": "app.operations.tasks.process_outbox_events",
            "schedule": 30.0,
        },
        "poll-finance-outbox-every-30-seconds": {
            "task": "app.finance.tasks.process_outbox_events",
            "schedule": 30.0,
        },
        "process-pending-payouts-hourly": {
            "task": "app.finance.tasks.process_pending_payouts",
            "schedule": 3600.0,
        },
        "poll-notifications-outbox-every-30-seconds": {
            "task": "app.notifications.tasks.process_outbox_events",
            "schedule": 30.0,
        },
        "process-pending-notifications-every-60-seconds": {
            "task": "app.notifications.tasks.process_pending_notifications",
            "schedule": 60.0,
        },
    },
)

celery_app.conf.task_queues = {
    "high": {
        "exchange": "high",
        "routing_key": "high",
    },
    "default": {
        "exchange": "default",
        "routing_key": "default",
    },
    "low": {
        "exchange": "low",
        "routing_key": "low",
    },
}

celery_app.conf.task_default_queue = "default"
celery_app.conf.task_default_exchange = "default"
celery_app.conf.task_default_routing_key = "default"
