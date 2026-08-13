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

type RazorpayErrorBody = {
  error?: {
    code?: string;
    description?: string;
    field?: string | null;
    source?: string | null;
    step?: string | null;
    reason?: string | null;
  };
};

export class RazorpayApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly description: string,
    public readonly field: string | null,
    public readonly reason: string | null,
    public readonly requestId: string | null,
  ) {
    super("Razorpay API request failed");
    this.name = "RazorpayApiError";
  }
}

function serverEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) return "";
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1).trim();
  return value;
}

export function billingConfigurationIssues() {
  const keyId = serverEnvironmentValue("RAZORPAY_KEY_ID");
  const keySecret = serverEnvironmentValue("RAZORPAY_KEY_SECRET");
  const webhookSecret = serverEnvironmentValue("RAZORPAY_WEBHOOK_SECRET");
  const proPlan = serverEnvironmentValue("RAZORPAY_PLAN_PRO_ID");
  const scalePlan = serverEnvironmentValue("RAZORPAY_PLAN_SCALE_ID");
  const issues: string[] = [];
  if (!keyId) issues.push("RAZORPAY_KEY_ID is missing");
  else if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)) issues.push("RAZORPAY_KEY_ID is not a valid Razorpay key ID");
  if (!keySecret) issues.push("RAZORPAY_KEY_SECRET is missing");
  if (!webhookSecret) issues.push("RAZORPAY_WEBHOOK_SECRET is missing");
  if (!proPlan) issues.push("RAZORPAY_PLAN_PRO_ID is missing");
  else if (!/^plan_[A-Za-z0-9]+$/.test(proPlan)) issues.push("RAZORPAY_PLAN_PRO_ID is not a valid plan ID");
  if (!scalePlan) issues.push("RAZORPAY_PLAN_SCALE_ID is missing");
  else if (!/^plan_[A-Za-z0-9]+$/.test(scalePlan)) issues.push("RAZORPAY_PLAN_SCALE_ID is not a valid plan ID");
  return issues;
}

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
  return billingConfigurationIssues().length === 0;
}

export function planIdFor(code: PaidPlanCode) {
  return code === "pro" ? serverEnvironmentValue("RAZORPAY_PLAN_PRO_ID") : serverEnvironmentValue("RAZORPAY_PLAN_SCALE_ID");
}

export function razorpayKeyId() {
  return serverEnvironmentValue("RAZORPAY_KEY_ID");
}

export function describeRazorpayError(error: unknown) {
  if (!(error instanceof RazorpayApiError)) return "We could not start checkout. Please try again.";
  const detail = `${error.description} ${error.field || ""} ${error.reason || ""}`.toLowerCase();
  if (error.status === 401 || error.status === 403) return "Razorpay rejected the key ID or key secret. Make sure they are separate values from the same Live or Test key pair.";
  if (detail.includes("plan") || detail.includes("id provided does not exist")) return "Razorpay could not find this pricing plan. Create the plan in the same Live or Test mode as your key, then update the plan ID in Vercel.";
  if (detail.includes("subscription") && (detail.includes("enable") || detail.includes("activate") || detail.includes("not available"))) return "Razorpay Subscriptions is not enabled for this account. Enable Subscriptions and its payment methods in the Razorpay Dashboard.";
  if (error.status >= 500) return "Razorpay is temporarily unavailable. Please try again in a few minutes.";
  return "Razorpay rejected the subscription settings. Check that Subscriptions is enabled and both plan IDs belong to the current key mode.";
}

export function isPaidPlan(value: unknown): value is PaidPlanCode {
  return value === "pro" || value === "scale";
}

type BillingStateOptions = { projectCount?: number };

function isMissingRelation(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "42P01");
}

export async function getBillingState(accountId: string, options: BillingStateOptions = {}): Promise<BillingState> {
  let row: {
    plan_code: PlanCode;
    status: string;
    razorpay_subscription_id: string | null;
    current_period_end: Date | null;
    cancel_at_period_end: boolean;
  } | undefined;
  try {
    const result = await authDatabase.query<NonNullable<typeof row>>(
      `SELECT plan_code, status, razorpay_subscription_id, current_period_end, cancel_at_period_end
         FROM billing_subscriptions WHERE account_id = $1 LIMIT 1`,
      [accountId],
    );
    row = result.rows[0];
  } catch (error) {
    // Billing is optional for the free tier. A fresh auth database must never
    // prevent somebody from creating and connecting their first project.
    if (!isMissingRelation(error)) throw error;
  }
  const paid = row && ACTIVE_STATUSES.has(row.status) && (row.plan_code === "pro" || row.plan_code === "scale");
  const plan: PlanCode = paid && row ? row.plan_code : "free";
  let projectCount = options.projectCount;
  if (projectCount === undefined) {
    try {
      const projectResult = await authDatabase.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM projects WHERE owner_account_id = $1",
        [accountId],
      );
      projectCount = Number(projectResult.rows[0]?.count || 0);
    } catch (error) {
      // Vercel and the telemetry API may intentionally use separate databases.
      // Callers at the API boundary pass the authoritative backend count.
      if (!isMissingRelation(error)) throw error;
      projectCount = 0;
    }
  }
  return {
    plan,
    planName: BILLING_PLANS[plan].name,
    status: row?.status || "free",
    projectLimit: BILLING_PLANS[plan].projectLimit,
    projectCount,
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
  const secret = serverEnvironmentValue("RAZORPAY_KEY_SECRET");
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex");
  return secureEqualHex(expected, receivedSignature);
}

export function verifyWebhookSignature(rawBody: string, receivedSignature: string) {
  const secret = serverEnvironmentValue("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return secureEqualHex(expected, receivedSignature);
}

export function webhookEventId(rawBody: string, headerValue: string | null) {
  if (headerValue && /^[A-Za-z0-9_-]{6,200}$/.test(headerValue)) return headerValue;
  return `hash_${createHash("sha256").update(rawBody).digest("hex")}`;
}

export async function razorpayRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const keyId = serverEnvironmentValue("RAZORPAY_KEY_ID");
  const keySecret = serverEnvironmentValue("RAZORPAY_KEY_SECRET");
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
    const payload = await response.json().catch(() => null) as RazorpayErrorBody | null;
    const apiError = payload?.error;
    console.error("[AgentLens] Razorpay request failed", {
      path,
      status: response.status,
      requestId,
      code: apiError?.code || "UNKNOWN",
      field: apiError?.field || null,
      reason: apiError?.reason || null,
      description: apiError?.description || "No description returned",
    });
    throw new RazorpayApiError(
      response.status,
      apiError?.code || "UNKNOWN",
      apiError?.description || "Razorpay rejected the request",
      apiError?.field || null,
      apiError?.reason || null,
      requestId,
    );
  }
  return response.json() as Promise<T>;
}
