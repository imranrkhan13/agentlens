import agentlens from "agentlens";

const apiKey = process.env.AGENTLENS_API_KEY;
if (!apiKey) {
  throw new Error("Set AGENTLENS_API_KEY to a project ingestion key before running this example.");
}

agentlens.init({
  apiKey,
  endpoint: process.env.AGENTLENS_ENDPOINT || "http://localhost:8001",
});

const delivery = await agentlens.track({
  provider: "local-verification",
  model: "agentlens-sdk-check",
  latencyMs: 1,
  success: true,
});

console.log(`AgentLens telemetry accepted (HTTP ${delivery.status}${delivery.requestId ? `, request ${delivery.requestId}` : ""}).`);
