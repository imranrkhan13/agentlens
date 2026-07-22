"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, CircleAlert, Cloud, FlaskConical, Laptop, LoaderCircle, Server, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { ConnectionDiagnosticsPanel } from "@/components/connection-diagnostics-panel";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { backendUrlGuidance, canUseBackendReport, runConnectionDiagnostics, type ConnectionDiagnosticsReport } from "@/lib/api/diagnostics";

function SetupCard({ icon: Icon, title, description, value }: { icon: typeof Laptop; title: string; description: string; value: string }) {
  return <div className="rounded-xl border border-white/[.08] bg-black/15 p-4"><span className="grid size-8 place-items-center rounded-lg border border-white/[.08] bg-white/[.035] text-violet"><Icon className="size-3.5" /></span><p className="mt-3 text-xs font-medium text-[#e9e8f0]">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#7d7c8a]">{description}</p><p className="mt-3 break-all rounded-lg border border-white/[.07] bg-black/25 px-2.5 py-2 font-mono text-[11px] text-[#c7c4d3]">{value}</p></div>;
}

export default function DiagnosticsPage() {
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_AGENTLENS_API_URL || "http://localhost:8001");
  const [report, setReport] = useState<ConnectionDiagnosticsReport | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const guidance = useMemo(() => backendUrlGuidance(baseUrl), [baseUrl]);
  const canContinue = canUseBackendReport(report);

  async function testConnection() {
    setIsTesting(true);
    try {
      setReport(await runConnectionDiagnostics(baseUrl));
    } finally {
      setIsTesting(false);
    }
  }

  const nextHref = "/app/settings";

  return <div className="space-y-7 sm:space-y-8"><PageHeader eyebrow="Connection diagnostics" title="Test an AgentLens backend" description="Use this secondary screen to diagnose a self-hosted backend. Account dashboards use the authenticated application connection and never ask you to paste an SDK key." />
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="surface-glow rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end"><div className="min-w-0 flex-1"><label htmlFor="backend-url" className="text-xs font-medium text-[#dddce6]">Step 1 · AgentLens API service URL</label><Input id="backend-url" value={baseUrl} onChange={(event) => { setBaseUrl(event.target.value); setReport(null); }} onKeyDown={(event) => { if (event.key === "Enter") void testConnection(); }} placeholder="http://localhost:8001 or https://api.example.com" className="mt-2 font-mono text-xs" /><p className="mt-2 text-[11px] leading-5 text-[#7c7b89]">Enter the service root only. We will test <span className="font-mono text-[#aaa9b7]">/health</span>, <span className="font-mono text-[#aaa9b7]">/openapi.json</span>, and the AgentLens API contract.</p></div><Button variant="primary" onClick={() => void testConnection()} disabled={isTesting}>{isTesting ? <LoaderCircle className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" />}{isTesting ? "Verifying API…" : "Verify API URL"}</Button></div>
      {guidance.kind === "frontend_host" && <div className="mt-5 rounded-xl border border-warning/20 bg-warning/[.055] p-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-warning/25 bg-warning/[.1] text-warning"><CircleAlert className="size-4" /></span><div><p className="text-sm font-medium text-[#f2dfbb]">{guidance.title}</p><p className="mt-1 text-xs leading-5 text-[#c4ad7e]">You entered <span className="font-mono text-[#e5c98f]">{guidance.host}</span>. Keep that URL for your public website; do not use it as the AgentLens API unless it explicitly forwards the required FastAPI routes.</p></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><SetupCard icon={Laptop} title="Local Docker" description="Use while developing on this computer." value="http://localhost:8001" /><SetupCard icon={Cloud} title="Hosted FastAPI service" description="Use the root URL supplied by your Render or Railway API service." value="https://your-agentlens-api.example.com" /><SetupCard icon={Server} title="Frontend hosting" description="Netlify stays your website. It needs an explicit proxy before it can stand in for this API." value="https://talkingresume.netlify.app" /></div><ol className="mt-4 space-y-1.5 text-xs leading-5 text-[#d4bd8d]">{guidance.steps.map((step, index) => <li key={step} className="flex gap-2"><span className="grid size-4 shrink-0 place-items-center rounded-full border border-warning/25 text-[9px] text-warning">{index + 1}</span>{step}</li>)}</ol></div>}
      <div className="mt-5 flex gap-2 rounded-xl border border-violet/15 bg-violet/[.045] p-3 text-xs leading-5 text-[#bbb4db]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-violet" /> This test does not send an SDK key. It only verifies that the URL behaves like an AgentLens backend your browser can use.</div></motion.section>
    {isTesting && <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-violet/20 bg-violet/[.08] text-violet"><LoaderCircle className="size-4 animate-spin" /></span><div><p className="text-sm font-medium text-[#ecebf4]">Verifying the backend</p><p className="mt-1 text-xs text-[#7c7b89]">Checking URL format, browser access, health, OpenAPI, and supported endpoints.</p></div></div></section>}
    {report && canContinue && <section className="rounded-2xl border border-success/20 bg-success/[.045] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-success/25 bg-success/[.1] text-success"><CheckCircle2 className="size-4.5" /></span><div><p className="text-sm font-medium text-[#e3f3ed]">Backend verification passed</p><p className="mt-1 text-xs leading-5 text-[#a5d2c1]">{report.overallStatus === "degraded" ? "Core AgentLens endpoints are available; optional dashboard detail endpoints may remain empty." : "The service is compatible with the AgentLens dashboard."}</p></div></div><Button asChild variant="primary" size="sm" className="mt-4 shrink-0 sm:mt-0"><Link href={nextHref}>Back to settings <ArrowRight className="size-3.5" /></Link></Button></section>}
    {report ? <ConnectionDiagnosticsPanel report={report} /> : <section className="surface rounded-2xl p-6 sm:p-8"><div className="grid max-w-3xl gap-5 sm:grid-cols-[auto_1fr]"><span className="grid size-11 place-items-center rounded-xl border border-white/[.09] bg-white/[.035] text-violet"><Activity className="size-5" /></span><div><h2 className="text-base font-medium text-[#eeedf4]">A clear three-step connection flow</h2><div className="mt-4 grid gap-2 text-xs text-[#a8a7b4] sm:grid-cols-3"><span className="flex items-center gap-2 rounded-lg border border-white/[.08] bg-black/15 px-3 py-2"><span className="grid size-4 place-items-center rounded-full bg-violet/20 text-[9px] text-violet">1</span> Choose API service</span><span className="flex items-center gap-2 rounded-lg border border-white/[.08] bg-black/15 px-3 py-2"><span className="grid size-4 place-items-center rounded-full bg-violet/20 text-[9px] text-violet">2</span> Verify API contract</span><span className="flex items-center gap-2 rounded-lg border border-white/[.08] bg-black/15 px-3 py-2"><span className="grid size-4 place-items-center rounded-full bg-violet/20 text-[9px] text-violet">3</span> Verify project key</span></div></div></div></section>}
  </div>;
}
