import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, FlaskConical, LockKeyhole, Plus, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { listProviderMatches, MATCH_ALLOWANCES, PROVIDER_CATALOG } from "@/lib/provider-match";
import { getBillingState } from "@/lib/billing";

function providerName(provider: string | null) {
  return provider && provider in PROVIDER_CATALOG ? PROVIDER_CATALOG[provider as keyof typeof PROVIDER_CATALOG].name : provider;
}

export default async function ProviderMatchPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [matches, billing] = await Promise.all([listProviderMatches(session.user.id), getBillingState(session.user.id)]);
  const usedThisMonth = matches.filter((match) => new Date(match.createdAt).getMonth() === new Date().getMonth() && new Date(match.createdAt).getFullYear() === new Date().getFullYear()).length;
  const allowance = MATCH_ALLOWANCES[billing.plan];
  const latest = matches[0];
  return <div className="match-page">
    <header className="match-page-header"><div><span>PROVIDER MATCH</span><h1>Choose your AI with evidence.</h1><p>AgentLens tests the same safe tasks across providers, then explains which one best fits your product.</p></div><Link className="match-primary-link" href="/app/match/new"><Plus /> Start a comparison</Link></header>

    <section className="match-overview-hero">
      <div className="match-overview-copy"><span className="match-kicker"><Sparkles /> BUILT FOR NONTECHNICAL TEAMS</span><h2>From “I need AI” to a confident provider choice.</h2><p>Describe the job in plain English. Run one private command. See quality, speed, reliability, and estimated cost compared side by side.</p><Link href="/app/match/new">Find my best provider <ArrowRight /></Link></div>
      <div className="match-overview-flow"><div><span>1</span><b>Describe</b><small>What should the AI do?</small></div><i /><div><span>2</span><b>Test locally</b><small>Your keys never leave.</small></div><i /><div><span>3</span><b>Choose</b><small>See the reason, not hype.</small></div></div>
    </section>

    <section className="match-stat-row">
      <article><FlaskConical /><span><b>{usedThisMonth} of {allowance}</b><small>comparisons this month</small></span></article>
      <article><LockKeyhole /><span><b>Local execution</b><small>keys and answers stay with you</small></span></article>
      <article><CheckCircle2 /><span><b>{matches.filter((match) => match.status === "complete" && match.recommendationProvider).length}</b><small>recommendations completed</small></span></article>
    </section>

    <div className="match-section-title"><div><span>YOUR COMPARISONS</span><h2>{matches.length ? "Continue where you left off" : "Your first answer is one comparison away"}</h2></div>{matches.length > 0 && <Link href="/app/match/new">New comparison <Plus /></Link>}</div>
    {matches.length ? <section className="match-list">{matches.map((match) => <Link href={`/app/match/${match.id}`} key={match.id} className="match-list-row"><span className={`match-status-icon ${match.status}`} >{match.status === "complete" && match.recommendationProvider ? <CheckCircle2 /> : <Clock3 />}</span><div className="match-list-main"><b>{match.name}</b><p>{match.useCase}</p></div><div className="match-list-meta"><span>{match.selectedProviders.length} providers</span><span>{match.status === "complete" ? match.recommendationProvider ? `Best fit: ${providerName(match.recommendationProvider)}` : "Needs another run" : match.status === "running" ? "Tests running" : "Ready to test"}</span></div><ArrowRight /></Link>)}</section> : <section className="match-empty"><div className="match-empty-visual"><span>OpenAI</span><span>Anthropic</span><span>Gemini</span><b>?</b></div><h2>No guessing required.</h2><p>Your first comparison uses three synthetic checks and your own provider accounts. It normally takes only a few minutes.</p><Link className="match-primary-link" href="/app/match/new"><Sparkles /> Start my first comparison</Link></section>}
    {latest?.status === "running" && <p className="match-live-note"><span /> A local comparison is running. This page will update when results arrive.</p>}
  </div>;
}
