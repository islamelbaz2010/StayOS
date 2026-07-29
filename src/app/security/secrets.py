import json
import logging
import os
from typing import Any

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class SecretNotFoundError(Exception):
    pass


class SecretsManager:
    """Load secrets from environment variables or AWS Secrets Manager."""

    def __init__(self, secret_arn: str | None = None) -> None:
        self._secret_arn = secret_arn or settings.SENTRY_DSN
        self._cache: dict[str, Any] = {}

    def get_secret(self, name: str) -> Any:
        if name in self._cache:
            return self._cache[name]

        env_value = os.environ.get(name)
        if env_value:
            self._cache[name] = env_value
            return env_value

        if self._secret_arn:
            value = self._fetch_from_aws(self._secret_arn)
            if isinstance(value, dict) and name in value:
                result = value[name]
            else:
                result = value
            self._cache[name] = result
            return result

        raise SecretNotFoundError(f"Secret {name} not found")

    def _fetch_from_aws(self, arn: str) -> Any:
        region = settings.AWS_REGION or "me-central-1"
        try:
            client = boto3.client("secretsmanager", region_name=region)
            response = client.get_secret_value(SecretId=arn)
        except ClientError as exc:
            code = exc.response["Error"]["Code"]
            if code in ("ResourceNotFoundException", "InvalidParameterException"):
                raise SecretNotFoundError(f"Secret not found in AWS: {arn}") from exc
            logger.error("AWS Secrets Manager error for %s: %s", arn, exc)
            raise SecretNotFoundError(f"AWS Secrets Manager error: {exc}") from exc

        secret_string = response.get("SecretString")
        if secret_string:
            try:
                return json.loads(secret_string)
            except json.JSONDecodeError:
                return secret_string

        # Binary secret (uncommon but possible)
        raise SecretNotFoundError(f"Secret {arn} returned binary data — only string secrets are supported")


def get_secret(name: str) -> Any:
    return SecretsManager().get_secret(name)
