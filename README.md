# AgentLens

AgentLens is a small, multi-tenant AI telemetry API. Each project receives one
API key, and every telemetry read is scoped to the project authenticated by
that key.

The production architecture is deliberately compact:

```text
client → stateless FastAPI replicas → pooled PostgreSQL connections → PostgreSQL
                                      └─ projects / events / per-key token buckets
```

- API keys are generated with 256 bits of randomness and stored only as
  HMAC-SHA-256 digests, keyed with `AGENTLENS_API_KEY_PEPPER`.
- Authorization, aggregate queries, and rate-limit state are all in
  PostgreSQL; no tenant data or rate-limit counter is held in application
  memory.
- Alembic owns schema changes; the container applies migrations before serving.
- `/health` checks database reachability, and Docker Compose health checks both
  services.

Start with [GETTING_STARTED.md](GETTING_STARTED.md). For legacy deployments,
use [the SQLite migration guide](docs/MIGRATING_FROM_SQLITE.md).

For a GitHub-to-hosted deployment, follow [the Render deployment guide](docs/DEPLOY_ON_RENDER.md).

## Local website and dashboard

The frontend owns the marketing landing page, authentication, and the product
dashboard as a single Next.js application. This command configures the missing
local dashboard variables without replacing any existing values and starts the
full stack at `http://localhost:8000`:

```bash
./scripts/start-local.sh
```

`/` is the landing site; `/signup`, `/login`, and `/app` are routes in that
same application. “Back to website” always returns to `/` on the current
origin.

## Load test

With the stack running, use the real Locust test:

```bash
# The normal 120-token/2-per-second bucket protects tenants. For a throughput
# measurement, start a dedicated local test stack with a larger explicit bucket.
AGENTLENS_RATE_LIMIT_CAPACITY=1000 AGENTLENS_RATE_LIMIT_REFILL_PER_SECOND=1000 \
docker compose up --build -d

docker run --rm --network agentlens_default \
  -e AGENTLENS_BASE_URL=http://api:8000 \
  -v "$PWD/loadtest:/loadtest:ro" --entrypoint locust agentlens-api \
  -f /loadtest/locustfile.py --headless --only-summary -u 10 -r 5 -t 20s \
  --host http://api:8000
```

It creates a unique project/key per simulated user. At shutdown it compares
each user's accepted event count with that key's final stats and exits nonzero
if any differ, detecting cross-tenant data exposure during concurrent traffic.
See [the recorded local result](docs/LOAD_TEST_RESULTS.md) for measured—not
estimated—numbers and the test configuration.
