import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Github, Gauge, LockKeyhole, Radar, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, siteConfig } from "@/lib/site";

const pageTitle = "AI Observability & LLM Monitoring Platform";
const pageDescription = "Monitor production LLM reliability, latency, errors and cost across OpenAI, Anthropic, Gemini, Groq and more. Compare providers and investigate incidents without collecting prompts.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/ai-observability" },
  openGraph: { type: "website", url: "/ai-observability", title: `${pageTitle} | AgentLens`, description: pageDescription, images: [{ url: "/og.png", width: 1200, height: 630, alt: "AgentLens AI observability platform" }] },
  twitter: { card: "summary_large_image", title: `${pageTitle} | AgentLens`, description: pageDescription, images: ["/og.png"] },
};

const metrics = [
  { icon: ShieldCheck, title: "Reliability", text: "Success rates, failed requests and provider degradation." },
  { icon: Clock3, title: "Latency", text: "Response times and slowdowns before they become complaints." },
  { icon: Gauge, title: "Cost", text: "Estimated model spend and unexpected usage changes." },
  { icon: ScanSearch, title: "Root cause", text: "A plain-language incident story with evidence attached." },
];

const faqs = [
  { question: "What is AI observability?", answer: "AI observability shows how an AI application behaves in production. It connects provider health, request success, latency, errors and cost so a team can understand what changed and what to do next." },
  { question: "How is LLM monitoring different from normal application monitoring?", answer: "Traditional monitoring can show whether an API returned a response. LLM monitoring also follows provider, model, latency, retries, estimated cost and AI-specific failure patterns across the calls that power a feature." },
  { question: "Which AI providers can AgentLens monitor?", answer: "AgentLens is designed for multi-provider AI applications, including OpenAI, Anthropic, Google Gemini, Groq, Mistral and Azure AI paths." },
  { question: "Does AgentLens store prompts or model responses?", answer: "AgentLens is designed around operational telemetry. Production prompts, model responses and provider API keys are not required for the monitoring workflow described here." },
  { question: "Can AgentLens help choose an LLM provider before launch?", answer: "Yes. The local provider comparison runs the same visible synthetic checks across selected providers and explains the best fit for quality, reliability, speed and cost priorities." },
];

