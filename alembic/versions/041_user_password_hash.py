"""User password_hash column for email+password authentication.

Revision ID: 041_user_password_hash
Revises: 040_candidate_governorate
Create Date: 2026-09-20

Changes:
- auth.users.password_hash: nullable bcrypt hash. NULL for accounts that
  authenticate via phone OTP or Firebase only; set when a user registers
  with email+password or sets a password on an existing account.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "041_user_password_hash"
down_revision: str | None = "040_candidate_governorate"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        schema="auth",
    )


def downgrade() -> None:
    op.drop_column("users", "password_hash", schema="auth")
