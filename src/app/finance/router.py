import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import dependencies as auth_dependencies
from app.auth.models import User
from app.config import settings
from app.database import get_session
from app.reservations import services as reservations_services
from app.shared import redis as redis_state
from app.shared.exceptions import (
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    StayOSError,
    ValidationError,
    to_http_exception,
)

from . import providers
from . import repository as finance_repository
from . import services as finance_services
from .constants import PaymentProvider
from .schemas import (
    EscrowListResponse,
    LedgerListResponse,
    PayoutListResponse,
    PayoutProcessRequest,
    PayoutRequestCreate,
    PayoutRequestResponse,
    WalletResponse,
    WebhookResponse,
)

router = APIRouter(prefix="/finance", tags=["finance"])
logger = logging.getLogger(__name__)


async def _acquire_webhook_idempotency(key: str) -> bool:
    client = redis_state.redis_client
    if client is None:
        # In production Redis must be available; tests may leave it mocked.
        return True
    result = await client.set(f"finance_webhook:{key}", "1", nx=True, ex=86400 * 7)
    return bool(result)


@router.get("/wallets/me", response_model=WalletResponse)
async def get_my_wallet(
    user: User = Depends(auth_dependencies.get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WalletResponse:
    try:
        wallet = await finance_repository.get_or_create_wallet(
            session, "host", user.id
        )
        return WalletResponse.model_validate(wallet)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/wallets/{wallet_id}/ledger", response_model=LedgerListResponse)
async def list_wallet_ledger(
    wallet_id: str,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("admin", "host")),
    session: AsyncSession = Depends(get_session),
) -> LedgerListResponse:
    try:
        wallet = await finance_repository.get_wallet_by_id(session, wallet_id)
        if wallet is None:
            raise NotFoundError("Wallet not found")
        if user.role == "host" and wallet.owner_id != user.id:
            raise AuthorizationError("Not authorized to view this wallet")
        entries = await finance_repository.list_ledger_entries(
            session, wallet_id=wallet_id, limit=limit, offset=offset
        )
        return LedgerListResponse(data=entries)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/escrow", response_model=EscrowListResponse)
async def list_escrows(
    host_id: str | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("admin", "host")),
    session: AsyncSession = Depends(get_session),
) -> EscrowListResponse:
    try:
        if user.role == "host":
            host_id = user.id
        escrows = await finance_repository.list_escrows(
            session, host_id=host_id, status=status, limit=limit, offset=offset
        )
        return EscrowListResponse(data=escrows)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/escrow/{escrow_id}")
