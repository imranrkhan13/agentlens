"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CheckCircle2, Clock3, Copy, KeyRound, RefreshCw, Sparkles } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import type { ProjectTechnology } from "@/lib/api/types";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { AIService } from "@/components/ai-service";
import { CodeSnippet } from "@/components/code-snippet";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { useProjectKeyReveal } from "@/components/workspace/project-key-reveal";
import { useToast } from "@/components/ui/toast";

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
  const { showToast } = useToast();
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
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);
      showToast("Copied!");
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      showToast("We could not copy that. Please try again.", "error");
    }
  }

  if (!session || session.projectId !== projectId) return <div className="space-y-6"><Button asChild variant="ghost" size="sm"><Link href="/app/projects"><ArrowLeft className="size-3.5" /> Projects</Link></Button><div className="surface rounded-2xl p-8 text-center"><p className="text-sm text-[#d8d7e1]">This project is not available in your account.</p><Button asChild className="mt-4" size="sm"><Link href="/app/settings">Create a project</Link></Button></div></div>;

  return <div className="space-y-7">
    <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/app/projects"><ArrowLeft className="size-3.5" /> Projects</Link></Button>
    <PageHeader eyebrow="App setup" title={session.projectName} description="Follow the steps below once. After that, this page updates by itself." action={<StatusPill status={totalEvents ? "healthy" : "neutral"} label={totalEvents ? "Connected" : "Waiting for setup"} />} />
    <section className="setup-guide">
      <div className="setup-guide-heading"><span>QUICK SETUP</span><h2>Connect this app in three small steps.</h2><p>AgentLens detects your framework and supported AI services automatically.</p></div>
      <div className="setup-guide-steps">
        <article><span>1</span><div><h3>Copy your private key</h3><p>This key belongs only to {session.projectName}. Keep it private.</p>{oneTimeKey ? <div className="setup-copy-row"><code>{oneTimeKey}</code><Button size="sm" variant="secondary" onClick={() => void copy(oneTimeKey, "key")}><Copy className="size-3.5" />{copied === "key" ? "Copied" : "Copy key"}</Button></div> : <p className="setup-key-note"><KeyRound className="size-4" />Your key was shown when this app was created. You can create a new key from API keys if needed.</p>}</div></article>
        <article><span>2</span><div><h3>Run one command in your app folder</h3><p>The guide asks for the private key and handles the rest.</p><div className="setup-copy-row"><code>{command}</code><Button size="sm" variant="primary" onClick={() => void copy(command, "install")}><Copy className="size-3.5" />{copied === "install" ? "Copied" : "Copy command"}</Button></div></div></article>
        <article><span>3</span><div><h3>Use your AI feature normally</h3><p>Make one normal request. AgentLens will recognise it and update the status below.</p></div></article>
      </div>
    </section>
    <section className={`rounded-2xl border p-5 sm:p-6 transition ${totalEvents ? "border-success/25 bg-success/[.055]" : "border-violet/20 bg-violet/[.045]"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${totalEvents ? "bg-success/[.12] text-success" : "bg-violet/[.12] text-violet"}`}>{totalEvents ? <CheckCircle2 className="size-5" aria-label="Connected" /> : <Clock3 className="size-5 animate-pulse" aria-label="Waiting" />}</span><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#a7a4ba]">{totalEvents ? "Connected" : "Almost there"}</p><h2 className="mt-1 flex items-center gap-2 text-lg font-medium text-white">{totalEvents && <CheckCircle2 className="size-5 text-success" aria-hidden="true" />}{totalEvents ? "Your AI activity is arriving." : "Waiting for your first AI request…"}</h2><p className="mt-2 text-sm leading-6 text-[#a2a0af]">{totalEvents ? `${totalEvents} real ${totalEvents === 1 ? "request has" : "requests have"} arrived from your app.` : "Run the command above, then use your AI feature normally. This page checks again on its own."}</p>{latestEvent && <p className="mt-3 text-xs text-[#8f8d9d]">Last activity received {new Date(latestEvent).toLocaleString()}.</p>}</div></div>{totalEvents ? <div className="mt-5 flex flex-wrap gap-2">{providers.data?.providers.map((provider) => <AIService key={provider.provider} service={provider.provider} compact />)}</div> : <div className="mt-5 grid gap-2 sm:grid-cols-3"><ProgressStep number="1" label="Copy install command" complete={copied === "install"} /><ProgressStep number="2" label="Run it in your project" active={copied === "install"} /><button type="button" onClick={() => void providers.refetch()} className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-black/15 px-3 py-3 text-left text-xs text-[#d9d8e2] transition hover:border-violet/35 hover:bg-violet/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-violet/[.14] text-[10px] font-semibold text-violet">3</span><span className="flex-1">{providers.isFetching ? "Checking…" : "Refresh this page"}</span><RefreshCw className="size-3.5" aria-hidden="true" /></button></div>}</section>
    <details className="surface rounded-2xl p-5 sm:p-6"><summary className="cursor-pointer text-sm font-semibold text-[#30352e]">Developer options</summary><div className="mt-5 space-y-4"><div className="rounded-xl border border-[#e0e4dc] bg-[#f7f9f6] p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#dce2d8] bg-white text-[#617158]"><Sparkles className="size-4" aria-hidden="true" /></span><p className="text-xs leading-5 text-[#687066]">Supported AI services are found automatically. Custom services can send a small activity record after each request.</p></div></div><div><p className="mb-2 text-xs font-semibold text-[#42483f]">Manual setup, only if the guide asks</p><CodeSnippet>{advancedHelp(session.technology)}</CodeSnippet></div><div className="flex items-start gap-3 rounded-xl border border-[#e0e4dc] bg-[#f7f9f6] p-4"><KeyRound className="mt-0.5 size-4 shrink-0 text-[#617158]" aria-hidden="true" /><p className="text-xs leading-5 text-[#687066]">Keep your private project key in server-side settings, never in public website code.</p></div></div></details>
  </div>;
}

function ProgressStep({ number, label, complete = false, active = false }: { number: string; label: string; complete?: boolean; active?: boolean }) {
  return <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-xs ${complete ? "border-success/25 bg-success/[.06] text-[#c9eadb]" : active ? "border-violet/30 bg-violet/[.06] text-[#e1ddf4]" : "border-white/[.08] bg-black/15 text-[#aaa9b7]"}`}><span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${complete ? "bg-success text-[#06140f]" : active ? "bg-violet/25 text-violet" : "bg-white/[.08] text-[#aaa9b7]"}`}>{complete ? <Check className="size-3" aria-label="Complete" /> : number}</span>{label}</div>;
}
