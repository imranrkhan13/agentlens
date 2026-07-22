"use client";

import { CircleHelp } from "lucide-react";

export function FounderHelp({ message = "This page shows only real activity from your app." }: { message?: string }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label="What does this mean?" className="inline-flex items-center gap-1.5 text-xs text-[#898896] transition hover:text-white">
        <CircleHelp className="size-3.5" /> What does this mean?
      </button>
      <span role="tooltip" className="pointer-events-none absolute right-0 top-6 z-30 w-52 rounded-lg border border-white/[.1] bg-[#171820] px-3 py-2 text-[11px] leading-4 text-[#d1d0dc] opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100">{message}</span>
    </span>
  );
}
