export const FRONTEND_VERSION = "0.1.0";
export const CONNECTION_TIMEOUT_MS = 10_000;

export type DiagnosticCategory =
  | "connected"
  | "invalid_url"
  | "cors"
  | "dns"
  | "connection_refused"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server_error"
  | "network";

export type ApiKeyDiagnostic = {
  prefix: string | null;
  headerSent: boolean;
  looksValid: boolean;
};

export type RequestDiagnostic = {
  category: DiagnosticCategory;
  title: string;
  summary: string;
  suggestions: string[];
  requestUrl: string;
  method: string;
  status: number | null;
  statusText: string | null;
  responseBody: string | null;
  browserError: string | null;
  durationMs: number;
  timestamp: string;
  requestId: string | null;
  currentOrigin: string | null;
  allowedOrigin: string | null;
  apiKey: ApiKeyDiagnostic;
};

export type InspectedResponse = {
  ok: boolean;
  diagnostic: RequestDiagnostic;
  bodyText: string | null;
  responseJson: unknown | null;
};

export type EndpointExpectation = {
  method: "GET" | "POST";
  path: string;
  label: string;
  required: boolean;
  weight: number;
};

export type ConnectionCheck = {
  id: string;
  label: string;
  status: "passed" | "failed" | "warning" | "skipped";
  message: string;
  durationMs?: number;
  diagnostic?: RequestDiagnostic;
  expected?: EndpointExpectation;
};

export type ConnectionDiagnosticsReport = {
  baseUrl: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  overallStatus: "connected" | "degraded" | "failed";
  compatibility: number;
  health: InspectedResponse | null;
  openApi: InspectedResponse | null;
  apiVersion: string | null;
  availableEndpoints: string[];
  missingEndpoints: EndpointExpectation[];
  checks: ConnectionCheck[];
  currentOrigin: string | null;
  browser: string;
  environment: string;
};

export type BackendUrlGuidance = {
  kind: "frontend_host" | "local" | "hosted" | "unknown";
  host: string | null;
  title: string;
  description: string;
  steps: string[];
};

export class AgentLensApiError extends Error {
  constructor(public diagnostic: RequestDiagnostic) {
    super(diagnostic.summary);
    this.name = "AgentLensApiError";
  }
}

export const expectedEndpoints: EndpointExpectation[] = [
  { method: "POST", path: "/v1/account/projects", label: "Create account-owned projects", required: true, weight: 20 },
  { method: "POST", path: "/v1/events", label: "Ingest events", required: true, weight: 20 },
  { method: "GET", path: "/v1/stats", label: "Read aggregate stats", required: true, weight: 20 },
  { method: "GET", path: "/v1/account/projects", label: "List account-owned projects", required: false, weight: 7 },
  { method: "GET", path: "/v1/events", label: "Browse event history", required: true, weight: 10 },
  { method: "GET", path: "/v1/providers", label: "Read detected providers", required: true, weight: 10 },
];

function currentOrigin() {
  return typeof window === "undefined" ? null : window.location.origin;
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

function clipBody(body: string) {
  return body.length > 12_000 ? `${body.slice(0, 12_000)}\n\n… Response truncated after 12 KB.` : body;
}

function tryJson(body: string | null) {
  if (!body) return null;
  try { return JSON.parse(body) as unknown; } catch { return null; }
}

function apiKeyInfo(apiKey?: string): ApiKeyDiagnostic {
  const value = apiKey?.trim() || "";
  return {
    prefix: value ? `${value.slice(0, Math.min(7, value.length))}${value.length > 7 ? "…" : ""}` : null,
    headerSent: Boolean(value),
    looksValid: value.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(value),
  };
}

function browserEnvironment() {
  if (typeof window === "undefined") return { browser: "Unavailable during server rendering", environment: "server" };
  const host = window.location.hostname;
  return {
    browser: navigator.userAgent,
    environment: host === "localhost" || host === "127.0.0.1" ? "local development" : "deployed browser app",
  };
}

export function normalizeApiBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, normalized: trimmed, reason: "Use an http:// or https:// backend URL." };
    }
    return { valid: true, normalized: parsed.toString().replace(/\/$/, ""), reason: null };
  } catch {
    return { valid: false, normalized: trimmed, reason: "This is not a valid URL. Include the protocol, for example https://api.example.com." };
  }
}

