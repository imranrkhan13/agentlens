"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MatchLiveRefresh({ matchId, status }: { matchId: string; status: string }) {
  const router = useRouter();
  useEffect(() => {
    if (status === "complete") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/provider-match/${matchId}`, { cache: "no-store" });
      if (!response.ok) return;
      const match = await response.json();
      if (match.status !== status) router.refresh();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [matchId, router, status]);
  return null;
}
