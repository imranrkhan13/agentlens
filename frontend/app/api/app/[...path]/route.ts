import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { assertAuthEnvironment, auth } from "@/lib/auth";
import { getBillingState } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBaseUrl = (
  process.env.AGENTLENS_API_URL
  || (process.env.AGENTLENS_API_HOSTPORT ? `http://${process.env.AGENTLENS_API_HOSTPORT}` : undefined)
  || "http://localhost:8001"
).replace(/\/$/, "");

const PROJECTS_PATH = "/v1/account/projects";

function accountHeaders(accountId: string, internalToken: string) {
  return {
    "Content-Type": "application/json",
    "x-agentlens-account-id": accountId,
    "x-agentlens-internal-token": internalToken,
    "x-request-id": crypto.randomUUID(),
  };
}

async function upstreamDetail(response: Response) {
  const payload = await response.clone().json().catch(() => null) as { detail?: unknown } | null;
  return typeof payload?.detail === "string" ? payload.detail : null;
}

function upstreamConfigurationError(status: number, detail: string | null) {
  if (status === 401) {
    return "The web app and AgentLens API do not share the same internal token. Set AGENTLENS_INTERNAL_API_TOKEN to the identical value in Vercel and Render, then redeploy both.";
  }
  if (status === 503) {
    return detail || "The AgentLens account API is not configured on Render.";
  }
  return detail;
}

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

    const internalToken = process.env.AGENTLENS_INTERNAL_API_TOKEN?.trim();
    if (!internalToken) {
      return NextResponse.json(
        { detail: "AGENTLENS_INTERNAL_API_TOKEN is missing in Vercel. Add the same value used by the Render API, then redeploy." },
        { status: 503 },
      );
    }

    if (request.method === "POST" && path.join("/") === "projects") {
      const projectResponse = await fetch(`${backendBaseUrl}${PROJECTS_PATH}`, {
        method: "GET",
        headers: accountHeaders(session.user.id, internalToken),
        cache: "no-store",
      });
      if (!projectResponse.ok) {
        const detail = upstreamConfigurationError(projectResponse.status, await upstreamDetail(projectResponse));
        return NextResponse.json(
          { detail: detail || `The AgentLens API could not verify this account (${projectResponse.status}).` },
          { status: projectResponse.status === 401 ? 503 : projectResponse.status },
        );
      }
      const projectPayload = await projectResponse.json().catch(() => null) as { projects?: unknown[] } | null;
      const projectCount = Array.isArray(projectPayload?.projects) ? projectPayload.projects.length : 0;
      const billing = await getBillingState(session.user.id, { projectCount });
      if (billing.projectCount >= billing.projectLimit) {
        return NextResponse.json(
          { detail: `Your ${billing.planName} plan includes ${billing.projectLimit} ${billing.projectLimit === 1 ? "project" : "projects"}. Upgrade before creating another.` },
          { status: 402 },
        );
      }
    }

    const upstream = await fetch(`${backendBaseUrl}${targetPath}`, {
      method: request.method,
      headers: accountHeaders(session.user.id, internalToken),
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
    });
    if (!upstream.ok) {
      const detail = upstreamConfigurationError(upstream.status, await upstreamDetail(upstream));
      if (detail && (upstream.status === 401 || upstream.status === 503)) {
        return NextResponse.json({ detail }, { status: upstream.status === 401 ? 503 : upstream.status });
      }
    }
    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstream.headers.get("content-type") || "application/json");
    const requestId = upstream.headers.get("x-request-id");
    if (requestId) responseHeaders.set("x-request-id", requestId);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error("[AgentLens] Authenticated application request failed", error);
    const message = error instanceof Error && error.name === "TypeError"
      ? `The AgentLens API at ${new URL(backendBaseUrl).host} could not be reached. Check AGENTLENS_API_URL in Vercel and confirm the Render service is running.`
      : "The application service is unavailable. Check the Vercel runtime log for this request.";
    return NextResponse.json({ detail: message }, { status: 503 });
  }
}

export { handle as GET, handle as POST };
