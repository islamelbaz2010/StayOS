from enum import StrEnum

CMS_SCHEMA = "cms"

# Locales supported by the storefront. English is the reference/fallback
# locale; Arabic is required for Egypt Alpha.
LOCALES: tuple[str, ...] = ("en", "ar")
DEFAULT_LOCALE = "en"


class PageStatus(StrEnum):
    """Content lifecycle: draft → published → archived."""

    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class BlockType(StrEnum):
    """Structured, reusable marketing/content blocks.

    Each block's ``content`` payload is localized as
    ``{"en": {...}, "ar": {...}}`` — see MARKETING_CMS_GUIDE.md for the
    per-type field contract.
    """

    HERO = "hero"
    HEADING_TEXT = "heading_text"
    IMAGE_TEXT = "image_text"
    FEATURE_CARDS = "feature_cards"
    CTA = "cta"
    FAQ = "faq"
    TESTIMONIAL = "testimonial"
    BANNER = "banner"
    GALLERY = "gallery"
    RICH_TEXT = "rich_text"
    ANNOUNCEMENT = "announcement"
