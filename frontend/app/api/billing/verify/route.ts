import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth, authDatabase } from "@/lib/auth";
import { getBillingState, razorpayRequest, verifySubscriptionSignature } from "@/lib/billing";

export const runtime = "nodejs";

type VerificationPayload = { razorpay_payment_id?: unknown; razorpay_subscription_id?: unknown; razorpay_signature?: unknown };
type RazorpaySubscription = { id: string; status: string; current_end?: number | null };

function validId(value: unknown, prefix: string): value is string {
  return typeof value === "string" && value.startsWith(prefix) && value.length <= 100;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  const payload = await request.json().catch(() => null) as VerificationPayload | null;
  if (!payload || !validId(payload.razorpay_payment_id, "pay_") || !validId(payload.razorpay_subscription_id, "sub_") || typeof payload.razorpay_signature !== "string") {
    return NextResponse.json({ detail: "Invalid payment confirmation" }, { status: 400 });
  }

  const owned = await authDatabase.query("SELECT 1 FROM billing_subscriptions WHERE account_id = $1 AND razorpay_subscription_id = $2", [session.user.id, payload.razorpay_subscription_id]);
  if (!owned.rowCount) return NextResponse.json({ detail: "Subscription not found" }, { status: 404 });
  if (!verifySubscriptionSignature(payload.razorpay_payment_id, payload.razorpay_subscription_id, payload.razorpay_signature)) {
    return NextResponse.json({ detail: "Payment verification failed" }, { status: 400 });
  }

  try {
    const subscription = await razorpayRequest<RazorpaySubscription>(`/subscriptions/${encodeURIComponent(payload.razorpay_subscription_id)}`);
    if (subscription.id !== payload.razorpay_subscription_id || !["authenticated", "active"].includes(subscription.status)) {
      return NextResponse.json({ detail: "Payment is still being confirmed" }, { status: 409 });
    }
    await authDatabase.query(
      `UPDATE billing_subscriptions SET status = $1, initial_payment_id = $2,
       current_period_end = CASE WHEN $3::bigint IS NULL THEN current_period_end ELSE to_timestamp($3::bigint) END,
       updated_at = now() WHERE account_id = $4 AND razorpay_subscription_id = $5`,
      [subscription.status, payload.razorpay_payment_id, subscription.current_end || null, session.user.id, subscription.id],
    );
    return NextResponse.json(await getBillingState(session.user.id));
  } catch (error) {
    console.error("[AgentLens] Payment verification lookup failed", error);
    return NextResponse.json({ detail: "Payment was received and is still being confirmed" }, { status: 202 });
  }
}
