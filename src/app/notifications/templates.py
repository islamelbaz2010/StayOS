import re
from typing import Any

_DEFAULT_TEMPLATES: dict[str, dict[str, dict[str, dict[str, str]]]] = {
    "reservation.created": {
        "ar": {
            "email": {
                "subject": "تم استلام طلب حجزك",
                "body": "مرحبًا {{guest_name}}، تم استلام حجزك في {{listing_title}} بانتظار الدفع.",
            },
            "whatsapp": {
                "body": "مرحبًا {{guest_name}}، تم استلام حجزك في {{listing_title}} بانتظار الدفع.",
            },
            "sms": {
                "body": "تم استلام حجزك في {{listing_title}}. أكمل الدفع لتأكيده.",
            },
        },
        "en": {
            "email": {
                "subject": "Your booking request received",
                "body": "Hi {{guest_name}}, your booking at {{listing_title}} is pending payment.",
            },
            "whatsapp": {
                "body": "Hi {{guest_name}}, your booking at {{listing_title}} is pending payment.",
            },
            "sms": {
                "body": "Your booking at {{listing_title}} was received. Complete payment to confirm.",
            },
        },
    },
    "reservation.confirmed": {
        "ar": {
            "email": {
                "subject": "تم تأكيد حجزك",
                "body": "مرحبًا {{guest_name}}، تم تأكيد حجزك في {{listing_title}}.",
            },
            "whatsapp": {
                "body": "مرحبًا {{guest_name}}، تم تأكيد حجزك في {{listing_title}}.",
            },
            "sms": {
                "body": "تم تأكيد حجزك في {{listing_title}}.",
            },
        },
        "en": {
            "email": {
                "subject": "Your booking is confirmed",
                "body": "Hi {{guest_name}}, your booking at {{listing_title}} is confirmed.",
            },
            "whatsapp": {
                "body": "Hi {{guest_name}}, your booking at {{listing_title}} is confirmed.",
            },
            "sms": {
                "body": "Your booking at {{listing_title}} is confirmed.",
            },
        },
    },
    "payment.failed": {
        "ar": {
            "email": {
                "subject": "فشلت عملية الدفع",
                "body": "عذرًا {{guest_name}}، فشلت عملية الدفع لحجزك في {{listing_title}}. يرجى المحاولة مرة أخرى.",
            },
            "whatsapp": {
                "body": "عذرًا {{guest_name}}، فشلت عملية الدفع لحجزك في {{listing_title}}.",
            },
            "sms": {
                "body": "فشلت عملية الدفع لحجزك في {{listing_title}}.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment failed",
                "body": "Sorry {{guest_name}}, payment for your booking at {{listing_title}} failed. Please retry.",
            },
            "whatsapp": {
                "body": "Sorry {{guest_name}}, payment for your booking at {{listing_title}} failed.",
            },
            "sms": {
                "body": "Payment for your booking at {{listing_title}} failed.",
            },
        },
    },
    "payment.required": {
        "ar": {
            "email": {
                "subject": "تعليمات الدفع لحجزك",
                "body": "مرحبًا {{guest_name}}، تم قبول حجزك في {{listing_title}}. المبلغ المطلوب: {{amount_egp}} ج.م. رقم المرجع: {{reference_number}}. يرجى تحويل المبلغ ورفع إيصال الدفع لتأكيد الحجز.",
            },
            "whatsapp": {
                "body": "مرحبًا {{guest_name}}، تم قبض حجزك في {{listing_title}}. المبلغ: {{amount_egp}} ج.م. المرجع: {{reference_number}}. يرجى الدفع ورفع الإيصال.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment instructions for your booking",
                "body": "Hi {{guest_name}}, your booking at {{listing_title}} has been accepted. Amount due: {{amount_egp}} EGP. Reference: {{reference_number}}. Please transfer the amount and upload your receipt to confirm your booking.",
            },
            "whatsapp": {
                "body": "Hi {{guest_name}}, your booking at {{listing_title}} was accepted. Amount: {{amount_egp}} EGP. Ref: {{reference_number}}. Please pay and upload receipt.",
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
                "body": "مرحبًا {{guest_name}}، تم تأكيد دفعك بنجاح. حجزك في {{listing_title}} أصبح مؤكدًا.",
            },
            "sms": {
                "body": "تم تأكيد الدفع لحجزك في {{listing_title}}. حجزك مؤكد.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment confirmed",
                "body": "Hi {{guest_name}}, your payment has been verified. Your booking {{listing_title}} is now confirmed.",
            },
            "sms": {
                "body": "Payment confirmed for your booking at {{listing_title}}. Your booking is confirmed.",
            },
        },
    },
    "payment.rejected": {
        "ar": {
            "email": {
                "subject": "تعذّر التحقق من الدفع",
                "body": "عذرًا {{guest_name}}، تعذّر التحقق من إيصال الدفع لحجزك في {{listing_title}}. السبب: {{reject_reason}}. يرجى رفع إيصال جديد.",
            },
            "whatsapp": {
                "body": "عذرًا {{guest_name}}، تعذّر التحقق من الدفع لحجزك في {{listing_title}}. يرجى رفع إيصال جديد.",
            },
        },
        "en": {
            "email": {
                "subject": "Payment verification failed",
                "body": "Sorry {{guest_name}}, your payment receipt for your booking at {{listing_title}} could not be verified. Reason: {{reject_reason}}. Please upload a new receipt.",
            },
            "whatsapp": {
                "body": "Sorry {{guest_name}}, payment for your booking at {{listing_title}} could not be verified. Please upload a new receipt.",
            },
        },
    },
    "booking.checked_in": {
        "ar": {
            "sms": {
                "body": "تم تسجيل الدخول لحجزك في {{listing_title}}. نتمنى لك إقامة سعيدة.",
            },
        },
        "en": {
            "sms": {
                "body": "Checked in for your stay at {{listing_title}}. Enjoy your stay.",
            },
        },
    },
    "booking.checked_out": {
        "ar": {
            "sms": {
                "body": "تم تسجيل الخروج لحجزك في {{listing_title}}. نأمل أن تكون إقامتك ممتازة.",
            },
        },
        "en": {
            "sms": {
                "body": "Checked out from {{listing_title}}. We hope you enjoyed your stay.",
            },
        },
    },
    "booking.cancelled": {
        "ar": {
            "email": {
                "subject": "تم إلغاء الحجز",
                "body": "تم إلغاء حجزك في {{listing_title}}. سيتم معالجة استرداد الأموال خلال {{refund_days}} أيام عمل.",
            },
            "whatsapp": {
                "body": "تم إلغاء حجزك في {{listing_title}}. سيتم معالجة استرداد الأموال خلال {{refund_days}} أيام عمل.",
            },
            "sms": {
                "body": "تم إلغاء حجزك في {{listing_title}}.",
            },
        },
        "en": {
            "email": {
                "subject": "Booking cancelled",
                "body": "Your booking at {{listing_title}} was cancelled. Refund will be processed within {{refund_days}} business days.",
            },
            "whatsapp": {
                "body": "Your booking at {{listing_title}} was cancelled. Refund will be processed within {{refund_days}} business days.",
            },
            "sms": {
                "body": "Your booking at {{listing_title}} was cancelled.",
            },
        },
    },
    "booking.no_show": {
        "ar": {
            "email": {
                "subject": "تسجيل عدم حضور",
                "body": "تم تسجيل عدم حضور لحجزك في {{listing_title}}. وفقًا لسياسة الإلغاء، لا يحق استرداد مبلغ الإقامة أو رسوم الخدمة.",
            },
            "sms": {
                "body": "تم تسجيل عدم حضور لحجزك في {{listing_title}}.",
            },
        },
        "en": {
            "email": {
                "subject": "No-show recorded",
                "body": "A no-show was recorded for your booking at {{listing_title}}. Per the cancellation policy, the accommodation amount and service fee are not refundable.",
            },
            "sms": {
                "body": "A no-show was recorded for your booking at {{listing_title}}.",
            },
        },
    },
    "message.received": {
        "ar": {
            "email": {
                "subject": "رسالة جديدة",
                "body": "لديك رسالة جديدة من {{sender_name}} بخصوص إقامتك في {{listing_title}}.",
            },
        },
        "en": {
            "email": {
                "subject": "New message",
                "body": "You have a new message from {{sender_name}} regarding your stay at {{listing_title}}.",
            },
        },
    },
    "listing.approved": {
        "ar": {
            "email": {
                "subject": "تمت الموافقة على إعلانك",
                "body": "مرحبًا {{host_name}}، تمت الموافقة على إعلانك «{{listing_title}}» وأصبح منشورًا الآن.",
            },
        },
        "en": {
            "email": {
                "subject": "Your listing is approved",
                "body": "Hi {{host_name}}, your listing \"{{listing_title}}\" has been approved and is now live.",
            },
        },
    },
    "listing.rejected": {
        "ar": {
            "email": {
                "subject": "إعلانك يحتاج إلى تعديلات",
                "body": "مرحبًا {{host_name}}، لم تتم الموافقة على إعلانك «{{listing_title}}». السبب: {{reason}}. يمكنك تعديل الإعلان وإعادة إرساله للمراجعة.",
            },
        },
        "en": {
            "email": {
                "subject": "Your listing needs changes",
                "body": "Hi {{host_name}}, your listing \"{{listing_title}}\" was not approved. Reason: {{reason}}. You can edit it and resubmit for review.",
            },
        },
    },
    "listing.edit_approved": {
        "ar": {
            "email": {
                "subject": "تمت الموافقة على تعديلات إعلانك",
                "body": "مرحبًا {{host_name}}، تمت الموافقة على التعديلات المطلوبة على إعلانك «{{listing_title}}» وأصبحت سارية الآن.",
            },
        },
        "en": {
            "email": {
                "subject": "Your listing changes were approved",
                "body": "Hi {{host_name}}, the changes you submitted for \"{{listing_title}}\" were approved and are now live.",
            },
        },
    },
    "listing.edit_rejected": {
        "ar": {
            "email": {
                "subject": "لم تتم الموافقة على تعديلات إعلانك",
                "body": "مرحبًا {{host_name}}، لم تتم الموافقة على التعديلات المطلوبة على إعلانك «{{listing_title}}». السبب: {{reason}}. النسخة المنشورة الحالية لا تزال سارية.",
            },
        },
        "en": {
            "email": {
                "subject": "Your listing changes were not approved",
                "body": "Hi {{host_name}}, the changes you submitted for \"{{listing_title}}\" were not approved. Reason: {{reason}}. Your current published version stays live.",
            },
        },
    },
    "booking.created": {
        "ar": {
            "email": {
                "subject": "طلب حجز جديد",
                "body": "مرحبًا {{host_name}}، لديك حجز جديد في «{{listing_title}}» من {{check_in}} إلى {{check_out}}.",
            },
        },
        "en": {
            "email": {
                "subject": "New booking request",
                "body": "Hi {{host_name}}, you have a new booking at \"{{listing_title}}\" from {{check_in}} to {{check_out}}.",
            },
        },
    },
    "booking.payment_confirmed": {
        "ar": {
            "email": {
                "subject": "تم تأكيد دفع الحجز",
                "body": "مرحبًا {{host_name}}، تم تأكيد دفع الحجز في «{{listing_title}}». الحجز مؤكد الآن.",
            },
        },
        "en": {
            "email": {
                "subject": "Booking payment confirmed",
                "body": "Hi {{host_name}}, payment for the booking at \"{{listing_title}}\" is confirmed. The booking is now confirmed.",
            },
        },
    },
    "offer.created": {
        "ar": {
            "email": {
                "subject": "عرض خاص على إقامتك",
                "body": "مرحبًا {{guest_name}}، أرسل لك المضيف عرضًا خاصًا لـ«{{listing_title}}» بقيمة {{total_price_egp}} ج.م. يمكنك مراجعته من الرسائل.",
            },
        },
        "en": {
            "email": {
                "subject": "A special offer for your stay",
                "body": "Hi {{guest_name}}, your host sent you a special offer for \"{{listing_title}}\" at {{total_price_egp}} EGP. Review it in your messages.",
            },
        },
    },
    "dispute.opened": {
        "ar": {
            "email": {
                "subject": "بلاغ جديد بخصوص حجز",
                "body": "تم فتح بلاغ بخصوص الحجز في «{{listing_title}}». فريق الدعم يراجع التفاصيل.",
            },
        },
        "en": {
            "email": {
                "subject": "A dispute was opened",
                "body": "A dispute was opened regarding the booking at \"{{listing_title}}\". Our support team is reviewing the details.",
            },
        },
    },
    "dispute.status_changed": {
        "ar": {
            "email": {
                "subject": "تحديث حالة البلاغ",
                "body": "تم تحديث حالة البلاغ الخاص بالحجز في «{{listing_title}}» إلى «{{new_status}}».",
            },
        },
        "en": {
            "email": {
                "subject": "Dispute status update",
                "body": "The dispute for the booking at \"{{listing_title}}\" was updated to \"{{new_status}}\".",
            },
        },
    },
    "payment.refunded": {
        "ar": {
            "email": {
                "subject": "تم رد مبلغ الدفع",
                "body": "مرحبًا {{guest_name}}، تم رد مبلغ {{refund_amount_egp}} ج.م. للحجز في «{{listing_title}}».",
            },
        },
        "en": {
            "email": {
                "subject": "Your payment was refunded",
                "body": "Hi {{guest_name}}, {{refund_amount_egp}} EGP was refunded for your booking at \"{{listing_title}}\".",
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
