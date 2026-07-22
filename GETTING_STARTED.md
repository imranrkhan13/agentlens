# Getting started

AgentLens now runs as a production-shaped, two-service stack: a stateless API
and PostgreSQL. It takes about five minutes to get a private API key and send
your first event.

## Step 1 — Start the stack

Install Docker Desktop, then create a local secrets file. The file is ignored
by Git; choose real random values even locally because the API-key pepper is
what protects database backups from offline key guessing.

```bash
cp .env.example .env
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
# Paste that output into AGENTLENS_API_KEY_PEPPER in .env.
docker compose up --build -d
docker compose ps
curl --fail http://localhost:8001/health
```

Expected final output:

```json
{"status":"ok"}
```

`docker compose up` runs Alembic before starting the API. The `/health` check
only returns `200` after the API can query PostgreSQL.

## Step 2 — Get your own key

```bash
python3 scripts/create_project.py --name "My App"
```

Expected shape (the actual ID and key will be different):

```text
✅ Your project is ready

   Project ID : 0b4d6d3c-...
   API Key    : al_...
```

Copy the API key now. AgentLens returns it once and stores only a keyed
HMAC-SHA-256 digest in PostgreSQL — it cannot recover the plaintext later.

## Step 3 — Send your first real event

```bash
curl -X POST http://localhost:8001/v1/events \
  -H "x-api-key: al_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model":"gpt-4o","latency_ms":320,"success":true}'

curl http://localhost:8001/v1/stats -H "x-api-key: al_YOUR_KEY_HERE"
```

Expected output:

```json
{"ok":true}
{"total_calls":1,"successful_calls":1,"failed_calls":0,"success_rate":100.0,"total_cost_usd":0.0,"avg_latency_ms":320.0,"total_retries":0,"detected_provider_count":1,"latest_event_at":"..."}
```

Every project gets a unique key. The API derives the project from that key;
there is no project ID parameter on the stats route to change or guess.

### Any provider or custom endpoint

AgentLens accepts metadata-only telemetry from any provider. Use the provider
and model your application actually used; no provider needs preconfiguration.

```bash
curl -X POST http://localhost:8001/v1/events \
  -H "x-api-key: al_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "internal-inference",
    "model": "reasoner-v3",
    "latencyMs": 842,
    "success": false,
    "statusCode": 429,
    "inputTokens": 120,
    "outputTokens": 40,
    "estimatedCost": 0.0042,
    "errorCategory": "rate_limit",
    "retryCount": 2
  }'
```

`GET /v1/providers` and `GET /v1/events` now show only that authenticated
project's detected providers, models, timestamps, aggregate metrics, and
event history. Prompts, completions, provider request bodies, authorization
headers, and raw API keys are never part of this event contract.

## Limits and operational behavior

Authenticated `/v1/events` and `/v1/stats` requests share a persistent,
per-key token bucket. Its default is a burst of 120 requests, replenishing at
2 requests/second. A limited request returns `429` plus `Retry-After`; one
tenant cannot consume another tenant's bucket. Configure the values in `.env`
before starting the stack.

Request logs are JSON and include `request_id`, authenticated `project_id`,
method, path, status, and duration. They never include API keys. Pass an
`X-Request-ID` header to correlate a caller's request with the log entry.

## Verify the guarantees locally

The test suite does not use SQLite or mocks. It requires an intentionally
separate database so it cannot erase development telemetry:

```bash
cd backend
export AGENTLENS_TEST_DATABASE_URL='postgresql+psycopg://agentlens:YOUR_PASSWORD@localhost:5432/agentlens_test'
pytest -q
```

If port 5432 is already occupied, set `AGENTLENS_POSTGRES_PORT` in `.env` and
use that same value in `AGENTLENS_TEST_DATABASE_URL`.

The suite migrates the test database with Alembic, then proves: hashed keys
still authenticate, limits actually return `429`, logs omit raw keys, and
eight simultaneous projects writing through the shared connection pool only
see their own statistics.

For an existing SQLite deployment, follow [the migration guide](docs/MIGRATING_FROM_SQLITE.md).

## Production deployment

The provided `Dockerfile` works on any Docker-compatible platform. Render is a
good first target because it provides a managed PostgreSQL database and HTTP
health checks. Configure `AGENTLENS_DATABASE_URL` from its managed Postgres
connection string, generate a new `AGENTLENS_API_KEY_PEPPER` in the platform's
secret store, and set `/health` as the service health-check path. Do not reuse
the local `.env` pepper in production. A real deployment requires an account
and deployment credentials, which are intentionally not included in this
repository.
