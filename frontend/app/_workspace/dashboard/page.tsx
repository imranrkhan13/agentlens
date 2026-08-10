"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, CircleDollarSign, Gauge, Radio, RefreshCw, ShieldCheck, Timer, TriangleAlert, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { agentLensApi } from "@/lib/api/client";
import { isAgentLensApiError } from "@/lib/api/diagnostics";
import { isConnectionVerified } from "@/lib/session";
import { describeResponseTime, formatCost, formatNumber } from "@/lib/utils";
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

export default function DashboardPage() {
  const { session, isReady } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const enabled = Boolean(session && isReady && verified);
  const stats = useQuery({ queryKey: ["stats", session?.projectId], queryFn: () => agentLensApi.getStats(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });
  const events = useQuery({ queryKey: ["events", session?.projectId, "recent"], queryFn: () => agentLensApi.getEvents(session!.projectId, 30), enabled, refetchInterval: enabled ? 15000 : false });
  const providers = useQuery({ queryKey: ["providers", session?.projectId], queryFn: () => agentLensApi.getProviders(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });
  const loading = !isReady || (verified && stats.isLoading);
  const data = stats.data;
  const responseTime = describeResponseTime(data?.avg_latency_ms);
  const responseTimeIcon = responseTime.kind === "fast" ? Zap : responseTime.kind === "normal" ? Activity : responseTime.kind === "slow" ? Timer : undefined;
  const chartData = [...(events.data?.events || [])].reverse().map((event) => ({ label: new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: event.latency_ms }));
  const requestError = [stats.error, events.error, providers.error].find(isAgentLensApiError);
  const latestActivity = data?.latest_event_at ? new Date(data.latest_event_at).toLocaleString() : null;
  function refresh() { void Promise.all([stats.refetch(), events.refetch(), providers.refetch()]); }

  if (isReady && !session) return <div className="mx-auto max-w-3xl pt-4"><section className="surface-glow overflow-hidden rounded-[28px] p-7 sm:p-11"><div className="max-w-xl"><span className="eyebrow">Your first win</span><h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#302d22] sm:text-4xl">See how your AI is doing.</h1><p className="mt-4 text-base leading-7 text-[#716b5e]">Create a project, connect it in a few minutes, and AgentLens will turn confusing AI failures into clear next steps.</p><div className="mt-7 flex flex-wrap gap-3"><Button asChild variant="primary" size="lg"><Link href="/app/projects/new">Create my first project</Link></Button><Button asChild variant="secondary" size="lg"><Link href="/app/diagnostics">How it works</Link></Button></div></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#eadfca] bg-[#fff8e8] p-4"><p className="text-xs font-semibold text-[#856928]">01 · Connect</p><p className="mt-2 text-sm text-[#5f594d]">Add one small helper to your app.</p></div><div className="rounded-2xl border border-[#dce6dc] bg-[#f3f8f1] p-4"><p className="text-xs font-semibold text-[#527052]">02 · Observe</p><p className="mt-2 text-sm text-[#5f594d]">Make a normal AI request.</p></div><div className="rounded-2xl border border-[#e2ddd3] bg-[#f8f6f0] p-4"><p className="text-xs font-semibold text-[#6f6759]">03 · Understand</p><p className="mt-2 text-sm text-[#5f594d]">See what needs attention.</p></div></div></section></div>;

  return <div className="space-y-7 sm:space-y-8">
    <PageHeader eyebrow="Project overview" title="What your AI app is doing." description={verified && session ? latestActivity ? `A simple view of ${session.projectName}. Last activity: ${latestActivity}.` : "We’re waiting for your AI to receive its first request." : session ? "Connect AgentLens before real activity can appear here." : "Connect an AgentLens project to begin."} action={<Button variant="secondary" size="sm" onClick={refresh} disabled={!verified || stats.isFetching || events.isFetching || providers.isFetching}><RefreshCw className="size-3.5" aria-hidden="true" /> {stats.isFetching || events.isFetching || providers.isFetching ? "Refreshing…" : "Refresh"}</Button>} />
    {!verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {requestError && <RequestDiagnosticsCard diagnostic={requestError.diagnostic} />}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard index={0} loading={loading} label="AI Conversations" helpText="The number of questions your AI received." value={verified ? formatNumber(data?.total_calls) : "—"} subtext={verified ? "Times your app used AI" : "Connect AgentLens first"} icon={Activity} />
      <MetricCard index={1} loading={loading} label="Answers Delivered" helpText="The number of successful AI replies." value={!verified || data?.success_rate == null ? "—" : `${data.success_rate}%`} subtext={verified ? data?.success_rate == null ? "No requests yet" : "Requests that finished successfully" : "Connect AgentLens first"} icon={ShieldCheck} />
      <MetricCard index={2} loading={loading} label="Typical Response Time" helpText="How quickly your AI usually replies." value={verified ? responseTime.label : "—"} hoverDetail={verified ? responseTime.detail : undefined} valueIcon={responseTimeIcon} subtext={verified ? data?.avg_latency_ms == null ? "No timing data yet" : "How long customers usually waited" : "Connect AgentLens first"} icon={Gauge} />
      <MetricCard index={3} loading={loading} label="AI Spend" helpText="Estimated cost of using AI." value={verified ? formatCost(data?.total_cost_usd) : "—"} subtext={verified ? "Only costs reported by your AI services" : "Connect AgentLens first"} icon={CircleDollarSign} />
      <MetricCard index={4} loading={loading} label="AI Services" helpText="The AI services your app has used." value={verified ? formatNumber(data?.detected_provider_count) : "—"} subtext={verified ? data?.detected_provider_count ? "Services seen in real activity" : "No services detected yet" : "Connect AgentLens first"} icon={Radio} />
      <MetricCard index={5} loading={loading} label="Needs Attention" helpText="Things you may want to check." value={verified ? formatNumber(data?.failed_calls) : "—"} subtext={verified ? data?.failed_calls ? "Requests that could not finish" : "Nothing needs attention" : "Connect AgentLens first"} icon={TriangleAlert} />
    </section>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.8fr)]"><TelemetryChart data={chartData} title="Customer wait time" /><motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }} className="surface-glow rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-sm font-medium text-[#ecebf3]">AI services your app used</h2><p className="mt-1 text-xs text-[#777685]">Only services seen in your app&apos;s real activity</p></div><span className="eyebrow">Real data</span></div><div className="mt-5 grid gap-3">{providers.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-white/[.035]" /> : providers.data?.providers.length ? providers.data.providers.slice(0, 3).map((provider) => <ProviderHealthCard key={provider.provider} provider={provider} />) : <EmptyState icon={Radio} title="No AI services detected yet" description="We’re waiting for your AI to receive its first request." timeframe="Most activity appears within a minute after your first use." />}</div></motion.section></div>
    <RecentEvents events={events.data?.events || []} hasSession={verified} isLoading={events.isLoading} />
  </div>;
}
