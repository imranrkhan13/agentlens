# AgentLens frontend

This one Next.js application serves the marketing landing page (`/`), account
pages, and the authenticated AgentLens dashboard (`/app`).

## Run locally

1. Start the local database and API from the repository root:

   ```bash
   docker compose up postgres api
   ```

2. Allow the frontend origin in the API environment. For the default Next.js port, set:

   ```env
   AGENTLENS_CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

3. Configure and run the single frontend application:

   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```

   When the repository-level `.env` already exists, the development server
   reads its server-only auth-secret and internal API-token values and derives
   the local database URL from `POSTGRES_PASSWORD`.
   Keep `BETTER_AUTH_URL=http://localhost:3000` in `frontend/.env.local` so
   browser session cookies use the address you opened.

   If another PostgreSQL server already owns the localhost database port, set
   `AGENTLENS_DATABASE_HOST` in `frontend/.env.local` to your Mac's LAN IPv4
   address (for example, `192.168.1.33`) to reach Docker's published database
   port instead.

4. Open [http://localhost:3000](http://localhost:3000). It opens the landing
   page; **Start Monitoring** takes a new user to sign-up, then `/app`.

For the Docker-based full stack, run `./scripts/start-local.sh` from the
repository root and use its one public address, [http://localhost:8000](http://localhost:8000).

If you use a different frontend port, include that exact origin in `AGENTLENS_CORS_ORIGINS` (for example, `http://localhost:3100`). When `AGENTLENS_ENV=development` and no origins are configured, the API defaults to `http://localhost:3000` and `http://localhost:5173`; production requires an explicit list.

## Current API integration

The UI reads `GET /v1/stats`, `GET /v1/events`, and `GET /v1/providers` for the connected project. Provider cards, models, recent events, and latency points are derived from stored telemetry only. A new project has no provider cards or charts until its first event arrives.

`POST /v1/events` accepts both existing snake_case fields and the public generic SDK's camelCase fields. Every event must explicitly include a provider and model; AgentLens does not inspect prompts, completions, headers, or request bodies to infer them.

The publishable universal TypeScript SDK is in `packages/agentlens`; the Python source remains in `sdk/python`. Do not place a project ingestion key in browser code while testing either package.

Set `NEXT_PUBLIC_AGENTLENS_API_URL` to the deployed API URL when hosting the app.

## Diagnosing connections

Open **Diagnostics** in the app to test any backend URL. The test checks URL format, `GET /health`, `GET /openapi.json`, and the advertised AgentLens endpoints. It records the real HTTP status, response body, request ID (when exposed), browser error, timing, CORS context, and recovery steps instead of showing a generic request error.