export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function backendUrlGuidance(value: string): BackendUrlGuidance {
  const validation = normalizeApiBaseUrl(value);
  if (!validation.valid) return {
    kind: "unknown",
    host: null,
    title: "Enter an API service URL",
    description: "Use the root URL of the service running FastAPI, including https:// or http://.",
    steps: ["For Docker on this computer, use http://localhost:8001.", "For a hosted API, use the service URL from Render, Railway, Fly, or your API domain."],
  };

  const host = new URL(validation.normalized).hostname;
  if (host.endsWith(".netlify.app") || host.endsWith(".vercel.app") || host.endsWith(".github.io")) return {
    kind: "frontend_host",
    host,
    title: "This looks like a frontend hosting URL",
    description: `${host} matches a frontend-hosting domain. It can be an API only when it explicitly proxies /health, /openapi.json, and /v1/* to a FastAPI service.`,
    steps: ["Deploy the FastAPI backend as a web service (for example on Render or Railway).", "Set AGENTLENS_CORS_ORIGINS to this dashboard's origin on that service.", "Paste the backend service root here—not the Netlify or Vercel frontend URL."],
  };
  if (host === "localhost" || host === "127.0.0.1") return {
    kind: "local",
    host,
    title: "Local AgentLens backend",
    description: "This is the expected setup while the frontend and Docker API run on the same computer.",
    steps: ["Start the API with docker compose up -d api.", "Keep AGENTLENS_CORS_ORIGINS set to the exact dashboard origin.", "Run the connection test before adding or reusing a key."],
  };
  return {
    kind: "hosted",
    host,
    title: "Hosted backend candidate",
    description: "We will verify that this host exposes the AgentLens health check and OpenAPI contract before treating it as connected.",
    steps: ["The service must expose /health and /openapi.json.", "Set AGENTLENS_CORS_ORIGINS to the exact dashboard origin.", "Use this service root without /v1/stats or another endpoint suffix."],
  };
}

export function canUseBackendReport(report: ConnectionDiagnosticsReport | null) {
  return report?.overallStatus === "connected" || report?.overallStatus === "degraded";
}

function detailsForStatus(status: number, url: string, method: string, body: string | null, apiKey?: string): Pick<RequestDiagnostic, "category" | "title" | "summary" | "suggestions"> {
  const path = (() => { try { return new URL(url).pathname; } catch { return url; } })();
  if (status === 401) return {
    category: "unauthorized",
    title: "401 Unauthorized",
    summary: "The backend rejected the supplied API key.",
    suggestions: ["Generate a new project key if this key was revoked.", "Verify that the x-api-key header is sent with the request.", "Ensure the key belongs to a project on this backend."],
  };
  if (status === 403) return {
    category: "forbidden",
    title: "403 Forbidden",
    summary: "The backend understood the request but your key or deployment policy does not permit it.",
    suggestions: ["Check project permissions and any gateway or reverse-proxy policy.", "Confirm this backend accepts the supplied API key.", "Review backend access-control logs for this request."],
  };
  if (status === 404) return {
    category: "not_found",
    title: "404 Not Found",
    summary: `The frontend requested an endpoint that does not exist: ${method} ${path}.`,
    suggestions: ["Check that the base URL points to the API root, not a dashboard or docs page.", "Check for a backend/frontend version mismatch.", "Confirm this deployment exposes the expected AgentLens API routes."],
  };
  if (status === 422) return {
    category: "validation",
    title: "422 Validation Error",
    summary: "The backend received the request but rejected one or more fields.",
    suggestions: ["Inspect the validation fields below.", "Confirm the request payload matches this backend's OpenAPI schema.", "Update either the frontend or backend if their schemas differ."],
  };
  if (status >= 500) return {
    category: "server_error",
    title: `${status} Server Error`,
    summary: "The backend failed while processing the request.",
    suggestions: ["Check the backend logs using the request ID below, if present.", "Check database, provider, and deployment health.", "Review the response body or stack trace for the immediate cause."],
  };
  return {
    category: "network",
    title: `HTTP ${status}`,
    summary: body || "The backend returned an unexpected HTTP response.",
    suggestions: ["Inspect the HTTP status and response body below.", "Compare the deployed API with the OpenAPI contract."],
  };
}

