# Recorded load-test result

This is a measured local-container result, not a capacity promise. It was run
on 2026-07-21 against the Docker Compose stack from this repository (Docker
Desktop, arm64 host), with the app's test stack configured with a 1,000-token
capacity and 1,000-token/second refill rate. That deliberate override prevents
the normal protective 120-token/2-token-per-second per-key limit from being
the load-test bottleneck.

Command:

```bash
docker run --rm --network agentlens_default \
  -e AGENTLENS_BASE_URL=http://api:8000 \
  -v "$PWD/loadtest:/loadtest:ro" --entrypoint locust agentlens-api \
  -f /loadtest/locustfile.py --headless --only-summary -u 10 -r 5 -t 20s \
  --host http://api:8000
```

Result:

```text
Isolation verified for 10 independently keyed simulated users.
Aggregated: 5,224 requests, 0 failures (0.00%), 263.44 requests/sec
Average response: 6 ms; median: 5 ms; p95: 13 ms; p99: 25 ms; max: 63 ms

POST /v1/events: 4,152 requests, 0 failures, 209.38 requests/sec
GET  /v1/stats:  1,062 requests, 0 failures, 53.55 requests/sec
POST /v1/projects: 10 requests, 0 failures
```

The Locust script creates one project/key per simulated user. It counts only
that user's accepted events and, at test shutdown, retrieves stats with that
same key and requires exact equality. A mismatch makes Locust exit nonzero,
so a merged/shared tenant response cannot be reported as a successful run.
