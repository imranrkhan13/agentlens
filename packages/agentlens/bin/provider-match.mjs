import { performance } from "node:perf_hooks";

const DEFAULT_WORKSPACE = "https://agentlens-web.vercel.app";

function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1)];
}

function responseText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((part) => typeof part === "string" ? part : part?.text || "").join("");
  return "";
}

async function providerRequest(provider, test) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  const headers = { "Content-Type": "application/json" };
  let url;
  let body;
  if (provider.provider === "anthropic") {
    headers["x-api-key"] = process.env.ANTHROPIC_API_KEY;
    headers["anthropic-version"] = "2023-06-01";
    url = "https://api.anthropic.com/v1/messages";
    body = { model: provider.model, max_tokens: 350, temperature: 0, messages: [{ role: "user", content: test.prompt }] };
  } else if (provider.provider === "gemini") {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(key)}`;
    body = { contents: [{ role: "user", parts: [{ text: test.prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 350 } };
  } else if (provider.provider === "ollama") {
    url = `${(process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "")}/api/chat`;
    body = { model: provider.model, stream: false, options: { temperature: 0 }, messages: [{ role: "user", content: test.prompt }] };
  } else {
    const compatible = {
      openai: ["https://api.openai.com/v1/chat/completions", process.env.OPENAI_API_KEY],
      openrouter: ["https://openrouter.ai/api/v1/chat/completions", process.env.OPENROUTER_API_KEY],
      groq: ["https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY],
      mistral: ["https://api.mistral.ai/v1/chat/completions", process.env.MISTRAL_API_KEY],
    }[provider.provider];
    if (!compatible) throw new Error("Unsupported provider");
    [url] = compatible;
    headers.Authorization = `Bearer ${compatible[1]}`;
    body = { model: provider.model, temperature: 0, max_tokens: 350, messages: [{ role: "user", content: test.prompt }] };
  }

  const started = performance.now();
  try {
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
    const latencyMs = performance.now() - started;
    if (!response.ok) {
      const category = response.status === 401 || response.status === 403 ? "Authentication" : response.status === 429 ? "Rate limit" : response.status >= 500 ? "Provider unavailable" : "Request rejected";
      return { success: false, latencyMs, category, inputTokens: 0, outputTokens: 0, text: "" };
    }
    const payload = await response.json();
    if (provider.provider === "anthropic") {
      return { success: true, latencyMs, text: responseText(payload.content), inputTokens: Number(payload.usage?.input_tokens || 0), outputTokens: Number(payload.usage?.output_tokens || 0) };
    }
    if (provider.provider === "gemini") {
      return { success: true, latencyMs, text: responseText(payload.candidates?.[0]?.content?.parts), inputTokens: Number(payload.usageMetadata?.promptTokenCount || 0), outputTokens: Number(payload.usageMetadata?.candidatesTokenCount || 0) };
    }
    if (provider.provider === "ollama") {
      return { success: true, latencyMs, text: responseText(payload.message?.content), inputTokens: Number(payload.prompt_eval_count || 0), outputTokens: Number(payload.eval_count || 0) };
    }
    return { success: true, latencyMs, text: responseText(payload.choices?.[0]?.message?.content), inputTokens: Number(payload.usage?.prompt_tokens || 0), outputTokens: Number(payload.usage?.completion_tokens || 0) };
  } catch (error) {
    return { success: false, latencyMs: performance.now() - started, category: error?.name === "AbortError" ? "Timeout" : "Network", inputTokens: 0, outputTokens: 0, text: "" };
  } finally {
    clearTimeout(timeout);
  }
}

function maybeJson(text) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(trimmed); } catch { return null; }
}

export function scoreResponse(test, text) {
  const checks = [];
  const outcomes = [];
  const clean = text.trim();
  outcomes.push(clean.length > 0);
  checks.push(clean.length > 0 ? "Returned an answer" : "Returned no answer");
  if (test.expectedFormat === "json") {
    const parsed = maybeJson(clean);
    outcomes.push(Boolean(parsed && typeof parsed === "object" && !Array.isArray(parsed)));
    checks.push(parsed ? "Returned valid JSON" : "Did not return valid JSON");
    for (const key of test.expectedJsonKeys || []) {
      const present = Boolean(parsed && Object.prototype.hasOwnProperty.call(parsed, key));
      outcomes.push(present);
      checks.push(present ? `Included ${key}` : `Missing ${key}`);
    }
  }
  if (test.expectedExact) {
    const exact = clean.toLowerCase() === test.expectedExact.toLowerCase();
    outcomes.push(exact);
    checks.push(exact ? "Returned the exact requested label" : "Added or changed the requested label");
  }
  for (const phrase of test.mustInclude || []) {
    const included = clean.toLowerCase().includes(phrase.toLowerCase());
    outcomes.push(included);
    checks.push(included ? `Included “${phrase}”` : `Missed “${phrase}”`);
  }
  for (const phrase of test.mustNotInclude || []) {
    const avoided = !clean.toLowerCase().includes(phrase.toLowerCase());
    outcomes.push(avoided);
    checks.push(avoided ? `Avoided “${phrase}”` : `Used blocked phrase “${phrase}”`);
  }
  if (test.maxCharacters) {
    const concise = clean.length <= test.maxCharacters;
    outcomes.push(concise);
    checks.push(concise ? "Stayed within the requested length" : "Exceeded the requested length");
  }
  const score = outcomes.length ? outcomes.filter(Boolean).length / outcomes.length * 100 : 0;
  return { passed: score >= 80, score: Math.round(score), checks };
}

function credentialAvailable(provider) {
  if (provider.provider === "ollama") return true;
  if (provider.provider === "gemini") return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  return Boolean(process.env[provider.env]);
}

async function testProvider(provider, specification) {
  if (!credentialAvailable(provider)) {
    return {
      provider: provider.provider, model: provider.model, status: "unavailable", testsTotal: specification.testCases.length, testsPassed: 0,
      qualityScore: 0, reliabilityScore: 0, avgLatencyMs: null, p95LatencyMs: null, inputTokens: 0, outputTokens: 0,
      estimatedRunCostUsd: null, estimatedMonthlyCostUsd: null, errorCategory: `Missing ${provider.env}`, testScores: [],
    };
  }
  const calls = [];
  for (const test of specification.testCases) {
    process.stdout.write(`  · ${test.name}… `);
    const response = await providerRequest(provider, test);
    const score = response.success ? scoreResponse(test, response.text) : { passed: false, score: 0, checks: [`Provider request failed: ${response.category}`] };
    calls.push({ ...response, testId: test.id, ...score });
    console.log(score.passed ? "passed" : response.success ? "needs work" : "failed");
  }
  const successful = calls.filter((call) => call.success);
  const latencies = successful.map((call) => call.latencyMs);
  const inputTokens = calls.reduce((sum, call) => sum + call.inputTokens, 0);
  const outputTokens = calls.reduce((sum, call) => sum + call.outputTokens, 0);
  const hasKnownPrice = provider.model === provider.defaultModel && typeof provider.inputUsdPerMillion === "number" && typeof provider.outputUsdPerMillion === "number";
  const estimatedRunCostUsd = hasKnownPrice ? (inputTokens * provider.inputUsdPerMillion + outputTokens * provider.outputUsdPerMillion) / 1_000_000 : null;
  const successfulCount = successful.length;
  const averageCost = successfulCount && estimatedRunCostUsd !== null ? estimatedRunCostUsd / successfulCount : null;
  return {
    provider: provider.provider,
    model: provider.model,
    status: successfulCount ? "complete" : "failed",
    testsTotal: calls.length,
    testsPassed: calls.filter((call) => call.passed).length,
    qualityScore: calls.length ? calls.reduce((sum, call) => sum + call.score, 0) / calls.length : 0,
    reliabilityScore: calls.length ? successfulCount / calls.length * 100 : 0,
    avgLatencyMs: latencies.length ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length : null,
    p95LatencyMs: percentile(latencies, 0.95),
    inputTokens,
    outputTokens,
    estimatedRunCostUsd: estimatedRunCostUsd === null ? null : Number(estimatedRunCostUsd.toFixed(8)),
    estimatedMonthlyCostUsd: averageCost === null ? null : Number((averageCost * specification.monthlyRequests).toFixed(2)),
    errorCategory: successfulCount === calls.length ? null : calls.find((call) => !call.success)?.category || "Test failure",
    testScores: calls.map((call) => ({ testId: call.testId, passed: call.passed, score: call.score, checks: call.checks })),
  };
}

async function workspaceRequest(workspace, code, options = {}) {
  const response = await fetch(`${workspace.replace(/\/$/, "")}/api/provider-match/runner`, {
    ...options,
    headers: { Authorization: `Bearer ${code}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `AgentLens returned ${response.status}.`);
  return payload;
}

