"""remember the founder-selected project technology

Revision ID: 20260722_05
Revises: 20260722_04
Create Date: 2026-07-22 15:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260722_05"
down_revision = "20260722_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("technology", sa.String(length=32), nullable=False, server_default="other"),
    )


def downgrade() -> None:
    op.drop_column("projects", "technology")
