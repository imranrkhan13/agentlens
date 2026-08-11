import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleDollarSign, Clock3, ExternalLink, Gauge, Info, KeyRound, LockKeyhole, ShieldCheck, Sparkles, Terminal, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProviderMatch, PROVIDER_CATALOG } from "@/lib/provider-match";
import { RunnerCommand } from "@/components/provider-match/runner-command";
import { MatchLiveRefresh } from "@/components/provider-match/live-refresh";

function providerName(provider: string) {
  return provider in PROVIDER_CATALOG ? PROVIDER_CATALOG[provider as keyof typeof PROVIDER_CATALOG].name : provider;
}

function money(value: number | null) {
  if (value === null) return "Not available";
  if (value === 0) return "$0 local compute";
  return `$${value < 1 ? value.toFixed(2) : value.toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo`;
}

export default async function ProviderMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { id } = await params;
  const match = await getProviderMatch(session.user.id, id);
  if (!match) notFound();
  const recommendation = match.results.find((result) => result.provider === match.recommendationProvider && result.model === match.recommendationModel);
  const recommendedProvider = recommendation && recommendation.provider in PROVIDER_CATALOG ? PROVIDER_CATALOG[recommendation.provider as keyof typeof PROVIDER_CATALOG] : null;
  const selectedNames = match.selectedProviders.map((provider) => providerName(provider.provider));
  return <div className="match-page match-detail-page">
    <MatchLiveRefresh matchId={match.id} status={match.status} />
    <Link href="/app/match" className="match-back"><ArrowLeft /> All comparisons</Link>
    <header className="match-detail-header"><div><span className={`match-status-pill ${match.status}`}>{recommendation ? <CheckCircle2 /> : <Clock3 />}{recommendation ? "Recommendation ready" : match.status === "running" ? "Tests are running" : match.status === "complete" ? "Another run is needed" : "Ready for local test"}</span><h1>{match.name}</h1><p>{match.useCase}</p></div><Link href="/app/match/new" className="match-secondary-link">Compare another use case <ArrowRight /></Link></header>

    {match.status === "complete" && recommendation ? <>
      <section className="recommendation-hero">
        <div className="recommendation-title"><span><Trophy /></span><div><p>BEST FIT FOR THIS USE CASE</p><h2>{providerName(recommendation.provider)}</h2><code>{recommendation.model}</code></div></div>
        <div className="recommendation-score"><b>{Math.round(recommendation.overallScore)}</b><span>/100 fit score</span></div>
        <div className="recommendation-reason"><Sparkles /><p>Recommended because it best matches your <b>{match.priority}</b> priority across the exact same {match.testCases.length} checks. The score is specific to this test plan—not a universal model ranking.</p></div>
      </section>

      <section className="match-scorecards">{match.results.map((result, index) => <article key={`${result.provider}-${result.model}`} className={index === 0 ? "is-winner" : ""}>
        <div className="scorecard-head"><span className="provider-monogram">{providerName(result.provider).slice(0, 2).toUpperCase()}</span><div><b>{providerName(result.provider)}</b><small>{result.model}</small></div>{index === 0 && <em><Trophy /> Best fit</em>}</div>
        {result.status === "complete" ? <><div className="scorecard-overall"><b>{Math.round(result.overallScore)}</b><span><i style={{ width: `${result.overallScore}%` }} /></span></div><dl><div><dt>Instruction fit</dt><dd>{Math.round(result.qualityScore)}</dd></div><div><dt>Reliability</dt><dd>{Math.round(result.reliabilityScore)}%</dd></div><div><dt>Average speed</dt><dd>{result.avgLatencyMs === null ? "—" : `${(result.avgLatencyMs / 1000).toFixed(1)}s`}</dd></div><div><dt>Estimated usage</dt><dd>{money(result.estimatedMonthlyCostUsd)}</dd></div></dl></> : <div className="scorecard-unavailable"><Info /><b>Could not test</b><p>{result.errorCategory || "This provider was unavailable during the run."}</p></div>}
      </article>)}</section>

      <section className="match-explanation-grid">
        <article><Gauge /><div><span>HOW THE DECISION WAS MADE</span><h3>Transparent, weighted scoring</h3><p>AgentLens scored instruction-following, successful requests, observed response time, and estimated token cost. Your “{match.priority}” preference controls the weighting.</p></div></article>
        <article><CircleDollarSign /><div><span>COST ESTIMATE</span><h3>Based on {match.monthlyRequests.toLocaleString()} requests/month</h3><p>Estimates use observed token counts and the model prices captured in this test plan. Actual bills can vary with prompt length, caching, tools, and provider price changes.</p></div></article>
        <article><ShieldCheck /><div><span>PRIVACY RESULT</span><h3>No production data was tested</h3><p>Only visible synthetic prompts were used. Provider credentials and raw model responses stayed on the machine that ran the tests.</p></div></article>
      </section>

      {recommendedProvider && <section className="match-setup-guide"><div className="match-section-title"><div><span>NEXT STEPS</span><h2>Set up {recommendedProvider.name} without guessing</h2></div><span className="match-safe-badge"><ShieldCheck /> Server-side key only</span></div><div className="match-setup-steps"><article><span>1</span><KeyRound /><div><b>{recommendation.provider === "ollama" ? "Install Ollama" : "Create a provider API key"}</b><p>Open the official {recommendedProvider.name} setup page. Never paste the key into AgentLens.</p><a href={recommendedProvider.keyUrl} target="_blank" rel="noreferrer">Open {recommendedProvider.name} <ExternalLink /></a></div></article><article><span>2</span><Terminal /><div><b>Add it to your server environment</b><p>Use this environment name in your hosting provider. Do not prefix it with NEXT_PUBLIC_.</p><code>{recommendedProvider.env}={recommendation.provider === "ollama" ? "http://127.0.0.1:11434" : "your_private_key"}</code></div></article><article><span>3</span><Sparkles /><div><b>Use the tested model</b><p>Choose this exact model in your AI provider SDK so production matches the comparison.</p><code>model: &quot;{recommendation.model}&quot;</code></div></article><article><span>4</span><Gauge /><div><b>Connect continuous monitoring</b><p>AgentLens will verify the first real request and keep watching reliability, speed, and cost.</p><Link href="/app/settings">Open guided setup <ArrowRight /></Link></div></article></div></section>}

      <section className="match-tests"><div className="match-section-title"><div><span>TEST DETAILS</span><h2>See exactly what passed</h2></div></div>{match.testCases.map((test) => <article key={test.id}><div><span><Check /></span><div><b>{test.name}</b><p>{test.prompt}</p></div></div><div className="test-result-pills">{match.results.map((result) => { const score = result.testScores.find((item) => item.testId === test.id); return <span key={result.provider} className={score?.passed ? "passed" : "failed"}>{providerName(result.provider)} {score ? `${Math.round(score.score)}%` : "—"}</span>; })}</div></article>)}</section>
    </> : <>
      <section className="match-plan-summary"><div><span>{match.status === "complete" ? "NO COMPLETED PROVIDER" : "YOUR TEST PLAN"}</span><h2>{match.status === "complete" ? "Add a provider key and run the checks again." : `${match.testCases.length} safe checks are ready.`}</h2><p>{match.status === "complete" ? "The last run could not complete a selected provider, so AgentLens did not make up a recommendation." : "Each selected provider receives the same synthetic instructions so the comparison is fair."}</p></div><div className="match-plan-providers">{selectedNames.map((name) => <span key={name}><Check />{name}</span>)}</div></section>
      <RunnerCommand matchId={match.id} status={recommendation ? "complete" : "ready"} />
      <section className="match-tests"><div className="match-section-title"><div><span>REVIEW BEFORE RUNNING</span><h2>The exact synthetic checks</h2></div><span className="match-safe-badge"><LockKeyhole /> No customer data</span></div>{match.testCases.map((test, index) => <article key={test.id}><div><span>{index + 1}</span><div><b>{test.name}</b><p>{test.prompt}</p></div></div><small>{test.expectedFormat === "json" ? "Must return valid structured data" : test.maxCharacters ? `Must stay under ${test.maxCharacters} characters` : "Scored against visible instructions"}</small></article>)}</section>
    </>}
  </div>;
}
