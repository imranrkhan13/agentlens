"""SQLAlchemy models.  All tenant-owned rows have a project_id foreign key."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
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


class BillingSubscription(Base):
    """Server-owned Razorpay subscription state for one authenticated account."""

    __tablename__ = "billing_subscriptions"

    account_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True
    )
    plan_code: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    razorpay_subscription_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    initial_payment_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BillingWebhookEvent(Base):
    """Idempotency ledger for signed Razorpay webhook deliveries."""

    __tablename__ = "billing_webhook_events"

    event_id: Mapped[str] = mapped_column(String(200), primary_key=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ProviderMatch(Base):
    """A user-authored, synthetic provider comparison specification.

    Provider credentials and model responses never enter this table. Only the
    visible test plan and metadata-only result summaries are persisted.
    """

    __tablename__ = "provider_matches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(64), ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    use_case: Mapped[str] = mapped_column(Text, nullable=False)
    task_type: Mapped[str] = mapped_column(String(32), nullable=False)
    priority: Mapped[str] = mapped_column(String(16), nullable=False)
    response_format: Mapped[str] = mapped_column(String(16), nullable=False)
    data_sensitivity: Mapped[str] = mapped_column(String(16), nullable=False)
    monthly_requests: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="ready")
    test_cases: Mapped[list] = mapped_column(JSON, nullable=False)
    selected_providers: Mapped[list] = mapped_column(JSON, nullable=False)
    runner_token_hash: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    runner_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recommendation_provider: Mapped[str | None] = mapped_column(String(80), nullable=True)
    recommendation_model: Mapped[str | None] = mapped_column(String(150), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ProviderMatchResult(Base):
    __tablename__ = "provider_match_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(String(36), ForeignKey("provider_matches.id", ondelete="CASCADE"), index=True)
    provider: Mapped[str] = mapped_column(String(80), nullable=False)
    model: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    tests_total: Mapped[int] = mapped_column(Integer, nullable=False)
    tests_passed: Mapped[int] = mapped_column(Integer, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False)
    reliability_score: Mapped[float] = mapped_column(Float, nullable=False)
    speed_score: Mapped[float] = mapped_column(Float, nullable=False)
    cost_score: Mapped[float] = mapped_column(Float, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    avg_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    p95_latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    estimated_run_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_monthly_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    details: Mapped[list] = mapped_column(JSON, nullable=False)
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
    technology: Mapped[str] = mapped_column(String(32), nullable=False, server_default="other")
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
