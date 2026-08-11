import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { MatchWizard } from "@/components/provider-match/match-wizard";

export default function NewProviderMatchPage() {
  return <div className="match-page match-new-page">
    <Link href="/app/match" className="match-back"><ArrowLeft /> Provider Match</Link>
    <header className="match-page-header"><div><span>FIND MY AI PROVIDER</span><h1>Describe the job. We’ll test the fit.</h1><p>You do not need to understand model benchmarks. Tell AgentLens what your product needs in everyday language.</p></div><div className="match-header-trust"><ShieldCheck /><span><b>Private by default</b><small>Synthetic tests, local provider keys</small></span></div></header>
    <MatchWizard />
  </div>;
}
