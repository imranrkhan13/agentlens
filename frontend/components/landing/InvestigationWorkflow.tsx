"use client";

import { motion } from "framer-motion";
import { AlertCircle, Wand2, Bot, CheckCircle2, Rocket, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionLabel } from "@/components/landing/ui/card";

const STEPS = [
  { icon: AlertCircle, label: "Incident", color: "text-bad" },
  { icon: Wand2, label: "Prompt generated", color: "text-accent" },
  { icon: Bot, label: "Investigate in Claude", color: "text-accent-cyan" },
  { icon: CheckCircle2, label: "Solution found", color: "text-good" },
  { icon: Rocket, label: "Deployed", color: "text-good" },
];

export function InvestigationWorkflow() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>Investigation workflow</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          From alert to fix, without the 20 minutes of digging.
        </h2>
      </Reveal>

      <div className="glass-strong flex flex-col items-center gap-6 rounded-[28px] p-8 sm:flex-row sm:justify-between sm:gap-2">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.15, type: "spring" }}
            className="flex items-center gap-2"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-elevated">
                <step.icon size={18} className={step.color} />
              </div>
              <span className="max-w-[90px] text-[11.5px] leading-tight text-muted">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight size={16} className="hidden text-subtle sm:block" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
