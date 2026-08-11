import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { authDatabase } from "@/lib/auth";

export type PaidPlanCode = "pro" | "scale";
export type PlanCode = "free" | PaidPlanCode;

export const BILLING_PLANS = {
  free: { code: "free", name: "Free", priceInr: 0, projectLimit: 1, description: "For your first production AI project." },
  pro: { code: "pro", name: "Pro", priceInr: 1499, projectLimit: 5, description: "For founders running several AI features." },
  scale: { code: "scale", name: "Scale", priceInr: 4999, projectLimit: 25, description: "For teams operating AI across products." },
} as const;

const ACTIVE_STATUSES = new Set(["authenticated", "active"]);
const RAZORPAY_API = "https://api.razorpay.com/v1";

export type BillingState = {
  plan: PlanCode;
  planName: string;
  status: string;
  projectLimit: number;
  projectCount: number;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  configured: boolean;
};

export function isBillingConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_PLAN_PRO_ID && process.env.RAZORPAY_PLAN_SCALE_ID);
}

export function planIdFor(code: PaidPlanCode) {
  return code === "pro" ? process.env.RAZORPAY_PLAN_PRO_ID : process.env.RAZORPAY_PLAN_SCALE_ID;
}

export function isPaidPlan(value: unknown): value is PaidPlanCode {
  return value === "pro" || value === "scale";
}

export async function getBillingState(accountId: string): Promise<BillingState> {
  const result = await authDatabase.query<{
    plan_code: PlanCode;
    status: string;
    razorpay_subscription_id: string | null;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  }>(
    `SELECT plan_code, status, razorpay_subscription_id, current_period_end, cancel_at_period_end
       FROM billing_subscriptions WHERE account_id = $1 LIMIT 1`,
    [accountId],
  );
  const row = result.rows[0];
  const paid = row && ACTIVE_STATUSES.has(row.status) && (row.plan_code === "pro" || row.plan_code === "scale");
  const plan: PlanCode = paid ? row.plan_code : "free";
  const projectResult = await authDatabase.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM projects WHERE owner_account_id = $1",
    [accountId],
  );
  return {
    plan,
    planName: BILLING_PLANS[plan].name,
    status: row?.status || "free",
    projectLimit: BILLING_PLANS[plan].projectLimit,
    projectCount: Number(projectResult.rows[0]?.count || 0),
    subscriptionId: row?.razorpay_subscription_id || null,
    currentPeriodEnd: row?.current_period_end?.toISOString() || null,
    cancelAtPeriodEnd: row?.cancel_at_period_end || false,
    configured: isBillingConfigured(),
  };
}

export function secureEqualHex(expected: string, received: string) {
  if (!/^[a-f0-9]{64}$/i.test(expected) || !/^[a-f0-9]{64}$/i.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

export function verifySubscriptionSignature(paymentId: string, subscriptionId: string, receivedSignature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex");
  return secureEqualHex(expected, receivedSignature);
}

export function verifyWebhookSignature(rawBody: string, receivedSignature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return secureEqualHex(expected, receivedSignature);
}

export function webhookEventId(rawBody: string, headerValue: string | null) {
  if (headerValue && /^[A-Za-z0-9_-]{6,200}$/.test(headerValue)) return headerValue;
  return `hash_${createHash("sha256").update(rawBody).digest("hex")}`;
}

export async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const requestId = response.headers.get("x-razorpay-request-id");
    console.error("[AgentLens] Razorpay request failed", { path, status: response.status, requestId });
    throw new Error("Payment service request failed");
  }
  return response.json() as Promise<T>;
}
