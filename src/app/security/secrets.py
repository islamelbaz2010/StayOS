import os
from typing import Any

from app.config import settings


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

        # 1. Environment variable override always wins.
        env_value = os.environ.get(name)
        if env_value:
            self._cache[name] = env_value
            return env_value

        # 2. Optionally fetch from AWS Secrets Manager.
        if self._secret_arn and name == "SENTRY_DSN":
            value = self._fetch_from_aws(self._secret_arn)
            self._cache[name] = value
            return value

        raise SecretNotFoundError(f"Secret {name} not found")

    def _fetch_from_aws(self, arn: str) -> Any:
        # Production code should use boto3/botocore with IAM credentials.
        # This minimal implementation documents the contract and avoids heavy deps.
        region = settings.AWS_REGION or "us-east-1"
        url = f"https://secretsmanager.{region}.amazonaws.com/secretsmanager/?Action=GetSecretValue&SecretId={arn}"
        raise SecretNotFoundError(
            f"AWS Secrets Manager fetch not implemented at runtime: {url}"
        )


def get_secret(name: str) -> Any:
    return SecretsManager().get_secret(name)
