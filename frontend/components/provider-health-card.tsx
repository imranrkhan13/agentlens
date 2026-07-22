import { Activity, ArrowUpRight, Gauge, RefreshCw, ShieldCheck } from "lucide-react";
import type { ProviderAggregate } from "@/lib/api/types";
import { formatCost, formatNumber } from "@/lib/utils";

function sourceLabel(source: ProviderAggregate["instrumentation_type"]) {
  if (source === "native") return "Native telemetry";
  if (source === "mixed") return "Native + generic";
  return "Generic telemetry";
}

export function ProviderHealthCard({ provider, showModels = false }: { provider: ProviderAggregate; showModels?: boolean }) {
  return (
    <article className="surface rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/[.14] hover:bg-white/[.035]">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#e9e8f0]">{provider.provider}</p><p className="mt-1 text-[11px] text-[#777685]">{sourceLabel(provider.instrumentation_type)} · detected from this project&apos;s events</p></div><span className="shrink-0 rounded-md border border-white/[.09] bg-black/20 px-2 py-1 text-[10px] font-medium text-[#aaa9b7]">Detected</span></div>
      <div className="mt-5 grid grid-cols-2 gap-2"><Metric icon={Gauge} label="Avg. latency" value={`${Math.round(provider.avg_latency_ms)} ms`} /><Metric icon={ShieldCheck} label="Success" value={`${provider.success_rate}%`} /><Metric icon={Activity} label="Requests" value={formatNumber(provider.request_volume)} /><Metric icon={RefreshCw} label="Retries" value={formatNumber(provider.retries)} /></div>
      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[#777685]"><span className="truncate">{provider.top_error_categories[0] ? `Top error: ${provider.top_error_categories[0]}` : provider.success_rate === 100 ? "No failed requests" : "Error metadata unavailable for earlier events"}</span><span>{formatCost(provider.estimated_cost_usd)}</span></div>
      {showModels && <div className="mt-4 border-t border-white/[.065] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#6f6e7c]">Models from real traffic</p><div className="mt-2 space-y-2">{provider.models.map((model) => <div key={model.model} className="flex items-center justify-between gap-3 rounded-lg border border-white/[.065] bg-black/15 px-3 py-2"><div className="min-w-0"><p className="truncate font-mono text-[11px] text-[#c8c7d2]">{displayModel(model.model)}</p><p className="mt-0.5 text-[10px] text-[#747382]">{model.instrumentation_type} · {model.success_rate}% success</p></div><div className="flex shrink-0 items-center gap-1 text-[10px] text-[#8a8997]">{formatNumber(model.request_volume)} requests <ArrowUpRight className="size-3" /></div></div>)}</div></div>}
    </article>
  );
}

function displayModel(model: string) {
  return /^unknown(?: model)?$/i.test(model.trim()) ? "Model not reported" : model;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return <div className="rounded-xl bg-black/20 px-3 py-2.5"><div className="flex items-center gap-1.5 text-[10px] text-[#757482]"><Icon className="size-3" /> {label}</div><p className="mt-1 text-sm font-medium text-[#dedde7]">{value}</p></div>;
}
