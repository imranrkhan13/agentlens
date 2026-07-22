"use client";

import Link from "next/link";
import { ArrowRight, Search, Waves } from "lucide-react";
import { useMemo, useState } from "react";
import type { TelemetryEvent } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { cn, formatCost, formatNumber } from "@/lib/utils";

export function RecentEvents({ events, hasSession, isLoading = false }: { events: TelemetryEvent[]; hasSession: boolean; isLoading?: boolean }) {
  const [search, setSearch] = useState("");
  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;
    return events.filter((event) => [event.provider, event.model, event.error_category, event.status_code?.toString(), event.endpoint, event.http_method].filter(Boolean).some((value) => value!.toLowerCase().includes(term)));
  }, [events, search]);

  return (
    <section className="surface-glow overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-4 border-b border-white/[.075] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-sm font-medium text-[#ebebf2]">Recent events</h2><p className="mt-1 text-xs text-[#777685]">The latest recorded calls from this project</p></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#767583]" /><Input aria-label="Search real events" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search provider, model, or endpoint" className="h-9 w-52 pl-8 text-xs sm:w-60" /></div></div>
      {isLoading ? <div className="space-y-3 p-5 sm:p-6">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-10 animate-pulse rounded-lg bg-white/[.035]" />)}</div> : visibleEvents.length ? <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-xs"><thead className="border-b border-white/[.06] bg-black/15 text-[10px] font-semibold uppercase tracking-[.13em] text-[#6f6e7d]"><tr><th className="px-5 py-3 font-semibold sm:px-6">Provider / model</th><th className="px-4 py-3 font-semibold">Endpoint</th><th className="px-4 py-3 font-semibold">Result</th><th className="px-4 py-3 font-semibold">Usage</th><th className="px-4 py-3 font-semibold">Latency</th><th className="px-4 py-3 font-semibold">Source</th><th className="px-5 py-3 text-right font-semibold sm:px-6">Received</th></tr></thead><tbody className="divide-y divide-white/[.055]">{visibleEvents.map((event) => <EventRow key={event.id} event={event} />)}</tbody></table></div> : <div className="p-5 sm:p-6"><EmptyState icon={Waves} title={hasSession ? search ? "No matching real events" : "No events recorded yet" : "Connect a project to watch traffic"} description={hasSession ? search ? "Try a provider, model, endpoint, error category, or status code from this project." : "Install the SDK and make your first AI request to see telemetry here." : "Create or connect a project first. This dashboard only displays telemetry that has actually arrived."} action={{ href: hasSession ? "/projects" : "/settings", label: hasSession ? "View SDK setup" : "Connect project" }} /></div>}
      <div className="flex items-center justify-between border-t border-white/[.075] px-5 py-3 text-xs text-[#777685] sm:px-6"><span>Showing real telemetry only</span><Link href="/app/events" className="flex items-center gap-1.5 text-[#b7aaff] transition hover:text-white">Open event history <ArrowRight className="size-3.5" /></Link></div>
    </section>
  );
}

function EventRow({ event }: { event: TelemetryEvent }) {
  const status = event.status_code ? `HTTP ${event.status_code}` : "No HTTP response";
  const result = event.success ? "Success" : event.error_category || "Request failed";
  const usage = [
    event.input_tokens !== null || event.output_tokens !== null ? `${formatNumber(event.input_tokens ?? 0)} in · ${formatNumber(event.output_tokens ?? 0)} out` : undefined,
    event.est_cost_usd !== null ? formatCost(event.est_cost_usd) : undefined,
    event.retry_count ? `${event.retry_count} ${event.retry_count === 1 ? "retry" : "retries"}` : undefined,
  ].filter(Boolean).join(" · ") || "Not reported";

  return <tr className="text-[#b9b8c5]"><td className="px-5 py-3.5 sm:px-6"><p className="font-medium text-[#e0dfe8]">{event.provider}</p><p className="mt-0.5 font-mono text-[10px] text-[#747382]">{displayModel(event.model)}</p></td><td className="px-4 py-3.5"><p className="font-mono text-[10px] text-[#b8b7c3]">{event.http_method || "HTTP"} {displayEndpoint(event)}</p><p className="mt-0.5 font-mono text-[10px] text-[#6f6e7c]">{status}</p></td><td className="px-4 py-3.5"><span className={cn("rounded-md border px-2 py-1 text-[10px] font-medium", event.success ? "border-success/20 bg-success/[.08] text-success" : "border-danger/20 bg-danger/[.08] text-danger")}>{result}</span></td><td className="px-4 py-3.5 font-mono text-[10px] text-[#92919e]">{usage}</td><td className="px-4 py-3.5 font-mono text-[#cfced9]">{Math.round(event.latency_ms)} ms</td><td className="px-4 py-3.5 capitalize text-[#8d8c9a]">{event.instrumentation_type}</td><td className="px-5 py-3.5 text-right text-[11px] text-[#777685] sm:px-6">{new Date(event.created_at).toLocaleString()}</td></tr>;
}

function displayModel(model: string) {
  return /^unknown(?: model)?$/i.test(model.trim()) ? "Model not reported" : model;
}

function displayEndpoint(event: TelemetryEvent) {
  const value = event.endpoint || event.request_url;
  if (!value) return "Not reported";
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}
