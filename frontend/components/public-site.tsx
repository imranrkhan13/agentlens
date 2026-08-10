"use client";

import { useRouter } from "next/navigation";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight, Check, ChevronRight, CircleAlert, CircleCheck, Clock3, Code2,
  Copy, Github, GitBranch, Globe2, Layers3, LockKeyhole, MessageSquare,
  Radar, ScanSearch, Server, ShieldCheck, Sparkles, Terminal, Webhook, Zap,
} from "lucide-react";

const workflow = [
  ["01", "Connect", "One guided command. No rewrite."],
  ["02", "Observe", "Your real AI use appears here."],
  ["03", "Detect", "Deviation from your own baseline."],
  ["04", "Explain", "Why it happened, in plain English."],
  ["05", "Recommend", "A safer provider or next step."],
  ["06", "Resolve", "Fixed before most users notice."],
] as const;

const providers = [
  { name: "OpenAI", value: "61%", label: "Degraded today", tone: "bad" },
  { name: "Claude", value: "99%", label: "Recommended", tone: "good" },
  { name: "Groq", value: "100%", label: "Fastest", tone: "good" },
  { name: "Gemini", value: "97%", label: "Stable", tone: "info" },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="public-label">{children}</p>;
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="public-button public-button-primary">{children}<ArrowRight size={15} /></button>;
}

function MiniStatus({ tone, children }: { tone: "good" | "bad" | "info"; children: React.ReactNode }) {
  return <span className={`public-status public-status-${tone}`}><span />{children}</span>;
}

function IncidentCard({ compact = false }: { compact?: boolean }) {
  return <div className={`incident-card ${compact ? "incident-card-compact" : ""}`}>
    <div className="incident-card-top"><div><span className="public-kicker">LIVE INCIDENT</span><h3>OpenAI / gpt-4o</h3></div><span className="incident-badge">DEGRADED</span></div>
    <div className="incident-rate"><div><span>Success rate</span><strong>98.4%</strong></div><div className="incident-arrow">→</div><div><span>Now</span><strong className="incident-red">61.2%</strong></div></div>
    {!compact && <><div className="incident-rule" /><div className="incident-meta"><div><span>Detected</span><b>4 min ago</b></div><div><span>Root cause</span><b>Rate limiting</b></div></div><div className="incident-recommendation"><div className="recommendation-icon"><Sparkles size={14} /></div><div><span>Recommended action</span><b>Route traffic to Claude</b><small>99.1% success · normal latency</small></div><ChevronRight size={15} /></div></>}
  </div>;
}

function ProductVisual() {
  return <div className="product-visual">
    <div className="product-visual-head"><div><span className="public-kicker">INCIDENT #412</span><h3>OpenAI / gpt-4o</h3></div><div className="product-head-right"><MiniStatus tone="bad">Open</MiniStatus><span className="visual-date">Today, 12:47 UTC</span></div></div>
    <div className="product-stats"><div><span>Success rate</span><b>98.4% <em>→ 61.2%</em></b></div><div><span>Latency</span><b>840ms <em>→ 2.8s</em></b></div><div><span>Cost impact</span><b className="amber-text">+14%</b></div></div>
    <div className="product-grid"><div className="timeline-panel"><div className="panel-title"><span>Incident timeline</span><span className="muted-small">7 events</span></div><div className="timeline">{[["12:41", "Baseline normal", "normal"], ["12:44", "Latency increased", "warn"], ["12:45", "Retry rate increased", "warn"], ["12:46", "Success rate dropped", "bad"], ["12:47", "Incident detected", "bad"], ["12:47", "Slack alert sent", "good"], ["12:48", "GitHub issue #412 created", "info"]].map(([time, label, tone]) => <div className="timeline-row" key={time + label}><span className="timeline-time">{time}</span><span className={`timeline-dot ${tone}`} /><span>{label}</span></div>)}</div></div><div className="visual-side"><div className="provider-panel"><div className="panel-title"><span>Provider health</span><span className="muted-small">Live</span></div>{providers.map((p) => <div className="provider-row" key={p.name}><span>{p.name}</span><div className="provider-bar"><i className={p.tone} style={{ width: p.value }} /></div><b>{p.value}</b></div>)}</div><div className="visual-recommendation"><span className="public-kicker">RECOMMENDATION</span><strong>Route traffic to Claude</strong><p>Similar cost, normal latency, and 99.1% success rate right now.</p><button>View incident <ArrowRight size={13} /></button></div></div></div>
    <div className="product-visual-foot"><span><CircleCheck size={14} /> All data is from your production telemetry</span><button><Copy size={13} /> Copy investigation prompt</button></div>
  </div>;
}


