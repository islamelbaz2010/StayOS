"""KYC provider linkage: columns connecting a verification document to an
external identity-verification provider (supersedes FD-02 manual-only).

Revision ID: 052_kyc_provider_fields
Revises: 051_account_profile_r1
Create Date: 2026-10-18

Additive only — both columns are nullable; manual/upload submissions keep
provider = NULL.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "052_kyc_provider_fields"
down_revision: str | None = "051_account_profile_r1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "kyc_documents",
        sa.Column("provider", sa.String(30), nullable=True),
        schema="auth",
    )
    op.add_column(
        "kyc_documents",
        sa.Column("provider_applicant_id", sa.String(64), nullable=True),
        schema="auth",
    )
    op.create_index(
        "ix_kyc_documents_provider_applicant_id",
        "kyc_documents",
        ["provider_applicant_id"],
        schema="auth",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_kyc_documents_provider_applicant_id",
        table_name="kyc_documents",
        schema="auth",
    )
    op.drop_column("kyc_documents", "provider_applicant_id", schema="auth")
    op.drop_column("kyc_documents", "provider", schema="auth")
