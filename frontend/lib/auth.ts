import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { ensureServerEnvironment } from "@/lib/server-env";

/**
 * Credentials and sessions are intentionally owned by Better Auth. AgentLens
 * never implements password hashing or verification itself.
 */
ensureServerEnvironment();

export const authDatabase = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function sendPasswordReset({
  user,
  url,
}: {
  user: { email: string; name: string };
  url: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (apiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: "Reset your AgentLens password",
        html: `<p>Hello ${user.name || "there"},</p><p><a href="${url}">Reset your AgentLens password</a>. This link expires in one hour.</p>`,
      }),
    });
    if (!response.ok) throw new Error("Password-reset email delivery failed.");
    return;
  }

  // Local development remains usable without pretending an email was sent.
  // A production deployment must configure a real email sender.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[AgentLens] Development password reset link for ${user.email}: ${url}`);
    return;
  }
  throw new Error("Password-reset email delivery is not configured.");
}

export const auth = betterAuth({
  appName: "AgentLens",
  baseURL: process.env.BETTER_AUTH_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000",
  // This placeholder prevents Next's build-time route analysis from invoking
  // Better Auth's unsafe default secret. assertAuthEnvironment() rejects it at
  // runtime in production before an auth request is served.
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "agentlens-build-time-placeholder-not-for-runtime",
  database: authDatabase,
  user: {
    modelName: "auth_users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      recoveryEmail: {
        type: "string",
        required: true,
        fieldName: "recovery_email",
        input: true,
      },
    },
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    modelName: "auth_identities",
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "auth_verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: sendPasswordReset,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 12,
  },
});

export function assertAuthEnvironment() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be configured for account authentication.");
  }
  if (process.env.NODE_ENV === "production" && !(process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET)) {
    throw new Error("BETTER_AUTH_SECRET must be configured in production.");
  }
}
