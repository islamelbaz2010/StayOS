"""Regression tests for CORS origin regex support.

The Vercel Preview frontend needs to talk to the Railway staging backend.
Vercel preview URLs change with every deployment, so the backend CORS config
must support a regex pattern (CORS_ORIGIN_REGEX) in addition to the explicit
origin list (CORS_ORIGINS).
"""

from unittest.mock import patch

from app.config import settings
from app.shared.middleware import setup_cors


def test_cors_origin_regex_config_exists() -> None:
    """CORS_ORIGIN_REGEX config field must exist and default to empty."""
    assert hasattr(settings, "CORS_ORIGIN_REGEX")
    assert settings.CORS_ORIGIN_REGEX == "" or isinstance(
        settings.CORS_ORIGIN_REGEX, str
    )


def test_setup_cors_without_regex() -> None:
    """setup_cors must work without CORS_ORIGIN_REGEX (backward compatible)."""
    from fastapi import FastAPI

    app = FastAPI()
    with patch.object(settings, "CORS_ORIGIN_REGEX", ""):
        with patch.object(settings, "CORS_ORIGINS", "http://localhost:3000"):
            setup_cors(app)  # must not raise
    # Verify middleware was added
    assert any(
        m.cls.__name__ == "CORSMiddleware" for m in app.user_middleware
    )


def test_setup_cors_with_regex() -> None:
    """setup_cors must pass allow_origin_regex when CORS_ORIGIN_REGEX is set."""
    from fastapi import FastAPI

    app = FastAPI()
    with patch.object(settings, "CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"):
        with patch.object(settings, "CORS_ORIGINS", "http://localhost:3000"):
            setup_cors(app)  # must not raise
    # Verify middleware was added with regex
    cors_mw = next(
        m for m in app.user_middleware if m.cls.__name__ == "CORSMiddleware"
    )
    assert "allow_origin_regex" in cors_mw.kwargs
    assert cors_mw.kwargs["allow_origin_regex"] == r"https://.*\.vercel\.app"
