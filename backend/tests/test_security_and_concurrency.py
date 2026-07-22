"""Production behaviors verified through the real ASGI app and PostgreSQL."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import get_engine
from app.main import JsonFormatter, app, logger
from .test_isolation import make_project, send_event


def test_cors_preflight_allows_the_configured_frontend_origin(client):
    response = client.options(
        "/v1/account/projects",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,x-api-key,x-request-id",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"].lower()
    assert "x-api-key" in response.headers["access-control-allow-headers"].lower()


def test_cors_headers_are_present_on_health_and_openapi(client):
    for path in ("/health", "/openapi.json"):
        response = client.get(path, headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
        assert response.headers["access-control-expose-headers"] == "x-request-id"


def test_database_only_contains_a_keyed_hash_and_that_key_authenticates(client):
    project = make_project(client, "Hashed-key app")
    with get_engine().connect() as connection:
        stored = connection.execute(
            text("SELECT api_key_hash FROM projects WHERE id = :project_id"),
            {"project_id": project["project_id"]},
        ).scalar_one()

    assert stored != project["api_key"]
    assert len(stored) == 64
    response = client.get("/v1/stats", headers={"x-api-key": project["api_key"]})
    assert response.status_code == 200
    assert response.json()["total_calls"] == 0


def test_database_backed_rate_limit_rejects_real_repeated_requests(client, monkeypatch):
    monkeypatch.setenv("AGENTLENS_RATE_LIMIT_CAPACITY", "2")
    monkeypatch.setenv("AGENTLENS_RATE_LIMIT_REFILL_PER_SECOND", "0.001")
    project = make_project(client, "Rate-limited app")
    headers = {"x-api-key": project["api_key"]}

    assert client.get("/v1/stats", headers=headers).status_code == 200
    assert client.get("/v1/stats", headers=headers).status_code == 200
    limited = client.get("/v1/stats", headers=headers)
    assert limited.status_code == 429
    assert limited.json()["detail"] == "API key rate limit exceeded"
    assert int(limited.headers["retry-after"]) >= 1


def test_structured_log_has_request_and_project_ids_but_never_the_raw_key(client):
    project = make_project(client, "Logging app")

    class RecordingHandler(logging.Handler):
        def __init__(self):
            super().__init__()
            self.records = []

        def emit(self, record):
            self.records.append(record)

    handler = RecordingHandler()
    logger.addHandler(handler)
    try:
        response = client.get("/v1/stats", headers={"x-api-key": project["api_key"], "x-request-id": "test-request-42"})
        assert response.status_code == 200
    finally:
        logger.removeHandler(handler)

    records = [record for record in handler.records if "request_complete" in record.getMessage()]
    assert records
    message = JsonFormatter().format(records[-1])
    assert '"request_id":"test-request-42"' in message
    assert f'"project_id":"{project["project_id"]}"' in message
    assert project["api_key"] not in message


def test_concurrent_pooled_writes_keep_each_projects_statistics_isolated():
    """Several TestClient threads use the real Postgres pool concurrently."""
    project_count = 8
    events_per_project = 12

    with TestClient(app) as setup_client:
        projects = [make_project(setup_client, f"Concurrent app {number}") for number in range(project_count)]

    def write_own_events(project: dict) -> tuple[dict, dict]:
        # A distinct client per worker avoids sharing HTTP client state while
        # still using the application's shared, pooled SQLAlchemy engine.
        with TestClient(app) as worker_client:
            for _ in range(events_per_project):
                send_event(worker_client, project["api_key"], True)
            stats = worker_client.get("/v1/stats", headers={"x-api-key": project["api_key"]})
            assert stats.status_code == 200, stats.text
            return project, stats.json()

    with ThreadPoolExecutor(max_workers=project_count) as executor:
        results = list(executor.map(write_own_events, projects))

    assert len({project["project_id"] for project, _ in results}) == project_count
    for project, stats in results:
        assert stats == {"total_calls": events_per_project, "success_rate": 100.0, "total_cost_usd": 0.0}, project["project_id"]
