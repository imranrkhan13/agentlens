import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Check, Database, EyeOff, Fingerprint, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";

const protections = [
  { icon: Fingerprint, title: "Your account is isolated", body: "Every project read is checked against your signed-in account. Another account cannot discover or open your project." },
  { icon: KeyRound, title: "Project keys are one-way protected", body: "A private key is shown once. AgentLens stores a keyed digest instead of the original value." },
  { icon: EyeOff, title: "Production prompts are not required", body: "Monitoring uses operational metadata—not customer conversations. Provider Match stores only the synthetic test plan you can review." },
  { icon: Database, title: "Every read stays inside one project", body: "Telemetry queries always include the authenticated project boundary before data is returned." },
];

export default async function SecurityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <div className="space-y-8">
    <PageHeader eyebrow="Security center" title="Protected by default." description="Plain-language answers about what AgentLens stores, what it never needs, and how your account stays private." />
    <section className="security-hero"><span><ShieldCheck className="size-6" /></span><div><p>ACCOUNT PROTECTION</p><h2>Your session is verified on the server.</h2><span>Signed in as {session.user.email}</span></div><em><i /> Protected</em></section>
    <section className="security-grid">{protections.map(({ icon: Icon, title, body }, index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><Icon className="size-5" /><h3>{title}</h3><p>{body}</p></article>)}</section>
    <section className="security-boundary"><div><LockKeyhole className="size-5" /><div><h2>What AgentLens can see</h2><ul><li><Check className="size-4" /> AI provider and model name</li><li><Check className="size-4" /> Response time, status and estimated cost</li><li><Check className="size-4" /> Synthetic test plan and local scores</li></ul></div></div><div><EyeOff className="size-5" /><div><h2>What AgentLens does not receive</h2><ul><li><Check className="size-4" /> Production prompts or model responses</li><li><Check className="size-4" /> Provider API keys</li><li><Check className="size-4" /> Customer passwords or payment details</li></ul></div></div></section>
  </div>;
}
