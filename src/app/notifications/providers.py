import asyncio
from typing import Any, cast

import boto3
import httpx

from app.config import settings

_MAX_RETRIES = 3
_BACKOFF_SECONDS = 2


class NotificationError(Exception):
    pass


async def _post_with_retry(
    url: str, payload: dict[str, Any], headers: dict[str, str]
) -> dict[str, Any]:
    for attempt in range(_MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return cast(dict[str, Any], response.json())
        except (httpx.TimeoutException, httpx.HTTPError) as exc:
            if attempt == _MAX_RETRIES - 1:
                raise NotificationError(f"Notification request failed: {exc}") from exc
            await asyncio.sleep(_BACKOFF_SECONDS**attempt)
    raise NotificationError("Notification request exhausted retries")


async def send_whatsapp(
    recipient: str,
    body: str,
    locale: str = "ar",
    subject: str | None = None,
) -> dict[str, Any]:
    if settings.ENVIRONMENT == "test":
        return {"status": "sent", "channel": "whatsapp", "recipient": recipient}

    if not settings.META_WHATSAPP_TOKEN or not settings.META_PHONE_NUMBER_ID:
        raise NotificationError("WhatsApp provider is not configured")

    url = (
        f"https://graph.facebook.com/v18.0/{settings.META_PHONE_NUMBER_ID}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "text",
        "text": {"body": body, "preview_url": False},
    }
    headers = {"Authorization": f"Bearer {settings.META_WHATSAPP_TOKEN}"}
    return await _post_with_retry(url, payload, headers)


async def send_email(
    recipient: str, subject: str, body: str, _locale: str = "ar"
) -> dict[str, Any]:
    if settings.ENVIRONMENT == "test":
        return {"status": "sent", "channel": "email", "recipient": recipient}

    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        raise NotificationError("Email provider is not configured")

    region = settings.AWS_REGION or "us-east-1"
    client = boto3.client(
        "sesv2",
        region_name=region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
    try:
        response = await asyncio.to_thread(
            client.send_email,
            FromEmailAddress=settings.SES_FROM_EMAIL,
            Destination={"ToAddresses": [recipient]},
            Content={
                "Simple": {
                    "Subject": {"Data": subject, "Charset": "UTF-8"},
                    "Body": {"Text": {"Data": body, "Charset": "UTF-8"}},
                }
            },
        )
    except Exception as exc:
        raise NotificationError(f"SES send failed: {exc}") from exc
    return {
        "status": "sent",
        "channel": "email",
        "recipient": recipient,
        "id": response.get("MessageId", ""),
    }


async def send_sms(
    recipient: str,
    body: str,
    _locale: str = "ar",
    subject: str | None = None,
) -> dict[str, Any]:
    if settings.ENVIRONMENT == "test":
        return {"status": "sent", "channel": "sms", "recipient": recipient}

    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        raise NotificationError("SMS provider is not configured")
    if not settings.TWILIO_SMS_FROM:
        raise NotificationError("SMS sender is not configured")

    url = (
        f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    )
    payload = {
        "To": recipient,
        "From": settings.TWILIO_SMS_FROM,
        "Body": body,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    return await _post_with_retry(url, payload, headers)


async def send_push(
    recipient: str,
    body: str,
    _locale: str = "ar",
    subject: str | None = None,
) -> dict[str, Any]:
    """Send an Expo push notification to a registered device token.

    ``recipient`` is the Expo push token stored on the notification row
    (one row per device). Expo's push API accepts unauthenticated sends;
    ``EXPO_ACCESS_TOKEN`` hardens delivery once configured.
    """
    if settings.ENVIRONMENT == "test":
        return {"status": "sent", "channel": "push", "recipient": recipient}

    url = "https://exp.host/--/api/v2/push/send"
    payload: dict[str, Any] = {
        "to": recipient,
        "title": subject or "StayOS",
        "body": body,
        "sound": "default",
    }
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if settings.EXPO_ACCESS_TOKEN:
        headers["Authorization"] = f"Bearer {settings.EXPO_ACCESS_TOKEN}"
    return await _post_with_retry(url, payload, headers)
