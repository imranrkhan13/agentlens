/**
 * Zero-config server registration for supported fetch-based AI providers.
 *
 * Put `import "agentrelay-sdk/register"` in the file that starts your Node server
 * after setting AGENTLENS_API_KEY. The default client then observes supported
 * provider fetch requests without changing those provider call sites.
 */

import { init } from "./index.js";

type ServerRuntime = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function readEnvironment() {
  return (globalThis as ServerRuntime).process?.env ?? {};
}

if (typeof window === "undefined") {
  const environment = readEnvironment();
  const apiKey = environment.AGENTLENS_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      "[Agentrelay] Automatic setup is waiting for AGENTLENS_API_KEY. Add the project key to your server environment, then restart your app.",
    );
  } else {
    init({
      apiKey,
      ...(environment.AGENTLENS_ENDPOINT?.trim() ? { endpoint: environment.AGENTLENS_ENDPOINT.trim() } : {}),
    });
  }
}
