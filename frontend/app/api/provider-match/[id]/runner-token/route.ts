import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createRunnerToken, sameOriginRequest } from "@/lib/provider-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOriginRequest(request)) return NextResponse.json({ detail: "Request origin was rejected" }, { status: 403 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const token = await createRunnerToken(session.user.id, id);
  if (!token) return NextResponse.json({ detail: "Comparison not found" }, { status: 404 });
  return NextResponse.json(token, { headers: { "Cache-Control": "no-store" } });
}
