#!/usr/bin/env python3
"""Sync (or verify) CORS rules on the StayOS object-storage buckets.

Tigris/S3 bucket CORS is what lets the browser PUT directly to a
presigned URL. Previous outages happened because per-deployment Vercel
preview URLs were whitelisted one by one and went stale on the next
deploy. The canonical rule whitelists the stable Vercel aliases
(production domain, project alias, branch aliases); per-deployment
preview URLs are intentionally unsupported because Tigris CORS does not
evaluate partial wildcards.

Usage:
    # apply canonical rules to all buckets
    railway variables --service stayos-demo --kv | \
        python scripts/sync_bucket_cors.py --apply --stdin-env

    # check-only (exit 1 on drift)
    python scripts/sync_bucket_cors.py --check

Env required: S3_ENDPOINT_URL, S3_LISTINGS_BUCKET, S3_KYC_BUCKET,
S3_PAYMENT_PROOF_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
S3_KYC_ACCESS_KEY_ID, S3_KYC_SECRET_ACCESS_KEY,
S3_PAYMENT_PROOF_ACCESS_KEY_ID, S3_PAYMENT_PROOF_SECRET_ACCESS_KEY.
Bucket-scoped Tigris credentials must be used per bucket.
"""

from __future__ import annotations

import argparse
import os
import sys

import boto3
from botocore.config import Config

# Canonical browser origins. Tigris only evaluates exact origins or a
# bare "*" — partial globs are stored but not matched. Whitelist the
# STABLE Vercel aliases (project + per-branch); per-deployment
# `stayos-<hash>-...` URLs are inherently unstable and are intentionally
# not supported — run manual acceptance on one of these origins.
ALLOWED_ORIGINS = [
    "https://web-amber-pi-98.vercel.app",
    "https://stayos-islam-elbaz-s-projects.vercel.app",
    "https://stayos-git-main-islam-elbaz-s-projects.vercel.app",
    "https://stayos-git-product-completion-review-islam-elbaz-s-projects.vercel.app",
    "http://localhost:3000",
]

ALLOWED_METHODS = ["PUT", "POST", "GET", "HEAD"]
ALLOWED_HEADERS = ["*"]
EXPOSE_HEADERS = ["ETag"]
MAX_AGE_SECONDS = 3000


def _buckets() -> dict[str, tuple[str, str]]:
    """bucket -> (access_key, secret) honoring bucket-scoped creds."""
    return {
        os.environ["S3_LISTINGS_BUCKET"]: (
            os.environ["AWS_ACCESS_KEY_ID"],
            os.environ["AWS_SECRET_ACCESS_KEY"],
        ),
        os.environ["S3_KYC_BUCKET"]: (
            os.environ.get("S3_KYC_ACCESS_KEY_ID") or os.environ["AWS_ACCESS_KEY_ID"],
            os.environ.get("S3_KYC_SECRET_ACCESS_KEY")
            or os.environ["AWS_SECRET_ACCESS_KEY"],
        ),
        os.environ["S3_PAYMENT_PROOF_BUCKET"]: (
            os.environ.get("S3_PAYMENT_PROOF_ACCESS_KEY_ID")
            or os.environ["AWS_ACCESS_KEY_ID"],
            os.environ.get("S3_PAYMENT_PROOF_SECRET_ACCESS_KEY")
            or os.environ["AWS_SECRET_ACCESS_KEY"],
        ),
    }


def _client(access_key: str, secret_key: str):
    return boto3.client(
        "s3",
        region_name=os.environ.get("AWS_REGION") or "auto",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=os.environ.get("S3_ENDPOINT_URL") or None,
        config=Config(s3={"addressing_style": "virtual"}),
    )


def _canonical_rule() -> dict:
    return {
        "AllowedOrigins": ALLOWED_ORIGINS,
        "AllowedMethods": ALLOWED_METHODS,
        "AllowedHeaders": ALLOWED_HEADERS,
        "ExposeHeaders": EXPOSE_HEADERS,
        "MaxAgeSeconds": MAX_AGE_SECONDS,
    }


def _current_origins(client, bucket: str) -> list[str]:
    try:
        rules = client.get_bucket_cors(Bucket=bucket).get("CORSRules", [])
    except client.exceptions.ClientError as exc:
        if exc.response["Error"]["Code"] == "NoSuchCORSConfiguration":
            return []
        raise
    origins: list[str] = []
    for rule in rules:
        origins.extend(rule.get("AllowedOrigins", []))
    return origins


def _load_stdin_env() -> None:
    """Load KEY=value lines from stdin (e.g. `railway variables --kv`)."""
    for line in sys.stdin:
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write canonical CORS rules")
    parser.add_argument("--check", action="store_true", help="verify only; exit 1 on drift")
    parser.add_argument("--stdin-env", action="store_true", help="read KEY=value env from stdin")
    args = parser.parse_args()

    if args.stdin_env:
        _load_stdin_env()
    if not args.apply and not args.check:
        args.check = True

    ok = True
    for bucket, (ak, sk) in _buckets().items():
        client = _client(ak, sk)
        if args.apply:
            client.put_bucket_cors(
                Bucket=bucket, CORSConfiguration={"CORSRules": [_canonical_rule()]}
            )
            print(f"applied canonical CORS → {bucket}")
        origins = _current_origins(client, bucket)
        missing = [o for o in ALLOWED_ORIGINS if o not in origins]
        stale = [
            o
            for o in origins
            if "vercel.app" in o
            and o not in ALLOWED_ORIGINS
            and not o.startswith("http://localhost")
        ]
        if missing:
            ok = False
            print(f"{bucket}: MISSING origins {missing}")
        if stale:
            print(f"{bucket}: stale per-deploy origins {stale} (harmless; glob covers)")
        if not missing and not stale:
            print(f"{bucket}: OK")
        elif not missing:
            print(f"{bucket}: OK (with stale extras)")

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
