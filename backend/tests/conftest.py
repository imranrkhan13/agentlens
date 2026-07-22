"""Integration-test setup: tests always exercise a real PostgreSQL database."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text


TEST_DATABASE_URL = os.getenv("AGENTLENS_TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError(
        "Set AGENTLENS_TEST_DATABASE_URL to a dedicated PostgreSQL test database; "
        "tests never fall back to SQLite or a developer database."
    )
if "test" not in TEST_DATABASE_URL.rsplit("/", 1)[-1].lower():
    raise RuntimeError("AGENTLENS_TEST_DATABASE_URL must point to a database whose name contains 'test'.")

os.environ["AGENTLENS_DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("AGENTLENS_API_KEY_PEPPER", "test-only-pepper-not-for-production")
os.environ.setdefault("AGENTLENS_INTERNAL_API_TOKEN", "test-only-internal-token-not-for-production")
os.environ.setdefault("AGENTLENS_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
os.environ.setdefault("AGENTLENS_RATE_LIMIT_CAPACITY", "1000")
os.environ.setdefault("AGENTLENS_RATE_LIMIT_REFILL_PER_SECOND", "1000")

from app.db import get_engine, reset_database_for_testing


@pytest.fixture(scope="session", autouse=True)
def migrated_test_database():
    reset_database_for_testing()
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "head")
    yield
    reset_database_for_testing()


@pytest.fixture(autouse=True)
def empty_database(migrated_test_database):
    with get_engine().begin() as connection:
        connection.execute(text("TRUNCATE api_rate_limits, events, projects, accounts, auth_sessions, auth_identities, auth_verifications, auth_users RESTART IDENTITY CASCADE"))


@pytest.fixture
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
