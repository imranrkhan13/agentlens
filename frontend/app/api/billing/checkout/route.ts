import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, authDatabase } from "@/lib/auth";
import { BILLING_PLANS, billingConfigurationIssues, describeRazorpayError, getBillingState, isBillingConfigured, isPaidPlan, planIdFor, RazorpayApiError, razorpayKeyId, razorpayRequest } from "@/lib/billing";

export const runtime = "nodejs";

type RazorpaySubscription = { id: string; status: string; plan_id?: string };
type RazorpayPlan = { id: string; interval: number; period: string; item?: { amount?: number; currency?: string } };

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  if (!isBillingConfigured()) {
    console.error("[AgentLens] Billing configuration is incomplete", { issues: billingConfigurationIssues() });
    return NextResponse.json({ detail: "Payments need a valid Razorpay key pair and both Live or Test plan IDs in Vercel." }, { status: 503 });
  }

  const payload = await request.json().catch(() => null) as { plan?: unknown } | null;
  if (!payload || !isPaidPlan(payload.plan)) return NextResponse.json({ detail: "Choose a valid plan" }, { status: 400 });

  const current = await getBillingState(session.user.id);
  if (current.plan !== "free") return NextResponse.json({ detail: "Manage your current subscription before changing plans" }, { status: 409 });
  const planId = planIdFor(payload.plan);
  if (!planId) return NextResponse.json({ detail: "This plan is not available" }, { status: 503 });

  try {
    const razorpayPlan = await razorpayRequest<RazorpayPlan>(`/plans/${encodeURIComponent(planId)}`);
    const expectedAmount = BILLING_PLANS[payload.plan].priceInr * 100;
    if (razorpayPlan.id !== planId || razorpayPlan.period !== "monthly" || razorpayPlan.interval !== 1 || razorpayPlan.item?.currency !== "INR" || razorpayPlan.item?.amount !== expectedAmount) {
      console.error("[AgentLens] Razorpay plan does not match AgentLens pricing", {
        plan: payload.plan,
        planId,
        period: razorpayPlan.period,
        interval: razorpayPlan.interval,
        currency: razorpayPlan.item?.currency,
        amount: razorpayPlan.item?.amount,
        expectedAmount,
      });
      return NextResponse.json({ detail: `The ${BILLING_PLANS[payload.plan].name} Razorpay plan must be monthly, in INR, and charge ₹${BILLING_PLANS[payload.plan].priceInr.toLocaleString("en-IN")}.` }, { status: 503 });
    }

    const existing = await authDatabase.query<{ plan_code: string; status: string; razorpay_subscription_id: string }>(
      "SELECT plan_code, status, razorpay_subscription_id FROM billing_subscriptions WHERE account_id = $1",
      [session.user.id],
    );
    const pending = existing.rows[0];
    if (pending && ["created", "pending"].includes(pending.status)) {
      if (pending.plan_code !== payload.plan) return NextResponse.json({ detail: "Finish or cancel the checkout already started for your account" }, { status: 409 });
      try {
        const remotePending = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(pending.razorpay_subscription_id)}`);
        if (remotePending.plan_id === planId && ["created", "pending"].includes(remotePending.status)) {
          return NextResponse.json({ keyId: razorpayKeyId(), subscriptionId: pending.razorpay_subscription_id, plan: payload.plan, customer: { name: session.user.name, email: session.user.email } });
        }
        if (remotePending.plan_id === planId && ["authenticated", "active"].includes(remotePending.status)) {
          await authDatabase.query("UPDATE billing_subscriptions SET status = $1, updated_at = now() WHERE account_id = $2", [remotePending.status, session.user.id]);
          return NextResponse.json({ detail: "Your previous payment is already active. Refresh the page to see your plan." }, { status: 409 });
        }
      } catch (pendingError) {
        if (!(pendingError instanceof RazorpayApiError) || ![400, 404].includes(pendingError.status)) throw pendingError;
        console.info("[AgentLens] Replacing a stale pending Razorpay subscription", { subscriptionId: pending.razorpay_subscription_id });
      }
    }
    const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120,
        quantity: 1,
        customer_notify: 1,
        notes: { account_id: session.user.id, plan_code: payload.plan },
      }),
    });
    const client = await authDatabase.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO accounts (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", [session.user.id]);
      await client.query(
        `INSERT INTO billing_subscriptions (account_id, plan_code, status, razorpay_subscription_id, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (account_id) DO UPDATE SET plan_code = EXCLUDED.plan_code, status = EXCLUDED.status,
         razorpay_subscription_id = EXCLUDED.razorpay_subscription_id, initial_payment_id = NULL,
         current_period_end = NULL, cancel_at_period_end = false, updated_at = now()`,
        [session.user.id, payload.plan, subscription.status, subscription.id],
      );
      await client.query("COMMIT");
    } catch (databaseError) {
      await client.query("ROLLBACK");
      throw databaseError;
    } finally {
      client.release();
    }
    return NextResponse.json({
      keyId: razorpayKeyId(),
      subscriptionId: subscription.id,
      plan: payload.plan,
      customer: { name: session.user.name, email: session.user.email },
    });
  } catch (error) {
    console.error("[AgentLens] Could not create subscription", error);
    const databaseCode = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (databaseCode === "42P01") return NextResponse.json({ detail: "Billing database setup is missing. Run the latest AgentLens database migration." }, { status: 503 });
    return NextResponse.json({ detail: describeRazorpayError(error) }, { status: error instanceof RazorpayApiError && error.status < 500 ? 400 : 502 });
  }
}
