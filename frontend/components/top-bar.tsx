"use client";

import { LogOut, Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "@/components/app-sidebar";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { isConnectionVerified } from "@/lib/session";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function TopBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { session } = useAgentLensSession();
  const verified = isConnectionVerified(session);

  return (
    <>
      <header className="workspace-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" className="size-9 px-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <p className="workspace-topbar-label">Current app</p>
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold text-[#252922]">{session?.projectName || "AgentLens"}</p>
              <span className={`workspace-status-dot ${verified ? "is-ready" : ""}`} aria-hidden="true" />
              <span className="hidden text-xs text-[#747a70] sm:inline">{verified ? "Ready" : session ? "Setup needed" : "Not connected"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/app/diagnostics">Help</Link></Button>
          <Button type="button" variant="ghost" size="sm" className="size-9 px-0" aria-label="Log out" onClick={async () => { await authClient.signOut(); router.replace("/login"); router.refresh(); }}>
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
          <Button asChild size="sm" variant="primary"><Link href="/app/settings"><Plus className="size-3.5" aria-hidden="true" /><span className="hidden sm:inline">Add app</span></Link></Button>
        </div>
      </header>

      {mobileOpen && (
        <div className="workspace-mobile-backdrop lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="workspace-mobile-sidebar" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="workspace-mobile-close"><X aria-hidden="true" /></button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
