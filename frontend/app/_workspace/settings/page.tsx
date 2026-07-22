"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronRight, FlaskConical, LoaderCircle, Plus } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import type { ProjectTechnology } from "@/lib/api/types";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { useProjectKeyReveal } from "@/components/workspace/project-key-reveal";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const technologies: Array<{ value: ProjectTechnology; label: string; hint: string }> = [
  { value: "nextjs", label: "Next.js", hint: "A React website" },
  { value: "node", label: "Node.js", hint: "A JavaScript server" },
  { value: "express", label: "Express", hint: "A Node.js app" },
  { value: "fastapi", label: "FastAPI", hint: "A Python API" },
  { value: "django", label: "Django", hint: "A Python website" },
  { value: "laravel", label: "Laravel", hint: "A PHP website" },
  { value: "python", label: "Python", hint: "Another Python app" },
  { value: "other", label: "Other", hint: "Something else" },
];

function installCommand(_technology: ProjectTechnology) {
  return "npx agentlens init";
}

export default function SettingsPage() {
  const router = useRouter();
  const { projects, refresh } = useAgentLensSession();
  const { storeProjectKey } = useProjectKeyReveal();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [technology, setTechnology] = useState<ProjectTechnology>("nextjs");
  const [error, setError] = useState<string | null>(null);
  const createProject = useMutation({
    mutationFn: () => agentLensApi.createProject({ name: name.trim(), technology }),
    onSuccess: async (project) => {
      storeProjectKey(project.project_id, project.api_key);
      await refresh();
      router.push(`/app/projects/${project.project_id}`);
    },
    onError: () => setError("We could not create your project. Please try again."),
  });

  function continueTo(nextStep: number) {
    setError(null);
    if (nextStep === 2 && !name.trim()) {
      setError("Tell us what you are building first.");
      return;
    }
    setStep(nextStep);
  }

  return <div className="space-y-7">
    <PageHeader eyebrow="New project" title="Monitor your first AI project" description="Create a project, install one small helper, then make a normal AI request." action={<Button asChild variant="secondary" size="sm"><Link href="/app/diagnostics"><FlaskConical className="size-3.5" /> Connection help</Link></Button>} />
    <section className="surface-glow mx-auto max-w-4xl rounded-2xl p-5 sm:p-7">
      <div className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((number) => <div key={number} className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${number < step ? "bg-success text-[#06140f]" : number === step ? "bg-violet text-white" : "bg-white/[.07] text-[#777685]"}`}>{number < step ? <Check className="size-3.5" /> : number}</span>{number !== 3 && <span className={`h-px w-8 sm:w-14 ${number < step ? "bg-success/60" : "bg-white/[.1]"}`} />}</div>)}
        <span className="ml-2 text-xs text-[#807f8e]">Step {step} of 3</span>
      </div>

      {step === 1 && <div className="mt-8 max-w-xl"><span className="eyebrow">Start here</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">What are you building?</h2><p className="mt-2 text-sm leading-6 text-[#9695a4]">Give this project a name you will recognise later.</p><label className="mt-6 block"><span className="sr-only">Project name</span><Input autoFocus required value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") continueTo(2); }} placeholder="AI Resume Builder" className="h-12 text-sm" /></label><p className="mt-3 text-xs text-[#777685]">Try: Customer Support Bot, AI Resume Builder, or Sales Assistant.</p>{error && <p role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger/[.08] px-3 py-2.5 text-xs text-[#ffb0b0]">{error}</p>}<Button className="mt-6" size="lg" onClick={() => continueTo(2)}>Continue <ChevronRight className="size-4" /></Button></div>}

      {step === 2 && <div className="mt-8"><span className="eyebrow">Your app</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">What technology are you using?</h2><p className="mt-2 text-sm leading-6 text-[#9695a4]">Choose the closest match. You can change this later.</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{technologies.map((option) => <button key={option.value} type="button" onClick={() => setTechnology(option.value)} className={`rounded-xl border p-4 text-left transition ${technology === option.value ? "border-violet/70 bg-violet/[.10] shadow-[0_0_24px_rgba(128,91,246,.12)]" : "border-white/[.08] bg-black/15 hover:border-white/[.18] hover:bg-white/[.03]"}`}><span className="flex items-center justify-between text-sm font-medium text-[#edecf4]">{option.label}{technology === option.value && <Check className="size-4 text-violet" />}</span><span className="mt-1.5 block text-xs text-[#7d7c8b]">{option.hint}</span></button>)}</div><div className="mt-6 flex gap-3"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button onClick={() => continueTo(3)}>Continue <ChevronRight className="size-4" /></Button></div></div>}

      {step === 3 && <div className="mt-8 max-w-2xl"><span className="eyebrow">One simple step</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">You will run one command.</h2><p className="mt-2 text-sm leading-6 text-[#9695a4]">After we create your project, we will give you a private key and one command to copy.</p><div className="mt-6 rounded-2xl border border-white/[.09] bg-black/30 p-4"><p className="text-[11px] font-medium uppercase tracking-[.13em] text-[#898796]">Your install command</p><code className="mt-3 block overflow-x-auto rounded-xl border border-white/[.08] bg-[#0b0b11] px-4 py-3 font-mono text-sm text-[#eeeafd]">{installCommand(technology)}</code><p className="mt-3 text-xs leading-5 text-[#898796]">It will guide you through the rest inside your project folder.</p></div>{error && <p role="alert" className="mt-4 rounded-xl border border-danger/20 bg-danger/[.08] px-3 py-2.5 text-xs text-[#ffb0b0]">{error}</p>}<div className="mt-6 flex gap-3"><Button variant="secondary" onClick={() => setStep(2)}>Back</Button><Button size="lg" disabled={createProject.isPending} onClick={() => { setError(null); createProject.mutate(); }}>{createProject.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{createProject.isPending ? "Creating project…" : "Create project"}</Button></div></div>}
    </section>
    <details className="surface mx-auto max-w-4xl rounded-2xl p-5"><summary className="cursor-pointer text-sm font-medium text-[#dedde7]">Your existing projects ({projects.length})</summary><p className="mt-2 text-xs text-[#7d7c8b]">Open a project to see its setup and activity.</p>{projects.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{projects.map((project) => <Link key={project.project_id} href={`/app/projects/${project.project_id}`} className="rounded-xl border border-white/[.08] bg-black/15 p-4 transition hover:border-violet/30 hover:bg-violet/[.04]"><p className="text-sm font-medium text-[#ecebf3]">{project.name}</p><p className="mt-1 text-[11px] text-[#777685]">Created {new Date(project.created_at).toLocaleDateString()}</p></Link>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/[.11] bg-black/15 p-4 text-sm text-[#878694]">Your first project will appear here.</p>}</details>
  </div>;
}
