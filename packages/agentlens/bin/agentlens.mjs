#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runProviderMatch } from "./provider-match.mjs";

const frameworks = new Set(["nextjs", "node", "express", "fastapi", "django", "laravel", "python", "other"]);

function fail(message) {
  throw new Error(`[AgentLens] ${message}`);
}

function readJson(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return null; }
}

function parseArgs(values) {
  const options = { yes: false, skipInstall: false };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--yes" || value === "-y") options.yes = true;
    else if (value === "--skip-install") options.skipInstall = true;
    else if (["--api-key", "--endpoint", "--framework", "--entry"].includes(value)) {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) fail(`${value} needs a value.`);
      options[value.slice(2).replace(/-([a-z])/g, (_, character) => character.toUpperCase())] = next;
      index += 1;
    } else fail(`I do not recognise ${value}. Run \`npx agentlens init\`.`);
  }
  return options;
}

function parseMatchArgs(values) {
  const options = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (["--code", "--workspace"].includes(value)) {
      const next = values[index + 1];
      if (!next || next.startsWith("--")) fail(`${value} needs a value.`);
      options[value.slice(2)] = next;
      index += 1;
    } else fail(`I do not recognise ${value}. Run \`npx agentlens match --help\`.`);
  }
  return options;
}

function hasFile(cwd, file) { return existsSync(join(cwd, file)); }

function detectFramework(cwd) {
  const packageJson = readJson(join(cwd, "package.json"));
  const dependencies = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
  if (dependencies.next) return "nextjs";
  if (dependencies.express) return "express";
  if (packageJson) return "node";
  if (hasFile(cwd, "artisan")) return "laravel";
  if (hasFile(cwd, "manage.py")) return "django";
  const requirements = hasFile(cwd, "requirements.txt") ? readFileSync(join(cwd, "requirements.txt"), "utf8").toLowerCase() : "";
  if (requirements.includes("fastapi") || hasFile(cwd, "app/main.py")) return "fastapi";
  if (requirements || hasFile(cwd, "main.py")) return "python";
  return "other";
}

function packageManager(cwd) {
  if (hasFile(cwd, "pnpm-lock.yaml")) return ["pnpm", ["add", "agentlens"]];
  if (hasFile(cwd, "yarn.lock")) return ["yarn", ["add", "agentlens"]];
  if (hasFile(cwd, "bun.lockb") || hasFile(cwd, "bun.lock")) return ["bun", ["add", "agentlens"]];
  return ["npm", ["install", "agentlens"]];
}

function installPackage(cwd, framework, skipInstall) {
  if (skipInstall) return;
  if (["nextjs", "node", "express"].includes(framework)) {
    const [command, args] = packageManager(cwd);
    execFileSync(command, args, { cwd, stdio: "inherit" });
    return;
  }
  if (["fastapi", "django", "python"].includes(framework)) {
    const python = process.platform === "win32" ? "py" : "python3";
    const args = process.platform === "win32" ? ["-m", "pip", "install", "agentlens"] : ["-m", "pip", "install", "agentlens"];
    execFileSync(python, args, { cwd, stdio: "inherit" });
  }
}

function environmentFile(cwd, framework) {
  return join(cwd, framework === "nextjs" ? ".env.local" : ".env");
}

function ensureEnvironment(file, apiKey, endpoint) {
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  let next = current;
  if (!/^AGENTLENS_API_KEY=/m.test(next)) next += `${next && !next.endsWith("\n") ? "\n" : ""}AGENTLENS_API_KEY=${apiKey}\n`;
  if (!/^AGENTLENS_ENDPOINT=/m.test(next)) next += `AGENTLENS_ENDPOINT=${endpoint}\n`;
  if (next !== current) writeFileSync(file, next, "utf8");
}

function findNodeEntry(cwd, option) {
  if (option) {
    const file = resolve(cwd, option);
    if (!existsSync(file)) fail(`I could not find ${option}.`);
    return file;
  }
  const packageJson = readJson(join(cwd, "package.json")) || {};
  const start = packageJson.scripts?.start || "";
  const startFile = start.match(/(?:node|tsx|ts-node)\s+([^\s]+)/)?.[1];
  const candidates = [packageJson.main, startFile, "server.ts", "server.js", "index.ts", "index.js", "app.ts", "app.js"].filter(Boolean);
  const match = candidates.map((candidate) => resolve(cwd, candidate)).find(existsSync);
  if (!match) fail("I could not find the file that starts your server. Re-run with --entry path/to/server.ts.");
  return match;
}

function injectNextRegistration(cwd) {
  const candidates = ["instrumentation.ts", "instrumentation.js", "src/instrumentation.ts", "src/instrumentation.js"];
  const existing = candidates.map((candidate) => join(cwd, candidate)).find(existsSync);
  const file = existing || join(cwd, "instrumentation.ts");
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (current.includes("agentlens/register")) return file;
  if (!current) {
    writeFileSync(file, 'export async function register() {\n  await import("agentlens/register");\n}\n', "utf8");
    return file;
  }
  const registerPattern = /(export\s+(?:async\s+)?function\s+register\s*\([^)]*\)\s*\{)/;
  if (registerPattern.test(current)) {
    writeFileSync(file, current.replace(registerPattern, '$1\n  await import("agentlens/register");'), "utf8");
    return file;
  }
  writeFileSync(file, `import "agentlens/register";\n${current}`, "utf8");
  return file;
}

