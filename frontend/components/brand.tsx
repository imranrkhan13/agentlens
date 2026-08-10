import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-7 place-items-center rounded-lg border border-[#e5c46f] bg-[#fff0c6] text-[#8e6a22]"><Aperture className="size-4" strokeWidth={1.8} /></span>
      {!compact && <span className="text-[15px] font-semibold tracking-[-.02em] text-[#302d22]">AgentLens</span>}
    </div>
  );
}