async def get_escrow(
    escrow_id: str,
    user: User = Depends(auth_dependencies.require_role("admin", "host")),
    session: AsyncSession = Depends(get_session),
) -> Any:
    try:
        escrow = await finance_repository.get_escrow_by_id(session, escrow_id)
        if escrow is None:
            raise NotFoundError("Escrow not found")
        if user.role == "host" and escrow.host_id != user.id:
            raise AuthorizationError("Not authorized to view this escrow")
        return escrow
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/escrow/{escrow_id}/release")
async def release_escrow_endpoint(
    escrow_id: str,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> Any:
    try:
        escrow = await finance_services.manual_release_escrow(session, escrow_id)
        return escrow
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/escrow/{escrow_id}/hold")
async def hold_escrow_endpoint(
    escrow_id: str,
    hold_hours: int = 24,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> Any:
    try:
        escrow = await finance_services.manual_hold_escrow(
            session, escrow_id, hold_hours
        )
        return escrow
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/payouts", response_model=PayoutRequestResponse)
async def create_payout_request(
    request: PayoutRequestCreate,
    user: User = Depends(auth_dependencies.require_role("host")),
    session: AsyncSession = Depends(get_session),
) -> PayoutRequestResponse:
    try:
        wallet = await finance_repository.get_or_create_wallet(
            session, "host", user.id
        )
        payout = await finance_services.request_payout(
            session,
            host_id=user.id,
            wallet_id=wallet.id,
            amount_egp=request.amount_egp,
            bank_account_info=request.bank_account_info,
        )
        return PayoutRequestResponse.model_validate(payout)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.get("/payouts", response_model=PayoutListResponse)
async def list_payouts(
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(auth_dependencies.require_role("admin", "host")),
    session: AsyncSession = Depends(get_session),
) -> PayoutListResponse:
    try:
        host_id = user.id if user.role == "host" else None
        payouts = await finance_repository.list_payout_requests(
            session, host_id=host_id, status=status, limit=limit, offset=offset
        )
        return PayoutListResponse(data=payouts)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/payouts/{payout_id}/process", response_model=PayoutRequestResponse)
async def process_payout_endpoint(
    payout_id: str,
    request: PayoutProcessRequest,
    user: User = Depends(auth_dependencies.require_role("admin")),
    session: AsyncSession = Depends(get_session),
) -> PayoutRequestResponse:
    try:
        payout = await finance_services.process_payout(
            session, payout_id, request.provider
        )
        return PayoutRequestResponse.model_validate(payout)
    except StayOSError as exc:
        raise to_http_exception(exc) from exc


@router.post("/webhooks/paymob", response_model=WebhookResponse)
async def paymob_webhook(
    request: Request,  # type: ignore[type-arg]
    session: AsyncSession = Depends(get_session),
) -> WebhookResponse:
    body = await request.body()
    payload = json.loads(body)
    signature = request.headers.get("x-paymob-hmac") or request.headers.get(
        "x-paymob-signature"
    )

    if not providers.verify_paymob_hmac(payload, signature):
        logger.warning("Invalid Paymob webhook signature")
        raise to_http_exception(AuthenticationError("Invalid Paymob signature"))

    reservation_id = providers.extract_paymob_reservation_id(payload)
    provider_ref = providers.extract_paymob_provider_ref(payload)
    if not reservation_id or not provider_ref:
        logger.warning("Paymob webhook missing reservation or provider reference")
        raise to_http_exception(ValidationError("Missing reservation or provider reference"))

    idempotency_key = provider_ref
    if not await _acquire_webhook_idempotency(f"paymob:{idempotency_key}"):
        logger.info("Duplicate Paymob webhook ignored: %s", provider_ref)
        return WebhookResponse(message="already processed")

    payment_status = providers.extract_paymob_status(payload)
    amount = providers.extract_paymob_amount(payload)
    logger.info(
        "Paymob webhook: reservation=%s provider_ref=%s status=%s amount=%s",
        reservation_id,
        provider_ref,
        payment_status,
        amount,
    )

    if payment_status not in ("true", "True", True, "success", "successful"):
        await reservations_services.fail_reservation_by_provider(
            session,
            reservation_id,
            provider_ref,
            failure_reason=f"paymob_status:{payment_status}",
        )
        return WebhookResponse(message="failed")

    try:
        await reservations_services.confirm_reservation_by_provider(
            session,
            reservation_id,
            PaymentProvider.PAYMOB.value,
            provider_ref,
            provider_metadata={"raw_payload": payload, "amount_egp": amount},
        )
    except NotFoundError:
        logger.warning("Reservation not found for Paymob webhook: %s", reservation_id)
        return WebhookResponse(message="not found")
    except ValidationError as exc:
        logger.warning("Paymob webhook validation error: %s", exc)
        return WebhookResponse(message="ignored")
    except StayOSError as exc:
        logger.exception("Paymob webhook confirmation failed")
        raise to_http_exception(exc) from exc

    return WebhookResponse(message="processed")


@router.post("/webhooks/stripe", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,  # type: ignore[type-arg]
    session: AsyncSession = Depends(get_session),
) -> WebhookResponse:
    body = await request.body()
    signature = request.headers.get("stripe-signature")

    if not providers.verify_stripe_signature(
        body, signature, settings.STRIPE_WEBHOOK_SECRET
    ):
        logger.warning("Invalid Stripe webhook signature")
        raise to_http_exception(AuthenticationError("Invalid Stripe signature"))

    payload = json.loads(body)
    event_type = payload.get("type")
    event_id = payload.get("id")
    logger.info("Stripe webhook: type=%s event_id=%s", event_type, event_id)

    if event_id and not await _acquire_webhook_idempotency(f"stripe:{event_id}"):
        logger.info("Duplicate Stripe webhook ignored: %s", event_id)
        return WebhookResponse(message="already processed")

    reservation_id = providers.extract_stripe_reservation_id(payload)
    provider_ref = providers.extract_stripe_provider_ref(payload)
    if not reservation_id or not provider_ref:
        logger.warning("Stripe webhook missing reservation or provider reference")
        raise to_http_exception(ValidationError("Missing reservation or provider reference"))

    if event_type == "payment_intent.succeeded":
        status = providers.extract_stripe_status(payload)
        try:
            await reservations_services.confirm_reservation_by_provider(
                session,
                reservation_id,
                PaymentProvider.STRIPE.value,
                provider_ref,
                provider_metadata={"raw_payload": payload, "status": status},
            )
        except NotFoundError:
            logger.warning("Reservation not found for Stripe webhook: %s", reservation_id)
            return WebhookResponse(message="not found")
        except ValidationError as exc:
            logger.warning("Stripe webhook validation error: %s", exc)
            return WebhookResponse(message="ignored")
        except StayOSError as exc:
            logger.exception("Stripe webhook confirmation failed")
            raise to_http_exception(exc) from exc
    elif event_type in ("payment_intent.payment_failed", "payment_intent.canceled"):
        failure = (
            payload.get("data", {}).get("object", {}).get("last_payment_error", {}).get("message")
            or str(event_type)
        )
        await reservations_services.fail_reservation_by_provider(
            session,
            reservation_id,
            provider_ref,
            failure_reason=failure,
        )
        return WebhookResponse(message="failed")

    return WebhookResponse(message="processed")
