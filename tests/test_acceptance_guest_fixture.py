"""Regression coverage for the dedicated Acceptance Guest fixture.

The fixture (seed-accept-gues-0000-000000000001) is the isolated Guest used by
Dev Login and founder acceptance. A previous acceptance session upgraded it to
host — the seed script must be idempotent and restore guest/verified, and the
guest must never retain host privileges.
"""

import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

sys.path.insert(
    0, str(Path(__file__).resolve().parent.parent / "scripts")
)  # noqa: E402

import seed_acceptance_guest as seed_mod  # noqa: E402

from app.auth import repository as auth_repository  # noqa: E402
from app.auth import services as auth_services  # noqa: E402
from app.auth.constants import KycStatus, UserRole  # noqa: E402
from app.auth.dependencies import require_role  # noqa: E402
from app.auth.models import User  # noqa: E402
from app.auth.schemas import TokenPair  # noqa: E402
from app.bookings import services as bookings_services  # noqa: E402
from app.bookings import repository as bookings_repository  # noqa: E402
from app.bookings.constants import BookingStatus  # noqa: E402
from app.bookings.schemas import BookingUpdate  # noqa: E402
from app.database import get_session  # noqa: E402
from app.host import permissions as host_permissions  # noqa: E402
from app.main import app  # noqa: E402
from app.shared.exceptions import AuthorizationError  # noqa: E402

FIXTURE_ID = seed_mod.ACCEPTANCE_GUEST_ID
OMAR_ID = "seed-host-0000-0000-000000000002"


def _make_user(
    user_id: str | None = None,
    role: UserRole = UserRole.GUEST,
    kyc_status: KycStatus = KycStatus.VERIFIED,
    display_name: str = "Acceptance Guest",
) -> User:
    now = datetime.now(UTC)
    return User(
        id=user_id or str(uuid.uuid4()),
        phone_number="+201000000001",
        email="acceptance-guest@stayos.test",
        firebase_uid=None,
        display_name=display_name,
        locale="en",
        role=str(role),
        kyc_status=str(kyc_status),
        is_active=True,
        created_at=now,
        updated_at=now,
    )


def _make_get_session_override(fake_session: AsyncMock):
    async def _override() -> AsyncMock:
        yield fake_session

    return _override


@pytest.fixture
def fixture_client(client: TestClient, fake_session: AsyncMock) -> TestClient:
    app.dependency_overrides[get_session] = _make_get_session_override(fake_session)
    yield client
    app.dependency_overrides.pop(get_session, None)


def _patch_auth_user(monkeypatch, user: User) -> None:
    monkeypatch.setattr(
        "app.auth.dependencies.auth_repository.get_user_by_id",
        AsyncMock(return_value=user),
    )


def _existing_row(role: str, kyc_status: str) -> MagicMock:
    row = MagicMock()
    row.role = role
    row.kyc_status = kyc_status
    return row


def _result(fetchone=None) -> MagicMock:
    """Synchronous query result (session.execute returns this after await)."""
    result = MagicMock()
    result.fetchone.return_value = fetchone
    return result


# ---------------------------------------------------------------------------
# Test A/B — fixture creation and drift repair
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_seed_creates_guest_verified_fixture() -> None:
    """Fresh seed inserts the fixture with role=guest, kyc=verified."""
    session = AsyncMock()
    session.execute.return_value = _result(fetchone=None)

    await seed_mod.create_acceptance_guest(session)

    assert session.execute.await_count == 2
    insert_call = session.execute.await_args_list[1]
    sql = str(insert_call.args[0])
    assert "INSERT INTO auth.users" in sql
    assert "'guest'" in sql
    assert "'verified'" in sql
    assert insert_call.args[1]["id"] == FIXTURE_ID


@pytest.mark.asyncio
async def test_seed_repairs_drifted_host_role() -> None:
    """If the fixture drifted to host (previous founder testing), the seed
    restores role=guest/kyc=verified instead of leaving it stuck."""
    session = AsyncMock()
    session.execute.return_value = _result(fetchone=_existing_row("host", "verified"))

    await seed_mod.create_acceptance_guest(session)

    assert session.execute.await_count == 2
    repair_sql = str(session.execute.await_args_list[1].args[0])
    assert "UPDATE auth.users" in repair_sql
    assert "role = 'guest'" in repair_sql
    assert "kyc_status = 'verified'" in repair_sql


@pytest.mark.asyncio
async def test_seed_is_idempotent_when_correct() -> None:
    """Existing correct fixture → no INSERT/UPDATE (no duplicates)."""
    session = AsyncMock()
    session.execute.return_value = _result(fetchone=_existing_row("guest", "verified"))

    await seed_mod.create_acceptance_guest(session)

    assert session.execute.await_count == 1  # SELECT only


# ---------------------------------------------------------------------------
# Test C/D — Dev Login and authenticated identity
# ---------------------------------------------------------------------------


