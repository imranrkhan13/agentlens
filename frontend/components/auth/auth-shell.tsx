import { Activity, ArrowLeft, CircleAlert, CircleCheck, GitBranch, Radar, ShieldCheck } from "lucide-react";
import { marketingUrl } from "@/lib/marketing-url";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-ui">
      <div className="auth-shell">
        <aside className="auth-story" aria-label="AgentLens reliability preview">
          <a href={marketingUrl} className="auth-brand" aria-label="Back to AgentLens">
            <span><Radar size={18} /></span>AgentLens
          </a>
          <div className="auth-story-copy">
            <span className="auth-eyebrow"><i /> RELIABILITY FOR PRODUCTION AI</span>
            <h2>See the failure.<br /><em>Know the next move.</em></h2>
            <p>One clear view of what changed across every AI provider your application uses.</p>
          </div>
          <div className="auth-monitor">
            <div className="auth-monitor-bar"><span><i /><i /><i /> agentlens / live</span><b><i /> LIVE</b></div>
            <div className="auth-monitor-title"><div><small>INCIDENT 412</small><strong>Provider degradation</strong></div><span>Last 60 min</span></div>
            <div className="auth-monitor-metrics"><div><span>Success rate</span><b>61.2%</b><small>↓ 37.2%</small></div><div><span>p95 latency</span><b>2.8s</b><small>3.1× slower</small></div></div>
            <div className="auth-signal"><i /><i /><i /><i /><i /><i /><i /><i /><span /></div>
            <div className="auth-monitor-foot"><ShieldCheck size={13} /> No prompt content collected</div>
          </div>
          <div className="auth-float auth-float-alert"><span><CircleAlert size={14} /></span><div><small>Likely cause</small><b>Provider rate limiting</b></div></div>
          <div className="auth-float auth-float-route"><span><GitBranch size={14} /></span><div><small>Recommended</small><b>Route to Anthropic</b></div></div>
          <div className="auth-story-trust"><span><CircleCheck size={13} /> Open source</span><span><Activity size={13} /> Real telemetry</span></div>
        </aside>

        <section className="auth-form-panel">
          <a href={marketingUrl} className="auth-mobile-brand" aria-label="Back to AgentLens"><span><Radar size={17} /></span>AgentLens</a>
          <div className="auth-form-wrap">
            <span className="auth-eyebrow"><i /> {eyebrow.toUpperCase()}</span>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="auth-form-content">{children}</div>
          </div>
          <a href={marketingUrl} className="auth-back"><ArrowLeft size={14} /> Back to website</a>
        </section>
      </div>
    </main>
  );
}
