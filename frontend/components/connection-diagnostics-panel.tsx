"use client";

import { useState } from "react";
import { Check, ChevronDown, Clipboard, ClipboardCheck, CircleAlert, CircleX, Clock3, Copy, FileJson2, Globe2, KeyRound, Network, ShieldAlert, WifiOff } from "lucide-react";
import type { ConnectionCheck, ConnectionDiagnosticsReport, RequestDiagnostic } from "@/lib/api/diagnostics";
import { FRONTEND_VERSION, validationIssues } from "@/lib/api/diagnostics";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

function CopyButton({ value, label = "Copy" }: { value: string | null | undefined; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  if (!value) return null;
  const copyValue = value;
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      showToast("Copied!");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      showToast("We could not copy that. Please try again.", "error");
    }
  }
  return <button type="button" onClick={copy} aria-label={label} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.09] bg-white/[.035] px-2 py-1 text-[10px] font-medium text-[#aaa9b7] transition hover:border-white/[.18] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70">{copied ? <ClipboardCheck className="size-3 text-success" aria-hidden="true" /> : <Clipboard className="size-3" aria-hidden="true" />}{copied ? "Copied" : label}</button>;
}

function StatusBadge({ status }: { status: "connected" | "degraded" | "failed" | ConnectionCheck["status"] }) {
  const map = {
    connected: ["Connected", "border-success/25 bg-success/[.08] text-success"],
    passed: ["Passed", "border-success/25 bg-success/[.08] text-success"],
    degraded: ["Partial", "border-warning/25 bg-warning/[.08] text-warning"],
    warning: ["Optional", "border-warning/25 bg-warning/[.08] text-warning"],
    failed: ["Failed", "border-danger/25 bg-danger/[.08] text-[#ff9b9b]"],
    skipped: ["Skipped", "border-white/[.1] bg-white/[.035] text-[#9796a4]"],
  } as const;
  const [label, className] = map[status];
  return <span className={cn("inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.1em]", className)}>{label}</span>;
}

function CheckIcon({ status }: { status: ConnectionCheck["status"] }) {
  if (status === "passed") return <span className="grid size-7 place-items-center rounded-lg bg-success/[.1] text-success"><Check className="size-3.5" /></span>;
  if (status === "failed") return <span className="grid size-7 place-items-center rounded-lg bg-danger/[.1] text-danger"><CircleX className="size-3.5" /></span>;
  if (status === "warning") return <span className="grid size-7 place-items-center rounded-lg bg-warning/[.1] text-warning"><CircleAlert className="size-3.5" /></span>;
  return <span className="grid size-7 place-items-center rounded-lg bg-white/[.05] text-[#858492]"><Clock3 className="size-3.5" /></span>;
}

function Definition({ label, value, mono = false, copy = false }: { label: string; value: string | number | null | undefined; mono?: boolean; copy?: boolean }) {
  const display = value === null || value === undefined || value === "" ? "Not available" : String(value);
  return <div className="min-w-0 rounded-xl border border-white/[.07] bg-black/15 p-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#6f6e7b]">{label}</p>{copy && <CopyButton value={display === "Not available" ? null : display} />}</div><p className={cn("mt-1.5 break-all text-xs leading-5 text-[#d6d5df]", mono && "font-mono text-[11px] text-[#bbb9c8]")}>{display}</p></div>;
}

function ResponseBody({ body }: { body: string | null }) {
  if (!body) return <p className="mt-2 text-xs text-[#7e7d8b]">No response body was available to the browser.</p>;
  return <div className="mt-2 overflow-hidden rounded-xl border border-white/[.08] bg-black/35"><div className="flex items-center justify-between border-b border-white/[.07] px-3 py-2"><span className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#7d7c89]">Response body</span><CopyButton value={body} /></div><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-5 text-[#c6c4d0]">{body}</pre></div>;
}

