"use client";

import { motion } from "framer-motion";
import { FounderHelp } from "@/components/founder-help";

export function PageHeader({ eyebrow, title, description, action, helpText }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode; helpText?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }} className="workspace-page-header flex flex-col gap-5 border-b border-[#d9d7cd] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
        <h1 className="text-3xl font-semibold tracking-[-.055em] text-[#1c1e19] sm:text-[38px]">{title}</h1>
        <div className="mt-2 flex max-w-2xl items-start gap-2">
          <p className="text-sm leading-6 text-[#74766e]">{description}</p>
          <span className="mt-1 shrink-0"><FounderHelp message={helpText} /></span>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
