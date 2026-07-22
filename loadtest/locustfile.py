"""Concurrent, tenant-isolation load test for a running AgentLens stack.

Each simulated user creates exactly one project/key, sends only its own events,
and verifies at shutdown that its stats equal its own accepted event count.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from gevent.lock import Semaphore
from locust import HttpUser, between, events, task


@dataclass
class UserResult:
    api_key: str
    sent_events: int = 0


results: list[UserResult] = []
results_lock = Semaphore()
failure_message: str | None = None


class AgentLensUser(HttpUser):
    wait_time = between(0.01, 0.05)

    def on_start(self):
        created = self.client.post("/v1/projects", json={"name": f"Load test {id(self)}"})
        if created.status_code != 201:
            raise RuntimeError(f"Could not create load-test project: {created.status_code} {created.text}")
        self.result = UserResult(api_key=created.json()["api_key"])
        with results_lock:
            results.append(self.result)

    @task(4)
    def ingest_event(self):
        response = self.client.post(
            "/v1/events",
            headers={"x-api-key": self.result.api_key},
            json={"provider": "loadtest", "model": "isolation-check", "latency_ms": 12.5, "success": True},
        )
        if response.status_code == 200:
            self.result.sent_events += 1
        elif response.status_code != 429:
            response.failure(f"unexpected event response: {response.status_code} {response.text}")

    @task(1)
    def read_own_stats(self):
        response = self.client.get("/v1/stats", headers={"x-api-key": self.result.api_key})
        if response.status_code != 200:
            response.failure(f"unexpected stats response: {response.status_code} {response.text}")


@events.test_stop.add_listener
def verify_isolation(environment, **kwargs):
    global failure_message
    # Locust waits for all users to stop before test_stop, so accepted event
    # counts are stable. Exact equality detects shared/missing tenant rows.
    for result in results:
        import requests

        stats_response = requests.get(
            f"{os.environ.get('AGENTLENS_BASE_URL', 'http://127.0.0.1:8001').rstrip('/')}/v1/stats",
            headers={"x-api-key": result.api_key},
            timeout=10,
        )
        if stats_response.status_code != 200:
            failure_message = f"final stats request failed: {stats_response.status_code}"
            break
        actual = stats_response.json().get("total_calls")
        if actual != result.sent_events:
            failure_message = (
                "TENANT ISOLATION FAILURE: a user's final statistics do not equal "
                f"that user's accepted events ({actual} != {result.sent_events})"
            )
            break

    if failure_message:
        environment.process_exit_code = 1
        print(failure_message)
    else:
        print(f"Isolation verified for {len(results)} independently keyed simulated users.")
