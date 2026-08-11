import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBillingState } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  try {
    return NextResponse.json(await getBillingState(session.user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[AgentLens] Could not load billing state", error);
    return NextResponse.json({ detail: "Billing is temporarily unavailable" }, { status: 503 });
  }
}
