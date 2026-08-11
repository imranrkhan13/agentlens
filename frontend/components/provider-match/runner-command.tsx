"use client";

import { useEffect, useState } from "react";
import { Check, Clipboard, KeyRound, LoaderCircle, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunnerCommand({ matchId, status }: { matchId: string; status: string }) {
  const [command, setCommand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/provider-match/${matchId}/runner-token`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "Could not create a runner code.");
      setCommand(`npx agentlens match --code ${payload.token} --workspace ${window.location.origin}`);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Could not create a runner code.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status !== "complete") void generate();
    // Generate once when this secure setup card opens. A new click rotates it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function copy() {
    if (!command) return;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (status === "complete") return null;
  return <section className="runner-card">
    <div className="runner-card-heading"><span><Play /></span><div><p>RUN THE REAL COMPARISON</p><h2>One command. Your keys stay local.</h2></div></div>
    <ol><li><span>1</span><p>Open a terminal inside your app folder.</p></li><li><span>2</span><p>Make sure the provider keys you want to test are in your environment.</p></li><li><span>3</span><p>Copy and run this private, 30-minute command.</p></li></ol>
    <div className="runner-command"><KeyRound />{loading ? <span><LoaderCircle className="animate-spin" /> Creating a one-time code…</span> : command ? <code>{command}</code> : <span>Generate a private runner code</span>}<button type="button" onClick={copy} disabled={!command} aria-label="Copy comparison command">{copied ? <Check /> : <Clipboard />}</button></div>
    <div className="runner-foot"><p>Provider responses are scored and discarded on your computer. AgentLens receives only the scorecard.</p><Button variant="secondary" size="sm" onClick={generate} disabled={loading}><RefreshCw /> New code</Button></div>
    {error && <p className="match-error" role="alert">{error}</p>}
  </section>;
}
