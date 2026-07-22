"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock3, Copy, KeyRound, Sparkles } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import type { ProjectTechnology } from "@/lib/api/types";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { AIService } from "@/components/ai-service";
import { CodeSnippet } from "@/components/code-snippet";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { useProjectKeyReveal } from "@/components/workspace/project-key-reveal";

function installCommand(_technology: ProjectTechnology) {
  return "npx agentlens init";
}

function advancedHelp(technology: ProjectTechnology) {
  if (["fastapi", "django", "python"].includes(technology)) return `import os
import agentlens

agentlens.init(api_key=os.environ["AGENTLENS_API_KEY"])

# Make your normal supported AI calls as usual.`;
  return `// The command creates this for supported JavaScript apps:
import "agentlens/register";

// Make your normal supported AI calls as usual.`;
}

export default function ProjectDetailPage() {
  const { session, isReady } = useAgentLensSession();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId || session?.projectId;
  const { takeProjectKey } = useProjectKeyReveal();
  const [oneTimeKey, setOneTimeKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<"install" | "key" | null>(null);
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
  const command = installCommand(session?.technology || "other");

  useEffect(() => {
    if (!projectId || didCheckForKey.current) return;
    didCheckForKey.current = true;
    setOneTimeKey(takeProjectKey(projectId));
  }, [projectId, takeProjectKey]);

  async function copy(value: string, type: "install" | "key") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }

  if (!session || session.projectId !== projectId) return <div className="space-y-6"><Button asChild variant="ghost" size="sm"><Link href="/app/projects"><ArrowLeft className="size-3.5" /> Projects</Link></Button><div className="surface rounded-2xl p-8 text-center"><p className="text-sm text-[#d8d7e1]">This project is not available in your account.</p><Button asChild className="mt-4" size="sm"><Link href="/app/settings">Create a project</Link></Button></div></div>;

  return <div className="space-y-7">
    <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/app/projects"><ArrowLeft className="size-3.5" /> Projects</Link></Button>
    <PageHeader eyebrow="Project setup" title={session.projectName} description="One command gets your AI activity flowing here. Your normal AI calls stay the same." action={<StatusPill status={totalEvents ? "healthy" : "neutral"} label={totalEvents ? "Connected" : "Waiting"} />} />
    {oneTimeKey && <section className="rounded-2xl border border-success/25 bg-success/[.07] p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-success">Your private project key · shown once</p><h2 className="mt-2 text-lg font-medium text-white">Store this key with your app.</h2><p className="mt-2 text-sm leading-6 text-[#a9d8c9]">Keep it private. It will not be shown again.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-success/20 bg-black/25 px-3 py-3 font-mono text-xs text-[#e9fff6]">{oneTimeKey}</code><Button size="sm" variant="secondary" onClick={() => void copy(oneTimeKey, "key")}><Copy className="size-3.5" />{copied === "key" ? "Copied" : "Copy key"}</Button></div></section>}
    <section className="surface-glow rounded-2xl p-5 sm:p-7"><span className="eyebrow">Install AgentLens</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">Copy this, then run it in your project folder.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9695a4]">It will guide you through the remaining private setup. No code copying is needed.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-white/[.09] bg-black/30 px-4 py-3.5 font-mono text-sm text-[#eeeafd]">{command}</code><Button size="lg" onClick={() => void copy(command, "install")}><Copy className="size-4" />{copied === "install" ? "Copied" : "Copy install command"}</Button></div></section>
    <section className={`rounded-2xl border p-5 sm:p-6 transition ${totalEvents ? "border-success/25 bg-success/[.055]" : "border-violet/20 bg-violet/[.045]"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${totalEvents ? "bg-success/[.12] text-success" : "bg-violet/[.12] text-violet"}`}>{totalEvents ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5 animate-pulse" />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#a7a4ba]">{totalEvents ? "You’re connected" : "Almost there"}</p><h2 className="mt-1 text-lg font-medium text-white">{totalEvents ? "🎉 Your AI activity is arriving." : "Waiting for your first AI request…"}</h2><p className="mt-2 text-sm leading-6 text-[#a2a0af]">{totalEvents ? `${totalEvents} real ${totalEvents === 1 ? "request has" : "requests have"} arrived from your app.` : "Run the command above, then use your AI feature normally. This page updates on its own."}</p>{latestEvent && <p className="mt-3 text-xs text-[#8f8d9d]">Last activity received {new Date(latestEvent).toLocaleString()}.</p>}</div></div>{totalEvents > 0 && <div className="mt-5 flex flex-wrap gap-2">{providers.data?.providers.map((provider) => <AIService key={provider.provider} service={provider.provider} compact />)}</div>}</section>
    <details className="surface rounded-2xl p-5 sm:p-6"><summary className="cursor-pointer text-sm font-medium text-[#e5e4ed]">Advanced</summary><div className="mt-5 space-y-4"><div className="rounded-xl border border-white/[.075] bg-black/15 p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/[.08] bg-white/[.04] text-[#b7b0df]"><Sparkles className="size-4" /></span><p className="text-xs leading-5 text-[#9a98a7]">Supported AI services are picked up automatically. For a custom service, you can send a small activity record after its request.</p></div></div><div><p className="mb-2 text-xs font-medium text-[#d9d8e2]">If your app needs a manual registration</p><CodeSnippet>{advancedHelp(session.technology)}</CodeSnippet></div><div className="flex items-start gap-3 rounded-xl border border-white/[.075] bg-black/15 p-4"><KeyRound className="mt-0.5 size-4 shrink-0 text-[#b7b0df]" /><p className="text-xs leading-5 text-[#9a98a7]">Keep your private project key in your app&apos;s environment, never in browser code or a public repository.</p></div></div></details>
  </div>;
}
