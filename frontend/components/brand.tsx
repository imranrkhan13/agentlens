import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-7 place-items-center rounded-lg border border-violet/30 bg-violet/10 text-violet shadow-[0_0_24px_rgba(141,114,255,.2)]"><Aperture className="size-4" strokeWidth={1.8} /></span>
      {!compact && <span className="text-[15px] font-semibold tracking-[-.02em] text-[#f0eff6]">AgentLens</span>}
    </div>
  );
}
