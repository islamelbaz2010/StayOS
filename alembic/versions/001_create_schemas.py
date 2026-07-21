"""Create schemas and extensions

Revision ID: 001_create_schemas
Revises: 
Create Date: 2026-07-13 08:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001_create_schemas"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis CASCADE")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS uuid-ossp")
    
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")
    op.execute("CREATE SCHEMA IF NOT EXISTS pms")
    op.execute("CREATE SCHEMA IF NOT EXISTS reservation")
    op.execute("CREATE SCHEMA IF NOT EXISTS finance")
    op.execute("CREATE SCHEMA IF NOT EXISTS notify")
    op.execute("CREATE SCHEMA IF NOT EXISTS outbox")


def downgrade() -> None:
    op.execute("DROP SCHEMA IF EXISTS outbox CASCADE")
    op.execute("DROP SCHEMA IF EXISTS notify CASCADE")
    op.execute("DROP SCHEMA IF EXISTS finance CASCADE")
    op.execute("DROP SCHEMA IF EXISTS reservation CASCADE")
    op.execute("DROP SCHEMA IF EXISTS pms CASCADE")
    op.execute("DROP SCHEMA IF EXISTS auth CASCADE")
    
    op.execute("DROP EXTENSION IF EXISTS uuid-ossp")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
    op.execute("DROP EXTENSION IF EXISTS postgis")
