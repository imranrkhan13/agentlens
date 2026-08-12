import { Activity, ArrowUpRight, Gauge, RefreshCw, ShieldCheck, Timer, Zap } from "lucide-react";
import type { ProviderAggregate } from "@/lib/api/types";
import { AIService } from "@/components/ai-service";
import { describeResponseTime, formatCost, formatNumber } from "@/lib/utils";
import { InfoTooltip } from "@/components/ui/tooltip";

function sourceLabel(source: ProviderAggregate["instrumentation_type"]) {
  if (source === "native") return "Found automatically";
  if (source === "mixed") return "Found automatically and shared by your app";
  return "Shared by your app";
}

export function ProviderHealthCard({ provider, showModels = false }: { provider: ProviderAggregate; showModels?: boolean }) {
  const responseTime = describeResponseTime(provider.avg_latency_ms);
  const responseTimeIcon = responseTime.kind === "fast" ? Zap : responseTime.kind === "slow" ? Timer : Activity;
  return (
    <article className="surface rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><AIService service={provider.provider} /><p className="mt-2 text-[11px] text-[#777685]">{sourceLabel(provider.instrumentation_type)}</p></div><span className="shrink-0 rounded-md border border-white/[.09] bg-black/20 px-2 py-1 text-[10px] font-medium text-[#aaa9b7]">Seen in your app</span></div>
      <div className="mt-5 grid grid-cols-2 gap-2"><Metric icon={Gauge} valueIcon={responseTimeIcon} label="Response time" helpText="How quickly this AI service usually replies." value={responseTime.label} detail={responseTime.detail} /><Metric icon={ShieldCheck} label="Answers delivered" helpText="The share of conversations answered successfully." value={`${provider.success_rate}%`} /><Metric icon={Activity} label="AI conversations" helpText="Questions handled by this AI service." value={formatNumber(provider.request_volume)} /><Metric icon={RefreshCw} label="Tried again" helpText="Times your app tried a request again." value={formatNumber(provider.retries)} /></div>
      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-[#777685]"><span className="truncate">{provider.top_error_categories[0] ? `Most common problem: ${provider.top_error_categories[0]}` : provider.success_rate === 100 ? "No problems reported" : "No problem details reported"}</span><span>{formatCost(provider.estimated_cost_usd)}</span></div>
      {showModels && <div className="mt-4 border-t border-white/[.065] pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#6f6e7c]">AI models your app used</p><div className="mt-2 space-y-2">{provider.models.map((model) => <div key={model.model} className="flex items-center justify-between gap-3 rounded-lg border border-white/[.065] bg-black/15 px-3 py-2"><div className="min-w-0"><p className="truncate font-mono text-[11px] text-[#c8c7d2]">{displayModel(model.model)}</p><p className="mt-0.5 text-[10px] text-[#747382]">{model.instrumentation_type === "native" ? "Found automatically" : model.instrumentation_type === "mixed" ? "Found automatically and shared by your app" : "Shared by your app"} · {model.success_rate}% answered</p></div><div className="flex shrink-0 items-center gap-1 text-[10px] text-[#8a8997]">{formatNumber(model.request_volume)} conversations <ArrowUpRight className="size-3" /></div></div>)}</div></div>}
    </article>
  );
}

function displayModel(model: string) {
  return /^unknown(?: model)?$/i.test(model.trim()) ? "Model not reported" : model;
}

function Metric({ icon: Icon, valueIcon: ValueIcon, label, helpText, value, detail }: { icon: typeof Gauge; valueIcon?: typeof Gauge; label: string; helpText: string; value: string; detail?: string }) {
  return <div className="rounded-xl bg-black/20 px-3 py-2.5" title={detail}><div className="flex items-center gap-1.5 text-[10px] text-[#757482]"><Icon className="size-3" aria-hidden="true" /> {label}<InfoTooltip label={helpText} /></div><p className="mt-1 flex items-center gap-1 text-sm font-medium text-[#dedde7]">{ValueIcon && <ValueIcon className="size-3.5 text-violet" aria-hidden="true" />}{value}</p>{detail && <span className="mt-0.5 block text-[10px] text-[#92909f]">{detail}</span>}</div>;
}