export async function runProviderMatch(options, ask) {
  const workspace = (options.workspace || process.env.AGENTLENS_WEB_URL || DEFAULT_WORKSPACE).replace(/\/$/, "");
  const code = options.code || process.env.AGENTLENS_MATCH_CODE || await ask("Paste the one-time comparison code from AgentLens: ", "", options);
  if (!code) throw new Error("A one-time comparison code is required. Open Find my AI provider in AgentLens to create one.");
  console.log("\n[AgentLens] Loading your private test plan…");
  const specification = await workspaceRequest(workspace, code);
  console.log(`[AgentLens] ${specification.name}`);
  console.log(`[AgentLens] ${specification.testCases.length} synthetic checks × ${specification.providers.length} selected providers.`);
  console.log("[AgentLens] Keys and model answers stay on this computer. Only scores and timing are uploaded.\n");
  const results = [];
  for (const provider of specification.providers) {
    console.log(`[AgentLens] Testing ${provider.name} · ${provider.model}`);
    results.push(await testProvider(provider, specification));
  }
  console.log("\n[AgentLens] Sending the metadata-only scorecard…");
  const saved = await workspaceRequest(workspace, code, { method: "POST", body: JSON.stringify({ results }) });
  if (saved.recommendation) console.log(`[AgentLens] ✓ Best fit: ${saved.recommendation.provider} · ${saved.recommendation.model} (${saved.recommendation.score}/100)`);
  else console.log("[AgentLens] The run finished, but no provider completed enough checks for a recommendation.");
  console.log(`[AgentLens] Open ${workspace}/app/match/${specification.id} for the full explanation.`);
}
