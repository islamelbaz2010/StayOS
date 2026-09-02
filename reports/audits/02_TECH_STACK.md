# 02_TECH_STACK

## Purpose

This document identifies every language, framework, database, tool, and service used in the StayOS repository. It is a reference for understanding the technology footprint without evaluating maturity.

## Programming Languages

| Language | Version / Runtime | Usage |
|----------|-------------------|-------|
| Python | 3.11 | Backend API, workers, tests, migrations |
| TypeScript | 5.3 | Frontend pages and utilities |
| HCL | Terraform >= 1.x | AWS infrastructure as code |
| YAML | — | GitHub Actions, Docker Compose |
| Markdown | — | Documentation and reports |
| JSON | — | i18n messages, configurations |

## Backend Frameworks and Libraries

| Library | Declared Version | Purpose |
|---------|------------------|---------|
| FastAPI | >= 0.104.0 | HTTP API framework |
| Uvicorn | >= 0.24.0 | ASGI server |
| SQLAlchemy | >= 2.0.23 | ORM and async database access |
| asyncpg | >= 0.29.0 | PostgreSQL async driver |
| Alembic | >= 1.13.0 | Database migrations |
| Pydantic | >= 2.5.0 | Data validation and settings |
| pydantic-settings | >= 2.1.0 | Environment-based configuration |
| Redis | >= 5.0.0 | Async Redis client |
| Celery | >= 5.3.4 | Distributed task queue |
| httpx | >= 0.25.0 | Async HTTP client for external APIs |
| python-jose | >= 3.3.0 | JWT encoding/decoding (RS256) |
| passlib | >= 1.7.4 | Password hashing |
| python-multipart | >= 0.0.6 | Form data parsing |
| boto3 | >= 1.34.0 | AWS SDK (S3, Textract, Rekognition, SES) |
| firebase-admin | >= 6.3.0 | Firebase Authentication |
| twilio | >= 8.10.0 | SMS and Verify services |
| sentry-sdk | >= 1.39.0 | Error tracking and performance monitoring |
| geoalchemy2 | >= 0.20.0 | PostGIS geometry support |

## Frontend Stack

| Library / Tool | Declared Version | Purpose |
|----------------|------------------|---------|
| Next.js | 14.0.4 | React framework (App Router) |
| React | ^18.2.0 | UI library |
| React DOM | ^18.2.0 | DOM renderer |
| TypeScript | ^5.3.2 | Type-safe JavaScript |
| Tailwind CSS | ^3.3.5 | Utility-first CSS framework |
| postcss | ^8.4.31 | CSS processing |
| autoprefixer | ^10.4.16 | CSS autoprefixing |
| clsx | ^2.0.0 | Conditional class names |
| tailwind-merge | ^2.0.0 | Tailwind class merging |
| ESLint | ^8.54.0 | Linting |
| eslint-config-next | 14.0.4 | Next.js ESLint rules |

## Databases and Caching

| Service | Version / Image | Role |
|---------|-----------------|------|
| PostgreSQL | 16 (PostGIS 3.3) | Primary relational database |
| Redis | 7 | Celery broker, result backend, cache, rate limit store, session refresh tokens, idempotency |

## Infrastructure and DevOps

| Technology | Version / Provider | Role |
|------------|--------------------|------|
| Docker | — | Containerization |
| Docker Compose | 3.8 | Local and staging stacks |
| Terraform | ~> 5.0 AWS provider | AWS infrastructure as code |
| AWS | me-south-1 / configured region | Cloud provider (ECS, RDS, ElastiCache, ALB, S3, ECR, IAM, Secrets Manager) |
| GitHub Actions | — | CI/CD automation |

## Testing and Quality Tools

| Tool | Declared Version | Purpose |
|------|------------------|---------|
| pytest | >= 7.4.3 | Test runner |
| pytest-asyncio | >= 0.21.1 | Async test support |
| pytest-cov | >= 4.1.0 | Coverage reporting |
| ruff | >= 0.1.8 | Python linting and import sorting |
| mypy | >= 1.7.0 | Static type checking (strict mode enabled) |
| bandit | >= 1.7.6 | Security linting |
| safety | >= 2.3.5 | Dependency vulnerability scanning |
| types-redis | >= 4.6.0.11 | Redis type stubs |

## External Integrations

| Service | Library / Protocol | Usage |
|---------|--------------------|-------|
| Firebase Auth | `firebase-admin` | Social/phone authentication |
| Twilio Verify | `twilio` | OTP send/verify |
| Paymob | `httpx` (REST) | Payment gateway, hosted checkout, disbursements |
| Stripe | `httpx` (REST) | Payment intents, payouts, webhooks |
| AWS S3 | `boto3` | Listing photos, KYC document images |
| AWS Textract | `boto3` | ID document OCR |
| AWS Rekognition | `boto3` | Face comparison for KYC |
| AWS SES | `httpx` (SES v2) | Email notifications |
| Meta WhatsApp | `httpx` (Graph API) | WhatsApp notifications |
| Sentry | `sentry-sdk` | Error and performance monitoring |

## Build and Package Management

| Tool | Configuration | Purpose |
|------|---------------|---------|
| pip | `requirements.txt`, `requirements-dev.txt` | Python dependency installation |
| pyproject.toml | `[project]`, `[tool.ruff]`, `[tool.mypy]`, `[tool.pytest.ini_options]` | Project metadata and tool configuration |
| hatchling | `build-system` | Build backend for wheel |
| npm / pnpm | `package.json` | Node.js dependency management |
| Tailwind CLI | PostCSS config | CSS compilation |
