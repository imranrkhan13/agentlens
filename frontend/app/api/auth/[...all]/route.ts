import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { assertAuthEnvironment, auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

function configurationError() {
  try {
    assertAuthEnvironment();
    return null;
  } catch (error) {
    console.error("[AgentLens] Account authentication is not configured", error);
    return NextResponse.json(
      {
        code: "AUTH_CONFIGURATION_ERROR",
        message: "Account authentication is not configured. Start the local AgentLens stack, then restart the frontend development server.",
      },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const error = configurationError();
  if (error) return error;
  return handlers.GET(request);
}

export async function POST(request: Request) {
  const error = configurationError();
  if (error) return error;
  return handlers.POST(request);
}
