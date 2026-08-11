"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Code2, FileJson, Gauge, Headphones, LockKeyhole, Search, Sparkles, WalletCards } from "lucide-react";
import { PROVIDER_CATALOG, type DataSensitivity, type MatchPriority, type MatchResponseFormat, type MatchTaskType, type ProviderChoice } from "@/lib/provider-match-catalog";
import { Button } from "@/components/ui/button";

const tasks: Array<{ value: MatchTaskType; title: string; description: string; icon: typeof Headphones }> = [
  { value: "support", title: "Help customers", description: "Answer questions and resolve support issues", icon: Headphones },
  { value: "extraction", title: "Read and organise", description: "Turn documents or messages into structured data", icon: FileJson },
  { value: "classification", title: "Sort and label", description: "Route, tag, or prioritise incoming information", icon: Search },
  { value: "content", title: "Write content", description: "Create summaries, emails, or marketing copy", icon: Sparkles },
  { value: "coding", title: "Write or review code", description: "Generate code and technical answers", icon: Code2 },
  { value: "analysis", title: "Analyse and decide", description: "Explain information and recommend next actions", icon: Gauge },
];

const priorities: Array<{ value: MatchPriority; title: string; description: string }> = [
  { value: "balanced", title: "Best overall fit", description: "Balance quality, reliability, speed, and cost" },
  { value: "quality", title: "Best answers", description: "Prefer instruction-following and dependable output" },
  { value: "speed", title: "Fastest response", description: "Prefer lower response time for live experiences" },
  { value: "cost", title: "Lowest running cost", description: "Prefer a lower estimated monthly bill" },
];

const initialProviders: ProviderChoice[] = ["openai", "anthropic", "gemini", "groq"].map((provider) => ({
  provider: provider as ProviderChoice["provider"],
  model: PROVIDER_CATALOG[provider as ProviderChoice["provider"]].defaultModel,
}));

