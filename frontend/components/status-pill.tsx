import { cn } from "@/lib/utils";

type Status = "healthy" | "degraded" | "neutral" | "offline";

const labels: Record<Status, string> = { healthy: "Healthy", degraded: "Degraded", neutral: "Awaiting data", offline: "Disconnected" };
const colors: Record<Status, string> = {
  healthy: "bg-success text-success",
  degraded: "bg-warning text-warning",
  neutral: "bg-[#747382] text-[#a5a4b2]",
  offline: "bg-danger text-danger",
};

export function StatusPill({ status = "neutral", label, compact = false }: { status?: Status; label?: string; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-[#b6b5c2]">
      <span className="relative flex size-2"><span className={cn("absolute inline-flex size-2 animate-pulse-ring rounded-full opacity-40", colors[status])} /><span className={cn("relative inline-flex size-2 rounded-full", colors[status])} /></span>
      {!compact && (label || labels[status])}
    </span>
  );
}
