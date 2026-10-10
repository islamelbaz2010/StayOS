"""Admin Reports API schemas."""

from datetime import datetime

from pydantic import BaseModel


class ReportCatalogEntry(BaseModel):
    key: str
    category: str
    columns: list[str]
    date_basis: str
    filters: list[str]
    sortable: list[str]
    money_columns: list[str]
    implemented: bool
    unavailable_reason: str | None = None
    note: str | None = None
    total_labels: dict[str, str] = {}


class ReportCatalogResponse(BaseModel):
    reports: list[ReportCatalogEntry]


class ReportResult(BaseModel):
    """One page of a report. ``columns`` are stable i18n keys; rows are
    dicts keyed by them. ``totals`` sums the declared money columns over
    the *entire filtered set* (not just the page)."""

    key: str
    category: str
    date_basis: str
    columns: list[str]
    rows: list[dict]
    total: int
    page: int
    page_size: int
    totals: dict[str, float] = {}
    # money_column → i18n key describing what that total actually sums
    # (e.g. "gross_credits" / "net_recognised_revenue" / "vat_payable").
    total_labels: dict[str, str] = {}
    # semantic disclaimer i18n key (e.g. "economics_not_revenue").
    note: str | None = None
    generated_at: datetime
    filters_applied: dict[str, str] = {}
