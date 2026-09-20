"""StayOS Local Fit — rule-based, explainable listing↔guest matching (FD-24).

NOT AI and never described as prediction: each guest preference maps to a
declared, inspectable rule over canonical listing/host attributes. The
score is ``matched / evaluable`` and every check is returned with its
pass/fail so the UI can explain the number ("92% Match — ✓ Family-friendly,
✓ Self check-in, ✗ Pets allowed").

Preferences with no data-backed rule (e.g. "near metro") are deliberately
unsupported rather than guessed — adding them requires a real data source.
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User

from .models import Unit, UnitListing


@dataclass(frozen=True)
class FitCheck:
    key: str
    label_en: str
    label_ar: str
    passed: bool


def _has_amenity(listing: UnitListing, *keys: str) -> bool:
    amenities = {a.upper() for a in (listing.amenities or [])}
    return any(k.upper() in amenities for k in keys)


def _has_tag(listing: UnitListing, *tags: str) -> bool:
    cultural = {t.upper() for t in (listing.cultural_tags or [])}
    return any(t.upper() in cultural for t in tags)


# Each rule returns True/False against (unit, listing, host).
_RULES: dict[str, tuple[str, str, Callable[[Unit, UnitListing, User | None], bool]]] = {
    "family_friendly": (
        "Family-friendly",
        "مناسب للعائلات",
        lambda unit, listing, host: unit.max_guests >= 4
        or _has_tag(listing, "FAMILY_ONLY"),
    ),
    "egyptian_family": (
        "Suitable for Egyptian families",
        "مناسب للأسر المصرية",
        lambda unit, listing, host: _has_tag(listing, "FAMILY_ONLY"),
    ),
    "work_friendly": (
        "Work-friendly",
        "مناسب للعمل",
        lambda unit, listing, host: _has_amenity(listing, "wifi", "workspace"),
    ),
    "long_stay": (
        "Long-stay friendly",
        "مناسب للإقامات الطويلة",
        lambda unit, listing, host: listing.max_nights >= 28
        or int(listing.monthly_discount_pct or 0) > 0,
    ),
    "pets": (
        "Pet-friendly",
        "يسمح بالحيوانات الأليفة",
        lambda unit, listing, host: bool(listing.allows_pets),
    ),
    "self_check_in": (
        "Self check-in",
        "تسجيل وصول ذاتي",
        lambda unit, listing, host: bool(listing.self_check_in),
    ),
    "arabic_host": (
        "Arabic-speaking host",
        "المضيف يتحدث العربية",
        lambda unit, listing, host: host is not None
        and ("ar" in (host.languages or []) or host.locale == "ar"),
    ),
    "couples": (
        "Couples welcome",
        "مناسب للأزواج",
        lambda unit, listing, host: _has_tag(
            listing, "COUPLES_WELCOME", "MIXED"
        ),
    ),
    "halal": (
        "Halal-conscious",
        "يراعي الضوابط الشرعية",
        lambda unit, listing, host: _has_tag(listing, "HALAL_CERTIFIED"),
    ),
    "entire_place": (
        "Entire place",
        "مكان كامل",
        lambda unit, listing, host: listing.category == "ENTIRE_PLACE",
    ),
}

SUPPORTED_PREFERENCES: tuple[str, ...] = tuple(_RULES.keys())


def validate_preferences(prefs: list[str]) -> list[str]:
    """Keep only supported preference keys, preserving order, deduped."""
    seen: list[str] = []
    for pref in prefs:
        if pref in _RULES and pref not in seen:
            seen.append(pref)
    return seen


def compute_fit(
    prefs: list[str],
    unit: Unit,
    listing: UnitListing,
    host: User | None,
) -> tuple[int | None, list[FitCheck]]:
    """Return (match_pct, checks). ``match_pct`` is None when the guest has
    no evaluable preferences for this listing."""
    checks = [
        FitCheck(key, en, ar, rule(unit, listing, host))
        for pref in prefs
        if (key := pref) in _RULES
        for en, ar, rule in [_RULES[key]]
    ]
    if not checks:
        return None, []
    matched = sum(1 for c in checks if c.passed)
    return round(matched * 100 / len(checks)), checks


async def get_listing_fit(
    session: AsyncSession,
    unit: Unit,
    listing: UnitListing,
    user: User,
) -> tuple[int | None, list[FitCheck]]:
    prefs = validate_preferences(list(user.guest_preferences or []))
    if not prefs:
        return None, []
    host: User | None = None
    if "arabic_host" in prefs:
        host = await session.get(User, unit.host_id)
    return compute_fit(prefs, unit, listing, host)
