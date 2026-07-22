"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// No credential is persisted in localStorage. Better Auth uses secure session
// cookies, and this client always targets the current origin.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
