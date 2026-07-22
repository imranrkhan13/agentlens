import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = resolve(packageRoot, ".build");
const distRoot = resolve(packageRoot, "dist");
const tsc = process.platform === "win32" ? "tsc.cmd" : "tsc";

function runTsc(config) {
  execFileSync(tsc, ["-p", config], {
    cwd: packageRoot,
    stdio: "inherit",
  });
}

function copyBuildOutput(source, destination) {
  if (!existsSync(source)) {
    throw new Error(`AgentLens build did not produce ${source}.`);
  }
  copyFileSync(source, destination);
}

rmSync(buildRoot, { recursive: true, force: true });
rmSync(distRoot, { recursive: true, force: true });

try {
  runTsc("tsconfig.esm.json");
  runTsc("tsconfig.cjs.json");
  mkdirSync(distRoot, { recursive: true });
  copyBuildOutput(resolve(buildRoot, "esm/index.js"), resolve(distRoot, "index.js"));
  copyBuildOutput(resolve(buildRoot, "cjs/index.js"), resolve(distRoot, "index.cjs"));
  copyBuildOutput(resolve(buildRoot, "types/index.d.ts"), resolve(distRoot, "index.d.ts"));
  copyBuildOutput(resolve(buildRoot, "esm/provider-inference.js"), resolve(distRoot, "provider-inference.js"));
  copyBuildOutput(resolve(buildRoot, "cjs/provider-inference.js"), resolve(distRoot, "provider-inference.cjs"));
  const commonJsEntry = resolve(distRoot, "index.cjs");
  writeFileSync(commonJsEntry, readFileSync(commonJsEntry, "utf8").replaceAll("./provider-inference.js", "./provider-inference.cjs"));
} finally {
  rmSync(buildRoot, { recursive: true, force: true });
}
