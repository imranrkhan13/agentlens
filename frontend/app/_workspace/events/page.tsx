"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, ShieldAlert } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import { isAgentLensApiError } from "@/lib/api/diagnostics";
import { isConnectionVerified } from "@/lib/session";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { PageHeader } from "@/components/page-header";
import { RecentEvents } from "@/components/recent-events";
import { ConnectionCallout } from "@/components/connection-callout";
import { RequestDiagnosticsCard } from "@/components/connection-diagnostics-panel";
import { CodeSnippet } from "@/components/code-snippet";
import { WorkspaceLoadError } from "@/components/workspace/workspace-load-error";

export default function EventsPage() {
  const { session, isReady, loadError, refresh } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const enabled = Boolean(session && isReady && verified);
  const events = useQuery({ queryKey: ["events", session?.projectId, "history"], queryFn: () => agentLensApi.getEvents(session!.projectId, 100), enabled, refetchInterval: enabled ? 15_000 : false });

  return <div className="space-y-7"><PageHeader eyebrow="Your AI app" title="Activity" description="A simple history of what your AI did and whether it answered." />
    {loadError ? <WorkspaceLoadError message={loadError} retry={() => void refresh()} /> : !verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {events.isError && isAgentLensApiError(events.error) && <RequestDiagnosticsCard diagnostic={events.error.diagnostic} />}
    {!loadError && <RecentEvents events={events.data?.events || []} hasSession={verified} isLoading={events.isLoading} />}
    <details className="surface rounded-2xl p-5 sm:p-6"><summary className="cursor-pointer text-sm font-medium text-[#eeedf4]">Advanced</summary><div className="mt-4 flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet/20 bg-violet/[.08] text-violet"><Activity className="size-4" /></span><div><p className="text-xs leading-5 text-[#7e7d8c]">If you use a custom AI service, your developer can share its activity with this small extra call. Your prompts and private keys are not included.</p><div className="mt-4"><CodeSnippet>{'agentlens.track({\\n  provider: "custom-ai-service", model: "model-name",\\n  latencyMs, success, statusCode\\n})'}</CodeSnippet></div></div></div></details>
    <div className="flex gap-3 rounded-2xl border border-warning/15 bg-warning/[.045] p-4 text-xs leading-5 text-[#b6aa7d]"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" /> We show activity details, not your customers&apos; messages, passwords, or private keys.</div>
  </div>;
}
