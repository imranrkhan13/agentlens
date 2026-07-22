"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FlaskConical, LoaderCircle, Plus, Server, ShieldCheck, Webhook } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { useProjectKeyReveal } from "@/components/workspace/project-key-reveal";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const router = useRouter();
  const { projects, refresh } = useAgentLensSession();
  const { storeProjectKey } = useProjectKeyReveal();
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createProject = useMutation({
    mutationFn: () => agentLensApi.createProject({ name: name.trim(), webhook_url: webhookUrl.trim() || undefined }),
    onSuccess: async (project) => {
      storeProjectKey(project.project_id, project.api_key);
      await refresh();
      router.push(`/app/projects/${project.project_id}`);
    },
    onError: () => setError("We could not create that project. Check the server configuration and try again."),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (name.trim()) createProject.mutate();
  }

  return <div className="space-y-7"><PageHeader eyebrow="Workspace settings" title="Projects and setup" description="Your account reads dashboard data. Project API keys are generated once and belong only in your application server." action={<Button asChild variant="secondary" size="sm"><Link href="/app/diagnostics"><FlaskConical className="size-3.5" /> Diagnostics</Link></Button>} />
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><section className="surface-glow rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-violet/20 bg-violet/[.09] text-violet"><Plus className="size-4" /></span><div><h2 className="text-sm font-medium text-[#efeff5]">Create a project</h2><p className="mt-1 text-xs text-[#7d7c8b]">The key will be shown once, then you&apos;ll go directly to setup.</p></div></div><form onSubmit={onSubmit} className="mt-6 space-y-5"><label className="block"><span className="text-xs font-medium text-[#d6d5df]">Project name</span><Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Production assistant" className="mt-2" /></label><label className="block"><span className="text-xs font-medium text-[#d6d5df]">Webhook URL <span className="font-normal text-[#777685]">optional</span></span><Input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://example.com/agentlens" className="mt-2" /></label>{error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger/[.08] px-3 py-2.5 text-xs text-[#ffb0b0]">{error}</p>}<Button type="submit" variant="primary" disabled={createProject.isPending || !name.trim()}>{createProject.isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}{createProject.isPending ? "Creating project…" : "Create project"}</Button></form></section>
      <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-success/20 bg-success/[.08] text-success"><ShieldCheck className="size-4" /></span><div><h2 className="text-sm font-medium text-[#efeff5]">Account security</h2><p className="mt-1 text-xs text-[#7d7c8b]">Dashboard access uses your signed-in account, never a copied SDK key.</p></div></div><div className="mt-6 space-y-3"><div className="rounded-xl border border-white/[.075] bg-black/15 p-4 text-xs leading-5 text-[#8f8e9c]"><Server className="mb-2 size-4 text-[#b7b0df]" />Browser requests go through the authenticated AgentLens application route. The backend receives an account identity from the server, not from browser storage.</div><div className="rounded-xl border border-white/[.075] bg-black/15 p-4 text-xs leading-5 text-[#8f8e9c]"><Webhook className="mb-2 size-4 text-[#b7b0df]" />Webhooks are optional. Their delivery history will show only real recorded attempts once alerting is enabled.</div></div></section></div>
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-medium text-[#ededf4]">Your projects</h2><p className="mt-1 text-xs text-[#7c7b8a]">Select a project to review its setup and real telemetry.</p></div><span className="eyebrow">{projects.length} {projects.length === 1 ? "project" : "projects"}</span></div>{projects.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{projects.map((project) => <Link key={project.project_id} href={`/app/projects/${project.project_id}`} className="rounded-xl border border-white/[.08] bg-black/15 p-4 transition hover:border-violet/30 hover:bg-violet/[.04]"><p className="text-sm font-medium text-[#ecebf3]">{project.name}</p><p className="mt-1 text-[11px] text-[#777685]">Created {new Date(project.created_at).toLocaleDateString()} · {project.webhook_configured ? "Webhook configured" : "No webhook"}</p></Link>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-white/[.11] bg-black/15 p-5 text-sm text-[#878694]">No projects yet. Create one above to begin.</p>}</section>
  </div>;
}