function detailsForBrowserError(error: unknown, url: string, method: string, durationMs: number, apiKey?: string): Pick<RequestDiagnostic, "category" | "title" | "summary" | "suggestions"> {
  const message = formatError(error);
  const normalized = message.toLowerCase();
  const origin = currentOrigin();
  const crossOrigin = origin ? (() => { try { return new URL(url).origin !== origin; } catch { return false; } })() : false;
  if (normalized.includes("abort") || durationMs >= CONNECTION_TIMEOUT_MS) return {
    category: "timeout",
    title: "Connection timed out",
    summary: `No response arrived within ${CONNECTION_TIMEOUT_MS / 1000} seconds.`,
    suggestions: ["Check whether the backend is overloaded or starting up.", "Check the network path and reverse-proxy timeout.", "Try the backend URL directly from this browser."],
  };
  if (/(name_not_resolved|dns|resolve host|name resolution|host not found)/.test(normalized)) return {
    category: "dns",
    title: "DNS Error",
    summary: "Unable to resolve host.",
    suggestions: ["Verify the domain and spelling.", "Check DNS propagation and deployment records.", "Try the backend's canonical deployment URL."],
  };
  if (/(connection refused|err_connection_refused|econnrefused)/.test(normalized)) return {
    category: "connection_refused",
    title: "Connection refused",
    summary: "Nothing is listening on this host and port.",
    suggestions: ["Confirm the backend process or Docker container is running.", "Check that the port is correct.", "For local development, try the expected URL such as http://localhost:8001."],
  };
  if (crossOrigin) return {
    category: "cors",
    title: "CORS / browser block",
    summary: "This browser could not read the cross-origin response. This is commonly caused by the backend not returning Access-Control-Allow-Origin for this frontend.",
    suggestions: [
      `Set AGENTLENS_CORS_ORIGINS=${origin} on the backend.`,
      "Restart or redeploy the backend after changing the environment variable.",
      "If CORS is already configured, verify the URL is reachable and the exact origin (including port) matches.",
    ],
  };
  return {
    category: "network",
    title: "Network request failed",
    summary: "The browser could not complete this request and did not expose an HTTP response.",
    suggestions: ["Check that the backend is running and the URL is correct.", "Check the browser error and network connection below.", "If this is cross-origin, configure CORS on the backend."],
  };
}

function makeInvalidUrlDiagnostic(baseUrl: string, method: string, apiKey?: string): RequestDiagnostic {
  const validation = normalizeApiBaseUrl(baseUrl);
  return {
    category: "invalid_url",
    title: "Invalid backend URL",
    summary: validation.reason || "Enter a complete HTTP(S) URL.",
    suggestions: ["Include http:// or https://.", "Enter the API base URL, for example http://localhost:8001 or https://api.example.com."],
    requestUrl: baseUrl,
    method,
    status: null,
    statusText: null,
    responseBody: null,
    browserError: null,
    durationMs: 0,
    timestamp: new Date().toISOString(),
    requestId: null,
    currentOrigin: currentOrigin(),
    allowedOrigin: null,
    apiKey: apiKeyInfo(apiKey),
  };
}

