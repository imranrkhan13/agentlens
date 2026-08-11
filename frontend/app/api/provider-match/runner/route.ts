import { NextResponse } from "next/server";
import { findMatchByRunnerToken, markMatchRunning, runnerSpecification, saveRunnerResults } from "@/lib/provider-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
}

function runnerHeaders() {
  return { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
}

export async function GET(request: Request) {
  const match = await findMatchByRunnerToken(bearerToken(request));
  if (!match) return NextResponse.json({ detail: "This runner code is invalid or expired. Generate a new one in AgentLens." }, { status: 401, headers: runnerHeaders() });
  await markMatchRunning(match.id);
  return NextResponse.json(runnerSpecification(match), { headers: runnerHeaders() });
}

export async function POST(request: Request) {
  const match = await findMatchByRunnerToken(bearerToken(request));
  if (!match) return NextResponse.json({ detail: "This runner code is invalid or expired. Generate a new one in AgentLens." }, { status: 401, headers: runnerHeaders() });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 200_000) return NextResponse.json({ detail: "Result summary is too large" }, { status: 413, headers: runnerHeaders() });
  try {
    const saved = await saveRunnerResults(match, await request.json());
    return NextResponse.json(saved, { headers: runnerHeaders() });
  } catch (error) {
    console.error("[AgentLens] Provider Match result could not be saved", { matchId: match.id, error });
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    const detail = status === 400 && error instanceof Error ? error.message : "AgentLens could not save the provider scorecard right now.";
    return NextResponse.json({ detail }, { status: status === 400 ? 400 : 500, headers: runnerHeaders() });
  }
}
