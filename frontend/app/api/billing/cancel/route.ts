import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, authDatabase } from "@/lib/auth";
import { razorpayRequest } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  const result = await authDatabase.query<{ razorpay_subscription_id: string }>(
    "SELECT razorpay_subscription_id FROM billing_subscriptions WHERE account_id = $1 AND status IN ('authenticated','active')",
    [session.user.id],
  );
  const subscriptionId = result.rows[0]?.razorpay_subscription_id;
  if (!subscriptionId) return NextResponse.json({ detail: "No active subscription" }, { status: 404 });
  try {
    await razorpayRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, { method: "POST", body: JSON.stringify({ cancel_at_cycle_end: 1 }) });
    await authDatabase.query("UPDATE billing_subscriptions SET cancel_at_period_end = true, updated_at = now() WHERE account_id = $1", [session.user.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AgentLens] Subscription cancellation failed", error);
    return NextResponse.json({ detail: "We could not schedule cancellation. Please try again." }, { status: 502 });
  }
}
