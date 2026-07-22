import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, strong, ...props }: HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cn(strong ? "glass-strong" : "glass", "rounded-2xl", className)}
      {...props}
    />
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[12px] font-medium uppercase tracking-wider text-muted">
      {children}
    </div>
  );
}
