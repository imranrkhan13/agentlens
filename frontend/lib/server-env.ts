import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let configured = false;

/**
 * Load server-only local-stack settings at route-runtime, not build-runtime.
 * Next caches its own env loader, so reading the repository-level file here is
 * more reliable than attempting to reload Next's development configuration.
 */
export function ensureServerEnvironment() {
  if (configured) return;
  configured = true;

  const required = ["DATABASE_URL", "BETTER_AUTH_SECRET", "AGENTLENS_INTERNAL_API_TOKEN"];
  const envFiles = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "..", ".env")];
  for (const envFile of envFiles) {
    if (!required.some((name) => !process.env[name])) break;
    loadMissingValues(envFile);
  }

  if (!process.env.DATABASE_URL && process.env.POSTGRES_PASSWORD) {
    const host = process.env.AGENTLENS_DATABASE_HOST || "localhost";
    const port = process.env.AGENTLENS_POSTGRES_PORT || "55432";
    process.env.DATABASE_URL = `postgresql://agentlens:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${host}:${port}/agentlens`;
  }
}

function loadMissingValues(filePath: string) {
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const name = line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || process.env[name] !== undefined) continue;

    const rawValue = line.slice(separator + 1).trim();
    const quoted = rawValue.match(/^(?:"([\s\S]*)"|'([\s\S]*)')$/);
    process.env[name] = quoted ? (quoted[1] ?? quoted[2] ?? "") : rawValue;
  }
}
