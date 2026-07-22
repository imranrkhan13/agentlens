"use client";

import Link from "next/link";
import { ArrowRight, Boxes, CalendarDays, Plus, Radio, Webhook } from "lucide-react";
import { motion } from "framer-motion";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function ProjectsPage() {
  const { projects, isReady } = useAgentLensSession();
  return <div className="space-y-7"><PageHeader eyebrow="Workspace" title="Projects" description="Each project is an isolated stream of telemetry, managed by your signed-in account." action={<Button asChild variant="primary" size="sm"><Link href="/app/projects/new"><Plus className="size-3.5" /> New project</Link></Button>} />
    {!isReady ? <div className="surface h-44 animate-pulse rounded-2xl" /> : projects.length ? <div className="space-y-3">{projects.map((project, index) => <motion.div key={project.project_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} className="surface-glow overflow-hidden rounded-2xl"><div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex min-w-0 items-center gap-4"><span className="grid size-11 place-items-center rounded-2xl border border-violet/20 bg-violet/[.1] text-violet"><Boxes className="size-5" /></span><div className="min-w-0"><Link href={`/app/projects/${project.project_id}`} className="text-base font-medium text-[#f0eff7] transition hover:text-[#bcaeff]">{project.name}</Link><p className="mt-1 truncate font-mono text-xs text-[#767585]">{project.project_id}</p></div></div><Button asChild variant="secondary" size="sm"><Link href={`/app/projects/${project.project_id}`}>Open setup <ArrowRight className="size-3.5" /></Link></Button></div><div className="grid border-t border-white/[.075] sm:grid-cols-3"><div className="flex items-center gap-2 border-b border-white/[.075] px-5 py-3 text-xs text-[#858492] sm:border-b-0 sm:border-r"><Radio className="size-3.5 text-[#aaa9b7]" /> Awaiting real telemetry</div><div className="flex items-center gap-2 border-b border-white/[.075] px-5 py-3 text-xs text-[#858492] sm:border-b-0 sm:border-r"><CalendarDays className="size-3.5 text-violet" /> Created {new Date(project.created_at).toLocaleDateString()}</div><div className="flex items-center gap-2 px-5 py-3 text-xs text-[#858492]"><Webhook className="size-3.5 text-success" /> {project.webhook_configured ? "Webhook configured" : "No webhook configured"}</div></div></motion.div>)}</div> : <EmptyState icon={Boxes} title="Monitor your first AI project" description="Create a project, add AgentLens to your server, then make one AI request." action={{ href: "/app/projects/new", label: "Create project" }} />}
  </div>;
}
