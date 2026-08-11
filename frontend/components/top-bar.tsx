"use client";

import { Bell, Command, LogOut, Menu, Plus, Search, ShieldCheck, X } from "lucide-react";
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
      <header className="workspace-topbar sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#d9d7cd] bg-[#fffef9]/85 px-4 backdrop-blur-xl sm:px-7 lg:pl-8">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" className="-ml-2 size-9 px-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="size-5" aria-hidden="true" /></Button><div className="hidden sm:block"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#92948b]">Current project</p><p className="mt-0.5 max-w-48 truncate text-sm font-medium text-[#252720]">{session?.projectName || "AgentLens"}</p></div></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" aria-label="Search activity" className="workspace-search hidden h-9 w-56 items-center gap-2 rounded-xl border border-[#dbd9cf] bg-[#f6f5ef] px-3 text-left text-xs text-[#85877f] transition hover:border-[#bdbcb3] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a4bd37] md:flex"><Search className="size-3.5" aria-hidden="true" /> Search activity <span className="ml-auto flex items-center gap-0.5 rounded border border-[#d5d3ca] bg-white px-1.5 py-0.5 text-[9px]"><Command className="size-3" aria-hidden="true" />K</span></button>
          <div className="hidden rounded-full border border-[#d9d7cd] bg-[#f6f5ef] px-2.5 py-1.5 md:block"><StatusPill status={verified ? "healthy" : session ? "degraded" : "neutral"} label={verified ? "Ready" : session ? "Fix connection" : "Get started"} /></div>
          <Button asChild variant="ghost" size="sm" className="size-9 px-0" aria-label="Security center"><Link href="/app/security"><ShieldCheck className="size-4" aria-hidden="true" /></Link></Button>
          <Button asChild variant="ghost" size="sm" className="size-9 px-0" aria-label="Notifications"><Link href="/app/events"><Bell className="size-4" aria-hidden="true" /></Link></Button>
          <Button type="button" variant="ghost" size="sm" className="size-9 px-0" aria-label="Log out" onClick={async () => { await authClient.signOut(); router.replace("/login"); router.refresh(); }}><LogOut className="size-4" aria-hidden="true" /></Button>
          <Button asChild size="sm" variant="primary" className="hidden sm:inline-flex"><Link href="/app/projects/new"><Plus className="size-3.5" aria-hidden="true" /> New project</Link></Button>
        </div>
      </header>
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#171914]/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 28, stiffness: 280 }} className="workspace-sidebar h-full w-[280px] border-r border-white/[.1] bg-[#171914] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 z-10 grid size-8 place-items-center rounded-lg text-[#a2a79b] hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9ff57]"><X className="size-4" aria-hidden="true" /></button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}
