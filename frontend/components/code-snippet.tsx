"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CodeSnippet({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return <div className="relative overflow-hidden rounded-xl border border-white/[.08] bg-black/35"><pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs leading-6 text-[#c9c7da]"><code>{children}</code></pre><button onClick={copy} aria-label="Copy code" className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-[#898795] transition hover:bg-white/[.07] hover:text-white">{copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}</button></div>;
}
