"""Postgres database setup for AgentLens.

The application deliberately does not create tables at import time.  Schema
changes are owned by Alembic and are applied before the web process starts.
"""

from __future__ import annotations

import os
import ipaddress
import socket
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session, sessionmaker


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def _postgres_url(value: str | None, variable: str) -> str:
    if not value:
        raise RuntimeError(
            f"{variable} must be set (for example, "
            "postgresql+psycopg://user:password@host:5432/agentlens)."
        )
    url = value.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        # Managed providers commonly supply this generic SQLAlchemy URL. The
        # image installs psycopg v3, so select it explicitly.
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    if not url.startswith("postgresql"):
        raise RuntimeError(f"AgentLens only supports a PostgreSQL {variable}.")
    return url


def database_url() -> str:
    """Return the explicitly configured database URL.

    A deployment with no configured database must fail closed rather than
    quietly writing production telemetry to a local SQLite file.
    """
    return _postgres_url(os.getenv("AGENTLENS_DATABASE_URL"), "AGENTLENS_DATABASE_URL")


def migration_database_url() -> str:
    """Use a direct database endpoint for schema changes when available.

    Neon recommends a direct connection for ORM migrations and a pooled
    endpoint for normal application traffic. Existing deployments remain
    compatible because the application URL is the fallback.
    """
    value = os.getenv("AGENTLENS_MIGRATION_DATABASE_URL")
    return _postgres_url(value, "AGENTLENS_MIGRATION_DATABASE_URL") if value else database_url()


def database_connect_args(url: str | None = None) -> dict[str, object]:
    """Return bounded connection settings and prefer IPv4 when DNS permits.

    Some container networks resolve a managed Postgres endpoint to IPv6 even
    though the runtime has no IPv6 route. Supplying both ``host`` (in the URL)
    and ``hostaddr`` keeps TLS hostname verification intact while making the
    actual socket use a reachable IPv4 address.
    """
    resolved_url = url or database_url()
    parsed = make_url(resolved_url)
    host = parsed.host
    args: dict[str, object] = {"connect_timeout": 10}
    if not host or parsed.query.get("hostaddr"):
        return args

    try:
        address = ipaddress.ip_address(host)
        if address.version == 6:
            raise RuntimeError(
                "The configured PostgreSQL host is an IPv6 address, but this deployment requires an IPv4-capable database endpoint. "
                "Copy the pooled or direct hostname from the Neon Connect dialog instead of an IPv6 literal."
            )
        return args
    except ValueError:
        pass

    try:
        ipv4_addresses = sorted({
            entry[4][0]
            for entry in socket.getaddrinfo(host, parsed.port or 5432, socket.AF_INET, socket.SOCK_STREAM)
        })
    except socket.gaierror as error:
        raise RuntimeError(
            f"The PostgreSQL hostname {host!r} could not be resolved to IPv4. Check AGENTLENS_DATABASE_URL in Render."
        ) from error
    if not ipv4_addresses:
        raise RuntimeError(
            f"The PostgreSQL hostname {host!r} has no IPv4 address. Use Neon's pooled IPv4-capable connection string or a Render Postgres internal URL."
        )
    args["hostaddr"] = ipv4_addresses[0]
    return args


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
            connect_args=database_connect_args(),
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