export async function inspectApiRequest({
  baseUrl,
  path,
  method = "GET",
  apiKey,
  body,
  headers,
  timeoutMs = CONNECTION_TIMEOUT_MS,
}: {
  baseUrl: string;
  path: string;
  method?: string;
  apiKey?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
  timeoutMs?: number;
}): Promise<InspectedResponse> {
  const validation = normalizeApiBaseUrl(baseUrl);
  if (!validation.valid) return { ok: false, diagnostic: makeInvalidUrlDiagnostic(baseUrl, method, apiKey), bodyText: null, responseJson: null };
  const requestUrl = buildApiUrl(validation.normalized, path);
  const startedAt = new Date();
  const started = performance.now();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(requestUrl, {
      method,
      body,
      signal: controller.signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(apiKey ? { "x-api-key": apiKey } : {}),
        ...headers,
      },
    });
    const bodyText = clipBody(await response.text());
    const durationMs = Math.round(performance.now() - started);
    const requestId = response.headers.get("x-request-id") || response.headers.get("x-correlation-id") || response.headers.get("request-id");
    const responseDetails = response.ok
      ? { category: "connected" as const, title: "Connected", summary: "The backend returned a successful HTTP response.", suggestions: [] }
      : detailsForStatus(response.status, requestUrl, method, bodyText || null, apiKey);
    const diagnostic: RequestDiagnostic = {
      ...responseDetails,
      requestUrl,
      method,
      status: response.status,
      statusText: response.statusText || null,
      responseBody: bodyText || null,
      browserError: null,
      durationMs,
      timestamp: startedAt.toISOString(),
      requestId,
      currentOrigin: currentOrigin(),
      allowedOrigin: response.headers.get("access-control-allow-origin"),
      apiKey: apiKeyInfo(apiKey),
    };
    return { ok: response.ok, diagnostic, bodyText: bodyText || null, responseJson: tryJson(bodyText) };
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    const details = detailsForBrowserError(error, requestUrl, method, durationMs, apiKey);
    return {
      ok: false,
      diagnostic: {
        ...details,
        requestUrl,
        method,
        status: null,
        statusText: null,
        responseBody: null,
        browserError: formatError(error),
        durationMs,
        timestamp: startedAt.toISOString(),
        requestId: null,
        currentOrigin: currentOrigin(),
        allowedOrigin: null,
        apiKey: apiKeyInfo(apiKey),
      },
      bodyText: null,
      responseJson: null,
    };
  } finally {
    window.clearTimeout(timer);
  }
}

function endpointExists(document: Record<string, unknown>, expectation: EndpointExpectation) {
  const paths = document.paths;
  if (!paths || typeof paths !== "object") return false;
  const pathItem = (paths as Record<string, unknown>)[expectation.path];
  return Boolean(pathItem && typeof pathItem === "object" && (pathItem as Record<string, unknown>)[expectation.method.toLowerCase()]);
}

function availableEndpointList(document: Record<string, unknown>) {
  const paths = document.paths;
  if (!paths || typeof paths !== "object") return [];
  return Object.entries(paths as Record<string, unknown>).flatMap(([path, pathItem]) => {
    if (!pathItem || typeof pathItem !== "object") return [];
    return Object.keys(pathItem as Record<string, unknown>)
      .filter((method) => ["get", "post", "put", "patch", "delete", "head", "options"].includes(method.toLowerCase()))
      .map((method) => `${method.toUpperCase()} ${path}`);
  }).sort();
}

