import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProviderMatch } from "@/lib/provider-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const match = await getProviderMatch(session.user.id, id);
  if (!match) return NextResponse.json({ detail: "Comparison not found" }, { status: 404 });
  return NextResponse.json(match, { headers: { "Cache-Control": "no-store" } });
}
