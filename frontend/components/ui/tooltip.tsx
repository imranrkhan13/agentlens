"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocusCapture={() => setVisible(true)} onBlurCapture={() => setVisible(false)}>{children}{visible && <span id={id} role="tooltip" className="absolute left-0 top-[calc(100%+8px)] z-50 w-52 rounded-lg border border-white/[.12] bg-[#19191f] px-3 py-2 text-[11px] leading-4 text-[#dfdde8] shadow-2xl">{label}</span>}</span>;
}

export function InfoTooltip({ label }: { label: string }) {
  return <Tooltip label={label}><button type="button" aria-label={`More information: ${label}`} className="inline-flex rounded-md p-0.5 text-[#777685] transition hover:text-[#d7d5e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70"><Info className="size-3.5" aria-hidden="true" /></button></Tooltip>;
}
