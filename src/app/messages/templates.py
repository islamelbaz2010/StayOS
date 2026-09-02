import re
from typing import Any

_HOST_QUICK_REPLIES: dict[str, dict[str, dict[str, Any]]] = {
    "ar": {
        "welcome": {
            "name": "ترحيب",
            "body": "مرحبًا {{guest_name}}، أهلاً بك في {{property_name}}! نتمنى لك إقامة ممتعة.",
            "variables": ["guest_name", "property_name"],
        },
        "check_in_instructions": {
            "name": "تعليمات تسجيل الدخول",
            "body": "مرحبًا {{guest_name}}، تفضل تعليمات تسجيل الدخول: {{instructions}}.",
            "variables": ["guest_name", "instructions"],
        },
        "directions": {
            "name": "الاتجاهات",
            "body": "العنوان: {{address}}. الإحداثيات: {{lat}},{{lng}}.",
            "variables": ["address", "lat", "lng"],
        },
        "wifi": {
            "name": "واي فاي",
            "body": "اسم الشبكة: {{wifi_name}} | كلمة المرور: {{wifi_password}}.",
            "variables": ["wifi_name", "wifi_password"],
        },
        "checkout_reminder": {
            "name": "تذكير تسجيل الخروج",
            "body": "مرحبًا {{guest_name}}، تذكير بموعد تسجيل الخروج في {{checkout_time}}.",
            "variables": ["guest_name", "checkout_time"],
        },
        "thank_you": {
            "name": "شكر",
            "body": "شكراً لاختيارك {{property_name}}، نتطلع لاستقبالك مرة أخرى.",
            "variables": ["property_name"],
        },
    },
    "en": {
        "welcome": {
            "name": "Welcome",
            "body": "Hi {{guest_name}}, welcome to {{property_name}}! We hope you enjoy your stay.",
            "variables": ["guest_name", "property_name"],
        },
        "check_in_instructions": {
            "name": "Check-in instructions",
            "body": "Hi {{guest_name}}, here are your check-in instructions: {{instructions}}.",
            "variables": ["guest_name", "instructions"],
        },
        "directions": {
            "name": "Directions",
            "body": "Address: {{address}}. Coordinates: {{lat}},{{lng}}.",
            "variables": ["address", "lat", "lng"],
        },
        "wifi": {
            "name": "Wi-Fi",
            "body": "Network: {{wifi_name}} | Password: {{wifi_password}}.",
            "variables": ["wifi_name", "wifi_password"],
        },
        "checkout_reminder": {
            "name": "Checkout reminder",
            "body": "Hi {{guest_name}}, reminder that checkout is at {{checkout_time}}.",
            "variables": ["guest_name", "checkout_time"],
        },
        "thank_you": {
            "name": "Thank you",
            "body": "Thank you for choosing {{property_name}}, we look forward to hosting you again.",
            "variables": ["property_name"],
        },
    },
}

_AUTOMATED_TEMPLATES: dict[str, dict[str, dict[str, Any]]] = {
    "ar": {
        "booking_confirmed": {
            "body": "تم تأكيد حجزك في {{property_name}}. تاريخ الوصول {{check_in}} والمغادرة {{check_out}}.",
            "variables": ["property_name", "check_in", "check_out"],
        },
        "pre_arrival": {
            "body": "مرحبًا {{guest_name}}، سيصلك غدًا إلى {{property_name}}. تعليمات الدخول متاحة في التطبيق.",
            "variables": ["guest_name", "property_name"],
        },
        "check_in_reminder": {
            "body": "مرحبًا {{guest_name}}، اليوم موعد تسجيل الدخول إلى {{property_name}}. وقت الدخول المتوقع {{check_in_time}}.",
            "variables": ["guest_name", "property_name", "check_in_time"],
        },
        "checkout_reminder": {
            "body": "مرحبًا {{guest_name}}، تذكير بتسجيل الخروج غدًا من {{property_name}}. وقت الخروج المتوقع {{check_out_time}}.",
            "variables": ["guest_name", "property_name", "check_out_time"],
        },
        "review_reminder": {
            "body": "شكرًا لإقامتك في {{property_name}}. نرجو مشاركة تجربتك بتقييم الحجز.",
            "variables": ["property_name"],
        },
    },
    "en": {
        "booking_confirmed": {
            "body": "Your booking at {{property_name}} is confirmed. Check-in {{check_in}}, checkout {{check_out}}.",
            "variables": ["property_name", "check_in", "check_out"],
        },
        "pre_arrival": {
            "body": "Hi {{guest_name}}, you are arriving tomorrow at {{property_name}}. Check-in instructions are available in the app.",
            "variables": ["guest_name", "property_name"],
        },
        "check_in_reminder": {
            "body": "Hi {{guest_name}}, today is your check-in day at {{property_name}}. Expected check-in time is {{check_in_time}}.",
            "variables": ["guest_name", "property_name", "check_in_time"],
        },
        "checkout_reminder": {
            "body": "Hi {{guest_name}}, reminder to check out tomorrow from {{property_name}}. Expected checkout time is {{check_out_time}}.",
            "variables": ["guest_name", "property_name", "check_out_time"],
        },
        "review_reminder": {
            "body": "Thanks for staying at {{property_name}}. Please share your experience by leaving a review.",
            "variables": ["property_name"],
        },
    },
}


def _fallback_locale(locale: str) -> str:
    return locale if locale in ("ar", "en") else "ar"


def _render(template: str, variables: dict[str, Any]) -> str:
    def _replace(match: re.Match[str]) -> str:
        key = match.group(1).strip()
        value = variables.get(key, "")
        return str(value)

    return re.sub(r"\{\{(.*?)\}\}", _replace, template)


def render_quick_reply(key: str, locale: str, variables: dict[str, Any]) -> str:
    locale = _fallback_locale(locale)
    template = _HOST_QUICK_REPLIES.get(locale, {}).get(key, {})
    if not template:
        raise ValueError(f"Unknown quick reply template: {key}")
    return _render(template["body"], variables)


def render_automated(template_key: str, locale: str, variables: dict[str, Any]) -> str:
    locale = _fallback_locale(locale)
    template = _AUTOMATED_TEMPLATES.get(locale, {}).get(template_key, {})
    if not template:
        raise ValueError(f"Unknown automated template: {template_key}")
    return _render(template["body"], variables)


def list_quick_reply_templates(locale: str = "ar") -> list[dict[str, Any]]:
    locale = _fallback_locale(locale)
    return [
        {"key": key, "name": data["name"], "variables": data["variables"]}
        for key, data in _HOST_QUICK_REPLIES.get(locale, {}).items()
    ]
