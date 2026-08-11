import { NextResponse } from "next/server";
import { authDatabase } from "@/lib/auth";
import { verifyWebhookSignature, webhookEventId } from "@/lib/billing";

export const runtime = "nodejs";

type SubscriptionEntity = { id?: string; status?: string; current_end?: number | null };
type WebhookPayload = { event?: string; created_at?: number; payload?: { subscription?: { entity?: SubscriptionEntity } } };
const SUPPORTED_EVENTS = new Set(["subscription.authenticated", "subscription.activated", "subscription.charged", "subscription.completed", "subscription.pending", "subscription.halted", "subscription.paused", "subscription.cancelled"]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(rawBody, signature)) return NextResponse.json({ detail: "Invalid signature" }, { status: 401 });
  const payload = JSON.parse(rawBody) as WebhookPayload;
  if (!payload.created_at || Math.abs(Date.now() / 1000 - payload.created_at) > 300) return NextResponse.json({ detail: "Expired webhook" }, { status: 400 });
  const eventId = webhookEventId(rawBody, request.headers.get("x-razorpay-event-id"));
  const client = await authDatabase.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      "INSERT INTO billing_webhook_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id",
      [eventId, payload.event || "unknown"],
    );
    if (!inserted.rowCount) { await client.query("ROLLBACK"); return NextResponse.json({ ok: true, duplicate: true }); }
    const entity = payload.payload?.subscription?.entity;
    if (payload.event && SUPPORTED_EVENTS.has(payload.event) && entity?.id && entity.status) {
      await client.query(
        `UPDATE billing_subscriptions SET status = $1,
         current_period_end = CASE WHEN $2::bigint IS NULL THEN current_period_end ELSE to_timestamp($2::bigint) END,
         cancel_at_period_end = CASE WHEN $1 = 'cancelled' THEN true ELSE cancel_at_period_end END,
         updated_at = now() WHERE razorpay_subscription_id = $3`,
        [entity.status, entity.current_end || null, entity.id],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[AgentLens] Billing webhook processing failed", { eventId, event: payload.event, error });
    return NextResponse.json({ detail: "Webhook processing failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
