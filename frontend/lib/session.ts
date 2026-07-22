import type { SessionConfig } from "@/lib/api/types";

/** An account-owned project is already server verified by the app BFF. */
export function isConnectionVerified(session: SessionConfig | null) {
  return Boolean(session);
}