function injectNodeRegistration(cwd, framework, entryOption) {
  if (framework === "nextjs") return injectNextRegistration(cwd);
  const file = findNodeEntry(cwd, entryOption);
  const current = readFileSync(file, "utf8");
  if (current.includes("agentlens/register")) return file;
  const packageJson = readJson(join(cwd, "package.json"));
  const commonJs = extname(file) === ".cjs" || (extname(file) === ".js" && packageJson?.type !== "module");
  const statement = commonJs ? 'require("agentlens/register");' : 'import "agentlens/register";';
  writeFileSync(file, `${statement}\n${current}`, "utf8");
  return file;
}

function findPythonEntry(cwd, framework, option) {
  if (option) {
    const file = resolve(cwd, option);
    if (!existsSync(file)) fail(`I could not find ${option}.`);
    return file;
  }
  const candidates = framework === "django" ? ["manage.py"] : ["app/main.py", "main.py", "app.py"];
  const match = candidates.map((candidate) => join(cwd, candidate)).find(existsSync);
  if (!match) fail("I could not find the Python file that starts your app. Re-run with --entry path/to/main.py.");
  return match;
}

function injectPythonRegistration(cwd, framework, entryOption) {
  const file = findPythonEntry(cwd, framework, entryOption);
  const current = readFileSync(file, "utf8");
  if (current.includes("agentlens.init")) return file;
  const registration = 'import os\nimport agentlens\n\nagentlens.init(api_key=os.environ["AGENTLENS_API_KEY"], base_url=os.environ.get("AGENTLENS_ENDPOINT", "http://localhost:8001"))\n\n';
  writeFileSync(file, `${registration}${current}`, "utf8");
  return file;
}

function writeConfig(cwd, framework, endpoint, entry) {
  writeFileSync(join(cwd, "agentlens.config.json"), `${JSON.stringify({ framework, endpoint, entry: entry ? basename(entry) : null }, null, 2)}\n`, "utf8");
}

async function ask(question, fallback, options) {
  if (options.yes || !input.isTTY) return fallback;
  const readline = createInterface({ input, output });
  try { return (await readline.question(question)).trim() || fallback; } finally { readline.close(); }
}

async function init() {
  const options = parseArgs(process.argv.slice(3));
  const cwd = process.cwd();
  const framework = options.framework || detectFramework(cwd);
  if (!frameworks.has(framework)) fail("--framework must be nextjs, node, express, fastapi, django, laravel, python, or other.");
  const apiKey = options.apiKey || process.env.AGENTLENS_API_KEY || await ask("Your private AgentLens project key: ", "", options);
  if (!apiKey) fail("A project key is needed. Create a project in AgentLens, then run this command again with --api-key or AGENTLENS_API_KEY.");
  const endpoint = options.endpoint || process.env.AGENTLENS_ENDPOINT || await ask("AgentLens address (press Enter for http://localhost:8001): ", "http://localhost:8001", options);

  console.log(`\n[AgentLens] Found ${framework === "nextjs" ? "a Next.js app" : `${framework} project`}.`);
  installPackage(cwd, framework, options.skipInstall);
  const envFile = environmentFile(cwd, framework);
  ensureEnvironment(envFile, apiKey, endpoint);
  let entry = null;
  if (["nextjs", "node", "express"].includes(framework)) entry = injectNodeRegistration(cwd, framework, options.entry);
  else if (["fastapi", "django", "python"].includes(framework)) entry = injectPythonRegistration(cwd, framework, options.entry);
  else console.log("[AgentLens] I saved your project key and config. This app type needs a supported server entry before automatic registration is possible.");
  writeConfig(cwd, framework, endpoint, entry);

  const envSaved = readFileSync(envFile, "utf8").includes("AGENTLENS_API_KEY=");
  const registered = entry ? readFileSync(entry, "utf8").includes("agentlens") : framework === "other" || framework === "laravel";
  if (!envSaved || !registered || !existsSync(join(cwd, "agentlens.config.json"))) fail("The installation check did not pass. No files were deleted; please run it again with --entry.");
  console.log("[AgentLens] ✓ Installation verified.");
  console.log("[AgentLens] Start your app, make one normal AI request, then return to AgentLens.");
}

function printUsage() {
  console.log("AgentLens\n\nSet up monitoring:  npx agentlens init\nCompare AI providers: npx agentlens match --code YOUR_ONE_TIME_CODE\n\nSetup options: --api-key, --endpoint, --framework, --entry, --yes\nMatch options: --code, --workspace");
}

const command = process.argv[2];
if (!command || command === "--help" || command === "-h") printUsage();
else if (command === "init") init().catch((error) => { console.error(error.message); process.exitCode = 1; });
else if (command === "match") runProviderMatch(parseMatchArgs(process.argv.slice(3)), ask).catch((error) => { console.error(`[AgentLens] ${error.message}`); process.exitCode = 1; });
else { console.error(`[AgentLens] Unknown command: ${command}`); printUsage(); process.exitCode = 1; }
