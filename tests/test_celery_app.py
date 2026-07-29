from app.celery_app import celery_app


def test_celery_app_name() -> None:
    assert celery_app.main == "stayos"


def test_celery_default_queue() -> None:
    assert celery_app.conf.task_default_queue == "default"


def test_celery_task_serializer() -> None:
    assert celery_app.conf.task_serializer == "json"
