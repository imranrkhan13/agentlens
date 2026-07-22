"use client";

import { Bell, Command, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SidebarContent } from "@/components/app-sidebar";
import { StatusPill } from "@/components/status-pill";
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
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[.075] bg-[#0a0b0f]/75 px-4 backdrop-blur-xl sm:px-7 lg:pl-8">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" className="-ml-2 size-9 px-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></Button><div className="hidden sm:block"><p className="text-[11px] text-[#777685]">Your project</p><p className="max-w-48 truncate text-sm font-medium text-[#ecebf3]">{session?.projectName || "AgentLens"}</p></div></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden h-9 w-56 items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.025] px-3 text-left text-xs text-[#777685] transition hover:border-white/[.13] md:flex"><Search className="size-3.5" /> Search activity <span className="ml-auto flex items-center gap-0.5 text-[10px]"><Command className="size-3" />K</span></button>
          <div className="hidden rounded-full border border-white/[.08] bg-white/[.025] px-2.5 py-1.5 md:block"><StatusPill status={verified ? "healthy" : session ? "degraded" : "neutral"} label={verified ? "Ready" : session ? "Fix connection" : "Get started"} /></div>
          <Button asChild variant="ghost" size="sm" className="size-9 px-0" aria-label="Notifications"><Link href="/app/events"><Bell className="size-4" /></Link></Button>
          <Button type="button" variant="ghost" size="sm" className="size-9 px-0" aria-label="Log out" onClick={async () => { await authClient.signOut(); router.replace("/login"); router.refresh(); }}><LogOut className="size-4" /></Button>
          <Button asChild size="sm" variant="primary" className="hidden sm:inline-flex"><Link href="/app/projects/new"><Plus className="size-3.5" /> New project</Link></Button>
        </div>
      </header>
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="h-full w-[280px] border-r border-white/[.1] bg-[#0c0d12] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 z-10 grid size-8 place-items-center rounded-lg text-[#a2a1af] hover:bg-white/[.06]"><X className="size-4" /></button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}
