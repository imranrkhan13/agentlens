"""add privacy-safe local provider comparisons

Revision ID: 20260812_07
Revises: 20260811_06
Create Date: 2026-08-12 00:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260812_07"
down_revision = "20260811_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "provider_matches",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("account_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("use_case", sa.Text(), nullable=False),
        sa.Column("task_type", sa.String(length=32), nullable=False),
        sa.Column("priority", sa.String(length=16), nullable=False),
        sa.Column("response_format", sa.String(length=16), nullable=False),
        sa.Column("data_sensitivity", sa.String(length=16), nullable=False),
        sa.Column("monthly_requests", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="ready"),
        sa.Column("test_cases", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("selected_providers", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("runner_token_hash", sa.String(length=64), nullable=True),
        sa.Column("runner_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("recommendation_provider", sa.String(length=80), nullable=True),
        sa.Column("recommendation_model", sa.String(length=150), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("task_type IN ('support','extraction','classification','content','coding','analysis')", name="ck_provider_matches_task_type"),
        sa.CheckConstraint("priority IN ('balanced','quality','speed','cost')", name="ck_provider_matches_priority"),
        sa.CheckConstraint("response_format IN ('text','json','short')", name="ck_provider_matches_response_format"),
        sa.CheckConstraint("data_sensitivity IN ('public','business','sensitive')", name="ck_provider_matches_data_sensitivity"),
        sa.CheckConstraint("status IN ('ready','running','complete')", name="ck_provider_matches_status"),
        sa.CheckConstraint("monthly_requests >= 100 AND monthly_requests <= 100000000", name="ck_provider_matches_monthly_requests"),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("runner_token_hash"),
    )
    op.create_index("ix_provider_matches_account_created", "provider_matches", ["account_id", "created_at"], unique=False)
    op.create_table(
        "provider_match_results",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("match_id", sa.String(length=36), nullable=False),
        sa.Column("provider", sa.String(length=80), nullable=False),
        sa.Column("model", sa.String(length=150), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("tests_total", sa.Integer(), nullable=False),
        sa.Column("tests_passed", sa.Integer(), nullable=False),
        sa.Column("quality_score", sa.Float(), nullable=False),
        sa.Column("reliability_score", sa.Float(), nullable=False),
        sa.Column("speed_score", sa.Float(), nullable=False),
        sa.Column("cost_score", sa.Float(), nullable=False),
        sa.Column("overall_score", sa.Float(), nullable=False),
        sa.Column("avg_latency_ms", sa.Float(), nullable=True),
        sa.Column("p95_latency_ms", sa.Float(), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estimated_run_cost_usd", sa.Float(), nullable=True),
        sa.Column("estimated_monthly_cost_usd", sa.Float(), nullable=True),
        sa.Column("error_category", sa.String(length=120), nullable=True),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('complete','unavailable','failed')", name="ck_provider_match_results_status"),
        sa.CheckConstraint("quality_score >= 0 AND quality_score <= 100", name="ck_provider_match_results_quality"),
        sa.CheckConstraint("reliability_score >= 0 AND reliability_score <= 100", name="ck_provider_match_results_reliability"),
        sa.CheckConstraint("speed_score >= 0 AND speed_score <= 100", name="ck_provider_match_results_speed"),
        sa.CheckConstraint("cost_score >= 0 AND cost_score <= 100", name="ck_provider_match_results_cost"),
        sa.CheckConstraint("overall_score >= 0 AND overall_score <= 100", name="ck_provider_match_results_overall"),
        sa.ForeignKeyConstraint(["match_id"], ["provider_matches.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("match_id", "provider", "model", name="uq_provider_match_result_model"),
    )
    op.create_index("ix_provider_match_results_match_score", "provider_match_results", ["match_id", "overall_score"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_provider_match_results_match_score", table_name="provider_match_results")
    op.drop_table("provider_match_results")
    op.drop_index("ix_provider_matches_account_created", table_name="provider_matches")
    op.drop_table("provider_matches")
