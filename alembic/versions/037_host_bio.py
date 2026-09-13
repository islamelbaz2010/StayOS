"""Add host bio column to users.

Revision ID: 037_host_bio
Revises: 036_review_parity
Create Date: 2026-08-15
"""

from alembic import op
import sqlalchemy as sa

revision: str = "037_host_bio"
down_revision: str | None = "036_review_parity"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("bio", sa.Text(), nullable=True),
        schema="auth",
    )


def downgrade() -> None:
    op.drop_column("users", "bio", schema="auth")
