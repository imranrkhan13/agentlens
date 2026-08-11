import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, authDatabase } from "@/lib/auth";
import { getBillingState, isBillingConfigured, isPaidPlan, planIdFor, razorpayRequest } from "@/lib/billing";

export const runtime = "nodejs";

type RazorpaySubscription = { id: string; status: string };

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  if (!isBillingConfigured()) return NextResponse.json({ detail: "Payments are not configured yet" }, { status: 503 });

  const payload = await request.json().catch(() => null) as { plan?: unknown } | null;
  if (!payload || !isPaidPlan(payload.plan)) return NextResponse.json({ detail: "Choose a valid plan" }, { status: 400 });

  const current = await getBillingState(session.user.id);
  if (current.plan !== "free") return NextResponse.json({ detail: "Manage your current subscription before changing plans" }, { status: 409 });
  const planId = planIdFor(payload.plan);
  if (!planId) return NextResponse.json({ detail: "This plan is not available" }, { status: 503 });

  try {
    const existing = await authDatabase.query<{ plan_code: string; status: string; razorpay_subscription_id: string }>(
      "SELECT plan_code, status, razorpay_subscription_id FROM billing_subscriptions WHERE account_id = $1",
      [session.user.id],
    );
    const pending = existing.rows[0];
    if (pending && ["created", "pending"].includes(pending.status)) {
      if (pending.plan_code !== payload.plan) return NextResponse.json({ detail: "Finish or cancel the checkout already started for your account" }, { status: 409 });
      return NextResponse.json({ keyId: process.env.RAZORPAY_KEY_ID, subscriptionId: pending.razorpay_subscription_id, plan: payload.plan, customer: { name: session.user.name, email: session.user.email } });
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
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      plan: payload.plan,
      customer: { name: session.user.name, email: session.user.email },
    });
  } catch (error) {
    console.error("[AgentLens] Could not create subscription", error);
    return NextResponse.json({ detail: "We could not start checkout. Please try again." }, { status: 502 });
  }
}
