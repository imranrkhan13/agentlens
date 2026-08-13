"""End-to-end proof that tenant statistics never cross project boundaries."""

from uuid import uuid4

from fastapi.testclient import TestClient


def make_project(client: TestClient, name: str, account_id: str | None = None) -> dict:
    account_id = account_id or f"test-account-{uuid4()}"
    response = client.post(
        "/v1/account/projects",
        json={"name": name, "technology": "nextjs"},
        headers={"x-agentlens-account-id": account_id, "x-agentlens-internal-token": "test-only-internal-token-not-for-production"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def send_event(client: TestClient, api_key: str, success: bool) -> None:
    response = client.post(
        "/v1/events",
        json={"provider": "openai", "model": "gpt-4o", "latency_ms": 300, "success": success},
        headers={"x-api-key": api_key},
    )
    assert response.status_code == 200, response.text


def test_two_projects_only_see_their_own_real_traffic(client):
    alice = make_project(client, "Alice's App")
    bob = make_project(client, "Bob's App")

    assert alice["api_key"] != bob["api_key"]
    assert alice["project_id"] != bob["project_id"]
    assert alice["technology"] == "nextjs"

    for _ in range(10):
        send_event(client, alice["api_key"], True)
    for _ in range(3):
        send_event(client, bob["api_key"], False)

    alice_stats = client.get("/v1/stats", headers={"x-api-key": alice["api_key"]})
    bob_stats = client.get("/v1/stats", headers={"x-api-key": bob["api_key"]})
    assert alice_stats.status_code == 200
    assert bob_stats.status_code == 200
    alice_data = alice_stats.json()
    bob_data = bob_stats.json()
    assert alice_data["total_calls"] == 10
    assert alice_data["successful_calls"] == 10
    assert alice_data["failed_calls"] == 0
    assert alice_data["success_rate"] == 100.0
    assert alice_data["total_cost_usd"] == 0.0
    assert alice_data["detected_provider_count"] == 1
    assert alice_data["latest_event_at"] is not None
    assert bob_data["total_calls"] == 3
    assert bob_data["successful_calls"] == 0
    assert bob_data["failed_calls"] == 3
    assert bob_data["success_rate"] == 0.0
    assert bob_data["total_cost_usd"] == 0.0
    assert bob_data["detected_provider_count"] == 1
    assert bob_data["latest_event_at"] is not None

    invalid = client.get("/v1/stats", headers={"x-api-key": "al_totally_made_up_key"})
    assert invalid.status_code == 401
    missing = client.get("/v1/stats")
    assert missing.status_code in (401, 422)


def test_account_project_management_never_lists_another_accounts_project(client):
    alice_account = "alice-account"
    bob_account = "bob-account"
    alice = make_project(client, "Alice private project", alice_account)
    make_project(client, "Bob private project", bob_account)

    alice_headers = {"x-agentlens-account-id": alice_account, "x-agentlens-internal-token": "test-only-internal-token-not-for-production"}
    bob_headers = {"x-agentlens-account-id": bob_account, "x-agentlens-internal-token": "test-only-internal-token-not-for-production"}
    alice_list = client.get("/v1/account/projects", headers=alice_headers)
    assert alice_list.status_code == 200
    assert [project["project_id"] for project in alice_list.json()["projects"]] == [alice["project_id"]]
    assert alice_list.json()["projects"][0]["technology"] == "nextjs"

    forbidden = client.get(f"/v1/account/projects/{alice['project_id']}/stats", headers=bob_headers)
    assert forbidden.status_code == 404


def test_provider_detection_and_event_history_are_real_and_project_scoped(client):
    alice = make_project(client, "Alice provider telemetry")
    bob = make_project(client, "Bob provider telemetry")

    alice_event = client.post(
        "/v1/events",
        json={
            "provider": "internal-inference",
            "model": "reasoner-v3",
            "latencyMs": 842,
            "success": False,
            "statusCode": 429,
            "inputTokens": 120,
            "outputTokens": 40,
            "estimatedCost": 0.0042,
            "errorCategory": "rate_limit",
            "retryCount": 2,
            "instrumentationType": "generic",
        },
        headers={"x-api-key": alice["api_key"]},
    )
    assert alice_event.status_code == 200, alice_event.text
    send_event(client, alice["api_key"], True)
    send_event(client, bob["api_key"], False)

    alice_providers = client.get("/v1/providers", headers={"x-api-key": alice["api_key"]})
    assert alice_providers.status_code == 200, alice_providers.text
    providers = {provider["provider"]: provider for provider in alice_providers.json()["providers"]}
    assert set(providers) == {"internal-inference", "openai"}
    custom = providers["internal-inference"]
    assert custom["request_volume"] == 1
    assert custom["success_rate"] == 0.0
    assert custom["avg_latency_ms"] == 842.0
    assert custom["estimated_cost_usd"] == 0.0042
    assert custom["retries"] == 2
    assert custom["top_error_categories"] == ["rate_limit"]
    assert custom["instrumentation_type"] == "generic"
    assert custom["models"][0]["model"] == "reasoner-v3"
    assert custom["first_event_at"] == custom["latest_event_at"]

    alice_history = client.get("/v1/events?limit=10", headers={"x-api-key": alice["api_key"]})
    assert alice_history.status_code == 200, alice_history.text
    assert alice_history.json()["total"] == 2
    assert {event["provider"] for event in alice_history.json()["events"]} == {"internal-inference", "openai"}
    assert all(event["provider"] != "openai" or event["success"] for event in alice_history.json()["events"])

    bob_providers = client.get("/v1/providers", headers={"x-api-key": bob["api_key"]})
    assert bob_providers.status_code == 200
    assert bob_providers.json()["providers"][0]["provider"] == "openai"
    assert bob_providers.json()["providers"][0]["request_volume"] == 1


def test_event_metadata_is_sanitized_and_errors_are_categorized(client):
    project = make_project(client, "Provider request metadata")
    response = client.post(
        "/v1/events",
        json={
            "provider": "Gemini",
            "model": "gemini-2.0-flash",
            "latencyMs": 412,
            "success": False,
            "statusCode": 429,
            "requestUrl": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=must-not-be-stored",
            "endpoint": "https://generativelanguage.googleapis.com/v1beta?access_token=must-not-be-stored",
            "httpMethod": "post",
            "retryCount": 0,
            "instrumentationType": "native",
        },
        headers={"x-api-key": project["api_key"]},
    )
    assert response.status_code == 200, response.text

    history = client.get("/v1/events", headers={"x-api-key": project["api_key"]})
    assert history.status_code == 200, history.text
    event = history.json()["events"][0]
    assert event["model"] == "gemini-2.0-flash"
    assert event["error_category"] == "Rate Limit"
    assert event["request_url"] == "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    assert event["endpoint"] == "https://generativelanguage.googleapis.com/v1beta"
    assert event["http_method"] == "POST"
