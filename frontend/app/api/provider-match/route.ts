import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProviderMatch, listProviderMatches, sameOriginRequest } from "@/lib/provider-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function sessionAccountId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id || null;
}

export async function GET() {
  const accountId = await sessionAccountId();
  if (!accountId) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  const matches = await listProviderMatches(accountId);
  return NextResponse.json({ matches }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ detail: "Request origin was rejected" }, { status: 403 });
  const accountId = await sessionAccountId();
  if (!accountId) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 32_000) return NextResponse.json({ detail: "Comparison details are too large" }, { status: 413 });
    const created = await createProviderMatch(accountId, await request.json());
    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    if (status >= 500) console.error("[AgentLens] Provider Match creation failed", error);
    const detail = status >= 400 && status < 500 && error instanceof Error ? error.message : "AgentLens could not create this comparison right now. Please try again.";
    return NextResponse.json({ detail }, { status: status >= 400 && status < 500 ? status : 500 });
  }
}
