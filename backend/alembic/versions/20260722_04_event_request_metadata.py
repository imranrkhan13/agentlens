"""add privacy-safe provider request metadata

Revision ID: 20260722_04
Revises: 20260721_03
Create Date: 2026-07-22 06:15:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260722_04"
down_revision = "20260721_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("request_url", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("endpoint", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("http_method", sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "http_method")
    op.drop_column("events", "endpoint")
    op.drop_column("events", "request_url")
