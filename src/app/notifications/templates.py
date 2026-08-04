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
    "payment.required": {
        "ar": {
            "email": {
                "subject": "تعليمات الدفع لحجزك",
                "body": "مرحبًا {{guest_name}}، تم قبول حجزك {{reservation_id}}. المبلغ المطلوب: {{amount_egp}} ج.م. رقم المرجع: {{reference_number}}. يرجى تحويل المبلغ ورفع إيصال الدفع لتأكيد الحجز.",
            },
            "whatsapp": {
                "body": "مرحبًا {{guest_name}}، تم قبض حجزك {{reservation_id}}. المبلغ: {{amount_egp}} ج.م. المرجع: {{reference_number}}. يرجى الدفع ورفع الإيصال.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment instructions for your booking",
                "body": "Hi {{guest_name}}, your booking {{reservation_id}} has been accepted. Amount due: {{amount_egp}} EGP. Reference: {{reference_number}}. Please transfer the amount and upload your receipt to confirm your booking.",
            },
            "whatsapp": {
                "body": "Hi {{guest_name}}, booking {{reservation_id}} accepted. Amount: {{amount_egp}} EGP. Ref: {{reference_number}}. Please pay and upload receipt.",
            },
        },
    },
    "payment.proof_uploaded": {
        "ar": {
            "email": {
                "subject": "تم استلام إيصال الدفع",
                "body": "مرحبًا {{guest_name}}، تم استلام إيصال الدفع لحجزك. سيتم مراجعته خلال 24 ساعة.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment receipt received",
                "body": "Hi {{guest_name}}, your payment receipt has been received and will be reviewed within 24 hours.",
            },
        },
    },
    "payment.verified": {
        "ar": {
            "email": {
                "subject": "تم تأكيد الدفع",
                "body": "مرحبًا {{guest_name}}، تم تأكيد دفعك بنجاح. حجزك {{reservation_id}} أصبح مؤكدًا.",
            },
            "sms": {
                "body": "تم تأكيد الدفع لحجزك {{reservation_id}}. حجزك مؤكد.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment confirmed",
                "body": "Hi {{guest_name}}, your payment has been verified. Your booking {{reservation_id}} is now confirmed.",
            },
            "sms": {
                "body": "Payment confirmed for booking {{reservation_id}}. Your booking is confirmed.",
            },
        },
    },
    "payment.rejected": {
        "ar": {
            "email": {
                "subject": "تعذّر التحقق من الدفع",
                "body": "عذرًا {{guest_name}}، تعذّر التحقق من إيصال الدفع لحجزك {{reservation_id}}. السبب: {{reject_reason}}. يرجى رفع إيصال جديد.",
            },
            "whatsapp": {
                "body": "عذرًا {{guest_name}}، تعذّر التحقق من الدفع للحجز {{reservation_id}}. يرجى رفع إيصال جديد.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment verification failed",
                "body": "Sorry {{guest_name}}, your payment receipt for booking {{reservation_id}} could not be verified. Reason: {{reject_reason}}. Please upload a new receipt.",
            },
            "whatsapp": {
                "body": "Sorry {{guest_name}}, payment for booking {{reservation_id}} could not be verified. Please upload a new receipt.",
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
    "owner.outreach": {
        "ar": {
            "whatsapp": {
                "body": "مرحبًا، وجدنا عقارك وأضفناه إلى StayOS مجانًا. لن يتم نشره حتى توافق. للمراجعة والتواصل: {{link}}",
            },
            "sms": {
                "body": "تمت إضافة عقارك إلى StayOS. للمراجعة: {{link}}",
            },
        },
        "en": {
            "whatsapp": {
                "body": "Hello, we found your property and added it to StayOS for free. Nothing will be published until you approve. Review and contact us: {{link}}",
            },
            "sms": {
                "body": "Your property was added to StayOS. Review: {{link}}",
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