export async function runConnectionDiagnostics(baseUrl: string): Promise<ConnectionDiagnosticsReport> {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const validation = normalizeApiBaseUrl(baseUrl);
  const environment = browserEnvironment();
  if (!validation.valid) {
    const diagnostic = makeInvalidUrlDiagnostic(baseUrl, "GET");
    return {
      baseUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: 0,
      overallStatus: "failed",
      compatibility: 0,
      health: null,
      openApi: null,
      apiVersion: null,
      availableEndpoints: [],
      missingEndpoints: [],
      checks: [{ id: "url", label: "Backend URL format", status: "failed", message: diagnostic.summary, diagnostic }],
      currentOrigin: currentOrigin(),
      browser: environment.browser,
      environment: environment.environment,
    };
  }

  const [health, openApi] = await Promise.all([
    inspectApiRequest({ baseUrl: validation.normalized, path: "/health" }),
    inspectApiRequest({ baseUrl: validation.normalized, path: "/openapi.json" }),
  ]);
  const document = openApi.ok && openApi.responseJson && typeof openApi.responseJson === "object" && !Array.isArray(openApi.responseJson)
    ? openApi.responseJson as Record<string, unknown>
    : null;
  const apiVersion = document && document.info && typeof document.info === "object" && typeof (document.info as Record<string, unknown>).version === "string"
    ? (document.info as Record<string, unknown>).version as string
    : null;
  const missingEndpoints = document ? expectedEndpoints.filter((endpoint) => !endpointExists(document, endpoint)) : [];
  const checks: ConnectionCheck[] = [
    { id: "url", label: "Backend URL format", status: "passed", message: "URL is a valid HTTP(S) API base URL." },
    {
      id: "health",
      label: "Health endpoint reachable",
      status: health.ok ? "passed" : "failed",
      message: health.ok ? "GET /health returned successfully." : health.diagnostic.summary,
      durationMs: health.diagnostic.durationMs,
      diagnostic: health.ok ? undefined : health.diagnostic,
    },
    {
      id: "openapi",
      label: "OpenAPI contract loaded",
      status: document ? "passed" : "failed",
      message: document ? "GET /openapi.json returned a readable API contract." : openApi.diagnostic.summary,
      durationMs: openApi.diagnostic.durationMs,
      diagnostic: document ? undefined : openApi.diagnostic,
    },
    ...expectedEndpoints.map((endpoint): ConnectionCheck => {
      if (!document) return { id: `${endpoint.method}-${endpoint.path}`, label: `${endpoint.method} ${endpoint.path}`, status: "skipped", message: "OpenAPI could not be loaded, so this endpoint could not be verified.", expected: endpoint };
      const exists = endpointExists(document, endpoint);
      return {
        id: `${endpoint.method}-${endpoint.path}`,
        label: `${endpoint.method} ${endpoint.path}`,
        status: exists ? "passed" : endpoint.required ? "failed" : "warning",
        message: exists ? `${endpoint.label} is advertised by this backend.` : `${endpoint.label} is not advertised by this backend.`,
        expected: endpoint,
      };
    }),
  ];
  const totalWeight = 10 + 15 + expectedEndpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  const earnedWeight = 10 + (health.ok ? 15 : 0) + (document ? expectedEndpoints.filter((endpoint) => !missingEndpoints.includes(endpoint)).reduce((sum, endpoint) => sum + endpoint.weight, 0) : 0);
  const compatibility = Math.round((earnedWeight / totalWeight) * 100);
  const requiredMissing = missingEndpoints.some((endpoint) => endpoint.required);
  const overallStatus = health.ok && document && !requiredMissing ? (missingEndpoints.length ? "degraded" : "connected") : "failed";
  return {
    baseUrl: validation.normalized,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    overallStatus,
    compatibility,
    health,
    openApi,
    apiVersion,
    availableEndpoints: document ? availableEndpointList(document) : [],
    missingEndpoints,
    checks,
    currentOrigin: currentOrigin(),
    browser: environment.browser,
    environment: environment.environment,
  };
}

export function isAgentLensApiError(error: unknown): error is AgentLensApiError {
  return error instanceof AgentLensApiError;
}

export function validationIssues(body: string | null) {
  const parsed = tryJson(body);
  if (!parsed || typeof parsed !== "object") return [] as Array<{ field: string; message: string }>;
  const detail = (parsed as Record<string, unknown>).detail;
  if (!Array.isArray(detail)) return [];
  return detail.map((item) => {
    if (!item || typeof item !== "object") return { field: "Request", message: String(item) };
    const entry = item as Record<string, unknown>;
    const location = Array.isArray(entry.loc) ? entry.loc.join(".") : "Request";
    return { field: location, message: typeof entry.msg === "string" ? entry.msg : JSON.stringify(entry) };
  });
}
