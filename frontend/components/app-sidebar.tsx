"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Cable, ChevronRight, CircleHelp, CreditCard, LayoutDashboard, PanelLeftClose, Settings2, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { isConnectionVerified } from "@/lib/session";

export const navigation = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/match", label: "Find my AI provider", icon: Sparkles },
  { href: "/app/projects", label: "Projects", icon: Boxes },
  { href: "/app/providers", label: "AI Services", icon: Cable },
  { href: "/app/events", label: "Activity", icon: BarChart3 },
] as const;

function NavLink({ href, label, icon: Icon, onNavigate }: (typeof navigation)[number] & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === "/app/projects" && pathname.startsWith("/app/projects/")) || (href === "/app/match" && pathname.startsWith("/app/match/"));
  return (
    <Link onClick={onNavigate} href={href} className={cn("workspace-nav-link group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition", isActive ? "is-active bg-white/[.08] text-white" : "text-[#a4a89d] hover:bg-white/[.045] hover:text-white")}>
      {isActive && <motion.span layoutId="side-active" className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-[#d9ff57]" />}
      <Icon className={cn("size-4", isActive ? "text-[#d9ff57]" : "text-[#74796d] group-hover:text-[#c7cbbf]")} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const pathname = usePathname();
  const isSettings = pathname === "/app/settings";
  const accountLinks = [
    { href: "/app/settings", label: "Setup & settings", icon: Settings2 },
    { href: "/app/billing", label: "Plan & billing", icon: CreditCard },
    { href: "/app/security", label: "Security center", icon: ShieldCheck },
    { href: "/app/diagnostics", label: "Connection help", icon: Stethoscope },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="workspace-sidebar-brand flex h-[76px] items-center border-b border-white/[.07] px-5"><Brand /></div>
      <div className="flex-1 px-3 py-5">
        <p className="px-3 text-[9px] font-semibold uppercase tracking-[.18em] text-[#656a5f]">Your AI app</p>
        <nav className="mt-3 space-y-1">{navigation.map((item) => <NavLink key={item.href} {...item} onNavigate={onNavigate} />)}</nav>
        <div className="mt-7 px-3"><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-[#656a5f]">Account</p></div>
        <nav className="mt-3 space-y-1">{accountLinks.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href === "/app/settings" && isSettings); return <Link key={href} onClick={onNavigate} href={href} className={cn("workspace-nav-link flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition", active ? "is-active bg-white/[.08] text-white" : "text-[#a4a89d] hover:bg-white/[.045] hover:text-white")}><Icon className={cn("size-4", active ? "text-[#d9ff57]" : "text-[#74796d]")} strokeWidth={1.8} aria-hidden="true" />{label}</Link>; })}</nav>
      </div>
      <div className="workspace-project-card mx-3 mb-3 rounded-2xl border border-white/[.09] bg-white/[.045] p-3">
        <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg bg-[#d9ff57] text-xs font-semibold text-[#1b1d18]">{session?.projectName?.slice(0, 1).toUpperCase() || "A"}</span><div className="min-w-0"><p className="truncate text-xs font-medium text-[#eff1e9]">{session?.projectName || "Choose a project"}</p><p className="truncate text-[10px] text-[#777c70]">{verified ? "Ready to watch" : session ? "Needs a quick check" : "Start in a few minutes"}</p></div></div>
        <Link onClick={onNavigate} href={session && !verified ? "/app/diagnostics" : "/app/settings"} className="mt-3 flex items-center justify-between text-[11px] text-[#a1a69a] transition hover:text-[#d9ff57]">{session && !verified ? "Fix connection" : "Manage projects"} <ChevronRight className="size-3" aria-hidden="true" /></Link>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return <aside className="workspace-sidebar fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-white/[.075] bg-[#171914]/95 backdrop-blur-xl lg:block"><SidebarContent /></aside>;
}

export function SidebarHint() {
  return <div className="hidden items-center gap-2 px-3 text-[11px] text-[#777685] xl:flex"><PanelLeftClose className="size-3.5" aria-hidden="true" /> <span>Focused workspace</span></div>;
}

export function HelpLink() {
  return <Link href="/app/settings" className="hidden items-center gap-2 text-xs text-[#8c8b9a] transition hover:text-white sm:flex"><CircleHelp className="size-4" aria-hidden="true" /> Help</Link>;
}
