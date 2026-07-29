import re
from typing import Any

_DEFAULT_TEMPLATES: dict[str, dict[str, dict[str, dict[str, str]]]] = {
    "reservation.created": {
        "ar": {
            "email": {
                "subject": "تم استلام طلب حجزك",
                "body": "مرحبًا {{guest_name}}، تم استلام حجزك {{reservation_id}} بانتظار الدفع.",
            },
            "whatsapp": {
                "body": "مرحبًا {{guest_name}}، تم استلام حجزك {{reservation_id}} بانتظار الدفع.",
            },
            "sms": {
                "body": "تم استلام حجزك {{reservation_id}}. أكمل الدفع لتأكيده.",
            },
        },
        "en": {
            "email": {
                "subject": "Your booking request received",
                "body": "Hi {{guest_name}}, your booking {{reservation_id}} is pending payment.",
            },
            "whatsapp": {
                "body": "Hi {{guest_name}}, your booking {{reservation_id}} is pending payment.",
            },
            "sms": {
                "body": "Booking {{reservation_id}} received. Complete payment to confirm.",
            },
        },
    },
    "reservation.confirmed": {
        "ar": {
            "email": {
                "subject": "تم تأكيد حجزك",
                "body": "مرحبًا {{guest_name}}، تم تأكيد حجزك {{reservation_id}}.",
            },
            "whatsapp": {
                "body": "مرحبًا {{guest_name}}، تم تأكيد حجزك {{reservation_id}}.",
            },
            "sms": {
                "body": "تم تأكيد حجزك {{reservation_id}}.",
            },
        },
        "en": {
            "email": {
                "subject": "Your booking is confirmed",
                "body": "Hi {{guest_name}}, your booking {{reservation_id}} is confirmed.",
            },
            "whatsapp": {
                "body": "Hi {{guest_name}}, your booking {{reservation_id}} is confirmed.",
            },
            "sms": {
                "body": "Booking {{reservation_id}} confirmed.",
            },
        },
    },
    "payment.failed": {
        "ar": {
            "email": {
                "subject": "فشلت عملية الدفع",
                "body": "عذرًا {{guest_name}}، فشلت عملية الدفع للحجز {{reservation_id}}. يرجى المحاولة مرة أخرى.",
            },
            "whatsapp": {
                "body": "عذرًا {{guest_name}}، فشلت عملية الدفع للحجز {{reservation_id}}.",
            },
            "sms": {
                "body": "فشلت عملية الدفع للحجز {{reservation_id}}.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment failed",
                "body": "Sorry {{guest_name}}, payment for booking {{reservation_id}} failed. Please retry.",
            },
            "whatsapp": {
                "body": "Sorry {{guest_name}}, payment for booking {{reservation_id}} failed.",
            },
            "sms": {
                "body": "Payment for booking {{reservation_id}} failed.",
            },
        },
    },
    "booking.checked_in": {
        "ar": {
            "sms": {
                "body": "تم تسجيل الدخول للحجز {{reservation_id}}. نتمنى لك إقامة سعيدة.",
            },
        },
        "en": {
            "sms": {
                "body": "Checked in for booking {{reservation_id}}. Enjoy your stay.",
            },
        },
    },
    "booking.checked_out": {
        "ar": {
            "sms": {
                "body": "تم تسجيل الخروج للحجز {{reservation_id}}. نأمل أن تكون إقامتك ممتازة.",
            },
        },
        "en": {
            "sms": {
                "body": "Checked out for booking {{reservation_id}}. We hope you enjoyed your stay.",
            },
        },
    },
    "booking.cancelled": {
        "ar": {
            "email": {
                "subject": "تم إلغاء الحجز",
                "body": "تم إلغاء الحجز {{reservation_id}}. سيتم معالجة استرداد الأموال خلال {{refund_days}} أيام عمل.",
            },
            "whatsapp": {
                "body": "تم إلغاء الحجز {{reservation_id}}. سيتم معالجة استرداد الأموال خلال {{refund_days}} أيام عمل.",
            },
            "sms": {
                "body": "تم إلغاء الحجز {{reservation_id}}.",
            },
        },
        "en": {
            "email": {
                "subject": "Booking cancelled",
                "body": "Booking {{reservation_id}} cancelled. Refund will be processed within {{refund_days}} business days.",
            },
            "whatsapp": {
                "body": "Booking {{reservation_id}} cancelled. Refund will be processed within {{refund_days}} business days.",
            },
            "sms": {
                "body": "Booking {{reservation_id}} cancelled.",
            },
        },
    },
}


def _fallback_locale(locale: str) -> str:
    return locale if locale in ("ar", "en") else "ar"


def render_template(
    event_type: str, channel: str, locale: str, payload: dict[str, Any]
) -> tuple[str | None, str]:
    locale = _fallback_locale(locale)
    event_templates = _DEFAULT_TEMPLATES.get(event_type, {})
    channel_templates = event_templates.get(locale, {}).get(channel, {})
    if not channel_templates:
        # Fall back to English if locale/channel missing
        channel_templates = event_templates.get("en", {}).get(channel, {})
    if not channel_templates:
        raise ValueError(f"No template found for {event_type}/{channel}/{locale}")

    subject = channel_templates.get("subject")
    body = channel_templates.get("body", "")

    def _replace(match: re.Match[str]) -> str:
        key = match.group(1).strip()
        value = payload.get(key, "")
        return str(value)

    rendered_subject = re.sub(r"\{\{(.*?)\}\}", _replace, subject) if subject else None
    rendered_body = re.sub(r"\{\{(.*?)\}\}", _replace, body)
    return rendered_subject, rendered_body
