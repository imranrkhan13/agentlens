import Link from "next/link";
import { ArrowRight, Cable, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConnectionCallout({ needsVerification = false }: { needsVerification?: boolean }) {
  return <div className="surface-glow flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-violet/20 bg-violet/[.09] text-violet">{needsVerification ? <FlaskConical className="size-4" /> : <Cable className="size-4" />}</span><div><p className="text-sm font-medium text-[#efeff5]">{needsVerification ? "Check your AgentLens connection" : "Connect your first AI app"}</p><p className="mt-1 max-w-xl text-xs leading-5 text-[#8b8a99]">{needsVerification ? "Your saved AgentLens address has not been checked yet. Check it before activity can appear." : "Name your app, follow one guided command, then make a normal AI request."}</p></div></div><Button asChild variant="primary" size="sm" className="shrink-0"><Link href={needsVerification ? "/app/diagnostics" : "/app/settings"}>{needsVerification ? "Check connection" : "Connect app"} <ArrowRight className="size-3.5" /></Link></Button></div>;
}
