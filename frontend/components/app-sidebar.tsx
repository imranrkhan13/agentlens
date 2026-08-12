"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Home,
  PanelLeftClose,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";
import { useAgentLensSession } from "@/hooks/use-agentlens-session";
import { isConnectionVerified } from "@/lib/session";

export const navigation = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/match", label: "Find the best AI", icon: Sparkles },
  { href: "/app/projects", label: "My apps", icon: Boxes },
  { href: "/app/events", label: "Activity", icon: Activity },
] as const;

function isCurrentPath(pathname: string, href: string) {
  if (href === "/app") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, icon: Icon, onNavigate }: (typeof navigation)[number] & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isCurrentPath(pathname, href);

  return (
    <Link
      onClick={onNavigate}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("workspace-nav-link", active && "is-active")}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAgentLensSession();
  const verified = isConnectionVerified(session);
  const pathname = usePathname();
  const accountLinks = [
    { href: "/app/diagnostics", label: "Setup help", icon: CircleHelp },
    { href: "/app/billing", label: "Plan", icon: CreditCard },
    { href: "/app/security", label: "Security", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="workspace-sidebar-brand"><Brand /></div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="workspace-nav-label">Workspace</p>
        <nav className="mt-2 space-y-1" aria-label="Workspace">
          {navigation.map((item) => <NavLink key={item.href} {...item} onNavigate={onNavigate} />)}
        </nav>

        <p className="workspace-nav-label mt-7">Account</p>
        <nav className="mt-2 space-y-1" aria-label="Account">
          {accountLinks.map(({ href, label, icon: Icon }) => {
            const active = isCurrentPath(pathname, href);
            return (
              <Link
                key={href}
                onClick={onNavigate}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("workspace-nav-link", active && "is-active")}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="workspace-project-card">
        <div className="flex min-w-0 items-center gap-3">
          <span className="workspace-project-avatar">{session?.projectName?.slice(0, 1).toUpperCase() || "A"}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#252922]">{session?.projectName || "No app connected"}</p>
            <p className="truncate text-xs text-[#747a70]">{verified ? "Monitoring is ready" : session ? "Setup needs attention" : "Start with one app"}</p>
          </div>
        </div>
        <Link
          onClick={onNavigate}
          href={session && !verified ? "/app/diagnostics" : session ? `/app/projects/${session.projectId}` : "/app/settings"}
          className="workspace-project-link"
        >
          {session && !verified ? "Fix setup" : session ? "Open app" : "Connect an app"}
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return <aside className="workspace-sidebar"><SidebarContent /></aside>;
}

export function SidebarHint() {
  return <div className="hidden items-center gap-2 text-xs text-[#747a70] xl:flex"><PanelLeftClose className="size-3.5" aria-hidden="true" /> Workspace</div>;
}

export function HelpLink() {
  return <Link href="/app/diagnostics" className="workspace-help-link"><CircleHelp aria-hidden="true" /> Help</Link>;
}
