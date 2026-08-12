"use client";

import Link from "next/link";
import { ArrowRight, Boxes, CalendarDays, Check, Plus, Radio, ShieldCheck, Webhook } from "lucide-react";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const { projects, isReady } = useAgentLensSession();
  return <div className="space-y-8">
    <PageHeader eyebrow="Your monitored apps" title="Projects" description="A project is simply one app or AI feature you want AgentLens to watch." action={<Button asChild variant="primary" size="sm"><Link href="/app/settings"><Plus className="size-3.5" /> Add a project</Link></Button>} />
    {!isReady ? <section className="project-loading" aria-label="Loading your apps"><div><span /><span /></div><div><span /><span /></div><p>Loading your apps…</p></section> : projects.length ? <section className="project-list">{projects.map((project) => <article key={project.project_id} className="project-row"><div className="project-row-main"><span className="project-row-icon"><Boxes className="size-5" /></span><div><span>AI APP</span><Link href={`/app/projects/${project.project_id}`}>{project.name}</Link><p>Open setup, connection status, and activity.</p></div></div><div className="project-row-meta"><span><CalendarDays className="size-3.5" />Added {new Date(project.created_at).toLocaleDateString()}</span><span className={project.webhook_configured ? "ready" : "quiet"}>{project.webhook_configured ? <Check className="size-3.5" /> : <Webhook className="size-3.5" />}{project.webhook_configured ? "Alerts ready" : "Alerts optional"}</span></div><Button asChild variant="secondary" size="sm"><Link href={`/app/projects/${project.project_id}`}>Open app <ArrowRight className="size-3.5" /></Link></Button></article>)}</section> : <section className="project-empty"><div className="project-empty-copy"><span>START HERE</span><h2>Connect your first AI app.</h2><p>Name it, run one guided command, and then use your AI normally. AgentLens handles the technical detection.</p><Button asChild variant="primary" size="lg"><Link href="/app/settings">Connect an app <ArrowRight className="size-4" /></Link></Button></div><div className="project-empty-steps"><div><span>01</span><Radio className="size-4" /><b>Name your app</b><p>For example, “Support assistant”.</p></div><div><span>02</span><Boxes className="size-4" /><b>Run one command</b><p>AgentLens guides the setup.</p></div><div><span>03</span><ShieldCheck className="size-4" /><b>See a clear status</b><p>Ready, waiting, or needs attention.</p></div></div></section>}
    <section className="project-explainer"><ShieldCheck className="size-5" /><div><b>Projects stay separate and private.</b><p>Activity from one app is never mixed into another project.</p></div></section>
  </div>;
}