export function RequestDiagnosticsCard({ diagnostic, className }: { diagnostic: RequestDiagnostic; className?: string }) {
  const issues = diagnostic.category === "validation" ? validationIssues(diagnostic.responseBody) : [];
  const isCors = diagnostic.category === "cors";
  return <section className={cn("overflow-hidden rounded-2xl border border-danger/22 bg-danger/[.045]", className)}>
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5"><div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-danger/25 bg-danger/[.1] text-danger">{isCors ? <ShieldAlert className="size-4.5" /> : diagnostic.category === "timeout" ? <Clock3 className="size-4.5" /> : diagnostic.category === "network" ? <WifiOff className="size-4.5" /> : <CircleAlert className="size-4.5" />}</span><div><p className="text-sm font-semibold text-[#ffe5e5]">{diagnostic.title}</p><p className="mt-1 max-w-3xl text-xs leading-5 text-[#dca7a7]">{diagnostic.summary}</p></div></div><CopyButton value={diagnostic.requestUrl} label="Copy URL" /></div>
    {isCors && <div className="mx-4 mb-4 rounded-xl border border-violet/20 bg-violet/[.07] p-4 sm:mx-5"><p className="text-xs font-semibold text-[#ded7ff]">CORS configuration required</p><p className="mt-1.5 text-xs leading-5 text-[#b6b0ce]">This browser blocked the request because the backend did not return <span className="font-mono text-[#e2ddff]">Access-Control-Allow-Origin</span> for this frontend, or the browser could not determine whether it did.</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><Definition label="Allowed origin" value={diagnostic.allowedOrigin || "Not exposed to browser"} mono /><Definition label="Current origin" value={diagnostic.currentOrigin} mono copy /><Definition label="Requested URL" value={diagnostic.requestUrl} mono copy /></div><div className="mt-3 rounded-lg bg-black/25 px-3 py-2.5 font-mono text-[11px] text-[#cfc8ff]">AGENTLENS_CORS_ORIGINS={diagnostic.currentOrigin || "http://localhost:3000"}</div><p className="mt-2 text-[11px] text-[#9992b3]">Restart or redeploy the backend after changing this setting.</p></div>}
    <div className="border-t border-danger/15 px-4 py-4 sm:px-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#efb9b9]">Recommended next steps</p><ul className="mt-2.5 space-y-1.5 text-xs leading-5 text-[#d5b8b8]">{diagnostic.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-danger/80" />{suggestion}</li>)}</ul></div>
    {issues.length > 0 && <div className="border-t border-danger/15 px-4 py-4 sm:px-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#efb9b9]">Validation fields</p><div className="mt-2 grid gap-2">{issues.map((issue) => <div key={`${issue.field}-${issue.message}`} className="rounded-lg border border-danger/15 bg-black/15 px-3 py-2 text-xs"><span className="font-mono text-[#ffc2c2]">{issue.field}</span><span className="mx-2 text-[#8f7277]">—</span><span className="text-[#e4c5c5]">{issue.message}</span></div>)}</div></div>}
    <details className="group border-t border-danger/15"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-medium text-[#d8baba] sm:px-5">Technical request details <ChevronDown className="size-4 transition group-open:rotate-180" /></summary><div className="border-t border-danger/10 px-4 pb-5 pt-4 sm:px-5"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"><Definition label="Request URL" value={diagnostic.requestUrl} mono copy /><Definition label="HTTP method" value={diagnostic.method} mono /><Definition label="HTTP status" value={diagnostic.status === null ? "No HTTP response" : `${diagnostic.status} ${diagnostic.statusText || ""}`} mono /><Definition label="Time taken" value={`${diagnostic.durationMs} ms`} /><Definition label="Timestamp" value={diagnostic.timestamp} mono copy /><Definition label="Request ID" value={diagnostic.requestId} mono copy /><Definition label="Browser error" value={diagnostic.browserError} mono copy /><Definition label="API key" value={diagnostic.apiKey.prefix || "No key supplied"} mono /><Definition label="Key header" value={diagnostic.apiKey.headerSent ? `Sent · format ${diagnostic.apiKey.looksValid ? "looks valid" : "needs review"}` : "Not sent"} /></div><ResponseBody body={diagnostic.responseBody} /></div></details>
  </section>;
}

function OverviewCard({ icon: Icon, label, value, detail, copy = false }: { icon: typeof Globe2; label: string; value: string; detail?: string; copy?: boolean }) {
  return <div className="rounded-xl border border-white/[.08] bg-black/15 p-3.5"><div className="flex items-center justify-between gap-2"><span className="grid size-7 place-items-center rounded-lg border border-white/[.08] bg-white/[.035] text-violet"><Icon className="size-3.5" /></span>{copy && <CopyButton value={value} />}</div><p className="mt-3 text-[10px] font-semibold uppercase tracking-[.13em] text-[#777684]">{label}</p><p className="mt-1 break-all text-xs font-medium leading-5 text-[#dedde7]">{value}</p>{detail && <p className="mt-1 text-[11px] leading-4 text-[#777684]">{detail}</p>}</div>;
}

export function ConnectionDiagnosticsPanel({ report }: { report: ConnectionDiagnosticsReport }) {
  const headline = report.overallStatus === "connected" ? "AgentLens connection verified" : report.overallStatus === "degraded" ? "AgentLens is connected with a few gaps" : "AgentLens connection needs attention";
  const primaryDiagnostic = report.checks.find((check) => check.status === "failed" && check.diagnostic)?.diagnostic;
  return <div className="space-y-5"><section className="surface-glow rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><span className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", report.overallStatus === "connected" ? "border-success/25 bg-success/[.1] text-success" : report.overallStatus === "degraded" ? "border-warning/25 bg-warning/[.1] text-warning" : "border-danger/25 bg-danger/[.1] text-danger")}>{report.overallStatus === "connected" ? <Check className="size-5" aria-hidden="true" /> : report.overallStatus === "degraded" ? <CircleAlert className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-[#f0eff5]">{headline}</h2><StatusBadge status={report.overallStatus} /></div><p className="mt-1.5 text-xs leading-5 text-[#8d8c9a]">Check finished in {report.durationMs} ms at {new Date(report.completedAt).toLocaleString()}.</p></div></div><div className="rounded-xl border border-white/[.09] bg-black/20 px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#777684]">Works with this app</p><p className="mt-1 text-2xl font-semibold tracking-tight text-[#edecf4]">{report.compatibility}%</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><OverviewCard icon={Globe2} label="AgentLens address" value={report.baseUrl} copy /><OverviewCard icon={Network} label="Service check" value={report.health?.ok ? "Reachable" : "Failed"} detail={report.health ? `${report.health.diagnostic.durationMs} ms` : "Not checked"} /><OverviewCard icon={FileJson2} label="Service version" value={report.apiVersion || "Not detected"} detail={report.openApi?.ok ? "Details found" : "Details unavailable"} /><OverviewCard icon={KeyRound} label="Dashboard" value={`v${FRONTEND_VERSION}`} detail={report.environment} /></div></section>
    {primaryDiagnostic && <RequestDiagnosticsCard diagnostic={primaryDiagnostic} />}
    <section className="surface rounded-2xl p-5 sm:p-6"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-medium text-[#eeedf4]">Connection checks</h2><p className="mt-1 text-xs text-[#797886]">Each check is based on this browser&apos;s actual request or the loaded OpenAPI contract.</p></div><span className="mt-2 text-xs text-[#838290] sm:mt-0">{report.checks.filter((check) => check.status === "passed").length} of {report.checks.length} passed</span></div><div className="mt-5 divide-y divide-white/[.065] rounded-xl border border-white/[.08] bg-black/15">{report.checks.map((check) => <div key={check.id} className="flex gap-3 p-3.5 sm:items-center"><CheckIcon status={check.status} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-xs font-medium text-[#e1e0e9]">{check.label}</p>{check.expected && !check.expected.required && <span className="text-[10px] text-[#7d7c89]">Enhanced UI</span>}</div><p className="mt-1 text-[11px] leading-4 text-[#858492]">{check.message}</p></div>{check.durationMs !== undefined && <span className="shrink-0 text-[11px] text-[#777684]">{check.durationMs} ms</span>}<StatusBadge status={check.status} /></div>)}</div></section>
    {report.missingEndpoints.length > 0 && <section className="rounded-2xl border border-warning/20 bg-warning/[.045] p-5 sm:p-6"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-warning/20 bg-warning/[.1] text-warning"><CircleAlert className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-medium text-[#f0dfbc]">Some optional dashboard details are not available yet.</h2><p className="mt-1 text-xs leading-5 text-[#c4ad7e]">Detected service version: <span className="font-mono text-[#e2ca98]">{report.apiVersion || "unknown"}</span>. The rest of the dashboard stays honest until these details are added.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{report.missingEndpoints.map((endpoint) => <span key={`${endpoint.method}-${endpoint.path}`} className="rounded-lg border border-warning/20 bg-black/15 px-2.5 py-1.5 font-mono text-[11px] text-[#ead09b]">{endpoint.method} {endpoint.path}</span>)}</div></section>}
    <details className="surface group rounded-2xl"><summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-medium text-[#dedde6] sm:p-6">More connection details <ChevronDown className="size-4 text-[#858492] transition group-open:rotate-180" aria-hidden="true" /></summary><div className="border-t border-white/[.07] px-5 pb-5 pt-4 sm:px-6 sm:pb-6"><div className="grid gap-3 lg:grid-cols-2"><Definition label="Current website address" value={report.currentOrigin} mono copy /><Definition label="Browser" value={report.browser} mono copy /></div><div className="mt-4"><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#777684]">Available service details ({report.availableEndpoints.length})</p>{report.availableEndpoints.length ? <div className="mt-2 flex max-h-56 flex-wrap content-start gap-2 overflow-auto rounded-xl border border-white/[.07] bg-black/15 p-3">{report.availableEndpoints.map((endpoint) => <span key={endpoint} className="rounded-lg border border-white/[.08] bg-white/[.025] px-2 py-1 font-mono text-[11px] text-[#b9b8c5]">{endpoint}</span>)}</div> : <p className="mt-2 text-xs text-[#7f7e8b]">No service details were available from this address.</p>}</div></div></details>
  </div>;
}
