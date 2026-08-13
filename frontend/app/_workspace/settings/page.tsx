"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, CircleHelp, Plus, ShieldCheck, WandSparkles } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { useProjectKeyReveal } from "@/components/workspace/project-key-reveal";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAgentLensApiError } from "@/lib/api/diagnostics";

export default function SettingsPage() {
  const router = useRouter();
  const { projects, refresh } = useAgentLensSession();
  const { storeProjectKey } = useProjectKeyReveal();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createProject = useMutation({
    mutationFn: () => agentLensApi.createProject({ name: name.trim(), technology: "other" }),
    onSuccess: async (project) => {
      storeProjectKey(project.project_id, project.api_key);
      await refresh();
      // Notify the sidebar and top bar without reloading the document. The
      // one-time key remains only in memory until the setup page consumes it.
      window.dispatchEvent(new Event("agentlens:projects-updated"));
      router.push(`/app/projects/${project.project_id}`);
    },
    onError: (createError) => setError(isAgentLensApiError(createError) ? createError.diagnostic.summary : "We could not create your app. Please try again."),
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give your app a short name first.");
      return;
    }
    createProject.mutate();
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Connect an app"
        title="Start monitoring in a few minutes."
        description="Name the AI feature you want to watch. AgentLens will detect the technical details for you."
      />

      <section className="onboarding-layout">
        <form onSubmit={submit} className="onboarding-card">
          <div className="onboarding-step"><span>1</span> First, name your app</div>
          <h2>What should we call it?</h2>
          <p>Use a name you already recognise. You do not need to know the framework or AI model.</p>

          <label className="onboarding-label" htmlFor="project-name">App or AI feature name</label>
          <Input
            id="project-name"
            autoFocus
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Customer support assistant"
            className="onboarding-input"
          />
          <p className="onboarding-example">Examples: Support assistant, Resume writer, Sales helper</p>

          {error && <div role="alert" className="onboarding-error"><b>We could not create this app.</b><p>{error}</p><Link href="/app/diagnostics"><CircleHelp aria-hidden="true" />Open connection check</Link></div>}

          <Button type="submit" size="lg" variant="primary" disabled={createProject.isPending} className="mt-6 w-full sm:w-auto">
            {createProject.isPending ? "Creating your app…" : <><Plus className="size-4" aria-hidden="true" />Create app and continue</>}
          </Button>
        </form>

        <aside className="onboarding-next" aria-label="What happens next">
          <div className="onboarding-next-icon"><WandSparkles aria-hidden="true" /></div>
          <p className="onboarding-kicker">What happens next</p>
          <h2>AgentLens guides the rest.</h2>
          <ol>
            <li><span><Check aria-hidden="true" /></span><div><b>We create a private key</b><p>It belongs only to this app.</p></div></li>
            <li><span>2</span><div><b>You run one command</b><p><code>npx agentlens init</code></p></div></li>
            <li><span>3</span><div><b>Use your AI normally</b><p>Your dashboard updates automatically.</p></div></li>
          </ol>
          <div className="onboarding-safe"><ShieldCheck aria-hidden="true" /><p><b>No provider key needed here.</b><br />AgentLens does not need your customer conversations.</p></div>
        </aside>
      </section>

      {projects.length > 0 && (
        <section className="existing-apps">
          <div><p className="onboarding-kicker">Already connected</p><h2>Your apps</h2></div>
          <div className="existing-app-list">
            {projects.map((project) => (
              <Link key={project.project_id} href={`/app/projects/${project.project_id}`}>
                <span>{project.name.slice(0, 1).toUpperCase()}</span>
                <div><b>{project.name}</b><small>Added {new Date(project.created_at).toLocaleDateString()}</small></div>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
