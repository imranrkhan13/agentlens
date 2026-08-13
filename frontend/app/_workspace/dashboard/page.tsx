"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Boxes,
  Check,
  CircleDollarSign,
  Gauge,
  LockKeyhole,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { agentLensApi } from "@/lib/api/client";
import { isAgentLensApiError } from "@/lib/api/diagnostics";
import { describeResponseTime, formatCost, formatNumber } from "@/lib/utils";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { ProviderHealthCard } from "@/components/provider-health-card";
import { RecentEvents } from "@/components/recent-events";
import { TelemetryChart } from "@/components/telemetry-chart";
import { RequestDiagnosticsCard } from "@/components/connection-diagnostics-panel";
import { EmptyState } from "@/components/empty-state";

export default function DashboardPage() {
  const { session, isReady, loadError, refresh: refreshSession } = useAgentLensSession();
  const enabled = Boolean(session && isReady && !loadError);
  const stats = useQuery({ queryKey: ["stats", session?.projectId], queryFn: () => agentLensApi.getStats(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });
  const events = useQuery({ queryKey: ["events", session?.projectId, "recent"], queryFn: () => agentLensApi.getEvents(session!.projectId, 30), enabled, refetchInterval: enabled ? 15000 : false });
  const providers = useQuery({ queryKey: ["providers", session?.projectId], queryFn: () => agentLensApi.getProviders(session!.projectId), enabled, refetchInterval: enabled ? 15000 : false });

  if (!isReady) return <DashboardLoading />;
  if (loadError) return <ServiceUnavailable message={loadError} retry={() => void refreshSession()} />;
  if (!session) return <FirstRunDashboard />;

  const data = stats.data;
  const loading = stats.isLoading;
  const responseTime = describeResponseTime(data?.avg_latency_ms);
  const chartData = [...(events.data?.events || [])].reverse().map((event) => ({ label: new Date(event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: event.latency_ms }));
  const requestError = [stats.error, events.error, providers.error].find(isAgentLensApiError);
  const hasTraffic = Boolean(data?.total_calls);

  function refresh() { void Promise.all([stats.refetch(), events.refetch(), providers.refetch()]); }

  if (!loading && !requestError && !hasTraffic) {
    return <WaitingDashboard projectId={session.projectId} projectName={session.projectName} refresh={refresh} checking={stats.isFetching} />;
  }

  const hasFailures = Boolean(data?.failed_calls);
  const healthCopy = hasFailures
    ? {
        eyebrow: "Needs attention",
        title: `${formatNumber(data?.failed_calls)} ${data?.failed_calls === 1 ? "request needs" : "requests need"} a closer look.`,
        body: "Open activity to see the latest failure and the provider involved.",
        action: "Review activity",
        href: "/app/events",
      }
    : {
        eyebrow: "Running normally",
        title: `${session.projectName} is healthy.`,
        body: `${formatNumber(data?.successful_calls)} requests completed successfully. Nothing urgent needs your attention.`,
        action: "View activity",
        href: "/app/events",
      };

  return <div className="space-y-7">
    <PageHeader
      eyebrow="Overview"
      title={session.projectName}
      description="What is working, what needs attention, and the next useful action."
      action={<Button variant="secondary" size="sm" onClick={refresh} disabled={stats.isFetching}><RefreshCw className={`size-3.5 ${stats.isFetching ? "animate-spin" : ""}`} />Refresh</Button>}
    />

    <section className={`dashboard-health-card ${hasFailures ? "dashboard-health-attention" : "dashboard-health-healthy"}`}>
      <div className="dashboard-health-icon">{hasFailures ? <TriangleAlert className="size-6" /> : <Check className="size-6" />}</div>
      <div className="dashboard-health-copy"><span>{healthCopy.eyebrow}</span><h2>{healthCopy.title}</h2><p>{healthCopy.body}</p></div>
      <Button asChild variant="primary" size="sm"><Link href={healthCopy.href}>{healthCopy.action}<ArrowRight className="size-3.5" /></Link></Button>
    </section>

    {requestError && <RequestDiagnosticsCard diagnostic={requestError.diagnostic} />}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard index={0} loading={loading} label="Requests watched" helpText="The number of AI requests AgentLens observed." value={formatNumber(data?.total_calls)} subtext="Real requests from your app" icon={Activity} />
      <MetricCard index={1} loading={loading} label="Answers delivered" helpText="The share of requests that completed successfully." value={data?.success_rate == null ? "—" : `${data.success_rate}%`} subtext="Finished successfully" icon={ShieldCheck} />
      <MetricCard index={2} loading={loading} label="Usual response" helpText="How long users generally wait for an AI answer." value={responseTime.label} hoverDetail={responseTime.detail} valueIcon={responseTime.kind === "fast" ? Zap : undefined} subtext="Customer wait time" icon={Gauge} />
      <MetricCard index={3} loading={loading} label="Estimated AI cost" helpText="Estimated provider cost reported by your AI calls." value={formatCost(data?.total_cost_usd)} subtext="Across observed requests" icon={CircleDollarSign} />
    </section>

    <section className="dashboard-two-column">
      <TelemetryChart data={chartData} title="Response time" />
      <div className="surface rounded-2xl p-5 sm:p-6"><div className="dashboard-panel-heading"><div><span>AI services</span><h2>Providers in this app</h2><p>Only services your app actually used.</p></div><Radio className="size-4" /></div><div className="mt-5 grid gap-3">{providers.isLoading ? <div className="h-36 animate-pulse rounded-xl bg-[#f2f4f0]" /> : providers.data?.providers.length ? providers.data.providers.slice(0, 3).map((provider) => <ProviderHealthCard key={provider.provider} provider={provider} />) : <EmptyState icon={Radio} title="No AI services yet" description="They appear automatically after your first AI request." action={{ href: `/app/projects/${session.projectId}`, label: "Open setup" }} />}</div></div>
    </section>

    <RecentEvents events={events.data?.events || []} hasSession isLoading={events.isLoading} />

    <section className="dashboard-footer-actions">
      <Link href="/app/match"><Sparkles /><span><b>Compare AI providers</b><small>Test quality, speed, reliability, and cost.</small></span><ArrowRight /></Link>
      <Link href="/app/security"><LockKeyhole /><span><b>Privacy and security</b><small>See exactly what AgentLens stores.</small></span><ArrowRight /></Link>
    </section>
  </div>;
}

function DashboardLoading() {
  return <div className="dashboard-loading" aria-label="Loading your workspace"><div /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <span key={item} />)}</div></div>;
}

