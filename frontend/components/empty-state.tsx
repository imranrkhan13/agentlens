import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({ icon: Icon, title, description, timeframe, action }: { icon: LucideIcon; title: string; description: string; timeframe?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[.12] bg-black/10 px-5 text-center">
      <span className="grid size-11 place-items-center rounded-2xl border border-violet/20 bg-violet/[.08] text-violet"><Icon className="size-5" aria-hidden="true" /></span>
      <h3 className="mt-4 text-sm font-medium text-[#ededf4]">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-[#898897]">{description}</p>
      {timeframe && <p className="mt-2 max-w-sm text-[11px] leading-5 text-[#6f6e7d]">{timeframe}</p>}
      {action && <Button asChild size="sm" variant="secondary" className="mt-5"><Link href={action.href}>{action.label}<ArrowRight className="size-3.5" aria-hidden="true" /></Link></Button>}
    </div>
  );
}
