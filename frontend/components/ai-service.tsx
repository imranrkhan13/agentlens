import { Atom, Bot, Orbit, Sparkles, Triangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceVisual = { name: string; letter?: string; icon?: typeof Sparkles; className: string };

export function serviceVisual(value: string): ServiceVisual {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("gemini") || normalized.includes("google")) return { name: "Google Gemini", icon: Sparkles, className: "border-[#4285f4]/35 bg-[#4285f4]/12 text-[#8ab4f8]" };
  if (normalized.includes("openai")) return { name: "OpenAI", icon: Orbit, className: "border-[#10a37f]/35 bg-[#10a37f]/12 text-[#72e0bf]" };
  if (normalized.includes("anthropic") || normalized.includes("claude")) return { name: "Anthropic Claude", letter: "A", className: "border-[#d4a27f]/35 bg-[#d4a27f]/12 text-[#efc6a7]" };
  if (normalized.includes("openrouter")) return { name: "OpenRouter", letter: "O", className: "border-[#7c5cff]/35 bg-[#7c5cff]/12 text-[#b8a9ff]" };
  if (normalized.includes("groq")) return { name: "Groq", letter: "G", className: "border-[#f55036]/35 bg-[#f55036]/12 text-[#ff9d8f]" };
  if (normalized.includes("mistral")) return { name: "Mistral", letter: "M", className: "border-[#ffaf45]/35 bg-[#ffaf45]/12 text-[#ffd194]" };
  if (normalized.includes("ollama")) return { name: "Ollama", icon: Bot, className: "border-white/[.2] bg-white/[.08] text-white" };
  return { name: value.trim() || "Custom AI service", icon: Atom, className: "border-[#8d72ff]/30 bg-[#8d72ff]/10 text-[#c1b4ff]" };
}

export function AIService({ service, compact = false }: { service: string; compact?: boolean }) {
  const visual = serviceVisual(service);
  const Icon = visual.icon;
  return <span className="inline-flex min-w-0 items-center gap-2"><span aria-hidden className={cn("grid shrink-0 place-items-center rounded-lg border font-semibold", compact ? "size-5 text-[9px]" : "size-7 text-[11px]", visual.className)}>{Icon ? <Icon className={compact ? "size-3" : "size-3.5"} /> : visual.letter}</span><span className="truncate">{visual.name}</span></span>;
}
