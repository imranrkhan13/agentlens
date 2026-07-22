/**
 * Privacy-safe telemetry for any AI provider. This SDK deliberately accepts
 * metadata only: prompts, completions, request bodies, headers, and secrets
 * are never part of the telemetry payload.
 */

import {
  extractProviderResponseUsage,
  inferErrorCategory,
  inspectProviderRequest,
  sanitizeRequestUrl,
} from "./provider-inference.js";

const DEFAULT_ENDPOINT = "http://localhost:8001";
const DEFAULT_TIMEOUT_MS = 5_000;

export type InstrumentationType = "native" | "generic";

export interface AgentLensConfig {
  /** A project ingestion key. Keep it in a server-side environment variable. */
  apiKey: string;
  /** AgentLens API root, without `/v1`. Defaults to http://localhost:8001. */
  endpoint?: string;
  /** Maximum time to wait for the AgentLens ingestion API. Defaults to 5000 ms. */
  timeoutMs?: number;
  /**
   * Allow browser telemetry during local development. Never enable this in
   * production because project ingestion keys must remain server-side.
   */
  allowBrowser?: boolean;
  /** Observe supported provider fetch calls without changing their call sites. Defaults to true. */
  autoInstrumentFetch?: boolean;
}

export interface TelemetryEvent {
  /** The provider reported by your SDK or custom model endpoint. */
  provider: string;
  /** The model reported by your SDK or custom model endpoint. */
  model: string;
  latencyMs: number;
  success: boolean;
  statusCode?: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  errorCategory?: string;
  retryCount?: number;
  /** Sanitized provider request URL. Query parameters and fragments are removed. */
  requestUrl?: string;
  /** Provider API origin or explicitly reported endpoint. */
  endpoint?: string;
  /** HTTP method used for the provider call. */
  httpMethod?: string;
  /** Use `generic` for custom telemetry. Native adapters set this themselves. */
  instrumentationType?: InstrumentationType;
}

export interface TelemetryDelivery {
  /** HTTP status returned by the ingestion API. */
  status: number;
  /** AgentLens request ID, when the API returned one. */
  requestId?: string;
}

export class AgentLensError extends Error {
  override readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "AgentLensError";
    this.cause = options?.cause;
  }
}

export class AgentLensHttpError extends AgentLensError {
  readonly status: number;
  readonly statusText: string;
  readonly responseBody: string;
  readonly requestId?: string;

  constructor(options: {
    url: string;
    status: number;
    statusText: string;
    responseBody: string;
    requestId?: string;
  }) {
    const responseSummary = options.responseBody
      ? ` Response: ${options.responseBody}`
      : " The server did not provide a response body.";
    const requestId = options.requestId ? ` Request ID: ${options.requestId}.` : "";
    super(
      `AgentLens telemetry request failed: POST ${options.url} returned ${options.status} ${options.statusText}.${responseSummary}${requestId}`,
    );
    this.name = "AgentLensHttpError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.responseBody = options.responseBody;
    this.requestId = options.requestId;
  }
}

type ActiveConfig = {
  apiKey: string;
  endpoint: string;
  timeoutMs: number;
  allowBrowser: boolean;
  autoInstrumentFetch: boolean;
};

type EventPayload = {
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
  requestUrl?: string;
  endpoint?: string;
  httpMethod?: string;
  instrumentationType: InstrumentationType;
};

let activeConfig: ActiveConfig | undefined;
let originalFetch: typeof globalThis.fetch | undefined;
let instrumentedFetch: typeof globalThis.fetch | undefined;

function isDevelopmentRuntime(): boolean {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: { NODE_ENV?: string } };
  };
  return runtime.process?.env?.NODE_ENV === "development";
}

