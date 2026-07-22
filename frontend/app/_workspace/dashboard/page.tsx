"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, CircleDollarSign, Gauge, Radio, RefreshCw, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { agentLensApi } from "@/lib/api/client";
import { isAgentLensApiError } from "@/lib/api/diagnostics";
import { isConnectionVerified } from "@/lib/session";
import { formatCost, formatNumber } from "@/lib/utils";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { ProviderHealthCard } from "@/components/provider-health-card";
import { RecentEvents } from "@/components/recent-events";
import { TelemetryChart } from "@/components/telemetry-chart";
import { ConnectionCallout } from "@/components/connection-callout";
import { RequestDiagnosticsCard } from "@/components/connection-diagnostics-panel";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export default function DashboardPage() {
  const { session, isReady } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const enabled = Boolean(session && isReady && verified);
  const stats = useQuery({ queryKey: ["stats", session?.projectId], queryFn: () => agentLensApi.getStats(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });
  const events = useQuery({ queryKey: ["events", session?.projectId, "recent"], queryFn: () => agentLensApi.getEvents(session!.projectId, 30), enabled, refetchInterval: enabled ? 15000 : false });
  const providers = useQuery({ queryKey: ["providers", session?.projectId], queryFn: () => agentLensApi.getProviders(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });
  const loading = !isReady || (verified && stats.isLoading);
  const data = stats.data;
  const chartData = [...(events.data?.events || [])].reverse().map((event) => ({ label: new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: event.latency_ms }));
  const requestError = [stats.error, events.error, providers.error].find(isAgentLensApiError);
  const providerRequestTotal = providers.data?.providers.reduce((total, provider) => total + provider.request_volume, 0) || 0;
  const averageLatency = providerRequestTotal ? providers.data!.providers.reduce((total, provider) => total + provider.avg_latency_ms * provider.request_volume, 0) / providerRequestTotal : null;
  function refresh() {
    void Promise.all([stats.refetch(), events.refetch(), providers.refetch()]);
  }

  if (isReady && !session) return <div className="mx-auto max-w-2xl pt-8"><section className="surface-glow rounded-[28px] p-7 text-center sm:p-10"><span className="eyebrow">First project</span><h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">Monitor your first AI project</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#9796a6]">Create a project, add AgentLens to your server, then make one AI request.</p><Button asChild variant="primary" size="lg" className="mt-7"><Link href="/app/projects/new">Create project</Link></Button></section></div>;

  return <div className="space-y-7 sm:space-y-8">
    <PageHeader eyebrow="Live workspace" title="Your AI traffic, without the blind spots." description={verified && session ? `Monitoring ${session.projectName}. Metrics refresh every 15 seconds.` : session ? "Finish backend verification before the dashboard sends telemetry requests." : "Connect an AgentLens project to begin monitoring real application telemetry."} action={<Button variant="secondary" size="sm" onClick={refresh} disabled={!verified || stats.isFetching || events.isFetching || providers.isFetching}><RefreshCw className={stats.isFetching || events.isFetching || providers.isFetching ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh</Button>} />
    {!verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {requestError && <RequestDiagnosticsCard diagnostic={requestError.diagnostic} />}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard index={0} loading={loading} label="Requests" value={verified ? formatNumber(data?.total_calls) : "—"} subtext={verified ? "All recorded calls" : "Verify backend first"} icon={Activity} /><MetricCard index={1} loading={loading} label="Success rate" value={!verified || data?.success_rate == null ? "—" : `${data.success_rate}%`} subtext={verified ? data?.success_rate == null ? "No events yet" : "Across all calls" : "Verify backend first"} icon={ShieldCheck} /><MetricCard index={2} loading={providers.isLoading} label="Avg. latency" value={averageLatency === null ? "—" : `${Math.round(averageLatency)} ms`} subtext={averageLatency === null ? "No provider telemetry yet" : "Across detected providers"} icon={Gauge} /><MetricCard index={3} loading={loading} label="Estimated cost" value={verified ? formatCost(data?.total_cost_usd) : "—"} subtext={verified ? "Based on sent event costs" : "Verify backend first"} icon={CircleDollarSign} /></section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.8fr)]"><TelemetryChart data={chartData} /><motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }} className="surface-glow rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-[#ecebf3]">Detected providers</h2><p className="mt-1 text-xs text-[#777685]">Generated only from this project&apos;s telemetry</p></div><span className="eyebrow">Real data</span></div><div className="mt-5 grid gap-3">{providers.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-white/[.035]" /> : providers.data?.providers.length ? providers.data.providers.slice(0, 3).map((provider) => <ProviderHealthCard key={provider.provider} provider={provider} />) : <EmptyState icon={Radio} title="No AI providers detected yet" description="Install the SDK and make your first AI request." />}</div></motion.section></div>
    <RecentEvents events={events.data?.events || []} hasSession={verified} isLoading={events.isLoading} />
  </div>;
}
