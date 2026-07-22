"""add Better Auth identities and account-owned projects

Revision ID: 20260721_03
Revises: 20260721_02
Create Date: 2026-07-21 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260721_03"
down_revision = "20260721_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Better Auth owns these identity/session tables. They live alongside the
    # FastAPI schema so a self-hosted deployment has one explicit migration
    # path and neither service ever stores raw browser passwords itself.
    op.create_table(
        "auth_users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("recovery_email", sa.String(length=320), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_auth_users_recovery_email", "auth_users", ["recovery_email"], unique=False)
    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("token", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("ip_address", sa.Text(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"], unique=False)
    op.create_table(
        "auth_identities",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("account_id", sa.Text(), nullable=False),
        sa.Column("provider_id", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("id_token", sa.Text(), nullable=True),
        sa.Column("access_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refresh_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("password", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_identities_user_id", "auth_identities", ["user_id"], unique=False)
    op.create_table(
        "auth_verifications",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("identifier", sa.Text(), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_auth_verifications_identifier", "auth_verifications", ["identifier"], unique=False)

    op.create_table(
        "accounts",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["id"], ["auth_users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.add_column("projects", sa.Column("owner_account_id", sa.String(length=64), nullable=True))
    op.add_column("projects", sa.Column("webhook_url", sa.Text(), nullable=True))
    op.create_foreign_key("fk_projects_owner_account", "projects", "accounts", ["owner_account_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_projects_owner_account_id", "projects", ["owner_account_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_projects_owner_account_id", table_name="projects")
    op.drop_constraint("fk_projects_owner_account", "projects", type_="foreignkey")
    op.drop_column("projects", "webhook_url")
    op.drop_column("projects", "owner_account_id")
    op.drop_table("accounts")
    op.drop_index("ix_auth_verifications_identifier", table_name="auth_verifications")
    op.drop_table("auth_verifications")
    op.drop_index("ix_auth_identities_user_id", table_name="auth_identities")
    op.drop_table("auth_identities")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index("ix_auth_users_recovery_email", table_name="auth_users")
    op.drop_table("auth_users")
