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

export default function EventsPage() {
  const { session, isReady } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const enabled = Boolean(session && isReady && verified);
  const events = useQuery({ queryKey: ["events", session?.projectId, "history"], queryFn: () => agentLensApi.getEvents(session!.projectId, 100), enabled, refetchInterval: enabled ? 15000 : false });

  return <div className="space-y-7"><PageHeader eyebrow="Telemetry" title="Events" description="A project-scoped, searchable history of telemetry that has actually arrived." />
    {!verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {events.isError && isAgentLensApiError(events.error) && <RequestDiagnosticsCard diagnostic={events.error.diagnostic} />}
    <RecentEvents events={events.data?.events || []} hasSession={verified} isLoading={events.isLoading} />
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet/20 bg-violet/[.08] text-violet"><Activity className="size-4" /></span><div><h2 className="text-sm font-medium text-[#eeedf4]">Generic telemetry works for every provider</h2><p className="mt-1 text-xs leading-5 text-[#7e7d8c]">Use a native adapter where available, or report a custom provider explicitly. AgentLens never reads prompt content to guess the provider.</p><div className="mt-4"><CodeSnippet>{`agentlens.track({
  provider: "custom-provider", model: "model-name",
  latencyMs, success, statusCode,
  inputTokens, outputTokens, estimatedCost,
  errorCategory
})`}</CodeSnippet></div></div></div></section>
    <div className="flex gap-3 rounded-2xl border border-warning/15 bg-warning/[.045] p-4 text-xs leading-5 text-[#b6aa7d]"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" /> Telemetry reads are authenticated and scoped to the connected project. Event payloads contain metadata only; prompts, completions, credentials, and request bodies are not accepted by this API.</div>
  </div>;
}
