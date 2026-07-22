import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const fixture = mkdtempSync(join(tmpdir(), "agentlens-cli-"));
const cli = fileURLToPath(new URL("../bin/agentlens.mjs", import.meta.url));

try {
  writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module", dependencies: { next: "15.0.0" } }));
  const result = spawnSync(process.execPath, [cli, "init", "--api-key", "al_test_key", "--endpoint", "http://agentlens.test", "--yes", "--skip-install"], { cwd: fixture, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Installation verified/);
  assert.match(readFileSync(join(fixture, ".env.local"), "utf8"), /AGENTLENS_API_KEY=al_test_key/);
  assert.match(readFileSync(join(fixture, "instrumentation.ts"), "utf8"), /agentlens\/register/);
  const config = JSON.parse(readFileSync(join(fixture, "agentlens.config.json"), "utf8"));
  assert.equal(config.framework, "nextjs");
  assert.equal(config.endpoint, "http://agentlens.test");
  console.log("Guided CLI setup passed.");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
