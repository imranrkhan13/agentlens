export const siteConfig = {
  name: "AgentLens",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://agentlens-web.vercel.app").replace(/\/$/, ""),
  title: "AI Observability & LLM Monitoring | AgentLens",
  description:
    "Compare AI providers, monitor OpenAI, Anthropic, Gemini, Groq and other LLMs in production, and investigate reliability, latency, errors and cost without collecting prompts.",
  shortDescription:
    "Privacy-first AI observability, LLM monitoring and provider comparison for production applications.",
  github: "https://github.com/imranrkhan13/agentlens",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.url}/`).toString();
}
