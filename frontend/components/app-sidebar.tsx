"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Cable, ChevronRight, CircleHelp, LayoutDashboard, PanelLeftClose, Settings2, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { isConnectionVerified } from "@/lib/session";

export const navigation = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/projects", label: "Projects", icon: Boxes },
  { href: "/app/providers", label: "AI Services", icon: Cable },
  { href: "/app/events", label: "Activity", icon: BarChart3 },
] as const;

function NavLink({ href, label, icon: Icon, onNavigate }: (typeof navigation)[number] & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === "/app/projects" && pathname.startsWith("/app/projects/"));
  return (
    <Link onClick={onNavigate} href={href} className={cn("group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition", isActive ? "bg-white/[.075] text-white" : "text-[#9796a6] hover:bg-white/[.04] hover:text-[#e9e8f0]")}> 
      {isActive && <motion.span layoutId="side-active" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet to-cyan" />}
      <Icon className={cn("size-4", isActive ? "text-violet" : "text-[#777686] group-hover:text-[#aaa9b6]")} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const pathname = usePathname();
  const isSettings = pathname === "/app/settings";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center border-b border-white/[.07] px-5"><Brand /></div>
      <div className="flex-1 px-3 py-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[#5e5d6c]">Your AI app</p>
        <nav className="mt-3 space-y-1">{navigation.map((item) => <NavLink key={item.href} {...item} onNavigate={onNavigate} />)}</nav>
        <div className="mt-7 px-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#5e5d6c]">Account</p></div>
        <Link onClick={onNavigate} href="/app/settings" className={cn("mt-3 flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition", isSettings ? "bg-white/[.075] text-white" : "text-[#9796a6] hover:bg-white/[.04] hover:text-[#e9e8f0]")}>
          <Settings2 className={cn("size-4", isSettings ? "text-violet" : "text-[#777686]")} strokeWidth={1.8} aria-hidden="true" /> Setup & settings
        </Link>
        <Link onClick={onNavigate} href="/app/diagnostics" className={cn("mt-1 flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition", pathname === "/app/diagnostics" ? "bg-white/[.075] text-white" : "text-[#9796a6] hover:bg-white/[.04] hover:text-[#e9e8f0]")}>
          <Stethoscope className={cn("size-4", pathname === "/app/diagnostics" ? "text-violet" : "text-[#777686]")} strokeWidth={1.8} aria-hidden="true" /> Connection help
        </Link>
      </div>
      <div className="mx-3 mb-3 rounded-2xl border border-white/[.08] bg-black/20 p-3">
        <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet/70 to-cyan/70 text-xs font-semibold text-white">{session?.projectName?.slice(0, 1).toUpperCase() || "A"}</span><div className="min-w-0"><p className="truncate text-xs font-medium text-[#e9e8f0]">{session?.projectName || "Choose a project"}</p><p className="truncate text-[10px] text-[#737280]">{verified ? "Ready to watch" : session ? "Needs a quick check" : "Start in a few minutes"}</p></div></div>
        <Link onClick={onNavigate} href={session && !verified ? "/app/diagnostics" : "/app/settings"} className="mt-3 flex items-center justify-between text-[11px] text-[#9796a7] transition hover:text-white">{session && !verified ? "Fix connection" : "Manage projects"} <ChevronRight className="size-3" aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] border-r border-white/[.075] bg-[#0b0c10]/90 backdrop-blur-xl lg:block"><SidebarContent /></aside>;
}

export function SidebarHint() {
  return <div className="hidden items-center gap-2 px-3 text-[11px] text-[#777685] xl:flex"><PanelLeftClose className="size-3.5" aria-hidden="true" /> <span>Focused workspace</span></div>;
}

export function HelpLink() {
  return <Link href="/app/settings" className="hidden items-center gap-2 text-xs text-[#8c8b9a] transition hover:text-white sm:flex"><CircleHelp className="size-4" aria-hidden="true" /> Help</Link>;
}
