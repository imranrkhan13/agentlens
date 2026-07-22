"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocusCapture={() => setVisible(true)} onBlurCapture={() => setVisible(false)}>{children}{visible && <span id={id} role="tooltip" className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 w-max max-w-52 -translate-x-1/2 rounded-md border border-white/10 bg-[#17181d] px-2.5 py-1.5 text-[10px] leading-4 text-[#cac9d3] shadow-soft">{label}</span>}</span>;
}

export function InfoTooltip({ label }: { label: string }) {
  return <Tooltip label={label}><button type="button" aria-label={`More information: ${label}`} className="inline-flex rounded-md p-0.5 text-[#777685] transition hover:text-[#d7d5e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70"><Info className="size-3.5" aria-hidden="true" /></button></Tooltip>;
}