function ServiceUnavailable({ message, retry }: { message: string; retry: () => void }) {
  return <div className="space-y-7"><PageHeader eyebrow="Connection issue" title="Your workspace could not load." description="Your account is safe. The web app could not reach the AgentLens service." /><section className="dashboard-service-error"><TriangleAlert /><div><span>What went wrong</span><h2>{message}</h2><p>Retry once. If it continues, open the connection check for the exact failing setting.</p><div><Button variant="primary" onClick={retry}><RefreshCw />Try again</Button><Button asChild variant="secondary"><Link href="/app/diagnostics">Open connection check</Link></Button></div></div></section></div>;
}

function FirstRunDashboard() {
  return <div className="space-y-7">
    <PageHeader eyebrow="Welcome" title="Monitor your first AI feature." description="You do not need to understand models, tokens, or infrastructure. AgentLens guides the setup." />
    <section className="first-run-dashboard">
      <div className="first-run-primary">
        <span className="first-run-kicker"><span />Takes about three minutes</span>
        <h2>Start with the name your team already uses.</h2>
        <p>“Support assistant” or “Resume writer” is perfect. We create a private key, then give you one command to run.</p>
        <Button asChild variant="primary" size="lg"><Link href="/app/settings">Connect my first app <ArrowRight /></Link></Button>
        <div className="first-run-trust"><ShieldCheck /><span><b>No provider key required here.</b><small>We monitor operational signals, not customer conversations.</small></span></div>
      </div>
      <ol className="first-run-steps">
        <li><span>1</span><Boxes /><div><b>Name the AI feature</b><p>Use plain language. No technical choices.</p></div></li>
        <li><span>2</span><TerminalSquare /><div><b>Run one guided command</b><p><code>npx agentlens init</code> handles setup.</p></div></li>
        <li><span>3</span><Activity /><div><b>Use your app normally</b><p>Health and activity appear automatically.</p></div></li>
      </ol>
    </section>
    <section className="first-run-secondary">
      <Link href="/app/match"><Sparkles /><div><span>Not sure which AI to use?</span><b>Compare providers with safe sample tests.</b></div><ArrowRight /></Link>
      <Link href="/app/security"><LockKeyhole /><div><span>Private by design</span><b>Understand what is—and is not—collected.</b></div><ArrowRight /></Link>
    </section>
  </div>;
}

function WaitingDashboard({ projectId, projectName, refresh, checking }: { projectId: string; projectName: string; refresh: () => void; checking: boolean }) {
  return <div className="space-y-7">
    <PageHeader eyebrow="Setup" title={`${projectName} is ready to connect.`} description="Complete one guided command, then make a normal AI request." action={<Button variant="secondary" size="sm" onClick={refresh} disabled={checking}><RefreshCw className={`size-3.5 ${checking ? "animate-spin" : ""}`} />Check again</Button>} />
    <section className="waiting-dashboard">
      <div className="waiting-dashboard-copy"><span>Next action</span><h2>Finish the guided setup.</h2><p>Open your app setup, copy the private key, and run the command in your app folder. AgentLens will detect the first request automatically.</p><Button asChild variant="primary" size="lg"><Link href={`/app/projects/${projectId}`}>Continue setup <ArrowRight /></Link></Button></div>
      <div className="waiting-dashboard-status"><span><i />Waiting for first activity</span><div><Activity /><p><b>No activity yet</b><small>This is normal until the command is installed and the AI feature is used once.</small></p></div><code>npx agentlens init</code></div>
    </section>
    <section className="first-run-secondary"><Link href="/app/match"><Sparkles /><div><span>Choose with confidence</span><b>Compare AI providers while setup is in progress.</b></div><ArrowRight /></Link><Link href="/app/diagnostics"><ShieldCheck /><div><span>Something not connecting?</span><b>Run the connection check for a clear answer.</b></div><ArrowRight /></Link></section>
  </div>;
}
