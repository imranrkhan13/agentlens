from __future__ import annotations

import pytest

from app.config import DEVELOPMENT_CORS_ORIGINS, get_settings


def test_preflight_allows_vite_development_origin(client):
    response = client.options(
        "/v1/events",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "POST" in response.headers["access-control-allow-methods"]


def test_development_uses_local_origins_when_configuration_is_empty(monkeypatch):
    monkeypatch.setenv("AGENTLENS_API_KEY_PEPPER", "test-only-pepper")
    monkeypatch.setenv("AGENTLENS_ENV", "development")
    monkeypatch.delenv("AGENTLENS_CORS_ORIGINS", raising=False)

    assert get_settings().cors_origins == DEVELOPMENT_CORS_ORIGINS


def test_production_requires_explicit_origins(monkeypatch):
    monkeypatch.setenv("AGENTLENS_API_KEY_PEPPER", "test-only-pepper")
    monkeypatch.setenv("AGENTLENS_ENV", "production")
    monkeypatch.delenv("AGENTLENS_CORS_ORIGINS", raising=False)

    with pytest.raises(RuntimeError, match="AGENTLENS_CORS_ORIGINS"):
        get_settings()
