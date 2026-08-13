from __future__ import annotations

import socket

import pytest

from app.db import database_connect_args, migration_database_url


def test_database_connections_prefer_resolved_ipv4(monkeypatch):
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda *_args, **_kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("203.0.113.20", 5432)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("203.0.113.10", 5432)),
        ],
    )
    args = database_connect_args("postgresql+psycopg://user:secret@db.example.test:5432/app?sslmode=require")
    assert args == {"connect_timeout": 10, "hostaddr": "203.0.113.10"}


def test_database_connection_fails_clearly_without_ipv4(monkeypatch):
    def no_ipv4(*_args, **_kwargs):
        raise socket.gaierror(socket.EAI_NONAME, "no address")

    monkeypatch.setattr(socket, "getaddrinfo", no_ipv4)
    with pytest.raises(RuntimeError, match="could not be resolved to IPv4"):
        database_connect_args("postgresql+psycopg://user:secret@ipv6-only.example.test:5432/app")


def test_direct_migration_url_is_optional(monkeypatch):
    monkeypatch.setenv("AGENTLENS_DATABASE_URL", "postgresql://user:secret@pooler.example.test/app")
    monkeypatch.delenv("AGENTLENS_MIGRATION_DATABASE_URL", raising=False)
    assert "pooler.example.test" in migration_database_url()

    monkeypatch.setenv("AGENTLENS_MIGRATION_DATABASE_URL", "postgresql://user:secret@direct.example.test/app")
    assert "direct.example.test" in migration_database_url()
