"""SQLAlchemy models.  All tenant-owned rows have a project_id foreign key."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AuthUser(Base):
    """Minimal Better Auth table mapping for the account foreign key.

    Better Auth owns this table's credential/session lifecycle in Next.js.
    FastAPI maps only the identifier so SQLAlchemy can enforce the product
    account relationship without ever reading or writing password fields.
    """

    __tablename__ = "auth_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)


class Account(Base):
    """An AgentLens account backed by the Better Auth user identity.

    Better Auth owns credentials and sessions in its ``auth_*`` tables. This
    table deliberately owns only product data, so the telemetry API never
    handles a password or exposes a session to SDK callers.
    """

    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(64), ForeignKey("auth_users.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    api_key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    owner_account_id: Mapped[str | None] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    webhook_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    est_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    instrumentation_type: Mapped[str] = mapped_column(String(20), nullable=False, default="generic")
    request_url: Mapped[str | None] = mapped_column(Text(), nullable=True)
    endpoint: Mapped[str | None] = mapped_column(Text(), nullable=True)
    http_method: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ApiRateLimit(Base):
    """Persistent token-bucket state, locked per project during a request.

    Keeping this in Postgres makes the limit work consistently across replicas.
    """

    __tablename__ = "api_rate_limits"

    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    tokens: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
