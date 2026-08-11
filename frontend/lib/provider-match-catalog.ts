export type MatchPriority = "balanced" | "quality" | "speed" | "cost";
export type MatchTaskType = "support" | "extraction" | "classification" | "content" | "coding" | "analysis";
export type MatchResponseFormat = "text" | "json" | "short";
export type DataSensitivity = "public" | "business" | "sensitive";

export const PROVIDER_CATALOG = {
  openai: { name: "OpenAI", defaultModel: "gpt-4.1-mini", env: "OPENAI_API_KEY", keyUrl: "https://platform.openai.com/api-keys", inputUsdPerMillion: 0.4, outputUsdPerMillion: 1.6 },
  anthropic: { name: "Anthropic", defaultModel: "claude-sonnet-4-5", env: "ANTHROPIC_API_KEY", keyUrl: "https://console.anthropic.com/settings/keys", inputUsdPerMillion: 3, outputUsdPerMillion: 15 },
  gemini: { name: "Google Gemini", defaultModel: "gemini-2.5-flash", env: "GEMINI_API_KEY", keyUrl: "https://aistudio.google.com/app/apikey", inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5 },
  groq: { name: "Groq", defaultModel: "openai/gpt-oss-120b", env: "GROQ_API_KEY", keyUrl: "https://console.groq.com/keys", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6 },
  mistral: { name: "Mistral", defaultModel: "mistral-small-2603", env: "MISTRAL_API_KEY", keyUrl: "https://console.mistral.ai/api-keys", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6 },
  openrouter: { name: "OpenRouter", defaultModel: "openai/gpt-4.1-mini", env: "OPENROUTER_API_KEY", keyUrl: "https://openrouter.ai/settings/keys", inputUsdPerMillion: null, outputUsdPerMillion: null },
  ollama: { name: "Ollama (local)", defaultModel: "llama3.2", env: "OLLAMA_HOST", keyUrl: "https://ollama.com/download", inputUsdPerMillion: 0, outputUsdPerMillion: 0 },
} as const;

export type ProviderChoice = {
  provider: keyof typeof PROVIDER_CATALOG;
  model: string;
};
