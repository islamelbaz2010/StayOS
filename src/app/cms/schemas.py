from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PageCreateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    title_en: str | None = Field(default=None, max_length=300)
    title_ar: str | None = Field(default=None, max_length=300)
    seo: dict[str, Any] = Field(default_factory=dict)


class PageUpdateRequest(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    title_en: str | None = Field(default=None, max_length=300)
    title_ar: str | None = Field(default=None, max_length=300)
    seo: dict[str, Any] | None = None


class PageListItem(BaseModel):
    id: str
    slug: str
    status: str
    title_en: str | None
    title_ar: str | None
    version: int
    published_at: datetime | None
    updated_at: datetime

    model_config = {"from_attributes": True}


class BlockCreateRequest(BaseModel):
    block_type: str
    sort_order: int = Field(default=0, ge=0)
    enabled: bool = True
    content: dict[str, Any] = Field(default_factory=dict)


class BlockUpdateRequest(BaseModel):
    block_type: str | None = None
    sort_order: int | None = Field(default=None, ge=0)
    enabled: bool | None = None
    content: dict[str, Any] | None = None


class BlockResponse(BaseModel):
    id: str
    page_id: str
    block_type: str
    sort_order: int
    enabled: bool
    content: dict[str, Any]
    updated_at: datetime

    model_config = {"from_attributes": True}


class PageDetailResponse(PageListItem):
    title_en: str | None
    title_ar: str | None
    seo: dict[str, Any]
    published_by: str | None
    updated_by: str | None
    blocks: list[BlockResponse]


class RevisionResponse(BaseModel):
    id: str
    page_id: str
    version: int
    note: str | None
    created_by: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PublishRequest(BaseModel):
    note: str | None = Field(default=None, max_length=300)


class MediaPresignRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=200)
    content_type: str = Field(min_length=3, max_length=100)


class MediaPresignResponse(BaseModel):
    upload_url: str
    media_key: str


class MediaCreateRequest(BaseModel):
    s3_key: str | None = Field(default=None, max_length=500)
    url: str | None = Field(default=None, max_length=2000)
    content_type: str | None = Field(default=None, max_length=100)
    alt_en: str | None = Field(default=None, max_length=300)
    alt_ar: str | None = Field(default=None, max_length=300)


class MediaResponse(BaseModel):
    id: str
    s3_key: str | None
    url: str | None
    content_type: str | None
    alt_en: str | None
    alt_ar: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Public (published-only) shapes -------------------------------------


class PublicBlock(BaseModel):
    id: str
    block_type: str
    sort_order: int
    content: dict[str, Any]


class PublicPageResponse(BaseModel):
    slug: str
    title: str | None
    locale: str
    seo: dict[str, Any]
    version: int
    published_at: datetime | None
    blocks: list[PublicBlock]


class PublicPageListItem(BaseModel):
    slug: str
    title: str | None
    published_at: datetime | None