def test_dev_login_guest_targets_acceptance_fixture(
    fixture_client: TestClient, monkeypatch
) -> None:
    """Dev-token for the fixture id succeeds — Guest Dev Login resolves to
    the Acceptance Guest, not to Layla."""
    monkeypatch.setattr(auth_services.settings, "ENVIRONMENT", "development")
    user = _make_user(user_id=FIXTURE_ID)
    monkeypatch.setattr(
        auth_repository, "get_user_by_id", AsyncMock(return_value=user)
    )
    monkeypatch.setattr(
        auth_services,
        "create_token_pair",
        AsyncMock(
            return_value=TokenPair(
                access_token="access", refresh_token="refresh", expires_in=900
            )
        ),
    )

    response = fixture_client.post(
        "/api/v1/auth/dev-token", json={"user_id": FIXTURE_ID}
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "access"


def test_auth_me_reports_guest_verified(
    fixture_client: TestClient, monkeypatch
) -> None:
    """Authenticated /auth/me must report the fixture as guest + verified —
    not merely render the name."""
    user = _make_user(user_id=FIXTURE_ID)
    _patch_auth_user(monkeypatch, user)
    token = auth_services.create_access_token(user)

    response = fixture_client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == FIXTURE_ID
    assert data["display_name"] == "Acceptance Guest"
    assert data["role"] == "guest"
    assert data["kyc_status"] == "verified"


# ---------------------------------------------------------------------------
# Test E — Guest must not retain Host privileges
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/v1/host/today",
        "/api/v1/host/bookings",
        "/api/v1/host/earnings",
        "/api/v1/host/calendar",
        "/api/v1/host/profile",
    ],
)
def test_guest_denied_host_only_endpoints(
    fixture_client: TestClient, monkeypatch, endpoint: str
) -> None:
    guest = _make_user(user_id=FIXTURE_ID)
    _patch_auth_user(monkeypatch, guest)
    token = auth_services.create_access_token(guest)

    response = fixture_client.get(
        endpoint, headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Test F/G — Host role still works; only the unit owner may manage
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_host_role_passes_host_gate() -> None:
    """A real host (e.g. Omar) still passes the host role gate while the
    restored guest does not."""
    checker = require_role("host", "admin")
    host = _make_user(user_id=OMAR_ID, role=UserRole.HOST)
    guest = _make_user(user_id=FIXTURE_ID)

    assert await checker(user=host) is host
    with pytest.raises(AuthorizationError):
        await checker(user=guest)


@pytest.mark.asyncio
async def test_guest_cannot_accept_booking(monkeypatch) -> None:
    """Guest must not be able to perform the Host's accept/reject decision,
    even on their own booking — only the unit owner or full-access co-host."""
    guest = _make_user(user_id=FIXTURE_ID)
    booking = MagicMock()
    booking.guest_id = guest.id
    booking.status = str(BookingStatus.REQUESTED)
    booking.unit = MagicMock(host_id=OMAR_ID)

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value=None),
    )

    with pytest.raises(AuthorizationError):
        await bookings_services.update_booking(
            AsyncMock(),
            guest,
            str(uuid.uuid4()),
            BookingUpdate(status=BookingStatus.ACCEPTED),
        )


@pytest.mark.asyncio
async def test_owner_scope_can_accept_booking(monkeypatch) -> None:
    """The unit owner (Omar) retains accept authority — the downgrade does
    not weaken the host decision path."""
    host = _make_user(user_id=OMAR_ID, role=UserRole.HOST)
    booking = MagicMock()
    booking.id = str(uuid.uuid4())
    booking.unit_id = "seed-unit-0001-0000-000000000001"
    booking.guest_id = FIXTURE_ID
    booking.status = str(BookingStatus.REQUESTED)
    booking.unit = MagicMock(host_id=host.id)
    updated = MagicMock()

    monkeypatch.setattr(
        bookings_repository,
        "get_booking_or_raise",
        AsyncMock(return_value=booking),
    )
    monkeypatch.setattr(
        host_permissions,
        "get_unit_permission_scope",
        AsyncMock(return_value="owner"),
    )
    monkeypatch.setattr(
        bookings_repository,
        "update_booking",
        AsyncMock(return_value=updated),
    )
    monkeypatch.setattr(
        bookings_services, "write_event", AsyncMock()
    )
    monkeypatch.setattr(
        "app.payments.services.create_payment_for_booking", AsyncMock()
    )
    monkeypatch.setattr(
        bookings_services, "_to_response", MagicMock(return_value="resp")
    )

    result = await bookings_services.update_booking(
        AsyncMock(),
        host,
        str(uuid.uuid4()),
        BookingUpdate(status=BookingStatus.ACCEPTED),
    )

    assert result == "resp"
    update_kwargs = bookings_repository.update_booking.await_args.kwargs
    assert update_kwargs["status"] == str(BookingStatus.ACCEPTED)
    assert "accepted_at" in update_kwargs
