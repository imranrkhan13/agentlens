"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function CodeSnippet({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      showToast("Copied!");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("We could not copy that. Please try again.", "error");
    }
  }
  return <div className="relative overflow-hidden rounded-xl border border-white/[.08] bg-black/35"><pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs leading-6 text-[#c9c7da]"><code>{children}</code></pre><button type="button" onClick={copy} aria-label="Copy" className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-[#898795] transition hover:bg-white/[.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70">{copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}</button></div>;
}
