import json
import logging
import sys
from datetime import UTC, datetime

from .pii import mask_pii


class _PiiMaskingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = mask_pii(record.msg)
        if record.args:
            record.args = tuple(
                mask_pii(arg) if isinstance(arg, str) else arg for arg in record.args
            )
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": mask_pii(record.getMessage()),
            "module": record.module,
            "function": record.funcName,
            "lineno": record.lineno,
        }
        if record.exc_info:
            log["exception"] = mask_pii(self.formatException(record.exc_info))
        return json.dumps(log, ensure_ascii=False, default=str)


def setup_logging(level: str | None = None, json_output: bool = True) -> None:
    """Configure root logger with PII masking and optional JSON formatting."""
    root = logging.getLogger()
    root.setLevel(level or "INFO")
    # Avoid duplicate handlers when lifespan restarts.
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_PiiMaskingFilter())
    if json_output:
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
        )
    root.addHandler(handler)
