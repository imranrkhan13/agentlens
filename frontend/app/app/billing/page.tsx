import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Check, CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { BILLING_PLANS, getBillingState, type PaidPlanCode } from "@/lib/billing";
import { PageHeader } from "@/components/page-header";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";

const features: Record<"free" | PaidPlanCode, string[]> = {
  free: ["1 monitored project", "3 Provider Match runs each month", "Live health overview", "Secure local test runner"],
  pro: ["Up to 5 monitored projects", "25 Provider Match runs each month", "Full comparison scorecards", "Email support"],
  scale: ["Up to 25 monitored projects", "200 Provider Match runs each month", "Everything in Pro", "Priority setup support"],
};

export default async function BillingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const billing = await getBillingState(session.user.id);
  return <div className="space-y-8">
    <PageHeader eyebrow="Plan & billing" title="Choose the space you need." description="Start free. Upgrade only when you need to monitor more AI projects." />
    <section className="billing-current"><div><span>YOUR CURRENT PLAN</span><h2>{billing.planName}</h2><p>{billing.projectCount} of {billing.projectLimit} project spaces used.</p></div><div className="billing-usage"><span style={{ width: `${Math.min(100, billing.projectCount / billing.projectLimit * 100)}%` }} /></div>{billing.cancelAtPeriodEnd && <p className="billing-cancel-note">Your subscription will stop at the end of the current billing period.</p>}</section>
    <section className="billing-grid">
      {(Object.keys(BILLING_PLANS) as Array<keyof typeof BILLING_PLANS>).map((code) => {
        const plan = BILLING_PLANS[code];
        const active = billing.plan === code;
        return <article key={code} className={`billing-card ${code === "pro" ? "billing-card-featured" : ""} ${active ? "billing-card-active" : ""}`}>
          <div className="billing-card-top"><span>{plan.name.toUpperCase()}</span>{code === "pro" && <em>BEST FOR FOUNDERS</em>}</div>
          <div className="billing-price">{plan.priceInr ? <><b>₹{plan.priceInr.toLocaleString("en-IN")}</b><span>/ month</span></> : <b>₹0</b>}</div>
          <p>{plan.description}</p>
          <ul>{features[code].map((feature) => <li key={feature}><Check className="size-4" />{feature}</li>)}</ul>
          {active ? <button className="billing-current-button" disabled><Check className="size-4" /> Current plan</button> : code === "free" ? <span className="billing-free-note">Always available</span> : <CheckoutButton plan={code} label={`Choose ${plan.name}`} disabled={!billing.configured || billing.plan !== "free"} />}
        </article>;
      })}
    </section>
    {!billing.configured && <section className="billing-config-note"><LockKeyhole className="size-5" /><div><b>Secure checkout is not enabled yet.</b><p>Add the Razorpay server settings before accepting payments. No key secret is ever sent to the browser.</p></div></section>}
    <section className="billing-security"><div><ShieldCheck className="size-5" /><div><b>Payment details stay with Razorpay</b><p>AgentLens stores only subscription identifiers and status. Card numbers, UPI credentials and bank details never touch AgentLens.</p></div></div><div><CreditCard className="size-5" /><div><b>Every payment is verified</b><p>Access changes only after server-side signature and subscription verification.</p></div></div></section>
    {billing.plan !== "free" && !billing.cancelAtPeriodEnd && <CancelSubscriptionButton />}
  </div>;
}
