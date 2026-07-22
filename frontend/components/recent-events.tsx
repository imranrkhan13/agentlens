"use client";

import Link from "next/link";
import { Activity, ArrowRight, Search, Timer, Waves, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { TelemetryEvent } from "@/lib/api/types";
import { AIService } from "@/components/ai-service";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { cn, describeResponseTime, formatCost, formatNumber } from "@/lib/utils";

export function RecentEvents({ events, hasSession, isLoading = false }: { events: TelemetryEvent[]; hasSession: boolean; isLoading?: boolean }) {
  const [search, setSearch] = useState("");
  const visibleEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;
    return events.filter((event) => [event.provider, event.model, event.error_category, event.status_code?.toString(), event.endpoint, event.http_method].filter(Boolean).some((value) => value!.toLowerCase().includes(term)));
  }, [events, search]);

  return <section className="surface-glow overflow-hidden rounded-2xl">
    <div className="flex flex-col gap-4 border-b border-white/[.075] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-sm font-medium text-[#ebebf2]">Recent activity</h2><p className="mt-1 text-xs text-[#777685]">The latest things your AI app actually did</p></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#767583]" aria-hidden="true" /><Input aria-label="Search activity" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search service, AI model, or problem" className="h-9 w-52 pl-8 text-xs sm:w-60" /></div></div>
    {isLoading ? <div className="space-y-3 p-5 sm:p-6">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-10 animate-pulse rounded-lg bg-white/[.035]" />)}</div> : visibleEvents.length ? <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-xs"><thead className="border-b border-white/[.06] bg-black/15 text-[10px] font-semibold uppercase tracking-[.13em] text-[#6f6e7d]"><tr><th className="px-5 py-3 font-semibold sm:px-6">AI Service</th><th className="px-4 py-3 font-semibold">AI Model</th><th className="px-4 py-3 font-semibold">Result</th><th className="px-4 py-3 font-semibold">Time Taken</th><th className="px-4 py-3 font-semibold">Details</th><th className="px-4 py-3 font-semibold">Problem</th><th className="px-5 py-3 text-right font-semibold sm:px-6">When</th></tr></thead><tbody className="divide-y divide-white/[.055]">{visibleEvents.map((event) => <EventRow key={event.id} event={event} />)}</tbody></table></div> : <div className="p-5 sm:p-6"><EmptyState icon={Waves} title={hasSession ? search ? "No matching activity" : "We’re waiting for your AI to receive its first request." : "Connect a project to watch activity"} description={hasSession ? search ? "Try a service, AI model, problem, or status number." : "Once someone uses your AI feature, its activity will appear here." : "Create or connect a project first."} timeframe={hasSession && !search ? "Most activity appears within a minute after your first use." : undefined} action={{ href: hasSession ? "/app/projects" : "/app/settings", label: hasSession ? "View setup" : "Create project" }} /></div>}
    <div className="flex items-center justify-between border-t border-white/[.075] px-5 py-3 text-xs text-[#777685] sm:px-6"><span>Showing real activity only</span><Link href="/app/events" className="flex items-center gap-1.5 text-[#b7aaff] transition hover:text-white">Open full activity history <ArrowRight className="size-3.5" /></Link></div>
  </section>;
}

function EventRow({ event }: { event: TelemetryEvent }) {
  const responseTime = describeResponseTime(event.latency_ms);
  const ResponseTimeIcon = responseTime.kind === "fast" ? Zap : responseTime.kind === "slow" ? Timer : Activity;
  const details = [
    event.status_code ? `Status ${event.status_code}` : undefined,
    event.input_tokens !== null || event.output_tokens !== null ? `${formatNumber(event.input_tokens ?? 0)} in · ${formatNumber(event.output_tokens ?? 0)} out` : undefined,
    event.est_cost_usd !== null ? formatCost(event.est_cost_usd) : undefined,
    event.retry_count ? `Tried again ${event.retry_count}×` : undefined,
  ].filter(Boolean).join(" · ") || "No extra details";

  return <tr className="text-[#b9b8c5]"><td className="px-5 py-3.5 sm:px-6"><AIService service={event.provider} compact /></td><td className="px-4 py-3.5 font-mono text-[10px] text-[#c8c7d2]">{displayModel(event.model)}</td><td className="px-4 py-3.5"><span className={cn("rounded-md border px-2 py-1 text-[10px] font-medium", event.success ? "border-success/20 bg-success/[.08] text-success" : "border-danger/20 bg-danger/[.08] text-danger")}>{event.success ? "Answered" : "Could Not Answer"}</span></td><td className="px-4 py-3.5" title={responseTime.detail}><span className="inline-flex cursor-help items-center gap-1 text-[#cfced9]"><ResponseTimeIcon className="size-3.5 text-violet" aria-hidden="true" />{responseTime.label}</span></td><td className="max-w-[230px] px-4 py-3.5 text-[10px] text-[#92919e]">{details}</td><td className="max-w-[180px] px-4 py-3.5 text-[10px] text-[#d5b5b5]">{event.success ? "—" : event.error_category || "Not reported"}</td><td className="px-5 py-3.5 text-right text-[11px] text-[#777685] sm:px-6">{new Date(event.created_at).toLocaleString()}</td></tr>;
}

function displayModel(model: string) {
  return /^unknown(?: model)?$/i.test(model.trim()) ? "Model not reported" : model;
}