function HeroSignalBoard() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 120, damping: 18, mass: .45 });
  const springY = useSpring(pointerY, { stiffness: 120, damping: 18, mass: .45 });
  const rotateX = useTransform(springY, [-.5, .5], [4, -4]);
  const rotateY = useTransform(springX, [-.5, .5], [-5, 5]);
  const driftX = useTransform(springX, [-.5, .5], [-10, 10]);
  const driftY = useTransform(springY, [-.5, .5], [-8, 8]);
  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - .5);
    pointerY.set((event.clientY - rect.top) / rect.height - .5);
  }
  function leave() { pointerX.set(0); pointerY.set(0); }
  return <div className="hero-stage" onPointerMove={move} onPointerLeave={leave}>
    <motion.div className="hero-stage-orbit hero-stage-orbit-one" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} />
    <motion.div className="hero-stage-orbit hero-stage-orbit-two" animate={reduceMotion ? undefined : { rotate: -360 }} transition={{ duration: 42, repeat: Infinity, ease: "linear" }} />
    <motion.div className="hero-board-wrap" style={reduceMotion ? undefined : { rotateX, rotateY, x: driftX, y: driftY }}>
      <div className="hero-board-glow" />
      <div className="hero-board">
        <div className="hero-board-top"><div className="hero-board-brand"><span className="hero-window-dots"><i /><i /><i /></span><span>AgentLens / Live monitor</span></div><span className="hero-board-time"><span className="live-pulse" /> Live · updated just now</span></div>
        <div className="hero-board-title"><div><span className="public-kicker">PROVIDER HEALTH</span><h3>Production signal</h3></div><span className="hero-range">Last 60 min⌄</span></div>
        <div className="hero-board-main">
          <div className="hero-chart-panel"><div className="hero-chart-stat"><div><span>Success rate</span><b>61.2%</b><small><em>↓ 37.2%</em> since 12:44 UTC</small></div><span className="hero-chart-chip">Incident detected</span></div><div className="hero-chart"><div className="hero-chart-lines" /><svg viewBox="0 0 520 180" preserveAspectRatio="none" aria-label="Success rate trend"><defs><linearGradient id="heroArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d5a33e" stopOpacity=".28" /><stop offset="1" stopColor="#d5a33e" stopOpacity="0" /></linearGradient></defs><path className="hero-area-path" d="M0 52 C50 45 72 60 112 49 S175 42 212 48 S251 48 284 55 L315 57 C345 60 362 72 386 108 S422 125 452 135 S486 143 520 149 L520 180 L0 180Z" fill="url(#heroArea)" /><path className="hero-line-path" d="M0 52 C50 45 72 60 112 49 S175 42 212 48 S251 48 284 55 L315 57 C345 60 362 72 386 108 S422 125 452 135 S486 143 520 149" fill="none" stroke="#c88727" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><motion.span className="hero-chart-alert" animate={reduceMotion ? undefined : { scale:[1,1.35,1], opacity:[.7,1,.7] }} transition={{ duration:2.2, repeat:Infinity }} /></div><div className="hero-chart-axis"><span>12:00</span><span>12:20</span><span>12:40</span><span>13:00</span></div></div>
          <div className="hero-health-panel"><span className="public-kicker">LIVE PROVIDERS</span>{providers.map((provider, index) => <motion.div className="hero-health-row" key={provider.name} initial={reduceMotion ? false : { opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{ delay:.35 + index*.1, duration:.45 }}><span className={`health-dot ${provider.tone}`} /><b>{provider.name}</b><span className="hero-health-line"><i className={provider.tone} style={{ width: provider.value }} /></span><strong>{provider.value}</strong></motion.div>)}<div className="hero-health-note"><Sparkles size={13} /><span>Claude is the safest route right now</span></div></div>
        </div>
        <div className="hero-board-bottom"><span><CircleCheck size={13} /> 12,402 calls observed</span><span><ShieldCheck size={13} /> No prompt content collected</span></div>
      </div>
    </motion.div>
    <motion.div className="hero-float-card hero-float-card-alert" style={reduceMotion ? undefined : { x: driftX, y: driftY }} initial={reduceMotion ? false : { opacity:0, x:-18, y:18 }} animate={{ opacity:1, x:0, y:0 }} transition={{ delay:.65, duration:.7, type:"spring", stiffness:100 }}><span className="float-icon float-icon-red"><CircleAlert size={14} /></span><div><small>12:47 UTC</small><b>Incident detected</b><span>OpenAI / gpt-4o</span></div></motion.div>
    <motion.div className="hero-float-card hero-float-card-route" initial={reduceMotion ? false : { opacity:0, x:18, y:-16 }} animate={{ opacity:1, x:0, y:0 }} transition={{ delay:.9, duration:.7, type:"spring", stiffness:100 }}><span className="float-icon float-icon-gold"><GitBranch size={14} /></span><div><small>Recommended</small><b>Route to Claude</b><span>99.1% success rate</span></div></motion.div>
  </div>;
}

