"use client";

import { motion } from "framer-motion";
import { X, Check, LayoutGrid, Terminal, Cloud, BarChart3, Bot } from "lucide-react";
import { Reveal } from "./Reveal";
import { Card, SectionLabel } from "@/components/landing/ui/card";

const TOOLS = [
  { icon: LayoutGrid, label: "Grafana" },
  { icon: BarChart3, label: "Datadog" },
  { icon: Terminal, label: "Raw logs" },
  { icon: Cloud, label: "Cloud console" },
  { icon: Bot, label: "OpenAI dashboard" },
];

export function Problem() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>The problem</SectionLabel>
        <h2 className="mx-auto max-w-2xl text-[32px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
          Your AI app goes live. Something breaks. Customers notice first.
        </h2>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.05}>
          <Card className="h-full p-8">
            <div className="mb-6 text-[13px] font-medium uppercase tracking-wide text-bad">Without AgentLens</div>
            <p className="mb-6 text-[14px] leading-relaxed text-muted">
              A support ticket comes in. You open five different tools, one at a time, hoping one of them has the answer.
            </p>
            <div className="flex flex-col gap-2.5">
              {TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.label}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3"
                >
                  <tool.icon size={15} className="text-subtle" />
                  <span className="flex-1 text-[13px] text-muted">{tool.label}</span>
                  <X size={14} className="text-bad/70" />
                </motion.div>
              ))}
            </div>
            <div className="mt-5 text-[12px] text-subtle">45 minutes later — still no root cause.</div>
          </Card>
        </Reveal>

        <Reveal delay={0.15}>
          <Card strong className="flex h-full flex-col justify-between p-8">
            <div>
              <div className="mb-6 text-[13px] font-medium uppercase tracking-wide text-good">With AgentLens</div>
              <p className="mb-6 text-[14px] leading-relaxed text-ink">
                AgentLens already knew — before the ticket was even filed.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="rounded-xl bg-good/[0.06] p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-good">
                  <Check size={13} /> Incident detected — 4 min ago
                </div>
                <div className="text-[13px] leading-relaxed text-ink">
                  OpenAI success rate dropped to 61%. Root cause: rate limiting. Recommendation: route to Claude.
                </div>
              </motion.div>
            </div>
            <div className="mt-5 text-[12px] text-good">Total time to answer: under 60 seconds.</div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
