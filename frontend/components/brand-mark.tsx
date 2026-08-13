import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("agentlens-mark", className)} aria-hidden="true">
      <i className="agentlens-mark-ring" />
      <i className="agentlens-mark-orbit" />
      <i className="agentlens-mark-core" />
    </span>
  );
}