export function MatchWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [taskType, setTaskType] = useState<MatchTaskType>("support");
  const [priority, setPriority] = useState<MatchPriority>("balanced");
  const [responseFormat, setResponseFormat] = useState<MatchResponseFormat>("text");
  const [dataSensitivity, setDataSensitivity] = useState<DataSensitivity>("business");
  const [monthlyRequests, setMonthlyRequests] = useState(10000);
  const [providers, setProviders] = useState<ProviderChoice[]>(initialProviders);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const canContinue = useMemo(() => step !== 1 || (name.trim().length >= 2 && useCase.trim().length >= 20), [step, name, useCase]);

  function toggleProvider(provider: ProviderChoice["provider"]) {
    setProviders((current) => current.some((item) => item.provider === provider)
      ? current.filter((item) => item.provider !== provider)
      : [...current, { provider, model: PROVIDER_CATALOG[provider].defaultModel }].slice(0, 6));
  }

  function next() {
    setError(null);
    if (!canContinue) return setError("Give the comparison a name and describe the AI job in at least one sentence.");
    if (step === 3 && providers.length < 2) return setError("Choose at least two providers so AgentLens can compare them.");
    setStep((current) => Math.min(4, current + 1));
  }

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/provider-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, useCase, taskType, priority, responseFormat, dataSensitivity, monthlyRequests, providers }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "Could not create this comparison.");
      router.push(`/app/match/${payload.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create this comparison.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="match-wizard">
    <div className="match-progress" aria-label={`Step ${step} of 4`}>
      {["Describe", "Priorities", "Providers", "Review"].map((label, index) => <div key={label} className={index + 1 <= step ? "is-active" : ""}><span>{index + 1 < step ? <Check /> : index + 1}</span><b>{label}</b></div>)}
    </div>

    {step === 1 && <section className="match-step">
      <span className="match-kicker">No technical language needed</span>
      <h2>What job should the AI do?</h2>
      <p>Describe the result you want. AgentLens turns it into safe, synthetic checks that every provider receives.</p>
      <label className="match-field"><span>Give this comparison a name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer support assistant" maxLength={120} autoFocus /></label>
      <label className="match-field"><span>Describe the AI feature</span><textarea value={useCase} onChange={(event) => setUseCase(event.target.value)} placeholder="It should answer billing questions clearly, recognise urgent issues, and never ask customers for sensitive card information." maxLength={2000} rows={5} /><small>{useCase.length}/2000 · Use a made-up example, not customer data.</small></label>
      <div className="match-choice-grid match-task-grid">{tasks.map(({ value, title, description, icon: Icon }) => <button type="button" key={value} className={taskType === value ? "is-selected" : ""} onClick={() => setTaskType(value)}><Icon /><span><b>{title}</b><small>{description}</small></span>{taskType === value && <Check className="match-choice-check" />}</button>)}</div>
    </section>}

    {step === 2 && <section className="match-step">
      <span className="match-kicker">Your definition of “better”</span>
      <h2>What matters most?</h2>
      <p>The recommendation will use these priorities. You will still see every score and trade-off.</p>
      <div className="match-choice-grid">{priorities.map((item) => <button type="button" key={item.value} className={priority === item.value ? "is-selected" : ""} onClick={() => setPriority(item.value)}><span><b>{item.title}</b><small>{item.description}</small></span>{priority === item.value && <Check className="match-choice-check" />}</button>)}</div>
      <div className="match-form-row">
        <label className="match-field"><span>Normal answer format</span><select value={responseFormat} onChange={(event) => setResponseFormat(event.target.value as MatchResponseFormat)}><option value="text">Natural language</option><option value="short">Short answer or label</option><option value="json">Structured JSON</option></select></label>
        <label className="match-field"><span>Expected requests each month</span><input type="number" min={100} max={100000000} value={monthlyRequests} onChange={(event) => setMonthlyRequests(Number(event.target.value))} /></label>
      </div>
      <label className="match-field"><span>How sensitive is the real data?</span><select value={dataSensitivity} onChange={(event) => setDataSensitivity(event.target.value as DataSensitivity)}><option value="public">Public or non-sensitive</option><option value="business">Private business information</option><option value="sensitive">Sensitive customer information</option></select><small>Tests use synthetic data either way. This answer helps explain privacy trade-offs.</small></label>
    </section>}

    {step === 3 && <section className="match-step">
      <span className="match-kicker">Use your own provider accounts</span>
      <h2>Which providers should we test?</h2>
      <p>Select two to six. Their API keys stay in your local environment and are never sent to AgentLens.</p>
      <div className="match-provider-grid">{(Object.keys(PROVIDER_CATALOG) as Array<ProviderChoice["provider"]>).map((provider) => {
        const catalog = PROVIDER_CATALOG[provider];
        const selected = providers.find((choice) => choice.provider === provider);
        return <div key={provider} className={selected ? "is-selected" : ""}>
          <button type="button" onClick={() => toggleProvider(provider)}><span className="provider-monogram">{catalog.name.slice(0, 2).toUpperCase()}</span><span><b>{catalog.name}</b><small>{provider === "ollama" ? "Runs on your computer" : `Uses ${catalog.env}`}</small></span><span className="provider-toggle">{selected ? <Check /> : "+"}</span></button>
          {selected && <label><span>Model</span><input value={selected.model} onChange={(event) => setProviders((current) => current.map((choice) => choice.provider === provider ? { ...choice, model: event.target.value } : choice))} /></label>}
        </div>;
      })}</div>
      <div className="match-privacy-note"><LockKeyhole /><div><b>AgentLens never receives these API keys.</b><p>The local runner reads them from your existing environment. Model responses are scored locally and discarded.</p></div></div>
    </section>}

    {step === 4 && <section className="match-step">
      <span className="match-kicker">Ready to create your test plan</span>
      <h2>Here is what AgentLens will do.</h2>
      <p>Nothing runs until you review the synthetic checks and start the local runner.</p>
      <div className="match-review-grid">
        <article><span>AI job</span><b>{name}</b><p>{useCase}</p></article>
        <article><span>Recommendation goal</span><b>{priorities.find((item) => item.value === priority)?.title}</b><p>{monthlyRequests.toLocaleString()} expected requests each month</p></article>
        <article><span>Providers</span><b>{providers.length} selected</b><p>{providers.map((choice) => PROVIDER_CATALOG[choice.provider].name).join(", ")}</p></article>
        <article><span>Privacy</span><b>Local test execution</b><p>No keys, production prompts, or model answers are uploaded.</p></article>
      </div>
    </section>}

    {error && <p className="match-error" role="alert">{error}</p>}
    <div className="match-actions">
      {step > 1 ? <Button variant="secondary" onClick={() => { setError(null); setStep((current) => current - 1); }}><ArrowLeft /> Back</Button> : <span />}
      {step < 4 ? <Button onClick={next}>Continue <ArrowRight /></Button> : <Button onClick={create} disabled={saving}>{saving ? "Creating safe tests…" : <><Sparkles /> Create test plan</>}</Button>}
    </div>
  </div>;
}
