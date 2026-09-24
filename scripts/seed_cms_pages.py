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
            ("cta", {"en": {"heading": "Still need help?", "cta_label": "Browse the FAQ", "cta_href": "/en/faq"},
                     "ar": {"heading": "ما زلت بحاجة إلى مساعدة؟", "cta_label": "تصفح الأسئلة الشائعة", "cta_href": "/ar/faq"}}),
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
