"""add secure subscription billing state

Revision ID: 20260811_06
Revises: 20260722_05
Create Date: 2026-08-11 22:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260811_06"
down_revision = "20260722_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "billing_subscriptions",
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("plan_code", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("razorpay_subscription_id", sa.String(length=100), nullable=False),
        sa.Column("initial_payment_id", sa.String(length=100), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("plan_code IN ('pro', 'scale')", name="ck_billing_subscription_plan"),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("account_id"),
        sa.UniqueConstraint("initial_payment_id"),
        sa.UniqueConstraint("razorpay_subscription_id"),
    )
    op.create_index("ix_billing_subscriptions_razorpay_subscription_id", "billing_subscriptions", ["razorpay_subscription_id"], unique=False)
    op.create_table(
        "billing_webhook_events",
        sa.Column("event_id", sa.String(length=200), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("event_id"),
    )


def downgrade() -> None:
    op.drop_table("billing_webhook_events")
    op.drop_index("ix_billing_subscriptions_razorpay_subscription_id", table_name="billing_subscriptions")
    op.drop_table("billing_subscriptions")
