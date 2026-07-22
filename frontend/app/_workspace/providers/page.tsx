"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Cable, Radio } from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import { isConnectionVerified } from "@/lib/session";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { PageHeader } from "@/components/page-header";
import { ProviderHealthCard } from "@/components/provider-health-card";
import { EmptyState } from "@/components/empty-state";
import { ConnectionCallout } from "@/components/connection-callout";
import { RequestDiagnosticsCard } from "@/components/connection-diagnostics-panel";
import { isAgentLensApiError } from "@/lib/api/diagnostics";

export default function ProvidersPage() {
  const { session, isReady } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const enabled = Boolean(session && isReady && verified);
  const services = useQuery({ queryKey: ["providers", session?.projectId], queryFn: () => agentLensApi.getProviders(session!.projectId), enabled, refetchInterval: enabled ? 15_000 : false });

  return <div className="space-y-7"><PageHeader eyebrow="Your AI app" title="AI services" description="Services appear here only after your app really uses them." />
    {!verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {services.isError && isAgentLensApiError(services.error) && <RequestDiagnosticsCard diagnostic={services.error.diagnostic} />}
    {services.isLoading ? <section className="grid gap-3 md:grid-cols-2"><div className="surface h-72 animate-pulse rounded-2xl" /><div className="surface h-72 animate-pulse rounded-2xl" /></section> : services.data?.providers.length ? <section className="grid gap-4 xl:grid-cols-2">{services.data.providers.map((service) => <ProviderHealthCard key={service.provider} provider={service} showModels />)}</section> : <section className="surface-glow rounded-2xl p-6 sm:p-9"><EmptyState icon={Radio} title="No AI services detected yet" description="We’re waiting for your AI to receive its first request." timeframe="Most activity appears within a minute after your first use." action={{ href: "/app/projects", label: "View setup" }} /></section>}
    <details className="surface rounded-2xl p-5 sm:p-7"><summary className="cursor-pointer text-sm font-medium text-[#e9e8f0]">Advanced</summary><div className="mt-4 flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan/20 bg-cyan/[.08] text-cyan"><Cable className="size-4" /></span><div><p className="text-xs leading-5 text-[#898896]">AgentLens shows only AI services from this project&apos;s real activity. A custom service can share its name and model too.</p><div className="mt-3 flex items-center gap-2 text-[11px] text-[#aaa9b7]"><Activity className="size-3.5 text-violet" /> Each project keeps its own activity private.</div></div></div></details>
  </div>;
}
