import time
from collections import Counter
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request
from starlette.responses import Response


class MetricsCollector:
    def __init__(self) -> None:
        self.request_counts: Counter[str] = Counter()
        self.request_durations: dict[str, float] = {}
        self.status_counts: Counter[str] = Counter()
        self.errors: Counter[str] = Counter()

    def record_request(self, method: str, path: str, status_code: int, duration: float) -> None:
        label = f'{method.upper()} {path}'
        self.request_counts[label] += 1
        self.request_durations[label] = self.request_durations.get(label, 0.0) + duration
        self.status_counts[str(status_code)] += 1
        if status_code >= 500:
            self.errors[label] += 1

    def render_prometheus(self) -> str:
        lines: list[str] = []
        lines.append("# HELP stayos_http_requests_total Total HTTP requests")
        lines.append("# TYPE stayos_http_requests_total counter")
        for label, count in self.request_counts.items():
            lines.append(f'stayos_http_requests_total{{route="{label}"}} {count}')

        lines.append("# HELP stayos_http_request_duration_seconds_total Total request duration")
        lines.append("# TYPE stayos_http_request_duration_seconds_total counter")
        for label, total in self.request_durations.items():
            lines.append(f'stayos_http_request_duration_seconds_total{{route="{label}"}} {total:.6f}')

        lines.append("# HELP stayos_http_responses_total Total HTTP responses by status")
        lines.append("# TYPE stayos_http_responses_total counter")
        for status, count in self.status_counts.items():
            lines.append(f'stayos_http_responses_total{{status="{status}"}} {count}')

        lines.append("# HELP stayos_http_errors_total Total 5xx errors")
        lines.append("# TYPE stayos_http_errors_total counter")
        for label, count in self.errors.items():
            lines.append(f'stayos_http_errors_total{{route="{label}"}} {count}')

        return "\n".join(lines) + "\n"


collector = MetricsCollector()


async def metrics_middleware(
    request: Request[Any],
    call_next: Callable[[Request[Any]], Awaitable[Response]],
) -> Response:
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    collector.record_request(
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response
