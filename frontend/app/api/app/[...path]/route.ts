import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { assertAuthEnvironment, auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBaseUrl = (
  process.env.AGENTLENS_API_URL
  || (process.env.AGENTLENS_API_HOSTPORT ? `http://${process.env.AGENTLENS_API_HOSTPORT}` : undefined)
  || "http://localhost:8001"
).replace(/\/$/, "");

function backendPath(path: string[], search: URLSearchParams): string | null {
  const joined = path.join("/");
  const query = search.toString();
  const suffix = query ? `?${query}` : "";
  if (joined === "context" || joined === "projects") return `/v1/account/projects${suffix}`;
  if (/^projects\/[A-Za-z0-9-]{1,64}$/.test(joined)) return `/v1/account/${joined}${suffix}`;
  if (/^projects\/[A-Za-z0-9-]{1,64}\/(stats|events|providers)$/.test(joined)) return `/v1/account/${joined}${suffix}`;
  return null;
}

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    assertAuthEnvironment();
    const incomingHeaders = await headers();
    const session = await auth.api.getSession({ headers: incomingHeaders });
    if (!session) return NextResponse.json({ detail: "Sign in required" }, { status: 401 });

    const { path } = await context.params;
    const requestUrl = new URL(request.url);
    const targetPath = backendPath(path, requestUrl.searchParams);
    if (!targetPath) return NextResponse.json({ detail: "Unknown application API route" }, { status: 404 });

    const internalToken = process.env.AGENTLENS_INTERNAL_API_TOKEN;
    if (!internalToken) return NextResponse.json({ detail: "Application API is not configured" }, { status: 503 });

    const upstream = await fetch(`${backendBaseUrl}${targetPath}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "x-agentlens-account-id": session.user.id,
        "x-agentlens-internal-token": internalToken,
        "x-request-id": crypto.randomUUID(),
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstream.headers.get("content-type") || "application/json");
    const requestId = upstream.headers.get("x-request-id");
    if (requestId) responseHeaders.set("x-request-id", requestId);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error("[AgentLens] Authenticated application request failed", error);
    return NextResponse.json({ detail: "The application service is unavailable. Check server configuration and logs." }, { status: 503 });
  }
}

export { handle as GET, handle as POST };