function assertServerRuntime(allowBrowser = false, warnInBrowser = false): void {
  if (typeof window !== "undefined") {
    if (allowBrowser || isDevelopmentRuntime()) {
      if (warnInBrowser) {
        console.warn("[AgentLens] Browser mode enabled. Do not use ingestion keys in production.");
      }
    } else {
      throw new AgentLensError(
        "AgentLens ingestion keys must only be used in server-side code, never in browser code.",
      );
    }
  }

  if (typeof globalThis.fetch !== "function") {
    throw new AgentLensError(
      "AgentLens requires a Fetch implementation. Use Node.js 18 or newer, or provide a compatible global fetch.",
    );
  }
}

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AgentLensError(`AgentLens ${name} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeEndpoint(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (cause) {
    throw new AgentLensError(
      "AgentLens endpoint must be a valid absolute http or https URL, for example http://localhost:8001.",
      { cause },
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AgentLensError("AgentLens endpoint must use the http or https protocol.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new AgentLensError("AgentLens endpoint must be a plain API root URL without credentials, query parameters, or a hash.");
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (pathname === "/v1" || pathname.endsWith("/v1")) {
    throw new AgentLensError(
      "AgentLens endpoint must be the API root, not a /v1 URL. Use http://localhost:8001 instead of http://localhost:8001/v1.",
    );
  }

  parsed.pathname = pathname || "/";
  return parsed.toString().replace(/\/$/, "");
}

function assertPositiveTimeout(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new AgentLensError("AgentLens timeoutMs must be a positive finite number.");
  }
  return value;
}

function readOptionalBoolean(value: unknown, name: string, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (typeof value !== "boolean") {
    throw new AgentLensError(`AgentLens ${name} must be a boolean when supplied.`);
  }
  return value;
}

/** Configure the process-wide AgentLens telemetry client. */
export function init(config: AgentLensConfig): void {
  assertServerRuntime(config?.allowBrowser === true, true);
  if (!config || typeof config !== "object") {
    throw new AgentLensError("AgentLens init requires a configuration object.");
  }

  activeConfig = {
    apiKey: readRequiredString(config.apiKey, "apiKey"),
    endpoint: normalizeEndpoint(config.endpoint ?? DEFAULT_ENDPOINT),
    timeoutMs: config.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : assertPositiveTimeout(config.timeoutMs),
    allowBrowser: readOptionalBoolean(config.allowBrowser, "allowBrowser", false),
    autoInstrumentFetch: readOptionalBoolean(config.autoInstrumentFetch, "autoInstrumentFetch", true),
  };
  installFetchInstrumentation();
}

function assertFiniteNumber(value: unknown, name: string, minimum = 0): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new AgentLensError(`AgentLens ${name} must be a finite number greater than or equal to ${minimum}.`);
  }
}

function assertOptionalInteger(value: unknown, name: string, minimum = 0): void {
  if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < minimum)) {
    throw new AgentLensError(`AgentLens ${name} must be an integer greater than or equal to ${minimum}.`);
  }
}

function normalizeOptionalRequestUrl(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new AgentLensError(`AgentLens ${name} must be a non-empty http or https URL when supplied.`);
  }
  const sanitized = sanitizeRequestUrl(value.trim());
  if (!sanitized) {
    throw new AgentLensError(`AgentLens ${name} must be a valid http or https URL when supplied.`);
  }
  return sanitized;
}

function normalizeOptionalEndpoint(value: unknown): string | undefined {
  const sanitized = normalizeOptionalRequestUrl(value, "endpoint");
  return sanitized?.replace(/\/$/, "");
}

function normalizeOptionalHttpMethod(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^[A-Za-z]+$/.test(value.trim())) {
    throw new AgentLensError("AgentLens httpMethod must contain only HTTP method letters when supplied.");
  }
  return value.trim().toUpperCase();
}

function buildPayload(event: TelemetryEvent): EventPayload {
  if (!event || typeof event !== "object") {
    throw new AgentLensError("AgentLens track requires a telemetry event object.");
  }

  const provider = readRequiredString(event.provider, "telemetry provider");
  const model = readRequiredString(event.model, "telemetry model");
  assertFiniteNumber(event.latencyMs, "latencyMs");

  if (typeof event.success !== "boolean") {
    throw new AgentLensError("AgentLens success must be a boolean.");
  }
  if (event.statusCode !== undefined && (!Number.isInteger(event.statusCode) || event.statusCode < 100 || event.statusCode > 599)) {
    throw new AgentLensError("AgentLens statusCode must be an integer between 100 and 599.");
  }
  if (event.inputTokens !== undefined) assertOptionalInteger(event.inputTokens, "inputTokens");
  if (event.outputTokens !== undefined) assertOptionalInteger(event.outputTokens, "outputTokens");
  if (event.retryCount !== undefined) assertOptionalInteger(event.retryCount, "retryCount");
  if (event.estimatedCost !== undefined) assertFiniteNumber(event.estimatedCost, "estimatedCost");

  if (event.errorCategory !== undefined && (typeof event.errorCategory !== "string" || !event.errorCategory.trim())) {
    throw new AgentLensError("AgentLens errorCategory must be a non-empty string when supplied.");
  }
  if (event.instrumentationType !== undefined && event.instrumentationType !== "native" && event.instrumentationType !== "generic") {
    throw new AgentLensError("AgentLens instrumentationType must be either native or generic.");
  }

  const requestUrl = normalizeOptionalRequestUrl(event.requestUrl, "requestUrl");
  const endpoint = normalizeOptionalEndpoint(event.endpoint) ?? (requestUrl ? new URL(requestUrl).origin : undefined);
  const httpMethod = normalizeOptionalHttpMethod(event.httpMethod);
  const errorCategory = event.errorCategory?.trim() ?? (!event.success ? inferErrorCategory(event.statusCode) : undefined);

  // Copy only supported metadata, so arbitrary request objects cannot leak
  // prompts, completions, authorization headers, or provider request bodies.
  return {
    provider,
    model,
    latencyMs: event.latencyMs,
    success: event.success,
    ...(event.statusCode === undefined ? {} : { statusCode: event.statusCode }),
    ...(event.inputTokens === undefined ? {} : { inputTokens: event.inputTokens }),
    ...(event.outputTokens === undefined ? {} : { outputTokens: event.outputTokens }),
    ...(event.estimatedCost === undefined ? {} : { estimatedCost: event.estimatedCost }),
    ...(errorCategory === undefined ? {} : { errorCategory }),
    ...(event.retryCount === undefined ? {} : { retryCount: event.retryCount }),
    ...(requestUrl === undefined ? {} : { requestUrl }),
    ...(endpoint === undefined ? {} : { endpoint }),
    ...(httpMethod === undefined ? {} : { httpMethod }),
    instrumentationType: event.instrumentationType ?? "generic",
  };
}

function elapsedMilliseconds(startedAt: number): number {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  return Math.max(0, now - startedAt);
}

function startTimestamp(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function isAgentLensIngestionRequest(requestUrl: string, config: ActiveConfig): boolean {
  return sanitizeRequestUrl(requestUrl) === sanitizeRequestUrl(`${config.endpoint}/v1/events`);
}

async function readResponseUsage(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return {};
  try {
    return extractProviderResponseUsage(await response.clone().json());
  } catch {
    // The provider response remains untouched; usage metadata is optional.
    return {};
  }
}

function reportAutomaticTelemetry(event: TelemetryEvent, config: ActiveConfig): void {
  try {
    void deliver(buildPayload(event), config).catch((error: unknown) => {
      console.warn("[AgentLens] Automatic telemetry delivery failed.", error);
    });
  } catch (error) {
    console.warn("[AgentLens] Automatic telemetry enrichment failed.", error);
  }
}

function installFetchInstrumentation(): void {
  if (!activeConfig?.autoInstrumentFetch || instrumentedFetch || typeof globalThis.fetch !== "function") return;

  originalFetch = globalThis.fetch.bind(globalThis);
  instrumentedFetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const config = activeConfig;
    const metadata = config ? inspectProviderRequest(input, init) : undefined;
    if (!config || !metadata || !metadata.model || isAgentLensIngestionRequest(metadata.requestUrl, config)) {
      return originalFetch!(input, init);
    }

    const startedAt = startTimestamp();
    try {
      const response = await originalFetch!(input, init);
      void readResponseUsage(response)
        .then((usage) => {
          reportAutomaticTelemetry(
            {
              provider: metadata.provider,
              model: metadata.model!,
              latencyMs: elapsedMilliseconds(startedAt),
              success: response.ok,
              statusCode: response.status,
              retryCount: 0,
              requestUrl: metadata.requestUrl,
              endpoint: metadata.endpoint,
              httpMethod: metadata.httpMethod,
              ...usage,
              instrumentationType: "native",
            },
            config,
          );
        })
        .catch((error: unknown) => {
          console.warn("[AgentLens] Automatic telemetry enrichment failed.", error);
        });
      return response;
    } catch (error) {
      reportAutomaticTelemetry(
        {
          provider: metadata.provider,
          model: metadata.model,
          latencyMs: elapsedMilliseconds(startedAt),
          success: false,
          errorCategory: inferErrorCategory(undefined, error),
          retryCount: 0,
          requestUrl: metadata.requestUrl,
          endpoint: metadata.endpoint,
          httpMethod: metadata.httpMethod,
          instrumentationType: "native",
        },
        config,
      );
      throw error;
    }
  }) as typeof globalThis.fetch;

  try {
    globalThis.fetch = instrumentedFetch;
  } catch (cause) {
    originalFetch = undefined;
    instrumentedFetch = undefined;
    throw new AgentLensError("AgentLens could not install automatic fetch instrumentation in this runtime.", { cause });
  }
}

async function readResponseBody(response: Response): Promise<string> {
  const body = await response.text();
  const limit = 2_000;
  return body.length > limit ? `${body.slice(0, limit)}… [truncated]` : body;
}

async function deliver(payload: EventPayload, config: ActiveConfig): Promise<TelemetryDelivery> {
  const url = `${config.endpoint}/v1/events`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    let response: Response;
    try {
      response = await globalThis.fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": config.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (cause) {
      if (controller.signal.aborted) {
        throw new AgentLensError(`AgentLens telemetry request timed out after ${config.timeoutMs} ms while posting to ${url}.`, { cause });
      }
      throw new AgentLensError(`AgentLens could not reach ${url}. Verify the endpoint and network connection.`, { cause });
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;
    if (!response.ok) {
      throw new AgentLensHttpError({
        url,
        status: response.status,
        statusText: response.statusText || "Unknown status",
        responseBody: await readResponseBody(response),
        requestId,
      });
    }

    return { status: response.status, requestId };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Send metadata for any AI provider or custom model endpoint.
 *
 * This function returns a promise and rejects with a descriptive AgentLensError
 * when delivery cannot be completed. Await it (or explicitly handle the
 * promise) when recording telemetry is part of your application's workflow.
 */
export async function track(event: TelemetryEvent): Promise<TelemetryDelivery> {
  assertServerRuntime(activeConfig?.allowBrowser ?? false);
  if (!activeConfig) {
    throw new AgentLensError("Call agentlens.init() before agentlens.track().");
  }
  return deliver(buildPayload(event), activeConfig);
}

const agentlens = { init, track };

export default agentlens;
