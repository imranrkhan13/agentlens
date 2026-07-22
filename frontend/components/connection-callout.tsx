import Link from "next/link";
import { ArrowRight, Cable, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectionCallout({ needsVerification = false }: { needsVerification?: boolean }) {
  return <div className="surface-glow flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet/20 bg-violet/[.09] text-violet">{needsVerification ? <FlaskConical className="size-4" /> : <Cable className="size-4" />}</span><div><p className="text-sm font-medium text-[#efeff5]">{needsVerification ? "Verify this backend before monitoring" : "Connect your first project"}</p><p className="mt-1 max-w-xl text-xs leading-5 text-[#8b8a99]">{needsVerification ? "A URL and key are saved, but the app has not confirmed that the URL is a browser-accessible AgentLens API. This prevents accidental polling of a frontend or static site." : "Use a real AgentLens API key. Metrics remain empty until your application sends telemetry."}</p></div></div><Button asChild variant="primary" size="sm" className="shrink-0"><Link href={needsVerification ? "/diagnostics" : "/settings"}>{needsVerification ? "Verify backend" : "Configure API"} <ArrowRight className="size-3.5" /></Link></Button></div>;
}
