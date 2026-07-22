"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Cable, CheckCircle2, Clock3, KeyRound } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { CodeSnippet } from "@/components/code-snippet";
import { useProjectKeyReveal } from "@/components/workspace/project-key-reveal";

const nodeSetup = `npm install agentlens

import agentlens from "agentlens";

agentlens.init({
  apiKey: process.env.AGENTLENS_API_KEY!,
});

// Existing supported OpenAI and Anthropic calls stay unchanged.
// For custom providers or endpoints, send metadata only:
agentlens.track({
  provider: "custom-provider",
  model: "model-name",
  latencyMs,
  success,
  statusCode,
  inputTokens,
  outputTokens,
  estimatedCost,
  errorCategory,
});`;

const pythonSetup = `pip install agentlens

import os
import agentlens

agentlens.init(api_key=os.environ["AGENTLENS_API_KEY"])

# Existing supported OpenAI and Anthropic calls stay unchanged.
# Generic tracking works with any provider or model endpoint.
agentlens.track(
    provider="custom-provider",
    model="model-name",
    latency_ms=latency_ms,
    success=success,
    status_code=status_code,
    input_tokens=input_tokens,
    output_tokens=output_tokens,
    estimated_cost=estimated_cost,
    error_category=error_category,
)`;

export default function ProjectDetailPage() {
  const { session, isReady } = useAgentLensSession();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || session?.projectId;
  const { takeProjectKey } = useProjectKeyReveal();
  const [language, setLanguage] = useState<"node" | "python">("node");
  const [oneTimeKey, setOneTimeKey] = useState<string | null>(null);
  const didCheckForKey = useRef(false);
  const providers = useQuery({
    queryKey: ["providers", projectId],
    queryFn: () => agentLensApi.getProviders(projectId!),
    enabled: Boolean(projectId && isReady),
    refetchInterval: projectId ? 15_000 : false,
  });
  const totalEvents = providers.data?.providers.reduce((total, provider) => total + provider.request_volume, 0) || 0;
  const latestEvent = providers.data?.providers.reduce<string | null>(
    (latest, provider) => !latest || new Date(provider.latest_event_at) > new Date(latest) ? provider.latest_event_at : latest,
    null,
  ) || null;

  useEffect(() => {
    if (!projectId || didCheckForKey.current) return;
    didCheckForKey.current = true;
    setOneTimeKey(takeProjectKey(projectId));
  }, [projectId, takeProjectKey]);

  if (!session || session.projectId !== projectId) return <div className="space-y-6"><Button asChild variant="ghost" size="sm"><Link href="/app/projects"><ArrowLeft className="size-3.5" /> Projects</Link></Button><div className="surface rounded-2xl p-8 text-center"><p className="text-sm text-[#d8d7e1]">This project is not available in your account.</p><Button asChild className="mt-4" size="sm"><Link href="/app/settings">Project settings</Link></Button></div></div>;

  return <div className="space-y-7"><div><Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/app/projects"><ArrowLeft className="size-3.5" /> Projects</Link></Button></div><PageHeader eyebrow="Project setup" title={session.projectName} description={`Project ID ${session.projectId}. Store this project key in your application's server environment, never in browser code.`} action={<StatusPill status={totalEvents ? "healthy" : "neutral"} label={totalEvents ? "Receiving telemetry" : "Waiting for telemetry"} />} />
    {oneTimeKey && <section className="rounded-2xl border border-success/25 bg-success/[.07] p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-success">Project API key · shown once</p><h2 className="mt-2 text-lg font-medium text-white">Store this key in your server environment.</h2><p className="mt-2 text-sm leading-6 text-[#a9d8c9]">It will not be shown again. Do not place it in browser code, commit it, or paste it back into this dashboard.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-success/20 bg-black/25 px-3 py-3 font-mono text-xs text-[#e9fff6]">{oneTimeKey}</code><Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(oneTimeKey)}>Copy key</Button></div></section>}
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="surface-glow rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-violet/20 bg-violet/[.09] text-violet"><Cable className="size-4" /></span><div><h2 className="text-sm font-medium text-[#eae9f1]">SDK setup</h2><p className="mt-1 text-xs text-[#7e7d8c]">Use generic tracking for any provider; no provider list needs configuration first.</p></div></div><div className="mt-5 flex gap-2"><Button size="sm" variant={language === "node" ? "primary" : "secondary"} onClick={() => setLanguage("node")}>Node / TypeScript</Button><Button size="sm" variant={language === "python" ? "primary" : "secondary"} onClick={() => setLanguage("python")}>Python</Button></div><div className="mt-4"><CodeSnippet>{language === "node" ? nodeSetup : pythonSetup}</CodeSnippet></div><p className="mt-4 text-xs leading-5 text-[#898896]">AgentLens records metadata only. Do not send prompts, completions, authorization headers, raw keys, or provider request bodies.</p></section>
      <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-success/20 bg-success/[.08] text-success">{totalEvents ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}</span><div><h2 className="text-sm font-medium text-[#eae9f1]">Telemetry status</h2><p className="mt-1 text-xs text-[#7e7d8c]">A real event is the setup confirmation.</p></div></div><StatusPill compact status={totalEvents ? "healthy" : "neutral"} /></div><div className="mt-6 rounded-xl border border-white/[.075] bg-black/15 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#747382]">{totalEvents ? "Receiving telemetry" : "Waiting for first event"}</p><p className="mt-2 text-sm font-medium text-[#e4e3ec]">{totalEvents ? `${totalEvents} real event${totalEvents === 1 ? "" : "s"} detected` : "Install the SDK and make your first AI request."}</p>{latestEvent && <p className="mt-2 text-xs text-[#858492]">Last event received {new Date(latestEvent).toLocaleString()}</p>}</div><p className="mt-5 text-xs leading-5 text-[#898896]">The dashboard never needs you to paste this project&apos;s raw key again. Keep it only in <span className="font-mono text-[#b9b8c6]">AGENTLENS_API_KEY</span> on your application server.</p></section></div>
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.04] text-[#aaa9b7]"><KeyRound className="size-4" /></span><div><h2 className="text-sm font-medium text-[#eae9f1]">Project key safety</h2><p className="mt-1 text-xs leading-5 text-[#7e7d8c]">AgentLens stores a keyed hash, not a plaintext SDK key. After this one-time reveal, use a rotation flow rather than trying to recover the original key.</p></div></div></section>
  </div>;
}
