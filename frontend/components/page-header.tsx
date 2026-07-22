"use client";

import { motion } from "framer-motion";
import { FounderHelp } from "@/components/founder-help";

export function PageHeader({ eyebrow, title, description, action, helpText }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode; helpText?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .36 }} className="flex flex-col gap-5 border-b border-white/[.075] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
        <h1 className="text-2xl font-semibold tracking-[-.035em] text-[#f5f4fa] sm:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8f8e9e]">{description}</p>
        <div className="mt-3"><FounderHelp message={helpText} /></div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
