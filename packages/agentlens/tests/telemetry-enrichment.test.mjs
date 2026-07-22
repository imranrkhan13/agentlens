import assert from "node:assert/strict";
import agentlens from "agentlens";

const recordedEvents = [];
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.toString();
  if (url === "http://agentlens.test/v1/events") {
    recordedEvents.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (url.startsWith("https://generativelanguage.googleapis.com/")) {
    return new Response(JSON.stringify({ usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 7 } }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (url.startsWith("https://openrouter.ai/")) {
    return new Response(JSON.stringify({ usage: { prompt_tokens: 20, completion_tokens: 8, cost: 0.00125 } }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (url.startsWith("https://api.groq.com/")) {
    return new Response(JSON.stringify({ error: "rate limited" }), { status: 429, headers: { "content-type": "application/json" } });
  }
  if (url.startsWith("https://api.mistral.ai/")) {
    throw new TypeError("network unavailable");
  }
  throw new Error(`Unexpected request: ${url}`);
};

agentlens.init({ apiKey: "test-key", endpoint: "http://agentlens.test" });

await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=never-recorded", {
  method: "POST",
  body: JSON.stringify({ contents: [{ parts: [{ text: "never retained" }] }] }),
});
await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct" }) });
await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: "llama-3.3-70b-versatile" }) });
await assert.rejects(
  fetch("https://api.mistral.ai/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: "mistral-small-latest" }) }),
  TypeError,
);

for (let attempt = 0; attempt < 20 && recordedEvents.length < 4; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 5));
}

assert.equal(recordedEvents.length, 4);
const byProvider = Object.fromEntries(recordedEvents.map((event) => [event.provider, event]));

assert.equal(byProvider.Gemini.model, "gemini-2.0-flash");
assert.equal(byProvider.Gemini.requestUrl, "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent");
assert.equal(byProvider.Gemini.endpoint, "https://generativelanguage.googleapis.com");
assert.equal(byProvider.Gemini.httpMethod, "POST");
assert.equal(byProvider.Gemini.inputTokens, 11);
assert.equal(byProvider.Gemini.outputTokens, 7);
assert.equal(byProvider.Gemini.retryCount, 0);

assert.equal(byProvider.OpenRouter.model, "meta-llama/llama-3.3-70b-instruct");
assert.equal(byProvider.OpenRouter.estimatedCost, 0.00125);
assert.equal(byProvider.Groq.model, "llama-3.3-70b-versatile");
assert.equal(byProvider.Groq.errorCategory, "Rate Limit");
assert.equal(byProvider.Mistral.model, "mistral-small-latest");
assert.equal(byProvider.Mistral.errorCategory, "Network");
assert.ok(recordedEvents.every((event) => event.instrumentationType === "native"));
assert.ok(recordedEvents.every((event) => !("contents" in event) && !("body" in event)));

globalThis.fetch = originalFetch;
console.log("Provider telemetry enrichment passed.");
