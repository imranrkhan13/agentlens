export type AgentLensConfig = {
  /** A project ingestion key. Keep this in a server-only environment variable. */
  apiKey: string;
  /** AgentLens API root, without /v1. */
  baseUrl?: string;
  /** Maximum telemetry-delivery time. Provider requests never wait for it. */
  timeoutMs?: number;
};

export type GenericTelemetryEvent = {
  provider: string;
  model: string;
  latencyMs: number;
  success: boolean;
  statusCode?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  errorCategory?: string;
  retryCount?: number;
  /** Native adapters set this internally; custom tracking remains generic. */
  instrumentationType?: "native" | "generic";
};

type ActiveConfig = Required<Omit<AgentLensConfig, "baseUrl" | "timeoutMs">> & {
  baseUrl: string;
  timeoutMs: number;
};

let activeConfig: ActiveConfig | null = null;

function normalizeBaseUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("AgentLens baseUrl must use http or https.");
  }
  return parsed.toString().replace(/\/$/, "");
}

function assertServerRuntime() {
  if (typeof window !== "undefined") {
    throw new Error("AgentLens ingestion keys must only be used in server-side code, never in the browser.");
  }
}

export function init(config: AgentLensConfig) {
  assertServerRuntime();
  if (!config.apiKey.trim()) throw new Error("AgentLens init requires a project API key.");
  activeConfig = {
    apiKey: config.apiKey.trim(),
    baseUrl: normalizeBaseUrl(config.baseUrl || "http://localhost:8001"),
    timeoutMs: config.timeoutMs ?? 5_000,
  };
}

function validateEvent(event: GenericTelemetryEvent) {
  if (!event.provider.trim() || !event.model.trim()) throw new Error("AgentLens telemetry requires a provider and model.");
  if (!Number.isFinite(event.latencyMs) || event.latencyMs < 0) throw new Error("AgentLens latencyMs must be a non-negative number.");
}

async function deliver(event: GenericTelemetryEvent, config: ActiveConfig) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    await fetch(`${config.baseUrl}/v1/events`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-api-key": config.apiKey },
      body: JSON.stringify({ ...event, instrumentationType: event.instrumentationType || "generic" }),
    });
  } catch {
    // Telemetry is best-effort: it must never alter a customer's provider
    // response or replace the provider exception with an AgentLens failure.
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Report metadata for any provider or custom endpoint. It deliberately does
 * not accept prompts, completions, request bodies, headers, or credentials.
 */
export function track(event: GenericTelemetryEvent): void {
  assertServerRuntime();
  if (!activeConfig) throw new Error("Call agentlens.init() before agentlens.track().");
  validateEvent(event);
  void deliver(event, activeConfig);
}

const agentlens = { init, track };

export default agentlens;
