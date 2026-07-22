import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/tooltip";

export function MetricCard({ label, value, subtext, helpText, hoverDetail, icon: Icon, valueIcon: ValueIcon, loading = false, index = 0 }: { label: string; value: string; subtext: string; helpText: string; hoverDetail?: string; icon: LucideIcon; valueIcon?: LucideIcon; loading?: boolean; index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .055, duration: .32 }} className="group surface-glow relative rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9392a1]">{label}<InfoTooltip label={helpText} /></span><span className="grid size-8 place-items-center rounded-xl border border-white/[.07] bg-white/[.035] text-[#aaa8ba]"><Icon className="size-4" aria-hidden="true" /></span></div>
      {loading ? <><Skeleton className="mt-5 h-7 w-24" /><Skeleton className="mt-3 h-3 w-32" /></> : <><p className="mt-5 flex items-center gap-2 text-2xl font-semibold tracking-[-.04em] text-[#f4f3fa]" title={hoverDetail}>{ValueIcon && <ValueIcon className="size-5 text-violet" aria-hidden="true" />}{value}</p>{hoverDetail && <span className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-white/[.1] bg-[#181920] px-2 py-1 text-[10px] text-[#e4e3ec] opacity-0 shadow-lg transition group-hover:opacity-100">{hoverDetail}</span>}<p className="mt-2 text-xs text-[#777685]">{subtext}</p></>}
    </motion.div>
  );
}
