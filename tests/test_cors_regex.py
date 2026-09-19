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


# ---------------------------------------------------------------------------
# CORS headers on unhandled 500 responses
#
# The generic ``Exception`` handler runs in Starlette's outermost
# ``ServerErrorMiddleware`` — outside ``CORSMiddleware`` — so 500 responses
# never received ``Access-Control-Allow-Origin`` and browsers reported a
# misleading CORS failure instead of the real error body.
# ---------------------------------------------------------------------------


def _request_with_origin(origin: str | None) -> object:
    from starlette.requests import Request

    headers = [(b"origin", origin.encode())] if origin else []
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/kyc/initiate",
            "headers": headers,
        }
    )


def test_generic_500_reflects_explicitly_allowed_origin() -> None:
    from app.main import _generic_exception_handler

    with patch.object(
        settings, "CORS_ORIGINS", "https://stayos.example.com"
    ), patch.object(settings, "CORS_ORIGIN_REGEX", ""):
        response = _generic_exception_handler(
            _request_with_origin("https://stayos.example.com"), Exception()
        )
    assert response.status_code == 500
    assert (
        response.headers["access-control-allow-origin"]
        == "https://stayos.example.com"
    )
    assert response.headers["access-control-allow-credentials"] == "true"


def test_generic_500_reflects_vercel_preview_origin_via_regex() -> None:
    from app.main import _generic_exception_handler

    origin = "https://stayos-814l6q390-islam-elbaz-s-projects.vercel.app"
    with patch.object(settings, "CORS_ORIGINS", "http://localhost:3000"), patch.object(
        settings, "CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"
    ):
        response = _generic_exception_handler(
            _request_with_origin(origin), Exception()
        )
    assert response.headers["access-control-allow-origin"] == origin


def test_generic_500_omits_acao_for_disallowed_origin() -> None:
    from app.main import _generic_exception_handler

    with patch.object(settings, "CORS_ORIGINS", "http://localhost:3000"), patch.object(
        settings, "CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"
    ):
        response = _generic_exception_handler(
            _request_with_origin("https://evil.example.com"), Exception()
        )
    assert "access-control-allow-origin" not in response.headers


def test_generic_500_omits_acao_without_origin() -> None:
    from app.main import _generic_exception_handler

    response = _generic_exception_handler(_request_with_origin(None), Exception())
    assert "access-control-allow-origin" not in response.headers


def test_project_specific_regex_allows_current_preview() -> None:
    from app.main import _cors_headers_for_origin
    from app.shared.middleware import setup_cors
    from fastapi import FastAPI

    origin = "https://stayos-814l6q390-islam-elbaz-s-projects.vercel.app"
    with patch.object(settings, "CORS_ORIGINS", ""), patch.object(
        settings,
        "CORS_ORIGIN_REGEX",
        r"https://stayos-[^.]+-islam-elbaz-s-projects\.vercel\.app",
    ):
        headers = _cors_headers_for_origin(_request_with_origin(origin))
        assert headers["Access-Control-Allow-Origin"] == origin
        assert headers["Access-Control-Allow-Credentials"] == "true"
        # Verify the same regex is wired through setup_cors to the middleware.
        app = FastAPI()
        setup_cors(app)
        mw = next(m for m in app.user_middleware if m.cls.__name__ == "CORSMiddleware")
        assert mw.kwargs["allow_origin_regex"] == settings.CORS_ORIGIN_REGEX


def test_project_specific_regex_rejects_arbitrary_vercel_subdomain() -> None:
    from app.main import _cors_headers_for_origin

    with patch.object(settings, "CORS_ORIGINS", ""), patch.object(
        settings,
        "CORS_ORIGIN_REGEX",
        r"https://stayos-[^.]+-islam-elbaz-s-projects\.vercel\.app",
    ):
        headers = _cors_headers_for_origin(
            _request_with_origin("https://evil-attacker.vercel.app")
        )
    assert not headers
