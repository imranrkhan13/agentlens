"use client";

import { motion } from "framer-motion";
import { Download, Radio, Search, FileSearch, Sparkles, CheckCircle2 } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionLabel } from "@/components/landing/ui/card";

const STEPS = [
  { icon: Download, title: "Install SDK", body: "One line. No rewrite." },
  { icon: Radio, title: "Telemetry", body: "Real calls, watched silently." },
  { icon: Search, title: "Detection", body: "Deviation from your own baseline." },
  { icon: FileSearch, title: "Root cause", body: "Why it happened, in plain English." },
  { icon: Sparkles, title: "Investigation prompt", body: "Ready to paste into Claude." },
  { icon: CheckCircle2, title: "Resolve", body: "Fixed before most users notice." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mb-20 text-center">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          From install to resolution, automatically.
        </h2>
      </Reveal>

      <div className="relative">
        <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left"
            >
              <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-elevated">
                <step.icon size={22} className="text-accent" />
              </div>
              <div className="mb-1 text-[11px] font-semibold text-subtle tabular-nums">0{i + 1}</div>
              <div className="mb-1.5 text-[14.5px] font-semibold text-ink">{step.title}</div>
              <div className="text-[12.5px] leading-relaxed text-muted">{step.body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
