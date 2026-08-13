"""allow the telemetry API to own product accounts independently

Revision ID: 20260813_08
Revises: 20260812_07
Create Date: 2026-08-13 21:30:00.000000
"""

from alembic import op


revision = "20260813_08"
down_revision = "20260812_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Better Auth commonly runs on Vercel/Neon while the telemetry API runs on
    # Render. Account identity is authenticated by the internal API token and
    # forwarded server-to-server; requiring the same auth_users row in both
    # databases made first-project creation fail with a foreign-key error.
    op.execute("ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_id_fkey")


def downgrade() -> None:
    op.create_foreign_key(
        "accounts_id_fkey",
        "accounts",
        "auth_users",
        ["id"],
        ["id"],
        ondelete="CASCADE",
    )
