#!/usr/bin/env python3
"""Seed the CMS-Lite marketing pages (idempotent).

Creates and publishes the standard marketing page set — about,
how-it-works, for-guests, for-hosts, faq, support — with real product
content in English and Arabic. Existing pages (matched by slug) are
skipped so the script is safe to re-run; marketing edits are never
overwritten.

Usage:
    DATABASE_URL=postgresql+asyncpg://... python scripts/seed_cms_pages.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))  # noqa: E402
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../src"))  # noqa: E402

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.auth.models import User  # noqa: E402
from app.cms import repository as cms_repository  # noqa: E402
from app.cms import services as cms_services  # noqa: E402
from app.cms.schemas import (  # noqa: E402
    BlockCreateRequest,
    PageCreateRequest,
)

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://ahmed@localhost:5432/stayos",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def _resolve_seed_user(session: AsyncSession) -> User:
    """Audit fields (updated_by/published_by) FK to auth.users — the seed
    must run as a real admin account rather than a phantom id."""
    from sqlalchemy import select

    result = await session.execute(
        select(User).where(User.role == "admin").limit(1)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise SystemExit(
            "No admin user found — create one before seeding CMS pages."
        )
    return user


def L(en: str, ar: str) -> dict:
    return {"en": {"text": en}, "ar": {"text": ar}}


PAGES: dict[str, dict] = {
    "about": {
        "title_en": "About StayOS",
        "title_ar": "عن StayOS",
        "seo": {
            "en": {
                "title": "About StayOS",
                "description": "StayOS is an Egyptian accommodation marketplace connecting guests with verified local hosts.",
            },
            "ar": {
                "title": "عن StayOS",
                "description": "StayOS سوق مصري للإقامات يربط الضيوف بمضيفين محليين موثّقين.",
            },
        },
        "blocks": [
            ("hero", {"en": {"heading": "StayOS", "subheading": "Book unique stays across Egypt with verified local hosts — one transparent price, paid securely online."},
                      "ar": {"heading": "StayOS", "subheading": "احجز إقامات مميزة في أنحاء مصر مع مضيفين محليين موثّقين — سعر واحد شفاف يُدفع بأمان عبر الإنترنت."}}),
            ("heading_text", {"en": {"heading": "What we do", "body": "StayOS is an Egyptian accommodation marketplace. Guests discover and book stays — from city apartments to Red Sea escapes — and pay StayOS directly. Hosts list their spaces, manage availability and pricing, and get paid after check-in."},
                              "ar": {"heading": "ماذا نفعل", "body": "StayOS سوق مصري للإقامات. يكتشف الضيوف ويحجزون إقامات — من شقق المدينة إلى إقامات البحر الأحمر — ويدفعون لـ StayOS مباشرة. يعرض المضيفون مساحاتهم ويديرون التوافر والأسعار ويتقاضون مستحقاتهم بعد تسجيل الوصول."}}),
        ],
    },
    "how-it-works": {
        "title_en": "How StayOS works",
        "title_ar": "كيف يعمل StayOS",
        "seo": {
            "en": {"title": "How StayOS works", "description": "Search, book, pay online, and stay — how StayOS works for guests and hosts."},
            "ar": {"title": "كيف يعمل StayOS", "description": "ابحث واحجز وادفع عبر الإنترنت وأقم — كيف يعمل StayOS للضيوف والمضيفين."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "How StayOS works", "subheading": "From search to check-in — a simple, secure flow for guests and hosts."},
                      "ar": {"heading": "كيف يعمل StayOS", "subheading": "من البحث إلى تسجيل الوصول — تجربة بسيطة وآمنة للضيوف والمضيفين."}}),
            ("feature_cards", {"en": {"heading": "For guests", "cards": [
                {"title": "Search and book", "body": "Find stays by location, dates, and guests. Request to book or use Instant Book where available."},
                {"title": "Pay securely", "body": "Pay StayOS online by card — one all-inclusive price in EGP. Your payment is held until check-in."},
                {"title": "Stay and review", "body": "Check in, message your host anytime, and share a review after your stay."},
            ]}, "ar": {"heading": "للضيوف", "cards": [
                {"title": "ابحث واحجز", "body": "اعثر على إقامات حسب الموقع والتواريخ وعدد الضيوف. اطلب الحجز أو استخدم الحجز الفوري حيثما توفر."},
                {"title": "ادفع بأمان", "body": "ادفع لـ StayOS عبر الإنترنت بالبطاقة — سعر واحد شامل بالجنيه المصري. تُحفظ أموالك حتى تسجيل الوصول."},
                {"title": "أقم وقيّم", "body": "سجّل الوصول وراسل مضيفك في أي وقت وشارك تقييمك بعد إقامتك."},
            ]}}),
            ("feature_cards", {"en": {"heading": "For hosts", "cards": [
                {"title": "List your space", "body": "Create a listing with photos, availability, and pricing. Our team reviews every listing before it goes live."},
                {"title": "Manage bookings", "body": "Accept requests, set discounts, and message guests — all from your host dashboard."},
                {"title": "Get paid", "body": "Your earnings become payable 24 hours after the guest checks in, then are paid out to you."},
            ]}, "ar": {"heading": "للمضيفين", "cards": [
                {"title": "اعرض مساحتك", "body": "أنشئ إعلانًا بالصور والتوافر والأسعار. يراجع فريقنا كل إعلان قبل نشره."},
                {"title": "أدر الحجوزات", "body": "اقبل الطلبات وحدد الخصومات وراسل الضيوف — كل ذلك من لوحة تحكم المضيف."},
                {"title": "تقاضَ مستحقاتك", "body": "تصبح أرباحك مستحقة بعد ٢٤ ساعة من تسجيل وصول الضيف ثم تُدفع إليك."},
            ]}}),
        ],
    },
    "for-guests": {
        "title_en": "StayOS for guests",
        "title_ar": "StayOS للضيوف",
        "seo": {
            "en": {"title": "StayOS for guests", "description": "Find and book unique stays in Egypt — transparent prices, secure online payment."},
            "ar": {"title": "StayOS للضيوف", "description": "اعثر على إقامات مميزة في مصر واحجزها — أسعار شفافة ودفع آمن عبر الإنترنت."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "Find your next stay", "subheading": "Verified local hosts, transparent all-inclusive prices, and secure online payment.", "cta_label": "Search stays", "cta_href": "/en/search"},
                      "ar": {"heading": "اعثر على إقامتك القادمة", "subheading": "مضيفون محليون موثّقون وأسعار شاملة شفافة ودفع آمن عبر الإنترنت.", "cta_label": "ابحث عن إقامة", "cta_href": "/ar/search"}}),
            ("feature_cards", {"en": {"heading": "Why book on StayOS", "cards": [
                {"title": "One clear price", "body": "The price you see is the price you pay — all-inclusive, in EGP."},
                {"title": "Protected payment", "body": "You pay StayOS, not the host. Funds are held until after check-in."},
                {"title": "Real support", "body": "Message hosts directly and reach StayOS support when you need help."},
            ]}, "ar": {"heading": "لماذا تحجز على StayOS", "cards": [
                {"title": "سعر واحد واضح", "body": "السعر الذي تراه هو ما تدفعه — شامل كل شيء بالجنيه المصري."},
                {"title": "دفع محمي", "body": "تدفع لـ StayOS وليس للمضيف. تُحفظ الأموال حتى ما بعد تسجيل الوصول."},
                {"title": "دعم حقيقي", "body": "راسل المضيفين مباشرة وتواصل مع دعم StayOS عند الحاجة."},
            ]}}),
        ],
    },
    "for-hosts": {
        "title_en": "StayOS for hosts",
        "title_ar": "StayOS للمضيفين",
        "seo": {
            "en": {"title": "StayOS for hosts", "description": "List your space on StayOS — reach guests across Egypt and get paid after check-in."},
            "ar": {"title": "StayOS للمضيفين", "description": "اعرض مساحتك على StayOS — تواصل مع ضيوف من أنحاء مصر وتقاضَ مستحقاتك بعد تسجيل الوصول."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "Host on StayOS", "subheading": "List your space, set your prices, and welcome guests — with tools built for Egyptian hosts.", "cta_label": "Become a host", "cta_href": "/en/kyc"},
                      "ar": {"heading": "استضف على StayOS", "subheading": "اعرض مساحتك وحدد أسعارك ورحّب بالضيوف — بأدوات مصممة للمضيفين المصريين.", "cta_label": "كن مضيفًا", "cta_href": "/ar/kyc"}}),
            ("feature_cards", {"en": {"heading": "Hosting on StayOS", "cards": [
                {"title": "You're in control", "body": "Set your nightly price, discounts, availability, and house rules."},
                {"title": "Transparent earnings", "body": "Track every booking and your net earnings in the host dashboard."},
                {"title": "Paid after check-in", "body": "Earnings become payable 24 hours after each guest checks in."},
            ]}, "ar": {"heading": "الاستضافة على StayOS", "cards": [
                {"title": "أنت المتحكم", "body": "حدد سعر الليلة والخصومات والتوافر وقواعد الإقامة."},
                {"title": "أرباح شفافة", "body": "تتبع كل حجز وصافي أرباحك في لوحة تحكم المضيف."},
                {"title": "الدفع بعد الوصول", "body": "تصبح المستحقات قابلة للدفع بعد ٢٤ ساعة من تسجيل وصول كل ضيف."},
            ]}}),
        ],
    },
    "faq": {
        "title_en": "Frequently asked questions",
        "title_ar": "الأسئلة الشائعة",
        "seo": {
            "en": {"title": "FAQ", "description": "Common questions about booking, payment, cancellation, and hosting on StayOS."},
            "ar": {"title": "الأسئلة الشائعة", "description": "أسئلة شائعة عن الحجز والدفع والإلغاء والاستضافة على StayOS."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "Frequently asked questions"}, "ar": {"heading": "الأسئلة الشائعة"}}),
            ("faq", {"en": {"items": [
                {"question": "How do I pay for a booking?", "answer": "You pay StayOS online by card through our secure checkout. Bank transfer is also available as an alternative on the checkout page."},
                {"question": "Is the price I see the final price?", "answer": "Yes. Prices on StayOS are all-inclusive — the total you see at checkout is what you pay, in Egyptian pounds."},
                {"question": "When does the host get paid?", "answer": "Host earnings become payable 24 hours after you check in, once the stay is underway."},
                {"question": "Can I cancel a booking?", "answer": "Yes — open your trip and use the cancellation option. The refund amount depends on the listing's cancellation policy shown before you confirm."},
                {"question": "How do I become a host?", "answer": "Choose Become a host, complete identity verification, and create your first listing. Our team reviews listings before they go live."},
            ]}, "ar": {"items": [
                {"question": "كيف أدفع للحجز؟", "answer": "تدفع لـ StayOS عبر الإنترنت بالبطاقة من خلال صفحة الدفع الآمنة. التحويل البنكي متاح أيضًا كخيار بديل في صفحة الدفع."},
                {"question": "هل السعر الذي أراه هو السعر النهائي؟", "answer": "نعم. الأسعار على StayOS شاملة — الإجمالي الذي تراه عند الدفع هو ما تدفعه بالجنيه المصري."},
                {"question": "متى يتقاضى المضيف مستحقاته؟", "answer": "تصبح مستحقات المضيف قابلة للدفع بعد ٢٤ ساعة من تسجيل وصولك، بعد بدء الإقامة."},
                {"question": "هل يمكنني إلغاء الحجز؟", "answer": "نعم — افتح رحلتك واستخدم خيار الإلغاء. يعتمد مبلغ الاسترداد على سياسة الإلغاء الخاصة بالإعلان والمعروضة قبل التأكيد."},
                {"question": "كيف أصبح مضيفًا؟", "answer": "اختر كن مضيفًا وأكمل التحقق من الهوية ثم أنشئ أول إعلان لك. يراجع فريقنا الإعلانات قبل نشرها."},
            ]}}),
        ],
    },
    "support": {
        "title_en": "Support",
        "title_ar": "الدعم",
        "seo": {
            "en": {"title": "Support", "description": "Get help with bookings, payments, and your StayOS account."},
            "ar": {"title": "الدعم", "description": "احصل على مساعدة بشأن الحجوزات والمدفوعات وحسابك على StayOS."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "How can we help?", "subheading": "Find answers below or reach the StayOS team."},
                      "ar": {"heading": "كيف يمكننا المساعدة؟", "subheading": "اعثر على إجابات أدناه أو تواصل مع فريق StayOS."}}),
            ("faq", {"en": {"items": [
                {"question": "Where is my booking?", "answer": "Open Trips from your account to see every booking, its status, and your payment."},
                {"question": "How do I message my host?", "answer": "Each booking has a conversation — open Messages from the navigation to chat with your host."},
                {"question": "What if my payment fails?", "answer": "You can retry from the checkout page — by card or by bank transfer. A failed card attempt never cancels your booking."},
            ]}, "ar": {"items": [
                {"question": "أين حجزي؟", "answer": "افتح رحلاتي من حسابك لعرض كل حجز وحالته ودفعتك."},
                {"question": "كيف أراسل مضيفي؟", "answer": "لكل حجز محادثة — افتح الرسائل من شريط التنقل للتحدث مع مضيفك."},
                {"question": "ماذا لو فشل دفعي؟", "answer": "يمكنك إعادة المحاولة من صفحة الدفع — بالبطاقة أو بالتحويل البنكي. محاولة البطاقة الفاشلة لا تلغي حجزك أبدًا."},
            ]}}),
            ("cta", {"en": {"heading": "Still need help?", "cta_label": "Browse the Help Center", "cta_href": "/en/help"},
                     "ar": {"heading": "ما زلت بحاجة إلى مساعدة؟", "cta_label": "تصفح مركز المساعدة", "cta_href": "/ar/help"}}),
        ],
    },
    "help": {
        "title_en": "Help Center",
        "title_ar": "مركز المساعدة",
        "seo": {
            "en": {"title": "Help Center", "description": "Answers for guests and hosts — booking, payment, cancellations, earnings, and account help."},
            "ar": {"title": "مركز المساعدة", "description": "إجابات للضيوف والمضيفين — الحجز والدفع والإلغاء والأرباح ومساعدة الحساب."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "Help Center", "subheading": "Answers for guests and hosts."},
                      "ar": {"heading": "مركز المساعدة", "subheading": "إجابات للضيوف والمضيفين."}}),
            ("heading_text", {"en": {"heading": "For guests"},
                              "ar": {"heading": "للضيوف"}}),
            ("faq", {"en": {"items": [
                {"question": "How do I book a stay?", "answer": "Search by destination, dates, and guests, then open a listing and choose Request to book or Instant Book. Instant Book confirms immediately; requests are confirmed when the host accepts."},
                {"question": "How do I pay?", "answer": "Pay StayOS online by card through secure checkout, or by bank transfer via the alternative option shown on the checkout page. The price is all-inclusive — the total you see is what you pay."},
                {"question": "How do I cancel a booking?", "answer": "Open your trip and use the cancellation option. The refund depends on the cancellation policy shown on the listing before you confirmed."},
                {"question": "When do I get my refund?", "answer": "Approved refunds are processed back to your original payment method. Bank processing times vary — typically several business days."},
                {"question": "Where are my trips?", "answer": "Open Trips from your account menu to see upcoming and past bookings, statuses, and payment details."},
                {"question": "How does check-in work?", "answer": "Your host sends check-in instructions through the booking conversation — check Messages before your arrival date."},
                {"question": "How does check-out work?", "answer": "Follow the check-out time and any instructions your host shared in Messages, then leave a review after your stay."},
                {"question": "What if something is wrong with the listing?", "answer": "Message your host first — most issues are resolved quickly. If not, report a problem from your booking and StayOS support will step in."},
                {"question": "What if I have an issue with my host?", "answer": "Use Report a problem on the booking to open a dispute. StayOS support reviews the case and both sides can share evidence."},
                {"question": "How do I report a problem?", "answer": "Open the booking and choose Report a problem, or reach support from the Support page. Include photos or screenshots when possible."},
                {"question": "Is it safe to book on StayOS?", "answer": "Payments stay on-platform and are held until after check-in. Never pay or communicate off-platform — that removes your protection."},
                {"question": "I can't log in to my account.", "answer": "Use Forgot password on the sign-in page to reset it. If you signed up with Google or Apple, use the same provider to log in."},
            ]}, "ar": {"items": [
                {"question": "كيف أحجز إقامة؟", "answer": "ابحث بالوجهة والتواريخ وعدد الضيوف ثم افتح الإعلان واختر اطلب الحجز أو الحجز الفوري. الحجز الفوري يؤكد فورًا؛ والطلبات تُؤكد عند قبول المضيف."},
                {"question": "كيف أدفع؟", "answer": "ادفع لـ StayOS عبر الإنترنت بالبطاقة من خلال الدفع الآمن، أو بالتحويل البنكي عبر الخيار البديل في صفحة الدفع. السعر شامل — الإجمالي الذي تراه هو ما تدفعه."},
                {"question": "كيف ألغي حجزًا؟", "answer": "افتح رحلتك واستخدم خيار الإلغاء. يعتمد الاسترداد على سياسة الإلغاء المعروضة على الإعلان قبل التأكيد."},
                {"question": "متى أسترد أموالي؟", "answer": "تُعالج الاستردادات المعتمدة إلى وسيلة الدفع الأصلية. تختلف مدد المعالجة البنكية — عادة عدة أيام عمل."},
                {"question": "أين رحلاتي؟", "answer": "افتح رحلاتي من قائمة حسابك لعرض الحجوزات القادمة والسابقة وحالاتها وتفاصيل الدفع."},
                {"question": "كيف يتم تسجيل الوصول؟", "answer": "يرسل مضيفك تعليمات تسجيل الوصول عبر محادثة الحجز — راجع الرسائل قبل تاريخ وصولك."},
                {"question": "كيف يتم تسجيل المغادرة؟", "answer": "اتبع وقت المغادرة وأي تعليمات شاركها مضيفك في الرسائل، ثم اترك تقييمًا بعد إقامتك."},
                {"question": "ماذا لو كان هناك خطأ في الإعلان؟", "answer": "راسل مضيفك أولًا — تُحل معظم المشكلات بسرعة. إن لم تُحل، أبلغ عن مشكلة من حجزك وسيتدخل دعم StayOS."},
                {"question": "ماذا لو واجهت مشكلة مع مضيفي؟", "answer": "استخدم الإبلاغ عن مشكلة في الحجز لفتح نزاع. يراجع دعم StayOS الحالة ويمكن للطرفين مشاركة الأدلة."},
                {"question": "كيف أبلغ عن مشكلة؟", "answer": "افتح الحجز واختر الإبلاغ عن مشكلة، أو تواصل مع الدعم من صفحة الدعم. أرفق صورًا أو لقطات شاشة عند الإمكان."},
                {"question": "هل الحجز على StayOS آمن؟", "answer": "تبقى المدفوعات داخل المنصة وتُحفظ حتى ما بعد تسجيل الوصول. لا تدفع أو تتواصل خارج المنصة أبدًا — ذلك يلغي حمايتك."},
                {"question": "لا أستطيع تسجيل الدخول إلى حسابي.", "answer": "استخدم نسيت كلمة المرور في صفحة الدخول لإعادة تعيينها. إذا سجلت بـ Google أو Apple فاستخدم نفس المزود للدخول."},
            ]}}),
            ("heading_text", {"en": {"heading": "For hosts"},
                              "ar": {"heading": "للمضيفين"}}),
            ("faq", {"en": {"items": [
                {"question": "How do I start hosting?", "answer": "Choose Become a host, complete identity verification (KYC), and create your first listing. Our team reviews every listing before it goes live."},
                {"question": "How do I set up my listing?", "answer": "Add accurate photos, a truthful description, house rules, amenities, and your location, then set your nightly price and availability."},
                {"question": "How does listing review work?", "answer": "New listings go to Pending Review. Edits to a live listing also require review — you see Changes Pending Review with the requested values until the team approves or rejects them."},
                {"question": "What is Instant Book?", "answer": "Instant Book confirms eligible guest bookings immediately without a manual accept. Live listings have it enabled — keep your calendar and pricing accurate."},
                {"question": "How do I set pricing?", "answer": "Set a nightly base price plus cleaning fee, weekly and monthly discounts, and seasonal or availability rules. Price changes on a live listing go to review before applying."},
                {"question": "How do promotions work?", "answer": "Weekly and monthly discounts apply automatically to qualifying stay lengths. Listing-level discounts attract longer stays."},
                {"question": "How do I track earnings?", "answer": "The host dashboard shows every booking, its gross amount, and your net earnings."},
                {"question": "When and how do I get paid?", "answer": "Earnings become payable 24 hours after check-in. Set your payout method (bank or wallet) in your host profile so payouts can be released."},
                {"question": "What if a guest has an issue or damages something?", "answer": "Message the guest first. If unresolved, use Report a problem on the booking to open a dispute with evidence."},
                {"question": "What happens when a guest cancels?", "answer": "The cancellation policy on your listing applies automatically. You see the outcome on the booking and your earnings."},
                {"question": "How do reviews work?", "answer": "Guests review after checkout. Accurate listings and responsive communication drive better ratings."},
                {"question": "Why do I need KYC?", "answer": "Identity verification protects guests and the marketplace and is required before hosting and receiving payouts."},
                {"question": "How do I manage my account settings?", "answer": "Profile, security, notifications, language, and payout preferences live in your account settings."},
            ]}, "ar": {"items": [
                {"question": "كيف أبدأ الاستضافة؟", "answer": "اختر كن مضيفًا وأكمل التحقق من الهوية ثم أنشئ أول إعلان لك. يراجع فريقنا كل إعلان قبل نشره."},
                {"question": "كيف أجهز إعلاني؟", "answer": "أضف صورًا دقيقة ووصفًا صادقًا وقواعد الإقامة والمرافق وموقعك، ثم حدد سعر الليلة والتوافر."},
                {"question": "كيف تعمل مراجعة الإعلان؟", "answer": "تنتقل الإعلانات الجديدة إلى قيد المراجعة. تعديلات الإعلان المنشور تتطلب مراجعة أيضًا — ترى تغييرات قيد المراجعة بالقيم المطلوبة حتى يوافق الفريق أو يرفضها."},
                {"question": "ما هو الحجز الفوري؟", "answer": "يؤكد الحجز الفوري حجوزات الضيوف المؤهلة فورًا دون قبول يدوي. الإعلانات المنشورة مفعّلة له — حافظ على دقة التقويم والأسعار."},
                {"question": "كيف أحدد الأسعار؟", "answer": "حدد سعر الليلة الأساسي ورسوم التنظيف وخصومات الأسبوع والشهر وقواعد المواسم والتوافر. تغييرات السعر على إعلان منشور تذهب للمراجعة قبل التطبيق."},
                {"question": "كيف تعمل العروض الترويجية؟", "answer": "تُطبق خصومات الأسبوع والشهر تلقائيًا على مدد الإقامة المؤهلة. خصومات الإعلان تجذب الإقامات الأطول."},
                {"question": "كيف أتتبع أرباحي؟", "answer": "يعرض لوحة تحكم المضيف كل حجز وإجمالي مبلغه وصافي أرباحك."},
                {"question": "متى وكيف أتقاضى مستحقاتي؟", "answer": "تصبح المستحقات قابلة للدفع بعد ٢٤ ساعة من تسجيل الوصول. حدد وسيلة الدفع (بنك أو محفظة) في ملف المضيف لتُصرف الدفعات."},
                {"question": "ماذا لو واجه الضيف مشكلة أو تسبب في ضرر؟", "answer": "راسل الضيف أولًا. إن لم تُحل، استخدم الإبلاغ عن مشكلة في الحجز لفتح نزاع مع الأدلة."},
                {"question": "ماذا يحدث عند إلغاء الضيف؟", "answer": "تُطبق سياسة الإلغاء على إعلانك تلقائيًا. ترى النتيجة في الحجز وأرباحك."},
                {"question": "كيف تعمل التقييمات؟", "answer": "يقيّم الضيوف بعد المغادرة. الإعلانات الدقيقة والتواصل السريع يحققان تقييمات أفضل."},
                {"question": "لماذا أحتاج التحقق من الهوية؟", "answer": "يحمي التحقق من الهوية الضيوف والسوق وهو مطلوب قبل الاستضافة واستلام الدفعات."},
                {"question": "كيف أدير إعدادات حسابي؟", "answer": "الملف الشخصي والأمان والإشعارات واللغة وتفضيلات الدفع موجودة في إعدادات حسابك."},
            ]}}),
            ("cta", {"en": {"heading": "Still need help?", "cta_label": "Contact support", "cta_href": "/en/support"},
                     "ar": {"heading": "ما زلت بحاجة إلى مساعدة؟", "cta_label": "تواصل مع الدعم", "cta_href": "/ar/support"}}),
        ],
    },
    "host-standards": {
        "title_en": "Host responsibilities",
        "title_ar": "مسؤوليات المضيف",
        "seo": {
            "en": {"title": "Host responsibilities", "description": "What StayOS expects of hosts — accuracy, availability, communication, payouts, and conduct."},
            "ar": {"title": "مسؤوليات المضيف", "description": "ما يتوقعه StayOS من المضيفين — الدقة والتوافر والتواصل والدفعات والسلوك."},
        },
        "blocks": [
            ("hero", {"en": {"heading": "Host responsibilities", "subheading": "What hosting on StayOS means — the operational standards every host agrees to follow."},
                      "ar": {"heading": "مسؤوليات المضيف", "subheading": "معنى الاستضافة على StayOS — المعايير التشغيلية التي يلتزم بها كل مضيف."}}),
            ("banner", {"en": {"text": "This is a product summary of host obligations, not legal advice. The binding Host Terms are pending legal counsel review."},
                        "ar": {"text": "هذا ملخص منتجي لالتزامات المضيف وليس استشارة قانونية. شروط المضيف الملزمة قيد مراجعة المستشار القانوني."}}),
            ("feature_cards", {"en": {"heading": "What you agree to", "cards": [
                {"title": "Accurate listings", "body": "Your listing must truthfully describe the space — photos, amenities, and description must match what guests actually get."},
                {"title": "Accurate pricing", "body": "The price guests see must be the price they pay. Price changes on a live listing are reviewed before they apply."},
                {"title": "Accurate availability", "body": "Keep your calendar current. Accepting a booking means the dates are genuinely available — avoidable cancellations harm your standing."},
                {"title": "Clear house rules", "body": "Set and display house rules before guests book. Guests can only follow rules they were shown."},
                {"title": "Check-in instructions", "body": "Send clear check-in instructions through the booking conversation before arrival."},
                {"title": "Responsive communication", "body": "Reply to guest messages promptly, especially around check-in and during the stay."},
                {"title": "Property condition", "body": "The property must be clean, safe, and as described at check-in."},
                {"title": "Honoring cancellations", "body": "Your chosen cancellation policy applies to guest cancellations. Host cancellations are limited to genuine emergencies and may carry penalties."},
                {"title": "Fair reviews", "body": "Reviews are left by guests after checkout. Retaliatory or manipulated reviews are prohibited."},
                {"title": "Payout setup", "body": "Provide accurate payout details in your host profile. Earnings become payable 24 hours after check-in."},
                {"title": "Prohibited conduct", "body": "No discrimination, off-platform payments or communication, misrepresentation, or unsafe conditions. Violations can suspend or remove your listing."},
                {"title": "Reporting problems", "body": "Use Report a problem on a booking to open a dispute instead of resolving conflicts off-platform."},
                {"title": "Dispute process", "body": "Both sides submit evidence; StayOS support reviews and decides. Cooperate with information requests."},
            ]}, "ar": {"heading": "ما تلتزم به", "cards": [
                {"title": "إعلانات دقيقة", "body": "يجب أن يصف إعلانك المكان بصدق — الصور والمرافق والوصف يجب أن تطابق ما يحصل عليه الضيوف فعليًا."},
                {"title": "أسعار دقيقة", "body": "السعر الذي يراه الضيوف هو ما يدفعونه. تغييرات السعر على إعلان منشور تُراجع قبل تطبيقها."},
                {"title": "توافر دقيق", "body": "حافظ على تحديث التقويم. قبول الحجز يعني أن التواريخ متاحة فعلًا — الإلغاءات التي يمكن تجنبها تضر بمكانتك."},
                {"title": "قواعد إقامة واضحة", "body": "حدد واعرض قواعد الإقامة قبل حجز الضيوف. لا يمكن للضيوف اتباع قواعد لم تُعرض عليهم."},
                {"title": "تعليمات تسجيل الوصول", "body": "أرسل تعليمات واضحة لتسجيل الوصول عبر محادثة الحجز قبل الوصول."},
                {"title": "تواصل سريع", "body": "رد على رسائل الضيوف فورًا، خاصة حول تسجيل الوصول وأثناء الإقامة."},
                {"title": "حالة العقار", "body": "يجب أن يكون العقار نظيفًا وآمنًا وكما هو موصوف عند تسجيل الوصول."},
                {"title": "احترام الإلغاءات", "body": "تُطبق سياسة الإلغاء التي اخترتها على إلغاءات الضيوف. إلغاءات المضيف محدودة للطوارئ الحقيقية وقد تترتب عليها عقوبات."},
                {"title": "تقييمات عادلة", "body": "يترك الضيوف التقييمات بعد المغادرة. التقييمات الانتقامية أو المتلاعب بها محظورة."},
                {"title": "إعداد الدفعات", "body": "قدم بيانات دفع دقيقة في ملف المضيف. تصبح المستحقات قابلة للدفع بعد ٢٤ ساعة من تسجيل الوصول."},
                {"title": "سلوك محظور", "body": "لا تمييز ولا مدفوعات أو تواصل خارج المنصة ولا تضليل ولا ظروف غير آمنة. المخالفات قد تعلق أو تزيل إعلانك."},
                {"title": "الإبلاغ عن المشكلات", "body": "استخدم الإبلاغ عن مشكلة في الحجز لفتح نزاع بدلًا من حل الخلافات خارج المنصة."},
                {"title": "عملية النزاعات", "body": "يقدم الطرفان الأدلة؛ يراجع دعم StayOS ويقرر. تعاون مع طلبات المعلومات."},
            ]}}),
            ("cta", {"en": {"heading": "Ready to host?", "cta_label": "Open your host dashboard", "cta_href": "/en/host"},
                     "ar": {"heading": "جاهز للاستضافة؟", "cta_label": "افتح لوحة تحكم المضيف", "cta_href": "/ar/host"}}),
        ],
    },
}


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        system_user = await _resolve_seed_user(session)
        created, skipped = [], []
        for slug, spec in PAGES.items():
            existing = await cms_repository.get_page_by_slug(session, slug)
            if existing is not None:
                skipped.append(slug)
                continue
            page = await cms_services.create_page(
                session,
                system_user,
                PageCreateRequest(
                    slug=slug,
                    title_en=spec["title_en"],
                    title_ar=spec["title_ar"],
                    seo=spec["seo"],
                ),
            )
            for order, (block_type, content) in enumerate(spec["blocks"]):
                await cms_services.create_block(
                    session,
                    system_user,
                    page.id,
                    BlockCreateRequest(
                        block_type=block_type,
                        sort_order=order,
                        content=content,
                    ),
                )
            await cms_services.publish_page(
                session, system_user, page.id, note="Initial marketing seed"
            )
            created.append(slug)
        await session.commit()
        print(f"created: {created}")
        print(f"skipped (already exist): {skipped}")


if __name__ == "__main__":
    asyncio.run(seed())
