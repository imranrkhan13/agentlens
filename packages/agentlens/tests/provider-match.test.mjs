import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { runProviderMatch, scoreResponse } from "../bin/provider-match.mjs";

const score = scoreResponse({
  expectedFormat: "json",
  expectedJsonKeys: ["status", "answer"],
  mustInclude: ["ok"],
  mustNotInclude: ["secret"],
}, '{"status":"ok","answer":"ready"}');
assert.equal(score.passed, true);
assert.equal(score.score, 100);

let uploaded;
const server = createServer(async (request, response) => {
  assert.equal(request.headers.authorization, "Bearer alm_test_runner_code_for_cli_protocol");
  response.setHeader("content-type", "application/json");
  if (request.method === "GET") {
    response.end(JSON.stringify({
      id: "match-test",
      name: "CLI privacy check",
      monthlyRequests: 1000,
      testCases: [{ id: "one", name: "One check", prompt: "Return ok", expectedFormat: "short", mustInclude: ["ok"] }],
      providers: [{ provider: "openai", name: "OpenAI", model: "gpt-test", env: "OPENAI_API_KEY", inputUsdPerMillion: 1, outputUsdPerMillion: 1 }],
    }));
    return;
  }
  let body = "";
  for await (const chunk of request) body += chunk;
  uploaded = JSON.parse(body);
  response.end(JSON.stringify({ recommendation: null }));
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
delete process.env.OPENAI_API_KEY;
await runProviderMatch({ workspace: `http://127.0.0.1:${address.port}`, code: "alm_test_runner_code_for_cli_protocol" }, async () => "");
server.close();
await once(server, "close");

assert.equal(uploaded.results[0].status, "unavailable");
assert.equal(uploaded.results[0].errorCategory, "Missing OPENAI_API_KEY");
assert.equal("response" in uploaded.results[0], false);
assert.equal("apiKey" in uploaded.results[0], false);
console.log("Provider Match local-runner privacy checks passed.");
