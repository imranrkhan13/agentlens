# AgentLens

Privacy-safe telemetry for any AI provider. AgentLens records only the metadata
you pass to `track`: it does not collect prompts, completions, request bodies,
authorization headers, or API keys.

## Install

```bash
npm install agentlens
```

## Use it on your server

```ts
import agentlens from "agentlens";

agentlens.init({
  apiKey: process.env.AGENTLENS_API_KEY!,
});

await agentlens.track({
  provider: "OpenAI",
  model: "gpt-4.1",
  latencyMs: 200,
  success: true,
});
```

`init` defaults to `http://localhost:8001`. Point it at a deployed AgentLens API
by supplying its API root (not `/v1`):

```ts
agentlens.init({
  apiKey: process.env.AGENTLENS_API_KEY!,
  endpoint: "https://api.example.com",
});
```

Named imports are supported too:

```ts
import { init, track } from "agentlens";

init({ apiKey: process.env.AGENTLENS_API_KEY! });
await track({ provider: "custom-provider", model: "model-name", latencyMs: 42, success: true });
```

`track` sends a `POST /v1/events` request using the configured project API key
in the `x-api-key` header. It returns a promise and throws `AgentLensError` for
bad configuration, timeouts, network failures, and non-success HTTP responses.
For non-2xx responses, `AgentLensHttpError` also exposes `status`,
`statusText`, `responseBody`, and `requestId`.

Keep the project key in server-side environment variables only. Do not import
or initialize this package in browser code in production. Local browser testing
is available with an explicit warning:

```ts
agentlens.init({
  apiKey: process.env.AGENTLENS_API_KEY!,
  allowBrowser: true,
});
```

Browser mode is also enabled automatically when `NODE_ENV === "development"`.
In either case the SDK emits:

```text
[AgentLens] Browser mode enabled. Do not use ingestion keys in production.
```

## Automatic provider telemetry

`init` automatically observes `fetch` calls to supported provider API hosts:
OpenAI, Anthropic, Gemini, OpenRouter, Mistral, Groq, and Ollama. Existing
calls continue to use the same URL and request body; AgentLens sends a separate
metadata-only event after the provider request completes.

- Gemini models are read from the `/models/{model}:generateContent` URL.
- OpenRouter, Mistral, Groq, OpenAI, Anthropic, and Ollama models are read from
  the request body's `model` field.
- HTTP status, latency, method, sanitized request URL, endpoint, retry count
  (zero for one directly observed fetch attempt), and error category are sent.
- Usage counts and a cost are sent only when the provider response explicitly
  includes them. AgentLens does not maintain a stale hard-coded pricing table.

Prompt content, completions, headers, raw request bodies, URL query parameters,
and credentials are never sent. If AgentLens cannot determine a model, it does
not create an automatic event. Disable the observer when needed:

```ts
agentlens.init({
  apiKey: process.env.AGENTLENS_API_KEY!,
  autoInstrumentFetch: false,
});
```

## Event fields

Required: `provider`, `model`, `latencyMs`, and `success`.

Optional: `statusCode`, `inputTokens`, `outputTokens`, `estimatedCost`,
`errorCategory`, `retryCount`, `requestUrl`, `endpoint`, `httpMethod`, and
`instrumentationType`. When a failed event omits `errorCategory`, AgentLens
derives one from the HTTP status when possible (for example, `429` becomes
`Rate Limit`).

The package copies only these fields into its HTTP payload, preventing an
accidental spread of prompts or provider request objects into telemetry.

## Build from this repository

```bash
cd packages/agentlens
npm install
npm run typecheck
npm run build
```

The build produces:

```text
dist/index.js    # ESM
dist/index.cjs   # CommonJS
dist/index.d.ts  # TypeScript declarations
```

## Verify against a local AgentLens API

Start the API at `http://localhost:8001`, sign in to the local AgentLens
dashboard, and create a project. Copy the one-time project ingestion key shown
after creation, then run the included package self-import example:

```bash
AGENTLENS_API_KEY=your_project_key npm run verify:local
```

The example imports `agentlens` by package name, initializes it, and sends a
real event. It prints the accepted HTTP status and request ID without printing
the API key.
