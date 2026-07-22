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
  const providers = useQuery({ queryKey: ["providers", session?.projectId], queryFn: () => agentLensApi.getProviders(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });

  return <div className="space-y-7"><PageHeader eyebrow="Provider neutral" title="Detected providers" description="Providers and models appear only after this project sends real telemetry. Unknown providers are shown exactly as reported." />
    {!verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {providers.isError && isAgentLensApiError(providers.error) && <RequestDiagnosticsCard diagnostic={providers.error.diagnostic} />}
    {providers.isLoading ? <section className="grid gap-3 md:grid-cols-2"><div className="surface h-72 animate-pulse rounded-2xl" /><div className="surface h-72 animate-pulse rounded-2xl" /></section> : providers.data?.providers.length ? <section className="grid gap-4 xl:grid-cols-2">{providers.data.providers.map((provider) => <ProviderHealthCard key={provider.provider} provider={provider} showModels />)}</section> : <section className="surface-glow rounded-2xl p-6 sm:p-9"><EmptyState icon={Radio} title="No AI providers detected yet" description="Install the SDK and make your first AI request. Generic telemetry also works for custom SDKs, self-hosted models, and internal inference services." action={{ href: "/app/projects", label: "View SDK setup" }} /></section>}
    <section className="surface rounded-2xl p-5 sm:p-7"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan/20 bg-cyan/[.08] text-cyan"><Cable className="size-4" /></span><div><h2 className="text-sm font-medium text-[#e9e8f0]">Native adapters and generic telemetry</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#898896]">AgentLens labels a provider from the telemetry source that actually recorded it. Native adapters can expand over time; every provider can send the same privacy-safe generic event fields without being rejected or preconfigured.</p><div className="mt-4 flex items-center gap-2 text-[11px] text-[#aaa9b7]"><Activity className="size-3.5 text-violet" /> Provider names, models, timestamps, metrics, retries, and error categories are project-scoped.</div></div></div></section>
  </div>;
}
