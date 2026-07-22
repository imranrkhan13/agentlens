import { NextResponse } from "next/server";
import { assertAuthEnvironment, auth, authDatabase } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const genericResponse = { message: "If that recovery email matches an account, reset instructions are on their way." };

export async function POST(request: Request) {
  try {
    assertAuthEnvironment();
    const body = (await request.json()) as { recoveryEmail?: unknown };
    const recoveryEmail = typeof body.recoveryEmail === "string" ? body.recoveryEmail.trim().toLowerCase() : "";
    if (!recoveryEmail || recoveryEmail.length > 320) return NextResponse.json(genericResponse, { status: 202 });

    const result = await authDatabase.query<{ email: string }>(
      "SELECT email FROM auth_users WHERE lower(recovery_email) = $1 OR lower(email) = $1 LIMIT 1",
      [recoveryEmail],
    );

    if (result.rowCount) {
      const origin = new URL(request.url).origin;
      await auth.api.requestPasswordReset({
        body: {
          email: result.rows[0].email,
          redirectTo: `${origin}/reset-password`,
        },
      });
    }
  } catch (error) {
    // Preserve a generic response so this endpoint cannot be used to discover
    // accounts. The concrete delivery failure remains in server logs.
    console.error("[AgentLens] Password-recovery request failed", error);
  }
  return NextResponse.json(genericResponse, { status: 202 });
}
