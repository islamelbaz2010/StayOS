from unittest.mock import AsyncMock, patch

import pytest

from app.database import get_session


async def test_get_session_commits_and_closes_on_success() -> None:
    mock_session = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()

    with patch("app.database.AsyncSessionLocal") as mock_local:
        mock_local.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_local.return_value.__aexit__ = AsyncMock(return_value=False)

        async for _session in get_session():
            pass

    mock_session.commit.assert_awaited_once()
    mock_session.rollback.assert_not_awaited()
    mock_session.close.assert_awaited_once()


async def test_get_session_rolls_back_and_closes_on_error() -> None:
    mock_session = AsyncMock()
    mock_session.commit = AsyncMock(side_effect=RuntimeError("commit failed"))
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()

    with patch("app.database.AsyncSessionLocal") as mock_local:
        mock_local.return_value.__aenter__ = AsyncMock(return_value=mock_session)
        mock_local.return_value.__aexit__ = AsyncMock(return_value=False)

        with pytest.raises(RuntimeError, match="commit failed"):
            async for _session in get_session():
                pass

    mock_session.rollback.assert_awaited_once()
    mock_session.close.assert_awaited_once()
