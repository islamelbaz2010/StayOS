from app.shared.models import Base, OutboxEvent, TimestampMixin, UUIDMixin


def test_base_declarative_base() -> None:
    assert Base.metadata is not None


def test_outbox_event_table_metadata() -> None:
    table = OutboxEvent.__table__
    assert table.name == "outbox_events"
    assert table.schema == "outbox"
    assert "aggregate_type" in table.columns
    assert "aggregate_id" in table.columns
    assert "event_type" in table.columns
    assert "payload" in table.columns
    assert "processed_at" in table.columns


def test_timestamp_mixin_columns() -> None:
    assert hasattr(TimestampMixin, "created_at")
    assert hasattr(TimestampMixin, "updated_at")


def test_uuid_mixin_primary_key() -> None:
    assert hasattr(UUIDMixin, "id")