export default function PublicSite() {
  const router = useRouter();
  const goSignup = () => router.push("/signup");
  return <main className="public-page">
    <div className="public-shell">
      <header className="public-nav"><a href="#top" className="public-brand"><span><Radar size={17} /></span>AgentLens</a><nav><a href="#product">Product</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#docs">Docs</a></nav><div className="public-nav-actions"><a className="github-link" href="https://github.com/imranrkhan13/agentlens" target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a><button className="nav-cta" onClick={goSignup}>Start monitoring</button></div></header>

      <section id="top" className="public-hero"><div className="hero-copy"><SectionLabel>AI RELIABILITY INFRASTRUCTURE</SectionLabel><h1>Know your AI system<br /><i>is failing before</i><br />your users do.</h1><p>AgentLens watches every real call your application makes to OpenAI, Anthropic, Groq, Gemini, and more—then tells you what changed, why it happened, and what to do next.</p><div className="hero-actions"><PrimaryButton onClick={goSignup}>Start monitoring</PrimaryButton><a href="https://github.com/imranrkhan13/agentlens" target="_blank" rel="noreferrer" className="public-button public-button-secondary"><Github size={16} /> View on GitHub</a></div><div className="trust-row"><span><CircleCheck size={14} /> Open source</span><span><ActivityIcon /> Production telemetry</span><span><Globe2 size={14} /> Multi-provider</span><span><Zap size={14} /> Real-time alerts</span></div></div><HeroSignalBoard /></section>

      <section id="product" className="visual-section"><div className="section-intro"><div><SectionLabel>SEE THE SIGNAL</SectionLabel><h2>When production gets weird,<br /><i>AgentLens gets specific.</i></h2></div><p>One place to see the incident, understand the cause, and choose the safest next move—without stitching together six dashboards.</p></div><ProductVisual /></section>

      <section className="problem-section"><div className="problem-copy"><SectionLabel>THE PROBLEM</SectionLabel><h2>Your AI app goes live.<br />Something breaks.<br /><i>Customers notice first.</i></h2><p>AI failures are rarely one clean error. They are a slow provider, rising retries, a cost spike, or a change nobody connected to an incident.</p></div><div className="comparison"><div className="comparison-panel comparison-without"><span className="comparison-label">WITHOUT AGENTLENS</span><div className="comparison-stack"><span>Support ticket</span><b>↓</b><span>Grafana</span><b>↓</b><span>Raw logs</span><b>↓</b><span>Provider dashboard</span></div><strong>45 minutes later</strong><small>Still investigating.</small></div><div className="comparison-panel comparison-with"><span className="comparison-label">WITH AGENTLENS</span><div className="answer-callout"><MiniStatus tone="bad">Incident detected · 4 min ago</MiniStatus><strong>OpenAI success rate dropped to 61%.</strong><span>Root cause: <b>Rate limiting</b></span><span>Recommended: <b>Route to Claude</b></span></div><strong className="answer-time">Time to answer: &lt; 60 seconds</strong></div></div></section>

      <section id="how-it-works" className="workflow-section"><div className="section-intro centered-intro"><SectionLabel>HOW IT WORKS</SectionLabel><h2>From install to resolution,<br /><i>automatically.</i></h2><p>One guided path from your first request to a clear fix.</p></div><div className="workflow-line">{workflow.map(([number, title, desc], index) => <div className="workflow-step" key={number}><div className="workflow-number">{number}</div><div className="workflow-node" /><h3>{title}</h3><p>{desc}</p>{index < workflow.length - 1 && <span className="workflow-arrow">→</span>}</div>)}</div><div className="install-strip"><div className="install-icon"><Terminal size={18} /></div><div><span>Start with one command</span><code>npm install agentlens</code></div><p>Then import <code>agentlens/register</code> once at server startup.</p><button onClick={() => navigator.clipboard?.writeText("npm install agentlens")}><Copy size={14} /> Copy</button></div></section>

      <section className="bento-section"><div className="section-intro"><div><SectionLabel>THE TOOLKIT</SectionLabel><h2>Everything you need<br /><i>when production gets weird.</i></h2></div><p>Less guessing. More evidence. Every surface points back to the telemetry your application actually produced.</p></div><div className="bento-grid"><div className="bento-card bento-large"><div className="bento-card-head"><div><span className="public-kicker">INCIDENT INTELLIGENCE</span><h3>A timeline you can act on.</h3></div><GitBranch size={20} /></div><div className="mini-timeline"><span /><span /><span className="active" /><span className="active" /><span className="active" /></div><div className="mini-event"><b>12:47</b><span className="timeline-dot bad" />Success rate dropped</div><div className="mini-event"><b>12:48</b><span className="timeline-dot good" />GitHub issue created automatically</div><a href="#product" className="text-link">Explore an incident <ArrowRight size={14} /></a></div><div className="bento-card provider-bento"><span className="public-kicker">PROVIDER HEALTH</span><h3>See who is working<br />for your app.</h3>{providers.slice(0, 3).map((p) => <div className="bento-provider" key={p.name}><span>{p.name}</span><div className="provider-bar"><i className={p.tone} style={{ width: p.value }} /></div><b>{p.value}</b></div>)}</div><div className="bento-card prompt-bento"><span className="public-kicker">INVESTIGATION PROMPT</span><h3>From alert to<br />useful question.</h3><div className="prompt-preview"><span>Investigate a production degradation affecting</span><b>OpenAI / gpt-4o.</b><span>Observed: success rate fell from 98.4% to 61.2%...</span><div className="prompt-cursor" /></div><a href="#investigation" className="text-link">See the prompt <ArrowRight size={14} /></a></div><div className="bento-card alerts-bento"><span className="public-kicker">AUTOMATIC ALERTS</span><h3>Put the right context<br />where your team works.</h3><div className="integration-pills"><span><MessageSquare size={15} /> Slack</span><span><Github size={15} /> GitHub</span><span><Webhook size={15} /> Webhook</span></div><p>Incident #412 · OpenAI success rate dropped to 61%.</p></div><div className="bento-card trend-bento"><span className="public-kicker">WEEKLY RELIABILITY</span><h3>Know the direction,<br />not just the moment.</h3><div className="trend-chart"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="trend-foot"><b>94.2%</b><span>+6.4% this week</span></div></div></div></section>

      <section className="dashboard-section"><div className="section-intro"><div><SectionLabel>REAL-TIME DASHBOARD</SectionLabel><h2>Your production AI,<br /><i>as it actually behaves.</i></h2></div><div className="illustrative-note"><span>Illustrative example</span><p>Real dashboards use your production telemetry.</p></div></div><div className="dashboard-mock"><div className="dashboard-mock-top"><div><span className="public-kicker">OVERVIEW</span><h3>Customer support assistant</h3></div><MiniStatus tone="good">Receiving traffic</MiniStatus></div><div className="dashboard-metrics"><div><span>AI conversations</span><b>12,402</b><small>+18.4% this week</small></div><div><span>Answers delivered</span><b>94.2%</b><small>Requests completed</small></div><div><span>Typical response</span><b>Very fast</b><small>420ms average</small></div><div><span>AI spend</span><b>$12.40</b><small>Last 24 hours</small></div><div><span>Needs attention</span><b className="red-text">3</b><small>Open incidents</small></div></div><div className="dashboard-lower"><div className="chart-panel"><div className="panel-title"><span>Response time</span><span className="muted-small">Last 24 hours</span></div><div className="line-chart"><div className="chart-grid" /><svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-label="Illustrative response time chart"><path d="M0 118 C42 112 58 125 92 105 S145 84 178 108 S222 128 250 90 S298 62 330 82 S378 74 408 92 S450 96 480 52 S535 71 600 28" fill="none" stroke="#c88727" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></div><div className="chart-labels"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>Now</span></div></div><div className="health-panel"><div className="panel-title"><span>AI services</span><span className="muted-small">Status now</span></div>{providers.map((p) => <div className="health-row" key={p.name}><span className={`health-dot ${p.tone}`} /><b>{p.name}</b><span>{p.label}</span><strong>{p.value}</strong></div>)}</div></div></div></section>

      <section className="provider-section"><div className="section-intro centered-intro"><SectionLabel>PROVIDER COMPARISON</SectionLabel><h2>Every provider says it is fine.<br /><i>We show what your app experienced.</i></h2></div><div className="provider-matrix"><div className="matrix-head"><span>Provider</span><span>Reliability</span><span>Latency</span><span>Recommendation</span></div>{providers.map((p) => <div className="matrix-row" key={p.name}><b>{p.name}</b><div className="matrix-score"><span className={`health-dot ${p.tone}`} />{p.value}</div><div className="matrix-bar"><i className={p.tone} style={{ width: p.value }} /></div><span className={`matrix-tag ${p.tone}`}>{p.label}</span></div>)}</div></section>

      <section id="investigation" className="investigation-section"><div className="investigation-copy"><SectionLabel>INVESTIGATION WORKFLOW</SectionLabel><h2>From alert to fix<br /><i>without 20 minutes of digging.</i></h2><p>AgentLens turns an incident into a useful question your engineer can answer, with the evidence already attached.</p><div className="lifecycle">{["Detected", "Explained", "Prompt ready", "Investigated", "Resolved"].map((step, i) => <div key={step}><span className={i < 2 ? "done" : ""}>{i < 2 ? <Check size={12} /> : i + 1}</span><b>{step}</b>{i < 4 && <i />}</div>)}</div></div><div className="prompt-card"><div className="prompt-card-top"><span><ScanSearch size={15} /> INVESTIGATION PROMPT</span><button><Copy size={14} /> Copy prompt</button></div><h3>Investigate a production degradation affecting OpenAI / gpt-4o.</h3><p>Observed:</p><ul><li>success rate fell from 98.4% to 61.2%</li><li>p95 latency increased 3.1x</li><li>retry rate increased at 12:44 UTC</li><li>Claude remained at 99.1%</li></ul><p>Determine likely root cause and recommend the safest mitigation.</p></div></section>

      <section className="integrations-section"><div><SectionLabel>ALERT INTEGRATIONS</SectionLabel><h2>The right context,<br /><i>in the right place.</i></h2></div><div className="integration-feed"><div className="feed-item"><span className="feed-icon github"><Github size={18} /></span><div><b>GitHub</b><p>Incident #412 · Automatically created</p></div><span className="feed-ok">Created</span></div><div className="feed-item"><span className="feed-icon slack"><MessageSquare size={18} /></span><div><b>Slack · #production-ai</b><p>OpenAI success rate dropped to 61%.</p></div><span className="feed-time">12:47</span></div><div className="feed-item"><span className="feed-icon webhook"><Webhook size={18} /></span><div><b>Webhook</b><p>POST <strong>200 OK</strong> · 84ms</p></div><span className="feed-ok">Delivered</span></div></div></section>

      <section id="docs" className="opensource-section"><div className="open-source-mark"><Code2 size={26} /></div><div><SectionLabel>OPEN SOURCE</SectionLabel><h2>Open tooling.<br /><i>Inspectable reasoning.</i></h2><p>Recommendations trace back to real telemetry—not opaque scoring. Bring your own providers, inspect the signal, and keep your data in your stack.</p><div className="sdk-row"><span><Terminal size={15} /> Python</span><span><Code2 size={15} /> TypeScript</span><span><Server size={15} /> Self-hostable</span></div><div className="hero-actions"><a className="public-button public-button-secondary" href="https://github.com/imranrkhan13/agentlens" target="_blank" rel="noreferrer"><Github size={16} /> Star on GitHub</a><a className="text-link" href="https://github.com/imranrkhan13/agentlens" target="_blank" rel="noreferrer">Read the docs <ArrowRight size={14} /></a></div></div></section>

      <section id="pricing" className="pricing-section"><div className="section-intro centered-intro"><SectionLabel>PRICING</SectionLabel><h2>Start with clarity.<br /><i>Scale with confidence.</i></h2></div><div className="pricing-grid"><div className="price-card"><span className="public-kicker">DEVELOPER</span><h3>Free</h3><p>For exploring your first production signal.</p><ul><li><Check size={14} /> 1 project</li><li><Check size={14} /> 7-day incident history</li><li><Check size={14} /> Webhook alerts</li><li><Check size={14} /> Community support</li></ul><button onClick={goSignup}>Start free <ArrowRight size={14} /></button></div><div className="price-card price-card-featured"><span className="price-ribbon">Most useful</span><span className="public-kicker">TEAM</span><h3>Contact us</h3><p>For teams who want incidents handled with context.</p><ul><li><Check size={14} /> Unlimited projects</li><li><Check size={14} /> GitHub automation</li><li><Check size={14} /> 90-day history</li><li><Check size={14} /> Slack alerts and reports</li></ul><button onClick={goSignup}>Get in touch <ArrowRight size={14} /></button></div><div className="price-card"><span className="public-kicker">ENTERPRISE</span><h3>Contact us</h3><p>For teams with security and retention requirements.</p><ul><li><Check size={14} /> Self-hosted deployment</li><li><Check size={14} /> SSO</li><li><Check size={14} /> Custom retention</li><li><Check size={14} /> Dedicated support</li></ul><button onClick={goSignup}>Contact sales <ArrowRight size={14} /></button></div></div></section>

      <section className="final-cta"><div><SectionLabel>KEEP YOUR USERS OUT OF THE INCIDENT</SectionLabel><h2>Don&apos;t wait for customers<br />to tell you your AI is broken.</h2><p>Monitor real production AI behavior and know what changed before your support inbox does.</p></div><div className="final-actions"><PrimaryButton onClick={goSignup}>Start monitoring</PrimaryButton><a href="https://github.com/imranrkhan13/agentlens" target="_blank" rel="noreferrer" className="text-link">View on GitHub <ArrowRight size={14} /></a><small>Open source · Setup in minutes</small></div></section>

      <footer className="public-footer"><a href="#top" className="public-brand"><span><Radar size={16} /></span>AgentLens</a><p>Reliability infrastructure for production AI applications.</p><div className="footer-links"><a href="#product">Product</a><a href="#docs">Documentation</a><a href="https://github.com/imranrkhan13/agentlens" target="_blank" rel="noreferrer">GitHub</a><a href="#pricing">Pricing</a></div><small>© {new Date().getFullYear()} AgentLens</small></footer>
    </div>
  </main>;
}

function ActivityIcon() { return <span className="activity-icon" aria-hidden="true"><i /><i /><i /></span>; }
