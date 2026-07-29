from app.shared.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    StayOSError,
    ValidationError,
    to_http_exception,
)
from fastapi import HTTPException, status


def test_not_found_error_maps_to_404() -> None:
    exc = to_http_exception(NotFoundError("resource not found"))
    assert isinstance(exc, HTTPException)
    assert exc.status_code == status.HTTP_404_NOT_FOUND
    assert exc.detail == "resource not found"


def test_validation_error_maps_to_422() -> None:
    exc = to_http_exception(ValidationError("invalid input"))
    assert exc.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_authentication_error_maps_to_401() -> None:
    exc = to_http_exception(AuthenticationError("unauthenticated"))
    assert exc.status_code == status.HTTP_401_UNAUTHORIZED


def test_authorization_error_maps_to_403() -> None:
    exc = to_http_exception(AuthorizationError("forbidden"))
    assert exc.status_code == status.HTTP_403_FORBIDDEN


def test_conflict_error_maps_to_409() -> None:
    exc = to_http_exception(ConflictError("conflict"))
    assert exc.status_code == status.HTTP_409_CONFLICT


def test_unknown_stayos_error_maps_to_500() -> None:
    exc = to_http_exception(StayOSError("generic"))
    assert isinstance(exc, HTTPException)
    assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
