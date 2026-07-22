import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const originalKey = process.env.AGENTLENS_API_KEY;
const originalEndpoint = process.env.AGENTLENS_ENDPOINT;

try {
  process.env.AGENTLENS_API_KEY = "register-test-key";
  process.env.AGENTLENS_ENDPOINT = "http://agentlens.test";
  globalThis.fetch = async () => new Response("{}", { status: 200 });

  await import("agentlens/register");
  assert.equal(typeof globalThis.fetch, "function");
  console.log("Automatic server registration passed.");
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.AGENTLENS_API_KEY;
  else process.env.AGENTLENS_API_KEY = originalKey;
  if (originalEndpoint === undefined) delete process.env.AGENTLENS_ENDPOINT;
  else process.env.AGENTLENS_ENDPOINT = originalEndpoint;
}
