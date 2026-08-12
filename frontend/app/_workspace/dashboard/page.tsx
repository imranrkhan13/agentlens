"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Check, CircleDollarSign, CircleHelp, Gauge, LockKeyhole, Radio, RefreshCw, ShieldCheck, Sparkles, TriangleAlert, Zap } from "lucide-react";
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
  const data = stats.data;
  const loading = !isReady || (verified && stats.isLoading);
  const responseTime = describeResponseTime(data?.avg_latency_ms);
  const chartData = [...(events.data?.events || [])].reverse().map((event) => ({ label: new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: event.latency_ms }));
  const requestError = [stats.error, events.error, providers.error].find(isAgentLensApiError);
  const hasTraffic = Boolean(data?.total_calls);
  const hasFailures = Boolean(data?.failed_calls);
  const health = !verified ? "setup" : loading ? "checking" : hasFailures ? "attention" : hasTraffic ? "healthy" : "waiting";
  const healthCopy = {
    setup: { eyebrow: "ONE STEP LEFT", title: "Connect your first AI app.", body: "AgentLens is ready. Add one app so it can begin watching your AI.", action: "Connect app", href: "/app/settings" },
    checking: { eyebrow: "CHECKING NOW", title: "Reading your latest AI activity…", body: "This usually takes only a moment.", action: "View projects", href: "/app/projects" },
    waiting: { eyebrow: "CONNECTED · WAITING", title: "Everything is ready for your first request.", body: "Use your AI feature normally. This page will update automatically when activity arrives.", action: "View setup", href: `/app/projects/${session?.projectId || ""}` },
    attention: { eyebrow: "NEEDS YOUR ATTENTION", title: `${formatNumber(data?.failed_calls)} AI ${data?.failed_calls === 1 ? "request needs" : "requests need"} a closer look.`, body: "Open activity to see which provider failed and what your team should check first.", action: "See what happened", href: "/app/events" },
    healthy: { eyebrow: "RUNNING NORMALLY", title: "Your AI is answering as expected.", body: `${formatNumber(data?.successful_calls)} requests completed successfully. Nothing urgent needs your attention.`, action: "View activity", href: "/app/events" },
  }[health];

  function refresh() { void Promise.all([stats.refetch(), events.refetch(), providers.refetch()]); }

  return <div className="space-y-8">
    <PageHeader eyebrow="Home" title={session ? `Good to see you. Here’s ${session.projectName}.` : "Let’s connect your first AI app."} description="A simple view of what is working, what needs attention, and what to do next." action={<Button variant="secondary" size="sm" onClick={refresh} disabled={!verified || stats.isFetching}><RefreshCw className={`size-3.5 ${stats.isFetching ? "animate-spin" : ""}`} />Refresh</Button>} />

    <section className={`dashboard-health-card dashboard-health-${health}`}>
      <div className="dashboard-health-icon">{health === "healthy" ? <Check className="size-6" /> : health === "attention" ? <TriangleAlert className="size-6" /> : <Activity className="size-6" />}</div>
      <div className="dashboard-health-copy"><span>{healthCopy.eyebrow}</span><h2>{healthCopy.title}</h2><p>{healthCopy.body}</p></div>
      <Button asChild variant="primary" size="sm"><Link href={healthCopy.href}>{healthCopy.action}<ArrowRight className="size-3.5" /></Link></Button>
    </section>

    <section className="dashboard-match-banner"><div className="dashboard-match-icon"><Sparkles /></div><div><span>NEED HELP CHOOSING AN AI?</span><h2>Tell us the job. We’ll compare the options.</h2><p>AgentLens tests quality, speed, reliability, and estimated cost with safe examples.</p></div><Button asChild variant="secondary"><Link href="/app/match">Compare AI providers <ArrowRight /></Link></Button></section>

    {!verified && <ConnectionCallout needsVerification={Boolean(session)} />}
    {requestError && <RequestDiagnosticsCard diagnostic={requestError.diagnostic} />}

    <section className="dashboard-question"><div><Sparkles className="size-4" /><span>THE SIMPLE VERSION</span></div><p>{health === "attention" ? "Some requests could not finish. Start with Activity; the most recent failure is listed first." : health === "healthy" ? "Your AI is available, responding normally, and no failed requests are open right now." : health === "waiting" ? "The connection is ready. AgentLens is waiting for someone to use your AI feature." : "Connect one app. You do not need to configure providers by hand."}</p></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard index={0} loading={loading} label="Conversations watched" helpText="The number of AI requests AgentLens observed." value={verified ? formatNumber(data?.total_calls) : "—"} subtext={hasTraffic ? "Real requests from your app" : "Waiting for the first request"} icon={Activity} />
      <MetricCard index={1} loading={loading} label="Answers delivered" helpText="The share of requests that completed successfully." value={!verified || data?.success_rate == null ? "—" : `${data.success_rate}%`} subtext={hasTraffic ? "Finished successfully" : "No activity yet"} icon={ShieldCheck} />
      <MetricCard index={2} loading={loading} label="Usual response" helpText="How long your users generally wait for an AI answer." value={verified ? responseTime.label : "—"} hoverDetail={verified ? responseTime.detail : undefined} valueIcon={responseTime.kind === "fast" ? Zap : undefined} subtext={hasTraffic ? "Customer wait time" : "No timing data yet"} icon={Gauge} />
      <MetricCard index={3} loading={loading} label="AI cost seen" helpText="Estimated provider cost reported by your AI calls." value={verified ? formatCost(data?.total_cost_usd) : "—"} subtext={hasTraffic ? "Estimated from providers" : "No cost data yet"} icon={CircleDollarSign} />
    </section>

    <section className="dashboard-two-column">
      <TelemetryChart data={chartData} title="How long customers waited" />
      <div className="surface-glow rounded-2xl p-5 sm:p-6"><div className="dashboard-panel-heading"><div><span>AI SERVICES</span><h2>Who handled your requests</h2><p>Only services your app actually used.</p></div><Radio className="size-4" /></div><div className="mt-5 grid gap-3">{providers.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-white/[.035]" /> : providers.data?.providers.length ? providers.data.providers.slice(0, 3).map((provider) => <ProviderHealthCard key={provider.provider} provider={provider} />) : <EmptyState icon={Radio} title="No AI services yet" description="They appear automatically after your first AI request." action={{ href: "/app/projects", label: "Open setup" }} />}</div></div>
    </section>

    <RecentEvents events={events.data?.events || []} hasSession={verified} isLoading={events.isLoading} />

    <section className="dashboard-security"><LockKeyhole className="size-5" /><div><span>PRIVATE BY DESIGN</span><h2>Operational signals, not customer conversations.</h2><p>AgentLens does not need prompt text, provider API keys, or customer passwords to monitor reliability.</p></div><Link href="/app/security">See how your data is protected <ArrowRight className="size-3.5" /></Link><CircleHelp className="dashboard-security-mark" /></section>
  </div>;
}
