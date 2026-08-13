import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="size-7" />
      {!compact && <span className="text-[15px] font-semibold tracking-[-.02em] text-[#302d22]">AgentLens</span>}
    </div>
  );
}
