"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Code2,
  Copy,
  Github,
  GitBranch,
  Globe2,
  LockKeyhole,
  MessageSquare,
  Radar,
  ScanSearch,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Webhook,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const githubUrl = "https://github.com/imranrkhan13/agentlens";

const providers = [
  { name: "OpenAI", score: 61, status: "Degraded", tone: "danger", latency: "2.8s" },
  { name: "Anthropic", score: 99, status: "Recommended", tone: "success", latency: "410ms" },
  { name: "Groq", score: 100, status: "Fastest", tone: "success", latency: "180ms" },
  { name: "Gemini", score: 97, status: "Stable", tone: "neutral", latency: "520ms" },
] as const;

const workflow = [
  { number: "01", title: "Describe", body: "Explain the AI job in normal language. No benchmark knowledge needed.", icon: MessageSquare },
  { number: "02", title: "Compare", body: "Run the same synthetic checks locally across your selected providers.", icon: ScanSearch },
  { number: "03", title: "Choose", body: "See the best fit for your quality, speed, reliability, and cost priorities.", icon: Sparkles },
  { number: "04", title: "Connect", body: "Install one helper without replacing your existing AI integration.", icon: Terminal },
  { number: "05", title: "Monitor", body: "Keep watching the choice with evidence from real production behavior.", icon: Radar },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="al-eyebrow"><i />{children}</span>;
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedHeadline() {
  const reduceMotion = useReducedMotion();
  const lines = [
    <span key="one">Choose the right AI.</span>,
    <span key="two">Monitor it <em>in production.</em></span>,
    <span key="three">Fix failures before users notice.</span>,
  ];

  return (
    <h1 className="al-hero-title" aria-label="Choose the right AI. Monitor it in production. Fix failures before users notice.">
      {lines.map((line, index) => (
        <span className="al-title-mask" key={index}>
          <motion.span
            initial={reduceMotion ? false : { y: "115%", rotate: 1.5 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1, delay: 0.12 + index * 0.11, ease }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function MagneticButton({ children, onClick, secondary = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 250, damping: 18 });
  const springY = useSpring(y, { stiffness: 250, damping: 18 });

  return (
    <motion.button
      className={`al-button ${secondary ? "al-button-secondary" : "al-button-primary"}`}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
      onPointerMove={(event) => {
        if (reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.12);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.16);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
    >
      <span>{children}</span>
      <i><ArrowRight size={15} /></i>
    </motion.button>
  );
}

function SignalGraph() {
  const reduceMotion = useReducedMotion();
  const segments = [0, -4, 2, -2, 4, -3, 2, 0, 1, 9, 20, 42, 61, 72, 79, 83];
  return (
    <div className="al-signal-graph" aria-label="Success rate dropped sharply after 12:44 UTC">
      <div className="al-graph-grid" />
      <div className="al-graph-threshold"><span>baseline 98.4%</span></div>
      <div className="al-graph-line">
        {segments.slice(0, -1).map((point, index) => {
          const next = segments[index + 1];
          const delta = next - point;
          const length = Math.sqrt(42 * 42 + delta * delta);
          const angle = Math.atan2(delta, 42) * (180 / Math.PI);
          return (
            <motion.i
              key={index}
              className={index > 8 ? "falling" : ""}
              style={{ left: `${index * 6.42}%`, top: `${22 + point * 0.66}%`, width: `${length}px`, rotate: `${angle}deg` }}
              initial={reduceMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.32, delay: 0.55 + index * 0.045, ease }}
            />
          );
        })}
      </div>
      <motion.span className="al-graph-ping" initial={reduceMotion ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.32, type: "spring", stiffness: 220 }} />
      <motion.div className="al-graph-scan" animate={reduceMotion ? undefined : { x: ["-5%", "103%"] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
      <div className="al-graph-times"><span>12:00</span><span>12:20</span><span>12:40</span><span>13:00</span></div>
    </div>
  );
}

function HeroConsole() {
  const reduceMotion = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 110, damping: 18, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 110, damping: 18, mass: 0.5 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [3.2, -3.2]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-4.5, 4.5]);
  const cardX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const cardY = useTransform(sy, [-0.5, 0.5], [-8, 8]);
  const inverseCardX = useTransform(cardX, value => -value);
  const inverseCardY = useTransform(cardY, value => -value);

  return (
    <div className="al-console-stage" onPointerMove={(event) => { if (reduceMotion) return; const rect = event.currentTarget.getBoundingClientRect(); px.set((event.clientX - rect.left) / rect.width - 0.5); py.set((event.clientY - rect.top) / rect.height - 0.5); }} onPointerLeave={() => { px.set(0); py.set(0); }}>
      <div className="al-orbit al-orbit-one" /><div className="al-orbit al-orbit-two" />
      <motion.div className="al-console-perspective" style={reduceMotion ? undefined : { rotateX, rotateY }} initial={reduceMotion ? false : { opacity: 0, y: 45, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.1, delay: 0.3, ease }}>
        <div className="al-console">
          <div className="al-console-bar"><div className="al-window"><i /><i /><i /><span>agentlens / production</span></div><span className="al-live"><i /> LIVE</span></div>
          <div className="al-console-heading"><div><Eyebrow>INCIDENT 412</Eyebrow><h2>Provider degradation</h2></div><span className="al-time-range"><Clock3 size={13} /> Last 60 min</span></div>
          <div className="al-console-metrics"><div><span>Success rate</span><strong>61.2%</strong><small className="danger">↓ 37.2%</small></div><div><span>p95 latency</span><strong>2.8s</strong><small className="danger">3.1× slower</small></div><div><span>Calls observed</span><strong>12,402</strong><small>live sample</small></div></div>
          <SignalGraph />
          <div className="al-console-foot"><span><ShieldCheck size={13} /> No prompt content collected</span><span>Updated 4s ago</span></div>
        </div>
      </motion.div>
      <motion.div className="al-float al-float-cause" style={reduceMotion ? undefined : { x: cardX, y: cardY }}><span className="al-float-icon danger"><CircleAlert size={15} /></span><div><small>Likely root cause</small><b>Provider rate limiting</b><span>Confidence 94%</span></div></motion.div>
      <motion.div className="al-float al-float-route" style={reduceMotion ? undefined : { x: inverseCardX, y: inverseCardY }}><span className="al-float-icon success"><GitBranch size={15} /></span><div><small>Safest route now</small><b>Switch to Anthropic</b><span>99.1% success · 410ms</span></div><ChevronRight size={16} /></motion.div>
    </div>
  );
}

function Marquee() {
  const items = ["OPENAI", "ANTHROPIC", "GROQ", "GEMINI", "MISTRAL", "AZURE AI"];
  return <div className="al-marquee" aria-label="Supported providers"><div className="al-marquee-track">{[...items, ...items].map((item, index) => <span key={`${item}-${index}`}><i />{item}</span>)}</div></div>;
}

function IncidentStory() {
  const events = [["12:41", "Baseline normal", "normal"], ["12:44", "Latency begins rising", "warning"], ["12:46", "Success rate drops", "danger"], ["12:47", "AgentLens opens incident", "danger"], ["12:48", "Safer route recommended", "success"]] as const;
  return <div className="al-incident-story"><div className="al-story-rail">{events.map(([time, label, tone], index) => <motion.div className={`al-story-event ${tone}`} key={time} initial={{ opacity: 0.3 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-35% 0px -35% 0px" }} transition={{ duration: 0.5, delay: index * 0.08 }}><time>{time}</time><span className="al-story-node" /><p>{label}</p></motion.div>)}</div><motion.div className="al-story-answer" whileHover={{ rotate: -0.6, y: -5 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}><div className="al-story-answer-top"><span><Sparkles size={14} /> AGENTLENS ANSWER</span><span className="al-chip success">Ready</span></div><h3>Route new traffic to Anthropic.</h3><p>OpenAI is rate limiting this workload. Anthropic is handling a matching request profile at 99.1% success with normal latency.</p><div className="al-evidence"><span><b>94%</b> root-cause confidence</span><span><b>12,402</b> calls compared</span></div><button>Open incident <ArrowDownRight size={15} /></button></motion.div></div>;
}

function Workflow() {
  return <div className="al-workflow"><motion.div className="al-workflow-progress" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: "-20%" }} transition={{ duration: 1.5, ease }} />{workflow.map(({ number, title, body, icon: Icon }, index) => <motion.article key={number} className="al-workflow-step" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-12%" }} transition={{ duration: 0.65, delay: index * 0.1, ease }} whileHover="hover"><div className="al-workflow-icon"><Icon size={18} /><motion.span variants={{ hover: { scale: 1.7, opacity: 0 } }} /></div><span className="al-workflow-number">{number}</span><h3>{title}</h3><p>{body}</p></motion.article>)}</div>;
}

function ProviderMatrix() {
  return <div className="al-provider-matrix"><div className="al-matrix-head"><span>Provider</span><span>Reliability</span><span>Latency</span><span>Decision</span></div>{providers.map((provider, index) => <motion.div className="al-matrix-row" key={provider.name} initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: index * 0.08, ease }}><strong><i className={provider.tone} />{provider.name}</strong><div className="al-reliability"><span><i className={provider.tone} style={{ width: `${provider.score}%` }} /></span><b>{provider.score}%</b></div><span>{provider.latency}</span><em className={provider.tone}>{provider.status}</em></motion.div>)}<div className="al-matrix-scan" /></div>;
}

function PublicSite() {
  const router = useRouter();
  const pageRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 25, restDelta: 0.001 });
  const goSignup = () => router.push("/signup");

  return <main className="al-page" ref={pageRef}>
    <motion.div className="al-scroll-progress" style={{ scaleX: progress }} />
    <div className="al-shell">
      <header className="al-nav"><a href="#top" className="al-brand"><BrandMark />AgentLens</a><nav><a href="#product">Product</a><Link href="/ai-observability">AI observability</Link><a href="#comparison">Providers</a><a href="#pricing">Pricing</a></nav><div className="al-nav-actions"><a href={githubUrl} target="_blank" rel="noreferrer"><Github size={15} /> GitHub</a><button onClick={goSignup}>Find my provider <ArrowRight size={14} /></button></div></header>

      <section className="al-hero" id="top"><div className="al-hero-copy"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05, duration: 0.6 }}><Eyebrow>AI OBSERVABILITY + LLM MONITORING</Eyebrow></motion.div><AnimatedHeadline /><motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8, ease }}>Compare AI providers before launch, then monitor OpenAI, Anthropic, Gemini, Groq and other LLMs in production. AgentLens explains reliability, latency, errors and cost without collecting your prompts.</motion.p><motion.div className="al-hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68, duration: 0.8, ease }}><MagneticButton onClick={goSignup}>Find my provider free</MagneticButton><a className="al-text-link" href={githubUrl} target="_blank" rel="noreferrer"><Github size={16} /> Explore the source <ArrowRight size={14} /></a></motion.div><motion.div className="al-trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.7 }}><span><CircleCheck size={14} /> Transparent scoring</span><span><LockKeyhole size={14} /> Provider keys stay local</span><span><Zap size={14} /> One-command tests</span></motion.div></div><HeroConsole /></section>

      <Marquee />
      <section className="al-proof-strip"><Reveal><strong>7</strong><span>supported provider paths</span></Reveal><Reveal delay={0.08}><strong>3</strong><span>visible synthetic checks</span></Reveal><Reveal delay={0.16}><strong>1</strong><span>local runner command</span></Reveal><Reveal delay={0.24}><strong>0</strong><span>raw responses uploaded</span></Reveal></section>

      <section className="al-section al-incident-section" id="product"><Reveal className="al-section-heading"><div><Eyebrow>FROM SIGNAL TO ANSWER</Eyebrow><h2>Not another dashboard.<br /><em>A decision, with evidence.</em></h2></div><p>AgentLens turns scattered provider behavior into one clear incident story: what changed, why it matters, and what your team should do next.</p></Reveal><Reveal delay={0.08}><IncidentStory /></Reveal></section>

      <section className="al-dark-section"><Reveal className="al-dark-intro"><Eyebrow>THE DIFFERENCE</Eyebrow><h2>Your support inbox should never be your monitoring system.</h2></Reveal><div className="al-compare"><Reveal className="al-compare-before"><span className="al-compare-label">WITHOUT AGENTLENS</span><div className="al-chaos-stack"><span>Customer complaint</span><i /><span>Provider dashboard</span><i /><span>Raw logs</span><i /><span>Guess the cause</span></div><footer><Clock3 size={16} /><div><b>45 minutes later</b><span>Still investigating.</span></div></footer></Reveal><Reveal className="al-compare-after" delay={0.12}><span className="al-compare-label">WITH AGENTLENS</span><div className="al-answer-stack"><span className="al-chip danger"><i /> Incident detected</span><h3>OpenAI success fell to 61%.</h3><p><span>Root cause</span><b>Rate limiting</b></p><p><span>Safest action</span><b>Route to Anthropic</b></p></div><footer><CircleCheck size={16} /><div><b>Answer in under 60 seconds</b><span>With evidence attached.</span></div></footer></Reveal></div></section>

      <section className="al-section" id="workflow"><Reveal className="al-section-heading al-section-heading-center"><div><Eyebrow>HOW IT WORKS</Eyebrow><h2>From idea to evidence.<br /><em>Then production confidence.</em></h2></div><p>One guided path for choosing, connecting, and monitoring AI—without replacing the stack you already use.</p></Reveal><Workflow /><Reveal className="al-install-band"><span><Terminal size={17} /> Guided AgentLens setup</span><code>npx agentlens init</code><button onClick={() => navigator.clipboard?.writeText("npx agentlens init")}><Copy size={14} /> Copy</button></Reveal></section>

      <section className="al-section al-feature-section"><Reveal className="al-section-heading"><div><Eyebrow>BUILT FOR THE INCIDENT</Eyebrow><h2>Every view moves the<br /><em>investigation forward.</em></h2></div><p>Hover and explore: each surface reveals the evidence behind the recommendation instead of hiding it behind decoration.</p></Reveal><div className="al-feature-stories"><Reveal className="al-feature-story al-feature-story-wide"><div className="al-feature-copy"><span>01 / INCIDENT INTELLIGENCE</span><h3>A timeline that reconstructs what happened.</h3><p>Changes are ordered, correlated, and attached to the provider, model, release, and route that produced them.</p><a href="#product">Explore an incident <ArrowRight size={14} /></a></div><div className="al-mini-timeline">{["Baseline", "Latency", "Retries", "Detected", "Alerted"].map((label, i) => <div key={label} className={i > 1 ? "active" : ""}><span>{`12:${41 + i * 2}`}</span><i /><b>{label}</b></div>)}</div></Reveal><Reveal className="al-feature-story" delay={0.08}><div className="al-feature-copy"><span>02 / AUTOMATIC ALERTS</span><h3>Context arrives where your team works.</h3><p>No “something is wrong” alerts. Every notification carries the signal, cause, and next step.</p></div><div className="al-alert-stack"><div><MessageSquare size={16} /><p><b>#production-ai</b><span>OpenAI success fell to 61%.</span></p><small>now</small></div><div><Github size={16} /><p><b>Issue #412 created</b><span>Investigation context attached.</span></p><small>4s</small></div><div><Webhook size={16} /><p><b>Webhook delivered</b><span>200 OK · 84ms</span></p><small>5s</small></div></div></Reveal><Reveal className="al-feature-story" delay={0.14}><div className="al-feature-copy"><span>03 / INVESTIGATION PROMPT</span><h3>Give your engineer a useful starting point.</h3><p>AgentLens packages the important evidence into a ready-to-use investigation prompt.</p></div><div className="al-prompt-window"><div><i /><i /><i /><span>investigate.md</span></div><p>Investigate a production degradation affecting <b>OpenAI / gpt-4o</b>.</p><p>Observed: success rate fell from <mark>98.4% to 61.2%</mark>...</p><span className="al-type-cursor" /></div></Reveal></div></section>

      <section className="al-section al-provider-section" id="comparison"><Reveal className="al-section-heading"><div><Eyebrow>PROVIDER MATCH</Eyebrow><h2>No universal “best model.”<br /><em>Only the best fit for your job.</em></h2></div><p>Every provider receives the same visible synthetic checks. AgentLens weights instruction fit, reliability, speed, and cost around what matters to your product.</p></Reveal><Reveal delay={0.08}><ProviderMatrix /></Reveal></section>

      <section className="al-section al-investigation"><Reveal className="al-investigation-copy"><Eyebrow>EXPLAINABLE BY DEFAULT</Eyebrow><h2>The recommendation is only useful if you can trust it.</h2><p>Every answer links back to the observations that produced it. No opaque reliability score and no hidden prompt content.</p><ul><li><Check size={14} /> Production telemetry only</li><li><Check size={14} /> Evidence attached to every conclusion</li><li><Check size={14} /> Provider-neutral recommendations</li></ul></Reveal><Reveal className="al-investigation-card" delay={0.1}><div className="al-investigation-top"><span><ScanSearch size={15} /> INVESTIGATION / 412</span><span className="al-chip success">94% confidence</span></div><h3>Why did success rate fall?</h3><div className="al-reasoning"><div className="done"><span>1</span><p><b>Request volume</b><small>Normal · not causal</small></p></div><div className="done"><span>2</span><p><b>Application release</b><small>No changes in window</small></p></div><div className="active"><span>3</span><p><b>Provider response codes</b><small>429 responses increased 8.6×</small></p></div><div><span>4</span><p><b>Conclusion</b><small>Rate limiting is the likely cause</small></p></div></div><button>Copy full investigation <Copy size={14} /></button></Reveal></section>

      <section className="al-section al-open-source"><Reveal className="al-code-mark"><Code2 size={30} /></Reveal><Reveal className="al-open-copy" delay={0.05}><Eyebrow>OPEN SOURCE</Eyebrow><h2>Your reliability layer<br />should not be a black box.</h2><p>Inspect the collection path, run the stack yourself, and keep ownership of your operational data.</p><div><span><Code2 size={15} /> TypeScript</span><span><Terminal size={15} /> Python</span><span><Server size={15} /> Self-hostable</span><span><Globe2 size={15} /> Multi-provider</span></div><a href={githubUrl} target="_blank" rel="noreferrer">Explore AgentLens on GitHub <ArrowRight size={15} /></a></Reveal></section>

      <section className="al-section al-pricing" id="pricing"><Reveal className="al-section-heading al-section-heading-center"><div><Eyebrow>SIMPLE PRICING</Eyebrow><h2>Test before you commit.<br /><em>Pay when you grow.</em></h2></div><p>Clear monthly pricing in INR. Provider usage is paid directly through your own accounts; AgentLens checkout is handled by Razorpay.</p></Reveal><div className="al-pricing-grid"><Reveal className="al-price-card"><span>FREE</span><h3>₹0</h3><p>For choosing and watching your first AI feature.</p><ul><li><Check size={14} /> 3 comparisons each month</li><li><Check size={14} /> 1 monitored project</li><li><Check size={14} /> Local private runner</li></ul><button onClick={goSignup}>Start free <ArrowRight size={14} /></button></Reveal><Reveal className="al-price-card al-price-featured" delay={0.08}><span>PRO <em>BEST FOR FOUNDERS</em></span><h3>₹1,499 <small>/month</small></h3><p>For founders testing and operating several AI features.</p><ul><li><Check size={14} /> 25 comparisons each month</li><li><Check size={14} /> Up to 5 monitored projects</li><li><Check size={14} /> Full transparent scorecards</li></ul><button onClick={goSignup}>Choose Pro <ArrowRight size={14} /></button></Reveal><Reveal className="al-price-card" delay={0.16}><span>SCALE</span><h3>₹4,999 <small>/month</small></h3><p>For teams evaluating AI across multiple products.</p><ul><li><Check size={14} /> 200 comparisons each month</li><li><Check size={14} /> Up to 25 monitored projects</li><li><Check size={14} /> Priority setup support</li></ul><button onClick={goSignup}>Choose Scale <ArrowRight size={14} /></button></Reveal></div></section>

      <section className="al-final-cta"><motion.div className="al-cta-orbit" animate={{ rotate: 360 }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }} /><Reveal><Eyebrow>SEE IT BEFORE THEY DO</Eyebrow><h2>Your next AI incident<br />already has an answer.</h2><p>Start monitoring real production behavior in minutes.</p></Reveal><Reveal className="al-final-actions" delay={0.1}><MagneticButton onClick={goSignup}>Start monitoring free</MagneticButton><a href={githubUrl} target="_blank" rel="noreferrer">View source <ArrowRight size={14} /></a></Reveal></section>

      <footer className="al-footer"><div><a href="#top" className="al-brand"><BrandMark />AgentLens</a><p>AI observability and LLM monitoring for production applications.</p></div><div><span>PRODUCT</span><a href="#product">Incidents</a><Link href="/ai-observability">AI observability</Link><a href="#comparison">Providers</a><a href="#pricing">Pricing</a></div><div><span>DEVELOPERS</span><a href={githubUrl}>GitHub</a><a href={githubUrl}>Documentation</a><a href={githubUrl}>Self-hosting</a></div><small>© {new Date().getFullYear()} AgentLens</small></footer>
    </div>
  </main>;
}

export default PublicSite;
