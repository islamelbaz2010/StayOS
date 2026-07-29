from app.shared.schemas import BaseResponse, HealthResponse, PaginatedResponse


def test_base_response_defaults() -> None:
    response = BaseResponse()
    assert response.success is True
    assert response.message is None


def test_base_response_with_message() -> None:
    response = BaseResponse(success=False, message="error")
    assert response.success is False
    assert response.message == "error"


def test_health_response() -> None:
    response = HealthResponse(status="ok", database="ok", redis="ok")
    assert response.status == "ok"
    assert response.database == "ok"
    assert response.redis == "ok"


def test_paginated_response() -> None:
    response = PaginatedResponse(items=[1, 2, 3], total=3, page=1, page_size=10, total_pages=1)
    assert response.items == [1, 2, 3]
    assert response.total == 3
