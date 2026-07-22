export type ObservedProvider = "OpenAI" | "Anthropic" | "Gemini" | "OpenRouter" | "Mistral" | "Groq" | "Ollama";

export type ProviderRequestMetadata = {
  provider: ObservedProvider;
  model?: string;
  requestUrl: string;
  endpoint: string;
  httpMethod: string;
};

export type ProviderResponseUsage = {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
};

type JsonObject = Record<string, unknown>;

const PROVIDER_HOSTS: Array<{ provider: ObservedProvider; matches: (hostname: string) => boolean }> = [
  { provider: "Gemini", matches: (hostname) => hostname === "generativelanguage.googleapis.com" },
  { provider: "OpenRouter", matches: (hostname) => hostname === "openrouter.ai" || hostname.endsWith(".openrouter.ai") },
  { provider: "Mistral", matches: (hostname) => hostname === "api.mistral.ai" || hostname.endsWith(".mistral.ai") },
  { provider: "Groq", matches: (hostname) => hostname === "api.groq.com" || hostname.endsWith(".groq.com") },
  { provider: "OpenAI", matches: (hostname) => hostname === "api.openai.com" || hostname.endsWith(".openai.com") },
  { provider: "Anthropic", matches: (hostname) => hostname === "api.anthropic.com" || hostname.endsWith(".anthropic.com") },
  { provider: "Ollama", matches: (hostname) => hostname === "localhost" || hostname === "127.0.0.1" },
];

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

function asNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function asNonNegativeInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function urlFromFetchInput(input: RequestInfo | URL): { url: string; method?: string } | undefined {
  if (typeof input === "string") return { url: input };
  if (input instanceof URL) return { url: input.href };
  if (typeof Request !== "undefined" && input instanceof Request) {
    return { url: input.url, method: input.method };
  }
  return undefined;
}

function readBodyModel(body: BodyInit | null | undefined): string | undefined {
  if (typeof body !== "string") return undefined;
  try {
    const payload = asObject(JSON.parse(body));
    const model = payload?.model;
    return typeof model === "string" && model.trim() ? model.trim() : undefined;
  } catch {
    return undefined;
  }
}

function geminiModelFromPath(pathname: string): string | undefined {
  const match = pathname.match(/\/models\/([^/:]+)(?::[^/]*)?$/);
  if (!match?.[1]) return undefined;
  try {
    const model = decodeURIComponent(match[1]).trim();
    return model || undefined;
  } catch {
    return undefined;
  }
}

/** Return a sanitized HTTP URL with credentials, query parameters, and fragments removed. */
export function sanitizeRequestUrl(value: string): string | undefined {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return undefined;
  }
}

/** Detect a supported provider endpoint and extract metadata without retaining the request body. */
export function inspectProviderRequest(input: RequestInfo | URL, init?: RequestInit): ProviderRequestMetadata | undefined {
  const request = urlFromFetchInput(input);
  if (!request) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(request.url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;

  const provider = PROVIDER_HOSTS.find((candidate) => candidate.matches(parsed.hostname))?.provider;
  if (!provider) return undefined;
  if (provider === "Ollama" && !parsed.pathname.startsWith("/api/")) return undefined;

  const requestUrl = sanitizeRequestUrl(parsed.href);
  if (!requestUrl) return undefined;
  const httpMethod = (init?.method ?? request.method ?? "GET").toUpperCase();
  const model = provider === "Gemini" ? geminiModelFromPath(parsed.pathname) : readBodyModel(init?.body);

  return {
    provider,
    model,
    requestUrl,
    endpoint: parsed.origin,
    httpMethod,
  };
}

/** Infer a stable, human-readable error category from real transport data. */
export function inferErrorCategory(statusCode?: number, error?: unknown): string | undefined {
  if (error && typeof error === "object") {
    const name = "name" in error && typeof error.name === "string" ? error.name : "";
    if (name === "AbortError") return "Timeout";
    if (name === "TypeError") return "Network";
  }

  switch (statusCode) {
    case 401:
      return "Authentication";
    case 403:
      return "Permission";
    case 404:
      return "Not Found";
    case 408:
      return "Timeout";
    case 422:
      return "Validation";
    case 429:
      return "Rate Limit";
    case 500:
      return "Internal Server Error";
    default:
      if (statusCode !== undefined && statusCode >= 500) return "Server Error";
      if (statusCode !== undefined && statusCode >= 400) return "HTTP Error";
      return undefined;
  }
}

/** Extract usage/accounting fields only; provider response content is not retained. */
export function extractProviderResponseUsage(value: unknown): ProviderResponseUsage {
  const payload = asObject(value);
  if (!payload) return {};
  const usage = asObject(payload.usage);
  const geminiUsage = asObject(payload.usageMetadata);
  const inputTokens =
    asNonNegativeInteger(usage?.prompt_tokens) ??
    asNonNegativeInteger(usage?.input_tokens) ??
    asNonNegativeInteger(geminiUsage?.promptTokenCount);
  const outputTokens =
    asNonNegativeInteger(usage?.completion_tokens) ??
    asNonNegativeInteger(usage?.output_tokens) ??
    asNonNegativeInteger(geminiUsage?.candidatesTokenCount);
  const estimatedCost =
    asNonNegativeNumber(usage?.cost) ??
    asNonNegativeNumber(usage?.total_cost) ??
    asNonNegativeNumber(usage?.estimated_cost) ??
    asNonNegativeNumber(payload.estimated_cost);

  return {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(estimatedCost === undefined ? {} : { estimatedCost }),
  };
}
