"""Postgres database setup for AgentLens.

The application deliberately does not create tables at import time.  Schema
changes are owned by Alembic and are applied before the web process starts.
"""

from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def database_url() -> str:
    """Return the explicitly configured database URL.

    A deployment with no configured database must fail closed rather than
    quietly writing production telemetry to a local SQLite file.
    """
    url = os.getenv("AGENTLENS_DATABASE_URL")
    if not url:
        raise RuntimeError(
            "AGENTLENS_DATABASE_URL must be set (for example, "
            "postgresql+psycopg://user:password@host:5432/agentlens)."
        )
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        # Managed providers commonly supply this generic SQLAlchemy URL. The
        # image installs psycopg v3, so select it explicitly.
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    if not url.startswith("postgresql"):
        raise RuntimeError("AgentLens only supports a PostgreSQL AGENTLENS_DATABASE_URL.")
    return url


def get_engine() -> Engine:
    """Create one pooled engine per process, lazily and safely."""
    global _engine, _session_factory
    if _engine is None:
        pool_size = int(os.getenv("AGENTLENS_DB_POOL_SIZE", "10"))
        max_overflow = int(os.getenv("AGENTLENS_DB_MAX_OVERFLOW", "20"))
        _engine = create_engine(
            database_url(),
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=True,
            pool_recycle=1800,
            future=True,
        )
        _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency which gives every request an isolated session."""
    get_engine()
    assert _session_factory is not None
    session = _session_factory()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def check_database() -> None:
    with get_engine().connect() as connection:
        connection.execute(text("SELECT 1"))


def reset_database_for_testing() -> None:
    """Dispose the process-local pool after a test changes its database URL."""
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None
