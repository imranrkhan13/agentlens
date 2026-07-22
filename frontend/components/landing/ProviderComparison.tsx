"use client";

import { motion } from "framer-motion";
import { Reveal } from "./Reveal";
import { Card, SectionLabel } from "@/components/landing/ui/card";

const SERVICES = [
  { name: "OpenAI", latency: 62, cost: 80, reliability: 68, note: "Degraded today" },
  { name: "Claude", latency: 74, cost: 55, reliability: 99, note: "Recommended" },
  { name: "Groq", latency: 96, cost: 15, reliability: 100, note: "Fastest & cheapest" },
  { name: "Gemini", latency: 70, cost: 40, reliability: 92, note: "Stable" },
];

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="mb-1 flex justify-between text-[11px] text-subtle">
        <span>{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-cyan"
        />
      </div>
    </div>
  );
}

export function ProviderComparison() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-32">
      <Reveal className="mb-16 text-center">
        <SectionLabel>Independent view</SectionLabel>
        <h2 className="mx-auto max-w-xl text-[32px] font-semibold tracking-tight text-ink sm:text-[42px]">
          Every AI service says it&apos;s fine. We show what your app experienced.
        </h2>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="h-full p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[14.5px] font-semibold text-ink">{p.name}</span>
                <span
                  className={`text-[11px] font-medium ${
                    p.note === "Recommended" || p.note === "Fastest & cheapest" ? "text-good" : p.note === "Degraded today" ? "text-bad" : "text-muted"
                  }`}
                >
                  {p.note}
                </span>
              </div>
              <Bar label="Response time" value={p.latency} />
              <Bar label="Cost efficiency" value={p.cost} />
              <Bar label="Reliability" value={p.reliability} />
            </Card>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-center text-[12px] text-subtle">Illustrative comparison — your dashboard shows real numbers from your own traffic.</p>
    </section>
  );
}