export default function AiObservabilityPage() {
  const structuredData = [
    { "@context": "https://schema.org", "@type": "Service", name: "AgentLens AI Observability and LLM Monitoring", serviceType: "AI observability and LLM monitoring", provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, url: absoluteUrl("/ai-observability"), description: pageDescription, areaServed: "Worldwide", offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free plan available" } },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "AgentLens", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "AI Observability", item: absoluteUrl("/ai-observability") }] },
  ];

  return <main className="seo-page"><StructuredData data={structuredData} /><div className="seo-shell">
    <header className="seo-nav"><Link href="/" className="seo-brand" aria-label="AgentLens home"><BrandMark />AgentLens</Link><nav aria-label="Primary navigation"><Link href="/#product">Product</Link><Link href="/#comparison">Providers</Link><Link href="/#pricing">Pricing</Link></nav><div><a href={siteConfig.github} target="_blank" rel="noreferrer"><Github /> GitHub</a><Link className="seo-nav-cta" href="/signup">Start free <ArrowRight /></Link></div></header>

    <section className="seo-hero"><div className="seo-hero-copy"><span className="seo-eyebrow"><i /> AI OBSERVABILITY FOR PRODUCTION</span><h1>Know when your LLM is failing—and <em>what to do next.</em></h1><p>AgentLens is a privacy-first AI observability and LLM monitoring platform. Compare providers before launch, then track reliability, latency, errors and cost across production AI calls.</p><div className="seo-actions"><Link href="/signup">Start monitoring free <ArrowRight /></Link><Link href="/#workflow">See how it works</Link></div><ul className="seo-trust"><li><Check /> OpenAI, Anthropic, Gemini, Groq and more</li><li><Check /> No production prompt content required</li><li><Check /> Open-source and self-hostable</li></ul></div>
      <div className="seo-signal-card" aria-label="Illustrative AgentLens incident summary"><div className="seo-signal-top"><span><i /><i /><i /> production / live</span><b><i /> MONITORING</b></div><div className="seo-signal-heading"><div><small>INCIDENT 412</small><h2>Provider degradation</h2></div><span><Clock3 /> Last 60 min</span></div><div className="seo-signal-metrics"><div><span>Success rate</span><strong>61.2%</strong><small>↓ 37.2%</small></div><div><span>p95 latency</span><strong>2.8s</strong><small>3.1× slower</small></div></div><div className="seo-signal-chart"><span /><span /><span /><span /><span /><span /><span /><span /><i /></div><div className="seo-signal-answer"><Sparkles /><div><small>RECOMMENDED ACTION</small><b>Route new traffic to Anthropic</b><span>99.1% success · 410ms</span></div></div><div className="seo-signal-safe"><LockKeyhole /> Operational telemetry only. Prompts stay private.</div></div>
    </section>

    <section className="seo-provider-strip" aria-label="Supported AI providers"><span>OPENAI</span><span>ANTHROPIC</span><span>GEMINI</span><span>GROQ</span><span>MISTRAL</span><span>AZURE AI</span></section>

    <section className="seo-content-section"><div className="seo-section-heading"><span className="seo-eyebrow"><i /> WHAT AGENTLENS MONITORS</span><h2>One clear view of production AI health.</h2><p>See the operational signals that matter without turning your team into observability experts.</p></div><div className="seo-metric-grid">{metrics.map(({ icon: Icon, title, text }) => <article key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="seo-explainer"><div><span className="seo-eyebrow"><i /> BEFORE AND AFTER LAUNCH</span><h2>Choose with evidence. Keep monitoring the choice.</h2><p>AgentLens connects provider comparison and production monitoring in one workflow, so the recommendation you test before launch can be checked against real behavior after launch.</p><Link href="/signup">Compare AI providers <ArrowRight /></Link></div><ol><li><span>01</span><div><h3>Describe the AI job</h3><p>Explain the result you need in everyday language.</p></div></li><li><span>02</span><div><h3>Run fair local tests</h3><p>Selected providers receive the same visible synthetic checks.</p></div></li><li><span>03</span><div><h3>Connect the best fit</h3><p>Use one guided command without replacing your provider SDK.</p></div></li><li><span>04</span><div><h3>Monitor production health</h3><p>See incidents, evidence and the safest next action.</p></div></li></ol></section>

    <section className="seo-privacy"><div className="seo-privacy-icon"><ShieldCheck /></div><div><span className="seo-eyebrow"><i /> PRIVACY-FIRST BY DESIGN</span><h2>Observe performance without collecting conversations.</h2></div><div className="seo-privacy-list"><p><Check /> Provider and model</p><p><Check /> Success and response time</p><p><Check /> Error and cost signals</p><p><Check /> No provider API keys</p><p><Check /> No production prompts</p><p><Check /> No production responses</p></div></section>

    <section className="seo-faq"><div className="seo-section-heading"><span className="seo-eyebrow"><i /> FREQUENTLY ASKED QUESTIONS</span><h2>AI observability, explained simply.</h2></div><div className="seo-faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div></section>

    <section className="seo-cta"><span><Radar /></span><div><small>START WITH ONE AI FEATURE</small><h2>See the failure before your users do.</h2><p>Create a free project and connect AgentLens with one guided command.</p></div><Link href="/signup">Start monitoring free <ArrowRight /></Link></section>

    <footer className="seo-footer"><div><Link href="/" className="seo-brand"><BrandMark />AgentLens</Link><p>AI observability and LLM monitoring for production applications.</p></div><div><Link href="/">Home</Link><Link href="/#pricing">Pricing</Link><a href={siteConfig.github}>GitHub</a></div><small>© {new Date().getFullYear()} AgentLens</small></footer>
  </div></main>;
}
