"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ChevronDown, Radio } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export type ChartPoint = { label: string; value: number };

export function TelemetryChart({ data, title = "Customer wait time", unit = "ms" }: { data: ChartPoint[]; title?: string; unit?: string }) {
  return (
    <section className="surface-glow min-h-[340px] rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-lg border border-violet/20 bg-violet/[.08] text-violet"><Activity className="size-3.5" /></span><h2 className="text-sm font-medium text-[#ebebf2]">{title}</h2></div><p className="mt-2 text-xs text-[#777685]">How long your most recent AI requests took to finish</p></div><span className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.025] px-2.5 text-xs text-[#9998a8]">Latest requests <ChevronDown className="size-3" /></span></div>
      {data.length === 0 ? <div className="pt-3"><EmptyState icon={Radio} title="No response-time details yet" description="We’re waiting for your AI to receive its first request." /></div> : <div className="mt-6 h-[238px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: -18, right: 10, top: 8, bottom: 0 }}><defs><linearGradient id="agentlens-chart" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#8d72ff" /><stop offset="100%" stopColor="#29d2d0" /></linearGradient><linearGradient id="agentlens-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6777ff" stopOpacity={.25} /><stop offset="100%" stopColor="#29d2d0" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.07)" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#777685", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#777685", fontSize: 11 }} unit={unit} /><Tooltip contentStyle={{ background: "#15161b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#a8a7b4" }} itemStyle={{ color: "#f3f2f9" }} /><Area type="monotone" dataKey="value" stroke="url(#agentlens-chart)" strokeWidth={2.5} fill="url(#agentlens-area)" /></AreaChart></ResponsiveContainer></div>}
    </section>
  );
}
