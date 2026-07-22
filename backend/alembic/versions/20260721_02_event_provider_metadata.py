"""add provider discovery telemetry metadata

Revision ID: 20260721_02
Revises: 20260721_01
Create Date: 2026-07-21 00:15:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260721_02"
down_revision = "20260721_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("status_code", sa.Integer(), nullable=True))
    op.add_column("events", sa.Column("input_tokens", sa.Integer(), nullable=True))
    op.add_column("events", sa.Column("output_tokens", sa.Integer(), nullable=True))
    op.add_column("events", sa.Column("error_category", sa.String(length=100), nullable=True))
    op.add_column("events", sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("events", sa.Column("instrumentation_type", sa.String(length=20), nullable=False, server_default="generic"))
    op.alter_column("events", "retry_count", server_default=None)
    op.alter_column("events", "instrumentation_type", server_default=None)


def downgrade() -> None:
    op.drop_column("events", "instrumentation_type")
    op.drop_column("events", "retry_count")
    op.drop_column("events", "error_category")
    op.drop_column("events", "output_tokens")
    op.drop_column("events", "input_tokens")
    op.drop_column("events", "status_code")
