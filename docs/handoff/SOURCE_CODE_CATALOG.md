# StayOS Source Code Catalog

529 meaningful source files. Machine-readable version:
`SOURCE_CODE_CATALOG.json`.

| Path | Type | Module | Notes |
|---|---|---|---|
| `src/app/__init__.py` | module | app.__init__.py | supporting code |
| `src/app/admin/__init__.py` | module | app.admin | supporting code |
| `src/app/admin/router.py` | HTTP router | app.admin | public API surface |
| `src/app/admin/schemas.py` | Pydantic schemas | app.admin | API contracts |
| `src/app/admin/services.py` | service layer | app.admin | business logic |
| `src/app/auth/__init__.py` | module | app.auth | supporting code — security-sensitive |
| `src/app/auth/constants.py` | domain constants/enums | app.auth | configuration — security-sensitive |
| `src/app/auth/dependencies.py` | module | app.auth | supporting code — security-sensitive |
| `src/app/auth/models.py` | ORM models | app.auth | database schema — security-sensitive |
| `src/app/auth/repository.py` | repository layer | app.auth | data access — security-sensitive |
| `src/app/auth/router.py` | HTTP router | app.auth | public API surface — security-sensitive |
| `src/app/auth/schemas.py` | Pydantic schemas | app.auth | API contracts — security-sensitive |
| `src/app/auth/services.py` | service layer | app.auth | business logic — security-sensitive |
| `src/app/auth/staff.py` | module | app.auth | supporting code — security-sensitive |
| `src/app/auth/staff_router.py` | module | app.auth | supporting code — security-sensitive |
| `src/app/auth/staff_schemas.py` | module | app.auth | supporting code — security-sensitive |
| `src/app/availability/__init__.py` | module | app.availability | supporting code |
| `src/app/availability/constants.py` | domain constants/enums | app.availability | configuration |
| `src/app/availability/repository.py` | repository layer | app.availability | data access |
| `src/app/availability/router.py` | HTTP router | app.availability | public API surface |
| `src/app/availability/schemas.py` | Pydantic schemas | app.availability | API contracts |
| `src/app/availability/services.py` | service layer | app.availability | business logic |
| `src/app/bookings/constants.py` | domain constants/enums | app.bookings | configuration |
| `src/app/bookings/models.py` | ORM models | app.bookings | database schema |
| `src/app/bookings/offers.py` | module | app.bookings | supporting code |
| `src/app/bookings/repository.py` | repository layer | app.bookings | data access |
| `src/app/bookings/router.py` | HTTP router | app.bookings | public API surface |
| `src/app/bookings/schemas.py` | Pydantic schemas | app.bookings | API contracts |
| `src/app/bookings/services.py` | service layer | app.bookings | business logic |
| `src/app/bookings/tasks.py` | celery tasks | app.bookings | async work |
| `src/app/celery_app.py` | module | app.celery_app.py | supporting code |
| `src/app/cms/__init__.py` | module | app.cms | supporting code |
| `src/app/cms/constants.py` | domain constants/enums | app.cms | configuration |
| `src/app/cms/models.py` | ORM models | app.cms | database schema |
| `src/app/cms/repository.py` | repository layer | app.cms | data access |
| `src/app/cms/router.py` | HTTP router | app.cms | public API surface |
| `src/app/cms/schemas.py` | Pydantic schemas | app.cms | API contracts |
| `src/app/cms/services.py` | service layer | app.cms | business logic |
| `src/app/config.py` | module | app.config.py | supporting code |
| `src/app/database.py` | module | app.database.py | supporting code |
| `src/app/discovery/__init__.py` | module | app.discovery | supporting code |
| `src/app/discovery/adapters/__init__.py` | module | app.discovery | supporting code |
| `src/app/discovery/adapters/base.py` | module | app.discovery | supporting code |
| `src/app/discovery/adapters/google_places.py` | module | app.discovery | supporting code |
| `src/app/discovery/adapters/json_api.py` | module | app.discovery | supporting code |
| `src/app/discovery/adapters/manual.py` | module | app.discovery | supporting code |
| `src/app/discovery/adapters/overpass.py` | module | app.discovery | supporting code |
| `src/app/discovery/constants.py` | domain constants/enums | app.discovery | configuration |
| `src/app/discovery/dedup.py` | module | app.discovery | supporting code |
| `src/app/discovery/models.py` | ORM models | app.discovery | database schema |
| `src/app/discovery/normalizer.py` | module | app.discovery | supporting code |
| `src/app/discovery/router.py` | HTTP router | app.discovery | public API surface |
| `src/app/discovery/schemas.py` | Pydantic schemas | app.discovery | API contracts |
| `src/app/discovery/scoring.py` | module | app.discovery | supporting code |
| `src/app/discovery/services.py` | service layer | app.discovery | business logic |
| `src/app/discovery/tasks.py` | celery tasks | app.discovery | async work |
| `src/app/disputes/__init__.py` | module | app.disputes | supporting code |
| `src/app/disputes/constants.py` | domain constants/enums | app.disputes | configuration |
| `src/app/disputes/models.py` | ORM models | app.disputes | database schema |
| `src/app/disputes/router.py` | HTTP router | app.disputes | public API surface |
| `src/app/disputes/schemas.py` | Pydantic schemas | app.disputes | API contracts |
| `src/app/disputes/services.py` | service layer | app.disputes | business logic |
| `src/app/favorites/__init__.py` | module | app.favorites | supporting code |
| `src/app/favorites/models.py` | ORM models | app.favorites | database schema |
| `src/app/favorites/router.py` | HTTP router | app.favorites | public API surface |
| `src/app/favorites/schemas.py` | Pydantic schemas | app.favorites | API contracts |
| `src/app/favorites/services.py` | service layer | app.favorites | business logic |
| `src/app/finance/__init__.py` | module | app.finance | supporting code — security-sensitive |
| `src/app/finance/adjustments.py` | module | app.finance | supporting code — security-sensitive |
| `src/app/finance/commercial.py` | module | app.finance | supporting code — security-sensitive |
| `src/app/finance/constants.py` | domain constants/enums | app.finance | configuration — security-sensitive |
| `src/app/finance/consumers.py` | event consumers | app.finance | async work — security-sensitive |
| `src/app/finance/models.py` | ORM models | app.finance | database schema — security-sensitive |
| `src/app/finance/providers.py` | external provider adapters | app.finance | integrations — security-sensitive |
| `src/app/finance/repository.py` | repository layer | app.finance | data access — security-sensitive |
| `src/app/finance/router.py` | HTTP router | app.finance | public API surface — security-sensitive |
| `src/app/finance/schemas.py` | Pydantic schemas | app.finance | API contracts — security-sensitive |
| `src/app/finance/services.py` | service layer | app.finance | business logic — security-sensitive |
| `src/app/finance/tasks.py` | celery tasks | app.finance | async work — security-sensitive |
| `src/app/host/__init__.py` | module | app.host | supporting code |
| `src/app/host/constants.py` | domain constants/enums | app.host | configuration |
| `src/app/host/permissions.py` | module | app.host | supporting code |
| `src/app/host/repository.py` | repository layer | app.host | data access |
| `src/app/host/router.py` | HTTP router | app.host | public API surface |
| `src/app/host/schemas.py` | Pydantic schemas | app.host | API contracts |
| `src/app/host/services.py` | service layer | app.host | business logic |
| `src/app/importer/__init__.py` | module | app.importer | supporting code |
| `src/app/importer/parser.py` | module | app.importer | supporting code |
| `src/app/importer/router.py` | HTTP router | app.importer | public API surface |
| `src/app/importer/schemas.py` | Pydantic schemas | app.importer | API contracts |
| `src/app/importer/services.py` | service layer | app.importer | business logic |
| `src/app/importer/validation.py` | module | app.importer | supporting code |
| `src/app/kyc/__init__.py` | module | app.kyc | supporting code — security-sensitive |
| `src/app/kyc/models.py` | ORM models | app.kyc | database schema — security-sensitive |
| `src/app/kyc/providers/__init__.py` | module | app.kyc | supporting code — security-sensitive |
| `src/app/kyc/providers/base.py` | module | app.kyc | supporting code — security-sensitive |
| `src/app/kyc/providers/sumsub.py` | module | app.kyc | supporting code — security-sensitive |
| `src/app/kyc/repository.py` | repository layer | app.kyc | data access — security-sensitive |
| `src/app/kyc/router.py` | HTTP router | app.kyc | public API surface — security-sensitive |
| `src/app/kyc/schemas.py` | Pydantic schemas | app.kyc | API contracts — security-sensitive |
| `src/app/kyc/services.py` | service layer | app.kyc | business logic — security-sensitive |
| `src/app/kyc/tasks.py` | celery tasks | app.kyc | async work — security-sensitive |
| `src/app/listings/__init__.py` | module | app.listings | supporting code |
| `src/app/listings/cohost_models.py` | module | app.listings | supporting code |
| `src/app/listings/configuration.py` | module | app.listings | supporting code |
| `src/app/listings/constants.py` | domain constants/enums | app.listings | configuration |
| `src/app/listings/fit.py` | module | app.listings | supporting code |
| `src/app/listings/models.py` | ORM models | app.listings | database schema |
| `src/app/listings/moderation.py` | module | app.listings | supporting code |
| `src/app/listings/pricing.py` | module | app.listings | supporting code |
| `src/app/listings/repository.py` | repository layer | app.listings | data access |
| `src/app/listings/router.py` | HTTP router | app.listings | public API surface |
| `src/app/listings/schemas.py` | Pydantic schemas | app.listings | API contracts |
| `src/app/listings/services.py` | service layer | app.listings | business logic |
| `src/app/main.py` | module | app.main.py | supporting code |
| `src/app/messages/__init__.py` | module | app.messages | supporting code |
| `src/app/messages/constants.py` | domain constants/enums | app.messages | configuration |
| `src/app/messages/models.py` | ORM models | app.messages | database schema |
| `src/app/messages/repository.py` | repository layer | app.messages | data access |
| `src/app/messages/router.py` | HTTP router | app.messages | public API surface |
| `src/app/messages/schemas.py` | Pydantic schemas | app.messages | API contracts |
| `src/app/messages/services.py` | service layer | app.messages | business logic |
| `src/app/messages/tasks.py` | celery tasks | app.messages | async work |
| `src/app/messages/templates.py` | message templates | app.messages | content |
| `src/app/notifications/__init__.py` | module | app.notifications | supporting code |
| `src/app/notifications/constants.py` | domain constants/enums | app.notifications | configuration |
| `src/app/notifications/consumers.py` | event consumers | app.notifications | async work |
| `src/app/notifications/models.py` | ORM models | app.notifications | database schema |
| `src/app/notifications/providers.py` | external provider adapters | app.notifications | integrations — security-sensitive |
| `src/app/notifications/repository.py` | repository layer | app.notifications | data access |
| `src/app/notifications/router.py` | HTTP router | app.notifications | public API surface |
| `src/app/notifications/schemas.py` | Pydantic schemas | app.notifications | API contracts |
| `src/app/notifications/services.py` | service layer | app.notifications | business logic |
| `src/app/notifications/tasks.py` | celery tasks | app.notifications | async work |
| `src/app/notifications/templates.py` | message templates | app.notifications | content |
| `src/app/operations/__init__.py` | module | app.operations | supporting code |
| `src/app/operations/constants.py` | domain constants/enums | app.operations | configuration |
| `src/app/operations/consumers.py` | event consumers | app.operations | async work |
| `src/app/operations/metrics.py` | metrics | app.operations | observability |
| `src/app/operations/models.py` | ORM models | app.operations | database schema |
| `src/app/operations/repository.py` | repository layer | app.operations | data access |
| `src/app/operations/router.py` | HTTP router | app.operations | public API surface |
| `src/app/operations/schemas.py` | Pydantic schemas | app.operations | API contracts |
| `src/app/operations/services.py` | service layer | app.operations | business logic |
| `src/app/operations/tasks.py` | celery tasks | app.operations | async work |
| `src/app/payments/__init__.py` | module | app.payments | supporting code — security-sensitive |
| `src/app/payments/constants.py` | domain constants/enums | app.payments | configuration — security-sensitive |
| `src/app/payments/models.py` | ORM models | app.payments | database schema — security-sensitive |
| `src/app/payments/repository.py` | repository layer | app.payments | data access — security-sensitive |
| `src/app/payments/router.py` | HTTP router | app.payments | public API surface — security-sensitive |
| `src/app/payments/schemas.py` | Pydantic schemas | app.payments | API contracts — security-sensitive |
| `src/app/payments/services.py` | service layer | app.payments | business logic — security-sensitive |
| `src/app/reports/__init__.py` | module | app.reports | supporting code |
| `src/app/reports/queries.py` | report queries | app.reports | data access |
| `src/app/reports/registry.py` | module | app.reports | supporting code |
| `src/app/reports/router.py` | HTTP router | app.reports | public API surface |
| `src/app/reports/schemas.py` | Pydantic schemas | app.reports | API contracts |
| `src/app/reservations/__init__.py` | module | app.reservations | supporting code |
| `src/app/reservations/constants.py` | domain constants/enums | app.reservations | configuration |
| `src/app/reservations/models.py` | ORM models | app.reservations | database schema |
| `src/app/reservations/repository.py` | repository layer | app.reservations | data access |
| `src/app/reservations/router.py` | HTTP router | app.reservations | public API surface |
| `src/app/reservations/schemas.py` | Pydantic schemas | app.reservations | API contracts |
| `src/app/reservations/services.py` | service layer | app.reservations | business logic |
| `src/app/reviews/__init__.py` | module | app.reviews | supporting code |
| `src/app/reviews/constants.py` | domain constants/enums | app.reviews | configuration |
| `src/app/reviews/models.py` | ORM models | app.reviews | database schema |
| `src/app/reviews/repository.py` | repository layer | app.reviews | data access |
| `src/app/reviews/router.py` | HTTP router | app.reviews | public API surface |
| `src/app/reviews/schemas.py` | Pydantic schemas | app.reviews | API contracts |
| `src/app/reviews/services.py` | service layer | app.reviews | business logic |
| `src/app/security/__init__.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/audit.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/logging.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/middleware.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/models.py` | ORM models | app.security | database schema — security-sensitive |
| `src/app/security/pii.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/rate_limit.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/secrets.py` | module | app.security | supporting code — security-sensitive |
| `src/app/security/sentry.py` | module | app.security | supporting code — security-sensitive |
| `src/app/shared/__init__.py` | module | app.shared | supporting code |
| `src/app/shared/exceptions.py` | module | app.shared | supporting code |
| `src/app/shared/middleware.py` | module | app.shared | supporting code |
| `src/app/shared/models.py` | ORM models | app.shared | database schema |
| `src/app/shared/outbox.py` | module | app.shared | supporting code |
| `src/app/shared/redis.py` | module | app.shared | supporting code |
| `src/app/shared/schemas.py` | Pydantic schemas | app.shared | API contracts |
| `src/app/shared/storage.py` | module | app.shared | supporting code |
| `alembic/versions/001_create_schemas.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/002_create_outbox_events.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/003_create_auth_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/004_create_pms_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/005_create_reservation_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/006_add_host_operations_columns.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/007_add_operations_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/008_create_finance_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/009_add_calendar_exclusion.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/010_add_notifications_and_security.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/011_create_unit_photos.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/012_create_device_tokens.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/013_create_analytics_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/014_add_property_readiness_unique.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/015_adr015_add_currency_columns.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/016_create_bookings_table.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/017_add_listing_configuration.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/018_add_listing_creation_fields.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/019_create_payments_table.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/020_create_discovery_tables.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/021_add_candidate_type.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/022_add_favorites_and_locations.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/023_add_reviews.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/024_add_booking_cancellation_fields.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/025_add_booking_checkin_checkout_fields.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/026_create_messaging_and_listing_stay_config.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/027_create_host_operating_system.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/028_payment_lifecycle_fields.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/029_unit_rejection_reason.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/030_payment_cleaning_fee.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/031_host_guest_reviews.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/032_listing_discovery_attributes.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/033_self_check_in_methods.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/034_sleeping_arrangements.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/035_accessibility_photos.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/036_review_parity.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/037_host_bio.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/038_instant_book.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/039_moderation_disputes_staff.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/040_candidate_governorate.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/041_user_password_hash.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/042_commercial_differentiation.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/043_outbox_processed_by.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/044_cms_lite.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/045_booking_paymob_avatar.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/046_payment_vat.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/047_alias_instant_book.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/048_in_app_notifications.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/049_decimal_money.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/050_commercial_adjustments.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/051_account_profile_r1.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/052_kyc_provider_fields.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `alembic/versions/053_support_conversations.py` | alembic migration | alembic | schema migration; immutable once applied — add a new revision instead |
| `scripts/backfill_capture_recognition.py` | ops script | scripts | tooling |
| `scripts/backup.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/cleanup_acceptance.py` | ops script | scripts | tooling |
| `scripts/export_openapi.py` | ops script | scripts | tooling |
| `scripts/restore_verify.py` | ops script | scripts | tooling |
| `scripts/seed_acceptance.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/seed_acceptance_guest.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/seed_acceptance_staff.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/seed_cms_pages.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/seed_demo_supply.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/seed_staging.py` | ops script | scripts | tooling — security-sensitive |
| `scripts/sync_bucket_cors.py` | ops script | scripts | tooling |
| `scripts/verify_financial_truth.py` | ops script | scripts | tooling |
| `scripts/railway_deploy_guard.sh` | ops script | scripts | tooling |
| `scripts/staging_health.sh` | ops script | scripts | tooling |
| `scripts/staging_migrate.sh` | ops script | scripts | tooling |
| `scripts/staging_rollback.sh` | ops script | scripts | tooling |
| `scripts/staging_seed.sh` | ops script | scripts | tooling — security-sensitive |
| `scripts/staging_start.sh` | ops script | scripts | tooling |
| `scripts/staging_stop.sh` | ops script | scripts | tooling |
| `apps/web/app/[locale]/about/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/account-settings/activity/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/language/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/notifications/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/pages.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/payments/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/personal/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/privacy/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/account-settings/security/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/bookings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/content/[pageId]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/content/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/discovery/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/disputes/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/earnings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/import/page.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/import/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/kyc/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/listings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/payments/[paymentId]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/payments/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/pending/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/reports/[reportKey]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/reports/management/management.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/reports/management/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/reports/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/reports/reports.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/staff/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/support/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/admin/users/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/auth/forgot-password/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/auth/login/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/auth/register/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/become-a-host/page.test.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/become-a-host/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/bookings/[bookingId]/page.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/bookings/[bookingId]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/bookings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/checkout/[bookingId]/page.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/checkout/[bookingId]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/error.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/faq/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/favorites/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/for-guests/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/for-hosts/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/help/article/[slug]/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/help/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/host/availability/[unitId]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/bookings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/calendar/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/earnings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/guide/[topic]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/guide/guide.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/guide/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/kyc/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/[unitId]/availability/availability.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/[unitId]/availability/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/[unitId]/co-hosts/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/[unitId]/edit/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/[unitId]/photos/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/new/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/listings/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host/profile/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/host-standards/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/hosts/[hostId]/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/how-it-works/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/kyc/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/layout.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/listings/[unitId]/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/messages/[conversationId]/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/messages/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/not-found.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/notifications/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/p/[slug]/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/payments/page.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/payments/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/profile/page.test.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/profile/page.tsx` | next route | web/[locale] | page/route — security-sensitive |
| `apps/web/app/[locale]/search/layout.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/search/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/[locale]/support/page.tsx` | next route | web/[locale] | page/route |
| `apps/web/app/global-error.tsx` | next route | web/global-error.tsx | page/route |
| `apps/web/app/layout.tsx` | next route | web/layout.tsx | page/route |
| `apps/web/app/not-found.tsx` | next route | web/not-found.tsx | page/route |
| `apps/web/app/page.tsx` | next route | web/page.tsx | page/route |
| `apps/web/components/DocumentDirection.tsx` | react component | web/DocumentDirection.tsx | UI component |
| `apps/web/components/auth/ProtectedRoute.tsx` | react component | web/auth | UI component — security-sensitive |
| `apps/web/components/availability/HostAvailabilityCalendar.tsx` | react component | web/availability | UI component |
| `apps/web/components/bookings/AvailabilityCalendar.test.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/AvailabilityCalendar.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/BookingFinancialSummary.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/BookingPanel.test.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/BookingPanel.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/BookingSuccess.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/CancelBookingButton.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/HostBookingActions.test.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/HostBookingActions.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/HostBookingDetail.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/HostBookingList.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/LeaveReviewForm.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/MessageHostButton.tsx` | react component | web/bookings | UI component |
| `apps/web/components/bookings/StayTimeline.tsx` | react component | web/bookings | UI component |
| `apps/web/components/cms/BlockRenderer.tsx` | react component | web/cms | UI component |
| `apps/web/components/disputes/ReportProblem.tsx` | react component | web/disputes | UI component |
| `apps/web/components/help/HelpArticleClient.tsx` | react component | web/help | UI component |
| `apps/web/components/help/HelpCenterClient.tsx` | react component | web/help | UI component |
| `apps/web/components/kyc/KycProviderFlow.tsx` | react component | web/kyc | UI component |
| `apps/web/components/kyc/KycUpload.test.tsx` | react component | web/kyc | UI component |
| `apps/web/components/kyc/KycUpload.tsx` | react component | web/kyc | UI component |
| `apps/web/components/kyc/SelfieCamera.test.tsx` | react component | web/kyc | UI component |
| `apps/web/components/kyc/SelfieCamera.tsx` | react component | web/kyc | UI component |
| `apps/web/components/layouts/AdminLayout.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/AuthLayout.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/Footer.tsx` | react component | web/layouts | UI component — security-sensitive |
| `apps/web/components/layouts/GuestLayout.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/Header.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/HostLayout.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/NavVisibility.test.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/RoleAwareLayout.tsx` | react component | web/layouts | UI component |
| `apps/web/components/layouts/index.ts` | react component | web/layouts | UI component |
| `apps/web/components/listings/AmenitiesSection.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/CollapsibleText.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ContactHostButton.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/DescriptionSection.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/FavoriteButton.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/Gallery.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/HostOtherListingsSection.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ListingCard.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ListingCardSkeleton.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ListingDetailSkeleton.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ListingForm.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ListingMap.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/LocationPicker.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/PhotoUpload.test.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/PhotoUpload.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/ReviewsSection.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/SimilarListingsSection.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/TrustSection.tsx` | react component | web/listings | UI component |
| `apps/web/components/listings/VerifiedBadge.tsx` | react component | web/listings | UI component |
| `apps/web/components/payments/ProofUpload.tsx` | react component | web/payments | UI component |
| `apps/web/components/profile/AboutSection.tsx` | react component | web/profile | UI component |
| `apps/web/components/profile/Avatar.tsx` | react component | web/profile | UI component |
| `apps/web/components/profile/PasswordSection.tsx` | react component | web/profile | UI component |
| `apps/web/components/profile/PersonalInfoEditor.tsx` | react component | web/profile | UI component |
| `apps/web/components/providers.tsx` | react component | web/providers.tsx | UI component |
| `apps/web/components/search/CategoryChips.tsx` | react component | web/search | UI component |
| `apps/web/components/search/FeaturedListings.tsx` | react component | web/search | UI component |
| `apps/web/components/search/FeesIncludedNotice.test.tsx` | react component | web/search | UI component |
| `apps/web/components/search/FeesIncludedNotice.tsx` | react component | web/search | UI component |
| `apps/web/components/search/LandingSearchForm.tsx` | react component | web/search | UI component |
| `apps/web/components/search/PopularDestinations.tsx` | react component | web/search | UI component |
| `apps/web/components/search/PriceRangeFilter.tsx` | react component | web/search | UI component |
| `apps/web/components/search/RecentlyViewed.tsx` | react component | web/search | UI component |
| `apps/web/components/search/SearchBar.tsx` | react component | web/search | UI component |
| `apps/web/components/search/SearchMap.tsx` | react component | web/search | UI component |
| `apps/web/components/search/TrustSignals.tsx` | react component | web/search | UI component |
| `apps/web/components/support/SupportPageClient.tsx` | react component | web/support | UI component |
| `apps/web/components/ui/EmptyState.tsx` | react component | web/ui | UI component |
| `apps/web/components/ui/ErrorBoundary.tsx` | react component | web/ui | UI component |
| `apps/web/components/ui/ErrorState.tsx` | react component | web/ui | UI component |
| `apps/web/components/ui/RatingBadge.tsx` | react component | web/ui | UI component |
| `apps/web/components/ui/Skeleton.tsx` | react component | web/ui | UI component |
| `apps/web/e2e/mobile/viewport.spec.ts` | web source | web/mobile | supporting code |
| `apps/web/e2e/smoke/health.spec.ts` | web source | web/smoke | supporting code |
| `apps/web/e2e/transaction/flow.spec.ts` | web source | web/transaction | supporting code |
| `apps/web/e2e/web/search.spec.ts` | web source | web/web | supporting code |
| `apps/web/i18n.ts` | web source | web/i18n.ts | supporting code |
| `apps/web/lib/api-types.ts` | web library | web/api-types.ts | shared client logic |
| `apps/web/lib/api.test.ts` | web library | web/api.test.ts | shared client logic |
| `apps/web/lib/api.ts` | web library | web/api.ts | shared client logic |
| `apps/web/lib/auth/context.test.tsx` | web library | web/auth | shared client logic — security-sensitive |
| `apps/web/lib/auth/context.tsx` | web library | web/auth | shared client logic — security-sensitive |
| `apps/web/lib/auth/firebase.ts` | web library | web/auth | shared client logic — security-sensitive |
| `apps/web/lib/auth/storage.ts` | web library | web/auth | shared client logic — security-sensitive |
| `apps/web/lib/auth/types.ts` | web library | web/auth | shared client logic — security-sensitive |
| `apps/web/lib/auth/useAuth.ts` | web library | web/auth | shared client logic — security-sensitive |
| `apps/web/lib/cmsPublic.ts` | web library | web/cmsPublic.ts | shared client logic |
| `apps/web/lib/help/articles-guest.ts` | web library | web/help | shared client logic |
| `apps/web/lib/help/articles-host.ts` | web library | web/help | shared client logic |
| `apps/web/lib/help/catalog.test.ts` | web library | web/help | shared client logic |
| `apps/web/lib/help/catalog.ts` | web library | web/help | shared client logic |
| `apps/web/lib/help/index.ts` | web library | web/help | shared client logic |
| `apps/web/lib/hosting/guideTopics.ts` | web library | web/hosting | shared client logic |
| `apps/web/lib/queries/account.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/admin.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/availability.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/avatar.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/bookings.test.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/bookings.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/calendar.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/cms.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/coHosts.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/discovery.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/disputes.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/favorites.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/hostEarnings.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/hostListings.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/hostProfile.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/hostToday.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/import.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/kyc.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/listings.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/locations.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/messages.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/notifications.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/payments.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/photos.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/reports.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/reviews.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/settings.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/queries/staff.ts` | web library | web/queries | shared client logic |
| `apps/web/lib/utils.ts` | web library | web/utils.ts | shared client logic |
| `apps/web/middleware.ts` | web source | web/middleware.ts | supporting code |
| `apps/web/next-env.d.ts` | web source | web/next-env.d.ts | supporting code |
| `apps/web/playwright.config.ts` | web source | web/playwright.config.ts | supporting code |
| `apps/web/tailwind.config.ts` | web source | web/tailwind.config.ts | supporting code |
| `apps/web/types/google-maps.d.ts` | web source | web/google-maps.d.ts | supporting code |
| `apps/web/vitest.config.ts` | web source | web/vitest.config.ts | supporting code |
| `apps/web/vitest.setup.ts` | web source | web/vitest.setup.ts | supporting code |
| `apps/mobile/src/components/CancelBookingModal.tsx` | mobile component | mobile/CancelBookingModal.tsx | shared mobile code |
| `apps/mobile/src/components/DateRangeCalendar.tsx` | mobile component | mobile/DateRangeCalendar.tsx | shared mobile code |
| `apps/mobile/src/components/LeaveReviewModal.tsx` | mobile component | mobile/LeaveReviewModal.tsx | shared mobile code |
| `apps/mobile/src/components/ListingCard.tsx` | mobile component | mobile/ListingCard.tsx | shared mobile code |
| `apps/mobile/src/components/ListingRail.tsx` | mobile component | mobile/ListingRail.tsx | shared mobile code |
| `apps/mobile/src/components/RatingBadge.tsx` | mobile component | mobile/RatingBadge.tsx | shared mobile code |
| `apps/mobile/src/components/ReviewsList.tsx` | mobile component | mobile/ReviewsList.tsx | shared mobile code |
| `apps/mobile/src/components/States.tsx` | mobile component | mobile/States.tsx | shared mobile code |
| `apps/mobile/src/lib/LocaleContext.tsx` | mobile library | mobile/LocaleContext.tsx | shared mobile code |
| `apps/mobile/src/lib/akedlyShield.ts` | mobile library | mobile/akedlyShield.ts | shared mobile code — security-sensitive |
| `apps/mobile/src/lib/api.ts` | mobile library | mobile/api.ts | shared mobile code — security-sensitive |
| `apps/mobile/src/lib/hooks.ts` | mobile library | mobile/hooks.ts | shared mobile code |
| `apps/mobile/src/lib/i18n.ts` | mobile library | mobile/i18n.ts | shared mobile code |
| `apps/mobile/src/lib/push.ts` | mobile library | mobile/push.ts | shared mobile code — security-sensitive |
| `apps/mobile/src/lib/recentlyViewed.ts` | mobile library | mobile/recentlyViewed.ts | shared mobile code |
| `apps/mobile/src/lib/theme.ts` | mobile library | mobile/theme.ts | shared mobile code |
| `apps/mobile/src/lib/types.ts` | mobile library | mobile/types.ts | shared mobile code |
| `apps/mobile/src/screens/AccountScreen.tsx` | mobile screen | mobile/AccountScreen.tsx | screen |
| `apps/mobile/src/screens/BookingScreen.tsx` | mobile screen | mobile/BookingScreen.tsx | screen |
| `apps/mobile/src/screens/FavoritesScreen.tsx` | mobile screen | mobile/FavoritesScreen.tsx | screen |
| `apps/mobile/src/screens/HomeScreen.tsx` | mobile screen | mobile/HomeScreen.tsx | screen |
| `apps/mobile/src/screens/HostProfileScreen.tsx` | mobile screen | mobile/HostProfileScreen.tsx | screen |
| `apps/mobile/src/screens/InboxScreen.tsx` | mobile screen | mobile/InboxScreen.tsx | screen |
| `apps/mobile/src/screens/KycScreen.tsx` | mobile screen | mobile/KycScreen.tsx | screen |
| `apps/mobile/src/screens/ListingDetailScreen.tsx` | mobile screen | mobile/ListingDetailScreen.tsx | screen |
| `apps/mobile/src/screens/LoginScreen.tsx` | mobile screen | mobile/LoginScreen.tsx | screen |
| `apps/mobile/src/screens/MessageScreen.tsx` | mobile screen | mobile/MessageScreen.tsx | screen |
| `apps/mobile/src/screens/PaymentScreen.tsx` | mobile screen | mobile/PaymentScreen.tsx | screen |
| `apps/mobile/src/screens/PaymentsScreen.tsx` | mobile screen | mobile/PaymentsScreen.tsx | screen |
| `apps/mobile/src/screens/SearchScreen.tsx` | mobile screen | mobile/SearchScreen.tsx | screen |
| `apps/mobile/src/screens/SupportScreen.tsx` | mobile screen | mobile/SupportScreen.tsx | screen |
| `apps/mobile/src/screens/TripDetailScreen.tsx` | mobile screen | mobile/TripDetailScreen.tsx | screen |
| `apps/mobile/src/screens/TripsScreen.tsx` | mobile screen | mobile/TripsScreen.tsx | screen |
| `apps/mobile/src/screens/host/HostCalendarScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostCreateListingScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostEarningsScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostListingAvailabilityScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostListingCoHostsScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostListingDetailScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostListingEditorScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostListingPhotosScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostListingsScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostProfileScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostReservationDetailScreen.tsx` | mobile screen | mobile/host | screen |
| `apps/mobile/src/screens/host/HostTodayScreen.tsx` | mobile screen | mobile/host | screen |